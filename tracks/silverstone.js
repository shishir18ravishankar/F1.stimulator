// Silverstone GP - 5.891 km, 18 corners, clockwise, nearly flat (~10 m range).
// Centerline traced from the real circuit's GPS geometry (north = up, driven
// order, starting at the Hamilton-straight S/F line), so the plan view matches
// the official track map. Points are [x,y,elev]; elevations in meters, subtle:
// the airfield plateau peaks through Maggotts-Becketts and dips at Vale.
const SIL_CTRL=[
  [65,791,24],[121,717,24],[177,644,24], // S/F on the Hamilton straight
  [233,570,24],
  [249,556,24],[273,553,24], // T1 Abbey
  [354,562,24],[384,556,23.6],[396,549,23.3], // T2 Farm
  [438,516,22.5],[479,483,22],[491,476,22],
  [498,476,22],
  [503,477,22],[511,487,22],[525,536,22], // T3 Village
  [535,547,22],[542,548,22],[550,544,22], // T4 The Loop
  [554,538,22],[572,488,21.8],
  [574,447,21.7],[564,433,21.6], // T5 Aintree
  [495,370,21.2],[425,307,20.8],[356,245,20.3], // Wellington Straight (DRS)
  [287,182,20],[277,177,20],[265,175,20],
  [252,177,20],
  [238,183,20],[230,198,20.1],[222,251,20.7], // T6 Brooklands
  [215,259,20.8],[194,265,21],[182,262,21], // T7 Luffield
  [174,256,21],
  [165,242,21.2],[166,224,21.5],[207,140,22.2], // T8 Woodcote
  [244,102,22.4],[257,94,22.4],[287,82,22.6], // National straight
  [366,75,22.8],[446,67,23.3],[525,60,23.9],
  [544,61,24],[559,66,24.2],[569,73,24.4], // T9 Copse
  [580,86,24.7],[588,101,25],[610,185,26.4],
  [617,243,27.2],[620,302,27.9],[623,361,27.4],
  [649,415,26.7],[646,437,26.3],[628,486,25.3], // T10-11 Maggotts
  [626,505,24.9],
  [629,519,24.8],[654,557,24.5],[658,568,24.4], // T12-13 Becketts
  [659,582,24.2],
  [656,595,24.1],[645,608,24],[596,639,23.5], // T14 Chapel
  [585,649,23.4],
  [543,726,22.7],[501,804,21.9],[459,881,21.2], // Hangar Straight (DRS)
  [417,958,20.5],[373,1026,19.7],[361,1042,19.4],
  [340,1057,18.9],[328,1060,18.7],[316,1059,18.6], // T15 Stowe
  [294,1052,18.2],[285,1044,18],[277,1033,18],
  [249,980,18.6],[235,961,19.1],[194,914,19.9],
  [153,867,20.7],
  [143,863,20.8],[119,882,21.3],[113,884,21.4], // T16 Vale
  [102,881,21.5],[86,867,21.8],[77,854,22.1],
  [65,826,22.5],
  [60,804,22.8], // T17-18 Club
];
const TRACKS={
  sil:{id:'sil',tag:'SIL',name:'SILVERSTONE',halfW:7.0,lap:5891,ctrl:SIL_CTRL,
    sf:[65,791],style:'flat',walled:false,traps:true,
    zonesS:[[1400,1950],[4330,4850]],   // Wellington + Hangar straights
    zoneAnchors:[],paved:[],
    ground:[88,126,64],
    pMod:{ClA:3.45,yawDamp:3600},       // planted at high speed through Maggotts-Becketts
    // open, grassy, flat English countryside: sparse low trees, big stands
    scenery:{treeDens:0.06,treeNear:30,treeSpread:70,treeH:4.5,treeHVar:3.5,
      stands:[2230,3150,3950,5000]}},   // Luffield, Copse, Becketts, Stowe
};
