import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { COSTS, MID_X, TEAM } from "../src/config.js";
import { tickAI } from "../src/ai.js";
import { createState, issue, step, teamPop } from "../src/sim.js";

function drain(state, seconds) {
  const dt = 1 / 30;
  let left = seconds;
  while (left > 0) {
    const slice = Math.min(dt, left);
    tickAI(state, slice);
    step(state, slice);
    left -= slice;
  }
}

describe("AI", () => {
  it("easy Toast trains a second worker and starts a playground", () => {
    const state = createState("easy");
    state.cake[TEAM.RETRIEVER] = 200;
    drain(state, 1);
    assert.ok(teamPop(state, TEAM.RETRIEVER) >= 1);
    const play = state.buildings.find((b) => b.team === TEAM.RETRIEVER && b.kind === "playground");
    const training = state.houses.find((h) => h.team === TEAM.RETRIEVER)?.queue === "worker";
    assert.ok(play || training, "easy AI should train or build with spare cake");
  });

  it("easy army stays on its side of the midline unless crossed", () => {
    const state = createState("easy");
    state.cake[TEAM.RETRIEVER] = 999;
    issue(state, { kind: "build", team: TEAM.RETRIEVER, what: "playground", x: 280, y: 220 });
    for (let i = 0; i < 20; i++) {
      step(state, 1);
      tickAI(state, 1);
    }
    const army = state.units.filter((u) => u.team === TEAM.RETRIEVER && u.type !== "worker");
    for (const u of army) {
      if (u.order.type === "move" || u.order.type === "attack") {
        const destX = u.order.type === "move" ? u.order.x : u.x;
        assert.ok(destX < MID_X + 80, "easy AI should not march across mid unprovoked");
      }
    }
  });

  it("hard AI spends cake on military once a playground exists", () => {
    const state = createState("hard");
    state.cake[TEAM.RETRIEVER] = COSTS.playground + COSTS.fighter * 2;
    drain(state, 16);
    const play = state.buildings.some((b) => b.team === TEAM.RETRIEVER && b.kind === "playground");
    const fighters = state.units.filter((u) => u.team === TEAM.RETRIEVER && u.type === "fighter");
    const queued = state.buildings.find((b) => b.team === TEAM.RETRIEVER && b.kind === "playground")?.queue;
    assert.ok(play || fighters.length || queued === "fighter" || state.houses.find((h) => h.team === TEAM.RETRIEVER)?.queue);
  });
});
