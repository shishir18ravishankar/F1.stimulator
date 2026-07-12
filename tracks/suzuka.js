// Suzuka - 5.807 km, 18 corners, the only figure-8 on the calendar: the back
// straight bridges OVER the road between Degner 2 and the hairpin. Centerline
// traced from the real circuit's geometry (north = up, driven order from the
// S/F line), so the plan view matches the official track map. Points are
// [x,y,elev] with the real ~40 m profile: down to T1-T2, the long climb
// through the Esses to Dunlop, down through Degner to the low hairpin road,
// then the back straight rising to cross the bridge before 130R.
// Key corners: the Esses (T3-T7), Degner (T8-T9), Spoon (T13-T14), 130R (T15).
// Elevation: hilly (~40 m, figure-8 bridge crossover). DRS: 1 zone only.
// Scenery: forested hills, with the Motopia amusement-park Ferris wheel.
const SUZ_CTRL=[
  [470,544,10.5],[380,554,10.2],[300,564,10.0], // S/F pit straight heading west
  [250,572,9.0],
  [222,576,8.0],[200,570,7.0],[188,554,6.4],  // T1 First Curve (double apex,
  [186,532,6.2],                              // T2, the lowest point)
  [196,508,8.0],[212,494,10.0],[214,478,12.0],// T3-T6 the Esses: the classic
  [230,466,14.0],[234,450,16.0],[250,438,18.0],// uphill left-right rhythm section
  [254,422,20.0],[270,410,22.0],[274,394,24.0],
  [290,382,26.0],
  [288,362,28.0],[292,344,29.5],[304,330,30.0],// T7 Dunlop (long, over the crest)
  [320,322,30.0],
  [340,316,29.0],[352,308,28.0],[356,298,27.0],// T8 Degner 1 (fast flick)
  [362,290,26.0],[372,292,25.0],              // T9 Degner 2 (tight, walls close)
  [400,290,23.0],[430,287,21.5],              // UNDER the crossover bridge
  [470,282,20.5],[520,272,19.5],[570,258,18.5],// low road rising to the hairpin
  [610,246,18.2],
  [634,238,18.0],[650,230,18.0],[660,218,18.0],// T11 Hairpin - 45 km/h, the
  [656,204,18.0],[642,196,18.2],[624,198,18.4],// slowest point on the lap
  [612,208,18.6],
  [580,222,19.0],[540,232,19.4],[490,240,19.8],// T12 the long sweep back west,
  [440,245,20.2],[380,248,20.6],[320,250,21.0],// drifting downhill of the ridge
  [270,252,21.4],
  [210,254,21.8],[192,262,22.0],[180,276,22.2],// T13-T14 Spoon: double left,
  [178,292,22.4],[188,306,22.6],[204,312,22.8],// westernmost point of the lap
  [230,304,23.2],
  [300,296,24.2],[370,288,25.2],[440,281,26.2],// back straight (~1.2 km), rising
  [510,272,26.8],[560,266,27.0],              // OVER the bridge (crossover)
  [600,268,26.6],[628,282,26.0],[644,302,25.2],// T15 130R - legendary flat-out left
  [656,340,23.2],[662,380,20.8],[664,420,17.6],// downhill run to the chicane
  [662,448,15.4],
  [658,464,14.2],[646,470,13.6],[638,478,13.2],// T16-T17 Casio Triangle chicane
  [640,492,12.6],
  [636,506,12.2],[622,518,11.8],[598,526,11.4],// T18 the final right, onto the pits
  [560,532,11.0],
];
const TRACKS={
  suz:{id:'suz',tag:'SUZ',name:'SUZUKA',halfW:6.0,lap:5807,ctrl:SUZ_CTRL,
    sf:[470,544],style:'flat',walled:false,traps:true,
    zonesS:[],                          // one DRS zone only: the main straight
    zoneAnchors:[],paved:[],
    ground:[76,118,60],                 // Mie-prefecture countryside green
    pMod:{ClA:3.55,mu:1.60,yawDamp:3400}, // high-downforce, flowing, rhythm rewards commitment
    atmo:{skyTop:'#6f9fd0',skyMid:'#bad0e2',skyBot:'#eaeef0',fog:[186,196,202]},
    // wooded hills all around; the amusement-park Ferris wheel by the pits
    scenery:{treeDens:0.4,treeNear:20,treeSpread:60,treeH:7,treeHVar:5,
      stands:[900,3050,5450],           // Esses, hairpin, chicane stands
      tower:[520,600,42]}},             // the Ferris wheel landmark by the gate
};
