// Las Vegas Strip Circuit - 6.201 km, 17 corners, anticlockwise, run at
// night in the cold desert air: track temps are the lowest of the season,
// so grip is scarce and the car slides on skinny downforce. Centerline
// traced from the real circuit's geometry (north = up, driven order from
// the S/F line), so the plan view matches the official track map: Koval
// Lane north past the Sphere, Sands Avenue west, then the ~1.9 km STRIP
// straight south past the casinos, and Harmon Avenue home. Points [x,y,elev].
// Key corners: the T1 stop off Koval, the T5-T9 loop past the Sphere, the
// heavy T14 stop at the end of the Strip. Elevation: dead flat. DRS: 2 zones.
// Scenery: night city - casino neon, the glowing Sphere, the Strip's hotels.
const LVG_CTRL=[
  [560,470,3],[558,400,3],                   // S/F on Koval Lane, heading north
  [554,376,3],[560,352,3],                   // T1-T2 - the opening jog
  [556,330,3],[556,270,3],                   // north toward the Sphere
  [560,252,3],[572,242,3],                   // T5 - the SPHERE wrap begins:
  [584,234,3],[588,220,3],                   // T6 - curling around the glowing
  [584,204,3],[572,196,3],                   // T7 - 111 m orb
  [556,192,3],[544,200,3],                   // T8 - out of the wrap
  [528,206,3],[512,210,3],                   // T9 - onto Sands Avenue
  [440,214,3],[360,218,3],[280,222,3],       // Sands Ave, heading west
  [240,224,3],[220,230,3],[210,244,3],       // T10-T12 - the downtown corner
  [206,262,3],
  [202,330,3],[200,400,3],[198,470,3],       // THE STRIP - ~1.9 km, 342 km/h,
  [196,540,3],[196,610,3],                   // Bellagio and Caesars sliding past
  [198,634,3],[206,648,3],[222,654,3],       // T14 - hard braking off the Strip
  [300,656,3],[380,652,3],                   // Harmon Avenue
  [420,648,3],                               // T15 (kink)
  [500,640,3],[530,634,3],[548,624,3],       // T16-T17 - the double right
  [558,606,3],[560,586,3],                   // back onto Koval
];
const TRACKS={
  lvg:{id:'lvg',tag:'LVG',name:'LAS VEGAS',halfW:6.4,lap:6201,ctrl:LVG_CTRL,
    sf:[560,470],style:'city',walled:true,traps:false,
    zonesS:[[3050,4050]],               // the Strip
    zoneAnchors:[],paved:[],
    ground:[26,26,32],                  // night asphalt and parking lots
    pMod:{mu:1.48,CdA:1.36,ClA:2.60,kerbAggr:0.9}, // cold track, skinny wings, low grip
    atmo:{night:true,sun:false,skyTop:'#05060f',skyMid:'#0c0e24',skyBot:'#251b3a',fog:[36,32,52]},
    scenery:{floodlights:80,waterCol:[16,16,22],windowCol:[255,220,140],
      palette:[[54,46,74],[70,38,64],[40,52,80],[60,60,90],[46,40,66],[36,44,70]],
      banking:[610,222,24]},            // the Sphere's round footprint
  },
};
