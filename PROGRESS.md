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

- **Task 6: home page redesigned** — three full-screen stages in
  `index.html`: (1) animated hero (CSS speed-lines, glowing horizon, low-poly
  car crossing the screen, pulsing START); (2) car colour picker — 8 liveries
  + race number with a live side-view preview, saved to
  `localStorage('f1sim-livery')` which `engine.js` reads for the 3D car and
  cockpit overlay; (3) horizontal scroll-snap track carousel (7 cards, real
  outlines, arrows + ←/→ + Enter). In-game ESC/MENU now return to
  `index.html#tracks` so you land on the circuit list, not the hero.

- **Task 7: intro popup moved to the pause menu** — track pages no longer
  block the drive screen on load. `engine.js` hides `#help` at boot, shows a
  one-time "P — pause & controls" toast, and `actPause()` toggles the
  controls panel together with pause (H also toggles it any time). Panel
  footer text updated in all 7 track HTMLs.

## Not started

- Nothing. All 7 session tasks are complete and pushed.

## HOW TO ADD A NEW TRACK (follow this exactly)

1. **File pattern — copy `tracks/spa.js`.** A track file defines
   `const XXX_CTRL = [[x,y,elev], ...]` and a `const TRACKS = { id: {...} }`
   entry. The engine (`buildTrack`) fits a Catmull-Rom spline through `ctrl`
   and rescales the loop to `lap` meters, so absolute ctrl units don't
   matter — only proportions.
2. **Get the real centerline.** Use the GeoJSON traces from the
   `bacinger/f1-circuits` GitHub repo (or any GPS trace of the circuit):
   - project lon/lat to meters: `x = (lon-lon0)*111320*cos(lat0)`,
     `y = -(lat-lat0)*111320` (y is SCREEN-DOWN, so north is up on screen);
   - point order must follow the real racing direction — for a clockwise
     circuit the shoelace sum over the (x, y-down) points must be POSITIVE,
     anticlockwise negative; reverse the list (keeping point 0 first) if not;
   - rotate the list so point 0 sits on the real start/finish line, with
     ~250 m of straight road before the first braking zone;
   - simplify (Douglas-Peucker, ~3 m tolerance), then subdivide long gaps so
     consecutive ctrl points stay ≤ ~170 m apart (collinear inserts keep
     straights straight through the spline);
   - scale into a ~60..1060 box, round to integers.
3. **Elevation** is the third component of each point, in meters, anchored
   at real corner positions (Spa/COTA in this repo are the reference for
   dramatic profiles; flat tracks can repeat one value). The engine smooths
   and interpolates — sparse anchors are fine.
4. **TRACKS entry fields**: `id/tag/name`, `halfW` (road half-width, m),
   `lap` (real lap length, m), `ctrl`, `sf` (= first ctrl point [x,y]),
   `style` ('flat'|'forest'|'park'|'city'), `walled` (street circuit walls),
   `traps` (gravel), `zonesS` ([[fromM,toM],...] extra DRS zones in meters
   from S/F — the pit-straight zone is added automatically), `ground` rgb,
   optional `pMod` physics tweaks, `atmo` sky/fog/night, `scenery` (trees,
   `stands` at meters along the lap, `banking`/`tower` in ctrl coords,
   `floodlights` spacing for night tracks).
5. **HTML shell — copy `silverstone.html`**: change the title, the `#help`
   blurb text and the track script tag (`tracks/yourtrack.js`). Keep the
   `#help` markup structure — the pause menu shows that panel.
6. **Home page** (`index.html`): add one card inside `#scroller` (copy an
   existing card). For the outline, use the ctrl points as an SVG path
   `M x y L x y … Z` with `viewBox="minX-50 minY-50 W+100 H+100"`; the CSS
   (`vector-effect:non-scaling-stroke`) keeps line weight consistent.
7. **Cameras and car need NO per-track work.** Chase/T-cam/cockpit framing,
   bounce damping (interpolated elevation in `trackQuery()` + damped height
   channel in `updateCamera()`), the livery/number system and the car mesh
   are track-agnostic engine code — new tracks inherit all of it.
8. **Verify before pushing**: serve the folder (`python3 -m http.server`),
   open the new page and in the devtools console run
   `SIM.key.up=true; SIM.tick(600); SIM.key.up=false;` — the car should
   launch cleanly and the HUD map outline should match the real circuit.
   Browser caches engine.js/track js aggressively — refresh with
   `fetch('/engine.js',{cache:'reload'})` then reload if edits don't show.

## Git / branch state (IMPORTANT for the next session)

- All work is committed on local `main` AND pushed to the GitHub branch
  **`real-track-geometry`** (direct pushes to `main` were blocked by the
  local permission mode). Before continuing from the phone: merge that
  branch into `main` on GitHub (open + merge a PR at
  https://github.com/shishir18ravishankar/F1.stimulator/pull/new/real-track-geometry
  ), or push local `main` from this machine. Then branch new work off `main`.
