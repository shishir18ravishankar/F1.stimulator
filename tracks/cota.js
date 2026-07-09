// Circuit of the Americas — 5.513 km, 20 corners, COUNTER-clockwise
// (left-hand-heavy). Defining feature: the ~40 m climb from the grid to the
// blind T1 hairpin on the crest, steeper at the top than Spa's Raidillon,
// then the Silverstone-style esses (T3-6), the T11 hairpin into a ~1 km back
// straight, the Hockenheim-style stadium section (T13-15) and a triple-apex
// right (T16-18). Landmark: the ~70 m observation tower.
// Chained corner data closed by chainTrack; units ~1.9 m.
const COTA_SEGS=[
  {st:150,e:6},                      // pit straight, starting the climb
  {st:74,e:18},                      // ramp steepens
  {st:40,e:33},                      // final pitch to the crest (~20%)
  {turn:-130,r:16,e:36},             // T1 The Tower (blind left on the crest)
  {st:105,e:26},                     // falls away downhill
  {turn:50,r:60,e:20},               // T2 (right, downhill — Senna S)
  {st:24,e:16},
  {turn:-57,r:80,e:14},              // T3 esses (left)  — Maggotts/Becketts
  {turn:40,r:75,e:13},               // T4 (right)          character, mirrored
  {turn:-51,r:70,e:12},              // T5 (left)
  {turn:60,r:80,e:12},               // T6 (right, esses exit)
  {st:60,e:10},
  {turn:-31,r:40,e:9},               // T7 (left, tightening)
  {turn:82,r:35,e:8},                // T8 (right)
  {turn:-56,r:28,e:7},               // T9 (left)
  {st:109,e:6},
  {turn:-52,r:45,e:5},               // T10 (blind left)
  {st:150,e:4},
  {turn:-145,r:15,e:4},              // T11 hairpin (furthest point from the pits)
  {st:699,e:0},                      // ~1 km back straight (DRS)
  {turn:-114,r:22,e:1},              // T12 (heavy braking left)
  {st:55,e:2},
  {turn:-55,r:35,e:2},               // T13 stadium section (left)  — Hockenheim
  {turn:50,r:30,e:3},                // T14 (right)                    character
  {turn:-84,r:25,e:3},               // T15 (left, stadium exit)
  {st:79,e:4},
  {turn:68,r:55,e:6},                // T16 (right — triple-apex entry)
  {turn:53,r:50,e:7},                // T17 (right)
  {turn:45,r:55,e:6},                // T18 (right, exit)
  {st:113,e:4},
  {turn:-60,r:45,e:3},               // T19 (left)
  {st:52,e:2},
  {turn:-99,r:30,e:1},               // T20 (left onto the pit straight)
  {st:60,e:0},
];
const TRACKS={
  cota:{id:'cota',tag:'COTA',name:'CIRCUIT OF THE AMERICAS',halfW:6.5,lap:5513,segs:COTA_SEGS,e0:0,
    sf:[500,500],style:'flat',walled:false,traps:true,
    zonesS:[[2600,3950]],              // back straight
    zoneAnchors:[],paved:[],
    ground:[112,114,60],               // sun-dried Texas grass
    atmo:{skyTop:'#6f9fd6',skyMid:'#c2d2de',skyBot:'#f0e6cf'},
    scenery:{treeDens:0.10,treeNear:28,treeSpread:65,treeH:4,treeHVar:3,
      stands:[700,4150,4500],
      tower:[317,192,68]}},            // observation tower by the stadium section
};
