import { COSTS, MATCH_SECS, POP_CAP, TEAM } from "./config.js";
import { tickAI } from "./ai.js";
import { bootMuteFromStorage, isMuted, setMuted, setTrack, sfx, unlock } from "./audio.js";
import { draw, drawPortrait, screenToWorld, viewFit } from "./render.js";
import { loadSprites } from "./sprites.js";
import {
  activeBuild,
  canPlace,
  coachHint,
  commandSelected,
  constructionHint,
  createState,
  hasReady,
  inspectCopy,
  issue,
  nextQueued,
  pickAt,
  queuedCounts,
  skipToFever,
  step,
  teamPop,
} from "./sim.js";

loadSprites();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const portrait = document.getElementById("portrait");

const els = {
  title: document.getElementById("title"),
  end: document.getElementById("end"),
  paused: document.getElementById("paused"),
  help: document.getElementById("help"),
  cakeChip: document.getElementById("cakeChip"),
  popChip: document.getElementById("popChip"),
  cakeNum: document.getElementById("cakeNum"),
  popNum: document.getElementById("popNum"),
  speedGroup: document.getElementById("speedGroup"),
  pauseBtn: document.getElementById("pauseBtn"),
  muteBtn: document.getElementById("muteBtn"),
  clock: document.getElementById("clock"),
  clockLabel: document.getElementById("clockLabel"),
  toastFill: document.getElementById("toastFill"),
  mallowFill: document.getElementById("mallowFill"),
  mallowName: document.getElementById("mallowName"),
  banner: document.getElementById("banner"),
  inspect: document.getElementById("inspect"),
  insName: document.getElementById("insName"),
  insSub: document.getElementById("insSub"),
  insHpNum: document.getElementById("insHpNum"),
  insHpFill: document.getElementById("insHpFill"),
  insProgWrap: document.getElementById("insProgWrap"),
  insProgLabel: document.getElementById("insProgLabel"),
  insProgNum: document.getElementById("insProgNum"),
  insProgFill: document.getElementById("insProgFill"),
  insAtk: document.getElementById("insAtk"),
  insSt: document.getElementById("insSt"),
  inspectActs: document.getElementById("inspectActs"),
  fever: document.getElementById("fever"),
  dockUnits: document.getElementById("dockUnits"),
  dockBuild: document.getElementById("dockBuild"),
  endTitle: document.getElementById("endTitle"),
  endMsg: document.getElementById("endMsg"),
};

let state = createState("easy", true);
const sel = new Set();
let inspect = null;
let view = viewFit(1, 1);
const cam = { zoom: 1, panX: 0, panY: 0 };
let running = false;
let matchPaused = false;
let screen = "title";
let speed = 1;
let mode = null;
let ghost = null;
let tab = "units";
const pointers = new Map();
let pinch = null;
let hold = null;
let marquee = null;
let lastHud = 0;
let lastMoveCmd = 0;
let lastClock = 0;

function show(el, on) {
  el.classList.toggle("hidden", !on);
}

function formatClock(t) {
  if (t < MATCH_SECS) {
    const left = Math.max(0, Math.ceil(MATCH_SECS - t));
    const mm = String(Math.floor(left / 60)).padStart(2, "0");
    const ss = String(left % 60).padStart(2, "0");
    return { clock: `${mm}:${ss}`, label: "Countdown" };
  }
  const over = Math.floor(t - MATCH_SECS);
  const mm = String(Math.floor(over / 60)).padStart(2, "0");
  const ss = String(over % 60).padStart(2, "0");
  return { clock: `${mm}:${ss}`, label: "Fever ×2" };
}

function setMode(m) {
  mode = m;
  if (!m || m.type !== "place") ghost = null;
}

