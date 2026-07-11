# Track Expansion Progress

Goal: add 17 circuits to the existing 7 (Red Bull Ring, Monaco, Silverstone,
Spa, Monza, Singapore, COTA), each at the same depth: researched real corner
names/count, real length, real DRS zones, elevation character, per-track
physics + atmosphere + scenery, launcher card with real callouts.

Shape reference: the two 2026-calendar poster images supplied by Shishir,
cross-checked against real circuit geometry knowledge. Every track is
validated with a script that mimics the engine build (resample @3 m, smooth,
curvature) and checks self-intersection, leg clearance, min corner radius and
DRS-zone placement, then smoke-tested headless in Chromium (page loads, engine
builds, minimap + HUD render).

## Status

| # | Track | Geometry | Config/physics | HTML shell | Launcher card | Committed |
|---|-------|----------|----------------|------------|---------------|-----------|
| 1 | Melbourne | done | done | done | done | yes |
| 2 | Shanghai | done | done | done | done | yes |
| 3 | Suzuka | done | done | done | done | yes |
| 4 | Sakhir (Bahrain) | done | done | done | done | yes |
| 5 | Jeddah | done | done | done | done | yes |
| 6 | Miami | done | done | done | done | yes |
| 7 | Montreal | done | done | done | done | yes |
| 8 | Barcelona | done | done | done | done | yes |
| 9 | Hungaroring | — | — | — | — | — |
| 10 | Zandvoort | — | — | — | — | — |
| 11 | Madrid (Madring) | — | — | — | — | — |
| 12 | Baku | — | — | — | — | — |
| 13 | Mexico City | — | — | — | — | — |
| 14 | Interlagos | — | — | — | — | — |
| 15 | Las Vegas | — | — | — | — | — |
| 16 | Lusail (Qatar) | — | — | — | — | — |
| 17 | Yas Marina (Abu Dhabi) | — | — | — | — | — |

## Research ledger (facts encoded per track)

| Track | Length | Turns | Dir | DRS | Signature | Environment |
|---|---|---|---|---|---|---|
| Melbourne | 5.278 km | 14 | CW | 4 | Jones T1, Lakeside T9-T10 chicane | parkland around Albert Park Lake |
| Shanghai | 5.451 km | 16 | CW | 2 | T1-T3 snail, T12-13 carousel, 1.17 km back straight, T14 hairpin | reclaimed marshland, wing-roof stands |
| Suzuka | 5.807 km | 18 | figure-8 | 1 | Esses, Degner, Spoon, 130R, Casio Triangle | countryside + amusement park |
| Sakhir | 5.412 km | 15 | CW | 3 | T1 heavy braking, T9-T10 downhill | desert, floodlit night race |
| Jeddah | 6.174 km | 27 | ACW | 3 | fastest street circuit, banked T13 | Red Sea corniche, night |
| Miami | 5.412 km | 19 | ACW | 3 | T11-T16 tight section, long T17 back straight | Hard Rock Stadium campus |
| Montreal | 4.361 km | 14 | CW | 3 | Senna S, L'Epingle hairpin, Wall of Champions | Ile Notre-Dame parkland |
| Barcelona | 4.657 km | 14 | CW | 2 | T3 long right, Campsa blind crest, T14 onto straight | Catalan hills (no-chicane layout) |
| Hungaroring | 4.381 km | 14 | CW | 2 | T1 downhill brake, T4 blind left, T6-7 chicane | valley amphitheatre |
| Zandvoort | 4.259 km | 14 | CW | 2 | Tarzan, Scheivlak, banked Hugenholtz T3 + Luyendyk T14 | North Sea dunes |
| Madrid | 5.474 km | 22 | CW | ~2 | La Monumental banked corner | IFEMA urban + park, new 2026 |
| Baku | 6.003 km | 20 | ACW | 2 | castle section (7.6 m wide), 2.2 km flat-out run | medieval old city + boulevard |
| Mexico City | 4.304 km | 17 | CW | 3 | Foro Sol stadium, Peraltada, 2,285 m altitude (thin air) | stadium park, altitude physics |
| Interlagos | 4.309 km | 15 | ACW | 2 | Senna S, Descida do Lago, Junção climb | natural amphitheatre |
| Las Vegas | 6.201 km | 17 | ACW | 2 | 1.9 km Strip straight, Sphere corner | neon night city, cold track |
| Lusail | 5.419 km | 16 | CW | 1 | fast flowing triple-apex rights | desert, floodlit night |
| Yas Marina | 5.281 km | 16 | ACW | 2 | T5 hairpin after the long straight, marina hotel sector | twilight into night |

## Notes / approximations

- **Melbourne**: 2022-revised layout (old T9-T10 chicane removed). 4 DRS zones
  as per 2024 (main straight, T2-T3, Lakeside, T10-T11). Lake is inside the
  loop but the engine only draws infield water for `city`-style tracks, so the
  lake itself is implied by the parkland treeline, not drawn.
- **Shanghai**: back straight comes out ~800 m at map proportions (real
  1,170 m) because the poster-faithful outline compresses it slightly; DRS
  zone placed on the full straight. Elevation is the snail's crest-and-fall
  (~9 m) — the real circuit is otherwise flat.
- Engine limitation noted for all tracks: banked corners (Zandvoort, Madrid)
  can't be modelled by the physics — approximated with extra per-track grip.
- **Suzuka**: the figure-8 crossover is real and driveable — the validator
  confirms exactly one centerline intersection (the bridge), with the back
  straight passing ~7 m above the Degner-exit road. The engine's local
  track-following handles the crossover because the two legs are far apart
  in lap distance. The amusement-park Ferris wheel is approximated with the
  engine's landmark-tower primitive. Elevation profile is compressed
  (~24 m rendered vs ~40 m real) to keep the crossover clean.
- **Sakhir**: 2004 GP layout (the current F1 one). Night mode + floodlights
  like Singapore, but open desert instead of city: dark sand ground, sparse
  oasis palms, `gripVar` for the sandy off-line patches.
- **Jeddah**: city-style night render; the engine's infield-water primitive
  lands exactly where the real Al Arbaeen lagoon is (inside the loop). The
  T13 12° banking can't be simulated — compensated with high-speed-stability
  physics (`yawDamp`, low drag). Many of the real 27 "corners" are flat-out
  kinks, which matches the gentle-kink geometry used on the two long runs.
- **Miami**: corner sequence, signature sections (stadium arc, marina esses,
  turnpike-ramp complex, 1.28 km back straight, T17) and lengths are real;
  the T18-T19 return leg is proportionally longer than reality because the
  engine needs the pit straight fed without crossing the T8-T11 leg.
  Hard Rock Stadium approximated with the decorative banked-bowl primitive.
- **Montreal**: rowing-basin water can't be drawn (water is a city-style-only
  primitive) — implied by the dense island treeline instead. The Wall of
  Champions is called out in the help text but renders as the standard
  corner wall. 3 DRS zones (T7-T8 run, Casino straight, main straight).
- **Barcelona**: 2023-onward no-chicane layout. Repsol's wrap is mirrored
  relative to the real map to keep the T5 descent clear of the T3 climb
  (the sim's y-down rendering mirrors handedness anyway); elevation profile
  (~15 m rendered) follows the real climb/valley/crest rhythm.
