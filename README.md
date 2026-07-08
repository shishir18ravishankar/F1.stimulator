# F1 Simulator

A browser-based Formula 1 racing simulator — physics-driven car handling, procedural engine audio, and five full circuits, sharing one engine. No installation, no build step, no external assets.

## Play it

Open [`index.html`](index.html) in any modern browser (Chrome, Edge, Safari, Firefox) and choose a circuit. Each track is a thin HTML shell that loads the shared engine plus its own layout data:

- `index.html` — launcher / track chooser
- `redbull-ring-v2.html` — Red Bull Ring (Spielberg)
- `monaco.html` — Monaco (Monte Carlo)
- `silverstone.html` — Silverstone (Great Britain)
- `spa.html` — Spa-Francorchamps (Belgium)
- `monza.html` — Monza (Italy)
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
- Five tracks built from real circuit layouts, each with its own character: Red Bull Ring (alpine, three DRS zones), Monaco (walled street circuit, tunnel + harbour), Silverstone (flat, wide and fast, the Becketts esses), Spa-Francorchamps (~95 m of elevation, the Eau Rouge/Raidillon climb, Ardennes forest), and Monza (low-downforce Temple of Speed, tall pines and the old banking)
- Per-track physics setups (e.g. Monza runs a low-drag, low-downforce package)
- Procedural engine, turbo, tire-screech, and wind audio (Web Audio API, no sound files)
- Three camera modes, DRS zones, lap timing with per-track best times (saved locally in your browser)
- Runs entirely client-side — no server, no network calls, no data collection