function resize() {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.floor(r.width * dpr));
  canvas.height = Math.max(1, Math.floor(r.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  view = viewFit(r.width, r.height, cam);
}
window.addEventListener("resize", resize);
new ResizeObserver(resize).observe(canvas);
resize();

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const r = canvas.getBoundingClientRect();
  const mx = e.clientX - r.left;
  const my = e.clientY - r.top;
  const world = screenToWorld(view, mx, my);
  const next = Math.max(1, Math.min(2.6, cam.zoom * (e.deltaY < 0 ? 1.12 : 0.9)));
  cam.zoom = next;
  view = viewFit(r.width, r.height, cam);
  const after = screenToWorld(view, mx, my);
  cam.panX += (after.x - world.x) * view.scale;
  cam.panY += (after.y - world.y) * view.scale;
  if (next <= 1.02) {
    cam.zoom = 1;
    cam.panX = 0;
    cam.panY = 0;
  }
  view = viewFit(r.width, r.height, cam);
}, { passive: false });

function bumpZoom(dir) {
  const r = canvas.getBoundingClientRect();
  cam.zoom = Math.max(1, Math.min(2.6, cam.zoom + dir * 0.25));
  if (cam.zoom <= 1.02) {
    cam.zoom = 1;
    cam.panX = 0;
    cam.panY = 0;
  }
  view = viewFit(r.width, r.height, cam);
}

function eventPos(e) {
  const r = canvas.getBoundingClientRect();
  const t = e.touches ? e.touches[0] || e.changedTouches[0] : e;
  return screenToWorld(view, t.clientX - r.left, t.clientY - r.top);
}

function startMatch(diff) {
  unlock();
  sfx("select");
  setTrack("battle");
  state = createState(diff, false);
  sel.clear();
  inspect = null;
  running = true;
  matchPaused = false;
  speed = 1;
  cam.zoom = 1;
  cam.panX = 0;
  cam.panY = 0;
  setMode(null);
  tab = "units";
  screen = "play";
  show(els.title, false);
  show(els.end, false);
  show(els.paused, false);
  show(els.cakeChip, true);
  show(els.popChip, true);
  show(els.speedGroup, true);
  show(els.pauseBtn, true);
  document.querySelectorAll("[data-speed]").forEach((b) => b.classList.toggle("on", b.dataset.speed === "1"));
  document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === "units"));
  show(els.dockUnits, true);
  show(els.dockBuild, false);
  hud();
}

function backToTitle() {
  unlock();
  setTrack("title");
  state = createState("easy", true);
  sel.clear();
  inspect = null;
  running = false;
  matchPaused = false;
  setMode(null);
  screen = "title";
  show(els.title, true);
  show(els.end, false);
  show(els.paused, false);
  show(els.cakeChip, false);
  show(els.popChip, false);
  show(els.speedGroup, false);
  show(els.pauseBtn, false);
}

function togglePause() {
  if (screen !== "play") return;
  matchPaused = !matchPaused;
  show(els.paused, matchPaused);
  els.pauseBtn.textContent = matchPaused ? "▶" : "❚❚";
}

function finish() {
  running = false;
  const win = state.winner === TEAM.MALTESE;
  els.endTitle.textContent = win ? "狗屋還在！" : "狗屋倒了";
  els.endMsg.textContent = win ? "馬爾濟斯把尋回犬的屋子砸到 0。" : "尋回犬先拆掉你的屋子。再練一局。";
  show(els.end, true);
  setTrack("title");
}

function qLabel(kind, base) {
  const n = queuedCounts(state, TEAM.MALTESE)[kind];
  return n && n > 0 ? `${base} ×${n}` : base;
}

function setDockBtn(act, { disabled, vivid, active, label }) {
  const b = document.querySelector(`[data-act="${act}"]`);
  if (!b) return;
  b.disabled = !!disabled;
  b.classList.toggle("vivid", !!vivid && !disabled);
  b.classList.toggle("active", !!active);
  if (label) b.textContent = label;
}

