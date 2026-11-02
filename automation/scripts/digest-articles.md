# Digest 阅读模块 v1.0.0

2026-11-02 用户要求：在洞察、议题之后增加同级的「博客」「播客」模块。
这是现行内容结构的扩展，不恢复旧的 Sources 来源索引。

## 内容策划

- 每篇博客或每期播客独立整理为中文文章，保留原意、论证顺序、因果链、重要例子、数据、限制条件和结论。去掉口头语、重复问答、广告和无关寒暄，不压成几条摘要；长度随材料决定。
- 采用自己的连贯叙述，不能逐句翻译或近乎完整改写版权原文。清楚区分作者自述、案例和可验证的效果，不把主张改成已证实事实。
- 只依据本次采集 JSON 的正文或 transcript。只有标题、链接、短摘要时不扩写成长文；无可用正文的类别用空数组，页面完全隐藏该类别，不显示空标题或占位文案。
- 图片放在相关段落之间。只使用 JSON 中可确认归属的图片，或用户已授权核实并保存在本地的原图；不猜图片地址、不添加装饰图。图片有中文 alt 和来源元数据，保留完整比例，可点击看大图。
- 正文使用 paragraph / heading / image 块，不存任意 HTML。保留标题、作者、来源、原始发布日期和原文链接。节目只有频道链接时遵循 OPERATIONS 的文字稿使用规则，不伪造单集 URL。
- 长文章仅在其所在模块后面还有可见模块时折叠，提供「展开全文 / 收起全文」按钮；最后一个模块始终完整显示、不出现按钮。折叠在段落边界结束，不删除正文或图片。

## curated 扩展字段

原 highlights / matters 字段不变，新增：

```json
{
  "articles": {
    "blogs": [],
    "podcasts": [
      {
        "title": "中文文章标题",
        "sourceTitle": "采集条目的原始标题",
        "sourceId": "采集条目的 guid 或 id，没有则省略",
        "sourceUrl": "原始链接或经用户授权核实的单集链接",
        "sourceName": "节目或博客名",
        "author": "作者或受访者姓名",
        "publishedAt": "采集条目的原始日期",
        "sourceTextSha256": "正文 trim 后的 SHA-256 十六进制摘要",
        "blocks": [
          { "type": "paragraph", "text": "开篇正文" },
          { "type": "heading", "text": "小节标题" },
          { "type": "paragraph", "text": "连贯的文章段落" },
          {
            "type": "image",
            "src": "assets/digest/YYYY-MM-DD/image.png",
            "alt": "准确的中文图像描述",
            "width": 1280,
            "height": 720,
            "sourceUrl": "图片所在原文页面",
            "originalUrl": "核实后的原图地址",
            "attribution": "图片来源"
          }
        ]
      }
    ]
  }
}
```

正文取值与发布器一致：播客用 transcript；博客依次取 content、text、markdown、body 中第一个非空字符串。不用 summary 代替正文。摘要计算为 `createHash('sha256').update(text.trim()).digest('hex')`。

发布器再次采集后，按 sourceTitle 和 sourceId 匹配来源；没有 sourceId 时同时匹配 sourceUrl。正文缺失或哈希变化会中止，需重新策划。历史条目没有 articles 时正常显示原有模块，不补造历史文章。

## 本地页面编辑

用户尚未确认发布的页面调整，只运行 `--render-only --no-commit --no-push`。保留图片资产和文章数据，待用户明确要求发布后再提交、推送。日期、七个自然日历史、降级记录与每日内容质量要求保持现行规则。
