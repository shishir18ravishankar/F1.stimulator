// Hungaroring - 4.381 km, 14 corners, clockwise. "Monaco without the walls":
// a twisty, dusty ribbon folded into a natural valley amphitheatre outside
// Budapest - the pits sit on the ridge, the whole middle sector works the
// valley floor, and you can see most of the lap from any grandstand.
// Centerline traced from the real circuit's geometry (driven order from the
// S/F line), so the plan view matches the official track map. Points are
// [x,y,elev]. Two DRS zones; overtaking is famously hard - qualifying matters.
// Key corners: the wide downhill T1, the blind T4 crest, the T6-T7 chicane.
// Elevation: hilly valley amphitheatre (~35 m). DRS: 2 zones.
// Scenery: rural hills outside Budapest - dusty farmland, packed grass banks.
const HUN_CTRL=[
  [200,200,20],[300,196,20],[400,192,20],    // S/F on the ridge (908 m straight)
  [450,192,19],[470,200,18],[478,214,17],    // T1 - wide, downhill, the one
  [474,232,15.5],                            // real overtaking chance
  [472,248,14],[478,262,13],[492,270,12.5],  // T2 - long left, still dropping
  [510,276,12],
  [530,284,12],[544,296,12.2],               // T3 - right, valley floor
  [552,314,12.6],[550,332,12.2],[540,346,11.4],// T4 - fast left over a blind
  [524,356,10.6],[504,360,10],[486,356,9.6], // crest; T5 - long right,
  [462,348,9.2],                             // rhythm section begins
  [440,344,9],[428,350,8.9],[424,362,8.8],   // T6-T7 chicane - kerb ride
  [430,374,8.8],
  [444,384,8.9],[456,392,9],[460,404,9.1],   // T8 - left flick
  [456,418,9.3],[444,426,9.5],               // T9 - right
  [420,430,9.8],[390,434,10.2],[360,436,10.6],// T10 - the valley-floor run
  [330,434,11],[308,426,11.5],[294,412,12],  // T11 - fast left, loading up
  [282,394,12.6],
  [272,378,13.4],[268,360,14],               // T12 - climbing out
  [266,336,15],[262,310,16],                 // the climb back to the ridge
  [256,290,17],[244,280,17.5],[228,278,18],  // T13 - slow left, tightens
  [210,282,18.5],
  [194,278,19],[184,264,19.4],[182,246,19.7],// T14 - the long final right
  [190,228,20],[200,214,20],                 // that wraps onto the straight
];
const TRACKS={
  hun:{id:'hun',tag:'HUN',name:'HUNGARORING',halfW:6.0,lap:4381,ctrl:HUN_CTRL,
    sf:[200,200],style:'flat',walled:false,traps:true,
    zonesS:[[2700,3080]],               // the run out of the valley (zone 2 of 2)
    zoneAnchors:[],paved:[],
    ground:[98,124,60],                 // sun-dried Hungarian summer grass
    pMod:{ClA:3.50,steerMax:0.36,mu:1.56,gripVar:0.02}, // max downforce, dusty low-grip surface
    atmo:{skyTop:'#6f9cca',skyMid:'#c4d2da',skyBot:'#eee8d2',fog:[202,204,198]}, // August heat haze
    // open amphitheatre: low scrub, big banks of grandstands overlooking it all
    scenery:{treeDens:0.22,treeNear:26,treeSpread:60,treeH:5,treeHVar:4,
      stands:[350,900,2450,3600]}},     // ridge, T1, valley, T13 stands
};
