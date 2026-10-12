const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/js/publications.js'), 'utf8');
const data = JSON.parse(fs.readFileSync(path.join(root, 'publications.json'), 'utf8'));
const robotics = ['reflex', 'gam', 'molmoact2'];
const vision = data.publications.filter(pub => !robotics.includes(pub.id)).map(pub => pub.id);

function element(classes = '') {
    const names = new Set(classes.split(' ').filter(Boolean));
    const listeners = {};
    return {
        attributes: {}, listeners, textContent: '',
        classList: {
            add: name => names.add(name), remove: name => names.delete(name),
            contains: name => names.has(name)
        },
        setAttribute(name, value) { this.attributes[name] = String(value); },
        addEventListener(name, handler) { (listeners[name] ||= []).push(handler); },
        emit(name, event = {}) { for (const handler of listeners[name] || []) handler(event); },
        scrollIntoView() { this.scrolled = true; }
    };
}

// Only the browser operations used by the real renderer are stubbed. HTML is
// produced by publications.js, never by a second implementation in the tests.
function browser(publications = data.publications, hash = '') {
    const nodes = new Map([
        ['selectedBtn', element('active')], ['allBtn', element()]
    ]);
    const container = element();
    let html = '';
    let videos = [];
    Object.defineProperty(container, 'innerHTML', {
        get: () => html,
        set(value) {
            html = value;
            for (const id of [...nodes.keys()]) {
                if (!['selectedBtn', 'allBtn', 'publicationsList'].includes(id)) nodes.delete(id);
            }
            for (const match of value.matchAll(/id="([^"]+)"/g)) nodes.set(match[1], element());
            for (const match of value.matchAll(/class="publication-tldr collapsed" id="([^"]+)"/g)) {
                const tldr = nodes.get(match[1]);
                tldr.classList.add('collapsed');
                tldr.toggleText = element();
                tldr.querySelector = () => tldr.toggleText;
            }
            videos = [...value.matchAll(/<video\b[^>]*data-playback-rate="([^"]+)"[^>]*>/g)].map(match => {
                const video = element();
                video.dataset = { playbackRate: match[1] };
                video.playbackRate = 1;
                return video;
            });
        }
    });
    container.querySelectorAll = selector => {
        assert.equal(selector, 'video[data-playback-rate]');
        return videos;
    };
    nodes.set('publicationsList', container);
    const document = element();
    document.getElementById = id => nodes.get(id) || null;
    const window = element();
    window.location = { hash };
    const context = vm.createContext({
        document, window, location: window.location, console, URL, URLSearchParams,
        fetch: async () => ({ ok: true, json: async () => ({ publications }) })
    });
    vm.runInContext(source, context, { filename: 'publications.js' });
    return {
        nodes, container, document, window, context,
        get videos() { return videos; },
        async start() {
            document.emit('DOMContentLoaded');
            // Flush the fetch/json promises from the actual loadPublications.
            await new Promise(resolve => setImmediate(resolve));
        },
        click(id) { nodes.get(id).emit('click'); },
        navigate(hash) { window.location.hash = hash; window.emit('hashchange'); }
    };
}

function groups(html) {
    return [...html.matchAll(/<section\b[^>]*aria-labelledby="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)].map(match => ({
        headingId: match[1],
        heading: match[2].match(/<h3\b[^>]*>([^<]+)<\/h3>/)?.[1],
        ids: [...match[2].matchAll(/class="publication-item" id="pub-([^"]+)"/g)].map(item => item[1])
    }));
}

function assertGroups(app, expectedVision) {
    const sections = groups(app.container.innerHTML);
    assert.deepEqual(sections.map(section => section.heading), ['Robotics', '3D Vision &amp; Unified Models']);
    assert.deepEqual(sections.map(section => section.ids), [robotics, expectedVision]);
    for (const section of sections) {
        assert.match(app.container.innerHTML, new RegExp(`<h3 id="${section.headingId}">`));
    }
    const ids = [...app.container.innerHTML.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, 'every rendered ID must be unique');
}

test('explicit metadata assigns exactly three Robotics papers and all others Vision', () => {
    for (const pub of data.publications) {
        assert.equal(pub.category, robotics.includes(pub.id) ? 'Robotics' : 'Vision');
    }
    for (const id of ['sos', 'gas']) assert.equal(data.publications.find(pub => pub.id === id).selected, false);
});

test('default Selected renders semantic ordered categories with 3 + 3 cards', async () => {
    const app = browser();
    await app.start();
    assertGroups(app, ['wilddet3d', 'ipt', 'molmo2']);
    assert.equal(app.nodes.get('selectedBtn').classList.contains('active'), true);
});

