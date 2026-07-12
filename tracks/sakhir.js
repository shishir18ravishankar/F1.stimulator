// Bahrain International Circuit, Sakhir - 5.412 km, 15 corners, clockwise.
// The season-opening night race: floodlights over a desert oasis. Centerline
// traced from the real circuit's geometry (north = up, driven order from the
// S/F line), so the plan view matches the official track map. Points are
// [x,y,elev]; the desert plateau falls ~8 m through the tricky off-camber
// T9-T10 double-left and climbs back through the long T11. Three DRS zones:
// the 1.09 km main straight, T3-T4, and T10-T11.
const BAH_CTRL=[
  [240,560,4],[240,470,4],[240,380,4],       // S/F: the 1.09 km main straight (DRS)
  [242,352,4],[250,336,4],[264,328,4],       // T1 - hard braking from 320 km/h,
  [280,324,4.2],                             // the race-winning overtaking spot
  [296,320,4.4],[308,312,4.6],               // T2 (L, flows straight on)
  [318,300,4.8],[324,284,5.0],               // T3 (L, opens uphill)
  [328,240,5.6],[332,190,6.2],               // run to T4 (DRS)
  [336,164,6.6],[348,150,6.8],[366,146,7.0], // T4 (R) - wide entry, sandy exit
  [382,152,7.0],[392,164,6.8],
  [396,178,6.6],[404,190,6.4],               // T5 (L, fast) the desert esses
  [418,202,6.2],[436,212,6.0],               // T6 (L)
  [456,218,5.8],[476,216,5.6],               // T7 (L) sweeping wide
  [492,208,5.4],
  [506,210,5.2],[514,222,5.0],[512,238,4.6], // T8 (R) hooks back south
  [504,262,4.0],[496,284,3.4],
  [490,302,2.8],[492,318,2.2],[502,330,1.8], // T9 - the double-apex left:
  [518,338,1.5],[536,340,1.3],[552,336,1.2], // T10, downhill, off-camber, the
  [566,330,1.2],                             // hardest braking zone to judge
  [620,342,1.4],[680,354,1.7],[740,366,2.0], // run to T11 (DRS)
  [764,374,2.2],[780,388,2.6],[784,406,3.0], // T11 (L, long, uphill) - commit
  [776,424,3.4],[758,434,3.8],[736,436,4.2], // blind over the rise
  [690,438,4.8],[644,438,5.2],               // T12 - flat-out left kink
  [606,438,5.4],[582,446,5.5],[570,462,5.6], // T13 (R, double apex) onto the
  [572,480,5.6],                             // sector-3 straight
  [578,512,5.4],[584,540,5.2],
  [588,556,5.0],[582,568,4.8],[566,574,4.6], // T14 (R, tight) - lunge spot
  [524,578,4.4],[478,580,4.3],               // short run
  [430,582,4.2],[386,584,4.2],               // T15 (L, long) - the final sweep
  [340,586,4.1],[300,582,4.0],[268,574,4.0], // squeezing onto the main straight
  [248,566,4.0],
];
const TRACKS={
  bah:{id:'bah',tag:'BAH',name:'BAHRAIN',halfW:6.5,lap:5412,ctrl:BAH_CTRL,
    sf:[240,560],style:'flat',walled:false,traps:true,
    zonesS:[[1030,1300],[2650,3140]],   // T3-T4 run + T10-T11 run
    zoneAnchors:[],paved:[],
    ground:[58,52,40],                  // floodlit desert: dark sand off-line
    pMod:{gripVar:0.03,mu:1.60,kerbAggr:1.1}, // abrasive surface, sand patches off-line
    atmo:{night:true,sun:false,skyTop:'#060913',skyMid:'#0d1226',skyBot:'#1c1f38',fog:[38,36,46]},
    // oasis palms in pools of floodlight, main grandstands, nothing beyond
    scenery:{floodlights:70,treeDens:0.08,treeNear:24,treeSpread:50,treeH:5.5,treeHVar:2,treeW:1.6,
      stands:[300,1500,3900]}},         // main, T4, T13 stands
};
