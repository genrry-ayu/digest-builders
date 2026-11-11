# Digest 现行规则 · v1.2.2

本文件是页面、内容与自动化的统一规范，取代旧 skill、远程 prompts 和迁移文档中冲突的 Digest 说明。

## 执行与仓库

- 既有任务 `ai-builders-digest` 每天北京时间 09:00 在原绑定聊天运行。不得创建、分叉、委派或切换聊天/子任务，不新建调度，不发微信、飞书或其他聊天消息。
- 日期只用 Asia/Shanghai 实时时间，不设置 DIGEST_DATE，不把历史材料伪装成当天来源。
- 仓库固定 `https://github.com/genrry-ayu/digest-builders.git`，main；入口固定 `https://genrry-ayu.github.io/digest-builders/`。
- 日常发布前核对分支、origin、暂存区与工作树（包括未跟踪文件）；应干净。fetch 后仅安全快进；分叉或无关改动立即停止，不 reset/force push。用户明确要求发布本地编辑时，逐项审查并只提交获准文件。
- 代码、skill、prompts、文章规范均在本仓库 automation/ 下维护。`scripts/install-local.mjs` 将旧本地入口及用户 prompt 覆盖链接到这些文件，先备份既有文件；后续代码不维护两套副本。个人配置、凭据、运行记录不入库。

## 采集和策划

1. 完整阅读本文件、`skills/follow-builders/SKILL.md` 与 `scripts/digest-articles.md`。
2. 用 `/usr/local/bin/node` 运行 `skills/follow-builders/scripts/prepare-digest.js`，完整 JSON 保存到 `~/business-automations/runs`。检查 stats、errors、每条来源日期与 feedGeneratedAt。
3. JSON 是唯一事实来源。日常运行不另行抓取文章、搜索补事实或猜链接。三个 feed 并行；每次完整下载最多 15 秒、总计 2 次，远程→缓存→包内历史快照。prompt 用户覆盖→远程→缓存→包内；当前仓库 prompts 必须安装为用户覆盖。
4. 生成中文 3–5 条不重复洞察：tag/title/body/evidence；每条 evidence 有准确原文 quote、attribution、url，英文另加 translation。正文是有因果分析的判断，与证据互补。再生成 4–6 条不重复议题：kind/title/detail/url。不为凑数量拆分同一观点。博客为 0 不单独阻止发布；有效材料整体不足才停止。
5. 播客有明确节目、单集标题、日期及非空 transcript 时，即使仅频道 URL 也可采用。保留来源身份和 `linkScope: "channel"` 元数据，不称其为单集链接、不伪造 URL；不要把冗长来源/缺失链接说明追加进议题正文。用户授权核实的单集 URL 可附验证来源记录。
6. 每篇有正文的博客、播客独立整理为中文阅读文章：保留原意、叙事顺序、因果链、重要案例与限制；去重复和口头语，用自己的精简表述，不逐句翻译或近乎完整改写版权原文。只拿到标题、链接或 summary 不扩写。详见文章 schema。
7. 有相关原图则嵌入洞察、议题或文章；只用 JSON 明确提供或用户已授权核实的图片。保存中文 alt、原图 URL、来源页面和归属，下载为 assets/digest/YYYY-MM-DD/ 下资产。无图就不放，不猜图址。不得借下载图片补充正文事实。
8. 保留准确原文和来源元数据、errors、sourceGeneratedAt，不能因 UI 删除来源区而删除溯源数据。英文引文显示中文翻译，人名保持原文。

## 页面与阅读行为