test('one shared toggle renders 3 + 10 All cards and restores Selected with metrics', async () => {
    const app = browser();
    await app.start();
    app.click('allBtn');
    assertGroups(app, vision);
    assert.equal(app.nodes.get('allBtn').classList.contains('active'), true);
    assert.equal(app.nodes.get('selectedBtn').classList.contains('active'), false);
    app.click('selectedBtn');
    assertGroups(app, ['wilddet3d', 'ipt', 'molmo2']);
    assert.equal(app.nodes.get('selectedBtn').classList.contains('active'), true);
    assert.equal(app.nodes.get('allBtn').classList.contains('active'), false);
    for (const pub of data.publications.filter(pub => pub.selected && pub.github_stars !== undefined && pub.github_repo)) {
        assert.match(app.nodes.get(`stars-${pub.id}`).textContent, /⭐/);
    }
});

test('missing category gracefully renders in Vision without changing original order', async () => {
    const publications = structuredClone(data.publications);
    delete publications.find(pub => pub.id === 'ipt').category;
    const app = browser(publications);
    await app.start();
    assertGroups(app, ['wilddet3d', 'ipt', 'molmo2']);
});

test('grouping preserves the actual card HTML, links, author formatting, TLDR and highlights', async () => {
    const app = browser();
    await app.start();
    app.click('allBtn');
    for (const pub of data.publications) {
        const card = vm.runInContext(`createPublicationHTML(${JSON.stringify(pub)})`, app.context);
        assert.ok(app.container.innerHTML.includes(card), `unchanged card HTML for ${pub.id}`);
    }
    vm.runInContext("toggleTldr('reflex')", app.context);
    assert.equal(app.nodes.get('tldr-reflex').classList.contains('expanded'), true);
    assert.equal(app.nodes.get('tldr-reflex').toggleText.textContent, 'less');
});

test('video rates retain 1x overrides and original 3x default after loading and toggles', async () => {
    const app = browser();
    await app.start();
    for (const mode of ['selectedBtn', 'allBtn', 'selectedBtn']) {
        app.click(mode);
        assert.deepEqual(app.videos.map(video => video.playbackRate), [1, 1, 3, 3, 1, 3]);
        for (const video of app.videos) {
            for (const event of ['loadedmetadata', 'play', 'ratechange']) {
                video.playbackRate = 1;
                video.emit(event);
                assert.equal(video.playbackRate, Number(video.dataset.playbackRate));
            }
        }
    }
});

test('initial and later deep links reveal unselected cards and scroll to unique targets', async () => {
    const app = browser(data.publications, '#pub-sos');
    await app.start();
    assertGroups(app, vision);
    assert.equal(app.nodes.get('pub-sos').scrolled, true);
    app.click('selectedBtn');
    app.navigate('#pub-gas');
    assertGroups(app, vision);
    assert.equal(app.nodes.get('pub-gas').scrolled, true);
    app.click('selectedBtn');
    app.navigate('#pub-reflex');
    assertGroups(app, ['wilddet3d', 'ipt', 'molmo2']);
    assert.equal(app.nodes.get('pub-reflex').scrolled, true);
});

test('clicking the same deep link after switching to Selected reveals its card again', async () => {
    const app = browser(data.publications, '#pub-gas');
    await app.start();
    app.click('selectedBtn');
    app.document.emit('click', {
        target: { closest: () => ({ getAttribute: () => '#pub-gas' }) }
    });
    assertGroups(app, vision);
    assert.equal(app.nodes.get('pub-gas').scrolled, true);
});

test('unknown hash leaves the selected filter alone', async () => {
    const app = browser(data.publications, '#pub-unknown');
    await app.start();
    assertGroups(app, ['wilddet3d', 'ipt', 'molmo2']);
});

test('research bio preserves the intro and uses the exact requested bold headings and copy', async () => {
    const homepage = fs.readFileSync(path.join(root, 'index.md'), 'utf8');
    assert.ok(homepage.includes('<p class="bio">I am broadly interested in computer vision for the physical world — perceiving it, generating it, and acting in it. My current research interests include:</p>'));
    const threads = homepage.match(/<ol class="bio research-threads">([\s\S]*?)<\/ol>/);
    assert.ok(threads, 'research interests retain their HTML list');
    const items = [...threads[1].matchAll(/<li><strong>([^<]+)<\/strong> ([\s\S]*?)<\/li>/g)];
    assert.deepEqual(items.map(item => item[1]), [
        '3D perception and generation in the wild.',
        'Vision-centric policies for robotics.',
        'Unified multimodal models and representation learning.'
    ]);
    assert.deepEqual(items.map(item => item[2].replace(/<[^>]+>/g, '')), [
        'I am interested in learning representations that capture the geometry and dynamics of real-world objects and scenes, and in scaling visual perception and generation beyond fixed categories and curated environments. My work includes promptable 3D detection (WildDet3D).',
        'I study how visual and spatial representations can serve as a foundation for robot learning, from 3D-grounded manipulation (GAM) and action reasoning (MolmoAct2) to fast, visually reactive whole-body control (Reflex).',
        'I am interested in bringing visual understanding, generation, and action into a shared modeling framework. My work includes open vision-language models for video understanding and grounding (Molmo2) and learning visual representations for spatial reasoning (IPT).'
    ]);
    assert.deepEqual(items.map(item => [...item[2].matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)].map(link => [link[1], link[2]])), [
        [['#pub-wilddet3d', 'WildDet3D']],
        [['#pub-gam', 'GAM'], ['#pub-molmoact2', 'MolmoAct2'], ['#pub-reflex', 'Reflex']],
        [['#pub-molmo2', 'Molmo2'], ['#pub-ipt', 'IPT']]
    ]);
    const app = browser();
    await app.start();
    app.click('allBtn');
    const cards = app.container.innerHTML;
    for (const link of threads[1].matchAll(/href="#([^"]+)"/g)) {
        assert.equal([...cards.matchAll(new RegExp(`id="${link[1]}"`, 'g'))].length, 1, `${link[1]} resolves to one card`);
    }
});

