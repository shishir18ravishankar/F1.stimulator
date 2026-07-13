// Digitized from the official F1 track map (clockwise, y-down = map view).
// T1 Niki Lauda (right, uphill) -> long climb (straight) -> T3 Remus hairpin ->
// back straight (speed trap) -> T4 Schlossgold hairpin (highest point)
// -> downhill T5 -> T6/T7 left U (the only lefts) -> T8 kink -> Sector 3 run
// -> fast T9 Rindt -> T10 onto the pit straight.
const RBR_CTRL=[
  [890,290,11],[820,358,10],[742,420,9.5],[664,478,9.5],[620,510,10], // pit straight (SW)
  [598,527,11],[577,530,12],[558,518,13.5],                          // T1 Niki Lauda
  [480,462,20],[400,402,28],[322,340,38],[250,285,47],[185,248,54],  // the climb (T2 kink)
  [152,235,57],[133,225,58],[124,210,59],[130,196,59.5],[146,187,60],// T3 Remus hairpin
  [240,152,61.5],[340,118,63],[440,90,64.5],[520,68,66],             // back straight
  [562,57,67],[588,56,68],[605,68,68],[608,88,67.5],[596,106,66.5],  // T4 Schlossgold (highest)
  [556,146,62],[515,185,57],[474,222,52],                            // downhill, T5
  [440,258,47],[420,292,43],[426,322,40],[450,342,38],[487,352,37],  // T6/T7 left U (Rauch)
  [522,344,36],[545,320,35.5],
  [554,290,35],[572,264,34],[630,240,31],[700,208,28],[770,170,25],  // T8 kink, Sector 3 run
  [830,133,21],[862,120,19],[884,124,18],[900,140,17],               // T9 Rindt (fast right)
  [922,175,15],[938,206,13],[948,224,12],[945,241,11.5],[930,255,11],// T10 onto the straight
];
const TRACKS={
  rbr:{id:'rbr',tag:'RBR',name:'RED BULL RING',halfW:6.5,lap:4318,ctrl:RBR_CTRL,
    sf:[742,420],style:'alpine',walled:false,traps:true,
    paved:[[577,530],[884,124],[941,232]],
    ground:[56,106,48]},
};
