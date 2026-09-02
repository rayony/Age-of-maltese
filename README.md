# Age of Maltese / 心心狗屋

Five-minute cute RTS. Command a pack of **Maltese** against **golden retrievers** — gather cake, train fighters, roll a red convertible, and knock the other dog house to zero HP with pink hearts.

Fan follow-up to [Maltese Snowwar](https://github.com/rayony/maltese-snowwar). Unofficial, non-commercial.

**Play:** open `index.html` over HTTP (`npx serve .`) or enable GitHub Pages on this repo.

## Prototype

- vs AI (Easy / Hard), you are always Maltese
- Cake-only economy
- Home picnic baskets **do not regen**; mid cake-wells **do**
- Population cap **10** (workers + fighters + cars)
- Instant death — retrain if a dog drops
- AoE-style click commands
- Long-press a selected fighter or car to pilot and throw a charged heart
- Touch HUD for phones

Not in this build: PvP rooms, bank notes / burgers, Cooking School techs, fog of war.

## Local

```bash
git clone https://github.com/rayony/Age-of-maltese.git
cd Age-of-maltese
npx --yes serve -p 8080 .
```

## License

[CC BY-NC-SA 4.0](LICENSE)
