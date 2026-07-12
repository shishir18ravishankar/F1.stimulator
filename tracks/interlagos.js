// Autodromo Jose Carlos Pace, Interlagos - 4.309 km, 15 corners,
// anticlockwise, in a natural amphitheatre above the Guarapiranga lakes.
// Centerline traced from the real circuit's geometry (north = up, driven
// order from the S/F line), so the plan view matches the official track map.
// Points are [x,y,elev] with the real ~30 m bowl: the ridge-top S/F arc, the
// downhill-compressing SENNA S, Curva do Sol onto the descending Reta Oposta,
// the low infield by the lake, and the long flat-out Subida dos Boxes climb
// from Juncao all the way home. Rain circuit, kerb circuit, drama circuit.
// Key corners: the Senna S (T1-T2), Curva do Sol (T3), Juncao (T12) onto the
// Subida dos Boxes climb. Elevation: hilly (~30 m natural bowl). DRS: 2 zones.
// Scenery: Sao Paulo suburbs above the Guarapiranga lakes - a city grandstand.
const INT_CTRL=[
  [520,204,38.2],[470,198,39],[400,196,40],  // S/F - the curved Tribunas arc
  [330,198,39.5],
  [292,202,38.5],[274,210,36],[268,224,33],  // T1-T2 SENNA S - blind entry,
  [274,238,30.5],[288,246,28.5],             // downhill, compresses on exit
  [296,262,26],[308,276,24.5],[324,286,23.5],// T3 Curva do Sol - long left
  [344,292,22.5],                            // opening onto the back straight
  [400,304,18],[456,316,14],[510,328,11],    // Reta Oposta, downhill (DRS)
  [538,334,10],[550,344,9.6],[552,358,9.3],  // T4 Descida do Lago - down to
  [548,380,9],                               // the lake plateau
  [542,398,9],[530,410,9.2],[512,414,9.5],   // T5 Ferradura - the horseshoe
  [490,416,9.7],[474,422,9.9],               // T6 (kink)
  [458,430,10],[452,444,10.2],               // T7 Pinheirinho
  [456,458,10.4],[450,470,10.5],[436,474,10.6],// T8 Bico de Pato - the
  [412,480,10.4],[392,488,10.2],             // duck's bill; T9 Mergulho
  [376,496,9.8],[372,508,9.4],[380,518,9],   // T10 JUNCAO - get it right or
  [404,522,9],[440,518,9.5],[478,508,10.5],  // lose the whole climb: Subida
  [510,492,12],[536,470,14.5],[554,444,17.5],// dos Boxes, flat-out, rising
  [566,414,21],[574,382,24.5],[578,350,28],  // ~30 m behind the pits (DRS)
  [578,318,31],[574,286,33.5],[566,258,35.5],
  [548,228,37.5],[536,212,38],               // over the crest onto the arc
];
const TRACKS={
  intl:{id:'intl',tag:'INT',name:'INTERLAGOS',halfW:6.0,lap:4309,ctrl:INT_CTRL,
    sf:[520,204],style:'flat',walled:false,traps:true,
    zonesS:[[1180,1700]],               // Reta Oposta
    zoneAnchors:[],paved:[],
    ground:[66,112,52],                 // lush subtropical green
    pMod:{mu:1.60,kerbAggr:1.2,ClA:3.30,rho:1.09}, // bumpy old surface; 800 m altitude
    atmo:{skyTop:'#6795c4',skyMid:'#bccedc',skyBot:'#e6e8dc',fog:[192,200,200]}, // humid Sao Paulo sky
    // the amphitheatre: banked lawns of fans, trees toward the lakes
    scenery:{treeDens:0.35,treeNear:20,treeSpread:55,treeH:7,treeHVar:5,
      stands:[150,600,3050]}},          // Tribunas, Senna S, Juncao stands
};
