# /// script
# requires-python = ">=3.11"
# dependencies = ["playwright==1.63.0"]
# ///
"""Measure real publication geometry under Jekyll Minimal's legacy CSS.

Run with uv; Sass is compiled by npm (override SASS_COMMAND for a local CLI).
No preview server, external fonts/media, or production requests are needed.
"""

import json
import os
from pathlib import Path
import re
import shlex
import subprocess
import unittest

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "http://publications.test"
CASES = [
    # Reported production geometry: 920px content, previously 444px tracks.
    (1080, 1920, None, False),
    (1920, 2560, None, False),
    (390, 844, None, False),
    (900, 600, None, False),
    (1024, 768, None, True),
    (1920, 1080, None, True),
    # Test available CONTENT width independently of viewport width/orientation.
    (1920, 1080, 911, False),
    (1920, 1080, 912, True),
    (1920, 1080, 913, True),
    (1920, 1080, 700, False),
    (1080, 1080, None, False),
]

MEASURE = """() => {
    const rect = el => {
        const {left, right, top, bottom, width, height} = el.getBoundingClientRect();
        return {left, right, top, bottom, width, height};
    };
    const list = document.querySelector('#publicationsList');
    const grid = list.querySelector('.publication-categories');
    return {
        list: rect(list), viewport: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        tracks: getComputedStyle(grid).gridTemplateColumns,
        groups: [...grid.children].map(category => {
            const style = getComputedStyle(category);
            return {
                rect: rect(category), float: style.cssFloat,
                padding: style.padding, margin: style.margin,
                border: style.borderTopWidth, boxSizing: style.boxSizing,
                heading: category.querySelector('h3').textContent,
                cards: [...category.querySelectorAll('.publication-item')].map(card => ({
                    id: card.id, rect: rect(card),
                    media: rect(card.querySelector('.publication-image')),
                    content: rect(card.querySelector('.publication-content')),
                    titleSize: getComputedStyle(card.querySelector('.publication-title')).fontSize,
                    authorSize: getComputedStyle(card.querySelector('.publication-authors')).fontSize,
                    // Every content box must fit, including links, badges and TLDR controls.
                    boxes: [...card.querySelectorAll('.publication-content, .publication-content *')]
                        .map(el => ({name: el.className || el.tagName, ...rect(el)})),
                    scrollWidth: card.scrollWidth, clientWidth: card.clientWidth
                }))
            };
        })
    };
}"""


