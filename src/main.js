import { COSTS, GOLD_COSTS, MATCH_SECS, POP_CAP, TEAM } from "./config.js";
import { LANGS, locName, t, getLang, setLang, teamName } from "./i18n.js";
import { tickAI } from "./ai.js";
import { bootMuteFromStorage, isMuted, setMuted, setTrack, sfx, unlock } from "./audio.js";
import { draw, drawPortrait, screenToWorld, viewFit, clampPan } from "./render.js";
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
  friendlyIds,
  nextQueued,
  pickAt,
  queuedCounts,
  skipToFever,
  step,
  teamPop,
  playerTeam,
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
  goldChip: document.getElementById("goldChip"),
  goldNum: document.getElementById("goldNum"),
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

let pickSide = TEAM.MALTESE;
let lastCake = 0;
let lastGold = 0;
let state = createState("easy", true, pickSide);
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

function formatClock(secs) {
  if (secs < MATCH_SECS) {
    const left = Math.max(0, Math.ceil(MATCH_SECS - secs));
    const mm = String(Math.floor(left / 60)).padStart(2, "0");
    const ss = String(left % 60).padStart(2, "0");
    return { clock: `${mm}:${ss}`, label: t("clockCountdown") };
  }
  const over = Math.floor(secs - MATCH_SECS);
  const mm = String(Math.floor(over / 60)).padStart(2, "0");
  const ss = String(over % 60).padStart(2, "0");
  return { clock: `${mm}:${ss}`, label: t("clockFever") };
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
  clampPan(cam, r.width, r.height);
  view = viewFit(r.width, r.height, cam);
}, { passive: false });

function bumpZoom(dir) {
  const r = canvas.getBoundingClientRect();
  cam.zoom = Math.max(1, Math.min(2.6, cam.zoom + dir * 0.25));
  clampPan(cam, r.width, r.height);
  view = viewFit(r.width, r.height, cam);
}

function eventPos(e) {
  const r = canvas.getBoundingClientRect();
  const t = e.touches ? e.touches[0] || e.changedTouches[0] : e;
  return screenToWorld(view, t.clientX - r.left, t.clientY - r.top);
}

