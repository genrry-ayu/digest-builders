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
