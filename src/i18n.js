import { NAMES, TEAM_NAME, TEAM_NAME_ZH } from "./config.js";

export const LANGS = [
  { id: "zh", label: "繁中", html: "zh-Hant" },
  { id: "en", label: "EN", html: "en" },
];

const STR = {
  zh: {
    slogan: "Harvest, Build, Attack!",
    kicker: "小白 vs 小金毛",
    fineTitle: "心心狗屋",
    how: "怎麼玩",
    howOk: "知道了",
    easy: "vs AI 簡單",
    hard: "vs AI 困難",
    playAs: "出戰",
    paused: "Paused",
    pausedFine: "整場暫停，含興建。",
    resume: "繼續",
    toTitle: "回標題",
    again: "再來一局",
    units: "單位",
    build: "建築",
    stop: "停止",
    harvest: "採集",
    attack: "進攻",
    defend: "防守",
    pauseBuild: "全停",
    resumeBuild: "續建",
    cutBuild: "插隊",
    clearSel: "取消選取",
    winTitle: "狗屋還在！",
    loseTitle: "狗屋倒了",
    winMsg: "小白把小金毛的屋子砸到 0。",
    loseMsg: "小金毛先拆掉你的屋子。再練一局。",
    winMsgR: "小金毛把小白的屋子砸到 0。",
    loseMsgR: "小白先拆掉你的屋子。再練一局。",
    musicHint: "點一下開音樂 · 人口 10 · 三分鐘後 Fever",
    blurb: "原創小白小隊對小金毛小隊。採蛋糕、蓋塔、訓練鬥士。小白騎獨角獸道具，小金毛騎小鴨。塔要用狗狗幣。",
    feverSub: "攻擊 ×2 · 狗屋每 15 秒 −20",
    placeHint: "點地圖放置 · 右鍵取消",
    rallyHint: "點地圖設集結點",
    chargeHint: "點目標射出蓄力愛心",
    towerAimHint: "點敵人指定塔攻擊 · 點空地恢復自動",
    houseHit: "狗屋被打！",
    unitHit: "部隊被打",
    atk: "攻擊",
    status: "狀態",
    goldUnit: "幣",
    cheatCake: "點兩下 +100 蛋糕",
    cheatGold: "點兩下 +1 狗狗幣",
    cheatClock: "點兩下跳到 Fever 前 3 秒",
    clockCountdown: "倒數",
    clockFever: "Fever ×2",
    langAria: "語言",
    conPaused: "全停 {name}",
    conQueue: "排隊 {list}",
    conBuild: "興建 {name} {pct}%",
    stCharge: "蓄力",
    stGather: "採集",
    stDeliver: "送蛋糕",
    stAttack: "攻擊",
    stMove: "移動",
    stPilot: "駕駛",
    stWait: "等候補貨",
    stIdle: "待命",
    stCamp: "營地",
    stTrain: "訓練 {name}",
    stQueued: "排隊中",
    stBuilding: "建造中",
    stReady: "就緒",
    stLock: "鎖定 {name}",
    stAuto: "自動 · 最近單位",
    stEmpty: "空了",
    stHarvest: "可採集",
    trainWorker: "訓練工狗",
    trainFighter: "訓練鬥士",
    trainCar: "訓練騎士",
    setRally: "設集結點",
    focus: "指定目標",
    autoFocus: "自動鎖定",
    autoJobOn: "取消自動採",
    autoJobOff: "自動採集",
    chargeShot: "蓄力射擊",
    progressTrain: "訓練",
    progressBuild: "興建",
    progressStock: "庫存",
    cartEmpty: "空了 · 不再生",
    cartLive: "不再生",
    shopLive: "緩慢回補",
    hintGather: "選工狗，再點餐車採集",
    hintPlay: "點健身房，再點地圖放位置",
    hintFighter: "健身房就緒 · 訓練鬥士出擊",
    hintAttack: "點選鬥士，再點對方狗屋進攻",
    hintFever: "Fever！攻擊 ×2，兩邊狗屋每 15 秒扣 20 血",
    help1: "點你的白狗選取；長按拖單位是移動；拖空地是框選。",
    help2: "選好後再點：餐車採集、敵人攻擊、空地走路。",
    help3: "先放健身房再訓練鬥士；玩具店解鎖騎士；心心塔花 1 狗狗幣，點塔再點敵人指定攻擊。",
    help4: "點建築鈕後再點地圖放位置。同一種可排隊，顯示數量。",
    help5: "側欄可設集結點；新生單位會走過去。",
    help6: "暫停整場（Paused），興建另有全停／插隊。",
    help7: "頂部 1x / 2x / 4x。滾輪或捏合縮放。點倒數兩下跳 Fever。點蛋糕兩下 +100，點狗狗幣兩下 +1 幣。",
    help8: "三分鐘後 Fever：攻擊 ×2，狗屋每 15 秒扣 20。1x/2x/4x 只加速單位與興建，倒數維持真實時間。",
    helpFine: "家側餐車不回補，空了會變灰且不能再採。中線蛋糕店會緩慢回補。單位近戰，塔／狗屋才射愛心（瞄準後直線飛，不追蹤）。卸貨 10% 掉 1 狗狗幣，心心塔花 1 幣。",
  },
  en: {
    slogan: "Harvest, Build, Attack!",
    kicker: "Maltese vs Retriever",
    fineTitle: "Heart houses",
    how: "How to play",
    howOk: "Got it",
    easy: "vs Easy AI",
    hard: "vs Hard AI",
    playAs: "Play as",
    paused: "Paused",
    pausedFine: "Whole match paused, including construction.",
    resume: "Resume",
    toTitle: "Title",
    again: "Play again",
    units: "Units",
    build: "Build",
    stop: "Stop",
    harvest: "Harvest",
    attack: "Attack",
    defend: "Defend",
    pauseBuild: "Pause all",
    resumeBuild: "Resume",
    cutBuild: "Cut in",
    clearSel: "Deselect",
    winTitle: "House stands!",
    loseTitle: "House down",
    winMsg: "Maltese smashed the Retriever house to 0.",
    loseMsg: "Retriever wrecked your house. Try again.",
    winMsgR: "Retriever smashed the Maltese house to 0.",
    loseMsgR: "Maltese wrecked your house. Try again.",
    musicHint: "Tap for music · pop 10 · Fever at 3:00",
    blurb: "Original Maltese vs Retriever. Harvest cake, build, train fighters. Maltese rides a unicorn prop, Retriever a duck. Towers cost Dog Coin.",
    feverSub: "Attack ×2 · houses −20 every 15s",
    placeHint: "Tap the map to place · right-click cancel",
    rallyHint: "Tap the map to set rally",
    chargeHint: "Tap a target to fire a charged heart",
    towerAimHint: "Tap an enemy to lock the tower · tap ground for auto",
    houseHit: "House under attack!",
    unitHit: "Units under fire",
    atk: "Atk",
    status: "Status",
    goldUnit: "c",
    cheatCake: "Double-tap +100 cake",
    cheatGold: "Double-tap +1 Dog Coin",
    cheatClock: "Double-tap to skip to 3s before Fever",
    clockCountdown: "Countdown",
    clockFever: "Fever ×2",
    langAria: "Language",
    conPaused: "Paused {name}",
    conQueue: "Queue {list}",
    conBuild: "Build {name} {pct}%",
    stCharge: "charging",
    stGather: "harvest",
    stDeliver: "deliver",
    stAttack: "attack",
    stMove: "move",
    stPilot: "pilot",
    stWait: "waiting to unload",
    stIdle: "idle",
    stCamp: "camp",
    stTrain: "train {name}",
    stQueued: "queued",
    stBuilding: "building",
    stReady: "ready",
    stLock: "lock {name}",
    stAuto: "auto · nearest unit",
    stEmpty: "empty",
    stHarvest: "open",
    trainWorker: "Train worker",
    trainFighter: "Train fighter",
    trainCar: "Train rider",
    setRally: "Set rally",
    focus: "Lock target",
    autoFocus: "Auto lock",
    autoJobOn: "Stop auto",
    autoJobOff: "Auto harvest",
    chargeShot: "Charged shot",
    progressTrain: "Train",
    progressBuild: "Build",
    progressStock: "Stock",
    cartEmpty: "Empty · no regen",
    cartLive: "No regen",
    shopLive: "Slow regen",
    hintGather: "Select a worker, then tap a food cart",
    hintPlay: "Tap Gym, then tap the map to place",
    hintFighter: "Gym ready · train a fighter",
    hintAttack: "Select fighters, then tap the enemy house",
    hintFever: "Fever! Attack ×2, both houses −20 HP / 15s",
    help1: "Tap your white dogs to select; hold-drag a unit to move; drag empty ground to box-select.",
    help2: "With a selection: tap a food cart to harvest, an enemy to attack, empty ground to walk.",
    help3: "Place a gym then train fighters; toy shop unlocks riders; heart towers cost 1 Dog Coin — tap the tower then an enemy to lock a target.",
    help4: "Tap a build button, then tap the map to place. Same type can queue; the count shows on the button.",
    help5: "Inspect can set a rally; new units walk there.",
    help6: "Pause stops the whole match. Construction also has pause-all / cut-in.",
    help7: "Top 1x / 2x / 4x. Wheel or pinch to zoom. Double-tap the clock to skip to Fever. Double-tap cake +100, gold +1 coin.",
    help8: "After 3 minutes, Fever: attack ×2, both houses lose 20 HP every 15s. 1x/2x/4x speeds units and builds; the countdown stays real time.",
    helpFine: "Home-side food carts do not refill; empty ones grey out and cannot be harvested. Midline cake shops slowly refill. Units melee; only towers / houses shoot hearts (aimed, then fly straight — no homing). Unload 10% chance of 1 Dog Coin; heart tower costs 1 coin.",
  },
};

let lang = "zh";
try {
  const saved = localStorage.getItem("aom.lang");
  if (LANGS.some((l) => l.id === saved)) lang = saved;
} catch {
  /* ignore */
}

export function getLang() {
  return lang;
}

export function setLang(next) {
  lang = LANGS.some((l) => l.id === next) ? next : "zh";
  try {
    localStorage.setItem("aom.lang", lang);
  } catch {
    /* ignore */
  }
  return lang;
}

export function t(key, vars) {
  let s = STR[lang]?.[key] ?? STR.zh[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}

export function teamName(team) {
  return lang === "zh" ? TEAM_NAME_ZH[team] : TEAM_NAME[team];
}

export function locName(key) {
  return NAMES[key][lang === "en" ? "en" : "zh"];
}

export function otherTeamName(team) {
  return lang === "zh" ? TEAM_NAME[team] : TEAM_NAME_ZH[team];
}

export function otherLocName(key) {
  return NAMES[key][lang === "en" ? "zh" : "en"];
}

export function teamLabel(team, zhName, enName) {
  return lang === "zh" ? zhName : enName;
}
