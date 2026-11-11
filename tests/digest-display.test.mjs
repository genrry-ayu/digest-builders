import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildHtml} from '../automation/scripts/digest-static-publisher.mjs';
test('display omits global audit banner but preserves stored audit',()=>{
 const d=JSON.parse(fs.readFileSync(new URL('../digest-history.json',import.meta.url)));
 const html=buildHtml(d.entries);
 assert.ok(d.entries[0].quality);
 assert.ok(!html.includes('配图或引用上下文未完整核实。'));
 assert.ok(!html.includes('Tweets Used'));
 assert.ok(html.includes('<blockquote class="editor-note">'));
 assert.ok(html.includes('洞察 · 编辑归纳，非作者原话'));
 assert.ok(html.includes('return sources + (commentary'));
 assert.ok(d.entries[0].highlights.every(h=>h.detail.editorial.length));
});
