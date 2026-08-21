# CLAUDE.md

Guidance for AI assistants working in this repository.

## What this is

The personal academic website of Weikai Huang, served at
<https://weikaih04.github.io> by **GitHub Pages** from the `master` branch.

It is a Jekyll site with **no build tooling of its own**: no `Gemfile`, no
`package.json`, no test suite, no linter. GitHub Pages builds it remotely
using the `jekyll-theme-minimal` gem. Everything in this repo is either
content (Markdown/JSON/images) or a small amount of hand-written
SCSS/JS/Python.

## Layout

```
_config.yml                  Jekyll config (theme, title, description, logo)
_layouts/default.html        The only layout; loads CSS + publications.js
index.md                     The entire site: bio, news, publications mount
                             point, experience, education, awards, teaching,
                             services
cv.md                        Small standalone page linking to the CV PDF
publications.json            Single source of truth for all publications
assets/js/publications.js    Client-side renderer for publications.json
assets/css/style.scss        All custom styling (~600 lines)
img/weikaih.jpg              Profile photo
img/icons/*.svg              Affiliation icons (uw, ai2, salesforce)
img/papers/*.{png,mp4}       Publication teaser media
files/weikai_cv.pdf          CV linked from index.md and cv.md
files/favicon.ico
fetch_metrics.py             Legacy metrics fetcher (NOT used by CI)
update_metrics.py            Metrics fetcher used by the GitHub Action
.github/workflows/update-metrics.yml
test_publications.html       Standalone harness for the publications renderer
google1bb097d7d44475e1.html  Google Search Console verification — do not touch
```

Files referenced by `_layouts/default.html` that are **not in this repo**
(they come from the `jekyll-theme-minimal` gem): `assets/js/scale.fix.js`,
`_includes/head-custom.html`, and the SCSS partials `fonts` and
`rouge-github`. Do not "fix" the missing-file references.

## How the page is assembled

1. Jekyll renders `index.md` (which contains a lot of raw HTML) into
   `_layouts/default.html`.
2. `assets/css/style.scss` is compiled by Jekyll. It **must** keep its empty
   YAML front matter (`---` / `---`) at the top or Jekyll will copy it
   through unprocessed and the site will lose all styling.
3. In the browser, `publications.js` runs on `DOMContentLoaded`, fetches
   `publications.json`, and injects HTML into `<div id="publicationsList">`.

Publications are **not** rendered by Jekyll. They are client-side only, so a
publications change is visible without a rebuild once the JSON is deployed.

## publications.json

One top-level key, `publications`, an array of objects. Order in the array is
the display order (newest first by convention). Current entry ids:
`molmoact2`, `wilddet3d`, `ipt`, `svg2`, `molmo2`, `sos`, `trajtok`, `gas`,
`provision`, `tma`, `mms`.

Fields, as consumed by `assets/js/publications.js`:

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Slug; used for DOM ids (`tldr-<id>`, `stars-<id>`) — must be unique |
| `title` | yes | |
| `authors` | yes | Array of strings; see author markers below |
| `venue`, `year` | yes | Rendered as `**venue** year` |
| `selected` | yes | `true` = shown under the "Selected" toggle |
| `tldr` | — | Collapsible "TL;DR" blurb |
| `links` | yes | Object; only whitelisted keys render (see below) |
| `image` | — | Static teaser, e.g. `img/papers/gas.png` |
| `local_video` | — | Autoplaying muted teaser, e.g. `img/papers/ipt.mp4` |
| `playback_rate` | — | Speed for `local_video`; **defaults to 3** if omitted |
| `video` | — | YouTube URL → iframe embed (no current entry uses it) |
| `github_repo` | — | `owner/name`; enables the ⭐ star badge on the Code link |
| `arxiv_id` | — | e.g. `2510.09110`; used by the citation fetcher |
| `github_stars`, `citations` | — | **Machine-written.** See automation below |
| `oral` | — | Boolean; appends a red "(Oral)" |
| `award` | — | String; appended in red parentheses |
| `additional_venue` | — | Second venue line, `(Oral)` inside is auto-reddened |
| `highlight` | — | Extra callout line (HTML allowed) |

Media precedence in the renderer: `local_video` → `video` → `image`.

**Author markers.** `*` (equal contribution) is plain text. `§` (core
contributor) is rewritten by `formatAuthor()` into
`<sup class="author-contribution-mark">`. Any author string containing
`Weikai Huang` is automatically bolded — do not add `<strong>` by hand. The
legend for both markers lives in `index.md` under `## Publications`.

