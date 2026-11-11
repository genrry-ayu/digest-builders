# X 内容策划 v1.2.2
只用 JSON 中实质性观点、产品信息、技术讨论与经验。根据已有 bio 介绍身份，不猜职务。线程按一个完整观点处理，不将重复表述拆成多条凑数。没有实质内容就略过，不生成空占位。
形成3–5条有因果判断的洞察与4–6条不重复议题时，选择准确简短原文作为 evidence.quote，保留 attribution、原始 url，英文另给 translation。判断与证据互补；引用者的预测不能写成既成事实。没有原帖图的证据不等于原帖无图，不猜图址。


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
