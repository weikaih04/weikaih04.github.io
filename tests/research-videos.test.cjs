const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const { createHash } = require("node:crypto");
const { execFileSync } = require("node:child_process");
const vm = require("node:vm");

const source = readFileSync(join(__dirname, "../assets/js/publications.js"), "utf8");
const publications = JSON.parse(readFileSync(join(__dirname, "../publications.json"), "utf8")).publications;
const root = join(__dirname, "..");
const manifest = JSON.parse(readFileSync(join(root, "img/research/manifest.json"), "utf8"));

function element() {
  return {
    hidden: false, dataset: {}, listeners: {}, attributes: {}, innerHTML: "",
    addEventListener(type, fn) {
      const previous = this.listeners[type];
      this.listeners[type] = event => { previous?.(event); fn(event); };
    },
    setAttribute(name, value) { this.attributes[name] = value; },
    querySelectorAll() { return []; }
  };
}

function setup({ reduced = false, intersectionObserver = true } = {}) {
  const observers = [];
  const motion = { ...element(), matches: reduced };
  const themes = element();
  const list = element();
  const videos = Object.entries(manifest.themes).map(([key, media]) => {
    const button = { ...element(), dataset: { label: "Demo" }, textContent: "Play" };
    const fallback = { ...element(), hidden: true };
    const controls = element();
    let end = 0;
    const posterPaper = media.segments.find(segment => (end += segment.length) > media.poster_seconds).paper_id;
    const caption = { ...element(), textContent: ({ wilddet3d: "WildDet3D", reflex: "Reflex", molmo2: "Molmo2" })[posterPaper],
      dataset: { jump: posterPaper }, attributes: { href: `#pub-${posterPaper}` } };
    const theme = { querySelector: selector => ({
      "[data-theme-play]": button, ".theme-fallback": fallback, ".theme-controls": controls, ".theme-caption": caption
    })[selector] };
    return {
      ...element(), dataset: { theme: key }, currentTime: 0, readyState: 0, paused: true, playCalls: 0, button, fallback, controls, caption,
      closest() { return theme; },
      play() {
        this.playCalls++;
        if (this.rejectPlay) return Promise.reject(new Error("Autoplay blocked"));
        this.paused = false;
        this.listeners.play?.();
        return Promise.resolve();
      },
      pause() { this.paused = true; this.listeners.pause?.(); }
    };
  });
  themes.querySelectorAll = () => videos;
  const lightbox = { ...element(), showModal() { this.open = true; } };
  const expandedVideo = {
    ...element(), playCalls: 0,
    play() { this.playCalls++; return Promise.resolve(); },
    pause() { this.paused = true; },
    removeAttribute(name) { delete this[name]; },
    load() { this.loaded = true; }
  };
  const nodes = { themes, pubList: list, lightbox, lbVideo: expandedVideo, lbClose: element() };
  const context = {
    console, location: { hash: "" },
    document: { getElementById: id => nodes[id] || null, querySelectorAll: () => [] },
    matchMedia: () => motion,
    fetch: () => new Promise(() => {}),
    addEventListener() {}
  };
  if (intersectionObserver) context.IntersectionObserver = class {
    constructor(callback, options) { this.callback = callback; this.options = options; this.targets = []; observers.push(this); }
    observe(target) { this.targets.push(target); }
    disconnect() { this.disconnected = true; }
    enter(target, ratio = 1) { this.callback([{ target, isIntersecting: ratio > 0, intersectionRatio: ratio }]); }
  };
  context.window = context;
  vm.createContext(context);
  // Expose the closure only in this VM; the production script keeps its existing API.
  vm.runInContext(source.replace(/\}\)\(\);\s*$/, `globalThis.api = {
    renderThemes, render, setPubs: value => { PUBS = value; }, setMontages: value => { MONTAGES = value; }
  }; })();`), context);
  context.api.setPubs(publications);
  context.api.setMontages(manifest.themes);
  context.api.renderThemes();
  return { ...context.api, themes, list, videos, observers, motion, nodes };
}

