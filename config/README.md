# Balance tables

Excel sources from issue #24. Runtime values live in `src/config.js` (browser cannot read xlsx).

| File | Maps to |
|---|---|
| `Unit_Config.xlsx` | `STATS`, `COSTS` for worker / fighter / rider, `CARRY`, harvest 2 cake/s |
| `Bld_Config.xlsx` | house / gym / toy shop / tower / cart / cake shop HP, costs, regen |
| `Init_Config.xlsx` | `START` cake / gold / units |

Edit `src/config.js` to playtest. Re-copy numbers from the xlsx when those files change.

Notes implemented with a guess (see PR):
- 狗狗幣 drop chance on cake unload (`GOLD_UNLOAD_CHANCE = 0.3`)
- HUD starts with 200 cake (Init 蛋糕 200)
- Player 2 workers + 1 rider; Easy AI 1 worker + 1 rider (issue #21)
