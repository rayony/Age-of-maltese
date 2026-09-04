# Age of Maltese

<p align="center">
  <img src="https://github.com/user-attachments/assets/5eefb7fc-edae-4eda-b21e-65219d102c3e" alt="Age of Maltese — banner" width="640">
</p>

A browser-based, fast-paced RTS game in five minutes: Command the Maltese (white dog characters) against the Retriever (golden dog characters). Gather cake, train fighters or a rider, and knock the other dog's house to zero with hearts.

Fan tribute work inspired by Maltese@moonlab 線條小狗 IP, not for commercial use.

**Play:** [maltese-rts.grok.me](https://maltese-rts.grok.me/)  

## Rules

- vs AI (Easy / Hard); you play Maltese
- Game ends when the doghouse of either side has no more HP (0)
- Cake-only economy; home carts do not regen; cake shops in the middle do
- Workers only harvest cake, and more workers can be trained by consuming cake
- Fighter and Rider require a prerequisite to train (at least one playground/workshop), stronger than workers but don't harvest
- Construct a maximum of one building and one unit at a time; extra buildings/unit queue if you can pay now
- Extra playground/workshop shortens the time and cake required to train a unit
- Population cap at 10 units for each team (workers + fighters + riders)
- Instant death — retrain if a dog drops
- Select a unit or building for a detail sidebar (HP stat, attack stat, status)
- Map shows HP **bars only**, cake remain **bars only**, built progress **bars only**
- After 5:00, **Fever Time**: both houses lose a fixed amount of HP every 15 seconds; attack power x2

## Local

```bash
git clone https://github.com/rayony/Age-of-maltese.git
cd Age-of-maltese
npx --yes serve -p 8080 .
```

## License

[CC BY-NC-SA 4.0](LICENSE)
