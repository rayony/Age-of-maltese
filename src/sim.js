import {
  W,
  H,
  POP_CAP,
  MATCH_SECS,
  TEAM,
  COSTS,
  TRAIN,
  STATS,
  HOUSE_HP,
  BUILDING_HP,
  TOWER_HP,
  FEVER_EVERY,
  FEVER_DMG,
  FEVER_ATK,
  CARRY,
  HOUSE_ATK,
  TOWER_ATK,
  HOME_STOCK,
  HOME_RATE,
  HOME_SLOTS,
  WELL_STOCK,
  WELL_REGEN_CAP,
  WELL_REGEN,
  WELL_RATES,
  WELL_SLOTS,
  HEART_SPEED,
  HEART_R,
  NAMES,
  TEAM_NAME,
  TEAM_NAME_ZH
} from "./config.js";
let nid = 1;
const nextId = () => nid++;
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function housePos(team) {
  return team === TEAM.MALTESE ? { x: 1460, y: 450 } : { x: 140, y: 450 };
}
function slots(team) {
  const s = team === TEAM.MALTESE ? 1 : -1;
  const hx = housePos(team).x;
  return {
    playground: { x: hx - s * 140, y: 220 },
    workshop: { x: hx - s * 140, y: 680 },
    tower: { x: hx - s * 260, y: 450 }
  };
}
function defaultRally(team, x, y) {
  const s = team === TEAM.MALTESE ? -1 : 1;
  return { x: x + s * 70, y };
}
function spawnUnit(type, team, x, y) {
  const s = STATS[type];
  return {
    id: nextId(),
    type,
    team,
    x,
    y,
    hp: s.hp,
    maxHp: s.hp,
    radius: s.radius,
    carry: 0,
    cd: 0,
    order: { type: "idle" },
    facing: team === TEAM.MALTESE ? -1 : 1,
    charge: 0,
    piloting: false,
    bob: Math.random() * Math.PI * 2,
    autoJob: type === "worker",
    aggro: null,
    hurt: 0,
    vx: 0,
    vy: 0
  };
}
function createState(difficulty = "easy", preview = false) {
  nid = 1;
  const houses = [TEAM.MALTESE, TEAM.RETRIEVER].map((team) => {
    const pos = housePos(team);
    return {
      id: nextId(),
      kind: "house",
      team,
      hp: HOUSE_HP,
      maxHp: HOUSE_HP,
      ...pos,
      r: 46,
      queue: null,
      queueT: 0,
      queueMax: TRAIN.worker,
      rally: defaultRally(team, pos.x, pos.y),
      atkCd: 0,
      hurt: 0
    };
  });
  const cakes = [
    { id: nextId(), kind: "home", x: 1280, y: 300, stock: HOME_STOCK, max: HOME_STOCK },
    { id: nextId(), kind: "home", x: 1280, y: 600, stock: HOME_STOCK, max: HOME_STOCK },
    { id: nextId(), kind: "home", x: 320, y: 300, stock: HOME_STOCK, max: HOME_STOCK },
    { id: nextId(), kind: "home", x: 320, y: 600, stock: HOME_STOCK, max: HOME_STOCK },
    { id: nextId(), kind: "well", x: 720, y: 280, stock: WELL_STOCK, max: WELL_STOCK },
    { id: nextId(), kind: "well", x: 880, y: 620, stock: WELL_STOCK, max: WELL_STOCK }
  ];
  const units = [
    spawnUnit("worker", TEAM.MALTESE, 1380, 450),
    spawnUnit("worker", TEAM.RETRIEVER, 220, 450)
  ];
  if (preview) {
    units.push(
      spawnUnit("fighter", TEAM.MALTESE, 1180, 380),
      spawnUnit("fighter", TEAM.RETRIEVER, 420, 520),
      spawnUnit("car", TEAM.MALTESE, 1240, 560),
      spawnUnit("car", TEAM.RETRIEVER, 360, 360)
    );
    units[0].order = { type: "gather", node: cakes[0].id };
    units[1].order = { type: "gather", node: cakes[2].id };
    units[2].order = { type: "move", x: 900, y: 360 };
    units[3].order = { type: "move", x: 700, y: 540 };
  }
  const buildings = preview ? [
    makeBuilding(TEAM.MALTESE, "playground", slots(TEAM.MALTESE).playground, 0),
    makeBuilding(TEAM.RETRIEVER, "tower", slots(TEAM.RETRIEVER).tower, 0)
  ] : [];
  return {
    t: 0,
    winner: null,
    difficulty,
    preview,
    cake: [80, 80],
    houses,
    buildings,
    cakes,
    units,
    hearts: [],
    puffs: [],
    floaters: [],
    markers: [],
    events: [],
    buildPaused: [false, false],
    fever: false,
    feverAcc: 0,
    feverFlash: 0,
    trauma: 0,
    hitstop: 0,
    houseWarn: [0, 0],
    unitWarn: 0
  };
}
function makeBuilding(team, what, pos, buildLeft) {
  const hp = what === "tower" ? TOWER_HP : BUILDING_HP;
  const r = what === "tower" ? TOWER_ATK.r : 36;
  return {
    id: nextId(),
    kind: what,
    team,
    x: pos.x,
    y: pos.y,
    r,
    hp,
    maxHp: hp,
    buildLeft,
    buildMax: TRAIN[what],
    queue: null,
    queueT: 0,
    queueMax: 1,
    phase: buildLeft > 0 ? "building" : "done",
    order: nextId(),
    rally: defaultRally(team, pos.x, pos.y),
    atkCd: 0,
    hurt: 0
  };
}
function teamPop(state, team) {
  return state.units.filter((u) => u.team === team).length;
}
function spend(state, team, n) {
  if (state.cake[team] < n) return false;
  state.cake[team] -= n;
  return true;
}
function unitsByIds(state, ids) {
  if (!ids.length) return [];
  const set = new Set(ids);
  return state.units.filter((u) => set.has(u.id));
}
function buildingOf(state, team, kind) {
  if (kind === "house") return state.houses.find((h) => h.team === team);
  const ready = state.buildings.filter((b) => b.team === team && b.kind === kind && b.hp > 0 && b.buildLeft <= 0);
  return ready.find((b) => !b.queue) || ready[0] || null;
}
function hasReady(state, team, kind) {
  return state.buildings.some((b) => b.team === team && b.kind === kind && b.hp > 0 && b.buildLeft <= 0);
}
function unfinished(state, team) {
  return state.buildings.filter((b) => b.team === team && b.buildLeft > 0).sort((a, b) => a.order - b.order);
}
function activeBuild(state, team) {
  return unfinished(state, team).find((b) => b.phase === "building") || null;
}
function nextQueued(state, team) {
  return unfinished(state, team).find((b) => b.phase === "queued") || null;
}
function promoteQueue(state, team) {
  if (state.buildPaused[team]) return;
  if (activeBuild(state, team)) return;
  const next = unfinished(state, team).find((b) => b.phase === "queued");
  if (next) next.phase = "building";
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
function queueAt(state, team, bKind, unitType) {
  const b = buildingOf(state, team, bKind);
  if (!b) return false;
  if (teamPop(state, team) >= POP_CAP) return false;
  if (b.queue) return false;
  if (!spend(state, team, COSTS[unitType])) return false;
  b.queue = unitType;
  b.queueT = TRAIN[unitType];
  b.queueMax = TRAIN[unitType];
  state.events.push("train");
  return true;
}
function canPlace(state, x, y) {
  if (x < 70 || x > W - 70 || y < 80 || y > H - 80) return false;
  for (const h of state.houses) if (dist({ x, y }, h) < h.r + 70) return false;
  for (const b of state.buildings) if (dist({ x, y }, b) < b.r + 64) return false;
  for (const c of state.cakes) if (dist({ x, y }, c) < 64) return false;
  return true;
}
function startBuild(state, team, what, x, y) {
  if (what !== "playground" && what !== "workshop" && what !== "tower") return;
  const fallback = slots(team)[what];
  const pos = {
    x: clamp(x ?? fallback.x, 80, W - 80),
    y: clamp(y ?? fallback.y, 90, H - 90)
  };
  if (x != null && y != null && !canPlace(state, pos.x, pos.y)) return;
  if (!spend(state, team, COSTS[what])) return;
  const busy = !!activeBuild(state, team) || state.buildPaused[team];
  const b = makeBuilding(team, what, pos, TRAIN[what]);
  b.phase = busy ? "queued" : "building";
  state.buildings.push(b);
  state.events.push("build");
  state.markers.push({ x: pos.x, y: pos.y, t: 0, kind: "place" });
}
function feverMul(state) {
  return state.fever ? FEVER_ATK : 1;
}
function aimAt(from, t) {
  const lead = 0.22;
  void from;
  return { x: t.x + (t.vx ?? 0) * lead, y: t.y + (t.vy ?? 0) * lead - 4 };
}
function fire(state, u, tx, ty, charge, home) {
  if (u.cd > 0) return;
  const s = STATS[u.type];
  let dmg = s.dmg;
  const charged = u.type === "fighter" && charge > 0.45;
  if (charged) dmg = s.charged;
  dmg *= feverMul(state);
  const dx = tx - u.x;
  const dy = ty - u.y;
  const len = Math.hypot(dx, dy) || 1;
  state.hearts.push({
    id: nextId(),
    team: u.team,
    x: u.x,
    y: u.y - 6,
    vx: dx / len * HEART_SPEED,
    vy: dy / len * HEART_SPEED,
    dmg,
    r: HEART_R + (charged ? 5 : 0),
    life: 2.1,
    charged,
    ownerId: u.id,
    homeId: home?.id ?? null,
    homeKind: home?.kind ?? null
  });
  u.cd = s.rof;
  u.facing = dx >= 0 ? 1 : -1;
  state.events.push("shoot");
  state.puffs.push({ x: u.x, y: u.y - 8, t: 0, life: 0.22, r: 10, hue: "rose" });
}
function fireDefense(state, src, t, tKind, dmg, rof) {
  const aim = aimAt(src, t);
  const dx = aim.x - src.x;
  const dy = aim.y - (src.y - 18);
  const len = Math.hypot(dx, dy) || 1;
  state.hearts.push({
    id: nextId(),
    team: src.team,
    x: src.x,
    y: src.y - 18,
    vx: dx / len * HEART_SPEED,
    vy: dy / len * HEART_SPEED,
    dmg: dmg * feverMul(state),
    r: HEART_R + 1,
    life: 2,
    charged: false,
    ownerId: src.id,
    homeId: t.id,
    homeKind: tKind
  });
  src.atkCd = rof;
  state.events.push("shoot");
}
function targetPos(state, order) {
  if (order.tKind === "unit") return state.units.find((u) => u.id === order.target) || null;
  if (order.tKind === "house") return state.houses.find((h) => h.id === order.target) || null;
  if (order.tKind === "building") return state.buildings.find((b) => b.id === order.target) || null;
  return null;
}
function homingPos(state, h) {
  if (h.homeId == null || !h.homeKind) return null;
  if (h.homeKind === "unit") return state.units.find((u) => u.id === h.homeId) || null;
  if (h.homeKind === "house") return state.houses.find((x) => x.id === h.homeId) || null;
  return state.buildings.find((b) => b.id === h.homeId) || null;
}
function moveToward(u, dest, speed, dt) {
  const dx = dest.x - u.x;
  const dy = dest.y - u.y;
  const d = Math.hypot(dx, dy);
  if (d < 4) {
    u.vx = 0;
    u.vy = 0;
    return true;
  }
  const step2 = speed * dt;
  if (step2 >= d) {
    u.x = dest.x;
    u.y = dest.y;
    u.vx = 0;
    u.vy = 0;
    return true;
  }
  u.vx = dx / d * speed;
  u.vy = dy / d * speed;
  u.x += u.vx * dt;
  u.y += u.vy * dt;
  u.facing = dx >= 0 ? 1 : -1;
  return false;
}
function gatherersOn(state, nodeId, team) {
  const node = state.cakes.find((c) => c.id === nodeId);
  if (!node) return 0;
  return state.units.filter(
    (u) => u.type === "worker" && u.team === team && u.order.type === "gather" && u.order.node === nodeId && u.carry < CARRY && dist(u, node) < 38
  ).length;
}
function nodeRate(node, count) {
  if (count <= 0) return 0;
  if (node.kind === "home") return HOME_RATE * Math.min(count, HOME_SLOTS);
  let r = 0;
  const n = Math.min(count, WELL_SLOTS);
  for (let i = 0; i < n; i++) r += WELL_RATES[i] ?? 0;
  return r;
}
function houseDrop(state, team) {
  return state.houses.find((h) => h.team === team);
}
function nearestStockedCake(state, from, ignoreId) {
  let best = null;
  let bd = 1e9;
  for (const n of state.cakes) {
    if (n.id === ignoreId) continue;
    if (n.stock <= 0.4) continue;
    const d = dist(from, n);
    if (d < bd) {
      bd = d;
      best = n;
    }
  }
  return best;
}
function nearestCakeShop(state, from) {
  let best = null;
  let bd = 1e9;
  for (const n of state.cakes) {
    if (n.kind !== "well") continue;
    const d = dist(from, n);
    if (d < bd) {
      bd = d;
      best = n;
    }
  }
  return best;
}
function assignNextCake(state, u, ignoreId) {
  const next = nearestStockedCake(state, u, ignoreId);
  if (next) {
    u.order = { type: "gather", node: next.id };
    u.autoJob = true;
    return;
  }
  const shop = nearestCakeShop(state, u);
  if (shop) u.order = { type: "wait", x: shop.x, y: shop.y + 36 };
  else u.order = { type: "idle" };
}
function sendToRally(u, rally) {
  u.order = { type: "move", x: rally.x, y: rally.y };
}
function tickQueue(state, b, dt) {
  if (!b.queue) return;
  if ("buildLeft" in b && b.buildLeft > 0) return;
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
  sendToRally(u, b.rally);
  if (type === "worker") u.autoJob = true;
  state.units.push(u);
  state.puffs.push({ x: u.x, y: u.y, t: 0, life: 0.4, r: 18, hue: u.team === TEAM.MALTESE ? "cream" : "gold" });
}
function nearestEnemy(state, from, range, unitsOnly = false) {
  let best = null;
  let bd = range;
  for (const e of state.units) {
    if (e.team === from.team || e.hp <= 0) continue;
    const d = dist(from, e);
    if (d < bd) {
      bd = d;
      best = { kind: "unit", t: e };
    }
  }
  if (unitsOnly) return best;
  for (const b of state.buildings) {
    if (b.team === from.team || b.hp <= 0) continue;
    const d = dist(from, b);
    if (d < bd) {
      bd = d;
      best = { kind: "building", t: b };
    }
  }
  for (const h of state.houses) {
    if (h.team === from.team || h.hp <= 0) continue;
    const d = dist(from, h);
    if (d < bd) {
      bd = d;
      best = { kind: "house", t: h };
    }
  }
  return best;
}
function tickDefense(state, src, dt, range, dmg, rof) {
  if ("buildLeft" in src && src.buildLeft > 0) return;
  src.atkCd = Math.max(0, src.atkCd - dt);
  src.hurt = Math.max(0, src.hurt - dt);
  if (src.atkCd > 0 || src.hp <= 0) return;
  const hit = nearestEnemy(state, src, range);
  if (!hit) return;
  fireDefense(state, src, hit.t, hit.kind, dmg, rof);
}
function tickUnit(state, u, dt) {
  u.cd = Math.max(0, u.cd - dt);
  u.hurt = Math.max(0, u.hurt - dt);
  u.bob += dt;
  u.x = clamp(u.x, 30, W - 30);
  u.y = clamp(u.y, 40, H - 30);
  const s = STATS[u.type];
  const o = u.order;
  if (o.type === "move" || o.type === "pilot" || o.type === "wait") {
    const arrived = moveToward(u, o, o.type === "pilot" ? s.speed * 1.05 : s.speed, dt);
    if (arrived) {
      if (o.type === "move") {
        if (u.type === "worker" && u.autoJob) assignNextCake(state, u);
        else u.order = { type: "idle" };
      }
      if (o.type === "wait") {
        u.vx = 0;
        u.vy = 0;
        if (u.type === "worker" && u.autoJob) {
          const n = nearestStockedCake(state, u);
          if (n) u.order = { type: "gather", node: n.id };
        }
      }
    }
    return;
  }
  if (o.type === "gather" && u.type === "worker") {
    const node = state.cakes.find((c) => c.id === o.node);
    if (!node) {
      assignNextCake(state, u);
      return;
    }
    if (u.carry >= CARRY || node.stock <= 0 && u.carry > 0) {
      const home = houseDrop(state, u.team);
      if (home && moveToward(u, home, s.speed, dt)) {
        state.cake[u.team] += u.carry;
        if (u.carry > 0.5) {
          state.floaters.push({
            x: home.x,
            y: home.y - 40,
            text: `+${Math.round(u.carry)}`,
            t: 0,
            life: 0.8,
            rise: 28
          });
          state.events.push("harvest");
        }
        u.carry = 0;
        if (node.stock <= 0.4) assignNextCake(state, u, node.id);
      }
      return;
    }
    if (node.stock <= 0.4) {
      assignNextCake(state, u, node.id);
      return;
    }
    if (!moveToward(u, node, s.speed, dt)) return;
    u.vx = 0;
    u.vy = 0;
    const count = gatherersOn(state, node.id, u.team);
    const share = nodeRate(node, count) / Math.max(1, count);
    const take = Math.min(node.stock, share * dt, CARRY - u.carry);
    node.stock -= take;
    u.carry += take;
    return;
  }
  if (o.type === "attack") {
    const t = targetPos(state, o);
    if (!t || t.hp <= 0) {
      u.order = { type: "idle" };
      u.aggro = null;
      return;
    }
    const d = dist(u, t);
    const reach = s.range * 0.88 + ("r" in t ? t.r * 0.35 : 0);
    if (d > reach) {
      moveToward(u, t, s.speed, dt);
      return;
    }
    u.vx = 0;
    u.vy = 0;
    if (u.cd <= 0) {
      const aim = aimAt(u, t);
      fire(state, u, aim.x, aim.y, 0, { id: t.id, kind: o.tKind });
    }
    return;
  }
  if (o.type === "idle" && u.type !== "worker") {
    u.vx = 0;
    u.vy = 0;
    const best = nearestEnemy(state, u, s.range, true);
    if (best && u.cd <= 0 && !state.preview) {
      const aim = aimAt(u, best.t);
      fire(state, u, aim.x, aim.y, 0, { id: best.t.id, kind: best.kind });
    }
  } else if (o.type === "idle" && u.type === "worker" && u.autoJob && !state.preview) {
    u.vx = 0;
    u.vy = 0;
    assignNextCake(state, u);
  } else {
    u.vx = 0;
    u.vy = 0;
  }
  if (state.preview && u.order.type === "idle" && Math.random() < 8e-3) {
    u.order = {
      type: "move",
      x: clamp(u.x + (Math.random() - 0.5) * 220, 80, W - 80),
      y: clamp(u.y + (Math.random() - 0.5) * 160, 80, H - 80)
    };
  }
}
function separate(state, dt) {
  const list = state.units;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      const min = a.radius + b.radius - 4;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1e-3;
      if (d >= min) continue;
      const push = (min - d) / 2 * Math.min(1, dt * 8);
      const nx = dx / d;
      const ny = dy / d;
      a.x -= nx * push;
      a.y -= ny * push;
      b.x += nx * push;
      b.y += ny * push;
    }
  }
}
function resolveHits(state) {
  for (const h of state.hearts) {
    if (h.life <= 0) continue;
    let hit = null;
    for (const u of state.units) {
      if (u.team === h.team) continue;
      if (dist(h, u) < u.radius + h.r + 4) {
        hit = { kind: "unit", t: u };
        break;
      }
    }
    if (!hit) {
      for (const b of [...state.houses, ...state.buildings]) {
        if (b.team === h.team || b.hp <= 0) continue;
        const extra = "kind" in b && b.kind === "house" ? 10 : 12;
        if (dist(h, b) < b.r + h.r + extra) {
          hit = { kind: "b", t: b };
          break;
        }
      }
    }
    if (hit) {
      hit.t.hp -= h.dmg;
      hit.t.hurt = 0.45;
      if ("aggro" in hit.t) hit.t.aggro = h.ownerId;
      h.life = 0;
      state.puffs.push({ x: h.x, y: h.y, t: 0, life: 0.28, r: h.charged ? 16 : 10, hue: "rose" });
      if (hit.kind === "b" && "kind" in hit.t && hit.t.kind === "house") {
        state.events.push("houseHit");
        state.houseWarn[hit.t.team] = 2.2;
        state.trauma = Math.min(1, state.trauma + 0.38);
        state.hitstop = Math.max(state.hitstop, 0.05);
        if (hit.t.team === TEAM.MALTESE) state.events.push("warn");
      } else {
        state.events.push("hit");
        state.trauma = Math.min(1, state.trauma + (h.charged ? 0.22 : 0.12));
        if (hit.t.team === TEAM.MALTESE) {
          state.unitWarn = 1.4;
          state.events.push("warn");
        }
      }
    }
  }
}
function issue(state, cmd) {
  if (state.winner || state.preview) return;
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
    for (const u of unitsByIds(state, cmd.ids)) {
      u.order = { type: "idle" };
      u.autoJob = false;
      u.piloting = false;
      u.aggro = null;
    }
    return;
  }
  if (kind === "autoJob") {
    for (const u of unitsByIds(state, cmd.ids)) {
      u.autoJob = cmd.on;
      if (cmd.on && u.type === "worker") assignNextCake(state, u);
    }
    return;
  }
  if (kind === "move") {
    for (const u of unitsByIds(state, cmd.ids)) {
      u.order = { type: "move", x: cmd.x, y: cmd.y };
      u.piloting = false;
      u.autoJob = false;
    }
    state.markers.push({ x: cmd.x, y: cmd.y, t: 0, kind: "move" });
    state.events.push("move");
    return;
  }
  if (kind === "gather") {
    let any = false;
    for (const u of unitsByIds(state, cmd.ids)) {
      if (u.type !== "worker") continue;
      u.order = { type: "gather", node: cmd.node };
      u.piloting = false;
      u.autoJob = true;
      any = true;
    }
    const node = state.cakes.find((c) => c.id === cmd.node);
    if (any && node) {
      state.markers.push({ x: node.x, y: node.y, t: 0, kind: "gather" });
      state.events.push("harvest");
    }
    return;
  }
  if (kind === "attack") {
    for (const u of unitsByIds(state, cmd.ids)) {
      u.order = { type: "attack", target: cmd.target, tKind: cmd.tKind };
      u.piloting = false;
      u.autoJob = false;
    }
    const t = cmd.tKind === "unit" ? state.units.find((u) => u.id === cmd.target) : cmd.tKind === "house" ? state.houses.find((u) => u.id === cmd.target) : state.buildings.find((b) => b.id === cmd.target);
    if (t) state.markers.push({ x: t.x, y: t.y, t: 0, kind: "attack" });
    state.events.push("attack");
    return;
  }
  if (kind === "setRally") {
    const t = cmd.target.kind === "house" ? state.houses.find((h) => h.id === cmd.target.id && h.team === cmd.team) : state.buildings.find((b) => b.id === cmd.target.id && b.team === cmd.team);
    if (!t) return;
    t.rally = { x: clamp(cmd.x, 40, W - 40), y: clamp(cmd.y, 40, H - 40) };
    state.markers.push({ x: t.rally.x, y: t.rally.y, t: 0, kind: "rally" });
    return;
  }
  if (kind === "pilotMove") {
    const u = state.units.find((x) => x.id === cmd.id);
    if (!u || u.type !== "fighter" && u.type !== "car") return;
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
function skipToFever(state) {
  if (state.preview || state.winner) return;
  if (state.t >= MATCH_SECS - 3) return;
  state.t = MATCH_SECS - 3;
}
function step(state, dt, clockDt = dt) {
  if (state.winner) return;
  if (!state.preview) state.t += clockDt;
  state.feverFlash = Math.max(0, state.feverFlash - clockDt);
  state.trauma = Math.max(0, state.trauma - clockDt * 1.6);
  state.houseWarn[0] = Math.max(0, state.houseWarn[0] - clockDt);
  state.houseWarn[1] = Math.max(0, state.houseWarn[1] - clockDt);
  state.unitWarn = Math.max(0, state.unitWarn - clockDt);
  for (const n of state.cakes) {
    if (n.kind === "well" && n.stock < WELL_REGEN_CAP) {
      n.stock = Math.min(WELL_REGEN_CAP, n.stock + WELL_REGEN * dt);
    }
  }
  if (!state.preview) {
    for (const h of state.houses) {
      tickQueue(state, h, dt);
      tickDefense(state, h, dt, HOUSE_ATK.range, HOUSE_ATK.dmg, HOUSE_ATK.rof);
    }
    for (const team of [TEAM.MALTESE, TEAM.RETRIEVER]) {
      promoteQueue(state, team);
      const cur = activeBuild(state, team);
      if (cur && !state.buildPaused[team]) {
        cur.buildLeft -= dt;
        if (cur.buildLeft <= 0) {
          cur.buildLeft = 0;
          cur.phase = "done";
          promoteQueue(state, team);
          state.puffs.push({ x: cur.x, y: cur.y, t: 0, life: 0.45, r: 28, hue: "cream" });
        }
      }
    }
    for (const b of state.buildings) {
      if (b.buildLeft <= 0) tickQueue(state, b, dt);
      if (b.kind === "tower") tickDefense(state, b, dt, TOWER_ATK.range, TOWER_ATK.dmg, TOWER_ATK.rof);
    }
  }
  for (const u of state.units) tickUnit(state, u, dt);
  separate(state, dt);
  for (const h of state.hearts) {
    const home = homingPos(state, h);
    if (home && home.hp > 0) {
      const dx = home.x - h.x;
      const dy = home.y - 6 - h.y;
      const len = Math.hypot(dx, dy) || 1;
      const spd = Math.hypot(h.vx, h.vy) || HEART_SPEED;
      const mix = 0.18;
      h.vx = h.vx * (1 - mix) + dx / len * spd * mix;
      h.vy = h.vy * (1 - mix) + dy / len * spd * mix;
      const nlen = Math.hypot(h.vx, h.vy) || 1;
      h.vx = h.vx / nlen * spd;
      h.vy = h.vy / nlen * spd;
    }
    h.x += h.vx * dt;
    h.y += h.vy * dt;
    h.life -= dt;
  }
  resolveHits(state);
  state.hearts = state.hearts.filter(
    (h) => h.life > 0 && h.x > -20 && h.x < W + 20 && h.y > -20 && h.y < H + 20
  );
  const before = state.units.length;
  state.units = state.units.filter((u) => u.hp > 0);
  if (state.units.length < before) state.events.push("death");
  state.buildings = state.buildings.filter((b) => b.hp > 0);
  for (const p of state.puffs) p.t += dt;
  state.puffs = state.puffs.filter((p) => p.t < p.life);
  for (const f of state.floaters) f.t += dt;
  state.floaters = state.floaters.filter((f) => f.t < f.life);
  for (const m of state.markers) m.t += dt;
  state.markers = state.markers.filter((m) => m.t < 0.7);
  if (!state.preview && state.t >= MATCH_SECS) {
    if (!state.fever) {
      state.fever = true;
      state.feverFlash = 2.2;
      state.events.push("fever");
      state.trauma = 0.7;
    }
    state.feverAcc += clockDt;
    while (state.feverAcc >= FEVER_EVERY) {
      state.feverAcc -= FEVER_EVERY;
      for (const h of state.houses) {
        h.hp -= FEVER_DMG;
        state.floaters.push({
          x: h.x,
          y: h.y - 56,
          text: `-${FEVER_DMG}`,
          t: 0,
          life: 1,
          rise: 36
        });
      }
      state.events.push("fever");
      state.trauma = Math.min(1, state.trauma + 0.55);
    }
  }
  if (!state.preview) {
    for (const h of state.houses) {
      if (h.hp <= 0) {
        state.winner = h.team === TEAM.MALTESE ? TEAM.RETRIEVER : TEAM.MALTESE;
        state.events.push(state.winner === TEAM.MALTESE ? "win" : "lose");
      }
    }
  }
}
function pickAt(state, x, y, team, slop = 28) {
  const p = { x, y };
  let best = null;
  let bd = slop;
  for (const u of state.units) {
    if (team != null && u.team !== team) continue;
    const d = dist(u, p);
    if (d < u.radius + slop * 0.45 && d < bd) {
      bd = d;
      best = { kind: "unit", id: u.id, team: u.team };
    }
  }
  if (best) return best;
  for (const n of state.cakes) {
    if (dist(n, p) < Math.max(34, slop * 0.9)) return { kind: "cake", id: n.id };
  }
  for (const h of state.houses) {
    if (dist(h, p) < h.r + slop * 0.35) return { kind: "house", id: h.id, team: h.team };
  }
  for (const b of state.buildings) {
    if (dist(b, p) < b.r + slop * 0.35) return { kind: "building", id: b.id, team: b.team };
  }
  return { kind: "ground", x, y };
}
function constructionHint(state, team) {
  const list = unfinished(state, team);
  if (!list.length) return "";
  const names = {
    playground: NAMES.playground.zh,
    workshop: NAMES.workshop.zh,
    tower: NAMES.tower.zh
  };
  const tally = (arr) => {
    const m = {};
    for (const b of arr) m[b.kind] = (m[b.kind] ?? 0) + 1;
    return Object.entries(m).map(([k, n]) => n > 1 ? `${names[k]}\xD7${n}` : names[k]).join("\u3001");
  };
  if (state.buildPaused[team]) {
    const cur2 = list.find((b) => b.phase === "building") || list[0];
    const wait2 = list.filter((b) => b.phase === "queued");
    return `\u5168\u505C ${names[cur2.kind]}${wait2.length ? " \xB7 \u6392\u968A " + tally(wait2) : ""}`;
  }
  const cur = activeBuild(state, team);
  const wait = list.filter((b) => b.phase === "queued");
  const parts = [];
  if (cur) {
    const pct = Math.max(0, Math.round((1 - cur.buildLeft / cur.buildMax) * 100));
    parts.push(`\u8208\u5EFA ${names[cur.kind]} ${pct}%`);
  }
  if (wait.length) parts.push(`\u6392\u968A ${tally(wait)}`);
  return parts.join(" \xB7 ");
}
function statusOf(u) {
  if (u.piloting) return "\u84C4\u529B";
  if (u.order.type === "gather") return u.carry >= CARRY ? "\u9001\u86CB\u7CD5" : "\u63A1\u96C6";
  if (u.order.type === "attack") return "\u653B\u64CA";
  if (u.order.type === "move") return "\u79FB\u52D5";
  if (u.order.type === "pilot") return "\u99D5\u99DB";
  if (u.order.type === "wait") return "\u7B49\u5019\u88DC\u8CA8";
  return "\u5F85\u547D";
}
function inspectCopy(state, sel) {
  if (!sel) return null;
  if (sel.kind === "unit") {
    const u = state.units.find((x) => x.id === sel.id);
    if (!u) return null;
    const s = STATS[u.type];
    const actions = u.team === TEAM.MALTESE ? [
      { id: "stop", label: "\u505C\u6B62", enabled: true },
      ...u.type === "worker" ? [{ id: "autoJob", label: u.autoJob ? "\u53D6\u6D88\u81EA\u52D5\u63A1" : "\u81EA\u52D5\u63A1\u96C6", enabled: true }] : [{ id: "charge", label: "\u84C4\u529B\u5C04\u64CA", enabled: true }]
    ] : [];
    return {
      title: `${TEAM_NAME_ZH[u.team]} ${NAMES[u.type].zh}`,
      sub: `${TEAM_NAME[u.team]} ${NAMES[u.type].en}`,
      hp: Math.max(0, Math.ceil(u.hp)),
      maxHp: u.maxHp,
      atk: String(Math.round(s.dmg * feverMul(state))),
      status: statusOf(u),
      team: u.team,
      kind: u.type,
      actions,
      progress: null
    };
  }
  if (sel.kind === "house") {
    const h = state.houses.find((x) => x.id === sel.id);
    if (!h) return null;
    const mine = h.team === TEAM.MALTESE;
    const trainP = h.queue ? 1 - h.queueT / h.queueMax : null;
    return {
      title: `${TEAM_NAME_ZH[h.team]}\u72D7\u5C4B`,
      sub: `${TEAM_NAME[h.team]} house`,
      hp: Math.max(0, Math.ceil(h.hp)),
      maxHp: h.maxHp,
      atk: String(Math.round(HOUSE_ATK.dmg * feverMul(state))),
      status: h.queue ? `\u8A13\u7DF4 ${NAMES[h.queue].zh}` : "\u71DF\u5730",
      team: h.team,
      kind: "house",
      actions: mine ? [
        { id: "worker", label: "\u8A13\u7DF4\u5DE5\u72D7", enabled: state.cake[0] >= COSTS.worker && teamPop(state, 0) < POP_CAP && !h.queue },
        { id: "rally", label: "\u8A2D\u96C6\u7D50\u9EDE", enabled: true }
      ] : [],
      progress: trainP != null ? { label: "\u8A13\u7DF4", p: trainP } : null
    };
  }
  if (sel.kind === "building") {
    const b = state.buildings.find((x) => x.id === sel.id);
    if (!b) return null;
    const mine = b.team === TEAM.MALTESE;
    const building = b.buildLeft > 0;
    const trainP = !building && b.queue ? 1 - b.queueT / b.queueMax : null;
    const buildP = building ? 1 - b.buildLeft / b.buildMax : null;
    const actions = mine ? [
      ...b.kind === "playground" && !building ? [{ id: "fighter", label: "\u8A13\u7DF4\u9B25\u72D7", enabled: state.cake[0] >= COSTS.fighter && teamPop(state, 0) < POP_CAP && !b.queue }] : [],
      ...b.kind === "workshop" && !building ? [{ id: "car", label: "\u8A13\u7DF4\u72D7\u8ECA", enabled: state.cake[0] >= COSTS.car && teamPop(state, 0) < POP_CAP && !b.queue }] : [],
      { id: "rally", label: "\u8A2D\u96C6\u7D50\u9EDE", enabled: true }
    ] : [];
    return {
      title: NAMES[b.kind].zh,
      sub: NAMES[b.kind].en,
      hp: Math.max(0, Math.ceil(b.hp)),
      maxHp: b.maxHp,
      atk: b.kind === "tower" ? String(Math.round(TOWER_ATK.dmg * feverMul(state))) : "\u2014",
      status: building ? b.phase === "queued" ? "\u6392\u968A\u4E2D" : "\u5EFA\u9020\u4E2D" : b.queue ? `\u8A13\u7DF4 ${NAMES[b.queue].zh}` : "\u5C31\u7DD2",
      team: b.team,
      kind: b.kind,
      actions,
      progress: buildP != null ? { label: "\u8208\u5EFA", p: buildP } : trainP != null ? { label: "\u8A13\u7DF4", p: trainP } : null
    };
  }
  if (sel.kind === "cake") {
    const n = state.cakes.find((x) => x.id === sel.id);
    if (!n) return null;
    return {
      title: n.kind === "home" ? NAMES.home.zh : NAMES.well.zh,
      sub: n.kind === "home" ? "\u4E0D\u518D\u751F \xB7 food cart" : "\u7DE9\u6162\u56DE\u88DC \xB7 cake shop",
      hp: Math.max(0, Math.ceil(n.stock)),
      maxHp: n.max,
      atk: "\u2014",
      status: n.stock <= 0.2 ? "\u7A7A\u4E86" : "\u53EF\u63A1\u96C6",
      team: TEAM.MALTESE,
      kind: n.kind,
      actions: [],
      progress: { label: "\u5EAB\u5B58", p: n.stock / n.max }
    };
  }
  return null;
}
function coachHint(state) {
  const team = TEAM.MALTESE;
  const cake = state.cake[team];
  const workers = state.units.filter((u) => u.team === team && u.type === "worker");
  const fighters = state.units.filter((u) => u.team === team && u.type === "fighter");
  const play = hasReady(state, team, "playground");
  const idleW = workers.filter((w) => w.order.type === "idle" && !w.autoJob);
  if (idleW.length && workers.every((w) => w.order.type !== "gather") && state.t < 40) {
    return "\u9078\u5DE5\u72D7\uFF0C\u518D\u9EDE\u9910\u8ECA\u63A1\u96C6";
  }
  if (!play && cake >= COSTS.playground && state.t > 8) return "\u9EDE\u904A\u6A02\u5834\uFF0C\u518D\u9EDE\u5730\u5716\u653E\u4F4D\u7F6E";
  if (play && fighters.length === 0 && cake >= COSTS.fighter) return "\u904A\u6A02\u5834\u5C31\u7DD2 \xB7 \u8A13\u7DF4\u9B25\u72D7\u51FA\u64CA";
  if (fighters.length >= 2 && fighters.every((f) => f.order.type === "idle") && state.t > 40) {
    return "\u9EDE\u9078\u9B25\u72D7\uFF0C\u518D\u9EDE\u5C0D\u65B9\u72D7\u5C4B\u9032\u653B";
  }
  if (state.fever) return "Fever！攻擊 ×2，兩邊狗屋每 15 秒扣 20 血";
  return "";
}
function commandSelected(state, ids, hit, p) {
  if (!ids.length) return false;
  if (hit.kind === "cake") {
    const workers = ids.filter((id) => state.units.find((u) => u.id === id)?.type === "worker");
    if (workers.length) {
      issue(state, { kind: "gather", ids: workers, node: hit.id });
      const rest = ids.filter((id) => !workers.includes(id));
      if (rest.length) issue(state, { kind: "move", ids: rest, x: p.x, y: p.y });
      return true;
    }
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
  issue(state, { kind: "move", ids, x: p.x, y: p.y });
  return true;
}
function queuedCounts(state, team) {
  const m = {};
  for (const b of state.buildings) {
    if (b.team !== team || b.buildLeft <= 0) continue;
    m[b.kind] = (m[b.kind] ?? 0) + 1;
  }
  return m;
}
export {
  activeBuild,
  canPlace,
  coachHint,
  commandSelected,
  constructionHint,
  createState,
  dist,
  hasReady,
  housePos,
  inspectCopy,
  issue,
  nearestCakeShop,
  nearestStockedCake,
  nextQueued,
  pickAt,
  queuedCounts,
  skipToFever,
  statusOf,
  step,
  teamPop
};
