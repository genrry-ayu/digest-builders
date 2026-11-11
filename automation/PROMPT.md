每天北京时间 09:00 在原绑定聊天生成并发布当天 AI Builders Digest，不创建、分叉、委派或切换聊天/子任务，不重复迁移或创建调度。先完整阅读 /Users/genrryli/business-automations/OPERATIONS.md、/Users/genrryli/business-automations/MIGRATION_PROMPT.md 第2、3节，以及 /Users/genrryli/business-automations/repos/digest-builders/automation/RULES.md、automation/skills/follow-builders/SKILL.md、automation/scripts/digest-articles.md；以仓库中 v1.2.2 现行规则为准。

用 /usr/local/bin/node 运行 /Users/genrryli/business-automations/source/skills/follow-builders/scripts/prepare-digest.js，完整 JSON 保存到 /Users/genrryli/business-automations/runs，检查 stats/errors/来源日期并保留降级状态；日常不得另行抓取或搜索补事实。生成中文 3–5 条有判断、因果分析和准确原文依据的 highlights（tag/title/body/evidence，evidence 含 quote/attribution/url，英文另加 translation），4–6 条不重复 matters（kind/title/detail/url）。博客缺少不单独阻止发布；明确节目、标题、日期的非空播客 transcript 可用，频道链接只如实保留链接范围元数据，不伪造单集 URL。整体有效材料不足则停止。

有正文或 transcript 时，增加同级 articles.blogs / articles.podcasts，按文章规范整理成精简而连贯的中文文章，保留叙事逻辑、关键例子和边界；只有摘要不扩写，无正文则整个模块隐藏。保留 sourceId/sourceTitle/sourceUrl/publishedAt/sourceTextSha256。相关已核实原图放入洞察、议题和文章，附中文 alt 与图片来源；不猜图、不引入新事实。

按 RULES 做仓库安全检查，写 curated JSON，再执行 /usr/local/bin/node /Users/genrryli/business-automations/source/scripts/digest-static-publisher.mjs --curated-file=<绝对路径>。保留 Digest 暖灰界面、中文默认展开证据、14px 卡片标题、精简统计、洞察/议题/博客/播客结构和有后续模块才折叠长文的行为；不恢复 Sources、标签、旧副标题或来源尾注。保留7个自然日历史与旧存档。日期使用 Asia/Shanghai，禁止 DIGEST_DATE。核对复采完整 JSON 与 errors/来源日期仍支持全部策划，文章哈希变化须重新策划。

调用 /usr/local/bin/node /Users/genrryli/business-automations/verify-digest.mjs <curated绝对路径>，确认 https://genrry-ayu.github.io/digest-builders/ HTTP 200、当天 DIGESTS、至少3个真实洞察标题、文章与图片；有界重试后失败如实报告。当前聊天只追加日期、链接、成功或失败及实际错误，不发微信、飞书或其他聊天。用户临时页面编辑先本地预览，明确要求发布后再 push；既有每日定时内容发布授权保持。


## 配图与来源质量补充规范 v1.3（2026-11-11 已批准）

本节更新原 v1.2.2 的媒体采集与内容验收要求，其余页面、时间、通知及发布约束保持。若旧调度文字只列基础字段，仍须采用本节完整 schema。媒体采集只核实同一来源的原图，不允许补充正文事实。
Collect images before curation using the bounded media collector. It only retrieves public media from the same source; it must not add article facts. Preserve media.sources status: available, no_image, no_relevant_image, failed, unverified. Channel-only URLs are unverified, never proof of no images. Respect the 20-second / 12-request budget; retries occur on later authorized runs, not an unbounded loop. Only approved media hosts are supported initially; unsupported hosts are recorded, not guessed.

Group all collected material by topic before selecting 3–5 Insights and 4–6 distinct Matters. A synthesis must cite at least two independent authors; single-source viewpoints must use claimType: single_source, sourcePerspective naming the author, and that author in the body. Do not invent independent corroboration. Every evidence needs sourceId from media.sources / the source registry, original quote, attribution, URL, and Chinese translation for English. Use a complete sentence that is actually present in the source. Do not reconstruct quoted-post context that was not collected.

curated.selection.sources must contain one record for EVERY collected tweet/blog/podcast: {sourceId, decision: used|excluded, reason}. Source IDs are x:<tweet id>, blogs:<guid/id/url>, podcasts:<guid/id/url>. Record topic/quality/duplication reasons, not a generic claim that excluded material is unimportant. Used decisions must match actual evidence, Matters and reading articles.

curated.mediaReview = {decisions:[{mediaId,decision:use|exclude,reason}],degradedReason}. Review every available image belonging to an adopted source. Exclude irrelevant logos, avatars or decorative material with a reason; no arbitrary quota or forced filler. Copy approved candidate src, originalUrl, sourceUrl, attribution and sha256, add mediaId=candidate.id and accurate Chinese alt. Keep downloaded local assets. Images in articles use type:image. If collection failed, remained unverified, or no relevant image was included, include a truthful degradedReason. The output status is degraded, not fully illustrated success.

New content must pass validateQuality against the complete publisher snapshot before files are rendered. Publication verification rechecks the exact snapshot hash and content-quality result as well as HTTP and image bytes. Existing 09:00 schedule and notification destinations are unchanged. Page edits remain local until explicit publication approval.

原定时命令与09:00调度不变。结果必须区分上线成功与内容降级；contentStatus=degraded 时报告简短真实原因。若发布复采新增未审阅图，按报错中的保存快照重新审阅并更新策划，不自动跳过验收。
