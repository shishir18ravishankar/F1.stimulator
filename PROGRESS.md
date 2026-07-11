# PROGRESS

Session log for the camera/car/home-page fix batch (2026-07-11).
Branch note: direct pushes to `main` are blocked in this environment's
permission mode, so work is pushed to the **`real-track-geometry`** branch
on GitHub (local `main` carries the same commits). Merge that branch into
`main` on GitHub (or run `git push origin main` locally) to sync.

## Done

- **Real track geometry (previous session)** — all 5 GP tracks (Silverstone,
  Spa, Monza, Singapore, COTA) use GPS-traced `ctrl` centerlines; launcher
  cards draw the same shapes.
- **Task 1: chase cam fixed** — pulled back (10.2 m → 13.0 m) and raised
  (+3.3 m → +4.0 m), pitch flattened to 0.035 so the whole car (rear wing,
  tyres, halo) sits in the bottom third with the track visible ahead.
  Changed: `updateCamera()` mode-0 block in `engine.js`.
- **Task 2: cockpit cam fixed** — the real 3D nose / front wing / front
  suspension / front tyres are now drawn in cockpit view (`drawCarMesh()`
  skips faces whose local x < 0.95 and rear wheels in mode 2, and `render()`
  calls it in every mode). The 2D overlay lost its fake full-height tyre
  rectangles and the giant red cowl flanks are now low corner pods; dash
  cowl slimmed. Verify note: browser caches engine.js — use
  `fetch('/engine.js',{cache:'reload'})` before reload when testing.

- **Task 3: T-cam (and root-cause) bounce fixed** — two changes:
  1. `trackQuery()` now interpolates elevation between the 3 m track samples
     (projection onto the local segment) instead of returning the nearest
     sample; the stair-stepping of `car.elev` was the actual bounce source
     for the car and every camera on every hilly track.
  2. `updateCamera()` gives T-cam and cockpit a damped height channel
     (`hK` = 12/s) while x/y stay stiff, so bumps don't shake the view.
  Measured on COTA T-cam at 278 km/h: elevation jitter 163.5 → 10.8 mm rms,
  camera height jitter 1.7 mm rms.

- **Task 4: bounce audited on every track and camera** — automated audit via
  the `SIM` hook: full-throttle launch from S/F, 6 s at 60 fps per camera,
  measuring frame-to-frame acceleration of `cam.h` (mm). Results (worst /
  rms, all cams within):

  | Track       | chase       | T-cam       | cockpit     |
  |-------------|-------------|-------------|-------------|
  | Red Bull Ring | 0.1/0.02  | 0.1/0.02    | 0.1/0.02    |
  | Monaco      | 0.3/0.21    | 0.4/0.22    | 0.4/0.22    |
  | Silverstone | 0.1/0.04    | 0.1/0.04    | 0.1/0.04    |
  | Spa         | 0.1/0.05    | 0.1/0.05    | 0.1/0.05    |
  | Monza       | 0.0/0.00    | 0.0/0.00    | 0.0/0.00    |
  | Singapore   | 0.0/0.00    | 0.0/0.00    | 0.0/0.00    |
  | COTA (33 m climb) | 0.5/0.34 | 0.6/0.34 | 0.6/0.34    |

  All sub-millimetre — no bouncy view remains. (Deliberate kerb/off-road
  shake in `render()` is unchanged and intentional.)

- **Task 5: car detail improved (still low-poly)** —
  - wheels: inner closing caps (fixes rear tyres reading as hollow tubes /
    "front-facing geometry" from behind), bright rim lip + recessed rim well
    for sidewall depth, kept spinning treads/spokes/marks;
  - shading: stronger directional light (0.62–1.0) plus cheap height-based
    ambient occlusion so the body reads as a form;
  - livery: accent stripe down the nose + spine, dimmed-livery tail cap,
    race-number decals (nose roundel seen from ahead, endplate numbers seen
    side-on), all colours configurable via `localStorage('f1sim-livery')`
    `{primary:[r,g,b], accent:[r,g,b], number}` — read in `engine.js`, the
    home-page picker (task 6) writes it.

## Not started

- Task 5 leftovers: none. (tyre inner caps/sidewall depth, livery stripe + number,
  stronger shading). Car mesh lives in `buildCar()` / `drawCarMesh()`.
- Task 6: home page redesign (animated hero, car colour picker → store in
  localStorage for the engine to read, horizontal scrolling track cards).
- Task 7: move the intro/controls popup (`#help` in each track HTML +
  `helpShown` in engine.js) into the pause/settings menu instead of showing
  on every load.

## Notes for adding new tracks (to be completed at end of session)

- Track file pattern: see `tracks/spa.js` — a `XXX_CTRL` array of
  `[x,y,elev]` points traced from the real circuit (north = up, driven
  order, first point = S/F line, y is screen-down), plus a `TRACKS` entry
  with `ctrl`, `lap` (meters), `sf` (= first ctrl point), `zonesS` (DRS in
  meters from S/F), `halfW`, `style`, scenery/atmo/pMod.
- Conversion tooling used: bacinger/f1-circuits GeoJSON → project lon/lat to
  meters (x=east, y=-north), enforce racing direction (clockwise ⇒ positive
  shoelace in y-down coords), rotate start to the real S/F, Douglas-Peucker
  ~3 m, subdivide straights so control-point gaps stay ≤ ~170 m, scale into
  a ~1000-unit box.
