// Circuit Zandvoort - 4.259 km, 14 corners, clockwise, snaking through the
// North Sea dunes. The 2021-return layout with the two BANKED bowls: the 19°
// Hugenholtzbocht (T3) and the 18° Arie Luyendyk final corner (T14) that
// slingshots cars onto the pit straight. Centerline traced from the real
// circuit's geometry (driven order from the S/F line), so the plan view
// matches the official track map. Points are [x,y,elev] - the lap rolls
// constantly over the dunes; Scheivlak (T7) drops blind over a crest.
const ZAN_CTRL=[
  [220,302,6],[300,304,6],[400,308,6],       // S/F pit straight
  [448,310,6],[468,318,6.5],[474,334,7],     // T1 Tarzan - the banked-bowl
  [466,348,7],[448,354,6.5],                 // hairpin, dive-bomb territory
  [428,356,6.5],[416,364,7],[414,378,7.5],   // T2 Gerlach (L)
  [408,392,8],[396,400,8.5],[380,400,9],     // T3 Hugenholtzbocht - the 19
  [350,396,10.5],[326,390,11.5],             // deg banked bowl, then the
  [306,382,12],[296,368,12.5],               // Hunserug dune climb; T4 fast
  [286,360,12],[272,362,11.5],               // T5 flick over the top
  [252,372,10.5],
  [234,384,9.5],[226,400,9],[226,420,8.5],   // T6 - long left, out to the dunes
  [230,442,8],[244,458,7],[264,466,6.5],     // T7 Scheivlak - flat-out right,
  [292,474,6],[318,480,5.8],                 // blind over the dune crest, drops
  [342,484,6],[356,494,6.2],[364,508,6.5],   // T8 right, deep braking
  [362,524,7],[350,534,7.2],                 // T9 left
  [330,540,7.5],[308,542,7.8],[292,534,8],   // T10 Slotemaker
  [274,530,8.2],[262,536,8.4],               // T11 left
  [246,546,8.6],[226,548,8.8],[210,540,9],   // T12 right, out of the far dunes
  [196,526,9.2],
  [186,510,9.5],[184,494,9.8],               // T13 fast right onto the run home
  [182,470,10],[180,404,9],                  // the back run (DRS)
  [178,344,8],[182,324,7],[192,310,6.4],     // T14 Arie Luyendyk - the 18 deg
];                                           // banked slingshot onto the straight
const TRACKS={
  zan:{id:'zan',tag:'ZAN',name:'ZANDVOORT',halfW:5.8,lap:4259,ctrl:ZAN_CTRL,
    sf:[220,302],style:'flat',walled:false,traps:true,
    zonesS:[[3540,3800]],               // the T13-T14 back run
    zoneAnchors:[],paved:[],
    ground:[132,128,92],                // marram grass over sand
    pMod:{mu:1.66,ClA:3.40,kerbAggr:1.2,gripVar:0.02}, // banking grip approximated; blown sand off-line
    atmo:{skyTop:'#5e93c8',skyMid:'#b6cde0',skyBot:'#e8ecec',fog:[202,208,210]}, // North Sea light
    // bare rolling dunes: scrubby bushes only, orange-army grandstands
    scenery:{treeDens:0.05,treeNear:20,treeSpread:55,treeH:2.6,treeHVar:1.5,treeW:2.8,
      stands:[250,700,2200]}},          // pits, Tarzan, Scheivlak stands
};
