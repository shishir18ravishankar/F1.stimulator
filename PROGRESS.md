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

## In progress

- Task 4: cross-track bounce audit (write-up).

## Not started

- Task 5: car detail (tyre inner caps/sidewall depth, livery stripe + number,
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
