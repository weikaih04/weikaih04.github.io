# Publication checks and local preview

Run the renderer tests without installing dependencies:

```sh
node --test tests/publications.test.cjs
node --check assets/js/publications.js
python3 -m json.tool publications.json > /dev/null
git diff --check
```

The tests execute the actual browser renderer in Node's VM with minimal DOM,
fetch, and video stubs. They cover category metadata, semantic headings,
Selected (3 + 3) and All (3 + 10), source ordering, unique IDs, missing categories,
the shared toggle, metrics, unchanged card markup, TLDR expansion, deep links,
and video playback rates/events.

Run the deterministic browser layout regression with Python 3.11, uv, and Node/npm:

```sh
uv run --python 3.11 --with playwright==1.63.0 python -m playwright install chromium
uv run --python 3.11 tests/publications-layout.py
```

The browser test compiles the actual `assets/css/style.scss` with Dart Sass
1.77.8, loads the actual renderer and publication JSON, and prepends
`tests/fixtures/minimal-sections.css`. This pinned fixture reproduces Minimal's
`section { width: 500px; float: right; padding-bottom: 50px; }` plus its responsive
section border, padding, and margin rules. An unclassified section verifies that
the fixture is active. Theme imports are replaced by this fixture; fonts and
media requests are blocked, and no preview server or production access is used.
Dependencies may need downloading on the first run. To use an already installed
Sass CLI, set `SASS_COMMAND='sass'` (or `SASS_COMMAND='node /path/to/sass.js'`).

The matrix covers 1080×1920 (the reported production failure), 1920×2560,
390×844, 900×600, 1024×768, 1920×1080, and a square viewport. It also constrains
publication content independently of the viewport to 700px and 911/912/913px.
Every case runs Selected → All → Selected, with collapsed and expanded TLDRs.
Assertions measure actual category bounding-box nonintersection, portrait
stacking, the 64px landscape gutter, equal column widths, media above content in
two columns, card/content/link/control containment, and document/card overflow.
They also check section resets, category counts, existing title/author font
sizes, and browser errors. The existing nine Node tests remain unchanged.

Before the CSS fix, this test failed all 33 viewport/filter combinations,
including intersecting 500px category boxes on 444px tracks at 1080×1920.
After the fix, the same regression passes: that viewport has one 920px track;
912px landscape content has two 424px tracks separated by 64px.

This checkout uses Jekyll, but has no Gemfile. A raw Python HTTP server cannot compile
`style.scss` or render `index.md`. To preview the actual site and stylesheet,
use the existing Jekyll layout with dependencies and build output in a temporary
directory. With a modern Ruby and Bundler installed, run from the repo root:

```sh
preview_dir=$(mktemp -d /tmp/academic-publications-preview.XXXXXX)
cat > "$preview_dir/Gemfile" <<'GEMS'
source 'https://rubygems.org'
gem 'jekyll'
gem 'jekyll-theme-minimal'
gem 'webrick'
GEMS
export BUNDLE_GEMFILE="$preview_dir/Gemfile"
export BUNDLE_PATH="$preview_dir/bundle"
bundle install
bundle exec jekyll serve --source "$PWD" \
  --destination "$preview_dir/site" --disable-disk-cache \
  --host 127.0.0.1 --port 4000
```

Visit `http://127.0.0.1:4000/`. Jekyll compiles the real SCSS (including theme
imports) into `/assets/css/style.css`; the page loads the real publication JSON
and JavaScript. Nothing is published.

Check portrait and landscape at desktop widths around 1024px and 1440px, a
narrower desktop around 900px, and mobile around 390px. Categories always stack
in portrait (and square) viewports. Landscape requires a **912px
publication-container breakpoint**, giving two equal columns of at least 424px
with a 64px gutter. The existing site caps of 920px and 1040px make this reachable
on desktop without
changing the biography or site width. Wide cards place 16:9 media above text
and keep the existing font sizes. Below the content breakpoint, categories stack;
cards retain the existing desktop side-by-side and mobile vertical layouts.
Browsers without container-query support also receive the stacked layout.

Toggle All and Selected; inspect both category counts, GitHub stars and videos.
Open `http://127.0.0.1:4000/#pub-sos` and `/#pub-gas` directly, and click their
biography links after switching back to Selected. Each should reveal All and
scroll to its unique card. Confirm TLDR controls still expand/collapse.
