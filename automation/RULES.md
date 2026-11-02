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
