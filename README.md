# Digest · v1.2.2

[阅读日报](https://genrry-ayu.github.io/digest-builders/)

中文洞察、议题，以及按实际正文显示的博客和播客阅读模块。文章保留论证与例子，配图保留来源；当前入口展示最近七个自然日，旧独立存档保留。

网站与生成逻辑统一版本管理：

- `index.html` / `digest-history.json`：页面与历史内容。
- `assets/digest/`：已核实的原文配图。
- `automation/RULES.md`：内容、界面、来源与发布规范。
- `automation/PROMPT.md`：现有每日自动化的提示词，不创建新任务。
- `automation/skills/follow-builders/`：采集脚本、skill 与固定 editorial prompts。
- `automation/scripts/`：发布器、文章 schema、本地入口安装与线上验证。

现有本地安装使用 `node automation/scripts/install-local.mjs` 链接到本仓库，旧文件先备份到本地 runs；用户配置仍在 `~/.follow-builders/config.json`，不入库。定时执行依赖现有 Codex heartbeat 与本机环境，仓库未新增 GitHub Actions 调度。

本地页面编辑：`node automation/scripts/digest-static-publisher.mjs --render-only --no-commit --no-push`。正式发布须使用当天 curated JSON，具体步骤见 RULES。只有用户明确发布后才推送临时页面编辑。
