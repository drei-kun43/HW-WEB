/* ===== HOW THIS WORKS =====
   1 SUBJECTS   the subject list (edit here)
   2 DATA       homework = [{id, subject, title, details, due, done}] saved in localStorage "homework-v1"
   3 parseText  turns a .txt file into homework items
   4 render     draws everything from the data
   5 motion     GSAP: wipe transition, scroll reveals, count-up
   6 3D         Three.js: the silver knot in the intro */
const $ = id => document.getElementById(id), KEY = "homework-v1";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// 1 SUBJECTS
const SUBJECTS = [
  {name:"Life Skills",also:[]},{name:"Creative Composition",also:["creative comp"]},
  {name:"Effective Communication",also:["eff com","effcom"]},{name:"Contemporary Literature",also:["contemp lit","literature"]},
  {name:"Theology",also:["theo"]},{name:"Kasaysayan sa Lipunang Filipino",also:["kasaysayan","kasaysayan sa lipunan"]},
  {name:"Marketing",also:[]},{name:"Practical Research",also:["research"],placeholder:true},
  {name:"General Science",also:["gen sci","science"]},{name:"General Math",also:["gen math","math"]}];
const UNS = "Unsorted";
const findSubject = t => { t = t.trim().toLowerCase(); return SUBJECTS.find(s => s.name.toLowerCase() === t || s.also.includes(t)); };

// 2 DATA
let homework = [], st = "all", sf = "All", lastDel = null, toastT;
const load = () => { try { homework = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { homework = []; } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(homework)); } catch (e) {} };
const mk = (subject, title, details, due) => ({id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), subject, title: title || "(untitled)", details: details || "", due: due || "", done: false});
const pad = n => String(n).padStart(2, "0");
const ymd = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const over = h => h.due && !h.done && h.due < ymd(new Date());
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt = d => new Date(d + "T00:00").toLocaleDateString("en", {month:"short", day:"numeric", year:"numeric"});

// 3 .TXT IMPORT   Subject: [Title][Details]   (also: Subject: Title - Details)
function parseText(text) {
  const out = [];
  text.split(/\r?\n/).forEach(line => {
    line = line.trim(); if (!line) return;
    const m = line.match(/^([^:\[]+?)\s*:\s*(.+)$/), s = m && findSubject(m[1]);
    if (!s) { out.push(mk(UNS, line, "")); return; }
    const b = [...m[2].matchAll(/\[([^\]]*)\]/g)].map(x => x[1].trim());
    if (b.length && b[0]) out.push(mk(s.name, b[0], b.slice(1).join(" ")));
    else { const p = m[2].split(/\s+[-|]\s+/); out.push(mk(s.name, p[0], p.slice(1).join(" - "))); }
  });
  return out;
}

