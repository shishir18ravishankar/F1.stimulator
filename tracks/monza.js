// Monza — 5.793 km, only 11 corners, flat-out ~82% of the lap. "Temple of
// Speed": flat royal-park setting, tall pines, chicanes splitting enormous
// straights, and the abandoned banked oval in the background. Runs a
// low-downforce/low-drag setup (pMod). Units ~2 m each, nearly flat.
const MZA_SEGS=[
  {st:500,e:20},                     // main straight (S/F, DRS — biggest braking zone ahead)
  {turn:80,r:20,e:20},               // T1 Variante del Rettifilo (right, ~370->80 km/h)
  {turn:-80,r:20,e:20},              // T2 Rettifilo (left)
  {st:60,e:20},
  {turn:65,r:290,e:21},              // T3 Curva Grande (long fast right, near flat)
  {st:240,e:21},
  {turn:-70,r:22,e:21},              // T4 Variante della Roggia (left)
  {turn:65,r:22,e:21},               // T5 Roggia (right)
  {st:120,e:21},
  {turn:75,r:60,e:22},               // T6 Lesmo 1 (right)
  {st:90,e:22},
  {turn:80,r:45,e:22},               // T7 Lesmo 2 (right)
  {st:340,e:20},                     // run down through Serraglio
  {turn:-12,r:400,e:20},             // Serraglio kink (left)
  {st:220,e:19},
  {turn:-60,r:45,e:19},              // T8 Variante Ascari (left)
  {turn:65,r:55,e:19},               // T9 Ascari (right)
  {turn:-40,r:70,e:19},              // T10 Ascari exit (left)
  {st:560,e:19},                     // back straight (DRS)
  {turn:180,r:75,e:20},              // T11 Parabolica/Alboreto (long right onto the straight)
  {st:120,e:20},
];
const TRACKS={
  mza:{id:'mza',tag:'MZA',name:'MONZA',halfW:6.0,lap:5793,segs:MZA_SEGS,e0:20,
    sf:[500,500],style:'park',walled:false,traps:true,
    zonesS:[[4250,5050]],              // back straight into Parabolica (+auto main straight)
    zoneAnchors:[],paved:[],
    ground:[76,112,58],
    // Parco di Monza: tall thin pines, tifosi-red stands, old banking backdrop
    scenery:{treeDens:0.45,treeNear:18,treeSpread:50,treeH:11,treeHVar:6,treeW:1.8,
      stands:[150,5600],
      banking:[994,681,161]}, // old high-speed oval ruins in the infield park
    pMod:{CdA:1.30,ClA:2.55,drsDrag:0.86}}, // Temple of Speed: low drag, low downforce
};