function hud() {
  const team = TEAM.MALTESE;
  const cake = Math.floor(state.cake[team]);
  const pop = teamPop(state, team);
  const play = hasReady(state, team, "playground");
  const shop = hasReady(state, team, "workshop");
  const site = activeBuild(state, team) || state.buildings.find((b) => b.team === team && b.buildLeft > 0);
  const { clock, label } = formatClock(state.t);
  const mallow = state.houses.find((h) => h.team === TEAM.MALTESE);
  const toast = state.houses.find((h) => h.team === TEAM.RETRIEVER);
  const info = inspectCopy(state, inspect);

  els.cakeNum.textContent = String(cake);
  els.popNum.textContent = `${pop}/${POP_CAP}`;
  els.clock.textContent = clock;
  els.clockLabel.textContent = label;
  const tP = toast ? Math.max(0, toast.hp / toast.maxHp) : 0;
  const mP = mallow ? Math.max(0, mallow.hp / mallow.maxHp) : 0;
  els.toastFill.style.width = `${tP * 100}%`;
  els.toastFill.style.background = tP > 0.35 ? "var(--hp)" : "var(--roof)";
  els.mallowFill.style.width = `${mP * 100}%`;
  els.mallowFill.style.background = mP > 0.35 ? "var(--hp)" : "var(--roof)";
  document.querySelector(".side-hp.right").classList.toggle("warn", state.houseWarn[0] > 0);

  const con = constructionHint(state, team);
  const hint = coachHint(state);
  let banner = "";
  let bannerClass = "banner";
  if (mode?.type === "place") {
    banner = "點地圖放置 · 右鍵取消";
    bannerClass += " place";
  } else if (mode?.type === "rally") {
    banner = "點地圖設集結點";
    bannerClass += " place";
  } else if (mode?.type === "charge") {
    banner = "點目標射出蓄力愛心";
    bannerClass += " place";
  } else if (state.houseWarn[0] > 0 && screen === "play") {
    banner = "狗屋被打！";
    bannerClass += " warn";
  } else if (state.unitWarn > 0 && screen === "play") {
    banner = "部隊被打";
    bannerClass += " warn";
  } else if (con && screen === "play") banner = con;
  else if (hint && screen === "play") banner = hint;
  els.banner.textContent = banner;
  els.banner.className = bannerClass + (banner ? "" : " hidden");
  show(els.fever, state.feverFlash > 0);

  setDockBtn("worker", { disabled: cake < COSTS.worker || pop >= POP_CAP, vivid: cake >= COSTS.worker && pop < POP_CAP, label: `工狗 ${COSTS.worker}` });
  setDockBtn("fighter", { disabled: cake < COSTS.fighter || !play || pop >= POP_CAP, vivid: cake >= COSTS.fighter && play && pop < POP_CAP, label: `鬥狗 ${COSTS.fighter}` });
  setDockBtn("car", { disabled: cake < COSTS.car || !shop || pop >= POP_CAP, vivid: cake >= COSTS.car && shop && pop < POP_CAP, label: `狗車 ${COSTS.car}` });
  setDockBtn("playground", {
    disabled: cake < COSTS.playground,
    vivid: cake >= COSTS.playground,
    active: mode?.type === "place" && mode.what === "playground",
    label: `${qLabel("playground", "遊樂場")} ${COSTS.playground}`,
  });
  setDockBtn("workshop", {
    disabled: cake < COSTS.workshop,
    vivid: cake >= COSTS.workshop,
    active: mode?.type === "place" && mode.what === "workshop",
    label: `${qLabel("workshop", "工坊")} ${COSTS.workshop}`,
  });
  setDockBtn("tower", {
    disabled: cake < COSTS.tower,
    vivid: cake >= COSTS.tower,
    active: mode?.type === "place" && mode.what === "tower",
    label: `${qLabel("tower", "心心塔")} ${COSTS.tower}`,
  });
  setDockBtn("pauseBuild", {
    disabled: !site,
    label: state.buildPaused[team] ? "續建" : "全停",
  });
  setDockBtn("cutBuild", { disabled: !nextQueued(state, team) });

  if (!info || screen !== "play") {
    show(els.inspect, false);
  } else {
    show(els.inspect, true);
    els.insName.textContent = info.title;
    els.insSub.textContent = info.sub;
    els.insHpNum.textContent = `${info.hp} / ${info.maxHp}`;
    els.insHpFill.style.width = `${Math.max(0, (info.hp / info.maxHp) * 100)}%`;
    if (info.progress) {
      show(els.insProgWrap, true);
      els.insProgLabel.textContent = info.progress.label;
      els.insProgNum.textContent = `${Math.round(info.progress.p * 100)}%`;
      els.insProgFill.style.width = `${Math.max(0, info.progress.p * 100)}%`;
    } else {
      show(els.insProgWrap, false);
    }
    els.insAtk.textContent = info.atk;
    els.insSt.textContent = info.status;
    els.inspectActs.innerHTML = "";
    for (const a of info.actions) {
      const btn = document.createElement("button");
      btn.textContent = a.label;
      btn.disabled = !a.enabled;
      btn.addEventListener("click", () => act(a.id));
      els.inspectActs.appendChild(btn);
    }
    drawPortrait(portrait, state, inspect);
  }
}

