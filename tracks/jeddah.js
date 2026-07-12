// Jeddah Corniche Circuit - 6.174 km, 27 corners (the most in F1), the
// fastest street circuit on the calendar (~250 km/h average). A long, thin
// floodlit sliver along the Red Sea corniche, wrapped around the Al Arbaeen
// lagoon, driven anticlockwise. Centerline traced from the real circuit's
// geometry (north = up, driven order from the S/F line), so the plan view
// matches the official track map. Points are [x,y,elev]; the corniche is
// dead flat. Signatures: the relentless T4-T12 high-speed esses between
// walls, the 12-degree banked T13 at the north end, and three DRS zones.
// Key corners: the T4-T12 wall-lined esses, the 12-degree banked T13, T27 finale.
// Elevation: dead flat seafront. DRS: 3 zones.
// Scenery: night-city seaside - Red Sea corniche, lagoon, floodlit towers.
const JED_CTRL=[
  [300,700,2],[300,640,2],[300,560,2],       // S/F on the seafront straight
  [296,538,2],[286,530,2],[284,518,2],       // T1-T2 - the tight left-right
  [292,508,2],                               // where lunges happen
  [296,490,2],[302,470,2],                   // T3 opens north
  [308,448,2],[300,430,2],[290,414,2],       // T4-T12: the wall-lined esses,
  [296,392,2],[306,374,2],[300,352,2],       // taken flat or near-flat at
  [290,336,2],[296,314,2],[306,296,2],       // 250+ km/h - commitment corners,
  [300,274,2],[290,258,2],[296,236,2],       // zero room for error
  [304,218,2],[298,196,2],[288,180,2],
  [292,160,2],[302,146,2],                   // T12 (R) opens to the north end
  [300,128,2],[290,112,2],[272,104,2],       // T13 - the 12-degree BANKED
  [252,108,2],[240,122,2],[238,138,2],       // left hairpin, unique in F1
  [244,156,2],
  [238,180,2],[246,204,2],[238,228,2],       // T14-T16 esses southbound
  [232,252,2],[231,300,2],[230,348,2],       // the lagoon-side run (DRS) -
  [229,396,2],[228,420,2],                   // gentle flat-out kinks
  [226,436,2],[218,452,2],[224,472,2],       // T22-T23 fast chicane
  [222,500,2],[223,560,2],[224,620,2],       // corniche run south (DRS)
  [225,668,2],
  [227,700,2],[232,730,2],[242,750,2],       // T27: the final hairpin around
  [260,762,2],[278,758,2],[292,742,2],       // the lagoon's tip, onto the
  [298,724,2],                               // pit straight
];
const TRACKS={
  jed:{id:'jed',tag:'JED',name:'JEDDAH',halfW:5.4,lap:6174,ctrl:JED_CTRL,
    sf:[300,700],style:'city',walled:true,traps:false,
    zonesS:[[3800,4300],[4950,5440]],   // lagoon-side run + corniche run to T27
    zoneAnchors:[],paved:[],
    ground:[26,30,38],                  // floodlit night: dark beyond the walls
    atmo:{night:true,sun:false,skyTop:'#04070f',skyMid:'#0a1022',skyBot:'#182038',fog:[30,34,46]},
    scenery:{floodlights:65,waterCol:[8,26,48],windowCol:[255,224,150],
      palette:[[40,46,64],[52,56,78],[36,42,58],[58,64,88],[44,50,68],[34,40,56]]},
    pMod:{mu:1.58,kerbAggr:1.15,CdA:1.48,ClA:3.05,yawDamp:3500}}, // low-drag street flow, stable at speed
};
