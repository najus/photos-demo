(function () {
  var DATA, photos = [], byAlbum = {};
  var grid = document.getElementById("grid");
  var state = { album: "all", layout: "masonry", hover: "exif" };
  var currentList = [], lbIdx = 0;

  function exifLine(p) {
    var e = p.exif || {}, bits = [];
    if (e.Camera) bits.push(e.Camera);
    if (e.Lens) bits.push(e.Lens);
    if (e.Aperture) bits.push("ƒ/" + String(e.Aperture).replace(/[^0-9.]/g, ""));
    if (e.Exposure) bits.push(e.Exposure);
    if (e.ISO) bits.push("ISO " + String(e.ISO).replace(/[^0-9]/g, ""));
    if (e["Focal length"]) bits.push(e["Focal length"]);
    return bits.join(" · ");
  }
  function esc(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  fetch("data.json").then(function (r) { return r.json(); }).then(function (d) {
    DATA = d; photos = d.photos;
    photos.forEach(function (p) { (byAlbum[p.album_slug] = byAlbum[p.album_slug] || []).push(p); });
    buildIndex(); buildPills(); renderGrid(photos); buildFilm(); buildColourWall(); startStory();
    initLightbox();
  });

  /* ---- theme + shuffle ---- */
  document.getElementById("themeBtn").addEventListener("click", function () {
    var dark = document.body.classList.toggle("dark");
    this.textContent = dark ? "☀️ Gallery light" : "🌑 Darkroom";
  });
  document.getElementById("shuffleBtn").addEventListener("click", function () {
    var list = state.album === "all" ? photos.slice() : byAlbum[state.album].slice();
    for (var i = list.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = list[i]; list[i] = list[j]; list[j] = t; }
    renderGrid(list);
    document.getElementById("exp3").scrollIntoView({ behavior: "smooth" });
  });

  /* ---- 01 story hero ---- */
  var FEATURED = ["30582166924", "30790679834", "31278222750", "33442529120", "31671225123"];
  function startStory() {
    var feats = FEATURED.map(function (id) { return photos.find(function (p) { return p.id === id; }); }).filter(Boolean);
    if (!feats.length) feats = photos.slice(0, 5);
    var img = document.getElementById("storyImg"), segs = document.getElementById("storySegs");
    var title = document.getElementById("storyTitle"), meta = document.getElementById("storyMeta"), count = document.getElementById("storyCount");
    var story = document.getElementById("story"), idx = 0, timer = null, paused = false;
    feats.forEach(function () { segs.appendChild(document.createElement("i")); });
    function show(i) {
      idx = (i + feats.length) % feats.length;
      var p = feats[idx];
      img.style.animation = "none"; void img.offsetWidth; img.style.animation = "";
      img.src = p.large; img.alt = p.title;
      title.textContent = p.title; meta.textContent = p.album + (exifLine(p) ? " — " + exifLine(p) : "");
      count.textContent = (idx + 1) + " / " + feats.length;
      Array.prototype.forEach.call(segs.children, function (s, k) {
        s.className = k < idx ? "done" : (k === idx ? "playing" : "");
        if (k === idx) { s.style.animation = "none"; void s.offsetWidth; s.style.animation = ""; }
      });
      clearTimeout(timer); timer = setTimeout(function () { if (!paused) show(idx + 1); }, 6000);
    }
    ["pointerdown"].forEach(function (ev) { story.addEventListener(ev, function () { paused = true; story.classList.add("paused"); }); });
    ["pointerup", "pointerleave"].forEach(function (ev) { story.addEventListener(ev, function () { if (paused) { paused = false; story.classList.remove("paused"); show(idx + 1); } }); });
    story.addEventListener("click", function () { show(idx + 1); });
    show(0);
  }

  /* ---- 02 editorial index + cursor preview ---- */
  function buildIndex() {
    var list = document.getElementById("indexList"), prev = document.getElementById("cursorPreview"), pimg = prev.querySelector("img");
    DATA.albums.forEach(function (a, i) {
      var cover = (byAlbum[a.slug] || [])[0];
      var row = document.createElement("a");
      row.className = "index-row"; row.href = "https://photos.sujanthapa.com/albums/" + a.slug + "/";
      row.innerHTML = '<span class="no">0' + (i + 1) + '</span><span class="name">' + esc(a.name) + '</span><span class="cnt">' + a.count + ' photos</span><span class="arr">→</span>';
      row.addEventListener("mouseenter", function () { if (cover) { pimg.src = cover.thumb; prev.classList.add("show"); } });
      row.addEventListener("mouseleave", function () { prev.classList.remove("show"); });
      list.appendChild(row);
    });
    document.addEventListener("mousemove", function (e) {
      prev.style.left = Math.min(e.clientX + 24, innerWidth - 320) + "px";
      prev.style.top = Math.max(e.clientY - 100, 8) + "px";
    });
  }

  /* ---- 03 grid playground ---- */
  function buildPills() {
    var wrap = document.getElementById("albumPills");
    var mk = function (slug, label) {
      var b = document.createElement("button"); b.textContent = label; if (slug === "all") b.className = "on";
      b.addEventListener("click", function () {
        state.album = slug;
        Array.prototype.forEach.call(wrap.children, function (c) { c.classList.remove("on"); }); b.classList.add("on");
        renderGrid(slug === "all" ? photos : byAlbum[slug]);
      });
      wrap.appendChild(b);
    };
    mk("all", "All 90");
    DATA.albums.forEach(function (a) { mk(a.slug, a.name); });
    document.querySelectorAll("[data-ctl]").forEach(function (group) {
      group.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        Array.prototype.forEach.call(group.children, function (c) { c.classList.remove("on"); }); b.classList.add("on");
        var kind = group.getAttribute("data-ctl"), v = b.getAttribute("data-v").trim();
        if (kind === "layout") { state.layout = v; grid.className = "grid " + v + (grid.classList.contains("compact") ? " compact" : "") + (state.hover === "none" ? " no-hover" : ""); observe(); }
        if (kind === "density") { grid.classList.toggle("compact", v === "compact"); }
        if (kind === "hover") { state.hover = v; grid.classList.toggle("no-hover", v === "none"); renderGrid(currentList); }
      });
    });
  }
  var io;
  function observe() {
    if (io) io.disconnect();
    io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { rootMargin: "120px" });
    grid.querySelectorAll("figure").forEach(function (f) { io.observe(f); });
  }
  function renderGrid(list) {
    currentList = list;
    grid.innerHTML = "";
    list.forEach(function (p, i) {
      var f = document.createElement("figure");
      f.style.background = p.color;
      var veil = state.hover === "exif" ? "<b>" + esc(p.title) + "</b>" + esc(exifLine(p) || p.album)
        : state.hover === "title" ? "<b>" + esc(p.title) + "</b>" + esc(p.album) : "";
      f.innerHTML = '<img loading="lazy" src="' + p.thumb + '" srcset="' + p.srcset + '" sizes="400px" alt="' + esc(p.title) + '" width="' + p.thumb_w + '" height="' + p.thumb_h + '"><figcaption class="veil">' + veil + "</figcaption>";
      f.addEventListener("click", function () { openLb(list, i); });
      grid.appendChild(f);
    });
    observe();
  }

  /* ---- 04 filmstrip ---- */
  function buildFilm() {
    var track = document.getElementById("filmTrack");
    (byAlbum["airplanes"] || []).forEach(function (p, i) {
      var f = document.createElement("figure");
      f.innerHTML = '<img loading="lazy" src="' + p.thumb + '" alt="' + esc(p.title) + '"><figcaption>' + String(i + 1).padStart(2, "0") + "A · " + esc(p.title.slice(0, 16)) + "</figcaption>";
      f.addEventListener("click", function () { openLb(byAlbum["airplanes"], i); });
      track.appendChild(f);
    });
    var down = false, sx = 0, sl = 0;
    track.addEventListener("pointerdown", function (e) { down = true; sx = e.clientX; sl = track.scrollLeft; });
    document.addEventListener("pointermove", function (e) { if (down) track.scrollLeft = sl - (e.clientX - sx); });
    document.addEventListener("pointerup", function () { down = false; });
  }

  /* ---- 06 colour wall ---- */
  function hue(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = 0;
    if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
    return [h, mx]; // sort by hue, greys/dark first by value tiebreak
  }
  function buildColourWall() {
    var wall = document.getElementById("colourWall");
    var sorted = photos.slice().sort(function (a, b) { var x = hue(a.color), y = hue(b.color); return x[0] - y[0] || x[1] - y[1]; });
    sorted.forEach(function (p, i) {
      var a = document.createElement("a");
      a.style.background = p.color; a.title = p.title + " — " + p.color;
      a.innerHTML = '<img loading="lazy" src="' + p.thumb + '" alt="' + esc(p.title) + '">';
      a.addEventListener("click", function () { openLb(sorted, i); });
      wall.appendChild(a);
    });
  }

  /* ---- 05 lightbox pro ---- */
  var lb, lbImg, lbTitle, lbExif, lbStrip, lbCount, lbGlow, lbList = [];
  function initLightbox() {
    lb = document.getElementById("lb"); lbImg = document.getElementById("lbImg");
    lbTitle = document.getElementById("lbTitle"); lbExif = document.getElementById("lbExif");
    lbStrip = document.getElementById("lbStrip"); lbCount = document.getElementById("lbCount"); lbGlow = document.getElementById("lbGlow");
    document.getElementById("lbClose").addEventListener("click", closeLb);
    document.getElementById("lbPrev").addEventListener("click", function () { step(-1); });
    document.getElementById("lbNext").addEventListener("click", function () { step(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") closeLb(); if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1);
    });
    var tx = null;
    lb.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 44) step(dx < 0 ? 1 : -1); tx = null; }, { passive: true });
  }
  function openLb(list, i) {
    lbList = list; lbStrip.innerHTML = "";
    list.forEach(function (p, k) {
      var im = document.createElement("img"); im.src = p.thumb; im.alt = p.title;
      im.addEventListener("click", function () { show(k); });
      lbStrip.appendChild(im);
    });
    lb.hidden = false; document.body.style.overflow = "hidden"; show(i);
  }
  function show(i) {
    lbIdx = (i + lbList.length) % lbList.length;
    var p = lbList[lbIdx];
    lbImg.src = p.large; lbImg.alt = p.title;
    lbTitle.textContent = p.title;
    lbExif.textContent = [p.album, exifLine(p), "on Flickr ↗"].filter(Boolean).join(" · ");
    lbGlow.style.background = "radial-gradient(circle at 50% 42%, " + p.color + " 0%, transparent 65%)";
    lbCount.textContent = (lbIdx + 1) + " / " + lbList.length;
    Array.prototype.forEach.call(lbStrip.children, function (c, k) { c.classList.toggle("on", k === lbIdx); });
    var on = lbStrip.children[lbIdx]; if (on) on.scrollIntoView({ inline: "center", block: "nearest" });
  }
  function step(d) { show(lbIdx + d); }
  function closeLb() { lb.hidden = true; lbImg.src = ""; document.body.style.overflow = ""; }
})();
