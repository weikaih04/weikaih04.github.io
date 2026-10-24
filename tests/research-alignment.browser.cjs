// Run with Playwright installed: node --test tests/research-alignment.browser.cjs
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { createServer } = require("node:http");
const { join, extname } = require("node:path");
const { test } = require("node:test");

const root = join(__dirname, "..");

test("exact research titles fit standard desktop and wrap naturally at narrower widths", async () => {
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
    assert.equal(await page.evaluate(() => document.fonts.check('500 14px "Source Serif 4"')), true,
      "measure the loaded page font");

    async function measure() {
      return page.locator(".theme").evaluateAll(themes => themes.map(theme => {
        const box = selector => {
          const el = theme.querySelector(selector), rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return { top: rect.top, bottom: rect.bottom, height: rect.height, width: rect.width,
            left: rect.left, right: rect.right, fontSize: style.fontSize, weight: style.fontWeight,
            lineHeight: parseFloat(style.lineHeight), display: style.display,
            whiteSpace: style.whiteSpace, textOverflow: style.textOverflow,
            overflow: style.overflow, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
        };
        return { media: box(".theme-media"), video: box("video"), title: box("h3"),
          name: box("h3 .theme-name"), tags: box(".tags"), caption: box(".theme-caption") };
      }));
    }
    function near(actual, expected, label) {
      assert.ok(Math.abs(actual - expected) < 1, `${label}: ${actual} vs ${expected}`);
    }
    assert.equal(await page.locator(".theme-controls, .theme-body, .theme [data-video], .theme video[controls]").count(), 0);
    assert.deepEqual(await page.locator(".theme h3").allTextContents(), [
      "3D perception & generation in the wild", "Vision-centric robot policies", "VLMs for Embodied Reasoning"
    ]);
    for (const width of [1440, 1024, 801, 800, 720, 681, 680, 390, 280]) {
      await page.setViewportSize({ width, height: 1000 });
      const cards = await measure();
      for (const [i, card] of cards.entries()) {
        near(card.media.height, card.media.width * 9 / 16, "16:9 media");
        near(card.video.height, card.media.height, "intact video canvas");
        assert.equal(card.name.fontSize, "14px");
        assert.equal(card.name.weight, "500");
        assert.equal(card.name.whiteSpace, "normal");
        assert.equal(card.name.textOverflow, "clip");
        assert.equal(card.name.overflow, "visible");
        assert.ok(card.name.scrollWidth <= card.name.clientWidth, "complete title fits without clipping");
        if (width >= 1024) {
          near(card.media.width, 258.66, "standard desktop column width");
          near(card.name.height, card.name.lineHeight, `${width}px single-line title`);
        }
        assert.ok(card.name.left >= card.media.left && card.name.right <= card.media.right + 1, "title fits card");
        assert.equal(card.caption.fontSize, "12px");
        assert.equal(card.caption.weight, "400");
        near(card.media.bottom - card.caption.bottom, 6, "caption bottom offset");
        near(card.caption.left - card.media.left, 8, "caption left offset");
        near(card.title.top - card.media.bottom, 12, "media/title spacing");
        near(card.tags.top - (width > 680 ? Math.max(...cards.map(c => c.title.bottom)) : card.title.bottom), 8,
          "links follow the tallest title in a shared row");
        if (width > 680) {
          for (const row of ["media", "video", "title", "name", "tags"]) {
            near(card[row].top, cards[0][row].top, `${width}px ${row} tops`);
          }
        } else if (i) near(card.media.top - cards[i - 1].tags.bottom, 32, "stacked theme spacing");
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (width === 720 || width === 681 || width === 280) {
        assert.ok(cards[0].name.height > cards[0].name.lineHeight * 1.5, `${width}px first title wraps naturally`);
      }
      console.log(`${width}px: title lines ${cards.map(c => Math.round(c.name.height / c.name.lineHeight)).join("/")} at ${cards[0].name.fontSize}, weight ${cards[0].name.weight}`);
    }

    // Exercise actual focus, keyboard input and media events in Chrome.
    await page.setViewportSize({ width: 1440, height: 1000 });
    const video = page.locator("#theme-video-3d");
    await video.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector("#theme-video-3d").readyState >= 2);
    assert.equal(await video.evaluate(v => v.paused), true, "reduced motion starts static");
    await video.focus();
    const scrollY = await page.evaluate(() => window.scrollY);
    await page.keyboard.press("Space");
    await page.waitForFunction(() => !document.querySelector("#theme-video-3d").paused);
    await page.waitForFunction(() => document.querySelector("#theme-video-3d").getAttribute("aria-label").startsWith("Pause "));
    assert.match(await video.getAttribute("aria-label"), /^Pause /);
    assert.equal(await page.evaluate(() => window.scrollY), scrollY);
    await page.keyboard.press("Enter");
    assert.equal(await video.evaluate(v => v.paused), true);
    await video.click();
    await page.waitForFunction(() => !document.querySelector("#theme-video-3d").paused);
    assert.equal(await page.locator("#lightbox").evaluate(lb => lb.open), false);
    await video.click();

    await page.locator('.theme h3 [data-theme-filter="robotics"]').click();
    assert.equal(await page.locator('#filters [data-f="robotics"]').getAttribute("aria-pressed"), "true");
    assert.ok(await page.locator("#pub-reflex").count());
    assert.equal(await page.locator("#pub-molmo2").count(), 0);
    await page.locator('.theme .tags [data-jump="molmo2"]').click();
    assert.ok(await page.locator("#pub-molmo2").count());
    await page.locator("#pub-molmo2 .media").click();
    assert.equal(await page.locator("#lightbox").evaluate(lb => lb.open), true);
    assert.match(await page.locator("#lbVideo").getAttribute("src"), /img\/papers\/molmo2.mp4$/);
    await page.locator("#lbClose").focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.locator("#lightbox").evaluate(lb => lb.open), false);

    await page.emulateMedia({ reducedMotion: "no-preference" });
    await video.scrollIntoViewIfNeeded();
    // A manual pause persists through preference changes; Space explicitly resumes it.
    assert.equal(await video.evaluate(v => v.paused), true);
    await video.focus();
    await page.keyboard.press("Space");
    await page.waitForFunction(() => !document.querySelector("#theme-video-3d").paused);
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector("#theme-video-3d").paused);
    await video.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => !document.querySelector("#theme-video-3d").paused);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(() => document.querySelector("#theme-video-3d").paused);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
