import {
  W, H, POP_CAP, MATCH_SECS, TEAM, COSTS, TRAIN, STATS,
  HOUSE_HP, HOUSE_DMG_OVERTIME, CARRY,
  HOME_STOCK, HOME_RATE, HOME_SLOTS,
  WELL_STOCK, WELL_REGEN_CAP, WELL_REGEN, WELL_RATES, WELL_SLOTS,
  HEART_SPEED, HEART_R,
} from "./config.js";

let nid = 1;
const id = () => nid++;

export function dist(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function housePos(team) {
  return team === TEAM.MALTESE ? { x: 1460, y: 450 } : { x: 140, y: 450 };
}

function slots(team) {
  const s = team === TEAM.MALTESE ? 1 : -1;
  const hx = housePos(team).x;
  return {
    playground: { x: hx - s * 140, y: 220 },
    workshop: { x: hx - s * 140, y: 680 },
  };
}

export function createState(difficulty = "easy") {
  nid = 1;
  const houses = [TEAM.MALTESE, TEAM.RETRIEVER].map((team) => ({
    id: id(), kind: "house", team, hp: HOUSE_HP, maxHp: HOUSE_HP,
    ...housePos(team), r: 46,
    queue: null, queueT: 0, rally: housePos(team),
  }));

  const cakes = [
    { id: id(), kind: "home", x: 1280, y: 300, stock: HOME_STOCK, max: HOME_STOCK },
    { id: id(), kind: "home", x: 1280, y: 600, stock: HOME_STOCK, max: HOME_STOCK },
    { id: id(), kind: "home", x: 320, y: 300, stock: HOME_STOCK, max: HOME_STOCK },
    { id: id(), kind: "home", x: 320, y: 600, stock: HOME_STOCK, max: HOME_STOCK },
    { id: id(), kind: "well", x: 720, y: 280, stock: WELL_STOCK, max: WELL_STOCK },
    { id: id(), kind: "well", x: 880, y: 620, stock: WELL_STOCK, max: WELL_STOCK },
  ];

  const units = [
    spawnUnit("worker", TEAM.MALTESE, 1380, 450),
    spawnUnit("worker", TEAM.RETRIEVER, 220, 450),
  ];

  return {
    t: 0,
    winner: null,
    difficulty,
    cake: [80, 80],
    houses,
    buildings: [],
    cakes,
    units,
    hearts: [],
    fx: [],
    buildPaused: [false, false],
  };
}

function spawnUnit(type, team, x, y) {
  const s = STATS[type];
  return {
    id: id(), type, team, x, y,
    hp: s.hp, maxHp: s.hp,
    radius: s.radius,
    carry: 0,
    cd: 0,
    order: { type: "idle" },
    facing: team === TEAM.MALTESE ? -1 : 1,
    charge: 0,
    piloting: false,
  };
}

export function teamPop(state, team) {
  return state.units.filter((u) => u.team === team).length;
}

export function cakeOf(state, team) { return state.cake[team]; }

function spend(state, team, n) {
  if (state.cake[team] < n) return false;
  state.cake[team] -= n;
  return true;
}

export function issue(state, cmd) {
  if (state.winner) return;
  const { kind } = cmd;
  if (kind === "trainWorker") return queueAt(state, cmd.team, "house", "worker");
  if (kind === "trainFighter") return queueAt(state, cmd.team, "playground", "fighter");
  if (kind === "trainCar") return queueAt(state, cmd.team, "workshop", "car");
  if (kind === "build") return startBuild(state, cmd.team, cmd.what, cmd.x, cmd.y);
  if (kind === "pauseBuild") {
    if (activeBuild(state, cmd.team)) state.buildPaused[cmd.team] = true;
    return;
  }
  if (kind === "resumeBuild") {
    state.buildPaused[cmd.team] = false;
    promoteQueue(state, cmd.team);
    return;
  }
  if (kind === "cutBuild") {
    cutInBuild(state, cmd.team);
    return;
  }
  if (kind === "stop") {
    for (const u of unitsByIds(state, cmd.ids)) u.order = { type: "idle" };
    return;
  }
  if (kind === "move") {
    for (const u of unitsByIds(state, cmd.ids)) {
      u.order = { type: "move", x: cmd.x, y: cmd.y };
      u.piloting = false;
    }
    return;
  }
  if (kind === "gather") {
    for (const u of unitsByIds(state, cmd.ids)) {
      if (u.type !== "worker") continue;
      u.order = { type: "gather", node: cmd.node };
      u.piloting = false;
    }
    return;
  }
  if (kind === "attack") {
    for (const u of unitsByIds(state, cmd.ids)) {
      u.order = { type: "attack", target: cmd.target, tKind: cmd.tKind };
      u.piloting = false;
    }
    return;
  }
  if (kind === "pilotMove") {
    const u = state.units.find((x) => x.id === cmd.id);
    if (!u || (u.type !== "fighter" && u.type !== "car")) return;
    u.piloting = true;
    u.order = { type: "pilot", x: cmd.x, y: cmd.y };
  }
  if (kind === "pilotShoot") {
    const u = state.units.find((x) => x.id === cmd.id);
    if (!u) return;
    fire(state, u, cmd.x, cmd.y, cmd.charge || 0);
    u.piloting = false;
    u.order = { type: "idle" };
    u.charge = 0;
  }
}

function unitsByIds(state, ids) {
  if (!ids || !ids.length) return [];
  const set = new Set(ids);
  return state.units.filter((u) => set.has(u.id));
}

function buildingOf(state, team, kind) {
  if (kind === "house") return state.houses.find((h) => h.team === team);
  return state.buildings.find((b) => b.team === team && b.kind === kind && b.hp > 0 && b.buildLeft <= 0);
}

function queueAt(state, team, bKind, unitType) {
  const b = buildingOf(state, team, bKind);
  if (!b) return;
  if (teamPop(state, team) >= POP_CAP) return;
  if (b.queue) return;
  if (!spend(state, team, COSTS[unitType])) return;
  b.queue = unitType;
  b.queueT = TRAIN[unitType];
}

function startBuild(state, team, what, x, y) {
  if (what !== "playground" && what !== "workshop") return;
  if (state.buildings.some((b) => b.team === team && b.kind === what)) return;
  const fallback = slots(team)[what];
  const pos = {
    x: clamp(x ?? fallback.x, 80, W - 80),
    y: clamp(y ?? fallback.y, 90, H - 90),
  };
  if (!spend(state, team, COSTS[what])) return;
  const busy = !!activeBuild(state, team);
  state.buildings.push({
    id: id(), kind: what, team, ...pos, r: 36,
    hp: 180, maxHp: 180, buildLeft: TRAIN[what],
    queue: null, queueT: 0,
    phase: busy ? "queued" : "building",
    order: id(),
  });
}

function unfinished(state, team) {
  return state.buildings
    .filter((b) => b.team === team && b.buildLeft > 0)
    .sort((a, b) => a.order - b.order);
}

export function activeBuild(state, team) {
  return unfinished(state, team).find((b) => b.phase === "building") || null;
}

export function nextQueued(state, team) {
  return unfinished(state, team).find((b) => b.phase === "queued") || null;
}

function cutInBuild(state, team) {
  const next = nextQueued(state, team);
  if (!next) return;
  const cur = activeBuild(state, team);
  state.buildPaused[team] = false;
  if (!cur || cur === next) {
    next.phase = "building";
    return;
  }
  const hold = cur.order;
  cur.phase = "queued";
  cur.order = next.order + 0.01;
  next.order = hold;
  next.phase = "building";
}

function promoteQueue(state, team) {
  if (state.buildPaused[team]) return;
  if (activeBuild(state, team)) return;
  const next = unfinished(state, team).find((b) => b.phase === "queued");
  if (next) next.phase = "building";
}

export function constructionHint(state, team) {
  const list = unfinished(state, team);
  if (!list.length) return "";
  const names = { playground: "遊樂場", workshop: "工坊" };
  if (state.buildPaused[team]) {
    const cur = list.find((b) => b.phase === "building") || list[0];
    const wait = list.filter((b) => b.phase === "queued").map((b) => names[b.kind] || b.kind);
    return `全停 ${names[cur.kind] || cur.kind}${wait.length ? " · 排隊 " + wait.join("、") : ""}`;
  }
  const cur = activeBuild(state, team);
  const wait = list.filter((b) => b.phase === "queued").map((b) => names[b.kind] || b.kind);
  const parts = [];
  if (cur) {
    const pct = Math.max(0, Math.round((1 - cur.buildLeft / TRAIN[cur.kind]) * 100));
    parts.push(`興建 ${names[cur.kind] || cur.kind} ${pct}%`);
  }
  if (wait.length) parts.push(`排隊 ${wait.join("、")}`);
  return parts.join(" · ");
}

function fire(state, u, tx, ty, charge) {
  if (u.cd > 0) return;
  const s = STATS[u.type];
  let dmg = s.dmg;
  if (u.type === "fighter" && charge > 0.45) dmg = s.charged;
  const dx = tx - u.x, dy = ty - u.y;
  const len = Math.hypot(dx, dy) || 1;
  state.hearts.push({
    id: id(), team: u.team, x: u.x, y: u.y,
    vx: (dx / len) * HEART_SPEED, vy: (dy / len) * HEART_SPEED,
    dmg, r: HEART_R + (u.type === "fighter" && charge > 0.45 ? 3 : 0),
    life: 1.6,
  });
  u.cd = s.rof;
  u.facing = dx >= 0 ? 1 : -1;
}

function targetPos(state, order) {
  if (order.tKind === "unit") {
    const t = state.units.find((u) => u.id === order.target);
    return t || null;
  }
  if (order.tKind === "house") return state.houses.find((h) => h.id === order.target) || null;
  if (order.tKind === "building") return state.buildings.find((b) => b.id === order.target) || null;
  return null;
}

function moveToward(u, dest, speed, dt) {
  const dx = dest.x - u.x, dy = dest.y - u.y;
  const d = Math.hypot(dx, dy);
  if (d < 4) return true;
  const step = speed * dt;
  if (step >= d) { u.x = dest.x; u.y = dest.y; return true; }
  u.x += (dx / d) * step;
  u.y += (dy / d) * step;
  u.facing = dx >= 0 ? 1 : -1;
  return false;
}

function gatherersOn(state, nodeId, team) {
  return state.units.filter((u) =>
    u.type === "worker" &&
    u.team === team &&
    u.order.type === "gather" &&
    u.order.node === nodeId &&
    u.carry < CARRY &&
    dist(u, state.cakes.find((c) => c.id === nodeId) || { x: 0, y: 0 }) < 38
  ).length;
}

function nodeRate(node, count) {
  if (count <= 0) return 0;
  if (node.kind === "home") return HOME_RATE * Math.min(count, HOME_SLOTS);
  let r = 0;
  const n = Math.min(count, WELL_SLOTS);
  for (let i = 0; i < n; i++) r += WELL_RATES[i];
  return r;
}

function houseDrop(state, team) {
  return state.houses.find((h) => h.team === team);
}

export function step(state, dt) {
  if (state.winner) return;
  state.t += dt;

  for (const n of state.cakes) {
    if (n.kind === "well" && n.stock < WELL_REGEN_CAP) {
      n.stock = Math.min(WELL_REGEN_CAP, n.stock + WELL_REGEN * dt);
    }
  }

  for (const h of state.houses) tickQueue(state, h, dt);
  for (const team of [TEAM.MALTESE, TEAM.RETRIEVER]) {
    promoteQueue(state, team);
    const cur = activeBuild(state, team);
    if (cur && !state.buildPaused[team]) {
      cur.buildLeft -= dt;
      if (cur.buildLeft <= 0) {
        cur.buildLeft = 0;
        cur.phase = "done";
        promoteQueue(state, team);
      }
    }
  }
  for (const b of state.buildings) {
    if (b.buildLeft <= 0) tickQueue(state, b, dt);
  }

  for (const u of state.units) tickUnit(state, u, dt);

  for (const h of state.hearts) {
    h.x += h.vx * dt;
    h.y += h.vy * dt;
    h.life -= dt;
  }
  resolveHits(state);
  state.hearts = state.hearts.filter((h) => h.life > 0 && h.x > -20 && h.x < W + 20 && h.y > -20 && h.y < H + 20);

  state.units = state.units.filter((u) => u.hp > 0);
  state.buildings = state.buildings.filter((b) => b.hp > 0);

  if (state.t >= MATCH_SECS) {
    for (const h of state.houses) h.hp -= HOUSE_DMG_OVERTIME * dt;
  }
  for (const h of state.houses) {
    if (h.hp <= 0) {
      state.winner = h.team === TEAM.MALTESE ? TEAM.RETRIEVER : TEAM.MALTESE;
    }
  }
}

function tickQueue(state, b, dt) {
  if (!b.queue || b.buildLeft > 0) return;
  b.queueT -= dt;
  if (b.queueT > 0) return;
  if (teamPop(state, b.team) >= POP_CAP) {
    b.queueT = 0.4;
    return;
  }
  const type = b.queue;
  b.queue = null;
  const ang = (Math.random() - 0.5) * 0.8;
  const u = spawnUnit(type, b.team, b.x + Math.cos(ang) * 55, b.y + 50);
  state.units.push(u);
}

function tickUnit(state, u, dt) {
  u.cd = Math.max(0, u.cd - dt);
  u.x = clamp(u.x, 30, W - 30);
  u.y = clamp(u.y, 40, H - 30);
  const s = STATS[u.type];
  const o = u.order;

  if (o.type === "move" || o.type === "pilot") {
    moveToward(u, o, o.type === "pilot" ? s.speed * 1.05 : s.speed, dt);
    return;
  }

  if (o.type === "build") {
    u.order = { type: "idle" };
    return;
  }

  if (o.type === "gather" && u.type === "worker") {
    const node = state.cakes.find((c) => c.id === o.node);
    if (!node) { u.order = { type: "idle" }; return; }
    if (u.carry >= CARRY || node.stock <= 0 && u.carry > 0) {
      const home = houseDrop(state, u.team);
      if (moveToward(u, home, s.speed, dt)) {
        state.cake[u.team] += u.carry;
        u.carry = 0;
        if (node.stock <= 0) u.order = { type: "idle" };
      }
      return;
    }
    if (node.stock <= 0) { u.order = { type: "idle" }; return; }
    if (!moveToward(u, node, s.speed, dt)) return;
    const count = gatherersOn(state, node.id, u.team);
    const share = nodeRate(node, count) / Math.max(1, count);
    const take = Math.min(node.stock, share * dt, CARRY - u.carry);
    node.stock -= take;
    u.carry += take;
    return;
  }

  if (o.type === "attack") {
    const t = targetPos(state, o);
    if (!t || t.hp <= 0) { u.order = { type: "idle" }; return; }
    const d = dist(u, t);
    if (d > s.range * 0.82) {
      moveToward(u, t, s.speed, dt);
      return;
    }
    if (u.cd <= 0) fire(state, u, t.x, t.y, 0);
    return;
  }

  if (o.type === "idle" && u.type !== "worker") {
    let best = null, bd = 1e9;
    for (const e of state.units) {
      if (e.team === u.team) continue;
      const d = dist(u, e);
      if (d < s.range && d < bd) { bd = d; best = e; }
    }
    if (best && u.cd <= 0) fire(state, u, best.x, best.y, 0);
  }
}

function resolveHits(state) {
  for (const h of state.hearts) {
    if (h.life <= 0) continue;
    let hit = null;
    for (const u of state.units) {
      if (u.team === h.team) continue;
      if (dist(h, u) < u.radius + h.r) { hit = { kind: "unit", t: u }; break; }
    }
    if (!hit) {
      for (const b of [...state.houses, ...state.buildings]) {
        if (b.team === h.team || b.hp <= 0) continue;
        if (b.buildLeft > 0) continue;
        if (dist(h, b) < b.r + h.r) { hit = { kind: "b", t: b }; break; }
      }
    }
    if (hit) {
      hit.t.hp -= h.dmg;
      h.life = 0;
      state.fx.push({ x: h.x, y: h.y, t: 0.25 });
    }
  }
}

export function pickAt(state, x, y, team) {
  const p = { x, y };
  let best = null, bd = 28;
  for (const u of state.units) {
    if (team != null && u.team !== team) continue;
    const d = dist(u, p);
    if (d < u.radius + 10 && d < bd) { bd = d; best = { kind: "unit", id: u.id, team: u.team }; }
  }
  if (best) return best;
  for (const n of state.cakes) {
    if (dist(n, p) < 34) return { kind: "cake", id: n.id };
  }
  for (const h of state.houses) {
    if (dist(h, p) < h.r + 8) return { kind: "house", id: h.id, team: h.team };
  }
  for (const b of state.buildings) {
    if (dist(b, p) < b.r + 8) return { kind: "building", id: b.id, team: b.team };
  }
  return { kind: "ground", x, y };
}
