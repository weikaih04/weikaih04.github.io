// Run with Playwright installed: node --test tests/research-alignment.browser.cjs
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { createServer } = require("node:http");
const { join, extname } = require("node:path");
const { test } = require("node:test");

const root = join(__dirname, "..");

test("research rows align across desktop wraps and flow naturally on mobile", async () => {
  const { chromium } = require("playwright");
  // Preview the real template, content, CSS and JS without requiring Jekyll.
  const server = createServer((req, res) => {
    const path = new URL(req.url, "http://localhost").pathname;
    try {
      let content, type;
      if (path === "/") {
        const body = readFileSync(join(root, "index.html"), "utf8").replace(/^---\n[\s\S]*?---\n/, "");
        content = readFileSync(join(root, "_layouts/default.html"), "utf8")
          .replace("{{ content }}", body).replace(/{% seo %}/g, "")
          .replace(/{{ site.lang[^}]+}}/, "en-US")
          .replace(/{{[^}]*\/assets\/css\/style.css[^}]*}}/, "/assets/css/style.css")
          .replace(/{{[^}]*\/assets\/js\/publications.js[^}]*}}/, "/assets/js/publications.js")
          .replace(/{{[^}]*\/files\/favicon.ico[^}]*}}/, "/files/favicon.ico");
        type = "text/html";
      } else if (path === "/assets/css/style.css") {
        content = readFileSync(join(root, "assets/css/style.scss"), "utf8").replace(/^---\n---\n/, "");
        type = "text/css";
      } else {
        content = readFileSync(join(root, path));
        type = ({ ".js": "text/javascript", ".json": "application/json", ".mp4": "video/mp4",
          ".jpg": "image/jpeg", ".svg": "image/svg+xml" })[extname(path)] || "application/octet-stream";
      }
      res.writeHead(200, { "Content-Type": type });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage({ reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", error => errors.push(String(error)));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForSelector(".theme .tags");
    await page.evaluate(() => document.fonts.ready);

    async function measure() {
      return page.locator(".theme").evaluateAll(themes => themes.map(theme => {
        const box = selector => {
          const el = theme.querySelector(selector), rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return { top: rect.top, bottom: rect.bottom, height: rect.height, width: rect.width,
            left: rect.left, right: rect.right, fontSize: style.fontSize, weight: style.fontWeight,
            lineHeight: parseFloat(style.lineHeight), display: style.display };
        };
        return { media: box(".theme-media"), video: box("video"), controls: box(".theme-controls"),
          title: box("h3"), name: box("h3 .theme-name"), blurb: box(".theme-body > p"),
          tags: box(".tags"), caption: box(".theme-caption"), body: box(".theme-body") };
      }));
    }
    function near(actual, expected, label) {
      assert.ok(Math.abs(actual - expected) < 1, `${label}: ${actual} vs ${expected}`);
    }
    function aligned(cards) {
      for (const row of ["media", "video", "controls", "title", "name", "blurb", "tags"]) {
        cards.forEach(card => near(card[row].top, cards[0][row].top, `${row} tops`));
      }
      for (const card of cards) {
        near(card.media.height, card.media.width * 9 / 16, "16:9 media");
        near(card.video.height, card.media.height, "intact video canvas");
        assert.equal(card.name.fontSize, "18.4px");
        assert.equal(card.caption.fontSize, "12px");
        assert.equal(card.caption.weight, "400");
        assert.equal(card.body.display, "contents");
        assert.ok(card.blurb.top >= card.name.bottom + 9, "heading stays readable above blurb");
        assert.ok(card.tags.top >= card.blurb.bottom + 13, "links stay below the longest blurb");
      }
      cards.forEach(card => {
        near(card.media.bottom - card.caption.bottom, 6, "common caption bottom offset");
        near(card.caption.left - card.media.left, 8, "common caption left offset");
      });
    }

    for (const width of [1440, 1024, 681]) {
      await page.setViewportSize({ width, height: 1000 });
      const original = await measure();
      aligned(original);
      console.log(`${width}px heading lines: ${original.map(card => Math.round(card.name.height / card.name.lineHeight)).join("/")}`);

      // Vary actual heading widths without changing copy or font sizes.
      const widths = width === 681 ? [140, 170, 125] : [200, 255, 210];
      await page.locator(".theme h3 .theme-name").evaluateAll((names, widths) => {
        names.forEach((name, i) => { name.style.maxWidth = `${widths[i]}px`; });
      }, widths);
      const wrapped = await measure();
      aligned(wrapped);
      assert.ok(new Set(wrapped.map(card => Math.round(card.name.height / card.name.lineHeight))).size > 1,
        "exercise different heading wraps");

      // The shared blurb row must also grow from content rather than a fixed height.
      await page.locator(".theme-body > p").first().evaluate(p => { p.style.maxWidth = "130px"; });
      const taller = await measure();
      aligned(taller);
      assert.ok(taller[0].blurb.height > original[0].blurb.height);
      assert.ok(taller[1].tags.top > original[1].tags.top);
      await page.locator(".theme h3 .theme-name, .theme-body > p").evaluateAll(elements => {
        elements.forEach(el => el.style.removeProperty("max-width"));
      });
    }

    // A missing control row must not move one card's title into a different row.
    await page.locator(".theme-controls").first().evaluate(el => { el.hidden = true; });
    const fallback = await measure();
    for (const row of ["title", "blurb", "tags"]) {
      fallback.forEach(card => near(card[row].top, fallback[0][row].top, `fallback ${row}`));
    }
    await page.locator(".theme-controls").first().evaluate(el => { el.hidden = false; });

    for (const width of [680, 390]) {
      await page.setViewportSize({ width, height: 844 });
      const cards = await measure();
      for (const [i, card] of cards.entries()) {
        assert.equal(card.body.display, "block");
        near(card.blurb.top - card.title.bottom, 10, "natural title/blurb spacing");
        near(card.tags.top - card.blurb.bottom, 10, "natural blurb/link spacing");
        near(card.media.height, card.media.width * 9 / 16, "mobile media");
        if (i) near(card.media.top - cards[i - 1].tags.bottom, 32, "stacked theme spacing");
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
