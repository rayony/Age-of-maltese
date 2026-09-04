# Age of Maltese

Cute three-minute RTS. Command the original **Mallow** pack (white, Maltese-type) against **Toast** (golden, retriever-type). Gather cake, train fighters, roll a red convertible, knock the other dog house to zero with pink hearts.

**Harvest, Build, Attack!**

Inspired by the *feel* of line-drawn puppy games (including Maltese Snowwar), but every in-game character is an original drawing — not Super-Moco / 線條小狗 IP.

**Play:** [rayony.github.io/Age-of-maltese](https://rayony.github.io/Age-of-maltese/)  
Fallback: open `index.html` over HTTP (`npx serve .`).

## Prototype

- vs AI (Easy / Hard); you play Mallow
- Cake-only economy; home **food carts** do not regen; mid **cake shops** do
- Buildings place from the HUD then drop on the map (Red Alert timer); workers only harvest
- One building constructs at a time; extra buildings queue if you can pay now (same type stacks, count shown)
- Menu: full match pause (`Paused`), or let the next queued building cut in; Resume continues the parked one
- Population cap 10 (workers + fighters + cars)
- Instant death — retrain if a dog drops
- Select a unit or building for a detail sidebar (portrait, HP digits, attack, status, actions) with a close button
- Map shows HP **bars only**; house bars sit on each side of the clock
- Right dock: **單位 / 建築** tabs; affordable buttons light up
- After **3:00**, **Fever**: attack ×2, both houses lose a fixed 40 HP every 15 seconds (double-click the clock to skip to the last 3 seconds)
- Title + battle music, plus SFX (select / move / harvest / attack / fever / warn / win / lose)
- Long-press drag to move; next click is gather / attack / walk; no friendly fire
- Wheel or pinch to zoom; 1x / 2x / 4x speed
- Heart towers auto-fire nearby enemies; dog houses have range attack
- New units walk to the building rally point

Not in this build: PvP rooms, bank notes / burgers, Cooking School techs.

## Local

```bash
git clone https://github.com/rayony/Age-of-maltese.git
cd Age-of-maltese
npx --yes serve -p 8080 .
```

## License

[CC BY-NC-SA 4.0](LICENSE)