test("theme-owned montages and posters describe directions and retain project tags", () => {
  const { themes, videos } = setup();
  for (const [theme, name] of [
    ["3d", "3D perception &amp; generation in the wild"],
    ["robotics", "Vision-centric robot policies"],
    ["multimodal", "VLMs for Embodied Reasoning"]
  ]) {
    assert.ok(themes.innerHTML.includes(`id="theme-video-${theme}" src="img/research/${theme}.mp4" muted loop playsinline preload="auto" aria-label="${name} overview video" poster="img/research/${theme}.jpg" data-theme="${theme}"`));
    assert.ok(themes.innerHTML.includes(`data-video="img/research/${theme}.mp4" aria-label="Expand ${name} overview video"`));
    assert.ok(themes.innerHTML.includes(`aria-label="Play ${name} overview video"`));
  }
  assert.doesNotMatch(themes.innerHTML, /src="img\/papers\//);
  assert.match(themes.innerHTML, /data-jump="molmoact2">Molmo-ER<\/a>/);
  assert.match(themes.innerHTML, /data-jump="wilddet3d">WildDet3D<\/a>/);
  for (const video of videos) {
    assert.equal(video.playbackRate, 1);
    assert.equal(video.defaultPlaybackRate, 1);
    assert.equal(video.muted, true);
  }
});

test("theme media does not depend on an individual publication's video metadata", () => {
  const { setPubs, renderThemes, themes } = setup();
  setPubs(publications.map(({ local_video, image, ...paper }) => paper));
  renderThemes();
  assert.equal((themes.innerHTML.match(/<video /g) || []).length, 3);
  assert.match(themes.innerHTML, /poster="img\/research\/robotics.jpg"/);
  assert.match(themes.innerHTML, /data-theme-filter="robotics">View Robotics publications/);
});

test("3D shows only WildDet3D while Robotics retains GAM and publication classifications", () => {
  const { themes } = setup();
  const cards = themes.innerHTML.split('<div class="theme">').slice(1);
  assert.deepEqual([...new Set([...cards[0].matchAll(/data-jump="([^"]+)"/g)].map(match => match[1]))], ["wilddet3d"]);
  assert.match(cards[1], /data-jump="gam">GAM<\/a>/);
  const gam = publications.find(paper => paper.id === "gam");
  assert.ok(gam.themes.includes("3d"));
  assert.ok(gam.themes.includes("robotics"));
});

test("the reproducible build and generated manifest retain the exact approved EDL", () => {
  const generated = JSON.parse(execFileSync("python3", [join(root, "scripts/build_research_montages.py"), "--manifest"], { encoding: "utf8" }));
  const { source_sha256, ...settings } = manifest;
  assert.deepEqual(settings, generated);
  assert.deepEqual([manifest.width, manifest.height, manifest.fps, manifest.playback_rate], [768, 432, 24, 1]);
  assert.equal(manifest.fit, "contain");
  assert.equal(manifest.overlays, false);
  assert.equal(manifest.content_height, undefined);
  assert.equal(manifest.footer_height, undefined);
  const builder = readFileSync(join(root, "scripts/build_research_montages.py"), "utf8");
  assert.doesNotMatch(builder, /Pillow|FONT_CANDIDATES|LABEL_RENDERER|--font|--label-python|drawtext|overlay=|crop=/);
  assert.equal(manifest.audio, false);
  assert.equal(manifest.transition, "hard cut");
  const approved = {
    "3d": [["wilddet3d", 28, 4], ["wilddet3d", 36, 4], ["wilddet3d", 44, 4]],
    robotics: [["reflex", 0, 4], ["gam", 19, 4], ["molmoact2", 35, 4]],
    multimodal: [["ipt", 11, 4], ["molmo2", 46, 4], ["molmo2", 51, 7]]
  };
  for (const [theme, edits] of Object.entries(approved)) {
    const entry = manifest.themes[theme];
    assert.deepEqual(entry.segments, edits.map(([paper, start, length]) => ({ paper_id: paper, source: `img/papers/${paper}.mp4`, start, length })));
    assert.equal(entry.duration, edits.reduce((total, [, , length]) => total + length, 0));
    assert.ok(entry.poster_seconds > 0 && entry.poster_seconds < entry.duration);
    for (const segment of entry.segments) {
      assert.equal(createHash("sha256").update(readFileSync(join(root, segment.source))).digest("hex"), source_sha256[segment.source]);
    }
  }
});

test("generated media matches EDL duration and frame count with H264, no audio, faststart, and full-size posters", () => {
  for (const entry of Object.values(manifest.themes)) {
    const video = readFileSync(join(root, entry.video));
    const poster = readFileSync(join(root, entry.poster));
    const probe = path => JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", join(root, path)], { encoding: "utf8" }));
    const info = probe(entry.video);
    assert.equal(info.streams.length, 1);
    const stream = info.streams[0];
    assert.deepEqual([stream.codec_type, stream.codec_name, stream.pix_fmt, stream.width, stream.height, stream.r_frame_rate, stream.nb_frames], ["video", "h264", "yuv420p", 768, 432, "24/1", String(entry.duration * manifest.fps)]);
    assert.equal(Number(info.format.duration), entry.segments.reduce((total, segment) => total + segment.length, 0));
    let moov = -1, mdat = -1;
    for (let offset = 0; offset < video.length;) {
      const size = video.readUInt32BE(offset);
      const type = video.toString("ascii", offset + 4, offset + 8);
      if (type === "moov") moov = offset;
      if (type === "mdat") mdat = offset;
      assert.ok(size >= 8 && offset + size <= video.length);
      offset += size;
    }
    assert.ok(moov >= 0 && mdat > moov, "faststart places metadata before video data");
    assert.ok(video.length < 3_000_000, "keep each montage modest");
    assert.equal(poster.readUInt16BE(0), 0xffd8);
    const still = probe(entry.poster).streams[0];
    assert.deepEqual([still.codec_name, still.width, still.height], ["mjpeg", 768, 432]);
  }
});

test("every variable-length segment contains demo motion across the full frame", () => {
  const frameSize = 128 * 72;
  for (const [theme, entry] of Object.entries(manifest.themes)) {
    const frames = execFileSync("ffmpeg", ["-v", "error", "-i", join(root, entry.video),
      "-vf", "fps=4,scale=128:72,format=gray", "-f", "rawvideo", "-"], { maxBuffer: 1_000_000 });
    assert.equal(frames.length, entry.duration * 4 * frameSize);
    let offset = 0;
    entry.segments.forEach(segment => {
      let difference = 0;
      // Compare within each edit, so a hard cut cannot pass this check.
      for (let frame = offset * 4 + 1; frame < (offset + segment.length) * 4; frame++) {
        for (let pixel = 0; pixel < frameSize; pixel++) {
          difference += Math.abs(frames[frame * frameSize + pixel] - frames[(frame - 1) * frameSize + pixel]);
        }
      }
      // WildDet3D at 36s has subtler motion than the other approved excerpts.
      assert.ok(difference / ((segment.length * 4 - 1) * frameSize) > 0.5, `${theme}: ${segment.source} must contain motion`);
      offset += segment.length;
    });
  }
});

test("encoded frames preserve complete sources at 1x with no added footer or overlays", () => {
  const width = 192, height = 108, frameSize = width * height;
  // Sample early, middle and late frames of every edit against the original.
  // Checking each row also catches a bottom strip that a global average could hide.
  function frames(path, start, length, original) {
    const fit = original
      ? "scale=768:432:force_original_aspect_ratio=decrease:force_divisible_by=2:reset_sar=1:flags=lanczos,pad=768:432:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,format=yuv420p,"
      : "";
    // Seek each output frame directly: concatenated clips can change color metadata,
    // which reinitializes ffmpeg filters and resets their frame counters.
    return Buffer.concat([0.5, length / 2, length - 0.5].map(second => execFileSync("ffmpeg", [
      "-v", "error", "-ss", String(original ? start : start + second), "-i", join(root, path),
      "-vf", `setpts=PTS-STARTPTS,fps=24,${fit}scale=192:108,format=gray`,
      ...(original ? ["-ss", String(second)] : []),
      "-frames:v", "1", "-f", "rawvideo", "-"
    ], { maxBuffer: 1_000_000 })));
  }
  for (const [theme, entry] of Object.entries(manifest.themes)) {
    let offset = 0;
    entry.segments.forEach((segment, index) => {
      const expected = frames(segment.source, segment.start, segment.length, true);
      const actual = frames(entry.video, offset, segment.length, false);
      offset += segment.length;
      assert.equal(actual.length, 3 * frameSize);
      assert.equal(expected.length, actual.length);
      let total = 0;
      for (let row = 0; row < height * 3; row++) {
        let difference = 0;
        for (let x = 0; x < width; x++) {
          const pixel = row * width + x;
          difference += Math.abs(actual[pixel] - expected[pixel]);
        }
        assert.ok(difference / width < 8, `${theme} edit ${index}, row ${row % height}: source frame must remain intact`);
        total += difference;
      }
      assert.ok(total / actual.length < 4, `${theme} edit ${index}: source timing and full-frame composition must match`);
    });
  }
});

test("Expand opens the direction montage in the existing lightbox", () => {
  const { themes, nodes } = setup();
  themes.listeners.click({ target: { closest: selector => selector === "[data-video]"
    ? { dataset: { video: "img/research/multimodal.mp4" } } : null } });
  assert.equal(nodes.lightbox.open, true);
  assert.equal(nodes.lbVideo.src, "img/research/multimodal.mp4");
  assert.equal(nodes.lbVideo.playCalls, 1);
});

test("viewport playback and accessible manual pause survive publication rerenders", () => {
  const { videos, observers, render } = setup();
  const video = videos[0];
  const themeObserver = observers[0];
  assert.equal(themeObserver.targets.length, 3);
  themeObserver.enter(video, 0.1);
  assert.equal(video.paused, true);
  themeObserver.enter(video);
  assert.equal(video.paused, false);
  assert.equal(video.button.attributes["aria-label"], "Pause Demo video");
  video.button.listeners.click();
  assert.equal(video.paused, true);
  themeObserver.enter(video, 0);
  themeObserver.enter(video);
  assert.equal(video.paused, true, "a manual pause persists when returning to the viewport");
  video.button.listeners.click();
  assert.equal(video.paused, false);
  render();
  render();
  assert.equal(observers[1].disconnected, true, "publication observer is replaced");
  assert.equal(themeObserver.disconnected, undefined, "theme observer stays connected");
  themeObserver.enter(video, 0);
  assert.equal(video.paused, true);
  assert.equal(video.button.textContent, "Play");
  themeObserver.enter(video);
  assert.equal(video.paused, false);
});

test("reduced motion keeps the initial frame static and permits manual playback", () => {
  const { videos, observers, motion } = setup({ reduced: true });
  const video = videos[0];
  observers[0].enter(video);
  assert.equal(video.playCalls, 0);
  video.button.listeners.click();
  assert.equal(video.paused, false);
  observers[0].enter(video, 0);
  assert.equal(video.paused, true);
  observers[0].enter(video);
  assert.equal(video.paused, false, "manual playback may resume in view");
  motion.listeners.change();
  assert.equal(video.paused, true, "a motion preference change clears manual playback");
  assert.equal(video.button.textContent, "Play");
});

test("manual playback works without IntersectionObserver", () => {
  const { videos } = setup({ intersectionObserver: false });
  assert.equal(videos[0].playCalls, 0);
  videos[0].button.listeners.click();
  assert.equal(videos[0].paused, false);
});

test("failed playback leaves Play available and a media error exposes the direction fallback", async () => {
  const { videos, observers } = setup();
  const video = videos[0];
  video.rejectPlay = true;
  observers[0].enter(video);
  await Promise.resolve();
  assert.equal(video.button.textContent, "Play");
  video.listeners.error();
  assert.equal(video.hidden, true);
  assert.equal(video.fallback.hidden, false);
  assert.equal(video.controls.hidden, true);
  assert.equal(video.caption.hidden, true);
});

test("theme title filters and project jumps retain publication behavior", () => {
  const { themes, list, nodes } = setup();
  let scrolled = false;
  nodes.publications = { scrollIntoView() { scrolled = true; } };
  themes.listeners.click({ target: { closest: selector => selector === "[data-theme-filter]" ? { dataset: { themeFilter: "robotics" } } : null } });
  assert.equal(scrolled, true);
  assert.match(list.innerHTML, /id="pub-reflex"/);
  assert.doesNotMatch(list.innerHTML, /id="pub-molmo2"/);
  let jumped = false;
  nodes["pub-molmo2"] = {
    scrollIntoView() { jumped = true; },
    classList: { remove() {}, add() {} }, offsetWidth: 1
  };
  themes.listeners.click({
    preventDefault() {},
    target: { closest: selector => selector === "[data-jump]" ? { dataset: { jump: "molmo2" } } : null }
  });
  assert.equal(jumped, true);
  assert.match(list.innerHTML, /id="pub-molmo2"/);
});

function expectCaption(video, seconds, id, label, event = "timeupdate") {
  video.currentTime = seconds;
  video.listeners[event]();
  assert.equal(video.caption.textContent, label);
  assert.equal(video.caption.dataset.jump, id);
  assert.equal(video.caption.attributes.href, `#pub-${id}`);
}

test("captions start with the paper visible in each poster and sync when the first frame loads", () => {
  const { videos } = setup();
  assert.equal(manifest.themes.multimodal.poster_seconds, 9.5);
  assert.match(setup().themes.innerHTML, /class="theme-caption" href="#pub-molmo2" data-jump="molmo2">Molmo2<\/a>/);
  assert.deepEqual(videos.map(video => video.caption.textContent), ["WildDet3D", "Reflex", "Molmo2"]);
  expectCaption(videos[2], 0, "ipt", "IPT", "loadeddata");
});

test("robotics captions switch at 4s and 8s and stay on MolmoAct2 through the final frame", () => {
  const video = setup().videos[1];
  for (const [seconds, id, label] of [[0, "reflex", "Reflex"], [3.999, "reflex", "Reflex"],
    [4, "gam", "GAM"], [7.999, "gam", "GAM"], [8, "molmoact2", "MolmoAct2"],
    [11.999, "molmoact2", "MolmoAct2"], [12, "molmoact2", "MolmoAct2"]]) {
    expectCaption(video, seconds, id, label);
  }
});

test("VLM captions show IPT for 0–4s then Molmo2 across architecture and the full Q&A", () => {
  const video = setup().videos[2];
  for (const seconds of [0, 3.999]) expectCaption(video, seconds, "ipt", "IPT");
  for (const seconds of [4, 7.999, 8, 9.5, 13, 14.999, 15]) expectCaption(video, seconds, "molmo2", "Molmo2");
});

test("captions update on backward and forward seeks and reset when playback loops", () => {
  const { videos } = setup();
  for (const event of ["seeking", "seeked"]) {
    expectCaption(videos[1], 9, "molmoact2", "MolmoAct2", event);
    expectCaption(videos[1], 5, "gam", "GAM", event);
    expectCaption(videos[1], 1, "reflex", "Reflex", event);
    expectCaption(videos[2], 14, "molmo2", "Molmo2", event);
    expectCaption(videos[2], 2, "ipt", "IPT", event);
  }
  expectCaption(videos[2], 14.999, "molmo2", "Molmo2");
  expectCaption(videos[2], 0.01, "ipt", "IPT");
  for (const seconds of [0, 4, 8, 11.999, 0.01]) expectCaption(videos[0], seconds, "wilddet3d", "WildDet3D");
});

test("caption timing comes from manifest segments rather than a second EDL", () => {
  const { setMontages, renderThemes, videos } = setup();
  const changed = JSON.parse(JSON.stringify(manifest.themes));
  changed.robotics.segments[0].length = 2;
  setMontages(changed);
  renderThemes();
  expectCaption(videos[1], 2.5, "gam", "GAM");
  expectCaption(videos[1], 6, "molmoact2", "MolmoAct2");
  for (const entry of Object.values(manifest.themes)) {
    for (const segment of entry.segments) assert.ok(publications.some(paper => paper.id === segment.paper_id));
  }
});

test("caption uses the paper display font and overlays the intact canvas without a footer or panel", () => {
  const css = readFileSync(join(root, "assets/css/style.scss"), "utf8");
  assert.match(css, /--display:\s*"Source Serif 4"/);
  const caption = css.match(/\.theme-caption\s*\{([^}]+)\}/)[1];
  const title = css.match(/\.pub-title\s*\{([^}]+)\}/)[1];
  assert.match(title, /font:\s*600 .*var\(--display\)/);
  assert.match(caption, /font:\s*400 \.75rem\/1\.3 var\(--display\)/);
  assert.match(caption, /position:\s*absolute/);
  assert.match(caption, /bottom:\s*6px; left:\s*8px/);
  assert.match(caption, /color:\s*#fff/);
  assert.match(caption, /text-shadow:\s*0 1px 2px rgba\(0, 0, 0, \.65\)/);
  assert.doesNotMatch(caption, /background|padding|border|height|width/);
  assert.match(css, /\.theme-media video\s*\{[^}]*width: 100%; height: 100%; object-fit: contain/);
});

test("research media clips to the same 8px rounded rectangle as publication media", () => {
  const css = readFileSync(join(root, "assets/css/style.scss"), "utf8");
  for (const selector of ["theme-media", "media"]) {
    const media = css.match(new RegExp(`\\.${selector}\\s*\\{([^}]+)\\}`))[1];
    assert.match(media, /border-radius:\s*8px\s*;/);
    assert.match(media, /overflow:\s*hidden\s*;/);
  }
});

test("all three captions share a 6px bottom offset without theme-specific offsets", () => {
  const css = readFileSync(join(root, "assets/css/style.scss"), "utf8");
  const caption = css.match(/\.theme-caption\s*\{([^}]+)\}/)[1];
  assert.match(caption, /bottom:\s*6px; left:\s*8px/);
  assert.match(caption, /font:\s*400 \.75rem\/1\.3 var\(--display\)/);
  assert.equal((css.match(/\.theme-caption\s*\{/g) || []).length, 1);
  assert.doesNotMatch(css, /\.theme-media:has\(video\[data-theme="3d"\]\) \.theme-caption/);
});

test("all publication originals and publications.json remain identical to the repository versions", () => {
  const originals = execFileSync("git", ["ls-files", "img/papers"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
  assert.ok(originals.length > 0);
  for (const path of ["publications.json", ...originals]) {
    const original = execFileSync("git", ["show", `HEAD:${path}`], { cwd: root, maxBuffer: 100_000_000 });
    assert.equal(createHash("sha256").update(readFileSync(join(root, path))).digest("hex"),
      createHash("sha256").update(original).digest("hex"), path);
  }
});
