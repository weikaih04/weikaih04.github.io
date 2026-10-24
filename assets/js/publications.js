// Renders research themes, the publication list, the news toggle and the video lightbox.
// Data comes from publications.json; each paper lists its research areas in "themes".
(function () {
  const THEMES = {
    "3d": {
      name: "3D perception & generation in the wild",
      filter: "3D Vision",
      tags: [{ id: "wilddet3d" }]
    },
    robotics: {
      name: "Vision-centric robot policies",
      filter: "Robotics"
    },
    multimodal: {
      name: "VLMs for Embodied Reasoning",
      filter: "Multimodal",
      tags: [{ id: "molmoact2", label: "Molmo-ER" }, { id: "molmo2" }, { id: "provision" }]
    }
  };
  // Short names used for the paper tags under each research theme
  const SHORT = {
    wilddet3d: "WildDet3D", sos: "SOC", gas: "Generate Any Scene", reflex: "Reflex", gam: "GAM",
    molmoact2: "MolmoAct2", molmo2: "Molmo2", ipt: "IPT", svg2: "SVG2", trajtok: "TrajTok",
    provision: "ProVision", tma: "Task Me Anything", mms: "m&m's"
  };
  const LINK_LABEL = {
    arxiv: "arXiv", code: "Code", website: "Website", huggingface: "HF", demo: "Demo", data: "Data",
    blog: "Blog", app: "App", models: "Models", eval: "Eval", talk: "Talk", video: "Video", paper: "Paper"
  };
  const LINK_ORDER = ["website", "arxiv", "code"];
  const ME = "Weikai Huang";
  const MAX_AUTHORS = 6;
  const NEWS_VISIBLE = 5;

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const inTheme = (p, k) => (p.themes || []).includes(k);
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  let PUBS = [];
  let MONTAGES = {};
  let filter = "selected";
  let io = null;

  const FILTERS = () => [
    ["selected", "Selected", p => p.selected],
    ["all", "All", () => true],
    null,
    ...Object.entries(THEMES).map(([k, t]) => [k, t.filter, p => inTheme(p, k)])
  ];
  const filterFn = key => (FILTERS().find(f => f && f[0] === key) || FILTERS()[1])[2];

  /* ---------- Research themes ---------- */
  function renderThemes() {
    const el = document.getElementById("themes");
    if (!el) return;
    el.innerHTML = Object.entries(THEMES).map(([k, t]) => {
      const media = MONTAGES[k];
      if (!media) return "";
      const posterPaper = montagePaper(media, media.poster_seconds);
      const tagItems = t.tags || PUBS.filter(p => inTheme(p, k) && p.selected).map(p => ({ id: p.id }));
      const tags = tagItems.map(p => p.id
        ? `<a class="tag" href="#pub-${esc(p.id)}" data-jump="${esc(p.id)}">${esc(p.label || SHORT[p.id] || p.id)}</a>`
        : `<span class="tag">${esc(p.label)}</span>`).join("");
      const label = `${t.name} overview`;
      const video = `<div class="theme-media">
        <video id="theme-video-${k}" src="${esc(media.video)}" muted loop playsinline preload="auto" tabindex="0" role="button" aria-label="Play ${esc(label)} video; press Space or Enter to toggle playback" poster="${esc(media.poster)}" data-theme="${k}">Your browser does not support embedded video.</video>
        <a class="theme-caption" href="#pub-${esc(posterPaper)}" data-jump="${esc(posterPaper)}">${esc(SHORT[posterPaper] || posterPaper)}</a>
        <p class="theme-fallback" hidden>Video unavailable. <button class="theme-name" type="button" data-theme-filter="${k}">View ${esc(t.filter)} publications</button>.</p>
        </div>`;
      return `<div class="theme">
        ${video}
        <h3><button class="theme-name" type="button" data-theme-filter="${k}">${esc(t.name)}</button></h3>
        <div class="tags">${tags}</div></div>`;
    }).join("");
    el.addEventListener("click", e => {
      const t = e.target.closest("[data-theme-filter]");
      if (t) {
        filter = t.dataset.themeFilter; render();
        document.getElementById("publications").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
        return;
      }
      const j = e.target.closest("[data-jump]");
      if (j) { e.preventDefault(); revealPub(j.dataset.jump, true); }
    });
    observeThemeVideos(el);
  }

  // Use the same segment lengths and paper IDs that built the encoded montage.
  function montagePaper(media, seconds) {
    let end = 0;
    for (const segment of media.segments) {
      end += segment.length;
      if (seconds < end) return segment.paper_id;
    }
    return media.segments[media.segments.length - 1].paper_id;
  }

  // Theme playback has its own observer: publication filter renders must not disconnect it.
  function observeThemeVideos(el) {
    const states = new Map();
    const motion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    const observer = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
      entries.forEach(e => {
        const state = states.get(e.target);
        state.visible = e.isIntersecting && e.intersectionRatio >= 0.35;
        state.update();
      });
    }, { threshold: [0, 0.35] }) : null;

    el.querySelectorAll(".theme video").forEach(video => {
      const theme = video.closest(".theme");
      const caption = theme.querySelector(".theme-caption");
      const media = MONTAGES[video.dataset.theme];
      const syncCaption = () => {
        const id = montagePaper(media, video.currentTime);
        caption.textContent = SHORT[id] || id;
        caption.dataset.jump = id;
        caption.setAttribute("href", `#pub-${id}`);
      };
      ["loadeddata", "timeupdate", "seeking", "seeked", "play", "ended"].forEach(event => {
        video.addEventListener(event, syncCaption);
      });
      if (video.readyState >= 2) syncCaption();
      const state = { visible: !observer, userPaused: false, manualPlay: false };
      const play = () => { const result = video.play(); if (result) result.catch(() => {}); };
      state.update = () => {
        const automatic = observer && !(motion && motion.matches);
        if (state.visible && !state.userPaused && (automatic || state.manualPlay)) play();
        else video.pause();
      };
      states.set(video, state);
      video.muted = true;
      video.defaultPlaybackRate = video.playbackRate = 1;
      const syncLabel = () => {
        const action = video.paused ? "Play" : "Pause";
        video.setAttribute("aria-label", `${action} ${THEMES[video.dataset.theme].name} overview video; press Space or Enter to toggle playback`);
      };
      video.addEventListener("play", syncLabel);
      video.addEventListener("pause", syncLabel);
      syncLabel();
      const togglePlayback = () => {
        state.userPaused = !video.paused;
        state.manualPlay = !state.userPaused;
        if (state.userPaused) video.pause(); else play();
      };
      video.addEventListener("click", togglePlayback);
      video.addEventListener("keydown", event => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        if (!event.repeat) togglePlayback();
      });
      video.addEventListener("error", () => {
        video.pause();
        video.hidden = true;
        caption.hidden = true;
        theme.querySelector(".theme-fallback").hidden = false;
        state.userPaused = true;
      });
      if (observer) observer.observe(video);
    });
    if (motion && motion.addEventListener) motion.addEventListener("change", () => {
      states.forEach(state => { state.manualPlay = false; state.update(); });
    });
  }

  /* ---------- Filters ---------- */
  function renderFilters() {
    const el = document.getElementById("filters");
    if (!el) return;
    el.innerHTML = FILTERS().map(f => f
      ? `<button class="chip" type="button" data-f="${f[0]}" aria-pressed="false">${esc(f[1])}</button>`
      : `<span class="sep" aria-hidden="true"></span>`).join("");
    el.addEventListener("click", e => {
      const b = e.target.closest(".chip");
      if (b) { filter = b.dataset.f; render(); }
    });
  }

  /* ---------- Authors ---------- */
  const cleanName = a => a.replace(/[*§]/g, "").trim();
  function authorHTML(a) {
    const marks = (a.match(/[*§]/g) || []).join("");
    const name = cleanName(a);
    const cls = name === ME ? ' class="me"' : "";
    return `<span${cls}>${esc(name)}</span>${marks ? `<sup>${marks}</sup>` : ""}`;
  }
  function authorsBlock(p) {
    const all = p.authors || [];
    const full = all.map(authorHTML).join(", ");
    if (all.length <= MAX_AUTHORS) return full;
    const meIdx = all.findIndex(a => cleanName(a) === ME);
    let shown = all.slice(0, MAX_AUTHORS).map(authorHTML).join(", ");
    if (meIdx >= MAX_AUTHORS) {
      shown = all.slice(0, MAX_AUTHORS - 1).map(authorHTML).join(", ") + ", …, " + authorHTML(all[meIdx]);
    }
    const hidden = all.length - MAX_AUTHORS;
    return `<span class="short">${shown} <button class="toggle" type="button" data-expand>+${hidden} more</button></span>` +
      `<span class="full" hidden>${full} <button class="toggle" type="button" data-collapse>less</button></span>`;
  }

  /* ---------- Publication rows ---------- */
  function mediaHTML(p) {
    if (p.local_video) {
      const label = `Play ${SHORT[p.id] || p.title} video larger`;
      return `<button class="media" type="button" data-video="${esc(p.local_video)}" aria-label="${esc(label)}">
        <video src="${esc(p.local_video)}" muted loop playsinline preload="metadata" data-rate="${p.playback_rate || 1}"></video><span class="expand">Expand</span></button>`;
    }
    if (p.image) return `<span class="media"><img src="${esc(p.image)}" alt="" loading="lazy"></span>`;
    return `<span class="media"></span>`;
  }
  function venueHTML(p) {
    const venue = (p.venue === "Arxiv" ? "arXiv" : p.venue || "").replace(" (Main Conference)", "");
    const extra = p.additional_venue ? `<span class="extra">${esc(p.additional_venue)}</span>` : "";
    const awards = (p.award || "").split(";").map(s => s.trim()).filter(Boolean)
      .map(a => `<span class="award">${esc(a)}</span>`).join("");
    return `<p class="venue"><span class="v">${esc(`${venue} ${p.year || ""}`.trim())}</span>${extra}${awards}</p>`;
  }
  function linksHTML(p) {
    const rank = k => { const i = LINK_ORDER.indexOf(k); return i < 0 ? LINK_ORDER.length : i; };
    const entries = Object.entries(p.links || {})
      .map((e, i) => [e, i]).sort((x, y) => rank(x[0][0]) - rank(y[0][0]) || x[1] - y[1]).map(x => x[0]);
    const seen = new Set();
    return `<p class="plinks">${entries.filter(([k, u]) => {
      if (seen.has(u) && k !== "code") return false;
      seen.add(u); return true;
    }).map(([k, u]) => {
      const stars = k === "code" && p.github_stars ? `<span class="stars">★ ${p.github_stars}</span>` : "";
      return `<a href="${esc(u)}">${LINK_LABEL[k] || esc(k)}${stars}</a>`;
    }).join("")}</p>`;
  }
  function pubHTML(p) {
    const href = (p.links && (p.links.website || p.links.arxiv)) || "#";
    return `<article class="pub" id="pub-${esc(p.id)}">
      ${mediaHTML(p)}
      <div class="pub-text">
        <h4 class="pub-title"><a href="${esc(href)}">${esc(p.title)}</a></h4>
        <p class="authors">${authorsBlock(p)}</p>
        ${venueHTML(p)}
        ${linksHTML(p)}
        ${p.tldr ? `<button class="tldr" type="button" aria-expanded="false"><b>TL;DR</b>${esc(p.tldr)}</button>` : ""}
      </div></article>`;
  }

  function render() {
    const list = document.getElementById("pubList");
    if (!list) return;
    const items = PUBS.filter(filterFn(filter));
    let html = "", year = null;
    for (const p of items) {
      if (p.year !== year) { year = p.year; html += `<div class="year">${esc(year)}</div>`; }
      html += pubHTML(p);
    }
    list.innerHTML = html;
    document.querySelectorAll("#filters .chip").forEach(c => c.setAttribute("aria-pressed", String(c.dataset.f === filter)));
    observeVideos(list);
  }

  // Autoplay videos only while on screen; respect reduced motion
  function observeVideos(list) {
    if (io) io.disconnect();
    const vids = list.querySelectorAll(".media video");
    vids.forEach(v => { v.playbackRate = Number(v.dataset.rate) || 1; });
    if (reduce || !("IntersectionObserver" in window)) return;
    io = new IntersectionObserver(entries => entries.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) { const r = v.play(); if (r) r.catch(() => {}); } else v.pause();
    }), { threshold: 0.35 });
    vids.forEach(v => io.observe(v));
  }

  function revealPub(id, flash) {
    const p = PUBS.find(x => x.id === id);
    if (!p) return;
    if (!filterFn(filter)(p)) { filter = (p.themes && p.themes[0]) || "all"; render(); }
    const el = document.getElementById("pub-" + id);
    if (!el) return;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    if (flash) { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
  }

  function bindListEvents() {
    const list = document.getElementById("pubList");
    if (!list) return;
    list.addEventListener("click", e => {
      const ex = e.target.closest("[data-expand]"), co = e.target.closest("[data-collapse]");
      if (ex || co) {
        const a = (ex || co).closest(".authors");
        a.querySelector(".short").hidden = !!ex;
        a.querySelector(".full").hidden = !ex;
        return;
      }
      const t = e.target.closest(".tldr");
      if (t) { const o = t.classList.toggle("open"); t.setAttribute("aria-expanded", String(o)); return; }
      const m = e.target.closest("[data-video]");
      if (m) openLightbox(m.dataset.video);
    });
  }

  /* ---------- Lightbox ---------- */
  const lb = document.getElementById("lightbox");
  const lbv = document.getElementById("lbVideo");
  function openLightbox(src) {
    if (!lb || !lbv) return;
    lbv.src = src;
    if (typeof lb.showModal === "function") lb.showModal(); else lb.setAttribute("open", "");
    const r = lbv.play(); if (r) r.catch(() => {});
  }
  function closeLightbox() {
    lbv.pause(); lbv.removeAttribute("src"); lbv.load();
    if (lb.open) lb.close(); else lb.removeAttribute("open");
  }
  if (lb && lbv) {
    document.getElementById("lbClose").addEventListener("click", closeLightbox);
    lb.addEventListener("click", e => { if (e.target === lb) closeLightbox(); });
    lb.addEventListener("close", () => lbv.pause());
  }

  /* ---------- News ---------- */
  const newsItems = [...document.querySelectorAll("#newsList li")];
  const newsBtn = document.getElementById("newsMore");
  function setNews(open) {
    newsItems.forEach((li, i) => { li.hidden = !open && i >= NEWS_VISIBLE; });
    newsBtn.textContent = open ? "Show fewer" : `Show all ${newsItems.length}`;
    newsBtn.setAttribute("aria-expanded", String(open));
  }
  if (newsBtn) {
    if (newsItems.length <= NEWS_VISIBLE) newsBtn.hidden = true;
    else {
      newsBtn.addEventListener("click", () => setNews(newsBtn.getAttribute("aria-expanded") !== "true"));
      setNews(false);
    }
  }

  /* ---------- Load ---------- */
  renderFilters();
  bindListEvents();
  const loadJSON = url => fetch(url)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
  Promise.all([
    loadJSON("publications.json"),
    loadJSON("img/research/manifest.json").catch(err => {
      console.error("Could not load research montage manifest", err);
      return { themes: {} };
    })
  ])
    .then(([data, manifest]) => {
      PUBS = data.publications || [];
      MONTAGES = manifest.themes || {};
      renderThemes();
      render();
      const fromHash = flash => {
        const m = location.hash.match(/^#pub-([\w-]+)$/);
        if (m) revealPub(m[1], flash);
      };
      fromHash(false);
      window.addEventListener("hashchange", () => fromHash(true));
    })
    .catch(err => {
      console.error("Could not load publications.json", err);
      const list = document.getElementById("pubList");
      if (list) list.innerHTML = "<p>Publications failed to load. Please refresh the page.</p>";
    });
})();
