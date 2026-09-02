import { W, H, TEAM, STATS } from "./config.js";

export function draw(ctx, state, sel, view) {
  ctx.save();
  ctx.clearRect(0, 0, view.cw, view.ch);
  ctx.translate(view.ox, view.oy);
  ctx.scale(view.scale, view.scale);

  grass(ctx);
  for (const n of state.cakes) drawCake(ctx, n);
  for (const h of state.houses) drawHouse(ctx, h);
  for (const b of state.buildings) drawBuilding(ctx, b);
  for (const u of state.units) drawUnit(ctx, u, sel.has(u.id));
  for (const h of state.hearts) drawHeart(ctx, h.x, h.y, h.r, 1);
  for (const f of state.fx) {
    ctx.globalAlpha = Math.max(0, 1 - f.t * 4);
    drawHeart(ctx, f.x, f.y, 10, 0.5);
    ctx.globalAlpha = 1;
    f.t += 0.016;
  }
  state.fx = state.fx.filter((f) => f.t < 0.3);
  ctx.restore();
}

export function viewFit(cw, ch) {
  const scale = Math.min(cw / W, ch / H);
  return { scale, ox: (cw - W * scale) / 2, oy: (ch - H * scale) / 2, cw, ch };
}

export function screenToWorld(view, sx, sy) {
  return { x: (sx - view.ox) / view.scale, y: (sy - view.oy) / view.scale };
}

function grass(ctx) {
  ctx.fillStyle = "#efe0a8";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#e6d48d";
  ctx.fillRect(W / 2 - 18, 0, 36, H);
  ctx.strokeStyle = "rgba(42,34,24,0.12)";
  ctx.lineWidth = 2;
  for (let x = 80; x < W; x += 160) {
    ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x, H - 40); ctx.stroke();
  }
}