const pv = {v: 0};
function tweenPct(p) {
  if (!window.gsap || reduce) { $("pct").textContent = p + "%"; return; }
  gsap.to(pv, {v: p, duration: .9, ease: "power3.out", overwrite: true, onUpdate: () => { $("pct").textContent = Math.round(pv.v) + "%"; }});
}
// 4 RENDER
let lastOpts = "";
function render() {
  const total = homework.length, done = homework.filter(h => h.done).length, pct = total ? Math.round(done / total * 100) : 0;
  tweenPct(pct); $("barI").style.width = pct + "%"; $("barA").setAttribute("aria-valuenow", pct);
  $("cnt").textContent = total ? `${pad(done)} / ${pad(total)} completed` : "No homework yet";
  $("sDone").textContent = pad(done); $("sPend").textContent = pad(total - done); $("sOver").textContent = pad(homework.filter(over).length);

  const names = SUBJECTS.map(s => s.name); if (homework.some(h => h.subject === UNS)) names.push(UNS);
  const opts = `<option value="All">All subjects</option>` + names.map(n => `<option>${esc(n)}</option>`).join("");
  if (opts !== lastOpts) { $("subjFilter").innerHTML = opts; lastOpts = opts; }
  $("subjFilter").value = names.includes(sf) ? sf : "All"; if (!names.includes(sf)) sf = "All";

  const shown = homework.filter(h => (sf === "All" || h.subject === sf) && (st === "all" || (st === "pending" && !h.done) || (st === "done" && h.done) || (st === "overdue" && over(h))))
    .sort((a, b) => a.done - b.done || (a.due || "9999").localeCompare(b.due || "9999"));
  $("empty").hidden = total > 0; $("tools").hidden = !total;
  $("list").innerHTML = !total ? "" : shown.length ? shown.map((h, i) => {
    const s = SUBJECTS.find(x => x.name === h.subject);
    return `<article class="item ${h.done ? "done" : ""}" style="--d:${Math.min(i, 8) * 55}ms">
      <div class="no">${pad(i + 1)}</div>
      <div><p class="lab" style="letter-spacing:.14em">${esc(h.subject)}${s && s.placeholder ? '<span class="pill">placeholder</span>' : ""}${over(h) ? '<span class="pill">overdue</span>' : ""}</p>
        <h3 class="t">${esc(h.title)}</h3>${h.details ? `<p class="det">${esc(h.details)}</p>` : ""}${h.due ? `<p class="due">Due: ${fmt(h.due)}</p>` : ""}</div>
      <div class="act"><button class="ab" data-act="toggle" data-id="${h.id}">${h.done ? "Undo" : "Done"}</button><button class="ab" data-act="edit" data-id="${h.id}">Edit</button><button class="ab" data-act="del" data-id="${h.id}">Delete</button></div></article>`;
  }).join("") : `<div class="empty"><p>No homework matches these filters.</p></div>`;

  $("subs").innerHTML = names.map(n => { const a = homework.filter(h => h.subject === n), o = a.filter(h => !h.done).length;
    return `<button class="sub" data-sub="${esc(n)}"><b>${esc(n)}</b><small>${o} open / ${a.length} total</small></button>`; }).join("");
  document.querySelectorAll(".f").forEach(b => b.setAttribute("aria-pressed", b.dataset.st === st));
}

// toast
function toast(msg, undo) {
  $("toastMsg").textContent = msg; $("toastUndo").hidden = !undo; $("toastUndo").onclick = () => { undo(); $("toast").classList.remove("show"); };
  $("toast").classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => $("toast").classList.remove("show"), undo ? 5000 : 2600);
}

// form (add + edit)
$("fSubject").innerHTML = SUBJECTS.map(s => `<option>${esc(s.name)}</option>`).join("");
function openForm(id) {
  const h = homework.find(x => x.id === id);
  $("dTitle").textContent = h ? "Edit homework" : "Add homework"; $("editId").value = h ? h.id : "";
  $("fSubject").value = h && h.subject !== UNS ? h.subject : SUBJECTS[0].name;
  $("fTitle").value = h ? h.title : ""; $("fDetails").value = h ? h.details : ""; $("fDue").value = h ? h.due : ""; $("err").textContent = "";
  $("dlg").showModal(); $("fTitle").focus();
}
$("addBtn").onclick = $("addBtn2").onclick = () => openForm();
$("cancel").onclick = () => $("dlg").close();
$("form").onsubmit = e => {
  e.preventDefault();
  const title = $("fTitle").value.trim();
  if (!title) { $("err").textContent = "Please enter a homework title."; $("fTitle").focus(); return; }
  const id = $("editId").value, h = homework.find(x => x.id === id);
  if (h) Object.assign(h, {subject: $("fSubject").value, title, details: $("fDetails").value.trim(), due: $("fDue").value});
  else homework.push(mk($("fSubject").value, title, $("fDetails").value.trim(), $("fDue").value));
  save(); render(); $("dlg").close(); toast(h ? "Changes saved." : "Homework added.");
};

// list actions, filters
$("list").onclick = e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const i = homework.findIndex(h => h.id === b.dataset.id); if (i < 0) return;
  if (b.dataset.act === "toggle") { homework[i].done = !homework[i].done; save(); render(); }
  if (b.dataset.act === "edit") openForm(homework[i].id);
  if (b.dataset.act === "del") { const [x] = homework.splice(i, 1); save(); render(); toast("Homework deleted.", () => { homework.splice(Math.min(i, homework.length), 0, x); save(); render(); }); }
};
$("tools").onclick = e => { const b = e.target.closest("[data-st]"); if (b) { st = b.dataset.st; render(); } };
$("subjFilter").onchange = e => { sf = e.target.value; render(); };
$("subs").onclick = e => { const b = e.target.closest("[data-sub]"); if (b) { sf = b.dataset.sub; st = "all"; render(); scrollTo_("workspace"); } };

