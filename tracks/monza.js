// Monza - 5.793 km, 11 corners, clockwise, flat-out ~82% of the lap. "Temple
// of Speed". Centerline traced from the real circuit's GPS geometry (north =
// up, driven order from the S/F line), so the plan view matches the official
// track map: Rettifilo, Curva Grande, Roggia, the Lesmos, Serraglio, Ascari,
// the back straight and Parabolica. Points are [x,y,elev], nearly flat.
const MZA_CTRL=[
  [78,695,20],[85,625,20],[91,555,20], // S/F main straight (DRS)
  [97,485,20],[103,415,20],
  [106,409,20],[119,409,20],[123,403,20], // T1-2 Variante del Rettifilo
  [110,343,20],[112,302,20],[115,261,20],
  [118,242,20],
  [126,222,20],[145,191,20.1],[155,181,20.2], // T3 Curva Grande
  [178,162,20.3],[206,148,20.4],[237,138,20.5],
  [291,133,20.7],[346,127,20.9],[394,124,21],
  [441,121,21],[446,117,21],
  [452,102,21],[481,96,21],[532,79,21], // T4-5 Variante della Roggia
  [583,62,21],[590,60,21],
  [604,61,21],[617,69,21],[625,79,21], // T6 Lesmo 1
  [629,91,21],[634,145,21.4],[639,198,22],
  [636,212,22],[569,249,22],[502,287,21.6], // T7 Lesmo 2
  [473,305,21.3],[439,334,21],[405,363,20.7],
  [354,408,20.2],[304,452,20],[254,497,19.8], // Serraglio kink
  [246,507,19.7],[247,539,19.5],[245,549,19.5], // T8-10 Variante Ascari
  [238,562,19.4],[218,581,19.2],[214,594,19.1],
  [206,666,19],[198,739,19],
  [190,812,19],[183,885,19],[175,958,19], // back straight (DRS)
  [167,1030,19],
  [163,1042,19],[158,1047,19],[147,1056,19], // T11 Parabolica/Alboreto
  [132,1060,19],[118,1058,19],[103,1052,19],
  [91,1043,19],[78,1028,19],[70,1011,19],
  [64,990,19],[61,968,19.1],[61,919,19.3],
  [60,870,19.6],[66,811,19.9],[72,753,20],
];
const TRACKS={
  mza:{id:'mza',tag:'MZA',name:'MONZA',halfW:6.0,lap:5793,ctrl:MZA_CTRL,
    sf:[78,695],style:'park',walled:false,traps:true,
    zonesS:[[3890,4780]],              // back straight into Parabolica (+auto main straight)
    zoneAnchors:[],paved:[],
    ground:[76,112,58],
    // Parco di Monza: tall thin pines, tifosi-red stands, old banking backdrop
    scenery:{treeDens:0.45,treeNear:18,treeSpread:50,treeH:11,treeHVar:6,treeW:1.8,
      stands:[150,5600],
      banking:[450,450,120]}, // old high-speed oval ruins in the infield park
    pMod:{CdA:1.30,ClA:2.55,drsDrag:0.86,mu:1.56}, // low drag/downforce, a bit less grip on the brakes
    atmo:{skyTop:'#7fa8d4',skyMid:'#c9d8e0',skyBot:'#f2ead8'}}, // warm Lombardy light
};
