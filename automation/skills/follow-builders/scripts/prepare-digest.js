#!/usr/bin/env node

// ============================================================================
// Follow Builders — Prepare Digest
// ============================================================================
// Gathers everything the LLM needs to produce a digest:
// - Fetches the central feeds (tweets + podcasts)
// - Fetches the latest prompts from GitHub
// - Reads the user's config (language, delivery method)
// - Outputs a single JSON blob to stdout
//
// The LLM's ONLY job is to read this JSON, remix the content, and output
// the digest text. Everything else is handled here deterministically.
//
// Usage: node prepare-digest.js
// Output: JSON to stdout
// ============================================================================

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';
import { fetchRemote } from './digest-fetch.js';
import { collectMedia } from './digest-media.js';

// -- Constants ---------------------------------------------------------------

const USER_DIR = join(homedir(), '.follow-builders');
const CONFIG_PATH = join(USER_DIR, 'config.json');
const CACHE_DIR = join(USER_DIR, 'cache');

const FEED_X_URL = 'https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-x.json';
const FEED_PODCASTS_URL = 'https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-podcasts.json';
const FEED_BLOGS_URL = 'https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-blogs.json';

const PROMPTS_BASE = 'https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/prompts';
const PROMPT_FILES = [
  'summarize-podcast.md',
  'summarize-tweets.md',
  'summarize-blogs.md',
  'digest-intro.md',
  'translate.md'
];

// -- Fetch helpers -----------------------------------------------------------

async function readJSONIfExists(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(await readFile(path, 'utf-8'));
  } catch {
    return null;
  }
}

async function readTextIfExists(path) {
  if (!existsSync(path)) return null;
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

async function writeCacheFile(path, content) {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(path, content, 'utf-8');
  } catch {
    // ignore cache write errors
  }
}

// -- Main --------------------------------------------------------------------

