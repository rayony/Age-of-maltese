import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BUILDING_HP,
  COSTS,
  FEVER_DMG,
  GOLD_COSTS,
  GOLD_UNLOAD_CHANCE,
  HEART_SPEED,
  HOME_STOCK,
  HOUSE_HP,
  MATCH_SECS,
  POP_CAP,
  START,
  STATS,
  TEAM,
  TOWER_ATK,
  TRAIN,
  WELL_REGEN_CAP,
  WELL_STOCK,
} from "../src/config.js";
import {
  activeBuild,
  canPlace,
  commandSelected,
  createState,
  hasReady,
  issue,
  nextQueued,
  queuedCounts,
  skipToFever,
  step,
  teamPop,
} from "../src/sim.js";

function drain(state, seconds) {
  const dt = 1 / 30;
  let left = seconds;
  while (left > 0) {
    const slice = Math.min(dt, left);
    step(state, slice);
    left -= slice;
  }
}

describe("match setup", () => {
  it("starts a 3-minute match with cake, two player workers, and a rider each", () => {
    const state = createState("easy");
    assert.equal(MATCH_SECS, 180);
    assert.equal(state.t, 0);
    assert.equal(state.fever, false);
    assert.equal(state.cake[TEAM.MALTESE], 200);
    assert.equal(state.gold[TEAM.MALTESE], 0);
    assert.equal(START.cake, 200);
    for (const n of state.cakes) {
      if (n.kind === "home") assert.equal(n.stock, HOME_STOCK);
      if (n.kind === "well") assert.equal(n.stock, WELL_STOCK);
    }
    assert.equal(teamPop(state, TEAM.MALTESE), 3);
    assert.equal(teamPop(state, TEAM.RETRIEVER), 2);
    assert.equal(state.units.filter((u) => u.team === TEAM.MALTESE && u.type === "worker").length, 2);
    assert.equal(state.units.filter((u) => u.type === "car").length, 2);
    assert.equal(state.houses.length, 2);
    assert.ok(state.houses.every((h) => h.hp === HOUSE_HP));
    assert.equal(state.cakes.filter((c) => c.kind === "home").length, 4);
    assert.equal(state.cakes.filter((c) => c.kind === "well").length, 2);
  });

  it("does not simulate the title preview clock", () => {
    const state = createState("easy", true);
    drain(state, 2);
    assert.equal(state.t, 0);
    assert.equal(state.fever, false);
  });
});

describe("economy", () => {
  it("regens cake shops but not food carts", () => {
    const state = createState("easy");
    for (const u of state.units) {
      u.autoJob = false;
      u.order = { type: "wait", x: u.x, y: u.y };
    }
    const cart = state.cakes.find((c) => c.kind === "home");
    const shop = state.cakes.find((c) => c.kind === "well");
    cart.stock = 10;
    shop.stock = 10;
    drain(state, 9);
    assert.equal(cart.stock, 10);
    assert.ok(shop.stock > 10);
    assert.ok(shop.stock <= WELL_REGEN_CAP);
  });

  it("idle workers auto-gather the nearest stocked cake", () => {
    const state = createState("easy");
    const worker = state.units.find((u) => u.team === TEAM.MALTESE && u.type === "worker");
    assert.equal(worker.order.type, "idle");
    assert.equal(worker.autoJob, true);
    drain(state, 0.2);
    assert.equal(worker.order.type, "gather");
    assert.equal(typeof worker.order.node, "number");
  });
});

