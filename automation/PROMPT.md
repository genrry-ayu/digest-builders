每天北京时间 09:00 在原绑定聊天生成并发布当天 AI Builders Digest，不创建、分叉、委派或切换聊天/子任务，不重复迁移或创建调度。先完整阅读 /Users/genrryli/business-automations/OPERATIONS.md、/Users/genrryli/business-automations/MIGRATION_PROMPT.md 第2、3节，以及 /Users/genrryli/business-automations/repos/digest-builders/automation/RULES.md、automation/skills/follow-builders/SKILL.md、automation/scripts/digest-articles.md；以仓库中 v1.2.2 现行规则为准。

用 /usr/local/bin/node 运行 /Users/genrryli/business-automations/source/skills/follow-builders/scripts/prepare-digest.js，完整 JSON 保存到 /Users/genrryli/business-automations/runs，检查 stats/errors/来源日期并保留降级状态；日常不得另行抓取或搜索补事实。生成中文 3–5 条有判断、因果分析和准确原文依据的 highlights（tag/title/body/evidence，evidence 含 quote/attribution/url，英文另加 translation），4–6 条不重复 matters（kind/title/detail/url）。博客缺少不单独阻止发布；明确节目、标题、日期的非空播客 transcript 可用，频道链接只如实保留链接范围元数据，不伪造单集 URL。整体有效材料不足则停止。

有正文或 transcript 时，增加同级 articles.blogs / articles.podcasts，按文章规范整理成精简而连贯的中文文章，保留叙事逻辑、关键例子和边界；只有摘要不扩写，无正文则整个模块隐藏。保留 sourceId/sourceTitle/sourceUrl/publishedAt/sourceTextSha256。相关已核实原图放入洞察、议题和文章，附中文 alt 与图片来源；不猜图、不引入新事实。

按 RULES 做仓库安全检查，写 curated JSON，再执行 /usr/local/bin/node /Users/genrryli/business-automations/source/scripts/digest-static-publisher.mjs --curated-file=<绝对路径>。保留 Digest 暖灰界面、中文默认展开证据、14px 卡片标题、精简统计、洞察/议题/博客/播客结构和有后续模块才折叠长文的行为；不恢复 Sources、标签、旧副标题或来源尾注。保留7个自然日历史与旧存档。日期使用 Asia/Shanghai，禁止 DIGEST_DATE。核对复采完整 JSON 与 errors/来源日期仍支持全部策划，文章哈希变化须重新策划。

调用 /usr/local/bin/node /Users/genrryli/business-automations/verify-digest.mjs <curated绝对路径>，确认 https://genrry-ayu.github.io/digest-builders/ HTTP 200、当天 DIGESTS、至少3个真实洞察标题、文章与图片；有界重试后失败如实报告。当前聊天只追加日期、链接、成功或失败及实际错误，不发微信、飞书或其他聊天。用户临时页面编辑先本地预览，明确要求发布后再 push；既有每日定时内容发布授权保持。
