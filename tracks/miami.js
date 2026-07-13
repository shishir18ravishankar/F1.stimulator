// Miami International Autodrome - 5.412 km, 19 corners, around Hard Rock
// Stadium in Miami Gardens. Centerline traced from the real circuit's
// geometry (driven order from the S/F line), so the plan view matches the
// official track map. Points are [x,y,elev], essentially flat. Character:
// the fast flowing T4-T8 arc past the stadium campus, the fake-marina esses,
// the awkward slow T11-T15 complex threading the turnpike ramps, and the
// 1.28 km back straight into the T17 heavy-braking zone. active aero on the straights.
// Key corners: the T4-T8 stadium arc, the T11-T15 turnpike complex, T17 stop.
// Elevation: essentially flat (small ramp hop at T14-T15). Active aero: automatic Straight/Corner Mode.
// Scenery: stadium campus - Hard Rock Stadium, palms, the fake marina.
const MIA_CTRL=[
  [900,204,3],[780,202,3],[660,200,3],       // S/F straight past the stadium
  [540,198,3],[420,197,3],
  [340,198,3],
  [306,200,3],[286,206,3],[276,220,3],       // T1 - the lap-one funnel
  [272,240,3],[264,252,3],                   // T2 (kink)
  [262,270,3],[268,284,3],                   // T3 (kink)
  [264,308,3],[268,332,3],[280,352,3],       // T4 - the long, fast arc around
  [298,366,3],[320,376,3],                   // the campus, near-flat
  [344,384,3],                               // T5 (kink)
  [366,392,3],[380,404,3],[376,420,3],       // T6-T7 - the fake-marina esses
  [382,436,3],[396,446,3],[418,450,3],       // T8 opens east
  [470,454,3],[520,456,3],[570,458,3],       // the run to T11 (straight)
  [600,460,3],[620,466,3],                   // T9 (kink)
  [636,476,3],[640,490,3],                   // T10 turns down
  [636,504,3],[624,510,3],[618,522,3],       // T11-T15: the tight, walled
  [624,534,3],[636,538,3],[642,550,3],       // complex under the turnpike
  [634,560,3],[620,562,3],[612,572,3],       // ramps - first-gear stuff
  [618,584,3],[630,588,3],
  [650,592,3],[680,594,3],                   // T16 opens onto the
  [760,598,3],[840,602,3],[920,606,3],       // 1.28 km back straight
  [960,608,3],
  [984,608,3],[998,600,3],[1002,586,3],      // T17 - hairpin braking, the
  [1000,566,3],[1004,552,3],                 // big overtaking spot; T18 kink
  [1000,530,3],[1002,508,3],
  [1000,470,3],[996,420,3],[992,370,3],      // the climb back north
  [990,330,3],
  [986,296,3],[978,268,3],                   // T19: the long curve
  [964,248,3],[946,232,3],[924,218,3],       // onto the pit straight
];
const TRACKS={
  mia:{id:'mia',tag:'MIA',name:'MIAMI',halfW:6.2,lap:5412,ctrl:MIA_CTRL,
    sf:[900,204],style:'flat',walled:false,traps:true,
    paved:[],
    ground:[110,118,96],                // parched campus grass + concrete lots
    pMod:{mu:1.55,gripVar:0.02},        // hot, dusty, low-grip off line
    atmo:{skyTop:'#4f97dc',skyMid:'#a8cbe4',skyBot:'#f4ecd8',fog:[200,206,206]}, // Florida glare
    // palm rows, party stands, and the stadium bowl in the infield
    scenery:{treeDens:0.12,treeNear:22,treeSpread:55,treeH:6,treeHVar:3,treeW:1.3,
      stands:[300,2500,4000],
      banking:[560,300,60]}},           // Hard Rock Stadium bowl (decorative)
};
