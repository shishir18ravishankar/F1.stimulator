// Yas Marina Circuit, Abu Dhabi - 5.281 km, 16 corners, anticlockwise. The
// season finale, run at twilight: the race starts in the desert sun and
// finishes under floodlights with the sky burning violet-orange behind the
// hotel. 2021-revised layout: the wide T5 hairpin launches the ~1.2 km back
// straight, a heavy chicane, the second straight, then the banked T9
// hairpin into the marina sector beneath the W Hotel. Centerline traced
// from the real circuit's geometry (driven order); points are [x,y,elev].
// Key corners: the T5 hairpin launching the back straight, the banked T9
// hairpin, the T12-T16 marina run beneath the W Hotel.
// Elevation: flat. Active aero opens on the twin straights automatically.
// Scenery: marina city at twilight - hotel, yachts, floodlights.
const YAS_CTRL=[
  [560,580,3],[440,582,3],[340,584,3],       // S/F past the pit building
  [300,584,3],[284,576,3],[278,560,3],       // T1 - the hard left-ish opener
  [280,500,3],[272,484,3],[278,466,3],       // T2-T4 - the first-sector
  [270,450,3],                               // twisties
  [274,432,3],[284,420,3],[300,414,3],       // T5 - the wide hairpin that
  [380,390,3],[460,366,3],[540,342,3],       // launches the ~1.2 km back
  [620,318,3],[640,314,3],                   // straight - lunge city
  [654,306,3],[660,294,3],                   // T6 - the heavy chicane
  [668,286,3],[678,290,3],[682,304,3],       // T7 - flicks back
  [690,360,3],[696,416,3],[702,472,3],       // the second straight
  [704,496,3],[698,512,3],[684,520,3],       // T9 - the banked hairpin
  [668,518,3],
  [652,516,3],[636,510,3],[622,516,3],       // T10-T11 - into the marina:
  [612,528,3],[616,542,3],[628,548,3],       // yachts on one side,
  [642,552,3],[646,564,3],[636,572,3],       // T12-T13 - the glowing hotel
  [622,570,3],[610,564,3],                   // overhead; T14-T15 the last
  [598,566,3],[590,574,3],[576,578,3],       // marina sweep, T16 onto the
];                                           // pit straight
const TRACKS={
  yas:{id:'yas',tag:'YAS',name:'YAS MARINA',halfW:6.3,lap:5281,ctrl:YAS_CTRL,
    sf:[560,580],style:'flat',walled:false,traps:true,
    paved:[],
    ground:[64,60,52],                  // twilight desert + manicured verges
    pMod:{mu:1.62,ClA:3.20},            // smooth, modern, grippy surface
    atmo:{night:true,sun:false,skyTop:'#10173a',skyMid:'#3a2f58',skyBot:'#8a4a3e',fog:[56,48,60]}, // twilight
    // floodlit finale: pylons everywhere, the hotel tower over the marina
    scenery:{floodlights:70,treeDens:0.07,treeNear:24,treeSpread:50,treeH:5,treeHVar:2,treeW:1.5,
      stands:[300,1150,3300],
      tower:[560,545,34]}},             // the hotel over the marina sector
};
