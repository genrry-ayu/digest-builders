// This checks traceability and review coverage, NOT semantic entailment.
import {sourceRecords} from '../skills/follow-builders/scripts/digest-media.js';
const norm=s=>String(s || '').normalize('NFKC').replace(/\s+/g,' ').trim();
export function explicitHeadings(text) {
  return [...String(text || '').matchAll(/^\s*(?:#{1,6}\s+(.+)|[•*-]\s+([^:\n]{1,60}):)/gm)].map(m=>(m[1]||m[2]).trim());
}
export function validateClaimReview(curated,data) {
  if(curated.contentSchemaVersion!==2) throw Error('Detailed-summary schema version 2 is required');
  const sources=new Map(sourceRecords(data).map(s=>[s.id,s]));
  const warnings=[], seen=new Set();let count=0;
  function check(claim,expected,allowed,editorial=false) {
    if(!claim || typeof claim.text!=='string' || !claim.text.trim() || claim.text!==expected || !claim.id || seen.has(claim.id)) throw Error('Every rendered claim needs a unique matching review');
    seen.add(claim.id); count++;
    if(claim.kind!==(editorial?'editorial_inference':'source_summary')) throw Error('Separate author summary from editorial inference');
    if(!['supported','insufficient'].includes(claim.reviewedAs) || !claim.reviewNote?.trim()) throw Error('Editorial review status and rationale are required');
    if(!Array.isArray(claim.basis) || !claim.basis.length) throw Error('Claim evidence mapping is required');
    for(const e of claim.basis) {
      const s=sources.get(e.sourceId);
      if(!s || !allowed.has(e.sourceId) || !norm(e.quote) || !norm(s.text).includes(norm(e.quote))) throw Error('Claim evidence does not match its collected source: '+claim.id+' '+e.quote.slice(0,80));
    }
    if(!editorial && claim.reviewedAs!=='supported') throw Error('Unsupported claims cannot be presented as author summaries or titles');
    if(editorial && claim.reviewedAs==='insufficient') warnings.push('Editor inference not directly established by sources: '+claim.id);
  }
  for(const h of curated.highlights || []) {
    if(!h.detail || !Array.isArray(h.detail.sources) || !h.detail.sources.length) throw Error('Detailed source summary required');
    const allowed=new Set(h.evidence.map(e=>e.sourceId));
    check(h.titleReview,h.title,allowed);
    const summarized=new Set();
    for(const summary of h.detail.sources) {
      if(!allowed.has(summary.sourceId) || summarized.has(summary.sourceId)) throw Error('Summary source must match evidence exactly once');
      summarized.add(summary.sourceId);
      const source=sources.get(summary.sourceId), headings=[];
      if(!Array.isArray(summary.blocks) || !summary.blocks.length) throw Error('Summary blocks required');
      for(const b of summary.blocks) {
        if(b.type==='heading') {
          if(!b.text?.trim() || !b.originalHeading) throw Error('Source section headings need the original heading');
          headings.push(b.originalHeading);
          check(b.review,b.text,new Set([summary.sourceId]));
        } else if(b.type==='paragraph') {
          if(!b.sentences?.length) throw Error('Paragraph sentences required');
          for(const c of b.sentences)check(c,c.text,new Set([summary.sourceId]));
        } else if(b.type==='list') {
          if(!b.items?.length) throw Error('List items required');
          for(const c of b.items)check(c,c.text,new Set([summary.sourceId]));
        } else throw Error('Unknown summary block type');
      }
      const original=explicitHeadings(source?.text);
      if(JSON.stringify(headings)!==JSON.stringify(original)) throw Error('Preserve detected source sections and their original order');
      if(!summary.coverageReview?.details?.trim() || !summary.coverageReview?.limitations?.trim() || !summary.coverageReview?.omissions?.trim()) throw Error('Review examples, boundaries and omissions explicitly');
    }
    if([...allowed].some(id=>!summarized.has(id))) throw Error('Every cited source needs its own faithful summary');
    for(const c of h.detail.editorial || [])check(c,c.text,allowed,true);
  }
  return {reviewMode:'editorial review plus structural checks; not automated proof of meaning',claimsReviewed:count,warnings};
}
