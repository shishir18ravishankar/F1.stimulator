// Circuit de Monaco as an explicit, guaranteed-simple (non-self-intersecting)
// loop of control points [x,y,elev], driven order. Two harbour straights (pit
// straight y~460 and the pool road y~520) run parallel and are joined at the
// ends by the hill loop (Ste Devote up, Casino across the top, hairpin + tunnel
// down) and by the Rascasse/Noghes turnaround. Harbour = low (~3), Casino high
// (~41, ~44 m real). Verified 0 self-crossings.
// Circuit de Monaco traced from the official F1 layout map: an elongated (2:1)
// shape. Pit straight + climb on the LEFT to Turn 1 (Sainte Devote, the peak),
// Beau Rivage down-right, Massenet/Casino (highest ~44 m), long run right to the
// Grand Hotel Hairpin BULB on the far right (Mirabeau/Hairpin/Portier), tunnel
// curving down, back left along the harbour (Nouvelle Chicane), up to Tabac, then
// the Swimming Pool esses + Rascasse + Noghes down the left back to the start.
// The infield is the harbour (marina). Verified 0 self-crossings.
const MONACO_CTRL=[
  [140,300,5],[205,205,12],[285,128,18],             // pit straight + climb (LEFT)
  [352,98,22],[450,134,30],[548,194,37],             // T1 Sainte Devote (peak) + Beau Rivage
  [652,252,41],[740,298,43],                         // T2, T3 Massenet
  [802,232,44],[912,206,41],                         // T4 Casino + top run (highest)
  [1016,196,35],[1082,230,30],                       // T5 Mirabeau Haute
  [1104,286,26],[1074,330,23],[1026,340,22],         // T6 Grand Hotel Hairpin (U-turn)
  [1046,388,18],[1112,362,14],                       // T7 Mirabeau Bas
  [1138,349,12],[1147,359,11],[1147,373,11],[1138,383,10], // T8 Portier (round arc onto the tunnel)
  [1122,402,9],[1030,454,6],                         // tunnel (curving down)
  [892,472,4],[750,432,4],                           // T9 tunnel exit (bottom)
  [620,372,3],[560,350,3],                           // T10-T11 Nouvelle Chicane
  [432,232,4],[376,192,5],                           // up to Tabac (T12)
  [312,248,4],[298,300,3],                           // T13-T14 Swimming Pool
  [236,384,3],[190,408,3],                           // T15-T16
  [160,448,3],[178,500,3],                           // T17 La Rascasse
  [132,540,4],[52,500,4],[78,398,5],                 // T18-T19 Noghes -> back to start
];
const TRACKS={
  monaco:{id:'mco',tag:'MCO',name:'MONACO',halfW:5.2,lap:3337,ctrl:MONACO_CTRL,
    sf:[140,300],style:'city',walled:true,traps:false,
    paved:[],
    tunnel:[[1122,402],[950,468]],      // Portier into the tunnel -> exit at the water
    quay:[[750,432],[300,300]],         // (unused now; harbour is the infield)
    tabac:[376,192],                    // a grandstand anchor near Tabac
    pMod:{steerMax:0.38,steerFade:22,kerbAggr:1.15}, // tight, twitchy street-circuit steering
    ground:[120,118,110]},
};