// import
$("file").onchange = async e => {
  const f = e.target.files[0]; if (!f) return; const msg = $("importMsg");
  try {
    if (f.size > 1e6) throw new Error("big");
    const items = parseText(await f.text());
    if (!items.length) { msg.textContent = "No homework lines found. Use: Subject: [Title][Details]"; return; }
    const key = h => [h.subject, h.title, h.details].join("|").toLowerCase(), have = new Set(homework.map(key));
    const fresh = items.filter(h => !have.has(key(h)) && have.add(key(h)));
    homework.push(...fresh); save(); render();
    const un = fresh.filter(h => h.subject === UNS).length;
    msg.textContent = `Added ${fresh.length}` + (items.length - fresh.length ? `, skipped ${items.length - fresh.length} duplicate(s)` : "") + (un ? `, ${un} in Unsorted (subject not recognized).` : ".");
  } catch (err) { msg.textContent = "Couldn’t read that file. Choose a plain .txt under 1 MB."; }
  e.target.value = "";
};

// settings
$("settingsBtn").onclick = () => { closeMenu(); $("set").showModal(); };
$("closeSet").onclick = () => $("set").close();
$("grainT").onchange = e => document.body.classList.toggle("nograin", !e.target.checked);
$("clearDone").onclick = () => { homework = homework.filter(h => !h.done); save(); render(); toast("Finished homework removed."); };
let armed; $("eraseAll").onclick = e => {
  if (!armed) { armed = setTimeout(() => { armed = 0; e.target.textContent = "Erase everything"; }, 4000); e.target.textContent = "Tap again to confirm"; return; }
  clearTimeout(armed); armed = 0; e.target.textContent = "Erase everything"; homework = []; save(); render(); toast("Everything erased.");
};

// 5 MOTION: wipe transition + navigation
let view = "hero", busy = false;
const scrollTo_ = id => $(id).scrollIntoView({behavior: reduce ? "auto" : "smooth"});
function wipe(label, swap) {
  if (reduce || !window.gsap) { swap(); return; }
  busy = true; const w = $("wipe"), t = w.firstElementChild; t.textContent = label;
  gsap.timeline({onComplete: () => { busy = false; }})
    .set(w, {clipPath: "inset(0 100% 0 0)"}).set(t, {xPercent: -8})
    .to(w, {clipPath: "inset(0 0% 0 0)", duration: .8, ease: "power4.inOut"})
    .to(t, {xPercent: 0, duration: .8, ease: "power3.out"}, "<")
    .add(() => { swap(); if (window.ScrollTrigger) ScrollTrigger.refresh(); })
    .to(w, {clipPath: "inset(0 0% 0 100%)", duration: .8, ease: "power4.inOut"}, "+=.15")
    .to(t, {xPercent: 6, duration: .8, ease: "power3.in"}, "<");
}
function go(id) {
  if (busy) return; closeMenu();
  if (id === "hero" && view === "app") wipe("01 — Intro", () => setView("hero"));
  else if (id !== "hero" && view === "hero") wipe(id === "workspace" ? "02 — Workspace" : id, () => { setView("app"); scrollTo(0, 0); if (id !== "workspace") $(id).scrollIntoView(); });
  else if (id !== "hero") scrollTo_(id);
}
function setView(v) { view = v; document.body.dataset.view = v; $("hero").hidden = v !== "hero"; $("app").hidden = v !== "app"; if (v === "app") observe(); if (gl) v === "hero" ? gl.start() : gl.stop(); scrollTo(0, 0); }
document.querySelectorAll("[data-go]").forEach(a => a.onclick = e => { e.preventDefault(); go(a.dataset.go); });
$("enter").onclick = () => go("workspace");
const closeMenu = () => { $("links").classList.remove("open"); $("menu").setAttribute("aria-expanded", "false"); };
$("menu").onclick = () => { const o = $("links").classList.toggle("open"); $("menu").setAttribute("aria-expanded", o); };

