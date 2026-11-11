// Media is evidence, never a source of new article facts. No credentials are sent.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, dirname, basename } from 'node:path';
const exec = promisify(execFile);
const hash = value => createHash('sha256').update(value).digest('hex');
const MEDIA_HOSTS = ['pbs.twimg.com', 'substackcdn.com', 'substack-post-media.s3.amazonaws.com', 'i.ytimg.com', 'media.beehiiv.com'];
export function allowedMediaURL(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && (!u.port || u.port === '443') && MEDIA_HOSTS.some(h => u.hostname === h || u.hostname.endsWith('.' + h)); } catch { return false; }
}
export function imageFormat(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpg';
  if (bytes.subarray(0,6).toString().match(/^GIF8[79]a$/)) return 'gif';
  if (bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP') return 'webp';
  return null;
}
export async function verifyDecodedImage(path) {
  const probe=path+'.decode-check.png';
  try {
    await exec('/usr/bin/sips',['-s','format','png',path,'--out',probe],{timeout:5000});
    const {stdout}=await exec('/usr/bin/sips',['-g','pixelWidth','-g','pixelHeight',probe],{timeout:5000});
    const width=Number(stdout.match(/pixelWidth: (\d+)/)?.[1]), height=Number(stdout.match(/pixelHeight: (\d+)/)?.[1]);
    if(!width || !height) throw Error('Image could not be decoded');
    return {width,height};
  } finally {await rm(probe,{force:true});}
}
export function sourceRecords(data) {
  return [
    ...(data.x || []).flatMap(b => (b.tweets || []).map(t => ({ id: 'x:' + (t.id || t.url), kind: 'x', author: b.handle || b.name, attribution: b.name, url: t.url, date: t.createdAt, text: t.text || '', raw: t, contextIncomplete: Boolean(t.isQuote && !t.quotedTweet?.text) }))),
    ...['blogs','podcasts'].flatMap(kind => (data[kind] || []).map(s => ({ id: kind + ':' + (s.guid || s.id || s.url), kind, author: s.name || s.source || s.url, attribution: s.name || s.source, url: s.url, date: s.publishedAt, text: s.transcript || s.content || s.text || s.markdown || s.body || s.summary || '', raw:s })))
  ];
}
export function extractCandidates(payload, source, method) {
  const values = [...(payload.photos || []), ...(payload.mediaDetails || []), ...(payload.images || []), ...(Array.isArray(payload.media) ? payload.media : [])];
  const seen = new Set();
  return values.flatMap(m => {
    if (m?.type && !['photo','image'].includes(m.type)) return [];
    const url = typeof m === 'string' ? m : m?.media_url_https || m?.url || m?.src;
    if (!allowedMediaURL(url) || seen.has(url)) return [];
    seen.add(url);
    return [{ id: hash(source.id + url).slice(0,24), sourceId:source.id, originalUrl:url, sourceUrl:source.url, attribution:source.attribution || source.author, method, suggestedAlt: typeof m === 'object' ? m.alt_text || m.alt || '' : '' }];
  });
}
async function request(url, {proxy, timeout=4}={}) {
  // Never follow redirects to a different or unverified host.
  const {stdout} = await exec('/usr/bin/curl', ['--fail','--silent','--show-error','--proto','=https','--max-time',String(timeout),'--max-filesize','5242880','--proxy',proxy || '', '--noproxy',proxy ? '' : '*',url], {encoding:'buffer',timeout:timeout*1000+1000,maxBuffer:6*1024*1024});
  return stdout;
}
export async function collectMedia(data, {root, cacheDir, proxy='', maxRequests=12, budgetMs=20000, now=Date.now(), fetchBytes=request}={}) {
  if (!root) throw Error('Media asset root is required');
  const date = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
  const cacheRoot = cacheDir || join(dirname(root),'.digest-media-cache',basename(root));
  const sourceList = sourceRecords(data);
  const report = {version:1, checkedAt:new Date(now).toISOString(), requests:0, sources:[], warnings:[]};
  const deadline = Date.now()+budgetMs;
  const fetchBounded = async url => { if(report.requests>=maxRequests || Date.now()>=deadline) throw Error('budget_exhausted'); report.requests++; return fetchBytes(url,{proxy,timeout:Math.max(1,Math.min(4,Math.floor((deadline-Date.now())/1000)))}); };
  await mkdir(cacheRoot,{recursive:true});
  // Prefer substantive original posts, then short posts and replies. All get an explicit status.
  const ordered = [...sourceList].sort((a,b) => Number(b.text.length>=150)-Number(a.text.length>=150));
  for (const source of ordered) {
    const record = {sourceId:source.id, sourceUrl:source.url, status:'unverified', reason:'not_checked', candidates:[], contextIncomplete:source.contextIncomplete || false};
    report.sources.push(record);
    const cacheFile = join(cacheRoot,hash(source.id)+'.json');
    try {
      const cached = JSON.parse(await readFile(cacheFile,'utf8'));
      if (cached.expiresAt>now) {
        let valid=true;
        for(const image of cached.record.candidates) { try { const b=await readFile(join(cacheRoot,'images',image.cacheKey)); if(hash(b)!==image.sha256) valid=false; else await verifyDecodedImage(join(cacheRoot,'images',image.cacheKey)); } catch {valid=false;} }
        if(valid) {Object.assign(record,cached.record,{cacheHit:true});continue;}
      }
    } catch {}
    try {
      let candidates=extractCandidates(source.raw,source,'feed');
      if(!candidates.length && source.kind==='x' && /^\d+$/.test(source.raw.id || '')) {
        const payload=JSON.parse((await fetchBounded('https://cdn.syndication.twimg.com/tweet-result?id='+source.raw.id+'&lang=en&token=0')).toString('utf8'));
        if(String(payload.id_str)!==String(source.raw.id)) throw Error('source_identity_unverified');
        candidates=extractCandidates(payload,source,'official_syndication');
        if(!candidates.length && payload.video) {record.status='no_relevant_image';record.reason='video_only';}
        else if(!candidates.length) {record.status='no_image';record.reason='official_post_has_no_photo';}
      } else if(!candidates.length && /^https:\/\/(?:www\.)?latent\.space\/p\/[^/?#]+/.test(source.url || '')) {
        const html=(await fetchBounded(source.url)).toString('utf8');
        const imageURLs=[...html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(m=>m[1].replaceAll('&amp;','&'));
        candidates=extractCandidates({images:imageURLs},source,'original_page');
        if(!candidates.length) {record.status='unverified';record.reason='no_supported_image_in_page_html';}
      } else if(!candidates.length) {
        // Channel URLs are not episode pages; do not pretend to have checked the episode.
        record.reason='feed_has_no_media_or_supported_post_locator';
      }
      for(const candidate of candidates.slice(0,2)) {
        const bytes=await fetchBounded(candidate.originalUrl);
        const ext=imageFormat(bytes);
        if(!ext) throw Error('invalid_image_bytes');
        const src='assets/digest/'+date+'/'+candidate.id+'.'+ext;
        await mkdir(join(cacheRoot,'images'),{recursive:true});
        const cacheKey=candidate.id+'.'+ext;
        await writeFile(join(cacheRoot,'images',cacheKey),bytes);
        const dimensions=await verifyDecodedImage(join(cacheRoot,'images',cacheKey));
        record.candidates.push({...candidate,...dimensions,src,cacheKey,sha256:hash(bytes),bytes:bytes.length,checkedAt:new Date(now).toISOString()});
      }
      if(record.candidates.length) {record.status='available';record.reason='downloaded_and_signature_checked';}
      if(['available','no_image','no_relevant_image'].includes(record.status)) {
        await writeFile(cacheFile,JSON.stringify({expiresAt:now+(record.status==='available'?7*86400000:6*3600000),record},null,2));
      }
    } catch(error) {
      record.status=record.candidates.length?'available':String(error.message)==='budget_exhausted'?'unverified':'failed';
      record.reason=String(error.message).slice(0,250);
      record.partial=record.candidates.length>0;
    }
  }
  report.summary=Object.fromEntries(['available','no_image','no_relevant_image','failed','unverified'].map(status=>[status,report.sources.filter(s=>s.status===status).length]));
  if(report.summary.failed || report.summary.unverified) report.warnings.push('Media collection incomplete; do not report this edition as fully illustrated.');
  return report;
}

export async function materializeMedia(curated, data, root, cacheDir) {
  const cacheRoot=cacheDir || join(dirname(root),'.digest-media-cache',basename(root));
  const candidates=new Map((data.media?.sources || []).flatMap(s=>s.candidates || []).map(c=>[c.id,c]));
  const images=[...(curated.highlights || []),...(curated.matters || [])].flatMap(h=>h.images || []);
  for(const kind of ['blogs','podcasts']) for(const article of curated.articles?.[kind] || []) images.push(...(article.blocks || []).filter(b=>b.type==='image'));
  for(const image of images) {
    const c=candidates.get(image.mediaId);
    if(!c || c.src!==image.src || !/^assets\/digest\/\d{4}-\d{2}-\d{2}\/[a-f0-9]{24}\.(png|jpg|gif|webp)$/.test(c.src) || !/^[a-f0-9]{24}\.(png|jpg|gif|webp)$/.test(c.cacheKey || '')) throw Error('Invalid image materialization reference');
    const bytes=await readFile(join(cacheRoot,'images',c.cacheKey));
    if(hash(bytes)!==c.sha256 || !imageFormat(bytes)) throw Error('Verified media cache changed');
    await verifyDecodedImage(join(cacheRoot,'images',c.cacheKey));
    await mkdir(dirname(join(root,c.src)),{recursive:true});
    await writeFile(join(root,c.src),bytes);
  }
}
