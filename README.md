# F1 Simulator

A browser-based Formula 1 racing simulator — physics-driven car handling, procedural engine audio, and seven full circuits, sharing one engine. No installation, no build step, no external assets.

## Play it

Open [`index.html`](index.html) in any modern browser (Chrome, Edge, Safari, Firefox) and choose a circuit. Each track is a thin HTML shell that loads the shared engine plus its own layout data:

- `index.html` — launcher / track chooser
- `redbull-ring-v2.html` — Red Bull Ring (Spielberg)
- `monaco.html` — Monaco (Monte Carlo)
- `silverstone.html` — Silverstone (Great Britain)
- `spa.html` — Spa-Francorchamps (Belgium)
- `monza.html` — Monza (Italy)
- `singapore.html` — Singapore Marina Bay (night race)
- `cota.html` — Circuit of the Americas (Austin, Texas)
- `melbourne.html` — Albert Park, Melbourne (Australia)
- `shanghai.html` — Shanghai International Circuit (China)
- `engine.js` — the shared engine (physics, camera, renderer, input, audio, HUD)
- `tracks/*.js` — per-track layout data (control points / corner data + track config)

You can also open a track file directly to skip the menu. Everything works with mouse **or** keyboard — on-screen buttons handle camera, audio, pause, reset and menu.

## Controls

| Key | Action |
|---|---|
| Arrow keys / WASD | Drive |
| Shift | DRS |
| C | Cycle camera (chase / T-cam / cockpit) |
| Esc | Back to track select |
| M | Toggle audio |
| R | Reset car |
| T | Toggle telemetry overlay |
| P | Pause |

## Features

- Slip-angle tire model with friction circle and weight transfer
- Seven tracks built from real circuit layouts, each with its own character: Red Bull Ring (alpine, three DRS zones), Monaco (walled street circuit, tunnel + harbour), Silverstone (flat, wide and fast, the Becketts esses), Spa-Francorchamps (~95 m of elevation, the Eau Rouge/Raidillon climb, Ardennes forest), Monza (low-downforce Temple of Speed, tall pines and the old banking), Singapore Marina Bay (anti-clockwise night race under floodlights, lit skyline over the harbour), and COTA (counter-clockwise, a ~19% blind climb to Turn 1 and a 1 km back straight)
- Per-track physics setups layered on shared params: Monza low-drag/low-downforce, Spa patchy forest grip, Monaco tight twitchy steering, Silverstone extra high-speed stability
- Per-track atmosphere (sky, fog, haze) including a full night mode with floodlights, stars and lit windows for Singapore
- Procedural engine, turbo, tire-screech, and wind audio (Web Audio API, no sound files)
- Three camera modes, DRS zones, lap timing with per-track best times (saved locally in your browser)
- Runs entirely client-side — no server, no network calls, no data collection