async function main() {
  const errors = [];

  // 1. Read user config
  let config = {
    language: 'en',
    frequency: 'daily',
    delivery: { method: 'stdout' }
  };
  if (existsSync(CONFIG_PATH)) {
    try {
      config = JSON.parse(await readFile(CONFIG_PATH, 'utf-8'));
    } catch (err) {
      errors.push(`Could not read config: ${err.message}`);
    }
  }

  const transport = { proxy: config.network?.proxy ?? 'http://127.0.0.1:15236', errors };

  const scriptDir = decodeURIComponent(new URL('.', import.meta.url).pathname);
  const skillRoot = join(scriptDir, '..');
  const localPromptsDir = join(skillRoot, 'prompts');
  const localFeedXPath = join(skillRoot, 'feed-x.json');
  const localFeedPodcastsPath = join(skillRoot, 'feed-podcasts.json');
  const localFeedBlogsPath = join(skillRoot, 'feed-blogs.json');
  const userPromptsDir = join(USER_DIR, 'prompts');
  const cachedFeedXPath = join(CACHE_DIR, 'feed-x.json');
  const cachedFeedPodcastsPath = join(CACHE_DIR, 'feed-podcasts.json');
  const cachedFeedBlogsPath = join(CACHE_DIR, 'feed-blogs.json');

  // 2. Fetch all three feeds with fallback: remote > cache > local bundled
  async function loadFeed(fetchUrl, cachePath, localPath, name) {
    const remote = await fetchRemote(fetchUrl, { ...transport, json: true });
    if (remote) {
      await writeCacheFile(cachePath, JSON.stringify(remote, null, 2));
      return remote;
    }
    const cached = await readJSONIfExists(cachePath);
    if (cached) {
      errors.push(`${name} feed remote fetch failed, used cached feed`);
      return cached;
    }
    const local = await readJSONIfExists(localPath);
    if (local) {
      errors.push(`${name} feed remote fetch failed, used bundled local feed`);
      return local;
    }
    errors.push(`Could not load ${name} feed from remote, cache, or local bundle`);
    return null;
  }

  const [feedX, feedPodcasts, feedBlogs] = await Promise.all([
    loadFeed(FEED_X_URL, cachedFeedXPath, localFeedXPath, 'Tweet'),
    loadFeed(FEED_PODCASTS_URL, cachedFeedPodcastsPath, localFeedPodcastsPath, 'Podcast'),
    loadFeed(FEED_BLOGS_URL, cachedFeedBlogsPath, localFeedBlogsPath, 'Blog'),
  ]);

  // Preserve upstream collection errors even when transport succeeds.
  for (const [name, feed] of [['Tweet', feedX], ['Podcast', feedPodcasts], ['Blog', feedBlogs]]) {
    if (Array.isArray(feed?.errors)) {
      errors.push(...feed.errors.map(error => `${name} feed problem: ${error}`));
    }
  }

  // 3. Load prompts with priority: user custom > remote (GitHub) > local default
  //
  // If the user has a custom prompt at ~/.follow-builders/prompts/<file>,
  // use that (they personalized it — don't overwrite with remote updates).
  // Otherwise, fetch the latest from GitHub so they get central improvements.
  // If GitHub is unreachable, fall back to the local copy shipped with the skill.
  const prompts = {};

  for (const filename of PROMPT_FILES) {
    const key = filename.replace('.md', '').replace(/-/g, '_');
    const userPath = join(userPromptsDir, filename);
    const localPath = join(localPromptsDir, filename);

    const cachedPromptPath = join(CACHE_DIR, filename);

    // Priority 1: user's custom prompt (they personalized it)
    if (existsSync(userPath)) {
      prompts[key] = await readFile(userPath, 'utf-8');
      continue;
    }

    // Priority 2: latest from GitHub (central updates)
    const remote = await fetchRemote(`${PROMPTS_BASE}/${filename}`, transport);
    if (remote) {
      prompts[key] = remote;
      await writeCacheFile(cachedPromptPath, remote);
      continue;
    }

    // Priority 3: cached prompt from previous successful fetch
    const cached = await readTextIfExists(cachedPromptPath);
    if (cached) {
      prompts[key] = cached;
      errors.push(`Prompt remote fetch failed, used cached prompt: ${filename}`);
      continue;
    }

    // Priority 4: local copy shipped with the skill
    if (existsSync(localPath)) {
      prompts[key] = await readFile(localPath, 'utf-8');
      errors.push(`Prompt remote fetch failed, used bundled local prompt: ${filename}`);
    } else {
      errors.push(`Could not load prompt: ${filename}`);
    }
  }

  // 4. Build the output — everything the LLM needs in one blob
  const output = {
    status: 'ok',
    generatedAt: new Date().toISOString(),

    // User preferences
    config: {
      language: config.language || 'en',
      frequency: config.frequency || 'daily',
      delivery: config.delivery || { method: 'stdout' }
    },

    // Content to remix
    podcasts: feedPodcasts?.podcasts || [],
    x: feedX?.x || [],
    blogs: feedBlogs?.blogs || [],

    // Stats for the LLM to reference
    stats: {
      podcastEpisodes: feedPodcasts?.podcasts?.length || 0,
      xBuilders: feedX?.x?.length || 0,
      totalTweets: (feedX?.x || []).reduce((sum, a) => sum + a.tweets.length, 0),
      blogPosts: feedBlogs?.blogs?.length || 0,
      feedGeneratedAt: feedX?.generatedAt || feedPodcasts?.generatedAt || feedBlogs?.generatedAt || null
    },

    // Prompts — the LLM reads these and follows the instructions
    prompts,

    // Non-fatal errors
    errors: errors.length > 0 ? errors : undefined
  };

  output.media = await collectMedia(output, {
    root: resolve(process.env.DIGEST_REPO_DIR || join(scriptDir, '../../../..')),
    proxy: transport.proxy,
  });
  console.log(JSON.stringify(output, null, 2));
}

main().catch(err => {
  console.error(JSON.stringify({
    status: 'error',
    message: err.message
  }));
  process.exit(1);
});