describe("production", () => {
  it("trains a worker from the house and respects the pop cap", () => {
    const state = createState("easy");
    const cake0 = state.cake[TEAM.MALTESE];
    issue(state, { kind: "trainWorker", team: TEAM.MALTESE });
    const house = state.houses.find((h) => h.team === TEAM.MALTESE);
    assert.equal(house.queue, "worker");
    assert.equal(state.cake[TEAM.MALTESE], cake0 - COSTS.worker);
    drain(state, TRAIN.worker + 0.2);
    assert.equal(teamPop(state, TEAM.MALTESE), 4);

    while (teamPop(state, TEAM.MALTESE) < POP_CAP) {
      state.cake[TEAM.MALTESE] = 999;
      const before = teamPop(state, TEAM.MALTESE);
      issue(state, { kind: "trainWorker", team: TEAM.MALTESE });
      drain(state, TRAIN.worker + 0.2);
      assert.ok(teamPop(state, TEAM.MALTESE) >= before);
    }
    state.cake[TEAM.MALTESE] = 999;
    issue(state, { kind: "trainWorker", team: TEAM.MALTESE });
    drain(state, TRAIN.worker + 0.2);
    assert.equal(teamPop(state, TEAM.MALTESE), POP_CAP);
  });

  it("cannot train a fighter until the playground is finished", () => {
    const state = createState("easy");
    state.cake[TEAM.MALTESE] = 999;
    assert.equal(hasReady(state, TEAM.MALTESE, "playground"), false);
    issue(state, { kind: "trainFighter", team: TEAM.MALTESE });
    assert.equal(state.units.filter((u) => u.team === TEAM.MALTESE && u.type === "fighter").length, 0);

    issue(state, { kind: "build", team: TEAM.MALTESE, what: "playground", x: 1100, y: 200 });
    assert.equal(hasReady(state, TEAM.MALTESE, "playground"), false);
    drain(state, TRAIN.playground + 0.2);
    assert.equal(hasReady(state, TEAM.MALTESE, "playground"), true);

    issue(state, { kind: "trainFighter", team: TEAM.MALTESE });
    const play = state.buildings.find((b) => b.kind === "playground" && b.team === TEAM.MALTESE);
    assert.equal(play.queue, "fighter");
  });

  it("queues a second building while the first is constructing", () => {
    const state = createState("easy");
    state.cake[TEAM.MALTESE] = 999;
    issue(state, { kind: "build", team: TEAM.MALTESE, what: "playground", x: 1100, y: 200 });
    issue(state, { kind: "build", team: TEAM.MALTESE, what: "workshop", x: 1100, y: 700 });
    const cur = activeBuild(state, TEAM.MALTESE);
    const queued = nextQueued(state, TEAM.MALTESE);
    assert.equal(cur.kind, "playground");
    assert.equal(queued.kind, "workshop");
    const counts = queuedCounts(state, TEAM.MALTESE);
    assert.equal(counts.playground, 1);
    assert.equal(counts.workshop, 1);

    issue(state, { kind: "pauseBuild", team: TEAM.MALTESE });
    assert.equal(state.buildPaused[TEAM.MALTESE], true);
    const left = cur.buildLeft;
    drain(state, 1);
    assert.ok(Math.abs(cur.buildLeft - left) < 0.05);

    issue(state, { kind: "cutBuild", team: TEAM.MALTESE });
    assert.equal(activeBuild(state, TEAM.MALTESE).kind, "workshop");
    assert.equal(state.buildPaused[TEAM.MALTESE], false);
  });

  it("rejects illegal placement on a house and accepts open ground", () => {
    const state = createState("easy");
    const house = state.houses.find((h) => h.team === TEAM.MALTESE);
    assert.equal(canPlace(state, house.x, house.y), false);
    assert.equal(canPlace(state, 10, 10), false);
    assert.equal(canPlace(state, 1100, 200), true);
  });
});

