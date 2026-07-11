// Lusail International Circuit, Qatar - 5.419 km, 16 corners, clockwise,
// floodlit desert night race. Built for MotoGP, so it flows like a bike
// track: almost no slow corners, just an unbroken rhythm of medium-fast
// sweepers where the tires never rest - the physical race of the year.
// Centerline traced from the real circuit's geometry (driven order from the
// S/F line), so the plan view matches the official track map. Points are
// [x,y,elev]; the desert is flat, the grip falls off sharply off-line.
const LUS_CTRL=[
  [300,558,3],[380,561,3],[460,564,3],       // S/F - the 1.07 km main straight
  [516,564,3],[532,556,3],[540,542,3],       // T1 - braking from 330
  [542,524,3],[550,510,3],                   // T2 flows immediately
  [560,488,3],
  [564,470,3],[560,454,3],                   // T3
  [550,436,3],
  [548,418,3],[556,404,3],                   // T4 - rhythm building
  [570,388,3],
  [574,370,3],[568,354,3],                   // T5
  [556,336,3],
  [546,322,3],[530,314,3],                   // T6 - the tricky tightener
  [508,310,3],
  [486,304,3],[474,292,3],                   // T7
  [460,276,3],
  [450,260,3],[452,242,3],                   // T8
  [446,222,3],[430,210,3],                   // T9 - over the top
  [396,204,3],[364,202,3],
  [332,204,3],[308,214,3],[296,230,3],       // T10 - the long left
  [286,250,3],
  [278,268,3],[280,286,3],                   // T11
  [284,312,3],
  [278,332,3],[284,350,3],[276,368,3],       // T12-T14 - the fast esses,
  [282,386,3],[274,404,3],                   // flat or nearly, never straight
  [272,422,3],[264,438,3],                   // T15
  [250,454,3],
  [240,472,3],[234,494,3],[236,516,3],       // T16 - the long final right
  [246,536,3],[262,550,3],[284,556,3],       // sweeping onto the straight
];
const TRACKS={
  lus:{id:'lus',tag:'LUS',name:'LUSAIL',halfW:6.2,lap:5419,ctrl:LUS_CTRL,
    sf:[300,558],style:'flat',walled:false,traps:true,
    zonesS:[],                          // one DRS zone: the main straight
    zoneAnchors:[],paved:[],
    ground:[52,48,38],                  // floodlit desert scrub
    pMod:{ClA:3.50,mu:1.62,gripVar:0.025,yawDamp:3450}, // high-load flow; sand waits off-line
    atmo:{night:true,sun:false,skyTop:'#060a16',skyMid:'#0c1228',skyBot:'#1c2240',fog:[38,38,50]},
    // pools of floodlight over empty desert; one grand main straight complex
    scenery:{floodlights:65,treeDens:0.05,treeNear:26,treeSpread:50,treeH:5,treeHVar:2,treeW:1.5,
      stands:[250,700]}},               // the main-straight grandstands
};
