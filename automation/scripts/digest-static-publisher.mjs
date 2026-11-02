#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, realpathSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TZ = "Asia/Shanghai";
const home = homedir();
const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillDir = resolve(scriptDir, "../skills/follow-builders");
const prepareScript = join(skillDir, "scripts/prepare-digest.js");
const repoDir = resolve(process.env.DIGEST_REPO_DIR || join(scriptDir, "../.."));
const historyPath = join(repoDir, "digest-history.json");
const indexPath = join(repoDir, "index.html");
const publicUrl = "https://genrry-ayu.github.io/digest-builders/";

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const shouldPush = !args.has("--no-push");
const shouldCommit = !args.has("--no-commit");
const renderOnly = args.has("--render-only");
const curatedFileArg = rawArgs.find((arg) => arg.startsWith("--curated-file="));
const curatedFile = curatedFileArg ? curatedFileArg.slice("--curated-file=".length) : null;

function formatDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function formatChineseDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${year}年${month}月${day}日`;
}

function isWithinRecentDays(candidate, current, days = 7) {
  const candidateTime = Date.parse(`${candidate}T00:00:00+08:00`);
  const currentTime = Date.parse(`${current}T00:00:00+08:00`);
  if (!Number.isFinite(candidateTime) || !Number.isFinite(currentTime)) return false;
  const age = currentTime - candidateTime;
  return age >= 0 && age < days * 24 * 60 * 60 * 1000;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function decodeBasicEntities(value) {
  return String(value ?? "")
    .replaceAll("&apos;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function compactText(value, max = 260) {
  const text = decodeBasicEntities(value)
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function scoreTweet(tweet) {
  return (tweet.likes || 0) + (tweet.retweets || 0) * 4 + (tweet.replies || 0) * 2;
}

function excerptTranscript(transcript) {
  const lines = decodeBasicEntities(transcript)
    .split(/\n+/)
    .map((line) => line.replace(/^Speaker \d+\s*\|\s*\d+:\d+\s*-\s*\d+:\d+\s*/, "").trim())
    .filter((line) => line.length >= 80);
  return lines.slice(0, 3).map((line) => compactText(line, 360));
}

function articleSourceText(source, kind) {
  const fields = kind === "podcasts" ? ["transcript"] : ["content", "text", "markdown", "body"];
  return fields.map(key => source?.[key]).find(value => typeof value === "string" && value.trim())?.trim() || "";
}

function buildArticles(data, curated) {
  return Object.fromEntries(["blogs", "podcasts"].map(kind => {
    const articles = curated?.articles?.[kind] || [];
    for (const article of articles) {
      const source = (data[kind] || []).find(item => item.title === article.sourceTitle &&
        (article.sourceId ? (item.guid || item.id) === article.sourceId : item.url === article.sourceUrl));
      const text = articleSourceText(source, kind);
      if (!text || createHash("sha256").update(text).digest("hex") !== article.sourceTextSha256) {
        throw new Error(`Article source missing or changed: ${article.title}; curate again from the collected source`);
      }
    }
    return [kind, articles];
  }));
}

function buildEntry(data, dateString, curated = null) {
  const xBuilders = Array.isArray(data.x) ? data.x : [];
  const podcasts = Array.isArray(data.podcasts) ? data.podcasts : [];
  const blogs = Array.isArray(data.blogs) ? data.blogs : [];
  const tweets = xBuilders.flatMap((builder) =>
    (builder.tweets || []).map((tweet) => ({
      ...tweet,
      builder: builder.name,
      handle: builder.handle,
      bio: builder.bio,
      score: scoreTweet(tweet),
    })),
  );
  const topTweets = [...tweets].sort((a, b) => b.score - a.score).slice(0, 6);
  const activeBuilders = [...xBuilders]
    .map((builder) => ({
      name: builder.name,
      handle: builder.handle,
      bio: compactText(builder.bio, 160),
      count: builder.tweets?.length || 0,
      score: (builder.tweets || []).reduce((sum, tweet) => sum + scoreTweet(tweet), 0),
    }))
    .filter((builder) => builder.count > 0)
    .sort((a, b) => b.count - a.count || b.score - a.score)
    .slice(0, 8);

  const highlights = [];
  if (podcasts[0]) {
    highlights.push({
      tag: "播客",
      title: podcasts[0].title,
      body: "本期长内容提供了更完整的上下文，适合作为今天 digest 的主线材料。以下摘录来自原始 transcript，未经过模型扩写。",
      link: podcasts[0].url,
      evidence: excerptTranscript(podcasts[0].transcript),
    });
  }
  if (blogs.length > 0) {
    highlights.push({
      tag: "官方博客",
      title: `${blogs.length} 篇官方更新值得回看`,
      body: "博客条目通常比社交动态更接近产品或工程事实，可作为今天信息流里的高置信来源。",
      evidence: blogs.slice(0, 3).map((blog) => compactText(blog.title || blog.url, 220)),
    });
  }
  if (topTweets.length > 0) {
    highlights.push({
      tag: "Builder 信号",
      title: `${activeBuilders.length} 位 builder 贡献了 ${tweets.length} 条动态`,
      body: "这里按互动和发帖密度挑出最值得先读的原文，保留原始链接，避免二次阐释造成事实漂移。",
      evidence: topTweets.slice(0, 4).map((tweet) => `${tweet.builder}: ${compactText(tweet.text, 220)}`),
    });
  }

  const matters = [
    ...blogs.slice(0, 4).map((blog) => ({
      kind: "Blog",
      title: blog.title || "Untitled blog update",
      detail: compactText(blog.summary || blog.description || blog.url, 220),
      url: blog.url,
    })),
    ...podcasts.slice(0, 2).map((podcast) => ({
      kind: "Podcast",
      title: podcast.title,
      detail: compactText(podcast.transcript, 220),
      url: podcast.url,
    })),
    ...topTweets.slice(0, 6).map((tweet) => ({
      kind: "X",
      title: `${tweet.builder} / @${tweet.handle}`,
      detail: compactText(tweet.text, 220),
      url: tweet.url,
    })),
  ].slice(0, 8);

  return {
    date: dateString,
    dateLabel: formatChineseDate(dateString),
    generatedAt: `${dateString}T00:00:00+08:00`,
    sourceGeneratedAt: data.stats?.feedGeneratedAt || null,
    stats: {
      podcastEpisodes: podcasts.length,
      xBuilders: xBuilders.length,
      totalTweets: tweets.length,
      blogPosts: blogs.length,
    },
    highlights: curated?.highlights || highlights,
    matters: curated?.matters || matters,
    articles: buildArticles(data, curated),
    sources: {
      podcasts: podcasts.map((podcast) => ({
        title: podcast.title,
        name: podcast.name,
        publishedAt: podcast.publishedAt,
        url: podcast.url,
        excerpts: excerptTranscript(podcast.transcript),
      })),
      blogs: blogs.map((blog) => ({
        title: blog.title,
        source: blog.source || blog.name,
        publishedAt: blog.publishedAt,
        url: blog.url,
        summary: compactText(blog.summary || blog.description || "", 360),
      })),
      x: xBuilders.map((builder) => ({
        name: builder.name,
        handle: builder.handle,
        bio: compactText(builder.bio, 180),
        tweets: (builder.tweets || []).map((tweet) => ({
          text: compactText(tweet.text, 700),
          createdAt: tweet.createdAt,
          url: tweet.url,
          likes: tweet.likes || 0,
          retweets: tweet.retweets || 0,
          replies: tweet.replies || 0,
        })),
      })),
    },
    errors: data.errors || [],
    partial: Boolean(data.partial),
  };
}

function validateCurated(curated) {
  if (!curated || typeof curated !== "object") {
    throw new Error("Curated digest must be a JSON object");
  }
  if (!Array.isArray(curated.highlights) || curated.highlights.length < 3 || curated.highlights.length > 5) {
    throw new Error("Curated digest must contain 3-5 highlights");
  }
  if (!Array.isArray(curated.matters) || curated.matters.length < 4 || curated.matters.length > 6) {
    throw new Error("Curated digest must contain 4-6 matters");
  }
  for (const [index, item] of curated.highlights.entries()) {
    if (!item?.tag || !item?.title || !item?.body || !Array.isArray(item.evidence) || item.evidence.length === 0) {
      throw new Error(`Highlight ${index + 1} requires tag, title, body, and evidence`);
    }
    if (item.evidence.some(e => !e?.quote || !e?.attribution || !e?.url)) {
      throw new Error(`Highlight ${index + 1} evidence requires quote, attribution and url`);
    }
  }
  for (const [index, item] of curated.matters.entries()) {
    if (!item?.kind || !item?.title || !item?.detail || !item?.url) {
      throw new Error(`Matter ${index + 1} requires kind, title, detail and url`);
    }
  }
  if (curated.articles !== undefined) {
    if (!curated.articles || typeof curated.articles !== "object" || Array.isArray(curated.articles)) {
      throw new Error("Articles must contain blogs and podcasts arrays");
    }
    for (const kind of ["blogs", "podcasts"]) {
      const articles = curated.articles[kind] ?? [];
      if (!Array.isArray(articles)) throw new Error(`articles.${kind} must be an array`);
      for (const article of articles) {
        if (!article?.title || !article.sourceTitle || !article.sourceUrl || !/^[a-f0-9]{64}$/.test(article.sourceTextSha256 || "") ||
            !Array.isArray(article.blocks) || !article.blocks.some(b => b?.type === "paragraph" && typeof b.text === "string" && b.text.trim())) {
          throw new Error(`Invalid ${kind} article: title, source identity/hash and paragraphs required`);
        }
        for (const block of article.blocks) {
          if (!["heading", "paragraph", "image"].includes(block?.type) ||
              (block.type === "image" ? !block.src || !block.alt : typeof block.text !== "string" || !block.text.trim())) {
            throw new Error(`Invalid article block: ${article.title}`);
          }
        }
      }
    }
  }
  return curated;
}

async function readHistory() {
  if (!existsSync(historyPath)) return { version: 1, entries: [] };
  try {
    const parsed = JSON.parse(await readFile(historyPath, "utf8"));
    if (Array.isArray(parsed.entries)) return parsed;
  } catch {
    // Replace malformed history with a fresh file.
  }
  return { version: 1, entries: [] };
}

function buildHtml(entries) {
  const dataJson = JSON.stringify(entries).replaceAll("</script", "<\\/script");
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f7f6f3">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <title>Digest</title>
  <style>
    :root {
      color-scheme: light;
      --canvas: #f7f6f3;
      --paper: #fcfbf9;
      --ink: #242320;
      --muted: #716e68;
      --line: #dedbd5;
      --moss: #686158;
      --mineral: #686158;
      --oxblood: #91473f;
      --secondary: #514e48;
    }
    * { box-sizing: border-box; }
    html { background: var(--canvas); }
    body { margin: 0; background: var(--canvas); color: var(--ink); font: 16px/1.72 -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans CJK SC", sans-serif; }
    a { color: var(--mineral); text-decoration-color: #b8b2a8; text-underline-offset: 3px; }
    .shell { width: min(980px, calc(100% - 48px)); margin: 0 auto; padding: 48px 0 80px; }
    header { padding: 24px 0 32px; }
    .masthead { max-width: 780px; }
    h1 { margin: 0; font: 500 56px/1.08 "Iowan Old Style", Baskerville, "Songti SC", serif; letter-spacing: 0; }
    .dates-wrap { display: flex; align-items: center; margin-top: 12px; }
    .dates { display: flex; gap: 24px; overflow-x: auto; scrollbar-width: none; }
    .dates::-webkit-scrollbar { display: none; }
    .date-btn { position: relative; min-height: 40px; border: 0; background: transparent; color: var(--muted); padding: 0 0 2px; white-space: nowrap; cursor: pointer; font: 500 14px/1 ui-monospace, SFMono-Regular, Menlo, monospace; }
    .date-btn::after { content: ""; position: absolute; right: 0; bottom: 0; left: 0; height: 3px; background: transparent; }
    .date-btn:hover { color: var(--ink); }
    .date-btn[aria-current="date"] { color: var(--ink); }
    .date-btn[aria-current="date"]::after { background: var(--oxblood); }
    .date-btn:focus-visible, .article-toggle:focus-visible, summary:focus-visible, a:focus-visible { outline: 3px solid rgba(104, 97, 88, .28); outline-offset: 4px; }
    .stats { margin-top: 12px; color: var(--muted); font-size: 14px; line-height: 1.6; }
    section { padding: 48px 0 0; margin-bottom: 64px; border-top: .5px solid var(--line); }
    h2 { margin: 0 0 24px; font: 500 32px/1.25 "Iowan Old Style", Baskerville, "Songti SC", serif; letter-spacing: 0; }
    .section-note { display: block; margin-top: 8px; color: var(--muted); font: 400 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; }
    .grid { display: grid; gap: 16px; }
    .card { position: relative; border: .5px solid var(--line); border-radius: 12px; background: var(--paper); padding: 24px; transition: border-color 160ms cubic-bezier(.22,1,.36,1); }
    .card:hover { border-color: #c2bcb2; }
    .tag { color: var(--muted); font: 500 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; }
    h3 { margin: 8px 0 12px; font-size: 16px; font-weight: 600; line-height: 1.5; letter-spacing: 0; }
    p { margin: 0; }
    details { margin-top: 24px; padding-top: 16px; border-top: .5px dashed var(--line); color: var(--muted); }
    summary { cursor: pointer; user-select: none; color: var(--mineral); font-size: 12px; line-height: 1.4; font-weight: 500; }
    blockquote { margin: 16px 0 0; padding: 16px; border-left: .5px solid #c9c3b9; background: #f2f0eb; color: #514e48; }
    .sources { display: grid; gap: 24px; }
    .archive-link { margin: -8px 0 24px; font-weight: 500; }
    .source-group { border-top: .5px solid var(--line); padding-top: 24px; }
    .source-group:first-child { border-top: 0; padding-top: 0; }
    .tweet { margin-top: 12px; color: #514e48; }
    .small { color: var(--muted); font-size: 14px; }
    .empty { color: var(--muted); padding: 28px 0; }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; }
    }
    @media (max-width: 640px) {
      .shell { width: min(100% - 32px, 980px); padding-top: 24px; }
      h1 { font-size: 40px; }
      .dates-wrap { align-items: flex-start; }
      .dates { gap: 20px; }
      section { padding: 32px 0 0; margin-bottom: 48px; }
      h2 { font-size: 28px; }
      .card { padding: 20px; }
      summary { font-size: 12px; }
    }
    /* UI v1.2.2 — compact header and conditional reading folds; unslop by Damir Sokolovsky, https://heydamir.design/unslop, CC BY 4.0 */
    .date-btn, .stats { font-variant-numeric: tabular-nums; }
    section + section { border-top: 0; }
    .evidence { margin-top: 16px; }
    .card p { color: var(--secondary); font-size: 14px; line-height: 1.75; }
    .card h3 { margin: 0 0 4px; font-size: 14px; }
    .card blockquote { font-size: 14px; }
    .article-image { width: min(100%, 640px); margin: 20px 0 0; }
    .article-image a { display: block; border-radius: 8px; }
    .article-image img { display: block; width: 100%; height: auto; border-radius: 8px; }
    .reading-list { display: grid; gap: 48px; }
    .longform { max-width: 760px; overflow-wrap: anywhere; }
    .longform h3 { margin: 0 0 12px; }
    .article-meta { margin: 0 0 24px; color: var(--muted); font-size: 12px; line-height: 1.6; }
    .article-copy { color: var(--secondary); font-size: 14px; line-height: 1.9; }
    .article-copy p { margin: 0 0 16px; }
    .article-copy h4 { margin: 32px 0 12px; color: var(--ink); font-size: 14px; font-weight: 600; line-height: 1.6; }
    .article-copy .article-image { width: 100%; margin: 24px 0; }
    .article-rest[hidden] { display: none; }
    .article-toggle { display: block; margin: 12px 0 0; padding: 4px 0; border: 0; background: transparent; color: var(--muted); font: inherit; font-size: 14px; text-decoration: underline; text-underline-offset: 4px; cursor: pointer; overflow-anchor: none; }
    .article-toggle:hover { color: var(--ink); }
    .card, .source-group, blockquote { overflow-wrap: anywhere; }
    a, summary, .date-btn { transition: color 160ms cubic-bezier(.22,1,.36,1); }
    summary:hover, a:hover { color: var(--ink); }
    @media (max-width: 640px) { h3 { font-size: 16px; } }
  </style>
</head>
<body>
  <main class="shell">
    <header>
      <div class="masthead">
        <h1>Digest</h1>
      </div>
      <div class="dates-wrap">
        <nav id="dates" class="dates" aria-label="选择日期"></nav>
      </div>
      <div id="stats" class="stats"></div>
    </header>
    <div id="content"></div>
  </main>
  <script>
    const DIGESTS = ${dataJson};
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: '${TZ}', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    let selectedDate = new URLSearchParams(location.search).get('date') || (DIGESTS.some(d => d.date === today) ? today : DIGESTS[0]?.date);
    const esc = (v) => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#39;");
    function link(url, text) { return url ? '<a href="' + esc(url) + '" target="_blank" rel="noreferrer">' + esc(text || url) + '</a>' : esc(text || ''); }
    function renderDates() {
      document.getElementById('dates').innerHTML = DIGESTS.map(d => '<button class="date-btn" aria-current="' + (d.date === selectedDate ? 'date' : 'false') + '" data-date="' + esc(d.date) + '">' + esc(d.date) + '</button>').join('');
      document.querySelectorAll('.date-btn').forEach(btn => btn.addEventListener('click', () => {
        selectedDate = btn.dataset.date;
        history.replaceState(null, '', '?date=' + selectedDate);
        render();
      }));
    }
    function renderStats(d) {
      const stats = d.stats || {};
      document.getElementById('stats').innerHTML = [
        ['播客', stats.podcastEpisodes || 0],
        ['Builder', stats.xBuilders || 0],
        ['推文', stats.totalTweets || 0],
        ['博客', stats.blogPosts || 0],
      ].map(([label, value]) => esc(value) + ' ' + label).join(' · ');
    }
    function renderEvidence(evidence) {
      if (typeof evidence === 'string') return '<blockquote>' + esc(evidence) + '</blockquote>';
      const attribution = evidence.attribution ? '<div class="small">— ' + esc(evidence.attribution) + (evidence.url ? ' · ' + link(evidence.url, '查看原文') : '') + '</div>' : '';
      return '<blockquote>' + esc(evidence.translation || evidence.quote || '') + attribution + '</blockquote>';
    }
    function renderImages(item) {
      return (Array.isArray(item.images) ? item.images : []).map(image => {
        if (!image || !image.src || !image.alt) return '';
        try {
          if (!['http:', 'https:'].includes(new URL(image.src, location.href).protocol)) return '';
        } catch { return ''; }
        const dimensions = Number.isInteger(image.width) && image.width > 0 && Number.isInteger(image.height) && image.height > 0
          ? ' width="' + image.width + '" height="' + image.height + '"' : '';
        return '<figure class="article-image"><a href="' + esc(image.src) + '" target="_blank" rel="noreferrer" aria-label="' + esc('查看大图：' + image.alt) + '"><img src="' + esc(image.src) + '" alt="' + esc(image.alt) + '"' + dimensions + ' loading="lazy" decoding="async"></a></figure>';
      }).join('');
    }
    function renderHighlights(d) {
      const cards = (d.highlights || []).map(item => '<article class="card"><h3>' + esc(item.title) + '</h3><p>' + esc(item.body) + '</p>' + renderImages(item) + ((item.evidence || []).length ? '<div class="evidence">' + item.evidence.map(renderEvidence).join('') + '</div>' : '') + '</article>').join('');
      return '<section><h2>洞察</h2><div class="grid">' + (cards || '<p class="empty">今天没有足够内容生成洞察。</p>') + '</div></section>';
    }
    function renderMatters(d) {
      const cards = (d.matters || []).map(item => '<article class="card"><h3>' + esc(item.title) + '</h3><p>' + esc(String(item.detail || '').split('来源：')[0].trim()) + '</p>' + renderImages(item) + '</article>').join('');
      return '<section><h2>议题</h2><div class="grid">' + (cards || '<p class="empty">今天没有额外议题。</p>') + '</div></section>';
    }
    function renderArticles(d, kind, label) {
      const articles = (d.articles?.[kind] || []).filter(article => article.title &&
        Array.isArray(article.blocks) && article.blocks.some(block => block.type === 'paragraph' && block.text?.trim()));
      if (!articles.length) return '';
      const content = articles.map(article => {
        const metadata = [article.sourceName, article.author].filter(Boolean).map(esc).join(' · ');
        const original = article.sourceUrl ? link(article.sourceUrl, '原文') : '';
        const body = article.blocks.map(block => {
          if (block.type === 'paragraph') return '<p>' + esc(block.text) + '</p>';
          if (block.type === 'heading') return '<h4>' + esc(block.text) + '</h4>';
          if (block.type === 'image') return renderImages({images: [block]});
          return '';
        }).join('');
        return '<article class="longform"><h3>' + esc(article.title) + '</h3><p class="article-meta">' +
          metadata + (metadata && original ? ' · ' : '') + original + '</p><div class="article-copy">' + body + '</div></article>';
      }).join('');
      return '<section class="reading-section" data-kind="' + kind + '"><h2>' + label + '</h2><div class="reading-list">' + content + '</div></section>';
    }
    function setupArticleFolds() {
      document.querySelectorAll('.reading-section').forEach(section => {
        // The final module stays fully open, regardless of article length.
        if (!section.nextElementSibling) return;
        section.querySelectorAll('.longform').forEach((article, index) => {
          const copy = article.querySelector('.article-copy');
          if (copy.scrollHeight <= 600) return;
          const blocks = Array.from(copy.children);
          const start = copy.getBoundingClientRect().top;
          let split = blocks.findIndex((block, i) => i > 0 && block.getBoundingClientRect().bottom - start > 420);
          if (split < 1) return;
          // Do not leave a section heading alone at the end of the preview.
          if (blocks[split - 1].tagName === 'H4') split--;
          if (split < 1) return;
          const rest = document.createElement('div');
          rest.className = 'article-rest';
          rest.id = 'article-rest-' + section.dataset.kind + '-' + index;
          blocks.slice(split).forEach(block => rest.appendChild(block));
          rest.hidden = true;
          copy.appendChild(rest);
          const toggle = document.createElement('button');
          toggle.type = 'button';
          toggle.className = 'article-toggle';
          toggle.textContent = '展开全文';
          toggle.setAttribute('aria-expanded', 'false');
          toggle.setAttribute('aria-controls', rest.id);
          toggle.addEventListener('click', () => {
            const expand = rest.hidden;
            rest.hidden = !expand;
            toggle.textContent = expand ? '收起全文' : '展开全文';
            toggle.setAttribute('aria-expanded', String(expand));
            if (!expand) toggle.scrollIntoView({ block: 'nearest' });
          });
          article.appendChild(toggle);
        });
      });
    }
    function renderSources(d) {
      const archive = d.archiveUrl ? '<p class="archive-link">' + link(d.archiveUrl, '查看当日完整存档 ↗') + '</p>' : '';
      const xGroups = ((d.sources || {}).x || []).map(builder => '<div class="source-group"><h3>' + esc(builder.name) + ' <span class="small">@' + esc(builder.handle) + '</span></h3><p class="small">' + esc(builder.bio) + '</p>' + (builder.tweets || []).map(tweet => '<p class="tweet">' + esc(tweet.text) + '<br>' + link(tweet.url, '原文') + ' <span class="small">likes ' + esc(tweet.likes) + ' · reposts ' + esc(tweet.retweets) + '</span></p>').join('') + '</div>').join('');
      const podcastGroups = ((d.sources || {}).podcasts || []).map(podcast => '<div class="source-group"><h3>' + link(podcast.url, podcast.title) + '</h3>' + (podcast.excerpts || []).map(e => '<blockquote>' + esc(e) + '</blockquote>').join('') + '</div>').join('');
      const blogGroups = ((d.sources || {}).blogs || []).map(blog => '<div class="source-group"><h3>' + link(blog.url, blog.title) + '</h3><p class="small">' + esc(blog.source || '') + '</p><p>' + esc(blog.summary || '') + '</p></div>').join('');
      return '<section><h2>原文<span class="section-note">Sources / 来源索引</span></h2>' + archive + '<div class="sources">' + podcastGroups + blogGroups + xGroups + '</div></section>';
    }
    function render() {
      const d = DIGESTS.find(item => item.date === selectedDate) || DIGESTS[0];
      if (!d) {
        document.getElementById('content').innerHTML = '<p class="empty">还没有 digest 数据。</p>';
        return;
      }
      selectedDate = d.date;
      renderDates();
      renderStats(d);
      document.getElementById('content').innerHTML = renderHighlights(d) + renderMatters(d) + renderArticles(d, 'blogs', '博客') + renderArticles(d, 'podcasts', '播客');
      setupArticleFolds();
    }
    render();
  </script>
</body>
</html>
`;
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd,
    env: options.env || process.env,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 80,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${commandArgs.join(" ")} failed\n${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

async function main() {
  if (process.env.DIGEST_DATE) throw new Error("DIGEST_DATE overrides are not allowed; dates use Asia/Shanghai");
  const dateString = formatDate();
  if (!renderOnly && !curatedFile) throw new Error("Daily publishing requires --curated-file");
  await mkdir(dirname(historyPath), { recursive: true });

  if (renderOnly) {
    const history = await readHistory();
    const entries = [...history.entries]
      .filter((item) => isWithinRecentDays(item.date, dateString))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);
    await writeFile(indexPath, buildHtml(entries), "utf8");
    let didPush = false;
    if (shouldCommit) {
      run("git", ["add", "index.html", "digest-history.json", "favicon.svg", ...(existsSync(join(repoDir, "assets/digest")) ? ["assets/digest"] : [])], { cwd: repoDir });
      const diff = spawnSync("git", ["diff", "--cached", "--quiet"], { cwd: repoDir });
      if (diff.status !== 0) {
        run("git", ["commit", "-m", `digest archive and design ${dateString}`], { cwd: repoDir });
        if (shouldPush) {
          run("git", ["push"], { cwd: repoDir });
          didPush = true;
        }
      }
    }
    console.log(JSON.stringify({ ok: true, date: dateString, url: publicUrl, entries: entries.map((item) => item.date), pushed: didPush }, null, 2));
    return;
  }

  const prepareOutput = run(process.execPath, [prepareScript], {
    cwd: dirname(prepareScript),
    env: { ...process.env },
  });
  const data = JSON.parse(prepareOutput);
  const runsDir = join(process.env.DIGEST_BUSINESS_ROOT || join(home, "business-automations"), "runs");
  await mkdir(runsDir, { recursive: true });
  const sourceFile = join(runsDir, `digest-${dateString}-publisher-source-${Date.now()}.json`);
  await writeFile(sourceFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  if ((data.stats?.podcastEpisodes || 0) + (data.stats?.xBuilders || 0) + (data.stats?.blogPosts || 0) === 0) {
    throw new Error("No digest content available from follow-builders");
  }

  const curated = curatedFile
    ? validateCurated(JSON.parse(await readFile(curatedFile, "utf8")))
    : null;
  const history = await readHistory();
  const entry = buildEntry(data, dateString, curated);
  const entries = [entry, ...history.entries.filter((item) => item.date !== dateString)]
    .filter((item) => isWithinRecentDays(item.date, dateString))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);
  const nextHistory = {
    version: 1,
    updatedAt: `${dateString}T00:00:00+08:00`,
    canonicalUrl: publicUrl,
    entries,
  };

  await writeFile(historyPath, `${JSON.stringify(nextHistory, null, 2)}\n`, "utf8");
  await writeFile(indexPath, buildHtml(entries), "utf8");

  let didPush = false;
  if (shouldCommit) {
    run("git", ["add", "index.html", "digest-history.json", "favicon.svg", ...(existsSync(join(repoDir, "assets/digest")) ? ["assets/digest"] : [])], { cwd: repoDir });
    const diff = spawnSync("git", ["diff", "--cached", "--quiet"], { cwd: repoDir });
    if (diff.status === 0) {
      console.log(`No publish changes for ${dateString}.`);
    } else {
      run("git", ["commit", "-m", `digest index ${dateString}`], { cwd: repoDir });
      if (shouldPush) {
        run("git", ["push"], { cwd: repoDir });
        didPush = true;
      }
    }
  }

  console.log(JSON.stringify({
    ok: true,
    date: dateString,
    url: publicUrl,
    entries: entries.map((item) => item.date),
    stats: entry.stats,
    sourceFile,
    pushed: didPush,
  }, null, 2));
}

export { buildEntry, buildHtml, validateCurated };

if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
