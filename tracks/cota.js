// Circuit of the Americas - 5.513 km, 20 corners, COUNTER-clockwise.
// Centerline traced from the real circuit's GPS geometry (north = up, driven
// order from the S/F line), so the plan view matches the official track map.
// Points are [x,y,elev]: the ~33 m climb to the blind T1 hairpin, downhill
// esses, the T11 hairpin into the ~1.1 km back straight, the stadium section
// and the T16-18 triple apex. Landmark: the observation tower.
const COTA_CTRL=[
  [261,528,2],[306,564,11.9],[351,600,21.7], // S/F, climbing from the grid
  [395,629,30.8],
  [408,633,33],[413,628,32.5],[414,622,32], // T1 The Tower (blind hairpin on the crest)
  [399,577,28.4],[384,532,24.7],[384,517,23.5],
  [388,500,22.2],
  [404,477,20],[449,449,18.5],[495,420,17], // T2 downhill
  [507,405,16.5],[517,378,15.6],[526,367,15.2],
  [565,346,14],[571,336,13.9],[580,295,13.5], // T3-6 esses
  [587,284,13.3],[598,273,13.2],[622,259,12.9],
  [641,257,12.7],[706,286,12.1],[711,286,12],
  [737,268,11.1],[761,239,10.1],[779,231,9.5],
  [786,231,9.3],[800,236,8.9],[813,254,8.3],
  [822,260,8],[873,248,7.1],[925,237,6.3], // T7-9
  [932,232,6.1],
  [972,183,5.1],[1012,134,4.6],[1052,85,4.2], // T10
  [1060,71,4],
  [1060,64,4],[1055,61,3.9],[1048,60,3.8], // T11 hairpin (furthest point)
  [961,86,2.3],[874,113,0.9],
  [798,131,0.6],[752,140,0.4],[706,150,0.2], // ~1.1 km back straight
  [651,158,0.1],[596,167,0.3],[509,177,0.6],
  [422,187,1],
  [419,194,1],[467,257,1.6],[483,282,1.9], // T12
  [483,292,2],[473,299,2],[438,298,2.3], // T13-15 stadium section
  [430,291,2.3],[415,259,2.6],[393,237,2.8],
  [368,233,3],[362,235,3],[359,241,3.1],
  [360,245,3.2],[385,290,4.1],
  [411,335,5],[412,350,5.2],[405,373,5.7], // T16-18 triple-apex right
  [396,390,6],[353,412,5.4],[341,414,5.3],
  [320,411,5],[299,404,4.7],[282,393,4.5],
  [244,338,3.7],[218,305,3.2],
  [205,299,3],[179,306,2.7],[125,330,1.9], // T19
  [70,354,1.2],[64,358,1.1],
  [60,366,1],[67,375,1],[131,426,0.7], // T20 onto the pit straight
  [196,477,0.9],
];
const TRACKS={
  cota:{id:'cota',tag:'COTA',name:'CIRCUIT OF THE AMERICAS',halfW:6.5,lap:5513,ctrl:COTA_CTRL,
    sf:[261,528],style:'flat',walled:false,traps:true,
    paved:[],
    ground:[112,114,60],               // sun-dried Texas grass
    atmo:{skyTop:'#6f9fd6',skyMid:'#c2d2de',skyBot:'#f0e6cf'},
    scenery:{treeDens:0.10,treeNear:28,treeSpread:65,treeH:4,treeHVar:3,
      stands:[500,3700,4300],
      tower:[330,300,68]}},            // observation tower by the stadium section
};
