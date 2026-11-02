# Digest 策划规则 v1.2.2
只以 prepare-digest.js 完整 JSON 为事实来源。输出中文 curated JSON：3–5 条 highlights（tag/title/body/evidence）和 4–6 条 matters（kind/title/detail/url），另有 articles.blogs、articles.podcasts。洞察必须是有因果分析的判断，准确原文证据与分析互补；议题不与洞察重复，不为数量拆分同一观点。无博客不是停止理由，整体材料不足才停止。
页面固定顺序：洞察、议题、博客、播客。阅读模块有正文才出现，不恢复 Sources、标签、英文小标题或折叠证据。每条 evidence 保留原文 quote、attribution、url；英文增加 translation。人名不翻译。
节目标题、来源、日期明确且 transcript 非空时，即使只有频道链接也可用；保留链接范围元数据，不伪造单集 URL，不把溯源说明追加进议题正文。保留 errors 和来源日期，不能把历史兜底材料说成今日发布。
阅读文章和配图遵循 automation/scripts/digest-articles.md；使用 sourceTextSha256 锁定正文。不得抓取额外材料补事实，不发送外部消息。