function act(kind) {
  if (!state || state.winner || !running) return;
  const ids = [...sel];
  const team = TEAM.MALTESE;
  if (kind === "worker") issue(state, { kind: "trainWorker", team });
  if (kind === "fighter") issue(state, { kind: "trainFighter", team });
  if (kind === "car") issue(state, { kind: "trainCar", team });
  if (kind === "playground" || kind === "workshop" || kind === "tower") {
    setMode({ type: "place", what: kind });
    tab = "build";
    document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === "build"));
    show(els.dockUnits, false);
    show(els.dockBuild, true);
    return;
  }
  if (kind === "pauseBuild") {
    if (state.buildPaused[team]) issue(state, { kind: "resumeBuild", team });
    else issue(state, { kind: "pauseBuild", team });
  }
  if (kind === "cutBuild") issue(state, { kind: "cutBuild", team });
  if (kind === "stop") issue(state, { kind: "stop", ids });
  if (kind === "autoJob") {
    const anyOn = ids.some((id) => state.units.find((u) => u.id === id)?.autoJob);
    issue(state, { kind: "autoJob", ids, on: !anyOn });
  }
  if (kind === "rally") setMode({ type: "rally" });
  if (kind === "charge") {
    const u = state.units.find((x) => ids.includes(x.id) && (x.type === "fighter" || x.type === "car"));
    if (u) {
      u.charge = 1;
      setMode({ type: "charge" });
    }
  }
}

canvas.addEventListener("pointerdown", (e) => {
  if (screen !== "play" || !running || matchPaused) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const pts = [...pointers.values()];
    pinch = {
      dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1,
      zoom: cam.zoom,
    };
    hold = null;
    return;
  }
  canvas.setPointerCapture(e.pointerId);
  const p = eventPos(e);
  const slop = Math.max(28, 26 / Math.max(0.2, view.scale));
  const hit = pickAt(state, p.x, p.y, null, slop);
  hold = { t: performance.now(), p, hit, id: e.pointerId, moved: false };

  if (mode?.type === "place") {
    ghost = { x: p.x, y: p.y, ok: canPlace(state, p.x, p.y) };
    return;
  }
  if (hit.kind === "unit" && hit.team === TEAM.MALTESE) {
    if (!e.shiftKey) sel.clear();
    sel.add(hit.id);
    inspect = { kind: "unit", id: hit.id };
    hold.dragUnit = true;
    sfx("select");
  } else if (hit.kind === "ground") {
    hold.box = true;
    marquee = { x0: p.x, y0: p.y, x1: p.x, y1: p.y };
  }
});

