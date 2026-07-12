// Baku City Circuit - 6.003 km, 20 corners, anticlockwise. The seafront
// boulevard, a grid of 90-degree government-district corners, and the
// medieval old-city CASTLE SECTION - 7.6 m wide, climbing along the fortress
// wall - before the ~2.2 km flat-out run back along the Caspian. Centerline
// traced from the real circuit's geometry (north = up, driven order from the
// S/F line), so the plan view matches the official track map. Points are
// [x,y,elev]; the old town sits ~22 m above the boulevard.
// Key corners: the 90-degree T1, the castle squeeze (T8-T12), downhill T15.
// Elevation: old town ~22 m above the flat seafront boulevard. DRS: 2 zones.
// Scenery: city seaside - Caspian promenade, medieval fortress walls, towers.
const BAK_CTRL=[
  [600,562,2],[700,564,2],[790,566,2],       // S/F on Neftchilar Avenue
  [840,566,2],[856,558,2],[860,542,2],       // T1 - 90 degrees, hard braking
  [858,500,3],[856,458,4],                   // between the walls
  [854,434,4.5],[846,420,5],[830,414,5.5],   // T2 - 90 degrees
  [790,410,6],[750,408,6.5],
  [726,404,7],[718,392,7.5],                 // T3 - 90 degrees
  [716,360,8.5],[714,330,9.5],
  [712,308,10.5],[700,296,11],[684,292,11.5],// T4 - 90 degrees
  [640,290,12.5],[600,288,13.5],
  [572,284,14.5],[556,276,15.2],             // T5 - government house kink
  [532,268,16],[512,268,16.6],               // T6
  [492,262,17.2],[482,250,17.8],             // T7 - up toward the old city
  [478,232,18.5],
  [476,214,19.2],[466,204,19.8],[450,202,20.3],// T8 - THE CASTLE: 7.6 m wide,
  [428,200,21],[406,202,21.6],               // squeezed against the fortress
  [388,206,22.2],[378,216,22.6],[366,222,23],// T9-T10 - the wall kinks
  [350,224,23.4],
  [332,226,23.6],[320,234,23.8],             // T11 - top of the old town
  [306,244,23.6],[290,248,23.2],             // T12 - starting back down
  [268,250,22.6],
  [248,254,22],[236,264,21.2],               // T13 - the plunge begins
  [222,280,20.2],
  [212,296,19.2],[208,314,18.2],             // T14 - downhill kink
  [204,350,16.4],[200,386,14.6],             // the descent
  [196,412,13.2],[198,436,12],               // T15 - still falling
  [200,470,10],
  [204,500,7],[212,524,5],[228,544,3.6],     // T16 - opens onto the seafront:
  [252,556,2.8],[280,560,2.4],               // from here it's ~2.2 km flat-out
  [360,560,2.2],[440,560,2.1],[520,561,2],   // along the Caspian (DRS)
];
const TRACKS={
  bak:{id:'bak',tag:'BAK',name:'BAKU',halfW:5.6,lap:6003,ctrl:BAK_CTRL,
    sf:[600,562],style:'city',walled:true,traps:false,
    zonesS:[],                          // both DRS zones live on the 2.2 km run
    zoneAnchors:[],paved:[],            // (covered by the wrap-around zone)
    ground:[120,116,106],               // old-city stone and plazas
    pMod:{CdA:1.40,ClA:2.80,mu:1.57,steerMax:0.37,kerbAggr:1.1}, // skinny wings + castle agility
    atmo:{skyTop:'#6f9cc8',skyMid:'#c2d0da',skyBot:'#eee8da',fog:[198,200,198]}, // Caspian haze
    scenery:{waterCol:[44,74,52],       // the Governor's Garden park infield
      windowCol:[96,100,108],
      palette:[[206,188,152],[192,172,136],[214,198,166],[184,168,138],[200,184,150],[176,162,132]]},
  },
};
