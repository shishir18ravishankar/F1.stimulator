// Circuit Gilles Villeneuve, Montreal - 4.361 km, 14 corners, on the man-made
// Ile Notre-Dame in the St. Lawrence. Centerline traced from the real
// circuit's geometry (driven order from the S/F line), so the plan view
// matches the official track map: a long, thin island loop - the Senna S at
// the west end, three chicanes along the top, L'Epingle hairpin at the far
// east, and the ~1 km Casino straight back to the final chicane past the
// WALL OF CHAMPIONS. Points are [x,y,elev]; the island is flat.
// Key corners: Virage Senna (T1-T2), L'Epingle (T10), the Wall of Champions
// chicane (T13-T14). Elevation: flat man-made island. Active aero: automatic Straight/Corner Mode.
// Scenery: island parkland in the St. Lawrence - trees, rowing basin, casino.
const MTL_CTRL=[
  [368,330,6],[356,300,6],[344,270,6],       // S/F - the short pit straight
  [338,252,6],[330,240,6],[318,234,6],       // T1 (Virage Senna entry, L)
  [302,230,6],[292,220,6],[292,206,6],       // T2 - the Senna S turnaround
  [302,198,6],[318,196,6],
  [360,192,6],[400,192,6],                   // run east along the top
  [430,196,6],[444,188,6],[462,186,6],       // T3-T4 chicane - kerb attack
  [476,192,6],
  [530,200,6],[580,206,6],                   // run
  [620,206,6],[650,200,6],                   // T5 (kink)
  [686,196,6],[700,188,6],[718,186,6],       // T6-T7 chicane
  [732,192,6],
  [790,202,6],[840,210,6],                   // run (straight)
  [880,218,6],[894,228,6],[912,236,6],       // T8-T9 chicane
  [930,240,6],
  [980,246,6],[1020,252,6],                  // run to the hairpin
  [1050,262,6],[1068,288,6],[1074,302,6],    // T10 L'Epingle - 60 km/h
  [1066,316,6],[1046,322,6],                 // hairpin, prime overtaking
  [960,330,6],[870,338,6],[780,344,6],       // the ~1 km Casino straight
  [690,350,6],[600,356,6],[510,360,6],       // (straight) - flat-out in the trees
  [440,362,6],
  [412,360,6],                               // T12 (kink)
  [392,356,6],[378,348,6],[372,336,6],       // T13-T14 the final chicane -
];                                           // exit past the Wall of Champions
const TRACKS={
  mtl:{id:'mtl',tag:'MTL',name:'MONTREAL',halfW:6.0,lap:4361,ctrl:MTL_CTRL,
    sf:[368,330],style:'park',walled:false,traps:true,
    paved:[],
    ground:[82,120,66],                 // island parkland
    pMod:{kerbAggr:1.3,CdA:1.44,ClA:2.95,brakeForce:35000}, // kerb-riding, low drag, brake-heavy
    atmo:{skyTop:'#6795c8',skyMid:'#b6cede',skyBot:'#e8eef0',fog:[190,200,206]},
    // Ile Notre-Dame: dense poplars and maples right at the track edge
    scenery:{treeDens:0.55,treeNear:14,treeSpread:45,treeH:8,treeHVar:5,
      stands:[150,2650,4200]}},         // pits, hairpin, Senna S stands
};