function drawCake(ctx, n) {
  const empty = n.stock <= 0.2;
  ctx.save();
  ctx.translate(n.x, n.y);
  if (n.kind === "home") {
    ctx.fillStyle = empty ? "#d9cba0" : "#f3d27a";
    round(ctx, -26, -16, 52, 28, 8);
    ctx.fill();
    ctx.strokeStyle = "#2a2218";
    ctx.lineWidth = 3;
    ctx.stroke();
    if (!empty) {
      ctx.fillStyle = "#f4b8c4";
      ctx.beginPath(); ctx.arc(-8, -4, 8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(8, -2, 7, 0, Math.PI * 2); ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = "#2a2218";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(empty ? "空籃" : Math.ceil(n.stock), 0, 28);
  } else {
    const lvl = Math.max(0.15, n.stock / n.max);
    ctx.fillStyle = "#f7cfe0";
    ctx.beginPath(); ctx.arc(0, 4, 28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#2a2218";
    ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "#f27890";
    ctx.beginPath(); ctx.arc(0, 6, 18 * lvl + 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#2a2218";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("井 " + Math.ceil(n.stock), 0, 42);
  }
  ctx.restore();
}

function drawHouse(ctx, h) {
  ctx.save();
  ctx.translate(h.x, h.y);
  const mal = h.team === TEAM.MALTESE;
  ctx.fillStyle = mal ? "#fff7ea" : "#e8c48a";
  round(ctx, -40, -18, 80, 50, 10);
  ctx.fill();
  ctx.fillStyle = mal ? "#e23d3d" : "#4d8f5a";
  ctx.beginPath();
  ctx.moveTo(-48, -16); ctx.lineTo(0, -48); ctx.lineTo(48, -16); ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#2a2218";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath(); ctx.rect(-40, -18, 80, 50); ctx.stroke();
  hpBar(ctx, -36, 40, 72, h.hp / h.maxHp);
  if (h.queue) {
    ctx.fillStyle = "#2a2218";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(h.queue + " " + h.queueT.toFixed(1) + "s", 0, 58);
  }
  ctx.restore();
}

function drawBuilding(ctx, b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.globalAlpha = b.buildLeft > 0 ? 0.55 : 1;
  ctx.fillStyle = b.kind === "playground" ? "#ffd6ea" : "#d9d3c2";
  round(ctx, -34, -24, 68, 48, 10);
  ctx.fill();
  ctx.strokeStyle = "#2a2218";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#2a2218";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(b.kind === "playground" ? "遊樂場" : "工坊", 0, 6);
  if (b.buildLeft > 0) ctx.fillText("建造 " + b.buildLeft.toFixed(1), 0, 22);
  else if (b.queue) ctx.fillText(b.queue + " " + b.queueT.toFixed(1), 0, 22);
  hpBar(ctx, -32, 30, 64, b.hp / b.maxHp);
  ctx.restore();
}

function drawUnit(ctx, u, selected) {
  ctx.save();
  ctx.translate(u.x, u.y);
  if (selected) {
    ctx.strokeStyle = "#f27890";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, 14, 22, 9, 0, 0, Math.PI * 2); ctx.stroke();
  }
  if (u.type === "car") {
    drawCar(ctx, u);
  } else {
    drawDog(ctx, u);
  }
  hpBar(ctx, -16, -28, 32, u.hp / u.maxHp);
  if (u.type === "worker" && u.carry > 0) {
    ctx.fillStyle = "#f3d27a";
    ctx.beginPath(); ctx.arc(14, 4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#2a2218"; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.restore();
}

function drawDog(ctx, u) {
  const mal = u.team === TEAM.MALTESE;
  ctx.fillStyle = mal ? "#fffdf8" : "#e0b07a";
  ctx.strokeStyle = "#2a2218";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-10, -12, 6, 8, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(10, -12, 6, 8, 0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#2a2218";
  ctx.beginPath(); ctx.arc(-5, -1, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5, -1, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, 3, 1.4, 0, Math.PI * 2); ctx.fill();
  if (u.type === "worker") {
    ctx.strokeStyle = "#3d6ea8";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-10, 10); ctx.lineTo(-10, 18); ctx.lineTo(10, 18); ctx.lineTo(10, 10); ctx.stroke();
  } else {
    ctx.fillStyle = mal ? "#f27890" : "#4d8f5a";
    ctx.strokeStyle = "#2a2218";
    ctx.lineWidth = 2;
    round(ctx, -11, 8, 22, 10, 3);
    ctx.fill(); ctx.stroke();
  }
}

function drawCar(ctx, u) {
  const mal = u.team === TEAM.MALTESE;
  if (mal) {
    ctx.fillStyle = "#e23d3d";
    round(ctx, -26, -6, 52, 20, 8);
    ctx.fill();
    ctx.strokeStyle = "#2a2218";
    ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "#fffdf8";
    ctx.beginPath(); ctx.arc(4, -14, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else {
    ctx.fillStyle = "#efe6d2";
    round(ctx, -24, 0, 48, 14, 8);
    ctx.fill();
    ctx.strokeStyle = "#2a2218";
    ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "#e0b07a";
    ctx.beginPath(); ctx.arc(2, -10, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#c9a36a";
    ctx.beginPath(); ctx.arc(2, -18, 7, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
}

function drawHeart(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#f27890";
  ctx.strokeStyle = "#2a2218";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, r * 0.7);
  ctx.bezierCurveTo(r, -r * 0.1, r * 0.55, -r, 0, -r * 0.35);
  ctx.bezierCurveTo(-r * 0.55, -r, -r, -r * 0.1, 0, r * 0.7);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

function hpBar(ctx, x, y, w, p) {
  ctx.fillStyle = "#2a2218";
  ctx.fillRect(x, y, w, 5);
  ctx.fillStyle = p > 0.35 ? "#6fbf73" : "#e23d3d";
  ctx.fillRect(x, y, w * Math.max(0, p), 5);
}

function round(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

void STATS;
