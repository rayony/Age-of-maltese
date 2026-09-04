// Tunables mirrored from /config/*.xlsx (issue #24). Edit this file to playtest.
export const W = 1600;
export const H = 900;
export const MID_X = 800;
export const POP_CAP = 10;
export const MATCH_SECS = 180;
export const WAIT_QUEUE_CAP = 5;
export const GOLD_UNLOAD_CHANCE = 0.3;

export const TEAM = { MALTESE: 0, RETRIEVER: 1 };

export const TEAM_NAME = {
  0: "Maltese",
  1: "Retriever",
};

export const TEAM_NAME_ZH = {
  0: "小白",
  1: "小金毛",
};

export const START = {
  cake: 200,
  gold: 0,
  player: { worker: 2, fighter: 0, car: 1 },
  ai: { worker: 1, fighter: 0, car: 1 },
};

export const COSTS = {
  worker: 50,
  playground: 80, // gym room
  fighter: 60,
  workshop: 100, // toy shop
  car: 80,
  tower: 0,
};

export const GOLD_COSTS = {
  tower: 1,
};

export const TRAIN = {
  worker: 8,
  playground: 12,
  fighter: 10,
  workshop: 14,
  car: 10,
  tower: 10,
};

// range: fighter melee (sheet 攻擊距離 1). Worker/rider stay hearts per issue #9.
export const STATS = {
  worker: { hp: 25, speed: 95, range: 150, dmg: 3, charged: 3, rof: 1, radius: 16, melee: false },
  fighter: { hp: 40, speed: 114, range: 42, dmg: 4, charged: 4, rof: 0.5, radius: 18, melee: true, vsBuilding: 2 },
  car: { hp: 60, speed: 142, range: 185, dmg: 8, charged: 8, rof: 0.5, radius: 20, melee: false, vsUnit: 2 },
};

export const HOUSE_HP = 500;
export const BUILDING_HP = 180;
export const TOWER_HP = 250;
export const FEVER_EVERY = 15;
export const FEVER_DMG = 20;
export const FEVER_ATK = 2;
export const CARRY = 10;
export const HARVEST_RATE = 2;

export const HOUSE_ATK = { range: 210, dmg: 5, rof: 1 };
export const TOWER_ATK = { range: 210, dmg: 5, rof: 1, r: 28 };

export const HOME_STOCK = 100;
export const HOME_RATE = 2.0;
export const HOME_SLOTS = 3;

export const WELL_STOCK = 500;
export const WELL_REGEN_CAP = 500;
export const WELL_REGEN = 2;
export const WELL_RATES = [2, 1, 0.5];
export const WELL_SLOTS = 3;

export const HEART_SPEED = 380;
export const HEART_R = 8;

export const NAMES = {
  worker: { zh: "工狗", en: "Worker" },
  fighter: { zh: "鬥士", en: "Fighter" },
  car: { zh: "騎士", en: "Rider" },
  playground: { zh: "健身房", en: "Gym room" },
  workshop: { zh: "玩具店", en: "Toy shop" },
  tower: { zh: "心心塔", en: "Heart tower" },
  house: { zh: "狗屋", en: "House" },
  cake: { zh: "蛋糕", en: "Cake" },
  gold: { zh: "狗狗幣", en: "Gold" },
  well: { zh: "蛋糕店", en: "Cake shop" },
  home: { zh: "餐車", en: "Food cart" },
};
