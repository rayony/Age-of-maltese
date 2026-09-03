# Age of Maltese / 心心狗屋

Five-minute cute RTS. Command the original **Mallow** pack (white, Maltese-type) against **Toast** (golden, retriever-type). Gather cake, train fighters, roll a red convertible, knock the other dog house to zero with pink hearts.

Inspired by the *feel* of line-drawn puppy games (including Maltese Snowwar), but every in-game character is an original drawing — not Super-Moco / 線條小狗 IP.

**Play:** open `index.html` over HTTP (`npx serve .`) or GitHub Pages.

## Prototype

- vs AI (Easy / Hard); you play Mallow
- Cake-only economy; home carts do not regen; mid cake shops do
- Buildings place from the HUD and finish on a timer (Red Alert); workers only harvest
- One building constructs at a time; extra buildings queue if you can pay now
- Menu: full pause, or let the next queued building cut in; Resume continues the parked one
- Population cap 10 (workers + fighters + cars)
- Instant death — retrain if a dog drops
- Select a unit or building for a detail sidebar (HP digits, attack, status, actions)
- Map shows HP **bars only**
- After 5:00, **Fever**: both houses lose a fixed 40 HP every 15 seconds
- Title + battle music, plus SFX (select / move / harvest / attack / fever / win / lose)
- AoE click commands; hold a fighter or car to pilot a charged heart

Not in this build: PvP rooms, bank notes / burgers, Cooking School techs.

## Local

```bash
git clone https://github.com/rayony/Age-of-maltese.git
cd Age-of-maltese
npx --yes serve -p 8080 .
```

## License

[CC BY-NC-SA 4.0](LICENSE)
