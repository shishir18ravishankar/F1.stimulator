// Spa-Francorchamps - 7.004 km, the longest lap on the calendar, clockwise.
// Centerline traced from the real circuit's GPS geometry (north = up, driven
// order, starting at the S/F line before La Source), so the plan view matches
// the official track map. Points are [x,y,elev]; the elevation profile keeps
// the real drama: down to Eau Rouge, the Raidillon/Kemmel climb to Les Combes
// (~103 m), the long descent to Stavelot (~12 m) and the Blanchimont climb.
const SPA_CTRL=[
  [246,166,42],[219,118,41.6],[191,70,41.1], // S/F
  [191,66,41.1],[193,62,41],
  [198,60,41],[266,92,38.3],[287,105,37], // T1 La Source
  [329,138,34.1],
  [379,196,34.2],[428,255,45.6],[463,278,50.3], // T2-4 Eau Rouge/Raidillon (compression, then the climb)
  [470,286,51.5],[481,307,54.1],
  [491,351,58.5],[527,410,65.1],[563,469,71.8], // crest
  [575,496,74.7],
  [598,574,81.1],[620,651,87.4],[642,729,93.7], // Kemmel Straight (straight)
  [665,806,100],[677,856,102.3],[676,863,102.6],
  [672,869,103],[654,883,101],[648,895,99.7], // T5-6 Les Combes (highest point)
  [659,949,94.8],[657,964,93.4],
  [652,971,92.5],[590,1014,84],[529,1057,75.2], // T7 Malmedy
  [522,1060,74.3],[507,1058,72.5],[501,1053,71.6],
  [494,1040,69.9],[496,1026,68.3],[506,1015,66.5], // T8 Rivage
  [557,983,59.6],
  [565,972,58],[566,957,56.7],[552,914,52.9], // T9
  [538,871,49.1],[527,806,43.7],[515,741,39.2],
  [511,733,38.5],[499,719,37.3],
  [482,710,36],[442,707,33.6],[430,708,32.9], // T10 Pouhon
  [409,716,31.5],[400,722,30.9],[390,731,30.1],
  [377,754,29.6],[347,827,28.3],
  [317,899,27],[301,911,26.3],[284,914,25.7], // T11 Campus
  [276,912,25.4],[249,898,24.3],
  [240,896,23.9],[222,900,23],[214,905,22.5], // T12 Fagnes
  [204,919,21.6],[181,956,19.3],[157,993,17],
  [152,997,16.7],
  [140,1002,16],[125,998,15.6],[75,961,14], // T13-14 Stavelot
  [62,941,13.4],[60,924,12.9],[61,913,12.7], // T15 Paul Frere (lowest point ahead)
  [75,876,12.4],[98,839,12.2],[147,789,12],
  [165,775,12.9],[212,750,15.2],[259,725,17.4],
  [291,700,19.1],[307,679,20.3],[318,659,21.5],
  [349,588,25.9],
  [352,565,27.1],[350,553,27.8],[330,502,29.4], // T16-17 Blanchimont
  [310,450,30.9],[303,417,31.9],[299,386,32.4],
  [296,315,33.6],[302,311,33.7],
  [321,311,34],[325,304,34.4],[286,235,37.8], // T18-19 Bus Stop
];
const TRACKS={
  spa:{id:'spa',tag:'SPA',name:'SPA-FRANCORCHAMPS',halfW:6.0,lap:7004,ctrl:SPA_CTRL,
    sf:[246,166],style:'forest',walled:false,traps:true,
    paved:[],
    ground:[42,84,40],
    pMod:{gripVar:0.035},               // forest track: subtle patchy grip
    atmo:{fog:[172,184,190],skyTop:'#7595bc',skyMid:'#b1c4d4',skyBot:'#dbe4e8'}, // Ardennes haze
    // dense Ardennes forest walls of tall conifers close to the road
    scenery:{treeDens:0.8,treeNear:14,treeSpread:55,treeH:9,treeHVar:7}},
};
