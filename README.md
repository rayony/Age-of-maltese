# Age of Maltese

<img width="1888" height="1044" alt="banner" src="https://github.com/user-attachments/assets/5eefb7fc-edae-4eda-b21e-65219d102c3e" />

A browser-based, fast-paced RTS game in five minutes: Command the Maltese (white dog characters) against the Retriever (golden dog characters). Gather cake, train fighters or a rider, and knock the other dog's house to zero with hearts.

Fan tribute work inspired by Maltese@moonlab 線條小狗 IP, not for commercial use.

**Play:** [maltese-rts.grok.me](https://maltese-rts.grok.me/)  

## Prototype

- vs AI (Easy / Hard); you play Maltese
- Cake-only economy; home carts do not regen; cake shops in the middle do
- Workers only harvest cake
- Construct one building at a time; extra buildings queue if you can pay now
- Population cap at 10 units for each team (workers + fighters + riders)
- Instant death — retrain if a dog drops
- Select a unit or building for a detail sidebar (HP stat, attack stat, status)
- Map shows HP **bars only**
- After 5:00, **Fever Time**: both houses lose a fixed HP every 15 seconds, attack power x2
- Title + battle music, plus SFX (select / move / harvest / attack / fever / win / lose)

## Local

```bash
git clone https://github.com/rayony/Age-of-maltese.git
cd Age-of-maltese
npx --yes serve -p 8080 .
```

## License

[CC BY-NC-SA 4.0](LICENSE)
