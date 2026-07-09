// Silverstone GP — 5.891 km, 18 corners (10R/8L), nearly flat (~11 m total
// elevation range). Former WWII airfield: wide, open, flowing and very fast.
// Built as chained corner data (length / turn / radius / elevation), closed by
// chainTrack. Units ~1.6 m each; elevations in meters, deliberately subtle.
const SIL_SEGS=[
  {st:300,e:24},                     // Hamilton straight (S/F, DRS)
  {turn:50,r:120,e:24},              // T1 Abbey (flat-out right)
  {st:40},
  {turn:-20,r:140,e:23},             // T2 Farm (flat-out left)
  {st:90,e:22},
  {turn:100,r:24,e:22},              // T3 Village (first heavy braking, right)
  {st:28},
  {turn:-150,r:17,e:22},             // T4 The Loop (slowest corner, sharp left)
  {st:22},
  {turn:-30,r:60,e:22},              // T5 Aintree (left onto Wellington)
  {st:480,e:20},                     // Wellington Straight (DRS)
  {turn:-60,r:55,e:20},              // T6 Brooklands (late-apex left)
  {st:25},
  {turn:175,r:31,e:21},              // T7 Luffield (long 180° right)
  {st:35},
  {turn:32,r:130,e:22},              // T8 Woodcote (flat right kink)
  {st:300,e:23},                     // National straight
  {turn:88,r:95,e:24},               // T9 Copse (~290 km/h right)
  {st:130,e:26},
  {turn:-38,r:105,e:27},             // T10 Maggotts (fast left flick)
  {turn:62,r:88,e:28},               // T11 Becketts (right)       — the signature
  {turn:-68,r:80,e:27},              // T12 Becketts (left)          high-speed
  {turn:52,r:75,e:26},               // T13 Chapel (right)           L-R-L-R-L esses
  {turn:-22,r:120,e:25},             // T14 Chapel exit (left onto Hangar)
  {st:520,e:21},                     // Hangar Straight (DRS)
  {turn:95,r:80,e:20},               // T15 Stowe (heavy braking right)
  {st:130,e:18},                     // dip down to Vale
  {turn:-78,r:34,e:18},              // T16 Vale (left)
  {st:55,e:19},
  {turn:170,r:55,e:21},              // T17/18 Club (long right onto the pit straight)
  {st:150,e:23},
];
const TRACKS={
  sil:{id:'sil',tag:'SIL',name:'SILVERSTONE',halfW:7.0,lap:5891,segs:SIL_SEGS,e0:24,
    sf:[500,500],style:'flat',walled:false,traps:true,
    zonesS:[[1320,2010],[4050,4770]],   // Wellington + Hangar straights
    zoneAnchors:[],paved:[],
    ground:[88,126,64],
    pMod:{ClA:3.45,yawDamp:3600},       // planted at high speed through Maggotts-Becketts
    // open, grassy, flat English countryside: sparse low trees, big stands
    scenery:{treeDens:0.06,treeNear:30,treeSpread:70,treeH:4.5,treeHVar:3.5,
      stands:[2100,2930,3380,4800]}},
};
