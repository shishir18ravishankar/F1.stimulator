// Singapore Marina Bay — 4.928 km, 19 corners, ANTI-clockwise, night race.
// Narrow, bumpy, walled street circuit with almost no breathing room between
// corners; three real straights (pit, Raffles Blvd, the 2023-rebuilt ~398 m
// section). The whole identity is the night setting: dark sky, floodlight
// pylons the whole way round, lit skyline, dark harbour water.
// Chained corner data closed by chainTrack; units ~1.7 m, elevation ~flat.
const SGP_SEGS=[
  {st:420,e:5},                      // pit straight (DRS)
  {turn:-70,r:35,e:5},               // T1 Sheares (left)
  {st:30},
  {turn:75,r:25,e:5},                // T2 (right)
  {turn:-75,r:22,e:5},               // T3 (tight left onto Republic Blvd)
  {st:220,e:5},
  {turn:12,r:120,e:5},               // T4 (flat right kink)
  {turn:-25,r:90,e:5},               // T5 (left kink)
  {st:170,e:5},                      // Raffles Boulevard (DRS)
  {turn:-10,r:150,e:5},              // T6 (kink)
  {st:160,e:5},
  {turn:-88,r:20,e:5},               // T7 Memorial (left 90)
  {st:60,e:5},
  {turn:90,r:18,e:5},                // T8 (right 90)
  {st:90,e:5},
  {turn:-40,r:45,e:5},               // T9 (left)
  {st:120,e:5},
  {turn:-70,r:16,e:5},               // T10 (single-apex left — old Singapore Sling)
  {st:70,e:5},
  {turn:-30,r:40,e:6},               // T11 (left toward Anderson Bridge)
  {st:50,e:7},
  {turn:85,r:20,e:7},                // T12 (right, over the bridge)
  {st:40,e:6},
  {turn:-120,r:14,e:5},              // T13 Fullerton hairpin (left)
  {st:150,e:5},
  {turn:90,r:18,e:5},                // T14 (right 90)
  {turn:-12,r:120,e:5},              // T15 (kink)
  {st:230,e:5},                      // 2023-rebuilt ~398 m straight (DRS)
  {turn:-85,r:18,e:5},               // T16 (left 90)
  {st:60,e:5},
  {turn:-85,r:18,e:5},               // T17 (left 90)
  {st:80,e:5},
  {turn:-45,r:30,e:5},               // T18 (left)
  {turn:55,r:40,e:5},                // T19 (right onto the pit straight)
  {st:120,e:5},
];
const TRACKS={
  sgp:{id:'sgp',tag:'SGP',name:'SINGAPORE',halfW:5.4,lap:4928,segs:SGP_SEGS,e0:5,
    sf:[500,500],style:'city',walled:true,traps:false,
    zonesS:[[1040,1280],[3690,4180]],  // Republic/Raffles run + 2023-rebuilt straight
    zoneAnchors:[],paved:[],
    ground:[24,27,36],                 // floodlit night: everything off-road falls dark
    atmo:{night:true,sun:false,skyTop:'#05091a',skyMid:'#0c1330',skyBot:'#1b2547',fog:[34,42,66]},
    scenery:{floodlights:75,waterCol:[10,28,52],windowCol:[255,214,130],
      palette:[[46,52,74],[38,44,62],[56,62,86],[42,50,70],[62,68,94],[36,42,60]]},
    pMod:{kerbAggr:1.25,mu:1.58}},     // bumpy, low-grip street surface
};
