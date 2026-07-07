# F1 Simulator

A browser-based Formula 1 racing simulator — physics-driven car handling, procedural engine audio, and two full circuits (Red Bull Ring and Monaco), all in a single self-contained HTML file. No installation, no build step, no external assets.

## Play it

Open [`index.html`](index.html) in any modern browser (Chrome, Edge, Safari, Firefox) and choose a circuit. Each track is its own standalone file:

- `index.html` — launcher / track chooser
- `redbull-ring-v2.html` — Red Bull Ring (Spielberg)
- `monaco.html` — Monaco (Monte Carlo)

You can also open a track file directly to skip the menu. Everything works with mouse **or** keyboard — on-screen buttons handle camera, audio, pause and reset.

## Controls

| Key | Action |
|---|---|
| Arrow keys / WASD | Drive |
| Shift | DRS |
| C | Cycle camera (chase / T-cam / cockpit) |
| N | Switch track |
| M | Toggle audio |
| R | Reset car |
| T | Toggle telemetry overlay |
| P | Pause |

## Features

- Slip-angle tire model with friction circle and weight transfer
- Two tracks: Red Bull Ring (Spielberg) and Monaco, both built from real circuit layouts
- Procedural engine, turbo, tire-screech, and wind audio (Web Audio API, no sound files)
- Three camera modes, DRS zones, lap timing with per-track best times (saved locally in your browser)
- Runs entirely client-side — no server, no network calls, no data collection
