# F1 Simulator

A browser-based Formula 1 racing simulator — physics-driven car handling, procedural engine audio, and two full circuits (Red Bull Ring and Monaco), all in a single self-contained HTML file. No installation, no build step, no external assets.

## Play it

Download [`redbull-ring-v2.html`](redbull-ring-v2.html) and open it in any modern browser (Chrome, Edge, Safari, Firefox).

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
