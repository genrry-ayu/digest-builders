---
name: follow-builders
description: Generate and publish the existing AI Builders Digest from collector JSON, with Chinese insights, matters, blog and podcast reading modules, verified images, source checks and GitHub Pages verification. Use for daily Digest runs or maintaining this pipeline; preserve the bound chat and existing schedule.
---

# Follow Builders · v1.2.2

Read `../../RULES.md` and `../../scripts/digest-articles.md` in full before a run.
These are the current deployment rules. Do not revive historical dark templates,
Sources indexes, external delivery, onboarding or duplicate schedules.

## Daily workflow

1. Stay in the bound chat. Compute today in Asia/Shanghai; never set DIGEST_DATE.
2. Run `node scripts/prepare-digest.js` and save the complete JSON under the local
   business-automations/runs directory. Inspect stats, errors and source dates.
   Feed fallback remains remote → cache → bundled snapshot; preserve degradation.
3. Use only that JSON for facts. No extra searches, article fetching or invented
   links. A blog count of zero alone does not prevent publication. Stop only when
   material cannot support 3–5 distinct insights and 4–6 nonduplicate matters.
4. Write UTF-8 curated JSON: highlights with tag/title/body/evidence, matters with
   kind/title/detail/url, plus articles.blogs and articles.podcasts when full body
   or transcript exists. Evidence retains exact quote, attribution and url; add
   a Chinese translation for English quotations and leave names unchanged.
5. A clearly identified podcast transcript is usable even with a channel URL.
   Retain episode title, show, date and link scope in provenance; never call a
   channel link an episode link. Do not append verbose provenance to card copy.
6. Create coherent Chinese reading articles per the article schema. Preserve the
   argument, examples and limitations in concise original prose; no blanket
   short-summary word cap, and no near-complete translation of copyrighted text.
   Missing body means an empty array and no visible module. Include relevant,
   verified source images only; keep original/source URLs and Chinese alt text.
7. Check repo safety, then run `../../scripts/digest-static-publisher.mjs` with
   --curated-file. The publisher recollects sources; article identity/body hash
   must match. Review the second collection and all insight evidence as well.
8. Run `../../scripts/verify-digest.mjs <curated-file>`; verify HTTP 200, today's
   titles, article content and image assets. Report actual errors in this chat.

## Source files and prompt precedence

- `scripts/prepare-digest.js`: built-in Node modules only, three parallel feeds.
- `scripts/digest-fetch.js`: 15-second full-body timeout, two attempts, explicit
  configured proxy, then cache/bundle fallback. Preserve every error.
- `prompts/*.md`: current editorial rules. Install these as user overrides via
  `../../scripts/install-local.mjs` so upstream prompts cannot undo this release.
- `config/default-sources.json`: public upstream defaults, not credentials.
- User config stays at `~/.follow-builders/config.json`; never commit it.

For requested page edits, preview locally using --render-only --no-commit
--no-push until the user explicitly asks to publish. Scheduled daily content
publication remains authorized under the existing automation.


## 配图与来源质量补充规范 v1.3（2026-11-11 已批准）

本节更新原 v1.2.2 的媒体采集与内容验收要求，其余页面、时间、通知及发布约束保持。若旧调度文字只列基础字段，仍须采用本节完整 schema。媒体采集只核实同一来源的原图，不允许补充正文事实。
Collect images before curation using the bounded media collector. It only retrieves public media from the same source; it must not add article facts. Preserve media.sources status: available, no_image, no_relevant_image, failed, unverified. Channel-only URLs are unverified, never proof of no images. Respect the 20-second / 12-request budget; retries occur on later authorized runs, not an unbounded loop. Only approved media hosts are supported initially; unsupported hosts are recorded, not guessed.

Group all collected material by topic before selecting 3–5 Insights and 4–6 distinct Matters. A synthesis must cite at least two independent authors; single-source viewpoints must use claimType: single_source, sourcePerspective naming the author, and that author in the body. Do not invent independent corroboration. Every evidence needs sourceId from media.sources / the source registry, original quote, attribution, URL, and Chinese translation for English. Use a complete sentence that is actually present in the source. Do not reconstruct quoted-post context that was not collected.

curated.selection.sources must contain one record for EVERY collected tweet/blog/podcast: {sourceId, decision: used|excluded, reason}. Source IDs are x:<tweet id>, blogs:<guid/id/url>, podcasts:<guid/id/url>. Record topic/quality/duplication reasons, not a generic claim that excluded material is unimportant. Used decisions must match actual evidence, Matters and reading articles.

