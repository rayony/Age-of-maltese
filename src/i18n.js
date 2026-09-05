const STR = {
  zh: {
    slogan: "Harvest, Build, Attack!",
    kicker: "小白 vs 小雞毛",
    how: "怎麼玩",
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
    winMsg: "小白把小雞毛的屋子砸到 0。",
    loseMsg: "小雞毛先拆掉你的屋子。再練一局。",
    winMsgR: "小雞毛把小白的屋子砸到 0。",
    loseMsgR: "小白先拆掉你的屋子。再練一局。",
    musicHint: "點一下開音樂 · 人口 10 · 三分鐘後 Fever",
    blurb: "原創小白小隊對小雞毛小隊。採蛋糕、蓋塔、訓練鬥士。小白騎獨角獸道具，小雞毛騎小鴨。塔要用狗狗幣。",
  },
  en: {
    slogan: "Harvest, Build, Attack!",
    kicker: "Maltese vs Retriever",
    how: "How to play",
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
    blurb: "Original Maltese vs Retriever. Harvest cake, build, train fighters. Towers cost Dog Coin.",
  },
};

let lang = "zh";
try {
  const saved = localStorage.getItem("aom.lang");
  if (saved === "en" || saved === "zh") lang = saved;
} catch {
  /* ignore */
}

export function getLang() {
  return lang;
}

export function setLang(next) {
  lang = next === "en" ? "en" : "zh";
  try {
    localStorage.setItem("aom.lang", lang);
  } catch {
    /* ignore */
  }
}

export function t(key) {
  return STR[lang][key] ?? STR.zh[key] ?? key;
}

export function teamLabel(team, zhName, enName) {
  return lang === "zh" ? zhName : enName;
}