canvas.addEventListener("pointermove", (e) => {
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && pointers.size >= 2) {
    const r = canvas.getBoundingClientRect();
    const pts = [...pointers.values()];
    const distNow = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
    const z = Math.max(1, Math.min(2.6, pinch.zoom * (distNow / pinch.dist)));
    cam.zoom = z;
    if (z <= 1.02) {
      cam.zoom = 1;
      cam.panX = 0;
      cam.panY = 0;
    }
    view = viewFit(r.width, r.height, cam);
    return;
  }
  const p = eventPos(e);
  if (mode?.type === "place") ghost = { x: p.x, y: p.y, ok: canPlace(state, p.x, p.y) };
  if (!hold || hold.id !== e.pointerId) return;
  if (Math.hypot(p.x - hold.p.x, p.y - hold.p.y) > 14) hold.moved = true;
  if (hold.dragUnit && hold.moved && sel.size) {
    const now = performance.now();
    if (now - lastMoveCmd > 50) {
      lastMoveCmd = now;
      issue(state, { kind: "move", ids: [...sel], x: p.x, y: p.y });
    }
    return;
  }
  if (hold.box && marquee) {
    marquee.x1 = p.x;
    marquee.y1 = p.y;
  }
});

canvas.addEventListener("pointerup", (e) => {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinch = null;
  const h = hold;
  hold = null;
  if (!h || screen !== "play") {
    marquee = null;
    return;
  }
  const p = eventPos(e);
  const slop = Math.max(28, 26 / Math.max(0.2, view.scale));
  const hit = pickAt(state, p.x, p.y, null, slop);
  const ids = [...sel];

  if (mode?.type === "place") {
    if (canPlace(state, p.x, p.y) && state.cake[0] >= COSTS[mode.what]) {
      issue(state, { kind: "build", team: TEAM.MALTESE, what: mode.what, x: p.x, y: p.y });
    }
    setMode(null);
    marquee = null;
    return;
  }
  if (mode?.type === "rally") {
    if (inspect && (inspect.kind === "house" || inspect.kind === "building")) {
      issue(state, { kind: "setRally", team: TEAM.MALTESE, target: { kind: inspect.kind, id: inspect.id }, x: p.x, y: p.y });
    }
    setMode(null);
    marquee = null;
    return;
  }
  if (mode?.type === "charge" && ids[0] != null) {
    const u = state.units.find((x) => x.id === ids[0]);
    if (u) issue(state, { kind: "pilotShoot", id: u.id, x: p.x, y: p.y, charge: 1 });
    setMode(null);
    marquee = null;
    return;
  }
  if (h.dragUnit && h.moved) {
    issue(state, { kind: "move", ids, x: p.x, y: p.y });
    marquee = null;
    return;
  }
  if (h.box && marquee) {
    const m = marquee;
    marquee = null;
    if (h.moved) {
      const x0 = Math.min(m.x0, m.x1);
      const y0 = Math.min(m.y0, m.y1);
      const x1 = Math.max(m.x0, m.x1);
      const y1 = Math.max(m.y0, m.y1);
      if (!e.shiftKey) sel.clear();
      for (const u of state.units) {
        if (u.team !== TEAM.MALTESE) continue;
        if (u.x >= x0 && u.x <= x1 && u.y >= y0 && u.y <= y1) sel.add(u.id);
      }
      const first = [...sel][0];
      if (first != null) inspect = { kind: "unit", id: first };
      if (sel.size) sfx("select");
      return;
    }
  } else {
    marquee = null;
  }

  if (hit.kind === "unit" && hit.team === TEAM.MALTESE && !h.moved && ids.length === 1 && ids[0] === hit.id) return;
  if (ids.length) commandSelected(state, ids, hit, p);
  if (hit.kind === "house" || hit.kind === "building" || hit.kind === "cake") inspect = { kind: hit.kind, id: hit.id };
  else if (hit.kind === "unit") inspect = { kind: "unit", id: hit.id };
});

