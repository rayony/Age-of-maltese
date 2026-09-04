export const W = 1600;
export const H = 900;
export const MID_X = 800;
export const POP_CAP = 10;
export const MATCH_SECS = 180;

export const TEAM = { MALTESE: 0, RETRIEVER: 1 };

export const TEAM_NAME = {
  0: "Maltese",
  1: "Retriever",
};

export const TEAM_NAME_ZH = {
  0: "馬爾濟斯",
  1: "尋回犬",
};

export const COSTS = {
  worker: 40,
  playground: 80,
  fighter: 55,
  workshop: 100,
  car: 70,
  tower: 90,
};

export const TRAIN = {
  worker: 8,
  playground: 12,
  fighter: 10,
  workshop: 14,
  car: 10,
  tower: 10,
};

export const STATS = {
  worker: { hp: 46, speed: 95, range: 150, dmg: 8, charged: 8, rof: 1.15, radius: 16 },
  fighter: { hp: 88, speed: 82, range: 240, dmg: 14, charged: 22, rof: 1.25, radius: 18 },
  car: { hp: 50, speed: 165, range: 185, dmg: 8, charged: 8, rof: 0.7, radius: 20 },
};

export const HOUSE_HP = 400;
export const BUILDING_HP = 180;
export const TOWER_HP = 160;
export const FEVER_EVERY = 15;
export const FEVER_DMG = 20;
export const FEVER_ATK = 2;
export const CARRY = 10;

export const HOUSE_ATK = { range: 210, dmg: 10, rof: 1.65 };
export const TOWER_ATK = { range: 255, dmg: 12, rof: 1.05, r: 28 };

export const HOME_STOCK = 80;
export const HOME_RATE = 2.0;
export const HOME_SLOTS = 3;

export const WELL_STOCK = 120;
export const WELL_REGEN_CAP = 60;
export const WELL_REGEN = 4 / 3;
export const WELL_RATES = [1.4, 0.75, 0.4];
export const WELL_SLOTS = 3;

export const HEART_SPEED = 380;
export const HEART_R = 8;

export const NAMES = {
  worker: { zh: "工狗", en: "Worker" },
  fighter: { zh: "鬥士", en: "Fighter" },
  car: { zh: "騎士", en: "Rider" },
  playground: { zh: "遊樂場", en: "Playground" },
  workshop: { zh: "工坊", en: "Workshop" },
  tower: { zh: "心心塔", en: "Heart tower" },
  house: { zh: "狗屋", en: "House" },
  cake: { zh: "蛋糕", en: "Cake" },
  well: { zh: "蛋糕店", en: "Cake shop" },
  home: { zh: "餐車", en: "Food cart" },
};
