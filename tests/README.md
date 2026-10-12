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

This checkout uses Jekyll, but has no Gemfile and the current machine has no
Jekyll or Sass compiler installed. A raw Python HTTP server cannot compile
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

Check desktop widths around 1024px and 1440px, a narrower desktop around 900px,
and mobile around 390px. The category grid uses an **880px publication-container
breakpoint**, giving two equal columns of at least 424px with a 32px gap. The
existing site caps of 920px and 1040px make this reachable on desktop without
changing the biography or site width. Wide cards place 16:9 media above text
and keep the existing font sizes. Below the breakpoint, categories stack;
cards retain the existing desktop side-by-side and mobile vertical layouts.
Browsers without container-query support also receive the stacked layout.

Toggle All and Selected; inspect both category counts, GitHub stars and videos.
Open `http://127.0.0.1:4000/#pub-sos` and `/#pub-gas` directly, and click their
biography links after switching back to Selected. Each should reveal All and
scroll to its unique card. Confirm TLDR controls still expand/collapse.