class PublicationLayout(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        source = (ROOT / "assets/css/style.scss").read_text()
        source = re.sub(r"^---\n---\n", "", source)
        source = re.sub(r"^@import .*?;\s*", "", source, flags=re.M)
        command = shlex.split(os.environ.get(
            "SASS_COMMAND", "npm exec --yes --package=sass@1.77.8 -- sass"
        ))
        cls.css = subprocess.run(
            command + ["--stdin", "--no-source-map"], input=source,
            text=True, capture_output=True, check=True
        ).stdout
        cls.legacy = (ROOT / "tests/fixtures/minimal-sections.css").read_text()
        cls.renderer = (ROOT / "assets/js/publications.js").read_text()
        cls.data = (ROOT / "publications.json").read_text()
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def assert_inside(self, child, parent, label):
        self.assertGreaterEqual(child["left"], parent["left"] - 1, label)
        self.assertLessEqual(child["right"], parent["right"] + 1, label)

    def check_layout(self, layout, two_columns, mode):
        a, b = layout["groups"]
        ar, br = a["rect"], b["rect"]
        # Actual bounding-box intersection, not a computed grid declaration.
        intersection = (min(ar["right"], br["right"]) - max(ar["left"], br["left"])) > 1 and (
            min(ar["bottom"], br["bottom"]) - max(ar["top"], br["top"])) > 1
        self.assertFalse(intersection, f"category boxes intersect: {json.dumps(layout, default=str)[:700]}")
        if two_columns:
            self.assertAlmostEqual(ar["top"], br["top"], delta=1)
            self.assertAlmostEqual(br["left"] - ar["right"], 64, delta=1)
            self.assertGreaterEqual(ar["width"], 424 - 1)
            self.assertAlmostEqual(ar["width"], br["width"], delta=1)
        else:
            self.assertGreaterEqual(br["top"], ar["bottom"] + 31)
            self.assertAlmostEqual(ar["left"], br["left"], delta=1)
            self.assertAlmostEqual(ar["width"], layout["list"]["width"], delta=1)
        self.assertLessEqual(layout["documentWidth"], layout["viewport"])
        self.assertEqual([g["heading"] for g in layout["groups"]], ["Robotics", "3D Vision & Unified Models"])
        self.assertEqual([len(g["cards"]) for g in layout["groups"]], [3, 3 if mode == "selected" else 10])
        for group in layout["groups"]:
            self.assert_inside(group["rect"], layout["list"], "category inside publication container")
            self.assertEqual(group["float"], "none")
            self.assertEqual(group["padding"], "0px")
            self.assertEqual(group["margin"], "0px")
            self.assertEqual(group["border"], "0px")
            self.assertEqual(group["boxSizing"], "border-box")
            for card in group["cards"]:
                self.assert_inside(card["rect"], group["rect"], card["id"])
                for box in [card["media"], *card["boxes"]]:
                    self.assert_inside(box, card["rect"], f'{card["id"]}: {box.get("name", "media")}')
                self.assertLessEqual(card["scrollWidth"], card["clientWidth"] + 1, card["id"])
                self.assertEqual(card["titleSize"], "17px")
                self.assertEqual(card["authorSize"], "14px")
                if two_columns:
                    self.assertGreaterEqual(card["content"]["top"], card["media"]["bottom"])
                    self.assertAlmostEqual(card["media"]["width"], card["rect"]["width"], delta=1)

    def test_legacy_inheritance_and_responsive_geometry(self):
        for width, height, content_width, two_columns in CASES:
            with self.subTest(viewport=f"{width}x{height}", content_width=content_width):
                page = self.browser.new_page(viewport={"width": width, "height": height})
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                html = f"""<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>{self.legacy}</style><style>{self.css}</style></head><body>
                    <div class="container"><article><div class="section-header"><div class="view-toggle">
                    <button id="selectedBtn" class="active">Selected</button><button id="allBtn">All Publications</button>
                    </div></div><div id="publicationsList" class="publications-list"></div></article></div>
                    <script src="/assets/js/publications.js"></script></body></html>"""

                def serve(route):
                    url = route.request.url
                    if url == ORIGIN + "/":
                        route.fulfill(content_type="text/html", body=html)
                    elif url == ORIGIN + "/assets/js/publications.js":
                        route.fulfill(content_type="text/javascript", body=self.renderer)
                    elif url == ORIGIN + "/publications.json":
                        route.fulfill(content_type="application/json", body=self.data)
                    else:
                        route.abort()  # Media/font requests cannot affect geometry or access the network.

                page.route("**/*", serve)
                try:
                    page.goto(ORIGIN + "/")
                    page.wait_for_selector("#pub-reflex")
                    if content_width is not None:
                        page.locator("#publicationsList").evaluate("(el, width) => el.style.width = width + 'px'", content_width)
                    # Prove the fixture is active even when the category overrides are fixed.
                    legacy = page.evaluate("""() => {
                        const el = document.createElement('section'); document.body.append(el);
                        const s = getComputedStyle(el);
                        const result = {width: s.width, float: s.cssFloat, padding: s.paddingBottom};
                        el.remove(); return result;
                    }""")
                    if width > 960:
                        self.assertEqual(legacy, {"width": "500px", "float": "right", "padding": "50px"})
                    else:
                        self.assertEqual(legacy["padding"], "20px")
                    # Restore Selected after All to check the shared toggle's complete cycle.
                    for mode in ["selected", "all", "selected"]:
                        page.locator(f"#{mode}Btn").click()
                        layout = page.evaluate(MEASURE)
                        with self.subTest(mode=mode):
                            self.check_layout(layout, two_columns, mode)
                            page.locator(".tldr-toggle").evaluate_all("els => els.forEach(el => el.click())")
                            self.check_layout(page.evaluate(MEASURE), two_columns, mode)
                        print(f'{width}x{height} content={layout["list"]["width"]:g} {mode}: tracks={layout["tracks"]}', flush=True)
                    self.assertEqual(errors, [])
                finally:
                    page.close()


if __name__ == "__main__":
    unittest.main()
