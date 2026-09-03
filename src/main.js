import { TEAM, COSTS, MATCH_SECS, POP_CAP } from "./config.js";
import { createState, step, issue, pickAt, teamPop, dist } from "./sim.js";
import { tickAI } from "./ai.js";
import { draw, viewFit, screenToWorld } from "./render.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const title = document.getElementById("title");
const end = document.getElementById("end");

let state = null;
let view = viewFit(1, 1);
const sel = new Set();
let running = false;
let hold = null;

function resize() {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, r.width * dpr);
  canvas.height = Math.max(1, r.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  view = viewFit(r.width, r.height);
}
window.addEventListener("resize", resize);
resize();

document.getElementById("easy").onclick = () => start("easy");
document.getElementById("hard").onclick = () => start("hard");
document.getElementById("again").onclick = () => {
  end.classList.add("hidden");
  title.classList.remove("hidden");
};

function start(diff) {
  state = createState(diff);
  sel.clear();
  running = true;
  title.classList.add("hidden");
  end.classList.add("hidden");
}

document.querySelectorAll(".hud [data-act]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!state || state.winner) return;
    const act = btn.dataset.act;
    const ids = [...sel];
    if (act === "worker") issue(state, { kind: "trainWorker", team: TEAM.MALTESE });
    if (act === "fighter") issue(state, { kind: "trainFighter", team: TEAM.MALTESE });
    if (act === "car") issue(state, { kind: "trainCar", team: TEAM.MALTESE });
    if (act === "playground") issue(state, { kind: "build", team: TEAM.MALTESE, what: "playground" });
    if (act === "workshop") issue(state, { kind: "build", team: TEAM.MALTESE, what: "workshop" });
    if (act === "stop") issue(state, { kind: "stop", ids });
  });
});

function eventPos(e) {
  const r = canvas.getBoundingClientRect();
  const t = e.touches ? e.touches[0] || e.changedTouches[0] : e;
  return screenToWorld(view, t.clientX - r.left, t.clientY - r.top);
}

function nearestUnfinished(p, team, maxD) {
  let best = null;
  let bd = maxD;
  for (const b of state.buildings) {
    if (b.team !== team || b.buildLeft <= 0 || b.hp <= 0) continue;
    const d = dist(p, b);
    if (d < bd) {
      bd = d;
      best = b;
    }
  }
  return best;
}

function commandSelected(ids, hit, p) {
  if (!ids.length) return false;
  if (hit.kind === "cake") {
    issue(state, { kind: "gather", ids, node: hit.id });
    return true;
  }
  if (hit.kind === "unit" && hit.team !== TEAM.MALTESE) {
    issue(state, { kind: "attack", ids, target: hit.id, tKind: "unit" });
    return true;
  }
  if (hit.kind === "house" && hit.team !== TEAM.MALTESE) {
    issue(state, { kind: "attack", ids, target: hit.id, tKind: "house" });
    return true;
  }
  if (hit.kind === "building" && hit.team !== TEAM.MALTESE) {
    issue(state, { kind: "attack", ids, target: hit.id, tKind: "building" });
    return true;
  }
  const site =
    hit.kind === "building" && hit.team === TEAM.MALTESE
      ? state.buildings.find((b) => b.id === hit.id && b.buildLeft > 0)
      : nearestUnfinished(p, TEAM.MALTESE, 78);
  if (site) {
    issue(state, { kind: "buildSite", ids, bid: site.id });
    return true;
  }
  issue(state, { kind: "move", ids, x: p.x, y: p.y });
  return true;
}