describe("combat rules", () => {
  it("does not issue an attack order against a teammate", () => {
    const state = createState("easy");
    const mine = state.units.find((u) => u.team === TEAM.MALTESE);
    const hit = { kind: "unit", id: mine.id, team: TEAM.MALTESE };
    commandSelected(state, [mine.id], hit, { x: mine.x, y: mine.y });
    assert.notEqual(mine.order.type, "attack");
  });

  it("attacks an enemy unit and walks on empty ground", () => {
    const state = createState("easy");
    const mine = state.units.find((u) => u.team === TEAM.MALTESE);
    const foe = state.units.find((u) => u.team === TEAM.RETRIEVER);
    commandSelected(state, [mine.id], { kind: "unit", id: foe.id, team: foe.team }, { x: foe.x, y: foe.y });
    assert.equal(mine.order.type, "attack");
    assert.equal(mine.order.target, foe.id);
    commandSelected(state, [mine.id], { kind: "ground", x: 900, y: 400 }, { x: 900, y: 400 });
    assert.equal(mine.order.type, "move");
    assert.equal(mine.order.x, 900);
  });
});

describe("fever", () => {
  it("double-click skip jumps to the last 3 seconds then pulses house HP", () => {
    const state = createState("easy");
    skipToFever(state);
    assert.equal(state.t, MATCH_SECS - 3);
    assert.equal(state.fever, false);

    drain(state, 3.05);
    assert.equal(state.fever, true);

    const hpAfterStart = state.houses.map((h) => h.hp);
    drain(state, 15.05);
    for (let i = 0; i < state.houses.length; i++) {
      assert.equal(state.houses[i].hp, hpAfterStart[i] - FEVER_DMG);
    }
  });

  it("clockDt 0 moves units without advancing the match clock", () => {
    const state = createState("easy");
    const worker = state.units.find((u) => u.team === TEAM.MALTESE && u.type === "worker");
    const t0 = state.t;
    const x0 = worker.x;
    issue(state, { kind: "move", ids: [worker.id], x: worker.x - 240, y: worker.y });
    for (let i = 0; i < 30; i++) step(state, 1 / 30, 0);
    assert.equal(state.t, t0);
    assert.ok(worker.x < x0 - 10);
  });
});

describe("bugfixes #5 #6 #14 #15", () => {
  it("ignores enemy ids in commandSelected", () => {
    const state = createState("easy");
    const enemy = state.units.find((u) => u.team === TEAM.RETRIEVER);
    const ox = enemy.x;
    const ok = commandSelected(state, [enemy.id], { kind: "ground", x: 800, y: 450 }, { x: 800, y: 450 });
    assert.equal(ok, false);
    assert.equal(enemy.order.type, "idle");
    assert.equal(enemy.x, ox);
  });

  it("only selected friendly units attack", () => {
    const state = createState("easy");
    const mine = state.units.find((u) => u.team === TEAM.MALTESE);
    const other = { ...mine, id: 99, x: mine.x, y: mine.y + 40, order: { type: "idle" } };
    state.units.push(other);
    const foe = state.units.find((u) => u.team === TEAM.RETRIEVER);
    commandSelected(state, [mine.id], { kind: "unit", id: foe.id, team: TEAM.RETRIEVER }, { x: foe.x, y: foe.y });
    assert.equal(mine.order.type, "attack");
    assert.equal(other.order.type, "idle");
  });

  it("freezes the clock after a winner", () => {
    const state = createState("easy");
    state.t = 12;
    state.houses[0].hp = 0;
    step(state, 1 / 30, 1 / 30);
    assert.equal(state.winner, TEAM.RETRIEVER);
    const t = state.t;
    step(state, 1 / 30, 1 / 30);
    step(state, 1, 1);
    assert.equal(state.t, t);
  });

  it("fever double-KO is a player loss", () => {
    const state = createState("easy");
    state.t = MATCH_SECS + 0.01;
    state.fever = true;
    state.feverAcc = 15;
    for (const h of state.houses) h.hp = FEVER_DMG;
    step(state, 1 / 30, 1 / 30);
    assert.equal(state.winner, TEAM.RETRIEVER);
    assert.ok(state.events.includes("lose"));
    assert.equal(state.events.includes("win"), false);
  });
});

