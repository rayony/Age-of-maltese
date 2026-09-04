const cache = new Map();
const VER = "kawaii11";

const PATHS = [
  ...[0, 1, 2].flatMap((i) => [`sprites/maltese/worker-idle-${i}.png`, `sprites/retriever/worker-idle-${i}.png`]),
  ...["walk", "carry", "harvest", "battle"].flatMap((a) =>
    [0, 1, 2, 3].flatMap((i) => [`sprites/maltese/worker-${a}-${i}.png`, `sprites/retriever/worker-${a}-${i}.png`]),
  ),
  ...[0, 1, 2, 3].flatMap((i) => [`sprites/maltese/fighter-${i}.png`, `sprites/retriever/fighter-${i}.png`]),
  ...[0, 1, 2, 3].flatMap((i) => [`sprites/maltese/car-${i}.png`, `sprites/retriever/car-${i}.png`]),
  "sprites/maltese/car.png",
  "sprites/retriever/car.png",
  "sprites/buildings/house-maltese.png",
  "sprites/buildings/house-retriever.png",
  "sprites/buildings/playground.png",
  "sprites/buildings/workshop.png",
  "sprites/buildings/tower.png",
  "sprites/buildings/cart.png",
  "sprites/buildings/shop.png",
  "sprites/buildings/scaffold.png",
  "sprites/ui/win.png",
  "sprites/ui/lose.png",
];

function withVer(src) {
  return `${src}?v=${VER}`;
}

function load(src) {
  const key = withVer(src);
  if (cache.has(key)) return cache.get(key);
  const img = new Image();
  img.src = key;
  cache.set(key, img);
  return img;
}

export function loadSprites() {
  [...new Set(PATHS)].forEach(load);
}

export function spr(src) {
  const img = cache.get(withVer(src)) ?? load(src);
  return img.complete && img.naturalWidth > 0 ? img : null;
}

export function animIndex(t, n, fps = 7) {
  if (n <= 1) return 0;
  return Math.floor(((t % 1000) * fps) % n);
}

export function teamFolder(team) {
  return team === 0 ? "maltese" : "retriever";
}

export function drawSpr(ctx, img, x, y, w, h, flip = false) {
  if (!img) return false;
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, -h, w, h);
  ctx.restore();
  return true;
}

export function workerFrame(team, action, t) {
  const n = action === "idle" ? 3 : 4;
  const i = animIndex(t, n, action === "idle" ? 4 : 8);
  return spr(`sprites/${teamFolder(team)}/worker-${action}-${i}.png`);
}

export function fighterFrame(team, t, moving, impact = false) {
  const i = impact ? 2 : moving ? animIndex(t, 4, 8) : animIndex(t, 4, 3);
  return spr(`sprites/${teamFolder(team)}/fighter-${i}.png`);
}

export function carSpr(team) {
  return spr(`sprites/${teamFolder(team)}/car.png`);
}

export function carFrame(team, t, moving, impact = false) {
  const i = impact ? 2 : moving ? animIndex(t, 4, 10) : animIndex(t, 4, 4);
  return spr(`sprites/${teamFolder(team)}/car-${i}.png`) ?? carSpr(team);
}

export function houseSpr(team) {
  return spr(team === 0 ? "sprites/buildings/house-maltese.png" : "sprites/buildings/house-retriever.png");
}

export function buildingSpr(kind) {
  if (kind === "playground") return spr("sprites/buildings/playground.png");
  if (kind === "workshop") return spr("sprites/buildings/workshop.png");
  if (kind === "tower") return spr("sprites/buildings/tower.png");
  return null;
}

export function cakeSpr(kind) {
  return spr(kind === "home" ? "sprites/buildings/cart.png" : "sprites/buildings/shop.png");
}

export function scaffoldSpr() {
  return spr("sprites/buildings/scaffold.png");
}
