// Albert Park, Melbourne - 5.278 km, 14 corners, clockwise around Albert Park
// Lake. Centerline traced from the real circuit's geometry (north = up, driven
// order from the S/F line on Aughtie Drive), so the plan view matches the
// official track map. Points are [x,y,elev]; the parkland is nearly flat
// (~2.5 m range). 2022-revised layout: the old T9-T10 chicane is gone, the
// lap flows through the fast T9-T10 Lakeside chicane and the wide-open T11-T12.
// The lake sits inside the loop; 4 DRS zones - the most of any circuit.
// Key corners: Jones (T1), Brabham (T2), the Lakeside chicane (T9-T10).
// Elevation: flat lakeside parkland (~2.5 m range). DRS: 4 zones - the most in F1.
// Scenery: parkland - mature trees around the lake, city skyline beyond.
const MEL_CTRL=[
  [150,330,2.5],[178,416,2.7],[206,502,2.9], // S/F, Aughtie Drive heading SE
  [222,522,3.0],
  [230,540,3.0],[226,554,3.0],[214,560,3.0], // T1 Jones (R, heavy braking)
  [198,562,2.9],[188,574,2.8],               // T2 Brabham (L, sweeps back)
  [204,608,2.7],[248,644,2.5],[306,676,2.3], // run along Albert Road (DRS)
  [364,704,2.1],[398,716,2.0],
  [416,718,2.0],[426,710,2.0],[426,698,2.0], // T3 Sports Centre (R, prime overtaking)
  [414,676,2.1],[410,660,2.2],
  [416,648,2.3],[430,644,2.3],               // T4 (L)
  [480,650,2.2],[528,654,2.1],               // toward the lake's south shore
  [558,652,2.0],[580,640,2.0],               // T5 (R, fast kink)
  [608,612,2.0],[638,582,2.1],
  [656,560,2.2],[662,540,2.3],               // T6 (R, fast) turning north
  [662,504,2.4],[660,468,2.4],               // up the east side
  [652,444,2.4],[636,430,2.4],               // T7 (L) onto Lakeside Drive
  [578,388,2.4],[520,348,2.4],[462,308,2.4], // Lakeside Drive along the water (DRS)
  [420,278,2.4],[396,256,2.4],
  [382,236,2.4],[378,218,2.4],               // T9 (R, fast, sixth-gear)
  [368,202,2.4],[352,196,2.4],               // T10 (L) the Lakeside chicane
  [302,200,2.5],[260,208,2.6],               // run to T11 (DRS)
  [230,216,2.6],[208,228,2.6],               // T11 (L, fast, wide open)
  [196,244,2.6],[192,260,2.6],               // T12 (R) heading south
  [188,282,2.6],[178,292,2.6],               // T13 (R, tight, last real braking)
  [162,296,2.6],[148,294,2.5],
  [138,298,2.5],[132,308,2.5],               // T14 (L) onto the pit straight
  [138,320,2.5],
];
const TRACKS={
  mel:{id:'mel',tag:'MEL',name:'MELBOURNE',halfW:6.4,lap:5278,ctrl:MEL_CTRL,
    sf:[150,330],style:'park',walled:false,traps:true,
    zonesS:[[1000,1600],[3230,4130],[4420,4750]], // T2-T3 run, Lakeside Dr, T10-T11 run
    zoneAnchors:[],paved:[],
    ground:[70,110,58],                 // parkland green
    pMod:{mu:1.60,ClA:3.35},            // smooth resurfaced parkland, medium-high downforce
    atmo:{skyTop:'#6f9fd0',skyMid:'#bcd2e2',skyBot:'#e9eef0',fog:[190,200,204]},
    // Albert Park: mature parkland trees around the lake, big temporary stands
    scenery:{treeDens:0.5,treeNear:18,treeSpread:55,treeH:7,treeHVar:5,
      stands:[350,1550,4600]}},         // T1, T3, T11 grandstands
};