describe("config issues", () => {
  it("queues a fighter while cake is short once the gym exists", () => {
    const state = createState("easy");
    issue(state, { kind: "build", team: TEAM.MALTESE, what: "playground", x: 1100, y: 200 });
    drain(state, TRAIN.playground + 0.2);
    state.cake[TEAM.MALTESE] = 10;
    issue(state, { kind: "trainFighter", team: TEAM.MALTESE });
    assert.equal(state.waitTrain[TEAM.MALTESE].length, 1);
    state.cake[TEAM.MALTESE] = 200;
    drain(state, 0.2);
    const gym = state.buildings.find((b) => b.kind === "playground" && b.team === TEAM.MALTESE);
    assert.equal(gym.queue, "fighter");
    assert.equal(state.waitTrain[TEAM.MALTESE].length, 0);
  });

  it("builds a tower with gold not cake", () => {
    const state = createState("easy");
    const cake0 = state.cake[TEAM.MALTESE];
    state.gold[TEAM.MALTESE] = 1;
    issue(state, { kind: "build", team: TEAM.MALTESE, what: "tower", x: 1100, y: 200 });
    assert.equal(state.gold[TEAM.MALTESE], 0);
    assert.equal(state.cake[TEAM.MALTESE], cake0);
    assert.ok(state.buildings.some((b) => b.kind === "tower" && b.team === TEAM.MALTESE));
  });

  it("all units melee; empty cart is not a gather; gold unloads at 10%", () => {
    assert.equal(STATS.worker.melee, true);
    assert.equal(STATS.fighter.melee, true);
    assert.equal(STATS.car.melee, true);
    assert.equal(GOLD_UNLOAD_CHANCE, 0.1);

    const state = createState("easy");
    const cart = state.cakes.find((c) => c.kind === "home");
    cart.stock = 0;
    const worker = state.units.find((u) => u.team === TEAM.MALTESE && u.type === "worker");
    worker.autoJob = false;
    worker.order = { type: "idle" };
    const ok = commandSelected(state, [worker.id], { kind: "cake", id: cart.id }, { x: cart.x, y: cart.y });
    assert.equal(ok, false);
    assert.equal(worker.order.type, "idle");

    const house = state.houses.find((h) => h.team === TEAM.MALTESE);
    const shop = state.cakes.find((c) => c.kind === "well");
    worker.x = house.x;
    worker.y = house.y;
    worker.carry = 10;
    worker.order = { type: "gather", node: shop.id };
    const orig = Math.random;
    Math.random = () => 0.05;
    try {
      drain(state, 0.05);
    } finally {
      Math.random = orig;
    }
    assert.equal(state.gold[TEAM.MALTESE], 1);
    assert.equal(worker.carry, 0);
  });

  it("tower does not fire when nothing is in range; hearts do not home", () => {
    const state = createState("easy");
    state.gold[TEAM.MALTESE] = 1;
    issue(state, { kind: "build", team: TEAM.MALTESE, what: "tower", x: 900, y: 450 });
    const tower = state.buildings.find((b) => b.kind === "tower" && b.team === TEAM.MALTESE);
    tower.buildLeft = 0;
    tower.phase = "done";
    tower.atkCd = 0;
    for (const u of state.units) {
      if (u.team === TEAM.RETRIEVER) {
        u.x = 80;
        u.y = 80;
      }
    }
    drain(state, 0.05);
    assert.equal(state.hearts.filter((h) => h.ownerId === tower.id).length, 0);

    const foe = state.units.find((u) => u.team === TEAM.RETRIEVER && u.type === "worker");
    foe.x = tower.x - 160;
    foe.y = tower.y;
    foe.hp = 400;
    foe.vx = 0;
    foe.vy = 0;
    tower.atkCd = 0;
    drain(state, 0.05);
    const shot = state.hearts.find((h) => h.ownerId === tower.id);
    assert.ok(shot);
    const vx = shot.vx;
    const vy = shot.vy;
    foe.y = tower.y + 160;
    drain(state, 0.15);
    const still = state.hearts.find((h) => h.id === shot.id);
    assert.ok(still);
    assert.equal(still.vx, vx);
    assert.equal(still.vy, vy);
    assert.ok(still.life < (TOWER_ATK.range + 56) / HEART_SPEED);
  });

  it("tower locked focus beats auto nearest unit", () => {
    const state = createState("easy");
    state.gold[TEAM.MALTESE] = 1;
    issue(state, { kind: "build", team: TEAM.MALTESE, what: "tower", x: 900, y: 450 });
    const tower = state.buildings.find((b) => b.kind === "tower" && b.team === TEAM.MALTESE);
    tower.buildLeft = 0;
    tower.phase = "done";
    tower.atkCd = 0;
    const foe = state.units.find((u) => u.team === TEAM.RETRIEVER && u.type === "worker");
    foe.x = tower.x - 160;
    foe.y = tower.y;
    foe.hp = 400;
    const hall = {
      id: 9902,
      kind: "playground",
      team: TEAM.RETRIEVER,
      x: tower.x - 90,
      y: tower.y + 40,
      r: 36,
      hp: BUILDING_HP,
      maxHp: BUILDING_HP,
      buildLeft: 0,
      buildMax: 1,
      queue: null,
      queueT: 0,
      queueMax: 1,
      phase: "done",
      order: 1,
      rally: { x: tower.x - 90, y: tower.y + 40 },
      atkCd: 0,
      hurt: 0,
      focusId: null,
      focusKind: null
    };
    state.buildings.push(hall);
    issue(state, { kind: "setTowerFocus", team: TEAM.MALTESE, id: tower.id, target: hall.id, tKind: "building" });
    assert.equal(tower.focusId, hall.id);
    drain(state, 0.05);
    const shot = state.hearts.find((h) => h.ownerId === tower.id);
    assert.ok(shot);
    const along = Math.hypot(shot.vx, shot.vy) || 1;
    const toB = Math.hypot(hall.x - tower.x, hall.y - 4 - (tower.y - 18)) || 1;
    const toU = Math.hypot(foe.x - tower.x, foe.y - 4 - (tower.y - 18)) || 1;
    const alignB = (shot.vx / along) * ((hall.x - tower.x) / toB) + (shot.vy / along) * ((hall.y - 4 - (tower.y - 18)) / toB);
    const alignU = (shot.vx / along) * ((foe.x - tower.x) / toU) + (shot.vy / along) * ((foe.y - 4 - (tower.y - 18)) / toU);
    assert.ok(alignB > alignU);
    assert.equal(GOLD_COSTS.tower, 1);
    assert.equal(COSTS.tower, 0);
  });
});

