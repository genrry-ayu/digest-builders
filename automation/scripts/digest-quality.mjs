import { validateClaimReview } from './digest-claims.mjs';
import { sourceRecords } from '../skills/follow-builders/scripts/digest-media.js';
const normalized = text => String(text || '').normalize('NFKC').replace(/\s+/g,' ').trim();
export function validateQuality(curated, data) {
  const claimAudit=curated.contentSchemaVersion===2 ? validateClaimReview(curated,data) : null;
  const sources=sourceRecords(data), byId=new Map(sources.map(s=>[s.id,s])), used=new Set(), errors=[], warnings=[];
  const fail=message=>errors.push(message);
  const lookup=(url,id)=> id?byId.get(id):sources.find(s=>s.url===url);
  for(const [i,h] of (curated.highlights || []).entries()) {
    const ids=new Set(), authors=new Set();
    for(const e of h.evidence || []) {
      const s=lookup(e.url,e.sourceId);
      if(!s || s.url!==e.url) {fail(`Insight ${i+1}: unknown evidence source`);continue;}
      used.add(s.id);ids.add(s.id);authors.add(s.author);
      if (![s.author,s.attribution].filter(Boolean).includes(e.attribution)) fail(`Insight ${i+1}: attribution differs from the source author`);
      if(!normalized(s.text).includes(normalized(e.quote)) || !normalized(e.quote)) fail(`Insight ${i+1}: quote is not in source`);
      if(/[A-Za-z]/.test(e.quote || '') && !e.translation) fail(`Insight ${i+1}: translation missing`);
      if(!/[.!?。！？…][”"')\]]?$/.test((e.quote || '').trim())) fail(`Insight ${i+1}: quote must be a complete sentence`);
      if(s.contextIncomplete) warnings.push(`Quoted-post context missing: ${s.id}`);
    }
    if(h.claimType==='synthesis') {if(ids.size<2 || authors.size<2) fail(`Insight ${i+1}: synthesis requires two independent authors`);}
    else if(h.claimType==='single_source') {
      if(ids.size!==1 || ![...ids].some(id=>[byId.get(id)?.author,byId.get(id)?.attribution].includes(h.sourcePerspective)) || !h.body.includes(h.sourcePerspective)) fail(`Insight ${i+1}: single-source attribution must appear in body`);
    } else fail(`Insight ${i+1}: claimType must be synthesis or single_source`);
  }
  for(const item of curated.matters || []) {const s=lookup(item.url,item.sourceId); if(!s || s.url!==item.url) fail('Matter has unknown or mismatched source'); else used.add(s.id);}
  for(const kind of ['blogs','podcasts']) for(const a of curated.articles?.[kind] || []) {
    const s=sources.find(s=>s.kind===kind && (a.sourceId ? (s.raw.guid||s.raw.id)===a.sourceId : s.url===a.sourceUrl));
    if(!s) fail('Article has unknown source'); else used.add(s.id);
  }
  const ledger=curated.selection?.sources;
  if(!Array.isArray(ledger)) fail('Selection ledger is required');
  else {
    const seen=new Set();
    for(const row of ledger) {
      if(!byId.has(row.sourceId) || seen.has(row.sourceId)) fail('Selection ledger has unknown or duplicate source');
      seen.add(row.sourceId);
      if(!['used','excluded'].includes(row.decision) || !row.reason?.trim()) fail('Selection decisions require a reason');
      if((row.decision==='used')!==used.has(row.sourceId)) fail(`Selection disagrees with actual citations: ${row.sourceId}`);
    }
    if(sources.some(s=>!seen.has(s.id))) fail('Selection ledger must cover all collected sources');
  }
  const media=data.media;
  if(!media?.sources) fail('Media collection report is required');
  const mediaSeen=new Set();
  for(const m of media?.sources || []) {
    if(!byId.has(m.sourceId) || mediaSeen.has(m.sourceId) || !['available','no_image','no_relevant_image','failed','unverified'].includes(m.status)) fail('Invalid or duplicate media source status');
    mediaSeen.add(m.sourceId);
    if((m.status==='available') !== Boolean(m.candidates?.length)) fail('Media status does not match available candidates');
    if((m.candidates || []).some(c=>c.sourceId!==m.sourceId || c.sourceUrl!==byId.get(m.sourceId)?.url)) fail('Media candidate source mismatch');
  }
  if(sources.some(s=>!mediaSeen.has(s.id))) fail('Media status report must cover every collected source');
  const candidates=new Map((media?.sources || []).flatMap(s=>s.candidates || []).map(c=>[c.id,c]));
  const images=[...(curated.highlights || []),...(curated.matters || [])].flatMap(h=>h.images || []);
  for(const kind of ['blogs','podcasts']) for(const a of curated.articles?.[kind] || []) images.push(...(a.blocks || []).filter(b=>b.type==='image'));
  for(const card of [...(curated.highlights || []),...(curated.matters || [])]) {
    const relevant=new Set(card.evidence ? card.evidence.map(e=>lookup(e.url,e.sourceId)?.id) : [lookup(card.url,card.sourceId)?.id]);
    for(const im of card.images || []) if(!relevant.has(candidates.get(im.mediaId)?.sourceId)) fail('Image is unrelated to its card source');
  }
  for(const kind of ['blogs','podcasts']) for(const a of curated.articles?.[kind] || []) {
    const source=sources.find(s=>s.kind===kind && (a.sourceId ? (s.raw.guid||s.raw.id)===a.sourceId : s.url===a.sourceUrl));
    for(const im of (a.blocks || []).filter(b=>b.type==='image')) if(candidates.get(im.mediaId)?.sourceId!==source?.id) fail('Image is unrelated to its article source');
  }
  const imageIds=new Set();
  for(const im of images) {
    const c=candidates.get(im.mediaId);
    if(!c || c.src!==im.src || c.sourceUrl!==im.sourceUrl || c.originalUrl!==im.originalUrl || !im.alt?.trim() || !im.attribution || im.sha256!==c.sha256) fail('Image must match verified candidate and include provenance and alt');
    else {imageIds.add(im.mediaId); if(!used.has(c.sourceId)) fail('Image source is not used in the edition');}
  }
  const decisions=curated.mediaReview?.decisions || [];
  const reviewed=new Set();
  for(const decision of decisions) {
    if(reviewed.has(decision.mediaId) || !candidates.has(decision.mediaId)) fail('Media review has unknown or duplicate candidate');
    reviewed.add(decision.mediaId);
    if(!['use','exclude'].includes(decision.decision) || !decision.reason?.trim()) fail('Media decision and reason required');
    if((decision.decision==='use')!==imageIds.has(decision.mediaId)) fail('Media decision disagrees with rendered image');
  }
  for(const c of candidates.values()) if(used.has(c.sourceId) && !reviewed.has(c.id)) fail(`A used source has an unreviewed available image: ${c.id}. Re-curate from the saved publisher snapshot before retrying.`);
  for(const m of media?.sources || []) if(used.has(m.sourceId) && (['failed','unverified'].includes(m.status) || m.partial)) warnings.push(`Media ${m.status}: ${m.sourceId} (${m.reason})`);
  if(claimAudit) warnings.push(...claimAudit.warnings);
  if(!images.length) warnings.push('No relevant image included in this edition');
  if(warnings.length && !curated.mediaReview?.degradedReason?.trim()) fail('Degraded edition needs an explicit explanation');
  const summary={collected:sources.length,collectedTweets:sources.filter(s=>s.kind==='x').length,used:used.size,usedTweets:[...used].filter(id=>byId.get(id)?.kind==='x').length,uniqueAuthors:new Set([...used].map(id=>byId.get(id)?.author)).size,imageCount:images.length,...(claimAudit ? {claimAudit} : {}),status:warnings.length?'degraded':'passed',warnings:[...new Set(warnings)]};
  if(errors.length) throw Error('Content quality failed:\n'+[...new Set(errors)].join('\n'));
  return summary;
}
