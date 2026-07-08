// Spa-Francorchamps — 7.004 km, the longest lap on the calendar, and by far
// the biggest elevation change (~95 m here between Les Combes and Stavelot).
// Ardennes forest either side; Eau Rouge/Raidillon compression-then-climb is
// the defining feature. Chained corner data closed by chainTrack; units are
// ~2.3 m each, elevations in meters and deliberately dramatic.
const SPA_SEGS=[
  {st:120,e:42},                     // S/F straight
  {turn:175,r:14,e:41},              // T1 La Source (tight hairpin)
  {st:60,e:38},
  {st:260,e:32},                     // steep downhill run to Eau Rouge
  {turn:-35,r:55,e:31},              // Eau Rouge (left flick, compression)
  {turn:48,r:50,e:44},               // Raidillon (steep uphill right, ~40 m climb)
  {turn:-14,r:90,e:52},              // crest left kink
  {st:600,e:98},                     // Kemmel Straight (DRS, 300+ km/h, climbing)
  {turn:-62,r:42,e:103},             // T5 Les Combes (left — highest point)
  {turn:60,r:38,e:103},              // T6 Les Combes (right)
  {st:70,e:98},
  {turn:50,r:55,e:90},               // T7 Malmedy (right, downhill begins)
  {st:100,e:80},
  {turn:160,r:26,e:70},              // T8 Rivage (long tight downhill right)
  {st:70,e:62},
  {turn:-32,r:70,e:56},              // T9 (left)
  {st:90,e:47},
  {turn:-80,r:75,e:36},              // T10 Pouhon (fast double-apex left sweeper)
  {st:110,e:30},
  {turn:-42,r:42,e:27},              // T11 Campus (left)
  {turn:50,r:38,e:24},               // T12 Fagnes (right)
  {st:55,e:22},
  {turn:95,r:50,e:16},               // T13/14 Stavelot (right — lowest point)
  {st:120,e:12},                     // valley floor
  {turn:20,r:200,e:16},              // long forest run, gentle right, climbing
  {st:180,e:22},
  {turn:-45,r:170,e:28},             // T18 Blanchimont (fast sweeping left, near flat)
  {st:150,e:32},
  {turn:65,r:16,e:34},               // T19 Bus Stop (right)
  {turn:-70,r:16,e:35},              // Bus Stop (left)
  {st:90,e:40},                      // climb to the line
];
const TRACKS={
  spa:{id:'spa',tag:'SPA',name:'SPA-FRANCORCHAMPS',halfW:6.0,lap:7004,segs:SPA_SEGS,e0:42,
    sf:[500,500],style:'forest',walled:false,traps:true,
    zonesS:[[1400,2650]],              // Kemmel straight
    zoneAnchors:[],paved:[],
    ground:[42,84,40],
    // dense Ardennes forest walls of tall conifers close to the road
    scenery:{treeDens:0.8,treeNear:14,treeSpread:55,treeH:9,treeHVar:7}},
};