**Link keys are whitelisted.** `publications.js` renders only the keys in
`linkOrder` (`arxiv`, `code`, `eval`, `paper`, `website`, `huggingface`,
`demo`, `blog`, `talk`, `data`, `models`) in that fixed order. Adding a new
kind of link means editing both `linkOrder` and `linkLabels` in
`assets/js/publications.js` — a key that exists only in the JSON silently
does not render.

## Metrics automation — do not hand-edit

`.github/workflows/update-metrics.yml` runs `update_metrics.py` every 6
hours (and on `workflow_dispatch`), and commits any diff to
`publications.json` as `🤖 Auto-update publication metrics`. Most of this
repo's history is those bot commits.

Consequences for anyone editing:

- **Never hand-edit `github_stars` or `citations`.** They are overwritten.
- Rebase/merge conflicts in `publications.json` are almost always in those
  two fields. Take either side; the next bot run corrects it.
- Adding `github_repo` / `arxiv_id` to an entry is how you opt it *into*
  metric fetching. `arxiv_id` values ending in `xxxxx` are treated as
  placeholders and skipped.
- `citations` is fetched and stored but **not displayed** — the display code
  in `publications.js` (`displayPreFetchedMetrics`, the citation placeholder
  in `createPublicationHTML`) is deliberately commented out. Leave it that
  way unless asked to re-enable it.

Two known quirks worth not "fixing" blindly:

- The workflow's `push` trigger watches branch `main`, but the default
  branch is `master`, so only the cron and manual triggers actually fire.
- `fetch_metrics.py` is an older variant: it needs the third-party
  `requests` package and scrapes ids out of `links.code` / `links.arxiv`
  instead of reading `github_repo` / `arxiv_id`. CI does not use it.
  `update_metrics.py` is stdlib-only and is the live one.

## Local development

There is no `Gemfile`, so `bundle exec jekyll serve` will not work as-is
(the README's instructions are aspirational). Options:

```bash
# Quick static check of the publications renderer only.
python3 -m http.server 8000
# → http://localhost:8000/test_publications.html
```

`test_publications.html` is a self-contained harness that loads
`assets/js/publications.js` against the real `publications.json`. It expects
compiled CSS at `/assets/css/style.css`, which only exists after a Jekyll
build, so it is useful for verifying rendering logic and data, not layout.

For a full preview you must add a `Gemfile` with `github-pages` (do not
commit it unless asked) or push to a branch and rely on the Pages build.

**Validate JSON edits before committing** — a malformed `publications.json`
silently empties the publications section in production:

```bash
python3 -m json.tool publications.json > /dev/null && echo OK
```

## Content conventions

- **News** (`index.md`, `## News`): reverse chronological, one bullet per
  item, dated `**[YYYY-M]**`. Adding a paper usually means both a news
  bullet and a `publications.json` entry.
- **Publication images**: containers are locked to 16:9 with
  `object-fit: contain`, so teasers are letterboxed rather than cropped.
  The `sos` entry is the one special case — `publications.js` hardcodes
  `id === 'sos'` to add `.image-cover` (`object-fit: cover`). If a new
  teaser needs the same treatment, extend that check rather than adding a
  second mechanism.
- **Videos** autoplay muted, loop, and are `playsinline`. Browsers reset
  `playbackRate` on load and on each loop, so `applyVideoPlaybackRates()`
  re-applies it on `loadedmetadata` / `play` / `ratechange`. Keep that
  handler if you touch the video path.
- **Styling** is all in `assets/css/style.scss` (custom rules layered over
  the theme import). The body font is **Inter**, loaded from Google Fonts in
  `_layouts/default.html`. Accent red for awards/orals is `#b91c1c`; the
  core-contributor mark is `#F26035`. There is no dark mode.
- Content width is capped at 800px; mobile breakpoints live near the bottom
  of the SCSS.

## Git workflow

- Default branch is **`master`**; GitHub Pages deploys from it.
- Commit messages follow Conventional Commits for human changes
  (`fix:`, `docs:`, `feat:`).
- Work on the feature branch you were assigned and push with
  `git push -u origin <branch>`. Do not open a pull request unless
  explicitly asked.
- Expect the bot to have pushed to `master` since you last fetched; pull
  before branching off it.

## Known stale bits (in case you notice them)

These are real inconsistencies, not things to fix on your own initiative:

- `README.md` claims the site uses EB Garamond; it uses Inter.
- `README.md` links `USAGE_GUIDE.md` and `CHANGES.md`; neither exists.
- `Screenshot 2026-02-27 at 12.50.29.png` (~1 MB) sits unreferenced at the
  repo root.
- `cv.md` points at `/files/weikaih_cv_1222_2024.pdf`, but the file on disk
  is `files/weikai_cv.pdf` — the link is broken. `index.md` links the
  correct path.
