import { TEAM, COSTS, STATS } from "./config.js";
import { issue, teamPop, dist } from "./sim.js";

export function tickAI(state, dt) {
  const team = TEAM.RETRIEVER;
  const hard = state.difficulty === "hard";
  const cake = state.cake[team];
  const pop = teamPop(state, team);
  const workers = state.units.filter((u) => u.team === team && u.type === "worker");
  const army = state.units.filter((u) => u.team === team && u.type !== "worker");
  const hasPlay = state.buildings.some((b) => b.team === team && b.kind === "playground");
  const hasShop = state.buildings.some((b) => b.team === team && b.kind === "workshop");
  const house = state.houses.find((h) => h.team === team);
  const enemyHouse = state.houses.find((h) => h.team === TEAM.MALTESE);

  if (workers.length < (hard ? 3 : 2) && cake >= COSTS.worker && pop < 10) {
    issue(state, { kind: "trainWorker", team });
  } else if (!hasPlay && cake >= COSTS.playground) {
    issue(state, { kind: "build", team, what: "playground" });
  } else if (hasPlay && cake >= COSTS.fighter && pop < 10) {
    issue(state, { kind: "trainFighter", team });
  } else if (hard && hasPlay && !hasShop && cake >= COSTS.workshop && workers.length >= 3) {
    issue(state, { kind: "build", team, what: "workshop" });
  } else if (hard && hasShop && cake >= COSTS.car && pop < 10) {
    issue(state, { kind: "trainCar", team });
  }

  const homes = state.cakes.filter((c) => c.kind === "home" && c.x < 500 && c.stock > 1);
  const wells = state.cakes.filter((c) => c.kind === "well" && c.stock > 5);
  for (const w of workers) {
    if (w.order.type !== "idle") continue;
    const pile = homes.find((c) => c.stock > 0) || (hard ? wells[0] : null);
    if (pile) issue(state, { kind: "gather", ids: [w.id], node: pile.id });
  }

  if (hard) {
    const idleWellWorker = workers.find((w) => w.order.type === "idle");
    if (idleWellWorker && wells[0] && homes.every((h) => h.stock <= 0)) {
      issue(state, { kind: "gather", ids: [idleWellWorker.id], node: wells[0].id });
    }
  }

  const threat = state.units.find((u) => u.team === TEAM.MALTESE && house && dist(u, house) < 260);
  for (const a of army) {
    if (a.order.type === "attack" || a.piloting) continue;
    if (threat) {
      issue(state, { kind: "attack", ids: [a.id], target: threat.id, tKind: "unit" });
    } else if (army.length >= (hard ? 2 : 3) && enemyHouse) {
      issue(state, { kind: "attack", ids: [a.id], target: enemyHouse.id, tKind: "house" });
    }
  }

  if (hard) {
    const car = army.find((a) => a.type === "car" && a.order.type !== "attack");
    const victim = state.units.find((u) => u.team === TEAM.MALTESE && u.type === "worker");
    if (car && victim) issue(state, { kind: "attack", ids: [car.id], target: victim.id, tKind: "unit" });
  }

  void dt;
  void STATS;
}
