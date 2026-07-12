// Madring, Madrid - 5.474 km, 22 corners. New for 2026: a hybrid
// street/purpose-built lap around the IFEMA fairgrounds and Valdebebas park.
// The signature is LA MONUMENTAL - a ~550 m banked bowl (24% gradient) that
// slings cars onto the ~1 km pit straight. Centerline built from the
// published 2026 layout (driven order from the S/F line); points are
// [x,y,elev] with the park sector climbing ~14 m above the fairground side.
// Key corners: the walled T1 stop, the park-sector climb, LA MONUMENTAL -
// the 24% banked bowl onto the pit straight.
// Elevation: ~14 m park climb plus the banking. DRS: 2 zones.
// Scenery: city - IFEMA fairground halls giving way to Valdebebas parkland.
const MAD_CTRL=[
  [260,560,8.4],[340,562,8.2],[420,564,8],   // S/F - the ~1 km main straight
  [470,566,8],[488,560,8],[494,546,8.4],     // T1 - heavy braking, urban walls
  [490,526,9],[494,510,9.4],                 // T2 (L kink)
  [500,494,9.8],[512,486,10.2],              // T3 (R)
  [534,480,10.6],[560,462,11.4],[576,452,11.8],// T4-T5 - the IFEMA esses
  [588,438,12.2],[586,422,12.6],             // T6 (L)
  [592,404,13],[604,396,13.4],               // T7 (R)
  [624,386,13.8],[644,380,14],[660,368,14.2],// T8 - opens into the park sector
  [668,348,15],[664,326,16],[672,304,17],    // T9-T10 - climbing esses
  [668,282,18],[656,266,18.6],[636,258,19.2],// T11 - the top hairpin-left
  [596,248,20],[552,242,21],[508,240,21.6],  // the crest run (DRS)
  [464,242,22],[420,248,22.4],               // T12 (kink)
  [388,254,22.6],[368,264,22.4],             // T13 - fast left, downhill begins
  [330,282,21],[296,300,19.5],               // the park descent
  [272,310,18.5],[252,306,17.8],             // T14 (R kink)
  [230,310,17],[212,320,16.2],               // run to the bowl
  [200,334,15.4],[196,348,14.8],             // T15 (L) - sets up the entry
  [188,368,14.2],[172,384,13.6],[152,392,13],// T16 - flick right, dropping in
  [128,398,12.4],[108,412,11.6],[96,432,10.8],// T17-T22 LA MONUMENTAL - the
  [92,456,10.2],[96,480,9.6],[108,502,9.2],  // 550 m banked bowl (24%), wide
  [128,520,8.8],[154,534,8.5],[184,546,8.3], // open throttle all the way
  [218,554,8.2],                             // around, onto the straight
];
const TRACKS={
  mad:{id:'mad',tag:'MAD',name:'MADRID',halfW:6.2,lap:5474,ctrl:MAD_CTRL,
    sf:[260,560],style:'flat',walled:false,traps:true,
    zonesS:[[2600,3050]],               // the crest run across the top
    zoneAnchors:[],paved:[],
    ground:[106,110,66],                // dry Castilian park grass
    pMod:{mu:1.63,ClA:3.35},            // banked-bowl grip approximated globally
    atmo:{skyTop:'#5f95cc',skyMid:'#c0cedb',skyBot:'#f2e8d2',fog:[204,204,196]}, // Madrid light
    // fairground blocks implied by stands; young park trees on the hill
    scenery:{treeDens:0.15,treeNear:22,treeSpread:55,treeH:4.5,treeHVar:3,
      stands:[300,1100,4900]}},         // main, IFEMA, La Monumental stands
};