describe("testing cheats", () => {
  it("double-click cake command adds 100 cake", () => {
    const state = createState("easy");
    const before = state.cake[TEAM.MALTESE];
    issue(state, { kind: "cheatCake", team: TEAM.MALTESE });
    assert.equal(state.cake[TEAM.MALTESE], before + 100);
    assert.ok(state.floaters.some((f) => f.text === "+100"));
  });

  it("double-click gold command adds 1 gold", () => {
    const state = createState("easy");
    assert.equal(state.gold[TEAM.MALTESE], 0);
    issue(state, { kind: "cheatGold", team: TEAM.MALTESE });
    assert.equal(state.gold[TEAM.MALTESE], 1);
    issue(state, { kind: "cheatGold", team: TEAM.MALTESE });
    assert.equal(state.gold[TEAM.MALTESE], 2);
    assert.ok(state.floaters.some((f) => f.text === "+1幣"));
  });

  it("resource cheats do nothing on the title preview", () => {
    const state = createState("easy", true);
    const cake = state.cake[TEAM.MALTESE];
    issue(state, { kind: "cheatCake", team: TEAM.MALTESE });
    issue(state, { kind: "cheatGold", team: TEAM.MALTESE });
    assert.equal(state.cake[TEAM.MALTESE], cake);
    assert.equal(state.gold[TEAM.MALTESE], 0);
  });
});
