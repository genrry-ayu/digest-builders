#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const publicUrl = 'https://genrry-ayu.github.io/digest-builders/';
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const root = process.env.DIGEST_BUSINESS_ROOT || join(homedir(), 'business-automations');
const config = await readFile(join(homedir(), '.follow-builders/config.json'), 'utf8').then(JSON.parse).catch(() => ({}));
const proxy = config.network?.proxy ?? 'http://127.0.0.1:15236';
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export function verifyHtml(html, curated, date) {
  if (!html.includes('<title>Digest</title>') || !html.includes('UI v1.2.5')) throw Error('Current Digest template is not deployed');
  const match = html.match(/const DIGESTS = (.*);\s*\n/);
  if (!match) throw Error('DIGESTS missing');
  const entry = JSON.parse(match[1]).find(item => item.date === date);
  if (!entry) throw Error(`No entry for ${date}`);
  const titles = curated.highlights.map(h => h.title);
  if (titles.length < 3 || !titles.every(title => entry.highlights.some(h => h.title === title))) throw Error('Current curated titles do not match');
  for (const key of ['highlights', 'matters']) {
    if (!isDeepStrictEqual(entry[key], curated[key])) throw Error(`Published ${key} do not match the approved curation`);
  }
  for (const kind of ['blogs', 'podcasts']) {
    if (!isDeepStrictEqual(entry.articles?.[kind] || [], curated.articles?.[kind] || [])) throw Error(`Published ${kind} articles do not match the approved curation`);
  }
  return entry;
}

function download(url) {
  const result = spawnSync('/usr/bin/curl', ['--fail', '--silent', '--show-error', '--location', '--max-time', '45', '--proxy', proxy, '--noproxy', proxy ? '' : '*', '-H', 'Cache-Control: no-cache', '-w', '\n%{http_code}', url], { maxBuffer: 24 * 1024 * 1024 });
  if (result.status !== 0) throw Error(String(result.stderr || result.error || 'curl failed').trim());
  const end = result.stdout.lastIndexOf(10);
  const code = result.stdout.subarray(end + 1).toString();
  if (code !== '200') throw Error(`HTTP ${code}: ${url}`);
  return result.stdout.subarray(0, end);
}

async function main() {
  if (!process.argv[2]) throw Error('Usage: verify-digest.mjs <curated absolute path>');
  const curated = JSON.parse(await readFile(process.argv[2], 'utf8'));
  const failures = [];
  await mkdir(join(root, 'runs'), { recursive: true });
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const html = download(`${publicUrl}?sync=${Date.now()}`).toString('utf8');
      const entry = verifyHtml(html, curated, today);
      const images = [...new Set([
        ...entry.highlights.flatMap(item => (item.images || []).map(image => image.src)),
        ...entry.matters.flatMap(item => (item.images || []).map(image => image.src)),
        ...['blogs', 'podcasts'].flatMap(kind => (entry.articles?.[kind] || []).flatMap(article => article.blocks.filter(b => b.type === 'image').map(image => image.src))),
      ])];
      for (const src of images) {
        const bytes = download(new URL(src, publicUrl).href);
        if (!bytes.length) throw Error(`Empty image: ${src}`);
        if (src.startsWith('assets/digest/')) {
          const local = await readFile(resolve(repo, src));
          const hash = buffer => createHash('sha256').update(buffer).digest('hex');
          if (hash(bytes) !== hash(local)) throw Error(`Published image differs: ${src}`);
        }
      }
      const result = { ok: true, date: today, url: publicUrl, http: 200, titles: curated.highlights.map(h => h.title), articles: { blogs: entry.articles?.blogs?.length || 0, podcasts: entry.articles?.podcasts?.length || 0 }, images, sourceGeneratedAt: entry.sourceGeneratedAt, errors: entry.errors, attempts: attempt, verificationErrors: failures };
      await writeFile(join(root, 'runs', `digest-verification-${today}.json`), JSON.stringify(result, null, 2));
      console.log(JSON.stringify(result, null, 2));
      return;
    } catch (error) {
      failures.push(`Attempt ${attempt}/3: ${error.message}`);
      console.error(failures.at(-1));
    }
    if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 45000));
  }
  await writeFile(join(root, 'runs', `digest-verification-${today}.json`), JSON.stringify({ ok: false, date: today, url: publicUrl, verificationErrors: failures }, null, 2));
  process.exitCode = 1;
}

if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
