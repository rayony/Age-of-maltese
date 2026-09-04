import { W, H, TEAM, TRAIN } from "./config.js";
import {
  buildingSpr,
  cakeSpr,
  carSpr,
  carFrame,
  drawSpr,
  fighterFrame,
  houseSpr,
  scaffoldSpr,
  workerFrame,
} from "./sprites.js";
function viewFit(cw, ch, cam) {
  const zoom = cam?.zoom ?? 1;
  const scale = Math.min(cw / W, ch / H) * zoom;
  return {
    scale,
    ox: (cw - W * scale) / 2 + (cam?.panX ?? 0),
    oy: (ch - H * scale) / 2 + (cam?.panY ?? 0),
    cw,
    ch,
    zoom,
    panX: cam?.panX ?? 0,
    panY: cam?.panY ?? 0
  };
}
function clampPan(cam, cw, ch) {
  if (cam.zoom <= 1.02) {
    cam.zoom = 1;
    cam.panX = 0;
    cam.panY = 0;
    return;
  }
  const scale = Math.min(cw / W, ch / H) * cam.zoom;
  const maxX = Math.max(0, (W * scale - cw) / 2 + 28);
  const maxY = Math.max(0, (H * scale - ch) / 2 + 28);
  cam.panX = Math.max(-maxX, Math.min(maxX, cam.panX));
  cam.panY = Math.max(-maxY, Math.min(maxY, cam.panY));
}
function screenToWorld(view, sx, sy) {
  return { x: (sx - view.ox) / view.scale, y: (sy - view.oy) / view.scale };
}
function worldToScreen(view, x, y) {
  return { x: view.ox + x * view.scale, y: view.oy + y * view.scale };
}
function round(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
function ellipseShadow(ctx, x, y, rx, ry, a = 0.18) {
  ctx.save();
  ctx.fillStyle = `rgba(42,34,24,${a})`;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function hpBar(ctx, x, y, w, p, flash = false) {
  ctx.fillStyle = "#2a2218";
  round(ctx, x, y, w, 6, 3);
  ctx.fill();
  ctx.fillStyle = flash ? "#d64545" : p > 0.35 ? "#6fbf73" : "#d64545";
  const ww = Math.max(0, w * p);
  if (ww > 1) {
    round(ctx, x, y, ww, 6, 3);
    ctx.fill();
  }
}
function progressBar(ctx, x, y, w, p) {
  ctx.fillStyle = "#2a2218";
  round(ctx, x, y, w, 5, 2);
  ctx.fill();
  ctx.fillStyle = "#e07a8a";
  const ww = Math.max(0, w * Math.max(0, Math.min(1, p)));
  if (ww > 1) {
    round(ctx, x, y, ww, 5, 2);
    ctx.fill();
  }
}
function heartPath(ctx, r) {
  ctx.beginPath();
  ctx.moveTo(0, r * 0.7);
  ctx.bezierCurveTo(r, -r * 0.1, r * 0.55, -r, 0, -r * 0.35);
  ctx.bezierCurveTo(-r * 0.55, -r, -r, -r * 0.1, 0, r * 0.7);
}
function drawHeart(ctx, x, y, r, filled = true) {
  ctx.save();
  ctx.translate(x, y);
  heartPath(ctx, r);
  if (filled) {
    ctx.fillStyle = "#e07a8a";
    ctx.fill();
  }
  ctx.strokeStyle = "#2a2218";
  ctx.lineWidth = Math.max(1.6, r * 0.18);
  ctx.stroke();
  ctx.restore();
}
function grass(ctx, t) {
  ctx.fillStyle = "#efe0a8";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#e8d48a";
  ctx.fillRect(W / 2 - 28, 0, 56, H);
  ctx.strokeStyle = "rgba(42,34,24,0.12)";
  ctx.setLineDash([10, 14]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2, 24);
  ctx.lineTo(W / 2, H - 24);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.save();
  ctx.strokeStyle = "rgba(42,34,24,0.08)";
  ctx.lineWidth = 2;
  for (let x = 80; x < W; x += 160) {
    ctx.beginPath();
    ctx.moveTo(x, 36);
    ctx.lineTo(x, H - 36);
    ctx.stroke();
  }
  ctx.restore();
  for (let i = 0; i < 48; i++) {
    const x = (i * 137 + 40) % (W - 80) + 40;
    const y = (i * 97 + 70) % (H - 80) + 40;
    if (Math.abs(x - W / 2) < 40) continue;
    ctx.fillStyle = i % 3 === 0 ? "#d9c56e" : "#e2d089";
    ctx.beginPath();
    ctx.ellipse(x, y, 9 + i % 5, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  decoTree(ctx, 80, 80, 0.85);
  decoTree(ctx, 1520, 80, 0.9);
  decoTree(ctx, 70, 820, 0.75);
  decoTree(ctx, 1530, 830, 0.8);
  decoBush(ctx, 500, 80);
  decoBush(ctx, 1100, 820);
  flowerPatch(ctx, 640, 480, t);
  flowerPatch(ctx, 960, 200, t + 1);
}
function decoTree(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ellipseShadow(ctx, 0, 18, 22, 8, 0.14);
  ctx.fillStyle = "#7a5a3a";
  round(ctx, -5, -4, 10, 22, 3);
  ctx.fill();
  ctx.fillStyle = "#6fbf73";
  ctx.strokeStyle = "#2a2218";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(-10, -16, 14, 0, Math.PI * 2);
  ctx.arc(10, -14, 13, 0, Math.PI * 2);
  ctx.arc(0, -28, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
function decoBush(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ellipseShadow(ctx, 0, 8, 18, 6, 0.12);
  ctx.fillStyle = "#7cbc7e";
  ctx.strokeStyle = "#2a2218";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(-8, 0, 10, 0, Math.PI * 2);
  ctx.arc(8, 2, 9, 0, Math.PI * 2);
  ctx.arc(0, -8, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
function flowerPatch(ctx, x, y, t) {
  ctx.save();
  ctx.translate(x, y);
  for (let i = 0; i < 5; i++) {
    const a = i * 1.256 + t * 0.2;
    const fx = Math.cos(a) * 16;
    const fy = Math.sin(a) * 8;
    ctx.fillStyle = i % 2 ? "#e07a8a" : "#fff6dc";
    ctx.beginPath();
    ctx.arc(fx, fy, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2a2218";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.restore();
}
function drawCake(ctx, n) {
  const empty = n.stock <= 0.2;
  const lvl = Math.max(0, n.stock / n.max);
  ctx.save();
  ctx.translate(n.x, n.y);
  ellipseShadow(ctx, 0, 18, 28, 8, 0.16);
  const img = cakeSpr(n.kind);
  if (img) {
    ctx.globalAlpha = empty ? 0.45 : 1;
    drawSpr(ctx, img, 0, 22, n.kind === "home" ? 78 : 86, n.kind === "home" ? 78 : 86);
    ctx.globalAlpha = 1;
    hpBar(ctx, -22, 24, 44, lvl);
    ctx.restore();
    return;
  }
  if (n.kind === "home") {
    ctx.fillStyle = "#6b5344";
    ctx.beginPath();
    ctx.arc(-18, 12, 7, 0, Math.PI * 2);
    ctx.arc(18, 12, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = empty ? "#d9cba0" : "#c9844a";
    ctx.strokeStyle = "#2a2218";
    ctx.lineWidth = 3;
    round(ctx, -30, -6, 60, 20, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e07a8a";
    ctx.beginPath();
    ctx.moveTo(-32, -6);
    ctx.quadraticCurveTo(0, -28, 32, -6);
    ctx.lineTo(28, -6);
    ctx.quadraticCurveTo(0, -22, -28, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff6dc";
    round(ctx, -14, -4, 12, 8, 3);
    ctx.fill();
    ctx.stroke();
    if (!empty) {
      ctx.fillStyle = "#fff6dc";
      round(ctx, 2, -16, 16, 10, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#e07a8a";
      ctx.beginPath();
      ctx.ellipse(10, -18, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    hpBar(ctx, -22, 22, 44, lvl);
  } else {
    ctx.fillStyle = "#fff3d6";
    ctx.strokeStyle = "#2a2218";
    ctx.lineWidth = 3;
    round(ctx, -26, -8, 52, 28, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#d64545";
    ctx.beginPath();
    ctx.moveTo(-30, -8);
    ctx.lineTo(0, -26);
    ctx.lineTo(30, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff6dc";
    round(ctx, -12, 0, 16, 14, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = empty ? "#d9cba0" : "#e07a8a";
    round(ctx, 8, 4, 12, 10, 3);
    ctx.fill();
    ctx.stroke();
    if (!empty) {
      ctx.fillStyle = "#fff6dc";
      ctx.beginPath();
      ctx.ellipse(14, 2, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#c45c6e";
    round(ctx, -22, -6, 44, 6, 2);
    ctx.fill();
    hpBar(ctx, -22, 24, 44, lvl);
  }
  ctx.restore();
}
function drawHouse(ctx, h) {
  ctx.save();
  ctx.translate(h.x, h.y);
  const mal = h.team === TEAM.MALTESE;
  if (h.hurt > 0) {
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "rgba(214,69,69,0.25)";
    ctx.beginPath();
    ctx.arc(0, 0, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ellipseShadow(ctx, 4, 36, 48, 12, 0.2);
  const himg = houseSpr(h.team);
  if (himg) {
    drawSpr(ctx, himg, 4, 40, 118, 118);
    hpBar(ctx, -36, 42, 72, h.hp / h.maxHp, h.hurt > 0);
    if (h.queue) progressBar(ctx, -36, 50, 72, 1 - h.queueT / h.queueMax);
    ctx.restore();
    return;
  }
  ctx.fillStyle = mal ? "#ead9b8" : "#c9a06a";
  round(ctx, -28, -10, 78, 48, 6);
  ctx.fill();
  ctx.strokeStyle = "#2a2218";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = mal ? "#fff7ea" : "#e8c48a";
  round(ctx, -42, -16, 84, 52, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = mal ? "#d64545" : "#4d8f5a";
  ctx.beginPath();
  ctx.moveTo(-52, -14);
  ctx.lineTo(0, -54);
  ctx.lineTo(52, -14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = mal ? "#fff7ea" : "#d4a574";
  round(ctx, 22, -40, 12, 18, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#2a2218";
  round(ctx, -10, 2, 20, 32, 4);
  ctx.fill();
  ctx.fillStyle = mal ? "#fff7ea" : "#f4e6bf";
  ctx.beginPath();
  ctx.arc(18, 4, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (mal) {
    ctx.save();
    ctx.translate(18, 4);
    ctx.scale(0.55, 0.55);
    heartPath(ctx, 8);
    ctx.fillStyle = "#e07a8a";
    ctx.fill();
    ctx.restore();
  } else {
    ctx.fillStyle = "#2a2218";
    ctx.beginPath();
    ctx.ellipse(18, 4, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  hpBar(ctx, -36, 42, 72, h.hp / h.maxHp, h.hurt > 0);
  if (h.queue) progressBar(ctx, -36, 50, 72, 1 - h.queueT / h.queueMax);
  ctx.restore();
}
function drawBuilding(ctx, b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.globalAlpha = b.buildLeft > 0 ? b.phase === "queued" ? 0.42 : 0.75 : 1;
  if (b.hurt > 0) {
    ctx.fillStyle = "rgba(214,69,69,0.22)";
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.fill();
  }
  ellipseShadow(ctx, 4, 28, 36, 10, 0.16);
  const bimg = buildingSpr(b.kind);
  if (bimg) {
    const tall = b.kind === "tower" ? 92 : 84;
    drawSpr(ctx, bimg, 2, 30, tall, tall);
    if (b.buildLeft > 0) drawSpr(ctx, scaffoldSpr(), 2, 32, 88, 88);
    hpBar(ctx, -32, 30, 64, b.hp / b.maxHp, b.hurt > 0);
    if (b.buildLeft > 0) progressBar(ctx, -32, 38, 64, 1 - b.buildLeft / b.buildMax);
    else if (b.queue) progressBar(ctx, -32, 38, 64, 1 - b.queueT / b.queueMax);
    ctx.restore();
    return;
  }
  ctx.strokeStyle = "#2a2218";
  ctx.lineWidth = 3;
  if (b.kind === "playground") {
    ctx.fillStyle = "#c9b48a";
    round(ctx, -30, -8, 68, 40, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffd6ea";
    round(ctx, -36, -22, 72, 50, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e07a8a";
    ctx.beginPath();
    ctx.moveTo(-20, 16);
    ctx.lineTo(-6, -18);
    ctx.lineTo(8, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#2a2218";
    ctx.beginPath();
    ctx.moveTo(14, 16);
    ctx.lineTo(14, -8);
    ctx.lineTo(26, -8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(26, 4, 12, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  } else if (b.kind === "workshop") {
    ctx.fillStyle = "#a89a82";
    round(ctx, -28, -6, 68, 38, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#d9d3c2";
    round(ctx, -36, -18, 72, 46, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#8a7d6b";
    ctx.beginPath();
    ctx.moveTo(-40, -16);
    ctx.lineTo(0, -36);
    ctx.lineTo(40, -16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#3d3428";
    round(ctx, -14, -2, 28, 28, 3);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#2a2218";
    ctx.beginPath();
    ctx.moveTo(-22, -8);
    ctx.lineTo(-8, -8);
    ctx.lineTo(-8, 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-8, -8, 6, Math.PI, 0);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#b7a07a";
    round(ctx, -16, 2, 40, 24, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff3d6";
    round(ctx, -18, -22, 36, 40, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#d64545";
    ctx.beginPath();
    ctx.moveTo(-22, -20);
    ctx.lineTo(0, -40);
    ctx.lineTo(22, -20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e07a8a";
    ctx.beginPath();
    ctx.arc(0, -6, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawHeart(ctx, 0, -8, 6);
  }
  if (b.buildLeft > 0) {
    progressBar(ctx, -32, 30, 64, 1 - b.buildLeft / b.buildMax);
  } else {
    hpBar(ctx, -32, 30, 64, b.hp / b.maxHp, b.hurt > 0);
    if (b.queue) progressBar(ctx, -32, 38, 64, 1 - b.queueT / b.queueMax);
  }
  ctx.restore();
}
function drawRally(ctx, x, y, team) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#2a2218";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(0, -16);
  ctx.stroke();
  ctx.fillStyle = team === TEAM.MALTESE ? "#e07a8a" : "#4d8f5a";
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(14, -10);
  ctx.lineTo(0, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
function workerAction(u) {
  if (u.order.type === "attack") return "battle";
  if (u.order.type === "gather") {
    const spd = Math.hypot(u.vx ?? 0, u.vy ?? 0);
    if (u.carry > 0) return spd > 10 ? "carry" : "idle";
    return spd > 10 ? "walk" : "harvest";
  }
  if (u.order.type === "move" || u.order.type === "pilot") return u.carry > 0 ? "carry" : "walk";
  return u.carry > 0 ? "carry" : "idle";
}
function drawDog(ctx, u) {
  const mal = u.team === TEAM.MALTESE;
  const moving = u.order.type !== "idle" && u.order.type !== "gather" && u.order.type !== "wait" ? 1 : u.order.type === "gather" ? 0.6 : 0.15;
  const bob = Math.sin(u.bob * (6 + moving * 6) + u.id) * (1.4 + moving * 2);
  const wag = Math.sin(u.bob * 10 + u.id) * (0.5 + moving * 0.4);
  ctx.save();
  ctx.translate(0, bob);
  if (u.type === "fighter") {
    const img = fighterFrame(u.team, u.bob, moving > 0.3);
    if (img) {
      drawSpr(ctx, img, 0, 20, 96, 96, u.facing < 0);
      ctx.restore();
      return;
    }
  } else {
    const img = workerFrame(u.team, workerAction(u), u.bob);
    if (img) {
      drawSpr(ctx, img, 0, 20, 88, 88, u.facing < 0);
      ctx.restore();
      return;
    }
  }
  ctx.scale(u.facing >= 0 ? 1 : -1, 1);
  ctx.save();
  ctx.translate(-16, 4);
  ctx.rotate(wag);
  ctx.fillStyle = mal ? "#fffdf8" : "#c48a52";
  ctx.strokeStyle = "#2a2218";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  if (u.type === "worker") {
    ctx.fillStyle = "#5b7c9a";
    ctx.strokeStyle = "#2a2218";
    ctx.lineWidth = 2.2;
    round(ctx, -11, 8, 22, 12, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#3d5a72";
    round(ctx, -10, 14, 8, 8, 2);
    ctx.fill();
    round(ctx, 2, 14, 8, 8, 2);
    ctx.fill();
  } else {
    ctx.fillStyle = mal ? "#e07a8a" : "#4d8f5a";
    ctx.strokeStyle = "#2a2218";
    ctx.lineWidth = 2.2;
    round(ctx, -13, 7, 26, 12, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = mal ? "#c45c6e" : "#3d7348";
    round(ctx, -15, 4, 8, 10, 3);
    ctx.fill();
    ctx.stroke();
    round(ctx, 7, 4, 8, 10, 3);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = mal ? "#fffdf8" : "#e0b07a";
  ctx.strokeStyle = "#2a2218";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -2, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = mal ? "#f4c4ce" : "#c48a52";
  ctx.beginPath();
  ctx.ellipse(-11, -15, 6.5, 9, -0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(11, -15, 6.5, 9, 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = mal ? "#fffdf8" : "#e0b07a";
  ctx.beginPath();
  ctx.ellipse(-11, -14, 3.2, 5, -0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(11, -14, 3.2, 5, 0.45, 0, Math.PI * 2);
  ctx.fill();
  if (u.type === "fighter") {
    ctx.fillStyle = mal ? "#c45c6e" : "#3d7348";
    round(ctx, -10, -20, 20, 6, 3);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(224,122,138,0.35)";
  ctx.beginPath();
  ctx.ellipse(-8, 2, 3.2, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(8, 2, 3.2, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a2218";
  ctx.beginPath();
  ctx.arc(-5, -3, 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(5, -3, 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 1.2, 1.5, 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2a2218";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 3.2, 3.2, 0.15, Math.PI - 0.15);
  ctx.stroke();
  if (u.type === "worker" && u.carry > 0) {
    ctx.fillStyle = "#fff6dc";
    ctx.strokeStyle = "#2a2218";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(16, 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
function drawCar(ctx, u) {
  const mal = u.team === TEAM.MALTESE;
  const moving = Math.hypot(u.vx ?? 0, u.vy ?? 0) > 12 || u.order.type === "move" || u.order.type === "attack";
  const bob = Math.sin(u.bob * 14 + u.id) * 1.1;
  ctx.save();
  ctx.translate(0, bob);
  const cimg = carFrame(u.team, u.bob, moving, u.impact > 0) || carSpr(u.team);
  if (cimg) {
    drawSpr(ctx, cimg, 0, 22, mal ? 128 : 118, mal ? 128 : 118, u.facing < 0);
    ctx.restore();
    return;
  }
  ctx.scale(u.facing >= 0 ? 1 : -1, 1);
  if (mal) {
    ctx.fillStyle = "#2a2218";
    ctx.beginPath();
    ctx.arc(-16, 12, 6, 0, Math.PI * 2);
    ctx.arc(16, 12, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#efe0a8";
    ctx.beginPath();
    ctx.arc(-16, 12, 2.4, 0, Math.PI * 2);
    ctx.arc(16, 12, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d64545";
    ctx.strokeStyle = "#2a2218";
    ctx.lineWidth = 3;
    round(ctx, -26, -6, 52, 18, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff6dc";
    round(ctx, -4, -14, 22, 10, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fffdf8";
    ctx.beginPath();
    ctx.arc(2, -18, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f4c4ce";
    ctx.beginPath();
    ctx.ellipse(-6, -26, 4.5, 6, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(10, -26, 4.5, 6, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#2a2218";
    ctx.beginPath();
    ctx.arc(-1, -18, 1.3, 0, Math.PI * 2);
    ctx.arc(5, -18, 1.3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = "#2a2218";
    ctx.lineWidth = 3;
    ctx.fillStyle = "#2a2218";
    ctx.beginPath();
    ctx.arc(-14, 10, 8, 0, Math.PI * 2);
    ctx.arc(16, 10, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#efe6d2";
    ctx.beginPath();
    ctx.arc(-14, 10, 3, 0, Math.PI * 2);
    ctx.arc(16, 10, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3d3428";
    ctx.beginPath();
    ctx.moveTo(-18, 4);
    ctx.lineTo(18, 0);
    ctx.lineTo(14, 8);
    ctx.lineTo(-16, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, 2);
    ctx.lineTo(4, -10);
    ctx.stroke();
    ctx.fillStyle = "#e0b07a";
    ctx.beginPath();
    ctx.arc(0, -12, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#c48a52";
    ctx.beginPath();
    ctx.ellipse(-8, -20, 4.5, 6, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(8, -20, 4.5, 6, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#4d8f5a";
    round(ctx, -10, -2, 18, 8, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#2a2218";
    ctx.beginPath();
    ctx.arc(-3, -12, 1.3, 0, Math.PI * 2);
    ctx.arc(3, -12, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function drawUnit(ctx, u, selected, inspect) {
  ctx.save();
  ctx.translate(u.x, u.y);
  if (u.hurt > 0) {
    ctx.fillStyle = "rgba(214,69,69,0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 4, 24, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (selected || inspect) {
    ctx.strokeStyle = selected ? "#e07a8a" : "#2a2218";
    ctx.lineWidth = selected ? 3 : 1.6;
    ctx.setLineDash(inspect && !selected ? [4, 4] : []);
    ctx.beginPath();
    ctx.ellipse(0, 16, 22, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ellipseShadow(ctx, 0, 16, u.type === "car" ? 22 : 20, 7, 0.2);
  if (u.type === "car") drawCar(ctx, u);
  else drawDog(ctx, u);
  hpBar(ctx, -18, u.type === "car" ? -48 : -56, 36, u.hp / u.maxHp, u.hurt > 0);
  if (u.piloting || u.charge > 0.05) {
    ctx.save();
    ctx.strokeStyle = "#e07a8a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * u.charge);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
function drawPuff(ctx, p) {
  const k = 1 - p.t / p.life;
  ctx.save();
  ctx.globalAlpha = Math.max(0, k);
  ctx.fillStyle = p.hue === "rose" ? "#e07a8a" : p.hue === "gold" ? "#d4a574" : "#fff6dc";
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r * (1.2 - k * 0.4), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawFloater(ctx, f) {
  const k = 1 - f.t / f.life;
  ctx.save();
  ctx.globalAlpha = Math.max(0, k);
  ctx.fillStyle = "#2a2218";
  ctx.font = "700 14px 'Noto Sans TC', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(f.text, f.x, f.y - f.rise * (1 - k));
  ctx.restore();
}
function drawMarker(ctx, m) {
  const k = 1 - m.t / 0.7;
  ctx.save();
  ctx.globalAlpha = Math.max(0, k);
  ctx.translate(m.x, m.y);
  ctx.strokeStyle = m.kind === "attack" ? "#d64545" : m.kind === "gather" ? "#c9844a" : m.kind === "rally" ? "#4d8f5a" : "#2a2218";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, 10 + (1 - k) * 8, 0, Math.PI * 2);
  ctx.stroke();
  if (m.kind === "attack") drawHeart(ctx, 0, 0, 6);
  ctx.restore();
}
function draw(ctx, state, sel, inspectId, view, marquee, extras) {
  ctx.save();
  ctx.clearRect(0, 0, view.cw, view.ch);
  ctx.fillStyle = "#efe0a8";
  ctx.fillRect(0, 0, view.cw, view.ch);
  const shake = state.trauma * state.trauma;
  const ox = view.ox + (Math.random() * 2 - 1) * shake * 10;
  const oy = view.oy + (Math.random() * 2 - 1) * shake * 8;
  ctx.translate(ox, oy);
  ctx.scale(view.scale, view.scale);
  grass(ctx, state.t);
  for (const n of state.cakes) drawCake(ctx, n);
  for (const h of state.houses) {
    drawHouse(ctx, h);
    if (extras?.showRallyOf && extras.showRallyOf.x === h.rally.x) drawRally(ctx, h.rally.x, h.rally.y, h.team);
  }
  for (const b of state.buildings) drawBuilding(ctx, b);
  if (extras?.showRallyOf) drawRally(ctx, extras.showRallyOf.x, extras.showRallyOf.y, extras.showRallyOf.team);
  for (const m of state.markers) drawMarker(ctx, m);
  const units = [...state.units].sort((a, b) => a.y - b.y);
  for (const u of units) drawUnit(ctx, u, sel.has(u.id), inspectId === u.id);
  for (const h of state.hearts) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, h.life * 2);
    drawHeart(ctx, h.x, h.y, h.r);
    ctx.restore();
  }
  for (const p of state.puffs) drawPuff(ctx, p);
  for (const f of state.floaters) drawFloater(ctx, f);
  if (extras?.placing) {
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.translate(extras.placing.x, extras.placing.y);
    ctx.strokeStyle = extras.placing.ok ? "#4d8f5a" : "#d64545";
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    const ghost = {
      id: -1,
      kind: extras.placing.kind,
      team: TEAM.MALTESE,
      x: extras.placing.x,
      y: extras.placing.y,
      r: 36,
      hp: 1,
      maxHp: 1,
      buildLeft: TRAIN[extras.placing.kind],
      buildMax: TRAIN[extras.placing.kind],
      queue: null,
      queueT: 0,
      queueMax: 1,
      phase: "queued",
      order: 0,
      rally: { x: extras.placing.x, y: extras.placing.y },
      atkCd: 0,
      hurt: 0
    };
    ctx.save();
    ctx.globalAlpha = 0.7;
    drawBuilding(ctx, ghost);
    ctx.restore();
  }
  if (marquee) {
    const x = Math.min(marquee.x0, marquee.x1);
    const y = Math.min(marquee.y0, marquee.y1);
    const w = Math.abs(marquee.x1 - marquee.x0);
    const h = Math.abs(marquee.y1 - marquee.y0);
    ctx.fillStyle = "rgba(224,122,138,0.12)";
    ctx.strokeStyle = "#e07a8a";
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  }
  ctx.restore();
}
function drawPortrait(canvas, state, inspect) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || 160;
  const h = canvas.clientHeight || 110;
  if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#fff3d6";
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2 + 8);
  ctx.scale(1.8, 1.8);
  if (!inspect) {
    ctx.restore();
    return;
  }
  if (inspect.kind === "unit") {
    const u = state.units.find((x) => x.id === inspect.id);
    if (u) {
      const copy = { ...u, x: 0, y: 0, charge: 0, piloting: false };
      if (copy.type === "car") drawCar(ctx, copy);
      else drawDog(ctx, copy);
    }
  } else if (inspect.kind === "house") {
    const house = state.houses.find((x) => x.id === inspect.id);
    if (house) drawHouse(ctx, { ...house, x: 0, y: 8, queue: null });
  } else if (inspect.kind === "building") {
    const b = state.buildings.find((x) => x.id === inspect.id);
    if (b) drawBuilding(ctx, { ...b, x: 0, y: 6 });
  } else if (inspect.kind === "cake") {
    const n = state.cakes.find((x) => x.id === inspect.id);
    if (n) drawCake(ctx, { ...n, x: 0, y: 0 });
  }
  ctx.restore();
}
export {
  draw,
  drawHeart,
  drawPortrait,
  screenToWorld,
  viewFit,
  clampPan,
  worldToScreen
};
