const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const root = join(__dirname, "..");
const source = readFileSync(join(root, "assets/js/publications.js"), "utf8");
const publications = JSON.parse(readFileSync(join(root, "publications.json"), "utf8")).publications;

async function renderPaper(paper) {
  const list = { innerHTML: "", addEventListener() {}, querySelectorAll: () => [] };
  const context = {
    console,
    location: { hash: "" },
    document: {
      getElementById: id => id === "pubList" ? list : null,
      querySelectorAll: () => []
    },
    matchMedia: () => ({ matches: true }),
    addEventListener() {},
    fetch: async url => ({
      ok: true,
      json: async () => url === "publications.json"
        ? { publications: [{ ...paper, selected: true }] }
        : { themes: {} }
    })
  };
  context.window = context;
  vm.runInNewContext(source, context);
  await new Promise(setImmediate);
  assert.match(list.innerHTML, /<article class="pub"/);
  return list.innerHTML;
}

function venueRows(html) {
  return Array.from(html.matchAll(/<p class="venue">(.*?)<\/p>/g), match => match[1]);
}

test("Reflex groups workshops once, orders awards first, and renders Oral as a note", async () => {
  const html = await renderPaper(publications.find(p => p.id === "reflex"));
  const group = html.match(/<div class="workshop-venues">(.*?)<\/div>/)[1];
  assert.equal((group.match(/CoRL 2026 Workshops/g) || []).length, 1);
  assert.deepEqual(Array.from(group.matchAll(/<li>(.*?)<\/li>/g), match => match[1]), [
    '<a class="workshop-name" href="https://roboletics.github.io/corl2026/#awards">RoboLetics</a><span class="award">Best Paper Award</span>',
    '<a class="workshop-name" href="https://contact-rich-loco-manipulation.github.io/program/#best-poster" title="Open Problems in Contact-Rich Loco-Manipulation">Contact-Rich Loco-Manipulation</a><span class="award">Best Poster Award</span>',
    '<span class="workshop-name">SimBench2Real</span><span class="workshop-note">Oral</span>'
  ]);
  assert.equal((group.match(/class="award"/g) || []).length, 2);
  assert.doesNotMatch(group.replace(/<p class="workshop-heading">.*?<\/p>/, "").replace(/<[^>]*>/g, ""), /CoRL|2026|Workshop/);
  assert.deepEqual(venueRows(html), []);
});

test("Reflex retains canonical raw venue and honor metadata for the legacy renderer", async () => {
  const { venue_display, ...raw } = publications.find(p => p.id === "reflex");
  assert.ok(venue_display);
  const html = await renderPaper(raw);
  assert.deepEqual(venueRows(html), [
    '<span class="v">CoRL Roboletics Workshop 2026</span><span class="award">Best Paper Award</span>',
    '<span class="v">CoRL SimBench2Real Workshop 2026</span><span class="award">Oral</span>',
    '<span class="v">CoRL Open Problems in Contact-Rich Loco-Manipulation Workshop 2026</span><span class="award">Best Poster Award</span>'
  ]);
});

test("compact display escapes its heading, labels, tooltip, link, awards and notes", async () => {
  const html = await renderPaper({
    venue_display: {
      heading: 'Workshops <A> & "B"',
      rows: [
        { label: "Name <A>", title: 'Full "Name" & <B>', url: 'https://example.com/?a="b"&c=d', award: "Best <Paper>" },
        { label: 'Other & "Name"', note: "Oral <A>" }
      ]
    }
  });
  assert.match(html, /<p class="workshop-heading">Workshops &lt;A&gt; &amp; &quot;B&quot;<\/p>/);
  assert.match(html, /href="https:\/\/example.com\/\?a=&quot;b&quot;&amp;c=d" title="Full &quot;Name&quot; &amp; &lt;B&gt;">Name &lt;A&gt;<\/a>/);
  assert.match(html, /<span class="award">Best &lt;Paper&gt;<\/span>/);
  assert.match(html, /<span class="workshop-name">Other &amp; &quot;Name&quot;<\/span><span class="workshop-note">Oral &lt;A&gt;<\/span>/);
});

test("MolmoAct2 retains its Spotlight and TAG Best Paper rows", async () => {
  const html = await renderPaper(publications.find(p => p.id === "molmoact2"));
  assert.deepEqual(venueRows(html), [
    '<span class="v">CoRL 2026</span><span class="award">Spotlight</span>',
    '<span class="v">TAG Workshop</span><span class="award">Best Paper Award</span>'
  ]);
});

test("legacy additional venues without awards keep their inline output", async () => {
  const html = await renderPaper({ venue: "Arxiv", year: "2026", additional_venue: "Workshop (Oral)" });
  assert.deepEqual(venueRows(html), [
    '<span class="v">arXiv 2026</span><span class="extra">Workshop (Oral)</span>'
  ]);
});

test("structured venues extend legacy rows and escape venue and award text", async () => {
  const html = await renderPaper({
    venue: "CoRL", year: "2026", award: "Spotlight; Best Paper Award",
    additional_venue: "Legacy Workshop", additional_award: "Oral",
    additional_venues: [{ venue: 'Workshop <A> & "B"', award: "Best <Poster> & Award" }, { venue: "Workshop C" }]
  });
  assert.deepEqual(venueRows(html), [
    '<span class="v">CoRL 2026</span><span class="award">Spotlight</span><span class="award">Best Paper Award</span>',
    '<span class="v">Legacy Workshop</span><span class="award">Oral</span>',
    '<span class="v">Workshop &lt;A&gt; &amp; &quot;B&quot;</span><span class="award">Best &lt;Poster&gt; &amp; Award</span>',
    '<span class="v">Workshop C</span>'
  ]);
});

test("the existing November news item and Awards row include the poster award and official link", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  assert.equal((html.match(/<span class="date">Nov 2026<\/span>/g) || []).length, 1);
  assert.match(html, /Nov 2026<\/span><span class="txt">[^\n]*Best Poster Award[^\n]*decided by audience voting[^\n]*href="https:\/\/contact-rich-loco-manipulation\.github\.io\/program\/#best-poster">Open Problems in Contact-Rich Loco-Manipulation<\/a>/);
  assert.match(html, /<li><span class="main">Best Poster Award, CoRL <a href="https:\/\/contact-rich-loco-manipulation\.github\.io\/program\/#best-poster">Open Problems in Contact-Rich Loco-Manipulation Workshop<\/a> \(<a href="#pub-reflex">Reflex<\/a>\)<\/span><span class="when">2026<\/span><\/li>/);
});
