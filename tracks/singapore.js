// Singapore Marina Bay - 4.928 km, 19 corners, ANTI-clockwise, night race,
// 2023-revised layout. Centerline traced from the real circuit's GPS geometry
// (north = up, driven order from the S/F line), so the plan view matches the
// official track map. Narrow, walled street circuit; the identity is the night
// setting: floodlights, lit skyline, dark harbour water. Points are [x,y,elev].
const SGP_CTRL=[
  [1038,306,5],[1026,206,5],[1014,106,5], // S/F pit straight
  [1010,100,5],[1001,96,5],[984,98,5], // T1 Sheares
  [970,94,5],[947,80,5],[932,61,5],
  [918,60,5],[909,69,5],[902,84,5], // T2-3
  [899,138,5],[901,152,5],[933,237,5],
  [940,275,5],[940,314,5],
  [934,327,5],[923,334,5],[900,342,5], // T5 onto Raffles Blvd
  [816,337,5],[731,332,5],
  [646,327,5],[626,323,5],[596,312,5], // Raffles Boulevard (straight)
  [497,256,5],
  [399,199,5],[393,201,5],[387,211,5], // T7 Memorial
  [355,268,5],
  [323,326,5],[312,324,5],[248,257,5], // T8
  [220,238,5],[206,241,5],[192,254,5], // T9
  [148,333,5],[104,411,5],
  [60,490,5],[62,512,5],[67,521,5], // T10
  [93,542,5],[106,550,5],
  [128,557,5],[130,563,5],[123,588,5], // T11-12 Anderson Bridge
  [129,608,5],[160,640,5],[197,671,5],
  [203,684,5],
  [223,707,5],[236,706,5],[245,696,5], // T13 Fullerton hairpin
  [265,597,5.6],[284,498,7],[304,400,5.2],
  [316,361,5],[328,352,5],
  [344,351,5],[397,397,5],[450,444,5], // T14
  [468,452,5],[509,460,5],
  [608,465,5],[708,470,5], // 2023-rebuilt straight
  [807,476,5],[810,500,5],[815,514,5], // T16
  [829,525,5],[937,538,5],[1019,542,5],
  [1024,540,5],[1053,496,5],[1060,478,5], // T18-19 onto the pit straight
  [1049,392,5],
];
const TRACKS={
  sgp:{id:'sgp',tag:'SGP',name:'SINGAPORE',halfW:5.4,lap:4928,ctrl:SGP_CTRL,
    sf:[1038,306],style:'city',walled:true,traps:false,
    paved:[],
    ground:[24,27,36],                 // floodlit night: everything off-road falls dark
    atmo:{night:true,sun:false,skyTop:'#05091a',skyMid:'#0c1330',skyBot:'#1b2547',fog:[34,42,66]},
    scenery:{floodlights:75,waterCol:[10,28,52],windowCol:[255,214,130],
      palette:[[46,52,74],[38,44,62],[56,62,86],[42,50,70],[62,68,94],[36,42,60]]},
    pMod:{kerbAggr:1.25,mu:1.58}},     // bumpy, low-grip street surface
};
