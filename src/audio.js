let ctx = null;
let master = null;
let musicGain = null;
let sfxGain = null;
let musicTimer = null;
let track = "off";
let step = 0;

const TITLE = [
  [0, 523, 0.18], [1, 659, 0.18], [2, 784, 0.22], [3, 659, 0.18],
  [4, 587, 0.18], [5, 523, 0.22], [6, 440, 0.2], [7, 523, 0.28],
];
const BATTLE = [
  [0, 392, 0.12], [0.5, 494, 0.1], [1, 587, 0.12], [1.5, 659, 0.1],
  [2, 784, 0.14], [2.5, 659, 0.1], [3, 587, 0.12], [3.5, 494, 0.14],
];

export function unlock() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(ctx.destination);
  musicGain = ctx.createGain();
  musicGain.gain.value = 0.35;
  musicGain.connect(master);
  sfxGain = ctx.createGain();
  sfxGain.gain.value = 0.7;
  sfxGain.connect(master);
}

function beep(freq, dur, type, vol, when) {
  if (!ctx || !sfxGain) return;
  const t = when ?? ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g);
  g.connect(sfxGain);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function sfx(name) {
  unlock();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const t = ctx.currentTime;
  if (name === "select") beep(880, 0.07, "triangle", 0.18, t);
  else if (name === "move") {
    beep(420, 0.06, "sine", 0.12, t);
    beep(520, 0.07, "sine", 0.1, t + 0.05);
  } else if (name === "attack") {
    beep(320, 0.08, "square", 0.12, t);
    beep(640, 0.1, "triangle", 0.16, t + 0.04);
  } else if (name === "harvest") {
    beep(700, 0.05, "sine", 0.12, t);
    beep(840, 0.08, "sine", 0.1, t + 0.06);
  } else if (name === "win") {
    [523, 659, 784, 1046].forEach((f, i) => beep(f, 0.18, "triangle", 0.2, t + i * 0.12));
  } else if (name === "lose") {
    [392, 330, 262].forEach((f, i) => beep(f, 0.22, "sawtooth", 0.12, t + i * 0.16));
  } else if (name === "fever") {
    beep(220, 0.16, "sawtooth", 0.14, t);
    beep(440, 0.2, "square", 0.12, t + 0.08);
    beep(880, 0.28, "triangle", 0.16, t + 0.16);
  }
}

function playNote(freq, dur, t0) {
  if (!ctx || !musicGain) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = track === "title" ? "triangle" : "square";
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(musicGain);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function tickMusic() {
  if (!ctx || track === "off") return;
  const seq = track === "title" ? TITLE : BATTLE;
  const beat = track === "title" ? 0.42 : 0.28;
  const t0 = ctx.currentTime;
  const bar = seq.length;
  const note = seq[step % bar];
  playNote(note[1], note[2], t0);
  if (track === "battle" && step % 4 === 0) playNote(note[1] / 2, 0.16, t0);
  step += 1;
  musicTimer = setTimeout(tickMusic, beat * 1000);
}

export function setTrack(name) {
  unlock();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  if (track === name) return;
  track = name;
  step = 0;
  if (musicTimer) clearTimeout(musicTimer);
  if (name === "off") return;
  tickMusic();
}

export function stopAll() {
  setTrack("off");
}
