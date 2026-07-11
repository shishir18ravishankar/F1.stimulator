// Autodromo Hermanos Rodriguez, Mexico City - 4.304 km, 17 corners. The
// highest circuit in F1 at 2,285 m: the air is ~35% thinner, so straight-line
// speeds soar while wings and brakes gasp - modelled here with a real air
// density drop (rho 0.785 vs 1.20), max-wing ClA, and slippery off-line grip.
// Centerline traced from the real circuit's geometry (driven order from the
// S/F line), so the plan view matches the official track map. Points are
// [x,y,elev] - the park is flat; the drama is the altitude and the FORO SOL
// stadium section where the track threads the old baseball arena.
const MEX_CTRL=[
  [270,561,4],[395,562,4],[520,564,4],       // S/F - the 1.2 km run to T1
  [580,566,4],[600,558,4],[606,542,4],       // T1 - deep braking, thin air
  [604,524,4],[610,510,4],                   // T2 - the S-jog
  [618,500,4],[618,484,4],                   // T3
  [616,440,4],[614,396,4],                   // straight to T4 (DRS)
  [612,372,4],[602,358,4],[584,352,4],       // T4 - wide hairpin feel
  [560,348,4],[544,340,4],                   // T5
  [524,334,4],[508,336,4],                   // T6 (kink)
  [484,340,4],[468,332,4],[452,328,4],       // T7-T11: the esses - a rhythm
  [436,336,4],[420,340,4],[404,332,4],       // ribbon swinging left-right
  [388,328,4],[372,336,4],[356,340,4],       // across the old infield
  [340,334,4],
  [314,330,4],[300,338,4],[296,352,4],       // T12 - hard braking, turns in
  [296,390,4],[296,428,4],                   // the run to the stadium
  [298,448,4],[306,458,4],[320,462,4],       // T13 - INTO FORO SOL: 30,000
  [336,464,4],[348,472,4],[350,486,4],       // seats on top of you; T14
  [346,500,4],[334,508,4],[318,508,4],       // T15 - out of the arena
  [296,510,4],[272,516,4],[252,528,4],       // T16-T17 Peraltada - the long
  [240,544,4],[242,556,4],[250,560,4],       // wrap onto the main straight
];
const TRACKS={
  mex:{id:'mex',tag:'MEX',name:'MEXICO CITY',halfW:6.2,lap:4304,ctrl:MEX_CTRL,
    sf:[270,561],style:'park',walled:false,traps:true,
    zonesS:[[1500,1790]],               // the T3-T4 straight
    zoneAnchors:[],paved:[],
    ground:[96,118,62],                 // Magdalena Mixhuca park grass
    pMod:{rho:0.785,ClA:3.55,mu:1.58,gripVar:0.015,brakeForce:32000}, // 2,285 m: thin air, hot brakes
    atmo:{skyTop:'#4f8fd0',skyMid:'#b8cbd8',skyBot:'#e8ddc8',fog:[196,196,188]}, // altitude light + haze
    // city park trees and the Foro Sol bowl wrapped around the stadium section
    scenery:{treeDens:0.25,treeNear:22,treeSpread:55,treeH:6,treeHVar:4,
      stands:[200,1450,3300],
      banking:[322,486,50]}},           // the Foro Sol arena (decorative bowl)
};
