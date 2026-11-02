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