- 标题仅 **Digest**；无 Daily signal brief。非常浅的暖灰底 #f7f6f3、暖白卡片 #fcfbf9、引文底 #f2f0eb；主标题与同级模块标题使用 "Iowan Old Style", Baskerville, "Songti SC", serif；日期入口与菜单使用原等宽字体，统计与正文使用原系统无衬线字体；保留响应式布局。
- 标题到日期信息行间距 12px；日期与灰色英文统计 `1 Podcast · 8 Builders · 13 Tweets · 0 Blogs` 同行，整行统一 12px，两者间距 16px，不加分割线。窄屏空间不足时自然换行，行距 8px；统计随所选日期更新，英文名称按数量使用单复数，日期控件无障碍标签也使用英文。
- 每次页面加载或刷新（手动、自动）都选择现有数据中最新日期，并同步 URL；不沿用 URL 中旧日期。加载后仍可手动切换历史日期。
- 日期采用自定义暖灰菜单，不使用系统 select；暖白面板、细边框、轻阴影，当前日期以浅暖灰底和勾选标识。鼠标点击入口不显示聚焦框；键盘保留可见焦点，支持方向键、Home/End、Enter/Space、Esc，点击外部或焦点移出时关闭。
- 所有模块共用 800px 最大栏宽并居中，文章不另设更窄宽度；窄屏自适应，桌面左右至少留 24px，手机左右留 16px。
- 博客/播客文章主标题 22px、字重 600、行高 1.45；正文与文章内小标题仍为 14px。
- 同级模块标题依次 **Insights、Matters、Blogs、Podcasts**，标题以下内容保留中文。阅读类别无正文时完全隐藏，不显示空标题。Sources 索引、标签及旧中英双语副标题保持删除。
- 洞察/议题标题 14px、加粗，与正文间距 4px；正文 14px。议题标题为普通文字。证据默认展开，无折叠提示与证据上方分割线；模块之间无分割线。
- 文章保留完整内容与图片。正文超过 600px 且所在模块后还有可见模块时，约 420px 的完整段落预览后提供「展开全文 / 收起全文」；最后模块完整显示，不出现按钮。
- 图片保持完整比例、适配窄屏、可点击看大图。日期入口和菜单省略年份，显示 `MM.DD`；无障碍标签保留完整日期，数据日期与 `?date=YYYY-MM-DD` 保持 ISO 格式。
- 每天替换当天条目，展示当天至前 6 个自然日的最多 7 条历史；旧独立 HTML 存档和图片资产保留。

- 同级模块标题所有屏宽统一 24px；卡片内边距统一 20px；日期文字与箭头间距 8px。模块上内边距桌面 36px，640px 及以下保留 32px。

## 发布和验收

正式日更必须给 `scripts/digest-static-publisher.mjs --curated-file=<绝对路径>`。发布器再次采集；正文身份和 SHA-256 不一致时中止。核对新来源仍支持洞察、议题及文章，发生变化则重新策划。原始采集与复采的完整 JSON 均保存在本地 runs，并保留真实错误。

发布内容变更只暂存 index.html、digest-history.json、favicon.svg 和相关 assets/digest 资产，不混入其他文件。规则/代码变更由用户授权后单独检查并提交。

运行 `scripts/verify-digest.mjs <同一curated绝对路径>`：固定入口 HTTP 200、当天 DIGESTS 至少三个真实洞察标题、当前策划/文章数据与图片均须匹配；最多 3 次，每次间隔 45 秒，最终失败如实报告。push 成功不等于上线验收。

验证下载沿用 `~/.follow-builders/config.json` 的 network.proxy（空字符串为直连），与采集器一致。本机 Homebrew Git 如出现 HTTP 400 / sideband 断开，核对远端提交后可用系统 `/usr/bin/git`、单次 `-c http.version=HTTP/1.1` 和现有 gh credential helper 重试一次；不改全局网络或凭据配置，不 force push。无论如何仍须通过 Pages 内容与资产验证。

用户本地编辑先用 `--render-only --no-commit --no-push` 预览，明确说发布后才提交/推送；既有每日定时内容发布授权保持。`--no-push` 仍可 commit，`--no-commit --no-push` 仍可写页面，不能当作无副作用检查。

当前聊天简洁报告日期、固定链接、成功/失败及实际错误，不发送其他聊天。


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
