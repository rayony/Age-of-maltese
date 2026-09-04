import { TEAM, COSTS, GOLD_COSTS, POP_CAP, MID_X } from "./config.js";
import { dist, hasReady, issue, nearestStockedCake, playerTeam, teamPop, trainCost } from "./sim.js";

function enemyInMid(state) {
  const me = playerTeam(state);
  return (
    state.units.some((u) => u.team === me && u.x < MID_X + 40) ||
    state.buildings.some((b) => b.team === me && b.x < MID_X + 40)
  );
}

function pastMid(u) {
  return u.team === TEAM.RETRIEVER ? u.x > MID_X : u.x < MID_X;
}

export function tickAI(state, dt) {
  if (state.preview || state.winner) return;
  const me = playerTeam(state);
  const team = me === TEAM.MALTESE ? TEAM.RETRIEVER : TEAM.MALTESE;
  const hard = state.difficulty === "hard";
  const cake = state.cake[team];
  const gold = state.gold[team] || 0;
  const pop = teamPop(state, team);
  const playerPop = teamPop(state, me);
  const workers = state.units.filter((u) => u.team === team && u.type === "worker");
  const army = state.units.filter((u) => u.team === team && u.type !== "worker");
  const playReady = hasReady(state, team, "playground");
  const shopReady = hasReady(state, team, "workshop");
  const hasPlay = state.buildings.some((b) => b.team === team && b.kind === "playground");
  const hasShop = state.buildings.some((b) => b.team === team && b.kind === "workshop");
  const hasTower = state.buildings.some((b) => b.team === team && b.kind === "tower");
  const house = state.houses.find((h) => h.team === team);
  const enemyHouse = state.houses.find((h) => h.team === me);
  const crossed = enemyInMid(state);
  const easyCap = !hard && pop >= playerPop + 1;

  if (!easyCap) {
    if (workers.length < (hard ? 3 : 2) && cake >= trainCost(state, team, "worker") && pop < POP_CAP) {
      issue(state, { kind: "trainWorker", team });
    } else if (!hasPlay && cake >= COSTS.playground) {
      issue(state, { kind: "build", team, what: "playground" });
    } else if (playReady && cake >= trainCost(state, team, "fighter") && pop < POP_CAP) {
      issue(state, { kind: "trainFighter", team });
    } else if (hard && playReady && !hasTower && gold >= (GOLD_COSTS.tower || 0)) {
      issue(state, { kind: "build", team, what: "tower" });
    } else if (hard && hasPlay && !hasShop && cake >= COSTS.workshop && workers.length >= 3) {
      issue(state, { kind: "build", team, what: "workshop" });
    } else if (hard && shopReady && cake >= trainCost(state, team, "car") && pop < POP_CAP) {
      issue(state, { kind: "trainCar", team });
    }
  }

  for (const w of workers) {
    if (w.order.type !== "idle" && w.order.type !== "wait") continue;
    const pile = nearestStockedCake(state, w);
    if (pile) issue(state, { kind: "gather", ids: [w.id], node: pile.id });
  }

  const threat = state.units.find((u) => u.team === me && house && dist(u, house) < 280);
  const defending = hard && house && house.hp < 160;

  for (const a of army) {
    if (a.piloting) continue;

    if (a.hurt > 0.05 && a.aggro) {
      const attacker = state.units.find((u) => u.id === a.aggro && u.team === me);
      if (attacker) {
        if (hard || crossed || dist(a, attacker) < 220) {
          if (a.order.type !== "attack") {
            issue(state, { kind: "attack", ids: [a.id], target: attacker.id, tKind: "unit" });
          }
        } else if (house) {
          issue(state, { kind: "move", ids: [a.id], x: house.x + 70, y: house.y });
        }
        continue;
      }
    }

    if (a.order.type === "attack") continue;

    if (threat) {
      issue(state, { kind: "attack", ids: [a.id], target: threat.id, tKind: "unit" });
      continue;
    }

    if (!hard && !crossed) {
      if (a.x > MID_X - 40 && house && team === TEAM.RETRIEVER) {
        issue(state, { kind: "move", ids: [a.id], x: Math.min(a.x, MID_X - 80), y: house.y + (a.id % 2 ? -40 : 40) });
      }
      if (a.x < MID_X + 40 && house && team === TEAM.MALTESE) {
        issue(state, { kind: "move", ids: [a.id], x: Math.max(a.x, MID_X + 80), y: house.y + (a.id % 2 ? -40 : 40) });
      }
      continue;
    }

    if (defending && house) {
      if (dist(a, house) > 90) issue(state, { kind: "move", ids: [a.id], x: house.x + 70, y: house.y });
      continue;
    }

    if (pastMid(a) || army.length >= (hard ? 2 : 3)) {
      let best = null;
      for (const e of state.units) {
        if (e.team !== me) continue;
        const d = dist(a, e);
        if (!best || d < best.d) best = { id: e.id, tKind: "unit", d };
      }
      for (const b of state.buildings) {
        if (b.team !== me || b.hp <= 0) continue;
        const d = dist(a, b);
        if (!best || d < best.d) best = { id: b.id, tKind: "building", d };
      }
      if (enemyHouse && (hard || crossed)) {
        const d = dist(a, enemyHouse);
        if (!best || d < best.d - 80) best = { id: enemyHouse.id, tKind: "house", d };
      }
      if (best) issue(state, { kind: "attack", ids: [a.id], target: best.id, tKind: best.tKind });
    }
  }

  if (hard) {
    const car = army.find((a) => a.type === "car" && a.order.type !== "attack");
    const victim = state.units.find((u) => u.team === me && u.type === "worker");
    if (car && victim && !defending) {
      issue(state, { kind: "attack", ids: [car.id], target: victim.id, tKind: "unit" });
    }
  }

  void dt;
}
