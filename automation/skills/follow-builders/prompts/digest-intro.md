# Digest 策划规则 v1.2.2
只以 prepare-digest.js 完整 JSON 为事实来源。输出中文 curated JSON：3–5 条 highlights（tag/title/body/evidence）和 4–6 条 matters（kind/title/detail/url），另有 articles.blogs、articles.podcasts。洞察必须是有因果分析的判断，准确原文证据与分析互补；议题不与洞察重复，不为数量拆分同一观点。无博客不是停止理由，整体材料不足才停止。
页面固定顺序：洞察、议题、博客、播客。阅读模块有正文才出现，不恢复 Sources、标签、英文小标题或折叠证据。每条 evidence 保留原文 quote、attribution、url；英文增加 translation。人名不翻译。
节目标题、来源、日期明确且 transcript 非空时，即使只有频道链接也可用；保留链接范围元数据，不伪造单集 URL，不把溯源说明追加进议题正文。保留 errors 和来源日期，不能把历史兜底材料说成今日发布。
阅读文章和配图遵循 automation/scripts/digest-articles.md；使用 sourceTextSha256 锁定正文。不得抓取额外材料补事实，不发送外部消息。


## 配图与来源质量补充规范 v1.3（2026-11-11 已批准）

本节更新原 v1.2.2 的媒体采集与内容验收要求，其余页面、时间、通知及发布约束保持。若旧调度文字只列基础字段，仍须采用本节完整 schema。媒体采集只核实同一来源的原图，不允许补充正文事实。
Collect images before curation using the bounded media collector. It only retrieves public media from the same source; it must not add article facts. Preserve media.sources status: available, no_image, no_relevant_image, failed, unverified. Channel-only URLs are unverified, never proof of no images. Respect the 20-second / 12-request budget; retries occur on later authorized runs, not an unbounded loop. Only approved media hosts are supported initially; unsupported hosts are recorded, not guessed.

Group all collected material by topic before selecting 3–5 Insights and 4–6 distinct Matters. A synthesis must cite at least two independent authors; single-source viewpoints must use claimType: single_source, sourcePerspective naming the author, and that author in the body. Do not invent independent corroboration. Every evidence needs sourceId from media.sources / the source registry, original quote, attribution, URL, and Chinese translation for English. Use a complete sentence that is actually present in the source. Do not reconstruct quoted-post context that was not collected.

curated.selection.sources must contain one record for EVERY collected tweet/blog/podcast: {sourceId, decision: used|excluded, reason}. Source IDs are x:<tweet id>, blogs:<guid/id/url>, podcasts:<guid/id/url>. Record topic/quality/duplication reasons, not a generic claim that excluded material is unimportant. Used decisions must match actual evidence, Matters and reading articles.

curated.mediaReview = {decisions:[{mediaId,decision:use|exclude,reason}],degradedReason}. Review every available image belonging to an adopted source. Exclude irrelevant logos, avatars or decorative material with a reason; no arbitrary quota or forced filler. Copy approved candidate src, originalUrl, sourceUrl, attribution and sha256, add mediaId=candidate.id and accurate Chinese alt. Keep downloaded local assets. Images in articles use type:image. If collection failed, remained unverified, or no relevant image was included, include a truthful degradedReason. The output status is degraded, not fully illustrated success.

New content must pass validateQuality against the complete publisher snapshot before files are rendered. Publication verification rechecks the exact snapshot hash and content-quality result as well as HTTP and image bytes. Existing 09:00 schedule and notification destinations are unchanged. Page edits remain local until explicit publication approval.

原定时命令与09:00调度不变。结果必须区分上线成功与内容降级；contentStatus=degraded 时报告简短真实原因。若发布复采新增未审阅图，按报错中的保存快照重新审阅并更新策划，不自动跳过验收。