canvas.addEventListener("pointercancel", (e) => {
  pointers.delete(e.pointerId);
  hold = null;
  marquee = null;
});
canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  setMode(null);
});

document.getElementById("easy").onclick = () => startMatch("easy");
document.getElementById("hard").onclick = () => startMatch("hard");
document.getElementById("again").onclick = backToTitle;
document.getElementById("resume").onclick = togglePause;
document.getElementById("toTitle").onclick = backToTitle;
document.getElementById("pauseBtn").onclick = togglePause;
document.getElementById("helpBtn").onclick = () => show(els.help, true);
document.getElementById("titleHelp").onclick = () => show(els.help, true);
document.getElementById("helpOk").onclick = () => show(els.help, false);
document.getElementById("inspectClose").onclick = () => {
  inspect = null;
  hud();
};
document.getElementById("zoomIn").onclick = () => bumpZoom(1);
document.getElementById("zoomOut").onclick = () => bumpZoom(-1);
document.getElementById("clockBtn").onclick = () => {
  if (screen !== "play") return;
  const now = performance.now();
  if (now - lastClock < 420) skipToFever(state);
  lastClock = now;
};
document.getElementById("muteBtn").onclick = () => {
  unlock();
  const next = !isMuted();
  setMuted(next);
  els.muteBtn.textContent = next ? "✕" : "♪";
  if (!next) setTrack(screen === "play" ? "battle" : "title");
};

document.querySelectorAll("[data-speed]").forEach((btn) => {
  btn.addEventListener("click", () => {
    speed = Number(btn.dataset.speed);
    document.querySelectorAll("[data-speed]").forEach((b) => b.classList.toggle("on", b === btn));
  });
});
document.querySelectorAll("[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    tab = btn.dataset.tab;
    document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("on", b === btn));
    show(els.dockUnits, tab === "units");
    show(els.dockBuild, tab === "build");
  });
});
document.querySelectorAll("[data-act]").forEach((btn) => {
  btn.addEventListener("click", () => act(btn.dataset.act));
});

document.addEventListener("pointerdown", () => {
  unlock();
  if (screen === "title") setTrack("title");
}, { once: false });

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    setMode(null);
    inspect = null;
  }
  if (e.code === "Space" && screen === "play") {
    e.preventDefault();
    togglePause();
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") unlock();
});

bootMuteFromStorage();
els.muteBtn.textContent = isMuted() ? "✕" : "♪";

let acc = 0;
let last = performance.now();
const DT = 1 / 30;

function loop(now) {
  requestAnimationFrame(loop);
  const raw = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!matchPaused) {
    acc += raw;
    while (acc >= DT) {
      if (state.hitstop > 0) state.hitstop -= DT;
      else {
        for (let i = 0; i < speed; i++) {
          if (running) tickAI(state, DT);
          step(state, DT, i === 0 ? DT : 0);
        }
      }
      acc -= DT;
    }
  }
  if (state.events.length) {
    for (const ev of state.events) sfx(ev);
    state.events = [];
  }
  let rallyOf = null;
  if (inspect?.kind === "house") {
    const h = state.houses.find((x) => x.id === inspect.id);
    if (h) rallyOf = { x: h.rally.x, y: h.rally.y, team: h.team };
  } else if (inspect?.kind === "building") {
    const b = state.buildings.find((x) => x.id === inspect.id);
    if (b) rallyOf = { x: b.rally.x, y: b.rally.y, team: b.team };
  }
  const placing = mode?.type === "place" && ghost
    ? { kind: mode.what, x: ghost.x, y: ghost.y, ok: ghost.ok }
    : null;
  draw(ctx, state, sel, inspect?.kind === "unit" ? inspect.id : null, view, marquee, { placing, showRallyOf: rallyOf });
  if (now - lastHud > 80) {
    lastHud = now;
    hud();
    if (state.winner != null && running) finish();
  }
}
requestAnimationFrame(loop);
