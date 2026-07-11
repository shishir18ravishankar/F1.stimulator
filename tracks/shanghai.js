// Shanghai International Circuit - 5.451 km, 16 corners, clockwise. Built on
// reclaimed marshland; the layout mimics the Chinese character "shang" (上).
// Centerline traced from the real circuit's geometry (north = up, driven order
// from the S/F line), so the plan view matches the official track map. Points
// are [x,y,elev]. The signatures: the T1-T3 "snail" (a climbing right spiral
// that tightens and then unwinds downhill), the mirror-image T11-T13 carousel
// opening onto the 1.17 km back straight - the longest in F1 - and the T14
// hairpin. Mostly flat (~8 m of camber-driven change around the snail).
const SHA_CTRL=[
  [168,560,4],[168,505,4.6],[168,450,5.2],   // S/F pit straight heading north
  [170,420,6.0],
  [176,390,7.0],[190,364,8.2],[212,346,9.2], // T1 the snail: right spiral, climbing,
  [238,338,9.8],[264,340,9.8],[286,352,9.4], // ~270 degrees, tightening all the way
  [300,370,8.6],[306,392,7.6],[304,412,6.6],
  [296,428,5.6],[282,438,4.8],[266,442,4.2], // T2 over the crest, radius shrinking
  [252,438,3.6],[244,430,3.2],
  [234,428,2.6],[226,432,2.3],[222,442,2.1], // T3 unwinds left, downhill
  [224,454,1.9],[232,462,1.7],[246,466,1.5], // T4 (L) opens under the bowl, heading east
  [310,472,1.2],[368,476,0.9],
  [400,480,0.8],[418,488,0.7],[430,500,0.6], // T5 (R) dips southeast
  [446,518,0.5],
  [456,528,0.5],[458,542,0.5],[448,552,0.5], // T6 (R, heavy braking) hooks back west
  [432,556,0.5],
  [410,560,0.6],[394,570,0.7],[390,586,0.8], // T7 (L) the long esses begin
  [398,600,0.9],[416,610,1.0],[440,612,1.1], // T8 (L) swings back east
  [470,608,1.2],[486,600,1.3],               // T9 (R, kink)
  [504,594,1.4],[524,594,1.5],               // T10 (L)
  [560,584,1.7],[592,568,2.0],[616,550,2.3], // climbing run to the carousel
  [628,534,2.5],[632,518,2.6],               // T11 (L) turns in
  [636,490,2.9],[648,464,3.2],[670,446,3.5], // T12-T13 carousel: long right,
  [698,440,3.7],[726,446,3.8],[748,462,3.9], // double apex, mirror of the snail,
  [760,486,4.0],[764,510,4.0],               // opening onto the back straight
  [764,600,3.4],[764,690,2.6],[764,780,1.8], // 1.17 km back straight (DRS),
  [762,870,1.0],                             // the longest in F1
  [758,892,0.7],[746,904,0.5],[728,906,0.4], // T14 hairpin (R), the overtaking spot
  [714,898,0.3],
  [682,884,0.3],[652,874,0.3],               // short chute
  [632,870,0.3],[616,872,0.3],               // T15 (L, kink)
  [552,878,0.4],[472,882,0.5],[392,884,0.5], // run along the south side
  [332,882,0.5],[292,878,0.6],               // T16: the long right that wraps
  [252,868,0.8],[220,850,1.2],[196,826,1.6], // onto the pit straight
  [178,796,2.0],[168,756,2.4],[162,700,3.0],
];
const TRACKS={
  sha:{id:'sha',tag:'SHA',name:'SHANGHAI',halfW:6.8,lap:5451,ctrl:SHA_CTRL,
    sf:[168,560],style:'flat',walled:false,traps:true,
    zonesS:[[2900,3580]],               // the 1.17 km back straight into T14
    zoneAnchors:[],paved:[],
    ground:[96,116,62],                 // reclaimed marshland scrub
    pMod:{mu:1.58,yawDamp:3350},        // long-radius corners reward stability
    atmo:{skyTop:'#7d9cbe',skyMid:'#c0ccd6',skyBot:'#e8e6dc',fog:[196,198,200]}, // Jiading haze
    // flat marshland: poplar windbreak rows, giant wing-roof grandstands
    scenery:{treeDens:0.15,treeNear:26,treeSpread:60,treeH:6,treeHVar:4,
      stands:[250,1000,4250,5300]}},    // main + snail + hairpin stands
};
