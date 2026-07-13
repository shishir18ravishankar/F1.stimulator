// Circuit de Barcelona-Catalunya - 4.657 km, 14 corners (the 2023-onward
// layout, chicane removed), clockwise. F1's old test track: every corner
// type in one lap. Centerline traced from the real circuit's geometry
// (driven order from the S/F line), so the plan view matches the official
// track map. Points are [x,y,elev] with the real ~30 m profile: the climb
// through T3 to Repsol, the drop to the valley, the blind Campsa crest onto
// the downhill back straight, La Caixa, and the stadium section.
// Key corners: Elf (T1), the blind Campsa crest (T9), La Caixa (T10).
// Elevation: rolling (~30 m - climb to Repsol, drop to the valley). Active aero: automatic Straight/Corner Mode.
// Scenery: Catalan countryside - dry wooded hills north of Barcelona.
const BCN_CTRL=[
  [240,560,12],[320,562,12],[400,562,12],    // S/F - the 1.047 km main straight
  [470,562,13],[486,568,13.5],[494,580,14],  // T1 (R) - late-brake magnet
  [498,594,14.5],[510,602,15],               // T2 (L) flows on
  [536,610,15.5],[566,612,16],[592,604,17],  // T3 - the long, loaded right,
  [612,588,18],[626,566,19],[634,540,20],    // wrapping into the climb
  [648,500,21.5],[658,464,23],[662,432,24],  // the climb to Repsol
  [660,412,24.8],[648,398,25.6],[630,392,26],// T4 Repsol - the long, loaded
  [612,398,26],[604,412,25.6],[606,428,25],  // wrap over the top
  [604,440,24.2],[596,452,23.2],[582,458,22.2],// T5 Seat, downhill exit
  [548,462,19],[512,464,16],[476,462,14.5],  // the valley floor
  [448,460,14],                              // T6 (kink) - lowest point
  [424,454,15],[410,442,16.5],               // T7 - uphill, cambered
  [404,426,18.5],[406,412,20.5],             // T8 flick
  [402,396,22.5],[390,386,24.5],[372,382,25.5],// T9 Campsa - blind over the
  [310,384,22],[250,388,17],[196,392,13],    // crest, then the downhill back
  [166,396,12],[146,404,11.5],[138,418,11],  // straight into T10 La
  [142,432,11],[154,442,11],                 // Caixa - big braking, slow left
  [168,450,11.2],[178,460,11.5],             // T11 opens uphill
  [174,480,12],[166,494,12.4],[152,502,12.8],// T12 - the stadium section
  [136,510,13],[128,524,13.2],[132,540,13.4],// T13
  [142,554,13.4],[152,562,13.2],[166,566,13],// T14 - the final right that
  [184,564,12.6],                            // decides the whole main straight
];
const TRACKS={
  bcn:{id:'bcn',tag:'BCN',name:'BARCELONA-CATALUNYA',halfW:6.5,lap:4657,ctrl:BCN_CTRL,
    sf:[240,560],style:'flat',walled:false,traps:true,
    paved:[],
    ground:[112,118,64],                // sun-dried Catalan scrub
    pMod:{yawDamp:3400,ClA:3.40},       // aero benchmark track: stability + downforce
    atmo:{skyTop:'#6b9bd0',skyMid:'#c2d2dc',skyBot:'#f0e8d0',fog:[198,202,198]}, // Spanish haze
    // dry hills, scattered pines, the big T1 and stadium grandstands
    scenery:{treeDens:0.18,treeNear:24,treeSpread:60,treeH:5.5,treeHVar:4,
      stands:[350,1250,3900]}},         // main, T3, stadium stands
};