canvas.addEventListener("pointerdown", (e) => {
  if (!state || state.winner) return;
  canvas.setPointerCapture(e.pointerId);
  const p = eventPos(e);
  const hit = pickAt(state, p.x, p.y, null);
  hold = { t: performance.now(), p, hit, id: e.pointerId, moved: false };

  if (hit.kind === "unit" && hit.team === TEAM.MALTESE) {
    if (!e.shiftKey) sel.clear();
    sel.add(hit.id);
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (!hold || hold.id !== e.pointerId || !state) return;
  const p = eventPos(e);
  if (Math.hypot(p.x - hold.p.x, p.y - hold.p.y) > 14) hold.moved = true;
  const u = state.units.find((x) => sel.has(x.id) && (x.type === "fighter" || x.type === "car"));
  const long = performance.now() - hold.t > 220;
  if (u && (long || hold.moved) && sel.size === 1) {
    issue(state, { kind: "pilotMove", id: u.id, x: p.x, y: p.y });
    hold.pilot = true;
    u.charge = Math.min(1, (performance.now() - hold.t) / 700);
  }
});

canvas.addEventListener("pointerup", (e) => {
  if (!hold || !state) {
    hold = null;
    return;
  }
  const p = eventPos(e);
  const hit = pickAt(state, p.x, p.y, null);
  const ids = [...sel];

  if (hold.pilot) {
    const u = state.units.find((x) => x.id === ids[0]);
    if (u) issue(state, { kind: "pilotShoot", id: u.id, x: p.x, y: p.y, charge: u.charge || 0 });
    hold = null;
    return;
  }

  const sameFriendly =
    hit.kind === "unit" && hit.team === TEAM.MALTESE && !hold.moved && ids.length === 1 && ids[0] === hit.id;
  if (sameFriendly) {
    hold = null;
    return;
  }

  if (ids.length) commandSelected(ids, hit, p);
  hold = null;
});

let acc = 0, last = performance.now();
const DT = 1 / 30;

function loop(now) {
  requestAnimationFrame(loop);
  const raw = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!running || !state) return;
  acc += raw;
  while (acc >= DT) {
    tickAI(state, DT);
    step(state, DT);
    acc -= DT;
  }
  draw(ctx, state, sel, view);
  hud();
  if (state.winner != null) finish();
}

function hud() {
  const cake = Math.floor(state.cake[TEAM.MALTESE]);
  const pop = teamPop(state, TEAM.MALTESE);
  const t = Math.floor(state.t);
  const mm = String(Math.floor(t / 60)).padStart(1, "0");
  const ss = String(t % 60).padStart(2, "0");
  const ot = state.t >= MATCH_SECS ? " · 加時掉血" : "";
  statusEl.textContent = `蛋糕 ${cake} · 人口 ${pop}/${POP_CAP} · ${mm}:${ss}${ot}`;
  const play = state.buildings.some((b) => b.team === TEAM.MALTESE && b.kind === "playground" && b.buildLeft <= 0);
  const shop = state.buildings.some((b) => b.team === TEAM.MALTESE && b.kind === "workshop" && b.buildLeft <= 0);
  setDis("worker", cake < COSTS.worker || pop >= POP_CAP);
  setDis("playground", cake < COSTS.playground || state.buildings.some((b) => b.team === TEAM.MALTESE && b.kind === "playground"));
  setDis("fighter", cake < COSTS.fighter || !play || pop >= POP_CAP);
  setDis("workshop", cake < COSTS.workshop || state.buildings.some((b) => b.team === TEAM.MALTESE && b.kind === "workshop"));
  setDis("car", cake < COSTS.car || !shop || pop >= POP_CAP);
}

function setDis(act, on) {
  const b = document.querySelector(`[data-act="${act}"]`);
  if (b) b.disabled = on;
}

function finish() {
  running = false;
  const win = state.winner === TEAM.MALTESE;
  document.getElementById("endTitle").textContent = win ? "狗屋還在！" : "狗屋倒了";
  document.getElementById("endMsg").textContent = win
    ? "馬爾濟斯把小金毛的屋子砸到 0。"
    : "小金毛先拆掉你的屋子。再練一局。";
  end.classList.remove("hidden");
}

requestAnimationFrame(loop);