// reveal on scroll + active nav link
let seen = false;
function observe() {
  if (seen) return; seen = true;
  if (window.gsap && window.ScrollTrigger && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    document.querySelectorAll(".rv").forEach(el => gsap.from(el, {autoAlpha: 0, y: 44, duration: 1.1, ease: "power3.out", scrollTrigger: {trigger: el, start: "top 90%", once: true}}));
    document.querySelectorAll("#app h2").forEach(h => gsap.to(h, {x: () => -innerWidth * .05, ease: "none", scrollTrigger: {trigger: h, start: "top bottom", end: "bottom top", scrub: true}}));
  }
  const nav = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) document.querySelectorAll("#links a").forEach(a => a.setAttribute("aria-current", a.dataset.go === e.target.id)); }), {rootMargin: "-45% 0px -50% 0px"});
  ["workspace", "subjects", "progress"].forEach(id => nav.observe($(id)));
}
// hero pointer parallax
if (!reduce && matchMedia("(pointer:fine)").matches) { let r; $("hero").onpointermove = e => { if (r) return; r = requestAnimationFrame(() => { r = 0; $("hero").style.setProperty("--px", (e.clientX / innerWidth - .5).toFixed(3)); $("hero").style.setProperty("--py", (e.clientY / innerHeight - .5).toFixed(3)); }); }; }

// 6 3D HERO (Three.js). Desktop only; phones keep the lighter SVG ring.
let gl = null, mx = 0, my = 0;
function initGL() {
  if (!window.THREE || reduce || innerWidth < 900 || !matchMedia("(pointer:fine)").matches) return;
  try {
    const c = document.createElement("canvas"); c.className = "gl"; c.setAttribute("aria-hidden", "true");
    const stage = document.querySelector(".stage"); stage.appendChild(c);
    const r = new THREE.WebGLRenderer({canvas: c, alpha: true, antialias: true}); r.setPixelRatio(Math.min(devicePixelRatio, 2));
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(35, 1, .1, 50); cam.position.z = 7;
    // chrome look drawn with a canvas "matcap" (no image files needed)
    const mc = document.createElement("canvas"); mc.width = mc.height = 256; const x = mc.getContext("2d");
    let g = x.createRadialGradient(100, 90, 10, 128, 128, 128);
    [[0, "#fff"], [.35, "#d6d6d3"], [.7, "#7a7a77"], [1, "#161615"]].forEach(a => g.addColorStop(a[0], a[1])); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    g = x.createLinearGradient(0, 0, 256, 0); g.addColorStop(0, "rgba(0,0,0,.35)"); g.addColorStop(.5, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(0,0,0,.25)"); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    const geo = new THREE.TorusKnotGeometry(1.15, .38, 240, 36);
    const mat = new THREE.MeshMatcapMaterial({matcap: new THREE.CanvasTexture(mc)});
    const wmat = new THREE.MeshBasicMaterial({color: 0x080808, wireframe: true, transparent: true, opacity: .08});
    const grp = new THREE.Group(), mesh = new THREE.Mesh(geo, mat), wire = new THREE.Mesh(geo, wmat);
    wire.scale.setScalar(1.05); grp.add(mesh, wire); sc.add(grp);
    const size = () => { const h = $("hero"), w = h.clientWidth, hh = h.clientHeight; if (!w || !hh) return; r.setSize(w, hh, false); cam.aspect = w / hh; cam.updateProjectionMatrix(); grp.position.x = Math.min(2.5, cam.aspect * 1.2); };
    size(); addEventListener("resize", size);
    addEventListener("pointermove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
    let raf = 0, t = 0;
    const tick = () => { raf = requestAnimationFrame(tick); t += .01; grp.rotation.y += .005 + mx * .004; grp.rotation.x += (my * .7 - grp.rotation.x) * .04; grp.rotation.z += (mx * .3 - grp.rotation.z) * .04; grp.position.y = Math.sin(t) * .08; r.render(sc, cam); };
    gl = {start() { if (!raf) { size(); tick(); } }, stop() { cancelAnimationFrame(raf); raf = 0; }};
    stage.classList.add("gl-on");
  } catch (err) { gl = null; }
}
load(); render(); initGL(); if (gl) gl.start();