curated.mediaReview = {decisions:[{mediaId,decision:use|exclude,reason}],degradedReason}. Review every available image belonging to an adopted source. Exclude irrelevant logos, avatars or decorative material with a reason; no arbitrary quota or forced filler. Copy approved candidate src, originalUrl, sourceUrl, attribution and sha256, add mediaId=candidate.id and accurate Chinese alt. Keep downloaded local assets. Images in articles use type:image. If collection failed, remained unverified, or no relevant image was included, include a truthful degradedReason. The output status is degraded, not fully illustrated success.

New content must pass validateQuality against the complete publisher snapshot before files are rendered. Publication verification rechecks the exact snapshot hash and content-quality result as well as HTTP and image bytes. Existing 09:00 schedule and notification destinations are unchanged. Page edits remain local until explicit publication approval.

原定时命令与09:00调度不变。结果必须区分上线成功与内容降级；contentStatus=degraded 时报告简短真实原因。若发布复采新增未审阅图，按报错中的保存快照重新审阅并更新策划，不自动跳过验收。

## 详细原文总结 v1.4（2026-11-11 用户确认）

本节替代“用很短摘录支撑新增因果分析”的旧策划方式。推文按原文顺序作详细、具体而精简的中文总结，保留案例、动作、数字、适用范围和重要限定；不可将作者建议写成已证实效果。原文有章节或带标题的分项，按对应章节与顺序总结；无正式章节时保留自然段和列表，不假称原文有章节。不要为凑分析加入等待、误解、效率等原文未给出的指标。

新 curated 必须有 contentSchemaVersion: 2。每条 highlight 保留 tag/title/body/evidence 以兼容审计；body 是忠实短摘要，不再单独作为页面正文。每个 evidence 使用规范 sourceId。新增 titleReview 与 detail: {sources:[{sourceId,blocks,coverageReview}],editorial:[]}。每个引用来源有且只有一份详细总结。

blocks 支持 paragraph（sentences 数组）、list（items 数组）、heading（text、originalHeading、review）。每个 sentence/item 和 titleReview 是：{id,text,kind:source_summary,reviewedAs:supported,basis:[{sourceId,quote}],reviewNote}。titleReview.text 必须等于标题。每个完整句子和列表项独立记录对应的准确原文片段及编辑判断理由，不能只给整篇文章放一个短引句。heading.review 采用同样的逐句审阅结构，核对标题译文及扩写；heading.originalHeading 对应英文原有章节标题；不得自行补造原帖章节。coverageReview 必须写 details、limitations、omissions，逐项检查具体案例、边界和删去内容，而不是只说“已总结”。

需要额外解读时只放 detail.editorial，kind 为 editorial_inference，明确它是编辑判断。缺乏直接依据的推断 reviewedAs: insufficient，说明不足并公开标注；不可混入作者总结或标题。尽可能删去没有阅读价值的额外推测。

程序只验证每个展示单元有审阅记录、引文确实存在、来源匹配、检测到的章节顺序保留。它不能自动证明一句话被原文蕴含，也不能保证完整性或翻译质量。必须在发布前再逐句核对：原文明确说了什么、哪些是作者意见、是否漏掉关键限定、有没有把建议改成确定效果。不得以自动测试通过代替内容审阅。

继续采用现有配图、日期、发布、通知和不新增任务规则。页面继续保持暖灰样式；详细总结取代仅展示短摘录，不恢复被删除的 Sources 大模块，也不恢复 Tweets Used 字样。


### 展示调整：2026-11-11
页面不再展示“配图或引用上下文未完整核实。本期采用 … 条推文；详情见各条依据。”总提示，也不恢复 Tweets Used。内部质量状态、选材记录和证据不足标记仍须保留。每条详细总结下方提供一段简短洞察，存入 detail.editorial 并逐句建立证据审阅；使用原有浅灰引用框背景，移除该洞察框左侧竖线及“洞察 · 编辑归纳，非作者原话”标题行（用户截图指定）；洞察正文保留，内部仍区分编辑归纳与作者原话。洞察可以忠实归纳，但不得恢复没有依据的因果断言或冒充作者原话。必须保留具体内容不足的必要标记。

洞察灰框内部统一使用较小间距：四边内边距 14px，首尾段落不额外加 margin，多段之间 8px；桌面与手机一致，保留正文和章节层级。