test('SOC and Generate Any Scene are removed only from research interests and retained in News and papers', async () => {
    const homepage = fs.readFileSync(path.join(root, 'index.md'), 'utf8');
    const threads = homepage.match(/<ol class="bio research-threads">([\s\S]*?)<\/ol>/);
    assert.ok(threads);
    assert.doesNotMatch(threads[1], /SOC|Generate Any Scene|#pub-sos|#pub-gas/);
    const news = homepage.match(/## News\n([\s\S]*?)\n## Publications/);
    assert.ok(news);
    assert.ok(news[1].includes('- **[2026-2]** 3 papers ([SOC](https://arxiv.org/abs/2510.09110), [Molmo2](https://arxiv.org/abs/2601.10611), [TrajTok](https://arxiv.org/abs/2602.22779)) accepted to CVPR 2026. See you in Denver!'));
    assert.ok(news[1].includes('- **[2026-1]** Our work [Generate Any Scene](https://generate-any-scene.github.io/) is accepted to ICLR 2026.'));
    const app = browser();
    await app.start();
    app.click('allBtn');
    for (const [id, title] of [
        ['sos', 'Synthetic Object Compositions for Scalable and Accurate Learning in Detection, Segmentation, and Grounding'],
        ['gas', 'Generate Any Scene: Scene Graph Driven Data Synthesis for Visual Generation Training']
    ]) {
        const entries = data.publications.filter(pub => pub.id === id);
        assert.equal(entries.length, 1);
        assert.equal(entries[0].title, title);
        assert.ok(app.nodes.has(`pub-${id}`));
        assert.ok(app.container.innerHTML.includes(title));
    }
});

test('Reflex uses its exact arXiv metadata and rendered link without the old project PDF', async () => {
    const entries = data.publications.filter(pub => pub.id === 'reflex');
    assert.equal(entries.length, 1, 'Reflex remains a single publication');
    const reflex = entries[0];
    assert.equal(reflex.venue, 'arXiv');
    assert.equal(reflex.arxiv_id, '2610.12772');
    assert.equal(reflex.links.arxiv, 'https://arxiv.org/abs/2610.12772');
    assert.equal(Object.hasOwn(reflex.links, 'paper'), false);
    assert.deepEqual(reflex.authors, [
        'Taoyang Jia*', 'Weikai Huang*', 'Linxin Song*', 'Jared Darlington',
        'Jieyu Zhao', 'Yue Wang', 'Jiafei Duan', 'Zhongzheng Ren', 'Ranjay Krishna'
    ]);
    assert.equal(reflex.local_video, 'img/papers/reflex.mp4');
    assert.equal(reflex.playback_rate, 1);
    assert.equal(reflex.selected, true);
    assert.equal(reflex.links.website, 'https://toberj.github.io/reflex/');
    assert.equal(reflex.links.video, 'https://toberj.github.io/reflex/static/videos/teaser.mp4?v=1008t');
    assert.equal(reflex.links.code, 'https://github.com/ToberJ/reflex');
    const app = browser();
    await app.start();
    const card = vm.runInContext(`createPublicationHTML(${JSON.stringify(reflex)})`, app.context);
    assert.ok(app.container.innerHTML.includes(card));
    assert.ok(card.includes('<a href="https://arxiv.org/abs/2610.12772" target="_blank">arXiv</a>'));
    assert.ok(card.includes(`<a href="https://arxiv.org/abs/2610.12772" target="_blank">${reflex.title}</a>`));
    assert.doesNotMatch(card, /https:\/\/toberj\.github\.io\/reflex\/static\/paper\/reflex\.pdf|>Paper<|abstract/i);
});
