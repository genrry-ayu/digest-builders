import test from 'node:test';
import assert from 'node:assert/strict';
import {validateClaimReview,explicitHeadings} from '../automation/scripts/digest-claims.mjs';
const fixture=()=>{
 const sourceId='x:1';const basis=[{sourceId,quote:'A concrete example.'}];
 const titleReview={id:'t',text:'作者的例子和限制',kind:'source_summary',reviewedAs:'supported',basis,reviewNote:'编辑核对原文；不是自动语义证明。'};
 const sentence={...titleReview,id:'s',text:'作者给出了具体例子。'};
 return {data:{x:[{name:'Alice',handle:'alice',tweets:[{id:'1',url:'https://x.com/alice/status/1',text:'A concrete example.\n• Limit: This is one case only.'}]}]},curated:{contentSchemaVersion:2,highlights:[{title:titleReview.text,titleReview,evidence:[{sourceId}],detail:{sources:[{sourceId,blocks:[{type:'paragraph',sentences:[sentence]},{type:'heading',text:'限制',originalHeading:'Limit',review:{...sentence,id:'h',text:'限制',basis:[{sourceId,quote:'Limit: This is one case only.'}]}},{type:'paragraph',sentences:[{...sentence,id:'l',text:'这只是一个案例。',basis:[{sourceId,quote:'This is one case only.'}]}]}],coverageReview:{details:'保留案例',limitations:'保留单案例限制',omissions:'没有新增推断'}}],editorial:[]}}]}};
};
test('complete detailed review returns an honest structural-audit mode',()=>{const {data,curated}=fixture();const r=validateClaimReview(curated,data);assert.equal(r.claimsReviewed,4);assert.match(r.reviewMode,/not automated proof/);});
test('changed rendered title cannot reuse another review',()=>{const {data,curated}=fixture();curated.highlights[0].title='更强的结论';assert.throws(()=>validateClaimReview(curated,data),/matching review/);});
test('invented supporting quote fails',()=>{const {data,curated}=fixture();curated.highlights[0].detail.sources[0].blocks[0].sentences[0].basis=[{sourceId:'x:1',quote:'Not in the source.'}];assert.throws(()=>validateClaimReview(curated,data),/does not match/);});
test('unknown source in claim support fails',()=>{const {data,curated}=fixture();curated.highlights[0].titleReview.basis=[{sourceId:'x:999',quote:'A concrete example.'}];assert.throws(()=>validateClaimReview(curated,data),/does not match/);});
test('missing original section fails',()=>{const {data,curated}=fixture();curated.highlights[0].detail.sources[0].blocks.splice(1,1);assert.throws(()=>validateClaimReview(curated,data),/Preserve detected/);});
test('section order is preserved',()=>assert.deepEqual(explicitHeadings('• Coding: text\n• Cost: text'),['Coding','Cost']));
test('invented chapter heading fails for unsectioned source',()=>{const {data,curated}=fixture();curated.highlights[0].detail.sources[0].blocks.push({type:'heading',text:'新增结论',originalHeading:'Conclusion',review:{...curated.highlights[0].titleReview,id:'newheading',text:'新增结论'}});assert.throws(()=>validateClaimReview(curated,data),/Preserve detected/);});
test('insufficient support cannot pass as author summary',()=>{const {data,curated}=fixture();curated.highlights[0].detail.sources[0].blocks[0].sentences[0].reviewedAs='insufficient';assert.throws(()=>validateClaimReview(curated,data),/Unsupported claims/);});
test('editorial inference is separate and honestly warned',()=>{const {data,curated}=fixture();curated.highlights[0].detail.editorial=[{...curated.highlights[0].titleReview,id:'e',text:'这可能对其他案例也有帮助。',kind:'editorial_inference',reviewedAs:'insufficient'}];assert.equal(validateClaimReview(curated,data).warnings.length,1);});
test('duplicate claim IDs fail',()=>{const {data,curated}=fixture();curated.highlights[0].detail.sources[0].blocks[0].sentences[0].id='t';assert.throws(()=>validateClaimReview(curated,data),/unique/);});
test('omitted coverage review fails',()=>{const {data,curated}=fixture();delete curated.highlights[0].detail.sources[0].coverageReview;assert.throws(()=>validateClaimReview(curated,data),/Review examples/);});
test('every cited source requires its own source summary',()=>{const {data,curated}=fixture();curated.highlights[0].evidence.push({sourceId:'x:2'});assert.throws(()=>validateClaimReview(curated,data),/Every cited/);});

test('empty rendered claim is rejected',()=>{const {data,curated}=fixture();curated.highlights[0].detail.sources[0].blocks[0].sentences[0].text='';assert.throws(()=>validateClaimReview(curated,data),/matching review/);});