function startMatch(diff) {
  const side = pickSide;
  unlock();
  sfx("select");
  setTrack("battle");
  state = createState(diff, false, side);
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
  if (els.goldChip) show(els.goldChip, true);
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
  state = createState("easy", true, pickSide);
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
  if (els.goldChip) show(els.goldChip, false);
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
  const win = state.winner === playerTeam(state);
  const asR = playerTeam(state) === TEAM.RETRIEVER;
  els.endTitle.textContent = win ? t("winTitle") : t("loseTitle");
  els.endMsg.textContent = win ? (asR ? t("winMsgR") : t("winMsg")) : (asR ? t("loseMsgR") : t("loseMsg"));
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
  const team = playerTeam(state);
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
  if (els.goldNum) els.goldNum.textContent = String(state.gold[team] || 0);
  els.popNum.textContent = `${pop}/${POP_CAP}`;
  els.clock.textContent = clock;
  els.clockLabel.textContent = label;
  const tP = toast ? Math.max(0, toast.hp / toast.maxHp) : 0;
  const mP = mallow ? Math.max(0, mallow.hp / mallow.maxHp) : 0;
  els.toastFill.style.width = `${tP * 100}%`;
  els.toastFill.style.background = tP > 0.35 ? "var(--hp)" : "var(--roof)";
  els.mallowFill.style.width = `${mP * 100}%`;
  els.mallowFill.style.background = mP > 0.35 ? "var(--hp)" : "var(--roof)";
  const maltese = state.houses.find((h) => h.team === TEAM.MALTESE);
  const retriever = state.houses.find((h) => h.team === TEAM.RETRIEVER);
  document.querySelector(".side-hp.right .name").textContent = teamName(TEAM.MALTESE);
  document.querySelector(".side-hp.left .name").textContent = teamName(TEAM.RETRIEVER);
  document.querySelector(".side-hp.right").classList.toggle("warn", (state.houseWarn[TEAM.MALTESE] || 0) > 0);
  document.querySelector(".side-hp.left").classList.toggle("warn", (state.houseWarn[TEAM.RETRIEVER] || 0) > 0);


  const con = constructionHint(state, team);
  const hint = coachHint(state);
  let banner = "";
  let bannerClass = "banner";
  if (mode?.type === "place") {
    banner = t("placeHint");
    bannerClass += " place";
  } else if (mode?.type === "rally") {
    banner = t("rallyHint");
    bannerClass += " place";
  } else if (mode?.type === "charge") {
    banner = t("chargeHint");
    bannerClass += " place";
  } else if (mode?.type === "towerAim") {
    banner = t("towerAimHint");
    bannerClass += " place";
  } else if (state.houseWarn[0] > 0 && screen === "play") {
    banner = t("houseHit");
    bannerClass += " warn";
  } else if (state.unitWarn > 0 && screen === "play") {
    banner = t("unitHit");
    bannerClass += " warn";
  } else if (con && screen === "play") banner = con;
  else if (hint && screen === "play") banner = hint;
  els.banner.textContent = banner;
  els.banner.className = bannerClass + (banner ? "" : " hidden");
  show(els.fever, state.feverFlash > 0);

  const gold = state.gold[team] || 0;
  const waitN = (state.waitTrain[team] || []).length;
  setDockBtn("worker", { disabled: pop >= POP_CAP && waitN >= 5, vivid: cake >= COSTS.worker && pop < POP_CAP, label: `${locName("worker")} ${COSTS.worker}` });
  setDockBtn("fighter", { disabled: !play, vivid: cake >= COSTS.fighter && play && pop < POP_CAP, label: `${locName("fighter")} ${COSTS.fighter}` });
  setDockBtn("car", { disabled: !shop, vivid: cake >= COSTS.car && shop && pop < POP_CAP, label: `${locName("car")} ${COSTS.car}` });
  setDockBtn("playground", {
    disabled: false,
    vivid: cake >= COSTS.playground,
    active: mode?.type === "place" && mode.what === "playground",
    label: `${qLabel("playground", locName("playground"))} ${COSTS.playground}`,
  });
  setDockBtn("workshop", {
    disabled: false,
    vivid: cake >= COSTS.workshop,
    active: mode?.type === "place" && mode.what === "workshop",
    label: `${qLabel("workshop", locName("workshop"))} ${COSTS.workshop}`,
  });
  setDockBtn("tower", {
    disabled: false,
    vivid: gold >= (GOLD_COSTS.tower || 0),
    active: mode?.type === "place" && mode.what === "tower",
    label: `${qLabel("tower", locName("tower"))} ${GOLD_COSTS.tower}${t("goldUnit")}`,
  });
  setDockBtn("stanceHarvest", { active: state.stance[team] === "harvest" });
  setDockBtn("stanceAttack", { active: state.stance[team] === "attack" });
  setDockBtn("stanceDefend", { active: state.stance[team] === "defend" });
  setDockBtn("pauseBuild", {
    disabled: !site,
    label: state.buildPaused[team] ? t("resumeBuild") : t("pauseBuild"),
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
  const ids = friendlyIds(state, [...sel]);
  const team = playerTeam(state);
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
  if (kind === "focus") setMode({ type: "towerAim" });
  if (kind === "autoFocus") {
    if (inspect?.kind === "building") {
      issue(state, { kind: "setTowerFocus", team, id: inspect.id, target: null, tKind: null });
    }
  }
  if (kind === "charge") {
    const u = state.units.find((x) => ids.includes(x.id) && (x.type === "fighter" || x.type === "car"));
    if (u) {
      u.charge = 1;
      setMode({ type: "charge" });
    }
  }
  if (kind === "stanceHarvest") issue(state, { kind: "stance", team, stance: "harvest" });
  if (kind === "stanceAttack") issue(state, { kind: "stance", team, stance: "attack" });
  if (kind === "stanceDefend") issue(state, { kind: "stance", team, stance: "defend" });
  if (kind === "clearSel") {
    sel.clear();
    inspect = null;
    hud();
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
      panX: cam.panX,
      panY: cam.panY,
      midX: (pts[0].x + pts[1].x) / 2,
      midY: (pts[0].y + pts[1].y) / 2,
    };
    hold = null;
    marquee = null;
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
  if (hit.kind === "unit" && hit.team === playerTeam(state)) {
    const already = sel.has(hit.id);
    if (e.shiftKey) {
      if (already) sel.delete(hit.id);
      else sel.add(hit.id);
    } else if (!already) {
      sel.clear();
      sel.add(hit.id);
    } else {
      hold.tapDeselect = true;
    }
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
    const midX = (pts[0].x + pts[1].x) / 2;
    const midY = (pts[0].y + pts[1].y) / 2;
    cam.zoom = Math.max(1, Math.min(2.6, pinch.zoom * (distNow / pinch.dist)));
    cam.panX = pinch.panX + (midX - pinch.midX);
    cam.panY = pinch.panY + (midY - pinch.midY);
    clampPan(cam, r.width, r.height);
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
      issue(state, { kind: "move", ids: friendlyIds(state, [...sel]), x: p.x, y: p.y });
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
  const ids = friendlyIds(state, [...sel]);

  if (mode?.type === "place") {
    if (canPlace(state, p.x, p.y) && true) {
      issue(state, { kind: "build", team: playerTeam(state), what: mode.what, x: p.x, y: p.y });
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
    const u = state.units.find((x) => x.id === ids[0] && x.team === playerTeam(state));
    if (u) issue(state, { kind: "pilotShoot", id: u.id, x: p.x, y: p.y, charge: 1 });
    setMode(null);
    marquee = null;
    return;
  }
  const ownTower = (() => {
    if (!inspect || inspect.kind !== "building") return null;
    const b = state.buildings.find((x) => x.id === inspect.id);
    if (!b || b.team !== playerTeam(state) || b.kind !== "tower" || b.buildLeft > 0) return null;
    return b;
  })();
  if (ownTower && !ids.length) {
    if ((hit.kind === "unit" || hit.kind === "house" || hit.kind === "building") && hit.team !== playerTeam(state)) {
      issue(state, { kind: "setTowerFocus", team: playerTeam(state), id: ownTower.id, target: hit.id, tKind: hit.kind });
      setMode(null);
      marquee = null;
      return;
    }
    if (mode?.type === "towerAim") {
      issue(state, { kind: "setTowerFocus", team: playerTeam(state), id: ownTower.id, target: null, tKind: null });
      setMode(null);
      marquee = null;
      return;
    }
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
        if (u.team !== playerTeam(state)) continue;
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

  if (hit.kind === "unit" && hit.team === playerTeam(state) && !h.moved) {
    if (h.tapDeselect) {
      sel.clear();
      inspect = null;
      return;
    }
    sel.clear();
    sel.add(hit.id);
    inspect = { kind: "unit", id: hit.id };
    return;
  }

  if (!ids.length) {
    if (hit.kind === "house" || hit.kind === "building" || hit.kind === "cake") inspect = { kind: hit.kind, id: hit.id };
    else if (hit.kind === "unit") inspect = { kind: "unit", id: hit.id };
    return;
  }

  commandSelected(state, ids, hit, p);
  if (hit.kind === "house" || hit.kind === "building" || hit.kind === "cake") inspect = { kind: hit.kind, id: hit.id };
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
  sel.clear();
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
document.getElementById("cakeChip").onclick = (e) => {
  if (screen !== "play") return;
  const now = performance.now();
  if (e.detail >= 2 || now - lastCake < 420) {
    issue(state, { kind: "cheatCake", team: playerTeam(state) });
    hud();
  }
  lastCake = now;
};
document.getElementById("goldChip").onclick = (e) => {
  if (screen !== "play") return;
  const now = performance.now();
  if (e.detail >= 2 || now - lastGold < 420) {
    issue(state, { kind: "cheatGold", team: playerTeam(state) });
    hud();
  }
  lastGold = now;
};
document.querySelectorAll("[data-side]").forEach((btn) => {
  btn.addEventListener("click", () => {
    pickSide = Number(btn.dataset.side);
    document.querySelectorAll("[data-side]").forEach((b) => b.classList.toggle("on", b === btn));
  });
});

function bindLangRow() {
  const row = document.querySelector(".lang-row");
  if (!row) return;
  row.setAttribute("role", "listbox");
  row.setAttribute("aria-label", t("langAria"));
  row.innerHTML = LANGS.map((l) => `<button type="button" data-lang="${l.id}" role="option">${l.label}</button>`).join("");
  row.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setLang(btn.dataset.lang);
      applyLang();
      hud();
    });
  });
}

function applyLang() {
  const L = getLang();
  const meta = LANGS.find((l) => l.id === L);
  document.documentElement.lang = meta?.html ?? "zh-Hant";
  document.querySelectorAll("[data-lang]").forEach((b) => {
    const on = b.dataset.lang === L;
    b.classList.toggle("on", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  });
  const setTxt = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  };
  setTxt("easy", "easy");
  setTxt("hard", "hard");
  setTxt("titleHelp", "how");
  setTxt("helpOk", "howOk");
  setTxt("helpTitle", "how");
  setTxt("helpFine", "helpFine");
  setTxt("resume", "resume");
  setTxt("toTitle", "toTitle");
  setTxt("again", "again");
  setTxt("titleBlurb", "blurb");
  setTxt("titleFine", "musicHint");
  setTxt("pausedFine", "pausedFine");
  setTxt("feverSub", "feverSub");
  setTxt("insAtkLabel", "atk");
  setTxt("insStLabel", "status");
  const kicker = document.querySelector(".kicker");
  if (kicker) kicker.textContent = t("kicker");
  const fineTitle = document.querySelector(".fine-title");
  if (fineTitle) fineTitle.textContent = t("fineTitle");
  const pausedH = document.querySelector("#paused h2");
  if (pausedH) pausedH.textContent = t("paused");
  const helpList = document.getElementById("helpList");
  if (helpList) {
    helpList.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<li>${t("help" + n)}</li>`).join("");
  }
  document.querySelectorAll("[data-tab=units]").forEach((b) => { b.textContent = t("units"); });
  document.querySelectorAll("[data-tab=build]").forEach((b) => { b.textContent = t("build"); });
  const sh = document.querySelector("[data-act=stanceHarvest]"); if (sh) sh.textContent = t("harvest");
  const sa = document.querySelector("[data-act=stanceAttack]"); if (sa) sa.textContent = t("attack");
  const sd = document.querySelector("[data-act=stanceDefend]"); if (sd) sd.textContent = t("defend");
  const st = document.querySelector("[data-act=stop]"); if (st) st.textContent = t("stop");
  const cs = document.querySelector("[data-act=clearSel]"); if (cs) cs.textContent = t("clearSel");
  const pb = document.querySelector("[data-act=pauseBuild]");
  if (pb && !running) pb.textContent = t("pauseBuild");
  const cb = document.querySelector("[data-act=cutBuild]"); if (cb) cb.textContent = t("cutBuild");
  document.querySelectorAll("[data-side]").forEach((btn) => {
    const span = btn.querySelector("span");
    const team = Number(btn.dataset.side);
    if (span) span.textContent = teamName(team);
    const img = btn.querySelector("img");
    if (img) img.alt = teamName(team);
  });
  const cake = document.getElementById("cakeChip");
  if (cake) cake.title = t("cheatCake");
  const gold = document.getElementById("goldChip");
  if (gold) gold.title = t("cheatGold");
  const clock = document.getElementById("clockBtn");
  if (clock) clock.title = t("cheatClock");
}

bindLangRow();
applyLang();

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
    sel.clear();
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
  if (!matchPaused && (state.preview || (running && !state.winner))) {
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
  let towerRange = null;
  let towerLock = null;
  if (inspect?.kind === "building") {
    const tb = state.buildings.find((x) => x.id === inspect.id);
    if (tb && tb.kind === "tower" && tb.buildLeft <= 0) {
      towerRange = { x: tb.x, y: tb.y };
      if (tb.focusId != null && tb.focusKind) {
        const t = tb.focusKind === "unit"
          ? state.units.find((u) => u.id === tb.focusId)
          : tb.focusKind === "house"
            ? state.houses.find((h) => h.id === tb.focusId)
            : state.buildings.find((x) => x.id === tb.focusId);
        if (t) towerLock = { x: t.x, y: t.y };
      }
    }
  }
  draw(ctx, state, sel, inspect?.kind === "unit" ? inspect.id : null, view, marquee, { placing, showRallyOf: rallyOf, towerRange, towerLock });
  if (now - lastHud > 80) {
    lastHud = now;
    hud();
    if (state.winner != null && running) finish();
  }
}
requestAnimationFrame(loop);
