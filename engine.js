// engine.js — track-agnostic F1 sim engine (physics, camera, renderer,
// input, audio, HUD). Expects a track data file loaded first that defines
// const TRACKS = { id: {ctrl,...} } (see tracks/*.js).
'use strict';
/* =========================================================================
   RED BULL RING v2.1 — Canvas pseudo-3D F1 sim, no libraries.
   Physics: per-axle slip-angle bicycle model, friction circle, weight
   transfer @120 Hz, with explicit stability measures:
     1. yaw damping torque -Kd*r
     2. slip input to the lateral curve clamped (flat saturation, no flip)
     3. post-step body-slip sanity blend beyond ~60 deg
     4. NaN watchdog
     5. kinematic blend below ~4 m/s
   Driver assists (keyboard-friendly, tunable in P.assist*):
     - steering self-alignment: front slip from chassis sideslip is relaxed,
       which auto-countersteers small slides
     - traction assist: drive demand tapers as rear slide grows
     - brake assist: front brake demand tapers when fronts lock
   Renderer: pinhole projection, painter-sorted world list (road, kerbs,
   gravel traps, mown-grass aprons, trees, grandstands, pit wall, barriers),
   multi-part shaded car mesh with octagonal wheels, halo, helmet, animated
   active-aero flaps, body roll/pitch. Cameras: chase / T-cam / cockpit.
   ========================================================================= */

// ---------- utils ----------
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const lerp=(a,b,t)=>a+(b-a)*t;
const TAU=Math.PI*2;
function wrapAngle(a){while(a>Math.PI)a-=TAU;while(a<-Math.PI)a+=TAU;return a;}
function lerpAngle(a,b,t){return a+wrapAngle(b-a)*t;}
function mulberry(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;
  let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;
  return((t^t>>>14)>>>0)/4294967296;};}

// ---------- vehicle parameters ----------
const P={
  mass:795, Iz:1150,
  a:1.944, b:1.656, wheelbase:3.6, hCG:0.32, weightFront:0.46,
  mu:1.62,
  muFront:0.96, muRear:1.10,     // understeer-biased: stable at the limit
  Bf:8.5, Cf:1.90, Br:9.0, Cr:1.80,
  alphaMax:0.45,
  yawDamp:3200,                  // stronger than v2.0 — settles fast
  betaMax:1.05,
  power:745000, maxDriveForce:11800, // total peak = icePower + ersPower
  // --- 2026 energy management (battery + MGU-K) ---
  // Rebalanced so a normal lap's harvest ~= its deploy (no perpetual
  // starvation). Deploy is a corner-exit punch that fades toward top speed
  // (models "clipping"), so it doesn't drain the whole lap; the three harvest
  // modes (brake / lift-and-coast / partial throttle) refill it, each rate-
  // capped so recharge is never instant. Overtake boost deploys harder than
  // normal, so repeated use still meaningfully depletes the battery.
  icePower:425000,                   // combustion-only pace when the battery is flat
  ersPower:320000,                   // normal deploy peak (corner-exit punch)
  ersDeployLo:50,                    // m/s (~180 km/h): full deploy at/below
  ersDeployHi:82,                    // m/s (~295 km/h): deploy fades to 0 here
  ersCap:8.5e6,                      // battery energy: 8.5 MJ
  ersHarvestBrake:350000,            // MGU-K recovery cap under braking (x pedal)
  ersHarvestLift:230000,             // lift-and-coast harvest
  ersHarvestPart:170000,             // partial-throttle harvest
  brakeForce:34000, brakeBias:0.58, engineBrake:700,
  CdA:1.56, ClA:3.30, aeroBalance:0.44, rho:1.20,
  // 2026 active aero: Straight Mode trims BOTH wings (front+rear together)
  aeroDrag:0.80, aeroDF:0.72,
  ersPowerOT:450000,                 // Overtake boost deploy (higher -> drains faster)
  rollC:0.012, kinetic:0.93,
  steerMax:0.34, steerFade:26,
  assistAlign:0.32,              // 0..1 front-slip relaxation (auto countersteer)
  assistTC:0.5,                  // drive cut per unit rear slide beyond 0.2
  assistABS:0.35,                // front brake cut when fronts lock
  kerbAggr:1,                    // per-track: kerb rumble/drag aggression
  gripVar:0,                     // per-track: spatial grip variation amplitude (Spa)
};
const GEAR_KMH=[0,100,135,170,205,240,275,312];

// =========================================================================
// TRACK + ENVIRONMENT BUILD
// =========================================================================
let HALF_W=6.5; const KERB_W=1.7; // road half-width is set per track

function crPoint(p0,p1,p2,p3,t){
  const d=(a,b)=>Math.max(1e-4,Math.sqrt(Math.hypot(b[0]-a[0],b[1]-a[1])));
  const t0=0,t1=t0+d(p0,p1),t2=t1+d(p1,p2),t3=t2+d(p2,p3);
  const tt=t1+(t2-t1)*t;
  const lp=(a,b,ta,tb)=>{const u=(tt-ta)/(tb-ta);return[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u];};
  const A1=lp(p0,p1,t0,t1),A2=lp(p1,p2,t1,t2),A3=lp(p2,p3,t2,t3);
  const B1=lp(A1,A2,t0,t2),B2=lp(A2,A3,t1,t3);
  return lp(B1,B2,t1,t2);
}

// Build a centerline by dead-reckoning documented corner data (length /
// turn angle / radius / elevation). Used for Monaco: the corner sequence is
// well documented, so chaining it reproduces the circuit's shape.
function chainTrack(segs,e0){
  // heading closure: scale all turns so total turning = ±360° (a clean loop).
  // xy closure: least-squares stretch/shrink of the STRAIGHT segments (arcs
  // stay exact — dragging points linearly crushed tight arcs into kinks);
  // any small residual is then distributed linearly as before.
  let tot=0;for(const s of segs)if(s.turn)tot+=s.turn;
  const tScale=Math.abs(tot)>1?(tot>=0?360:-360)/tot:1;
  const adj=new Float64Array(segs.length);
  const build=()=>{
    const pts=[[500,500,e0]],tags={},dirs=[];
    let x=500,y=500,h=0,elev=e0;
    segs.forEach((sg,si)=>{
      if(sg.tag)tags[sg.tag]=pts.length;
      const eA=elev,eB=sg.e!==undefined?sg.e:elev;elev=eB;
      if(sg.st){
        const L=sg.st+adj[si];
        dirs.push([si,Math.cos(h),Math.sin(h)]);
        const n=Math.max(1,Math.round(L/45));
        for(let k=1;k<=n;k++){
          x+=Math.cos(h)*L/n;y+=Math.sin(h)*L/n;
          pts.push([x,y,eA+(eB-eA)*k/n]);
        }
      }else{
        const a=sg.turn*tScale*Math.PI/180;
        const n=Math.max(3,Math.round(Math.abs(sg.turn)/12));
        for(let k=1;k<=n;k++){
          const da=a/n,chord=2*sg.r*Math.sin(Math.abs(da)/2);
          h+=da/2;x+=Math.cos(h)*chord;y+=Math.sin(h)*chord;h+=da/2;
          pts.push([x,y,eA+(eB-eA)*k/n]);
        }
      }
    });
    return {pts,tags,dirs,x,y};
  };
  let r=build();
  {// length-weighted least squares: delta_i = L_i*(u_i·w), solve (Σ L u uᵀ)w = gap.
    // Long straights absorb the closure gap; short ramps/links barely move.
    const gx=500-r.x,gy=500-r.y;
    let a=0,b=0,c=0;for(const[si,ux,uy]of r.dirs){const L=segs[si].st;a+=L*ux*ux;b+=L*ux*uy;c+=L*uy*uy;}
    const det=a*c-b*b;
    if(Math.abs(det)>1e-6){
      const wx=(c*gx-b*gy)/det,wy=(a*gy-b*gx)/det;
      for(const[si,ux,uy]of r.dirs)
        adj[si]=clamp(segs[si].st*(ux*wx+uy*wy),-segs[si].st*0.35,segs[si].st*0.35);
      r=build();
    }
  }
  const pts=r.pts,n=pts.length;
  const gx=pts[0][0]-r.x,gy=pts[0][1]-r.y;
  for(let i=1;i<n;i++){pts[i][0]+=gx*i/n;pts[i][1]+=gy*i/n;}
  if(Math.hypot(pts[n-1][0]-pts[0][0],pts[n-1][1]-pts[0][1])<15)pts.pop();
  return {pts,tags:r.tags};
}

function buildTrack(def){
  // control points come either as an explicit ctrl array or as chained
  // segment data (length/turn/radius/elevation) closed via chainTrack
  const CTRL=def.ctrl||chainTrack(def.segs,def.e0||0).pts,LAP_TARGET=def.lap;
  HALF_W=def.halfW;
  const n=CTRL.length,raw=[];
  for(let i=0;i<n;i++){
    const p0=CTRL[(i-1+n)%n],p1=CTRL[i],p2=CTRL[(i+1)%n],p3=CTRL[(i+2)%n];
    for(let k=0;k<24;k++)raw.push(crPoint(p0,p1,p2,p3,k/24));
  }
  let len=0;
  for(let i=0;i<raw.length;i++){const q=raw[(i+1)%raw.length];len+=Math.hypot(q[0]-raw[i][0],q[1]-raw[i][1]);}
  const sc=LAP_TARGET/len;
  for(const p of raw){p[0]*=sc;p[1]*=sc;}
  const ds=3.0,N=Math.round(LAP_TARGET/ds);
  const X=new Float64Array(N),Y=new Float64Array(N),E=new Float64Array(N);
  let seg=0,acc=0;
  const at=i=>raw[i%raw.length];
  for(let i=0;i<N;i++){
    const target=i*(LAP_TARGET/N);
    while(true){
      const a=at(seg),b=at(seg+1);
      const l=Math.hypot(b[0]-a[0],b[1]-a[1]);
      if(acc+l>=target||seg>=raw.length*2){const u=l>1e-9?(target-acc)/l:0;
        X[i]=a[0]+(b[0]-a[0])*u;Y[i]=a[1]+(b[1]-a[1])*u;E[i]=a[2]+(b[2]-a[2])*u;break;}
      acc+=l;seg++;
    }
  }
  for(let pass=0;pass<3;pass++){
    const E2=new Float64Array(N);
    for(let i=0;i<N;i++)E2[i]=(E[(i-1+N)%N]+2*E[i]+E[(i+1)%N])/4;
    E.set(E2);
  }
  const sfx=def.sf[0]*sc,sfy=def.sf[1]*sc;
  let i0=0,bd=1e18;
  for(let i=0;i<N;i++){const d=(X[i]-sfx)**2+(Y[i]-sfy)**2;if(d<bd){bd=d;i0=i;}}
  const rot=A=>{const B=new Float64Array(N);for(let i=0;i<N;i++)B[i]=A[(i+i0)%N];return B;};
  const TX=rot(X),TY=rot(Y),TE=rot(E);
  const NX=new Float64Array(N),NY=new Float64Array(N),TH=new Float64Array(N),K=new Float64Array(N);
  for(let i=0;i<N;i++){
    const a=(i-1+N)%N,b=(i+1)%N;
    const tx=TX[b]-TX[a],ty=TY[b]-TY[a],l=Math.hypot(tx,ty)||1;
    TH[i]=Math.atan2(ty,tx);NX[i]=-ty/l;NY[i]=tx/l;
  }
  for(let i=0;i<N;i++){const a=(i-1+N)%N,b=(i+1)%N;K[i]=wrapAngle(TH[b]-TH[a])/(2*ds);}
  for(let pass=0;pass<2;pass++){
    const K2=new Float64Array(N);
    for(let i=0;i<N;i++){let s=0;for(let o=-3;o<=3;o++)s+=K[(i+o+N)%N];K2[i]=s/7;}
    K.set(K2);
  }
  const kerb=new Uint8Array(N);
  for(let i=0;i<N;i++)if(Math.abs(K[i])>0.0075)for(let o=-8;o<=8;o++)kerb[(i+o+N)%N]=1;
  let sBrake=450,found=0;
  for(let i=5;i<N;i++){if(Math.abs(K[i])>0.010){found++;if(found>=4){sBrake=(i-4)*ds;break;}}else found=0;}
  // distance (m) from each sample to the next corner ahead — the 2026 active
  // aero switch reads this O(1) each physics step (Straight vs Corner Mode)
  const cd=new Float32Array(N).fill(1e9);
  {let d=1e9;
   for(let i=2*N-1;i>=0;i--){
     const ii=i%N;
     if(Math.abs(K[ii])>0.008)d=0;else d+=ds;
     if(d<cd[ii])cd[ii]=d;
   }}
  // map-anchor lookup (px coords of the official map -> nearest sample)
  function nearIdx(px,py){
    const x=px*sc,y=py*sc;let bi=0,bd2=1e18;
    for(let i=0;i<N;i++){const d=(TX[i]-x)**2+(TY[i]-y)**2;if(d<bd2){bd2=d;bi=i;}}
    return bi;
  }
  const tunnel=def.tunnel?[nearIdx(def.tunnel[0][0],def.tunnel[0][1])*ds,
                          nearIdx(def.tunnel[1][0],def.tunnel[1][1])*ds]:null;
  const quay=def.quay?[nearIdx(def.quay[0][0],def.quay[0][1])*ds,
                       nearIdx(def.quay[1][0],def.quay[1][1])*ds]:null;
  const tabacI=def.tabac?nearIdx(def.tabac[0],def.tabac[1]):0;
  const CPS=[];for(let s=350;s<LAP_TARGET-150;s+=350)CPS.push(s);
  const LXa=new Float64Array(N),LYa=new Float64Array(N),RXa=new Float64Array(N),RYa=new Float64Array(N);
  for(let i=0;i<N;i++){
    LXa[i]=TX[i]-NX[i]*HALF_W;LYa[i]=TY[i]-NY[i]*HALF_W;
    RXa[i]=TX[i]+NX[i]*HALF_W;RYa[i]=TY[i]+NY[i]*HALF_W;
  }
  // corner spans -> runoff on the outside. T1 / T9 / T10 get the iconic
  // red-white striped PAVED runoff (aerial photos); T3 / T4 / the U get gravel.
  const spans=[];{let inC=false,a=0;
    for(let i=0;i<N;i++){const t=Math.abs(K[i])>0.008;
      if(t&&!inC){inC=true;a=i;}
      if(!t&&inC){inC=false;if((i-a)*ds>25)spans.push([a,i]);}}}
  const gravelMask=new Int8Array(N); // 0 none, else side sign of the trap
  const trapType=new Uint8Array(N);  // 1 gravel, 2 striped tarmac
  const paved=(def.paved||[]).map(([px,py])=>[px*sc,py*sc]);
  if(def.traps)for(const[a,b]of spans){
    let kSum=0;for(let i=a;i<b;i++)kSum+=K[i];
    const apexR=1/Math.max(1e-4,Math.abs(kSum/(b-a)));
    if(apexR>150)continue;
    const mid=(Math.round((a+b)/2)+N)%N;
    let pv=false;
    for(const[px,py]of paved)if(Math.hypot(TX[mid]-px,TY[mid]-py)<150)pv=true;
    const side=-Math.sign(kSum);
    for(let i=a-14;i<b+10;i++){
      const ii=(i+N)%N;
      gravelMask[ii]=side;trapType[ii]=pv?2:1;
    }
  }
  let minx=1e9,miny=1e9,maxx=-1e9,maxy=-1e9;
  for(let i=0;i<N;i++){minx=Math.min(minx,TX[i]);maxx=Math.max(maxx,TX[i]);
    miny=Math.min(miny,TY[i]);maxy=Math.max(maxy,TY[i]);}
  return {n:N,ds,length:LAP_TARGET,X:TX,Y:TY,E:TE,NX,NY,TH,K,kerb,
    LX:LXa,LY:LYa,RX:RXa,RY:RYa,cd,tunnel,nearIdx,
    sBrake,CPS,spans,gravelMask,trapType,minx,miny,maxx,maxy,
    id:def.id,tag:def.tag,name:def.name,style:def.style,scn:def.scenery||{},scMap:sc,
    walled:!!def.walled,ground:def.ground,quay,tabacI};
}
const TRACK_IDS=Object.keys(TRACKS);let curTrackKey=TRACK_IDS[0];
if(TRACKS[curTrackKey].pMod)Object.assign(P,TRACKS[curTrackKey].pMod); // per-track physics tune
let track=buildTrack(TRACKS[curTrackKey]);

function trackQuery(x,y,car){
  const N=track.n;let best=car.tIdx,bd=1e18;
  for(let o=-45;o<=45;o++){
    const i=(car.tIdx+o+N)%N,dx=x-track.X[i],dy=y-track.Y[i],d=dx*dx+dy*dy;
    if(d<bd){bd=d;best=i;}
  }
  if(bd>3600){for(let i=0;i<N;i+=3){const dx=x-track.X[i],dy=y-track.Y[i],d=dx*dx+dy*dy;
    if(d<bd){bd=d;best=i;}}}
  car.tIdx=best;
  const i=best;
  const lat=(x-track.X[i])*track.NX[i]+(y-track.Y[i])*track.NY[i];
  const al=Math.abs(lat);
  let mu=1,grass=false,kerbS=false,gravel=false;
  if(al>HALF_W+KERB_W){
    if(track.gravelMask[i]!==0&&Math.sign(lat)===track.gravelMask[i]&&al<HALF_W+KERB_W+10){
      if(track.trapType[i]===2)mu=0.85;      // paved striped runoff (T1/T9/T10)
      else{mu=0.42;gravel=true;}             // gravel trap (T3/T4/the U)
    }else{mu=0.50;grass=true;}
  }else if(al>HALF_W){mu=0.92;kerbS=true;}
  // continuous elevation: project onto the local segment and interpolate
  // between the 3 m samples — the nearest-sample value stair-steps at speed,
  // which read as camera/car bounce in every view on hilly tracks
  const ds2=track.ds*track.ds;
  const ip=(i+1)%N;
  let u=((x-track.X[i])*(track.X[ip]-track.X[i])+(y-track.Y[i])*(track.Y[ip]-track.Y[i]))/ds2;
  let elev;
  if(u>=0){u=Math.min(1,u);elev=track.E[i]+(track.E[ip]-track.E[i])*u;}
  else{
    const im=(i-1+N)%N;
    const v=Math.min(1,-u);
    elev=track.E[i]+(track.E[im]-track.E[i])*v;
  }
  return {idx:i,s:i*track.ds,lat,mu,grass,kerb:kerbS,gravel,elev};
}

// ---- static scenery: rebuilt per track (alpine circuit vs city street) ----
function worldBoxFaces(cx,cy,ge,yaw,sx,sy,sz,col,faces){
  const ch=Math.cos(yaw),sh=Math.sin(yaw);
  const corner=(ix,iy,iz)=>{
    const lx=ix*sx/2,ly=(iy+1)/2*sy,lz=iz*sz/2;
    return[cx+lx*ch-lz*sh,cy+lx*sh+lz*ch,ge+ly];
  };
  const c=[corner(-1,-1,-1),corner(1,-1,-1),corner(-1,1,-1),corner(1,1,-1),
           corner(-1,-1,1),corner(1,-1,1),corner(-1,1,1),corner(1,1,1)];
  const F=[[1,3,7,5,0.95],[0,4,6,2,0.78],[2,6,7,3,1.0],[4,5,7,6,0.88],[0,2,3,1,0.7]];
  for(const f of F){
    const lum=f[4];
    const r=Math.round(col[0]*lum),g=Math.round(col[1]*lum),b=Math.round(col[2]*lum);
    // rgb kept as numbers so per-frame fogging never has to re-parse the string
    faces.push({pts:[c[f[0]],c[f[1]],c[f[2]],c[f[3]]],col:`rgb(${r},${g},${b})`,rgb:[r,g,b]});
  }
}
function buildScenery(T){
  const N=T.n,rnd=mulberry(1337);
  const trees=[],structs=[],water=[];
  const worldBox=worldBoxFaces;
  const addStruct=(x,y,builder)=>{
    const faces=[];builder(faces);
    // footprint radius (max horizontal reach of any vertex) — used to skip a
    // structure if the camera ends up inside it, so it can't fill the screen
    let br=0;for(const f of faces)for(const p of f.pts){const d=Math.hypot(p[0]-x,p[1]-y);if(d>br)br=d;}
    // draw distance scales with physical size: a 1 m Armco barrier is culled
    // ~150 m out while a grandstand still draws at 600 m. This is what keeps
    // the wall-lined street circuits (Singapore/Jeddah/Baku/Vegas/Monaco)
    // inside the 60 fps frame budget.
    structs.push({x,y,faces,br,cull:Math.max(150,Math.min(620,80+br*28))});
  };
  function stand(si,side,w,len){
    const i=((si%N)+N)%N;
    const off=HALF_W+KERB_W+14;
    const x=T.X[i]+T.NX[i]*side*off,y=T.Y[i]+T.NY[i]*side*off,yaw=T.TH[i];
    addStruct(x,y,f=>{
      worldBox(x,y,T.E[i],yaw,len,5.4,w,[120,124,132],f);
      worldBox(x+T.NX[i]*side*2,y+T.NY[i]*side*2,T.E[i]+5.4,yaw,len,0.7,w+3,[40,44,52],f);
      worldBox(x-T.NX[i]*side*(w/2+0.3),y-T.NY[i]*side*(w/2+0.3),T.E[i]+1.2,yaw,len,3.2,0.5,[188,42,36],f);
    });
  }
  const board=(i,col,w)=>{
    const ii=((i%N)+N)%N;
    const bx=T.RX[ii]+T.NX[ii]*2.4,by=T.RY[ii]+T.NY[ii]*2.4;
    addStruct(bx,by,f=>worldBox(bx,by,T.E[ii]+0.5,T.TH[ii],0.3,1.3,w||1.6,col,f));
  };

  if(T.style==='city'){
    // ---------- MONACO: harbour infield + city on the outside ----------
    // loop centroid (the harbour sits here); outward = away from centroid
    let cx=0,cy=0;for(let i=0;i<N;i++){cx+=T.X[i];cy+=T.Y[i];}cx/=N;cy/=N;
    const outSign=i=>((T.X[i]-cx)*T.NX[i]+(T.Y[i]-cy)*T.NY[i]>=0)?1:-1; // +normal points out?
    // nearest NON-adjacent track distance to a point — detects a barrier box
    // reaching over a DIFFERENT leg (which happens at a tight hairpin)
    const otherLegDist=(x,y,i)=>{let bd=1e18;for(let k=0;k<N;k+=2){
      let ds1=Math.abs(k-i);ds1=Math.min(ds1,N-ds1);if(ds1<=9)continue;
      const dx=x-T.X[k],dy=y-T.Y[k],d=dx*dx+dy*dy;if(d<bd)bd=d;}return Math.sqrt(bd);};
    // Armco barriers both sides (steel, red-tipped). Skip any whose box would
    // reach the road of another leg (they'd cut across at the hairpin).
    for(let i=0;i<N;i+=2)for(const side of[-1,1]){
      const ex=side<0?T.LX:T.RX,ey=side<0?T.LY:T.RY;
      const ox=ex[i]+T.NX[i]*side*0.35,oy=ey[i]+T.NY[i]*side*0.35;
      if(otherLegDist(ox,oy,i)<HALF_W+3.6)continue;   // reaches another leg -> skip
      // at a tight apex the road direction whips around, so a straight barrier
      // box chords across the road. Leave the apex to the kerbs: skip both
      // barriers at the very tightest samples, and the inside one a bit wider.
      const inside=(side!==outSign(i)),k=Math.abs(T.K[i]);
      if(k>0.024)continue;
      if(inside&&k>0.013)continue;
      addStruct(ox,oy,f=>worldBox(ox,oy,T.E[i],T.TH[i],T.ds*(k>0.012?1.3:2.0),1.0,0.3,
        (i>>1)&1?[150,155,162]:[196,60,52],f));
    }
    // no-build mask: dilate every tight corner by a wide window so buildings
    // never sit near a hairpin (where an offset line folds over the apex/other
    // leg). This is what was putting a block on the road at the hairpin.
    const noBuild=new Uint8Array(N);
    for(let i=0;i<N;i++)if(Math.abs(T.K[i])>0.012)for(let o=-12;o<=12;o++)noBuild[(i+o+N)%N]=1;
    // city buildings — a continuous facade on the OUTSIDE of the loop, set well
    // back (camera never enters them), capped height, tiling so no overlap/pop.
    const scnC=T.scn||{};
    const pal=scnC.palette||[[224,206,170],[210,170,140],[228,220,206],[200,150,120],[214,196,158],[190,196,204]];
    const winCol=scnC.windowCol||[120,124,134];
    const bStep=7, FRONT=HALF_W+KERB_W+16;         // building line, well back from the road
    for(let i=0;i<N;i+=bStep){
      if(noBuild[i])continue;                      // skip tight corners (dilated)
      const side=outSign(i);
      const bl=(i/bStep)|0;
      for(let row=0;row<2;row++){                  // two rows stepping up the hill
        const dep=11+(bl%3)*3;
        const off=FRONT+dep/2+row*(dep+8);
        const x=T.X[i]+T.NX[i]*side*off,y=T.Y[i]+T.NY[i]*side*off;
        const base=T.E[i]-3+row*6;                 // back row higher (hillside)
        const h=13+((bl*37+row*13)%5)*3.5;         // capped height, no elevation blow-up
        const w=T.ds*bStep*0.9, col=pal[(bl+row*2)%pal.length];
        addStruct(x,y,f=>{
          worldBox(x,y,base,T.TH[i],w,h,dep,col,f);
          worldBox(x,y,base+h,T.TH[i],w*0.96,0.6,dep*0.96,[74,74,80],f);   // roof cap
          worldBox(x-T.NX[i]*side*(dep*0.5),y-T.NY[i]*side*(dep*0.5),base+3,T.TH[i],w*0.8,h*0.55,0.12,winCol,f); // windows
        });
      }
    }
    // tunnel: roof + side walls over the span
    if(T.tunnel){
      let a=Math.round(T.tunnel[0]/T.ds),b=Math.round(T.tunnel[1]/T.ds);
      for(let i=a;i<=b;i+=2){
        const ii=(i+N)%N,e=T.E[ii];
        addStruct(T.X[ii],T.Y[ii],f=>{
          worldBox(T.X[ii],T.Y[ii],e+6.2,T.TH[ii],T.ds*2.1,0.8,HALF_W*2+4,[40,40,46],f);
          for(const side of[-1,1]){
            const wx=T.X[ii]+T.NX[ii]*side*(HALF_W+0.5),wy=T.Y[ii]+T.NY[ii]*side*(HALF_W+0.5);
            worldBox(wx,wy,e,T.TH[ii],T.ds*2.1,6.2,0.6,[64,62,66],f);
          }
        });
      }
    }
    // harbour (marina): a big water body filling the infield. Sized to the
    // inradius so it never pokes through the track; ellipse matches the shape.
    let minD=1e9;for(let i=0;i<N;i+=2)minD=Math.min(minD,Math.hypot(T.X[i]-cx,T.Y[i]-cy));
    const wr=Math.max(20,minD*0.9);
    water.push({cx,cy,e:1.2,rx:wr*((T.maxx-T.minx)/(T.maxy-T.miny))*0.6,ry:wr});
    // moored yachts along the harbour edge (the low sections, e<7, inside)
    for(let i=0;i<N;i+=9){
      if(T.E[i]>7||noBuild[i])continue;             // skip tight corners too
      const side=-outSign(i);                       // inside (harbour) side
      const off=HALF_W+KERB_W+9+(i%3)*6;
      const x=T.X[i]+T.NX[i]*side*off,y=T.Y[i]+T.NY[i]*side*off;
      const L=9+(i%4)*3;
      addStruct(x,y,f=>{
        worldBox(x,y,1.1,T.TH[i]+0.25,L,1.8,3.4,[238,238,240],f);   // hull
        worldBox(x-T.NX[i]*side*0.4,y-T.NY[i]*side*0.4,2.9,T.TH[i]+0.25,L*0.5,2.6,2.6,[250,250,252],f); // cabin
        worldBox(x+L*0.42*Math.cos(T.TH[i]),y+L*0.42*Math.sin(T.TH[i]),1.1,T.TH[i],1.4,1.2,3.4,[210,210,214],f); // bow
      });
    }
    // grandstands: main straight + Tabac
    stand(2,outSign(2),8,55);
    stand(T.tabacI,outSign(T.tabacI),8,45);
  }else{
    // ---------- open-country tracks: trees + circuit furniture ----------
    // per-track character comes from def.scenery: treeDens (0..1 or default
    // RBR windows), treeNear/treeSpread (m from track), treeH/treeHVar/treeW
    // (bush vs tall pine), stands ([s,...] extra grandstands), banking (Monza)
    const scn=T.scn||{};
    const trackDist=(x,y)=>{let d=1e18;
      for(let i=0;i<N;i+=4){const dx=x-T.X[i],dy=y-T.Y[i];d=Math.min(d,dx*dx+dy*dy);}return Math.sqrt(d);};
    for(let i=0;i<N;i+=8)for(const side of[-1,1]){
      const s=i*T.ds,onPit=s>T.length-360||s<260;
      const dens=onPit?0.10:(scn.treeDens!==undefined?scn.treeDens:(s>300&&s<2400?0.6:0.3));
      if(rnd()>dens)continue;
      const off=(scn.treeNear!==undefined?scn.treeNear:16)+rnd()*(scn.treeSpread!==undefined?scn.treeSpread:46);
      const x=T.X[i]+T.NX[i]*side*off,y=T.Y[i]+T.NY[i]*side*off;
      if(trackDist(x,y)<13)continue;
      trees.push({x,y,e:T.E[i]-0.3,h:(scn.treeH!==undefined?scn.treeH:6)+rnd()*(scn.treeHVar!==undefined?scn.treeHVar:6),
        w:(scn.treeW!==undefined?scn.treeW:2.4)+rnd()*2.2,shade:0.8+rnd()*0.35});
    }
    stand(Math.round((T.length-150)/T.ds),-1,9,80);
    stand(Math.round(120/T.ds),-1,9,70);
    stand(Math.round((T.sBrake+70)/T.ds),-1,10,60);
    if(scn.stands)for(const ss of scn.stands)stand(Math.round(ss/T.ds),-1,9,60);
    if(T.id==='rbr'){stand(T.nearIdx(168,242),-1,9,55);stand(T.nearIdx(545,60),-1,9,55);}
    if(scn.banking){ // decorative banked oval in the background (not driveable)
      const bx=scn.banking[0]*T.scMap,by=scn.banking[1]*T.scMap,br=scn.banking[2]*T.scMap;
      const be=T.E[T.nearIdx(scn.banking[0],scn.banking[1])];
      for(let k=0;k<28;k++){
        const a0=k/28*TAU,a1=(k+0.6)/28*TAU;
        const p=(a,rr)=>[bx+Math.cos(a)*rr,by+Math.sin(a)*rr];
        const[ix0,iy0]=p(a0,br-7),[ox0,oy0]=p(a0,br+7);
        const[ix1,iy1]=p(a1,br-7),[ox1,oy1]=p(a1,br+7);
        const x=(ix0+ox1)/2,y=(iy0+oy1)/2;
        if(trackDist(x,y)<HALF_W+16)continue; // never lay banking over the road
        structs.push({x,y,br:22,faces:[
          {pts:[[ix0,iy0,be],[ix1,iy1,be],[ox1,oy1,be+7],[ox0,oy0,be+7]],col:'rgb(170,166,158)'},
          {pts:[[ox0,oy0,be+7],[ox1,oy1,be+7],[ox1,oy1,be+7.8],[ox0,oy0,be+7.8]],col:'rgb(120,118,112)'}]});
      }
    }
    for(let s=T.length-300;s<T.length-20;s+=27){
      const i=Math.round(s/T.ds)%N;
      const off=HALF_W+2.6;
      const x=T.X[i]+T.NX[i]*off,y=T.Y[i]+T.NY[i]*off;
      addStruct(x,y,f=>worldBox(x,y,T.E[i],T.TH[i],25,1.05,0.8,[150,155,160],f));
    }
    for(const[a,b]of T.spans){
      let kSum=0;for(let i=a;i<b;i++)kSum+=T.K[i];
      if(1/Math.max(1e-4,Math.abs(kSum/(b-a)))>160)continue;
      const side=-Math.sign(kSum);
      for(let i=a-10;i<b+8;i+=3){
        const ii=(i+N)%N,off=HALF_W+KERB_W+11.5;
        const x=T.X[ii]+T.NX[ii]*side*off,y=T.Y[ii]+T.NY[ii]*side*off;
        addStruct(x,y,f=>worldBox(x,y,T.E[ii],T.TH[ii],8.4,0.9,0.55,
          (ii>>2)&1?[196,50,44]:[228,226,220],f));
      }
    }
    board(Math.round((T.sBrake-100)/T.ds),[220,215,205]);
    if(T.id==='rbr'){
    board(T.nearIdx(205,258),[220,215,205]);
    board(T.nearIdx(512,70),[220,215,205]);
    board(T.nearIdx(498,78),[196,44,150],1.4);
    for(let k=0;k<8;k++){
      const i=(T.nearIdx(300,145)+k*6)%N,off=HALF_W+KERB_W+22;
      const x=T.X[i]+T.NX[i]*off,y=T.Y[i]+T.NY[i]*off;
      addStruct(x,y,f=>worldBox(x,y,T.E[i]-0.6,T.TH[i],13,1.5,5,[36,48,86],f));
    }
    {
      const bi=T.nearIdx(630,240);
      const x=T.X[bi]-T.NX[bi]*(HALF_W+60),y=T.Y[bi]-T.NY[bi]*(HALF_W+60);
      const e=T.E[bi],yaw=0.7,cy=Math.cos(yaw),sy2=Math.sin(yaw);
      const px=d=>x+cy*d,py=d=>y+sy2*d;
      addStruct(x,y,f=>{
        worldBox(x,y,e,yaw,11,0.35,11,[150,150,152],f);
        worldBox(px(-1.3),py(-1.3),e+0.35,yaw,1.1,1.3,1.0,[160,24,20],f);
        worldBox(px(1.3),py(1.3),e+0.35,yaw,1.1,1.3,1.0,[160,24,20],f);
        worldBox(x,y,e+1.65,yaw,5.6,2.1,1.5,[200,30,26],f);
        worldBox(px(2.9),py(2.9),e+2.9,yaw,1.5,1.3,1.1,[200,30,26],f);
        worldBox(px(3.3),py(3.3),e+4.0,yaw,0.3,0.4,1.9,[235,235,235],f);
        worldBox(px(-3.1),py(-3.1),e+2.6,yaw,0.25,1.5,0.25,[160,24,20],f);
      });
    }
    } // end RBR-specific furniture
  }
  // ---- generic parameterized extras (any style) ----
  const glows=[];
  if(T.scn&&T.scn.floodlights){ // pylons every N meters, alternating sides
    const stp=Math.max(40,T.scn.floodlights);
    for(let s=0;s<T.length-30;s+=stp){
      const i=Math.round(s/T.ds)%N,side=(Math.round(s/stp)&1)?1:-1;
      const off=HALF_W+KERB_W+2.4;
      const x=T.X[i]+T.NX[i]*side*off,y=T.Y[i]+T.NY[i]*side*off,e=T.E[i];
      const hx=x-T.NX[i]*side*1.1,hy=y-T.NY[i]*side*1.1;
      addStruct(x,y,f=>{
        worldBox(x,y,e,T.TH[i],0.35,12,0.35,[70,74,84],f);       // pole
        worldBox(hx,hy,e+12,T.TH[i],2.8,0.9,1.5,[238,240,226],f); // lamp head
      });
      glows.push({x:hx,y:hy,e:e+12.7});
    }
  }
  if(T.scn&&T.scn.tower){ // landmark observation tower [ctrlX,ctrlY,height]
    const[tx,ty,th]=T.scn.tower;
    const x=tx*T.scMap,y=ty*T.scMap,e=T.E[T.nearIdx(tx,ty)];
    addStruct(x,y,f=>{
      worldBox(x,y,e,0.5,2.4,th,2.4,[196,60,52],f);            // shaft
      worldBox(x,y,e+th,0.5,11,2.4,11,[222,224,230],f);        // observation deck
      worldBox(x,y,e+th+2.4,0.5,0.5,7,0.5,[160,160,166],f);    // antenna
    });
  }
  // start/finish checker (both tracks)
  const checker=[];
  for(let row=0;row<2;row++)for(let col=0;col<8;col++){
    const i0=row,i1=row+1;
    const w0=-HALF_W+col*(2*HALF_W/8),w1=w0+2*HALF_W/8;
    checker.push({pts:[
      [T.X[i0]+T.NX[i0]*w0,T.Y[i0]+T.NY[i0]*w0,T.E[i0]],
      [T.X[i0]+T.NX[i0]*w1,T.Y[i0]+T.NY[i0]*w1,T.E[i0]],
      [T.X[i1]+T.NX[i1]*w1,T.Y[i1]+T.NY[i1]*w1,T.E[i1]],
      [T.X[i1]+T.NX[i1]*w0,T.Y[i1]+T.NY[i1]*w0,T.E[i1]]],
      col:(row+col)&1?'#181818':'#e8e8e8'});
  }
  const clouds=[];
  for(let i=0;i<9;i++)clouds.push({a:rnd()*TAU,h:0.10+rnd()*0.14,s:0.5+rnd()*0.9});
  return {trees,structs,checker,clouds,water,glows};
}
let scenery=buildScenery(track);

// =========================================================================
// CAR STATE + PHYSICS
// =========================================================================
const car={
  x:0,y:0,heading:0,vx:0,vy:0,r:0,
  steer:0,throttle:0,brake:0,axS:0,ayS:0,
  tIdx:0,s:0,prevS:0,elev:0,lat:0,grass:false,kerb:false,gravel:false,
  slideF:0,slideR:0,utilF:{x:0,y:0},utilR:{x:0,y:0},
  alphaF:0,alphaR:0,FzF:0,FzR:0,delta:0,
  reverse:false,revT:0,lapValid:true,nanEvents:0,
  ersE:8.5e6,ersMode:0,ersFlow:0, // battery J, 0 idle / 1 deploy / 2 harvest
  // 2026 active aero: aeroOpen 1 = Straight Mode (wings trimmed), 0 = Corner
  // Mode (wings loaded). Automatic. wingFlap is the smoothed render angle.
  aeroOpen:0,wingFlap:0,
  // Overtake Mode: player-triggered extra deploy. otAvail = armed (within 1 s
  // of the virtual rival at the line), otActive = engaged, otLap = lap it dies.
  otAvail:false,otActive:false,otLap:-1,
  rollV:0,pitchV:0,bounce:0,spinF:0,spinR:0,
  kerbShake:0,susF:0,susVelF:0,susR:0,susVelR:0,fastT:-10,
};
function placeCarAtS(s){
  const i=Math.round(s/track.ds)%track.n;
  car.x=track.X[i];car.y=track.Y[i];car.heading=track.TH[i];
  car.vx=0;car.vy=0;car.r=0;car.axS=0;car.ayS=0;car.tIdx=i;car.prevS=i*track.ds;car.s=car.prevS;
  car.steer=0;car.throttle=0;car.brake=0;car.slideF=0;car.slideR=0;
  car.kerbShake=0;car.susF=0;car.susVelF=0;car.susR=0;car.susVelR=0;car.bounce=0;
  car.reverse=false;car.elev=track.E[i];
  car.ersE=P.ersCap;car.ersMode=0;car.ersFlow=0; // fresh battery (lap invalidates anyway)
  car.aeroOpen=0;car.wingFlap=0;car.otAvail=false;car.otActive=false;car.otLap=-1;
  camSnap=true; // jump the camera behind the car instead of flying across the map
}
let camSnap=false;
placeCarAtS(track.length-60);

function tireForces(alpha,FxDemand,cap,B,C){
  const a=clamp(alpha,-P.alphaMax,P.alphaMax);
  let Fy=-cap*Math.sin(C*Math.atan(B*a));
  let Fx=FxDemand;
  const mag=Math.hypot(Fx,Fy);
  let slide=0;
  if(mag>cap&&mag>1e-6){
    const k=cap/mag;slide=mag/cap-1;
    Fx*=k*P.kinetic;Fy*=k*P.kinetic;
  }
  const peak=Math.tan(Math.PI/(2*C))/B;
  slide=Math.max(slide,Math.max(0,Math.abs(alpha)/(peak*1.6)-1));
  return {Fx,Fy,slide,util:{x:Fy/cap,y:Fx/cap}};
}

let simT=0;
const timing={lapActive:false,lapStart:0,lapN:0,last:null,best:null,cp:0};
try{const b=localStorage.getItem('rbr2_best_'+track.id);if(b)timing.best=parseFloat(b);}catch(e){}
const msgs=[];
function msg(t,col){msgs.push({t,col:col||'#fff',until:simT+3.2});}
function fmtTime(t){
  if(t==null)return'--:--.---';
  const m=Math.floor(t/60),s=t-m*60;
  return m+':'+(s<10?'0':'')+s.toFixed(3);
}
function lapLogic(prevS,s,lat){
  const L=track.length,d=s-prevS;
  if(d<-L/2){
    if(timing.lapActive){
      const t=simT-timing.lapStart;
      if(timing.cp===track.CPS.length&&car.lapValid){
        timing.last=t;
        if(timing.best==null||t<timing.best){
          timing.best=t;msg('LAP '+fmtTime(t)+'  — NEW BEST','#7ee787');
          try{localStorage.setItem('rbr2_best_'+track.id,String(t));}catch(e){}
        }else msg('LAP '+fmtTime(t)+'  (+'+(t-timing.best).toFixed(3)+')','#ffd75e');
      }else msg('LAP INVALID — missed checkpoint','#ff6b60');
      // Overtake Mode detection point = the S/F line. Arm for the NEXT lap if
      // this lap finished within 1.0 s of the virtual rival (the best-lap
      // ghost) — i.e. you're within a second of the car ahead.
      if(timing.best!=null&&t-timing.best<1.0&&t-timing.best>-30){
        car.otAvail=true;msg('OVERTAKE MODE AVAILABLE — press SHIFT','#8fd0ff');
      }else car.otAvail=false;
    }
    // a new lap begins: any active boost from the previous lap expires here
    if(car.otActive){car.otActive=false;car.otLap=-1;}
    timing.lapActive=true;timing.lapStart=simT;timing.lapN++;timing.cp=0;car.lapValid=true;
  }else if(d>L/2){timing.lapActive=false;timing.cp=0;}
  else if(d>0){
    while(timing.cp<track.CPS.length&&prevS<track.CPS[timing.cp]&&s>=track.CPS[timing.cp]){
      if(Math.abs(lat)<20)timing.cp++;else break;
    }
  }
}

const key={up:false,down:false,left:false,right:false};
// mobile/touch: coarse primary pointer OR a touch-capable device with no
// hover (phones/tablets in any browser). Desktop keeps the keyboard path
// untouched. `?touch=1` / `?touch=0` force it on/off for testing. As a last
// line of defence, the first real touch on the canvas upgrades to touch mode
// at runtime (see the touchstart handler), so a misdetected phone can never
// be stuck with the desktop layout.
// touchSteerAxis is the analog steering-wheel input ([-1,1]); null = arrows/kbd.
let TOUCH=(()=>{
  const q=new URLSearchParams(location.search).get('touch');
  if(q==='1'||q==='0')return q==='1';
  if(matchMedia&&matchMedia('(pointer: coarse)').matches)return true;
  return navigator.maxTouchPoints>0&&matchMedia&&!matchMedia('(hover: hover)').matches;
})();
let touchSteerAxis=null;
let paused=false,showTelemetry=false,helpShown=false,camMode=0; // 0 chase 1 T-cam 2 cockpit
const CAM_NAMES=['CHASE CAM','T-CAM','COCKPIT CAM'];
const helpEl=document.getElementById('help');
// the controls panel lives in the pause menu now — never block the drive
// screen on load (task: intro popup -> settings/pause, like normal games)
// shown/hidden with a quick fade+scale so the pause menu feels responsive
// rather than popping (visibility keeps it non-interactive while hidden)
if(helpEl){
  helpEl.style.transition='opacity .16s ease,transform .16s ease,visibility .16s';
  helpEl.style.opacity='0';helpEl.style.visibility='hidden';
  helpEl.style.transform='translate(-50%,-50%) scale(0.96)';
}
function setHelp(v){
  helpShown=v;
  if(!helpEl)return;
  helpEl.style.opacity=v?'1':'0';
  helpEl.style.visibility=v?'visible':'hidden';
  helpEl.style.transform='translate(-50%,-50%) scale('+(v?1:0.96)+')';
}
// control actions — callable from either the keyboard or the on-screen buttons
function dismissHelp(){if(helpShown&&!paused)setHelp(false);}
function actReset(){placeCarAtS(car.s);car.lapValid=false;msg('RESET — lap invalidated','#ffb35e');}
function actPause(){paused=!paused;setHelp(paused);} // pause doubles as the settings/controls menu
function actTelemetry(){showTelemetry=!showTelemetry;}
function actCamera(){camMode=(camMode+1)%3;msg(CAM_NAMES[camMode],'#8fd0ff');}
function actTrack(){const cur=TRACK_IDS.indexOf(curTrackKey);switchTrack(TRACK_IDS[(cur+1)%TRACK_IDS.length]);}
function actAudio(){SND.init();SND.resume();msg(SND.toggleMute()?'AUDIO MUTED':'AUDIO ON','#8fd0ff');}
// Overtake Mode: player-triggered. Only fires when armed (within 1 s of the
// rival at the line) and the battery has meaningful charge to spend.
function actOvertake(){
  if(car.otActive)return;
  if(!car.otAvail){msg('OVERTAKE NOT AVAILABLE','#ff8a80');return;}
  if(car.ersE<P.ersCap*0.1){msg('OVERTAKE — BATTERY TOO LOW','#ff8a80');return;}
  car.otActive=true;car.otAvail=false;car.otLap=timing.lapN; // dies at the next line
  msg('OVERTAKE MODE ENGAGED','#ffd75e');
}
function setKey(e,v){
  let used=true;
  switch(e.key){
    case'ArrowUp':case'w':case'W':key.up=v;break;
    case'ArrowDown':case's':case'S':key.down=v;break;
    case'ArrowLeft':case'a':case'A':key.left=v;break;
    case'ArrowRight':case'd':case'D':key.right=v;break;
    default:used=false;
  }
  if(v){
    SND.init();SND.resume();               // audio must start inside a user gesture
    dismissHelp();
    const k=e.key.toLowerCase();
    if(e.key==='Shift')actOvertake();      // Overtake Mode (edge-triggered)
    if(k==='r')actReset();
    if(k==='p')actPause();
    if(k==='t')actTelemetry();
    if(k==='c')actCamera();
    if(k==='n'&&TRACK_IDS.length>1)actTrack();
    if(k==='m')actAudio();
    if(k==='h')setHelp(!helpShown);
    if(e.key==='Escape')window.location.href='index.html#tracks'; // back to track select
  }
  if(used)e.preventDefault();
}
addEventListener('keydown',e=>setKey(e,true));
addEventListener('keyup',e=>setKey(e,false));

// ---- on-screen buttons (mouse / touch), so the keyboard isn't required ----
// filled in drawHUD each frame; each entry {x,y,w,h,act}
let hudButtons=[];
const _canvasEl=document.getElementById('c');
function pointerAt(clientX,clientY){
  const r=_canvasEl.getBoundingClientRect();
  return[(clientX-r.left)*(W/r.width),(clientY-r.top)*(H/r.height)];
}
function hudClick(px,py){
  for(const b of hudButtons){
    if(px>=b.x&&px<=b.x+b.w&&py>=b.y&&py<=b.y+b.h){b.act();return true;}
  }
  return false;
}
_canvasEl.addEventListener('mousedown',e=>{
  SND.init();SND.resume();dismissHelp();
  const[px,py]=pointerAt(e.clientX,e.clientY);
  if(hudClick(px,py))e.preventDefault();
});
_canvasEl.addEventListener('touchstart',e=>{
  SND.init();SND.resume();dismissHelp();
  // safety net: a real touch on a page that detected as desktop means the
  // detection was wrong — upgrade to the touch layout on the spot
  if(!TOUCH){TOUCH=true;initTouchUI();}
  const t=e.changedTouches[0];const[px,py]=pointerAt(t.clientX,t.clientY);
  if(hudClick(px,py))e.preventDefault();
},{passive:false});

const DT=1/120;
function step(dt,surf){
  simT+=dt;
  const spd=Math.hypot(car.vx,car.vy);
  // analog steering wheel (touch) feeds a proportional target; otherwise the
  // digital left/right from keyboard or the on-screen arrow buttons
  const st=touchSteerAxis!==null?touchSteerAxis:(key.left?-1:0)+(key.right?1:0);
  const pressRate=3.2/(1+spd/60); // gentler lock-to-lock at speed
  const sRate=st!==0?(Math.sign(st)!==Math.sign(car.steer)&&car.steer!==0?9.0:pressRate):6.0;
  car.steer+=clamp(st-car.steer,-sRate*dt,sRate*dt);
  car.throttle+=clamp((key.up&&!car.reverse?1:0)-car.throttle,-8*dt,(spd<25?2.2:4.5)*dt);
  car.brake+=clamp((key.down&&!car.reverse?1:0)-car.brake,-9*dt,4.5*dt);
  if(Math.abs(car.vx)>15)car.fastT=simT; // reverse only from an intentional standstill
  if(!car.reverse){                      // hold, never mid-corner during a hard stop
    if(key.down&&Math.abs(car.vx)<0.5&&simT-car.fastT>1)car.revT+=dt;else car.revT=0;
    if(car.revT>0.35){car.reverse=true;car.revT=0;}
  }else if(key.up||car.vx>0.5){car.reverse=false;}

  const q=surf?{idx:car.tIdx,s:car.s,lat:0,mu:surf.mu!==undefined?surf.mu:1,
    grass:!!surf.grass,kerb:!!surf.kerb,gravel:!!surf.gravel,elev:car.elev}
    :trackQuery(car.x,car.y,car);
  car.lat=q.lat;car.grass=q.grass;car.kerb=q.kerb;car.gravel=q.gravel;car.elev=q.elev;
  const sp=spd;
  const delta=car.steer*P.steerMax/(1+sp/P.steerFade);
  car.delta=delta;

  const qd=0.5*P.rho*sp*sp;
  // 2026 active aero — automatic, on ALL straights. Wings trim to Straight
  // Mode when the next corner is far enough away and we're quick and settled;
  // they load back to Corner Mode approaching the turn. Both wings move
  // together, so aeroDF trims front + rear equally (aero balance preserved).
  const distNext=surf?(surf.cd!==undefined?surf.cd:1e9):track.cd[q.idx];
  const wantOpen=distNext>90&&car.vx>30&&car.brake<0.05&&!car.reverse?1:0;
  car.aeroOpen=wantOpen;
  car.wingFlap+=(wantOpen-car.wingFlap)*Math.min(1,dt*6); // smoothed render + force blend
  const aeroT=car.wingFlap;
  const drag=P.CdA*(1-(1-P.aeroDrag)*aeroT)*qd;          // less drag as wings open
  const dfScale=1-(1-P.aeroDF)*aeroT;                    // less downforce as wings open
  const DFf=P.ClA*P.aeroBalance*qd*dfScale;
  const DFr=P.ClA*(1-P.aeroBalance)*qd*dfScale;

  const trans=P.mass*car.axS*P.hCG/P.wheelbase;
  const FzF=Math.max(150,P.mass*9.81*P.weightFront+DFf-trans);
  const FzR=Math.max(150,P.mass*9.81*(1-P.weightFront)+DFr+trans);
  car.FzF=FzF;car.FzR=FzR;
  let grip=P.mu*q.mu;
  // per-track grip patches (deterministic in s, ~75/250 m wavelengths)
  if(P.gripVar)grip*=1+P.gripVar*Math.sin(car.s*0.043)*Math.sin(car.s*0.0127+2.1);
  const capF=grip*P.muFront*FzF,capR=grip*P.muRear*FzR;

  const dir=car.vx>=0?1:-1;
  let driveF=0;
  // 2026 energy management: the battery auto-deploys on power application and
  // recharges under braking / lift-and-coast. Flat battery = ICE-only power
  // (425 kW instead of 775), so the car visibly dies at the top of the gears.
  car.ersMode=0;car.ersFlow=0;
  if(!car.reverse){
    let pwr=P.icePower;
    // Overtake Mode raises the deploy ceiling (350 -> 450 kW) for the boost
    const deployMax=car.otActive?P.ersPowerOT:P.ersPower;
    if(car.throttle>0.5&&sp>22&&car.ersE>0){
      // deploy is strongest at corner-exit speeds and fades toward top speed,
      // so straights don't drain the whole battery ("clipping")
      const taper=clamp((P.ersDeployHi-sp)/(P.ersDeployHi-P.ersDeployLo),0,1);
      const pe=Math.min(deployMax*taper,car.ersE/dt);
      if(pe>1000){
        pwr+=pe;
        car.ersE=Math.max(0,car.ersE-pe*car.throttle*dt);
        car.ersMode=car.otActive?3:1;car.ersFlow=pe*car.throttle; // 3 = overtake boost
      }
    }
    driveF=car.throttle*Math.min(P.maxDriveForce,pwr/Math.max(sp,6));
    const tc=clamp((car.slideR-0.2)*P.assistTC*2.5,0,0.55); // traction assist
    driveF*=(1-tc);
  }else if(key.down&&car.vx>-7)driveF=-3800;
  // harvest: brake regen, lift-and-coast, part-throttle trickle
  if(!car.reverse&&sp>8&&car.ersE<P.ersCap&&car.ersMode!==1){
    let hv=0;
    if(car.brake>0.1)hv=P.ersHarvestBrake*car.brake;
    else if(car.throttle<0.05&&sp>20)hv=P.ersHarvestLift;
    else if(car.throttle>0.02&&car.throttle<0.5)hv=P.ersHarvestPart;
    if(hv>0){
      car.ersE=Math.min(P.ersCap,car.ersE+hv*dt);
      car.ersMode=2;car.ersFlow=hv;
    }
  }
  let brkF=car.brake*P.brakeForce*P.brakeBias;
  if(car.slideF>0.35)brkF*=1-P.assistABS; // brake assist: release locked fronts
  const brkR=car.brake*P.brakeForce*(1-P.brakeBias);
  const FxFd=-dir*brkF;
  let FxRd=driveF-dir*brkR;
  if(car.throttle<0.02&&!car.reverse&&Math.abs(car.vx)>2)FxRd-=dir*P.engineBrake;

  if(car.vx>1.2){
    const vxs=Math.max(car.vx,3);
    // steering self-alignment assist: chassis sideslip contribution to front
    // slip is relaxed, which auto-countersteers small slides
    const af=(1-P.assistAlign)*Math.atan2(car.vy+P.a*car.r,vxs)-delta;
    const ar=Math.atan2(car.vy-P.b*car.r,vxs);
    car.alphaF=af;car.alphaR=ar;
    const tf=tireForces(af,FxFd,capF,P.Bf,P.Cf);
    const tr=tireForces(ar,FxRd,capR,P.Br,P.Cr);
    const cd=Math.cos(delta),sd=Math.sin(delta);
    const FxF=tf.Fx*cd-tf.Fy*sd,FyF=tf.Fx*sd+tf.Fy*cd;
    const roll=P.rollC*(FzF+FzR)*dir
      +(q.grass?(500+7*sp*sp)*dir:0)    // quadratic: grass is undrivable at speed
      +(q.gravel?(900+12*sp*sp)*dir:0)  // gravel bleeds speed hard
      +(q.kerb?60*P.kerbAggr*dir:0);
    const Fx=FxF+tr.Fx-drag*dir-roll;
    const Fy=FyF+tr.Fy;
    const axB=Fx/P.mass,ayB=Fy/P.mass;
    car.vx+=(axB+car.vy*car.r)*dt;
    car.vy+=(ayB-car.vx*car.r)*dt;
    car.r+=((P.a*FyF-P.b*tr.Fy-P.yawDamp*car.r)/P.Iz)*dt;
    car.r=clamp(car.r,-3.5,3.5);
    const bl=clamp((sp-1.2)/3,0,1);
    if(bl<1){
      const rk=car.vx*Math.tan(delta)/P.wheelbase;
      car.r+=(rk-car.r)*(1-bl)*Math.min(1,dt*10);
      car.vy*=1-(1-bl)*Math.min(1,dt*8);
    }
    const beta=Math.atan2(car.vy,Math.max(Math.abs(car.vx),1));
    if(Math.abs(beta)>P.betaMax){
      const target=Math.tan(P.betaMax)*Math.max(Math.abs(car.vx),1)*Math.sign(car.vy);
      car.vy+=(target-car.vy)*Math.min(1,dt*6);
      car.r*=Math.max(0,1-dt*3);
    }
    car.axS+=(axB-car.axS)*Math.min(1,dt*7);
    car.ayS+=(car.vx*car.r-car.ayS)*Math.min(1,dt*7);
    car.slideF=tf.slide;car.slideR=tr.slide;
    car.utilF=tf.util;car.utilR=tr.util;
  }else{
    const rk=car.vx*Math.tan(delta)/P.wheelbase;
    car.r+=(rk-car.r)*Math.min(1,dt*10);
    car.vy*=Math.max(0,1-dt*8);
    let F=FxRd+FxFd-drag*dir;
    if(Math.abs(car.vx)>0.05)F-=dir*(P.rollC*(FzF+FzR)+(q.grass?900:q.gravel?1800:60));
    car.vx+=F/P.mass*dt;
    if(car.reverse&&car.vx<-7)car.vx=-7;
    if(Math.abs(car.vx)<0.15&&car.throttle<0.05&&!(car.reverse&&key.down)&&car.brake>0)car.vx=0;
    car.axS+=(F/P.mass-car.axS)*Math.min(1,dt*7);
    car.ayS*=Math.max(0,1-dt*6);
    car.slideF=car.slideR=0;car.utilF={x:0,y:0};car.utilR={x:0,y:0};
    car.alphaF=0;car.alphaR=0;
  }
  // visual body dynamics — kerb/gravel rumble is render-only: kerbShake ramps
  // with speed on rough surfaces and drives per-axle critically-damped springs;
  // it must never feed car.r / car.vx / car.vy
  const shakeT=(q.kerb||q.gravel)&&sp>4?clamp(sp/60,0,1):0;
  car.kerbShake+=(shakeT-car.kerbShake)*Math.min(1,dt*(shakeT>car.kerbShake?16:7));
  const rough=(q.gravel?0.022:q.kerb?0.034*P.kerbAggr:0)*car.kerbShake;
  const wRum=Math.min(90,26+sp*1.1);        // rumble freq, below the 120Hz sim Nyquist
  const K_SUS=900,D_SUS=2*Math.sqrt(K_SUS); // critical damping: settles ~200ms, no overshoot
  const tgtF=rough*Math.sin(simT*wRum),tgtR=rough*Math.sin(simT*wRum+2.2);
  car.susVelF+=(K_SUS*(tgtF-car.susF)-D_SUS*car.susVelF)*dt;car.susF+=car.susVelF*dt;
  car.susVelR+=(K_SUS*(tgtR-car.susR)-D_SUS*car.susVelR)*dt;car.susR+=car.susVelR*dt;
  car.pitchV+=(clamp(-car.axS*0.0035,-0.045,0.045)-car.pitchV)*Math.min(1,dt*8);
  car.rollV+=(clamp(car.ayS*0.0045,-0.05,0.05)-car.rollV)*Math.min(1,dt*8);
  car.bounce=car.susF+car.susR;
  // wheel rotation state: fronts freeze when locked, rears overspin on power
  const spinRate=car.vx/0.35;
  car.spinF+=(car.brake>0.4&&car.slideF>0.35?spinRate*0.08:spinRate)*dt;
  car.spinR+=spinRate*(1+(car.throttle>0.3&&car.slideR>0.2?Math.min(1.2,car.slideR):0))*dt;

  const cs=Math.cos(car.heading),sn=Math.sin(car.heading);
  car.x+=(car.vx*cs-car.vy*sn)*dt;
  car.y+=(car.vx*sn+car.vy*cs)*dt;
  car.heading+=car.r*dt;

  // street-circuit walls: hard barrier just past the kerb (Monaco has no runoff)
  if(!surf&&track.walled){
    const wq=trackQuery(car.x,car.y,car);
    const limit=HALF_W+KERB_W+0.35;
    if(Math.abs(wq.lat)>limit){
      const side=Math.sign(wq.lat);
      const push=Math.abs(wq.lat)-limit;
      car.x-=track.NX[wq.idx]*side*push;car.y-=track.NY[wq.idx]*side*push;
      // impact-angle-aware response: kill/bounce only the velocity component
      // along the wall normal; tangential scrub + yaw kill scale with severity
      const ch=Math.cos(car.heading),sh=Math.sin(car.heading);
      let wx=car.vx*ch-car.vy*sh,wy=car.vx*sh+car.vy*ch;
      const nx=track.NX[wq.idx]*side,ny=track.NY[wq.idx]*side; // outward normal
      const vn=wx*nx+wy*ny;
      if(vn>0){
        const sev=Math.min(1,vn/Math.max(6,Math.hypot(wx,wy)||1)); // 0 glancing .. 1 head-on
        wx-=1.15*vn*nx;wy-=1.15*vn*ny;                 // remove normal comp + 15% bounce
        const keep=Math.exp(-(1.5+25*sev)*dt);         // tangential scrub, dt-scaled
        wx*=keep;wy*=keep;car.r*=1-0.6*sev;
        car.vx=wx*ch+wy*sh;car.vy=-wx*sh+wy*ch;
      }
      car.wallHit=simT;
    }
  }

  if(!isFinite(car.vx)||!isFinite(car.vy)||!isFinite(car.r)||!isFinite(car.x)||!isFinite(car.y)){
    car.nanEvents++;console.warn('physics NaN — resetting car');
    placeCarAtS(isFinite(car.s)?car.s:0);
  }
  if(!surf){
    car.prevS=car.s;car.s=q.s;
    lapLogic(car.prevS,car.s,q.lat);
  }
}

// =========================================================================
// EFFECTS — surface-aware particles + skids
// =========================================================================
const parts=[],skids=[];
const wheelOff=[[P.a,-0.82],[P.a,0.82],[-P.b,-0.86],[-P.b,0.86]];
const prevWheel=[null,null,null,null];
function wheelWorld(i){
  const cs=Math.cos(car.heading),sn=Math.sin(car.heading);
  const[dx,dy]=wheelOff[i];
  return[car.x+dx*cs-dy*sn,car.y+dx*sn+dy*cs];
}
function spawnPart(w,kind,slide){
  if(parts.length>200)parts.shift();
  const cfg=kind==='smoke'?{c:[205,205,210],a:0.06+slide*0.10,s:0.40,g:1.0}
    :kind==='dust'?{c:[142,120,78],a:0.10+slide*0.12,s:0.55,g:1.6}
    :{c:[126,104,72],a:0.14+slide*0.14,s:0.7,g:2.0}; // gravel
  parts.push({x:w[0]+(Math.random()-.5)*.5,y:w[1]+(Math.random()-.5)*.5,
    e:car.elev,h:0.25,vx:(Math.random()-.5)*3,vy:(Math.random()-.5)*3,
    s:cfg.s+Math.random()*0.3,a:Math.min(0.22,cfg.a),c:cfg.c,g:cfg.g,
    life:0.5+Math.random()*0.45,t:0});
}
function updateFX(dt){
  const sp=Math.hypot(car.vx,car.vy);
  for(let i=0;i<4;i++){
    const front=i<2,slide=front?car.slideF:car.slideR;
    const w=wheelWorld(i);
    const jumped=prevWheel[i]&&((w[0]-prevWheel[i][0])**2+(w[1]-prevWheel[i][1])**2>225);
    if(jumped)prevWheel[i]=w;
    // surface-aware: tarmac smokes only on real slides; grass/gravel dust easily
    if(sp>5){
      if(car.gravel&&(sp>8||slide>0.05)){if(Math.random()<0.55)spawnPart(w,'gravel',slide);}
      else if(car.grass&&(sp>10||slide>0.05)){if(Math.random()<0.4)spawnPart(w,'dust',slide);}
      else if(!car.grass&&!car.gravel&&slide>0.12&&Math.random()<0.4)
        spawnPart(w,'smoke',slide);
    }
    if(slide>0.08&&sp>4&&!car.grass&&!car.gravel&&prevWheel[i]&&(!front||slide>0.15)){
      if(skids.length>360)skids.shift();
      skids.push({x1:prevWheel[i][0],y1:prevWheel[i][1],x2:w[0],y2:w[1],
        e:car.elev,a:Math.min(0.5,0.15+slide*0.4)});
    }
    prevWheel[i]=w;
  }
  for(let i=parts.length-1;i>=0;i--){
    const p=parts[i];p.t+=dt;
    if(p.t>p.life){parts.splice(i,1);continue;}
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.h+=dt*1.2;p.vx*=0.96;p.vy*=0.96;p.s+=dt*p.g;
  }
  for(let i=skids.length-1;i>=0;i--){skids[i].a-=dt*0.02;if(skids[i].a<0.04)skids.splice(i,1);}
}

// =========================================================================
// CAMERA — chase / T-cam / cockpit
// =========================================================================
const cam={gx:car.x-10,gy:car.y,h:car.elev+3.3,yaw:car.heading,pitch:0.15,fl:1};
let flCur=0;
function updateCamera(fdt){
  const t=[Math.cos(car.heading),Math.sin(car.heading)];
  let tgx,tgy,th,tpitch,posK,yawK,flT,hK;
  if(camMode===0){
    // pulled back + raised: whole car (wing, tyres, halo) sits in the bottom
    // third of the frame with the track ahead, like a modern F1 game chase cam
    tgx=car.x-t[0]*13.0;tgy=car.y-t[1]*13.0;th=car.elev+4.0;
    tpitch=0.035;
    posK=1-Math.exp(-6*fdt);yawK=1-Math.exp(-4.2*fdt);flT=0.92;
  }else if(camMode===1){ // T-cam: above the airbox, like TV onboard
    tgx=car.x-t[0]*1.45;tgy=car.y-t[1]*1.45;th=car.elev+2.35;
    tpitch=0.17;
    posK=1-Math.exp(-30*fdt);yawK=1-Math.exp(-20*fdt);flT=0.86;
    hK=1-Math.exp(-12*fdt); // damp the height channel so bumps don't shake the view
  }else{
    tgx=car.x+t[0]*0.35;tgy=car.y+t[1]*0.35;th=car.elev+1.12;
    tpitch=0.035;
    posK=1-Math.exp(-25*fdt);yawK=1-Math.exp(-18*fdt);flT=0.80;
    hK=1-Math.exp(-12*fdt);
  }
  if(hK===undefined)hK=posK; // chase cam: height follows the (already soft) position
  if(camSnap){posK=1;yawK=1;hK=1;flCur=flT;camSnap=false;} // reset/track-switch: jump, don't fly
  cam.gx=lerp(cam.gx,tgx,posK);cam.gy=lerp(cam.gy,tgy,posK);
  cam.h=lerp(cam.h,th,hK);
  cam.yaw=lerpAngle(cam.yaw,car.heading,yawK);
  cam.pitch=lerp(cam.pitch,tpitch,posK);
  flCur=flCur?lerp(flCur,flT,Math.min(1,fdt*6)):flT;
}

// =========================================================================
// RENDERER
// =========================================================================
const cv=document.getElementById('c'),ctx=cv.getContext('2d');
let W=0,H=0,DPR=1,FL=800,CX=0,CY=0;
function resize(){
  DPR=Math.min(2,devicePixelRatio||1);
  W=innerWidth;H=innerHeight;
  cv.width=W*DPR;cv.height=H*DPR;
  cv.style.width=W+'px';cv.style.height=H+'px';
}
addEventListener('resize',resize);resize();

const NEAR=0.45,FAR=780;
// per-track atmosphere (def.atmo): sky gradient, fog tint, night mode
const ATMO=Object.assign({skyTop:'#6f9fd0',skyMid:'#b8d0e4',skyBot:'#e6edf2',
  fog:[188,200,206],sun:true,night:false},TRACKS[Object.keys(TRACKS)[0]].atmo||{});
const FOG=ATMO.fog,ASPHALT=[52,54,58];
let _cs=1,_sn=0,_cp=1,_sp=0;
function camSpace(wx,wy,we){
  const dx=wx-cam.gx,dy=wy-cam.gy,dh=we-cam.h;
  const zf=dx*_cs+dy*_sn,xr=-dx*_sn+dy*_cs;
  return[xr,dh*_cp+zf*_sp,zf*_cp-dh*_sp];
}
function projectPoly(pts){
  const poly=[];
  for(let i=0;i<pts.length;i++)poly.push(camSpace(pts[i][0],pts[i][1],pts[i][2]));
  const out=[];
  for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length];
    const ain=a[2]>NEAR,bin=b[2]>NEAR;
    if(ain)out.push(a);
    if(ain!==bin){
      const tt=(NEAR-a[2])/(b[2]-a[2]);
      out.push([a[0]+(b[0]-a[0])*tt,a[1]+(b[1]-a[1])*tt,NEAR]);
    }
  }
  if(out.length<3)return null;
  const scr=[];
  for(const p of out)scr.push([CX+p[0]*FL/p[2],CY-p[1]*FL/p[2],p[2]]);
  return scr;
}
function fogMix(base,t){
  const r=Math.round(lerp(base[0],FOG[0],t)),g=Math.round(lerp(base[1],FOG[1],t)),
        b=Math.round(lerp(base[2],FOG[2],t));
  return`rgb(${r},${g},${b})`;
}
function fillPoly(pts,style){
  ctx.fillStyle=style;ctx.beginPath();
  ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
  ctx.closePath();ctx.fill();
}
function fogQuadFill(pts,base,t){const pp=projectPoly(pts);if(pp)fillPoly(pp,fogMix(base,t));return null;}

// ---------- car mesh: lofted smooth hull, Ferrari-style livery ----------
// local coords: x forward, y up, z right. Body is a loft of 6-point cross
// sections (one continuous surface nose->tail), not stacked boxes.
// livery: the home page writes {primary:[r,g,b], accent:[r,g,b], number}
// to localStorage('f1sim-livery'); default is the Ferrari-style red
const LIVERY=(()=>{try{return JSON.parse(localStorage.getItem('f1sim-livery'))||{};}catch(e){return{};}})();
const C_RED=LIVERY.primary||[198,30,26],
      C_WHITE=LIVERY.accent||[230,230,226],
      CAR_NUM=String(LIVERY.number||1).slice(0,2),
      C_PRIM_DIM=[C_RED[0]*0.55|0,C_RED[1]*0.55|0,C_RED[2]*0.55|0],
      C_BLACK=[24,24,27],
      C_DARK=[13,14,18],C_TIRE=[28,28,31],C_YEL=[236,194,52];
const carFaces=[]; // static local-space faces {v:[[x,y,z]...], col, tag}
function fq(v,col,tag){carFaces.push({v,col,tag});}
function dq(v,col,tag){fq(v,col,tag);fq([...v].reverse(),col,tag);} // double-sided plate
function ring(x,w,h,y0,tf){ // 6-pt cross section: BL,ML,TL,TR,MR,BR
  return[[x,y0,-w*0.9],[x,y0+h*0.5,-w],[x,y0+h,-w*tf],
         [x,y0+h,w*tf],[x,y0+h*0.5,w],[x,y0,w*0.9]];
}
const WHEELS=[ // F1 spec: equal diameter front/rear, wide rears standing proud
  {cx:1.72,cz:-0.82,r:0.355,w:0.31,front:true},
  {cx:1.72,cz:0.82,r:0.355,w:0.31,front:true},
  {cx:-1.70,cz:-0.86,r:0.36,w:0.42,front:false},
  {cx:-1.70,cz:0.86,r:0.36,w:0.42,front:false},
];
(function buildCar(){
  // --- body loft: nose tip -> tail ---
  const S=[
    ring(3.10,0.05,0.06,0.40,0.6), ring(2.65,0.13,0.15,0.36,0.6),
    ring(2.10,0.20,0.22,0.31,0.55),ring(1.55,0.30,0.30,0.25,0.5),
    ring(1.05,0.45,0.46,0.17,0.42),ring(0.55,0.60,0.55,0.13,0.40),
    ring(0.05,0.74,0.60,0.10,0.45),ring(-0.70,0.76,0.58,0.09,0.42),
    ring(-1.40,0.58,0.48,0.10,0.38),ring(-2.00,0.36,0.36,0.13,0.42),
    ring(-2.45,0.18,0.24,0.17,0.5),
  ];
  const topCol=si=>(si===4||si===5)?C_DARK:C_WHITE; // dark cockpit; accent stripe down the nose + spine
  for(let i=0;i<S.length-1;i++){
    const A=S[i],B=S[i+1];
    for(let j=0;j<6;j++){
      const k=(j+1)%6;
      fq([A[j],B[j],B[k],A[k]],j===5?C_DARK:(j===2?topCol(i):C_RED));
    }
  }
  const F=S[0];fq([F[5],F[4],F[3],F[2],F[1],F[0]],C_RED);       // nose cap
  const T=S[S.length-1];fq([T[0],T[1],T[2],T[3],T[4],T[5]],C_PRIM_DIM); // tail cap (dimmed livery colour)
  // floor plank
  fq([[1.6,0.10,-0.85],[-2.2,0.10,-0.92],[-2.2,0.10,0.92],[1.6,0.10,0.85]],C_DARK);
  // --- airbox + engine spine (4-pt loft) + intake ---
  const A1=[[0.15,0.72,-0.22],[0.15,1.10,-0.13],[0.15,1.10,0.13],[0.15,0.72,0.22]];
  const A2=[[-0.9,0.60,-0.18],[-0.9,1.00,-0.10],[-0.9,1.00,0.10],[-0.9,0.60,0.18]];
  const A3=[[-2.30,0.45,-0.08],[-2.30,0.62,-0.05],[-2.30,0.62,0.05],[-2.30,0.45,0.08]];
  for(const[Pa,Pb]of[[A1,A2],[A2,A3]])
    for(let j=0;j<4;j++){const k=(j+1)%4;
      fq([Pa[j],Pb[j],Pb[k],Pa[k]],j===1?C_WHITE:C_RED);}
  fq([A1[3],A1[2],A1[1],A1[0]],C_DARK);                          // intake mouth
  fq([[0.15,1.10,-0.06],[0.15,1.22,-0.06],[0.15,1.22,0.06],[0.15,1.10,0.06]],C_DARK); // T-cam pod hint
  // --- shark fin ---
  dq([[-1.00,0.96,0],[-2.32,0.64,0],[-2.32,0.46,0],[-1.00,0.62,0]],C_RED,'fin');
  // --- halo: smooth hoop (10 segs) + widening centre pillar, body red ---
  const hoop=[];
  for(let k=0;k<=10;k++){
    const a=k/10*TAU;
    hoop.push([0.40+Math.cos(a)*0.54,Math.sin(a)*0.35]);
  }
  for(let k=0;k<10;k++){
    const[p0x,p0z]=hoop[k],[p1x,p1z]=hoop[k+1];
    dq([[p0x,1.07,p0z],[p1x,1.07,p1z],[p1x,0.99,p1z],[p0x,0.99,p0z]],C_RED,'halo');
    const i0x=0.40+(p0x-0.40)*0.84,i0z=p0z*0.84,i1x=0.40+(p1x-0.40)*0.84,i1z=p1z*0.84;
    fq([[p0x,1.07,p0z],[p1x,1.07,p1z],[i1x,1.07,i1z],[i0x,1.07,i0z]],C_RED,'halo');
  }
  dq([[0.93,0.64,-0.025],[0.93,0.64,0.025],[0.91,1.02,0.08],[0.91,1.02,-0.08]],C_RED,'halo');
  // --- helmet (yellow, red stripe, dark visor) ---
  const HS=[ring(0.54,0.13,0.08,0.68,0.8),ring(0.42,0.17,0.22,0.66,0.7),
            ring(0.18,0.16,0.21,0.66,0.7),ring(0.05,0.10,0.12,0.68,0.8)];
  for(let i=0;i<HS.length-1;i++)for(let j=0;j<6;j++){const k=(j+1)%6;
    fq([HS[i][j],HS[i+1][j],HS[i+1][k],HS[i][k]],j===2?C_RED:C_YEL);}
  const HF=HS[0];fq([HF[5],HF[4],HF[3],HF[2],HF[1],HF[0]],[18,18,22]); // visor
  // --- mirrors ---
  for(const s of[-1,1])
    dq([[0.85,0.84,s*0.52],[0.85,0.84,s*0.66],[0.83,0.93,s*0.66],[0.83,0.93,s*0.52]],C_RED);
  // --- front wing: 3 swept elements + endplates (black, 2022 style) ---
  const fwEl=(y,chord,lead,tag)=>{
    for(const s of[-1,1])
      dq([[lead,y,0],[lead-0.15,y+0.03,s*0.94],[lead-0.15-chord,y+0.07,s*0.94],[lead-chord,y+0.04,0]],C_BLACK,tag);
  };
  fwEl(0.07,0.50,3.12);fwEl(0.14,0.40,3.02);fwEl(0.21,0.30,2.92,'fwflap'); // top element = active-aero flap
  for(const s of[-1,1])
    dq([[3.12,0.05,s*0.96],[2.55,0.05,s*0.96],[2.55,0.44,s*0.96],[3.12,0.30,s*0.96]],C_BLACK);
  // --- rear wing: endplates + main + active-aero flap + beam + pylon ---
  for(const s of[-1,1])
    dq([[-2.26,0.55,s*0.50],[-2.76,0.55,s*0.50],[-2.76,1.12,s*0.50],[-2.26,1.12,s*0.50]],C_BLACK);
  const rwq=(x0,y0,x1,y1,tag)=>dq([[x0,y0,-0.51],[x0,y0,0.51],[x1,y1,0.51],[x1,y1,-0.51]],C_BLACK,tag);
  rwq(-2.32,0.86,-2.62,0.94);          // main plane
  rwq(-2.46,0.96,-2.72,1.08,'flap');   // active-aero flap (opens in Straight Mode)
  rwq(-2.34,0.60,-2.58,0.65);          // beam wing
  dq([[-2.42,0.45,0],[-2.42,0.86,0],[-2.55,0.86,0],[-2.55,0.45,0]],C_DARK);
  // --- suspension wishbones ---
  for(const s of[-1,1]){
    dq([[1.55,0.42,s*0.30],[1.62,0.42,s*0.30],[1.76,0.36,s*0.70],[1.69,0.36,s*0.70]],C_DARK);
    dq([[1.85,0.28,s*0.30],[1.92,0.28,s*0.30],[1.78,0.30,s*0.70],[1.71,0.30,s*0.70]],C_DARK);
    dq([[-1.60,0.44,s*0.30],[-1.53,0.44,s*0.30],[-1.66,0.38,s*0.72],[-1.73,0.38,s*0.72]],C_DARK);
    dq([[-1.85,0.30,s*0.30],[-1.78,0.30,s*0.30],[-1.72,0.30,s*0.72],[-1.79,0.30,s*0.72]],C_DARK);
  }
  // (tires are built dynamically each frame in drawCarMesh so they rotate)
})();
function drawCarMesh(){
  const ch=Math.cos(car.heading),sh=Math.sin(car.heading);
  const pitchTot=car.pitchV+(car.susR-car.susF)*0.30;
  const cpr=Math.cos(pitchTot),spr=Math.sin(pitchTot);
  const crl=Math.cos(car.rollV),srl=Math.sin(car.rollV);
  const bnc=car.bounce,light=[0.42,0.80,0.30];
  function toWorld(lx,ly,lz,isWheel,steer){
    if(steer){
      const pz=lz<0?-0.80:0.80;
      const dx=lx-1.72,dz2=lz-pz;
      const ca=Math.cos(car.delta),sa=Math.sin(car.delta);
      lx=1.72+dx*ca-dz2*sa;lz=pz+dx*sa+dz2*ca;
    }
    if(!isWheel){ // body pitch + roll about y=0.4
      let dy=ly-0.4;
      const nx=lx*cpr-dy*spr,ny=lx*spr+dy*cpr;
      lx=nx;ly=0.4+ny;
      dy=ly-0.4;
      const nz=lz*crl-dy*srl,ny2=lz*srl+dy*crl;
      lz=nz;ly=0.4+ny2+bnc;
    }
    return[car.x+lx*ch-lz*sh,car.y+lx*sh+lz*ch,car.elev+ly+0.03];
  }
  const faces=[];
  function pushFace(wp,col,alpha){
    const a=wp[0],b=wp[1],c2=wp[2];
    const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c2[0]-a[0],c2[1]-a[1],c2[2]-a[2]];
    const nx=u[1]*v[2]-u[2]*v[1],ny=u[2]*v[0]-u[0]*v[2],ne=u[0]*v[1]-u[1]*v[0];
    let cx4=0,cy4=0,ce4=0;
    for(const p of wp){cx4+=p[0];cy4+=p[1];ce4+=p[2];}
    cx4/=wp.length;cy4/=wp.length;ce4/=wp.length;
    if(nx*(cx4-cam.gx)+ny*(cy4-cam.gy)+ne*(ce4-cam.h)>0)return;
    const zc=camSpace(cx4,cy4,ce4)[2];
    if(zc<NEAR)return;
    const nl=Math.hypot(nx,ny,ne)||1;
    // directional light + cheap ambient occlusion: faces near the floor sit
    // in the car's own shadow, so the body reads as a form, not a flat colour
    const ao=0.80+0.20*clamp((ce4-car.elev)/0.85,0,1);
    const lum=(0.62+0.38*Math.max(0,(nx*light[0]+ny*light[2]+ne*light[1])/nl))*ao;
    const cs2=`rgb${alpha!==undefined?'a':''}(${Math.round(col[0]*lum)},${Math.round(col[1]*lum)},${Math.round(col[2]*lum)}${alpha!==undefined?','+alpha.toFixed(2):''})`;
    faces.push({z:zc,f:wp,col:cs2});
  }
  for(const part of carFaces){
    // cockpit view: only the forward bodywork (nose, front wing, front
    // suspension) is drawn in 3D — the cockpit surround is the 2D overlay
    if(camMode===2){
      let mx=-99;for(const p of part.v)if(p[0]>mx)mx=p[0];
      if(mx<0.95)continue;
    }
    const isWheel=part.tag&&part.tag[0]==='w';
    const isFrontW=part.tag==='wF';
    let vs=part.v;
    // 2026 active aero: both wing flaps rotate open together as wingFlap->1
    // (Straight Mode). Rear flap hinges at its trailing top; front flap at
    // its leading edge, opening downward — mirror-image motion, one control.
    if(part.tag==='flap'&&car.wingFlap>0.001){
      const ang=car.wingFlap*0.95,hx=-2.72,hy=1.08;
      const ca=Math.cos(ang),sa=Math.sin(ang);
      vs=vs.map(([lx,ly,lz])=>{const dx=lx-hx,dy=ly-hy;
        return[hx+dx*ca+dy*sa,hy-dx*sa+dy*ca,lz];});
    }else if(part.tag==='fwflap'&&car.wingFlap>0.001){
      const ang=car.wingFlap*0.5,hx=2.92,hy=0.21;
      const ca=Math.cos(ang),sa=Math.sin(ang);
      vs=vs.map(([lx,ly,lz])=>{const dx=lx-hx,dy=ly-hy;
        return[hx+dx*ca-dy*sa,hy+dx*sa+dy*ca,lz];});
    }
    pushFace(vs.map(([lx,ly,lz])=>toWorld(lx,ly,lz,isWheel,isFrontW)),part.col);
  }
  // ---- wheels, rebuilt every frame so the WHOLE tire rotates ----
  // 3D barrel profile (rounded shoulders), alternating tread shades spinning
  // with the wheel (contrast blurs out at speed), rim + spokes + yellow
  // sidewall marks on the caps. Fronts freeze when locked under braking,
  // rears overspin under power (spinF/spinR from the physics step).
  const treadC=clamp(1.25-Math.abs(car.vx)/25,0.12,1);
  const spokeA=clamp(1.3-Math.abs(car.vx)/28,0.18,1);
  const SEG=16;
  for(const wh of WHEELS){
    if(camMode===2&&!wh.front)continue; // cockpit: rears are behind the eye
    const side=wh.cz<0?-1:1;
    // one physical rotation for the whole wheel: rolling forward the tread
    // angle DECREASES (top of the tire moves toward the nose) on BOTH sides
    const spin=-(wh.front?car.spinF:car.spinR);
    const wc=toWorld(wh.cx,wh.r,wh.cz,true,wh.front);
    const zw=camSpace(wc[0],wc[1],wc[2])[2];
    if(zw>140)continue;
    // soft contact shadow under the tire (steers with the front wheels)
    {
      const cp=[[wh.cx-wh.r*0.8,0.012,wh.cz-wh.w*0.62],[wh.cx+wh.r*0.8,0.012,wh.cz-wh.w*0.62],
                [wh.cx+wh.r*0.8,0.012,wh.cz+wh.w*0.62],[wh.cx-wh.r*0.8,0.012,wh.cz+wh.w*0.62]]
        .map(p=>toWorld(p[0],p[1],p[2],true,wh.front));
      const zp=camSpace((cp[0][0]+cp[2][0])/2,(cp[0][1]+cp[2][1])/2,(cp[0][2]+cp[2][2])/2)[2];
      if(zp>NEAR)faces.push({z:zp+0.03,f:cp,col:'rgba(0,0,0,0.42)'});
    }
    // barrel rings across the width: [z-offset, radius factor]
    const rings=[[-wh.w/2,0.955],[-wh.w*0.27,1.0],[wh.w*0.27,1.0],[wh.w/2,0.955]];
    const R=[];
    for(const[zo,rf]of rings){
      const row=[];
      for(let k=0;k<SEG;k++){
        const a=spin+k/SEG*TAU;
        row.push(toWorld(wh.cx+Math.cos(a)*wh.r*rf,wh.r+Math.sin(a)*wh.r*rf,wh.cz+zo,true,wh.front));
      }
      R.push(row);
    }
    for(let b=0;b<3;b++){
      for(let k=0;k<SEG;k++){
        const k2=(k+1)%SEG;
        let col;
        if(b===1){
          if(k===0)col=[34+24*treadC,34+24*treadC,38+24*treadC];       // rolling seam mark
          else{const s3=(k&1?-9:9)*treadC;col=[34+s3,34+s3,38+s3];}    // tread blocks
        }else col=[29,29,33];                                          // shoulders
        pushFace([R[b][k],R[b][k2],R[b+1][k2],R[b+1][k]],col);
      }
    }
    // inner closing cap: without it the barrel reads as a hollow tube (the
    // far tread showing "front-facing" geometry) when seen from behind/inside
    {
      const capZi=wh.cz-side*wh.w/2;
      const ci=toWorld(wh.cx,wh.r,capZi,true,wh.front);
      const fx=ci[0]-wc[0],fy=ci[1]-wc[1],fe=ci[2]-wc[2];
      const vx2=cam.gx-ci[0],vy2=cam.gy-ci[1],ve2=cam.h-ci[2];
      if(fx*vx2+fy*vy2+fe*ve2>0){
        const zi=camSpace(ci[0],ci[1],ci[2])[2];
        if(zi>NEAR&&zi<90){
          const dsc=[],hub=[];
          for(let k=0;k<SEG;k++){
            const a=spin+k/SEG*TAU;
            dsc.push(toWorld(wh.cx+Math.cos(a)*wh.r*0.94,wh.r+Math.sin(a)*wh.r*0.94,capZi,true,wh.front));
            hub.push(toWorld(wh.cx+Math.cos(a)*wh.r*0.50,wh.r+Math.sin(a)*wh.r*0.50,capZi,true,wh.front));
          }
          faces.push({z:zi-0.004,f:dsc,col:'rgb(22,22,25)'});
          faces.push({z:zi-0.008,f:hub,col:'rgb(38,38,44)'});
        }
      }
    }
    // outer cap: sidewall disc + dished rim + spokes + sidewall marks
    const capZ=wh.cz+side*wh.w/2;
    const capPt=(ang,rad)=>toWorld(wh.cx+Math.cos(ang)*rad,wh.r+Math.sin(ang)*rad,capZ,true,wh.front);
    const c0=toWorld(wh.cx,wh.r,capZ,true,wh.front);
    const nx=c0[0]-wc[0],ny=c0[1]-wc[1],ne=c0[2]-wc[2];
    const vdx=cam.gx-c0[0],vdy=cam.gy-c0[1],vde=cam.h-c0[2];
    const facing=(nx*vdx+ny*vdy+ne*vde)/((Math.hypot(nx,ny,ne)||1)*(Math.hypot(vdx,vdy,vde)||1));
    if(facing<0.10)continue;
    const zc=camSpace(c0[0],c0[1],c0[2])[2];
    if(zc<NEAR||zc>90)continue;
    const disc=[],rim=[];
    for(let k=0;k<SEG;k++){
      disc.push(capPt(spin+k/SEG*TAU,wh.r*0.94));
      rim.push(capPt(spin+k/SEG*TAU,wh.r*0.56));
    }
    faces.push({z:zc-0.004,f:disc,col:'rgb(27,27,31)'});
    faces.push({z:zc-0.010,f:rim,col:'rgb(78,80,90)'}); // bright rim lip
    { // recessed rim well: darker disc inside the lip gives the wheel depth
      const well=[];
      for(let k=0;k<SEG;k++)well.push(capPt(spin+k/SEG*TAU,wh.r*0.40));
      faces.push({z:zc-0.013,f:well,col:'rgb(31,31,37)'});
    }
    for(let s2=0;s2<5;s2++){
      const a=spin+s2/5*TAU;
      faces.push({z:zc-0.016,f:[capPt(a-0.10,wh.r*0.10),capPt(a+0.10,wh.r*0.10),
        capPt(a+0.05,wh.r*0.52),capPt(a-0.05,wh.r*0.52)],
        col:`rgba(13,13,15,${spokeA.toFixed(2)})`});
    }
    for(let m=0;m<2;m++){ // Pirelli-style yellow sidewall marks
      const a=spin+m*Math.PI+0.6;
      faces.push({z:zc-0.016,f:[capPt(a-0.22,wh.r*0.72),capPt(a+0.22,wh.r*0.72),
        capPt(a+0.17,wh.r*0.89),capPt(a-0.17,wh.r*0.89)],
        col:`rgba(212,178,58,${Math.max(0.4,spokeA).toFixed(2)})`});
    }
    // centre-lock wheel nut
    const nut=[];
    for(let k=0;k<6;k++)nut.push(capPt(spin+k/6*TAU,wh.r*0.13));
    faces.push({z:zc-0.020,f:nut,col:'rgb(128,28,24)'});
  }
  faces.sort((a,b)=>b.z-a.z);
  for(const fc of faces){
    const pp=projectPoly(fc.f);
    if(pp)fillPoly(pp,fc.col);
  }
  // race-number decals (billboard text, occlusion approximated by facing):
  // nose roundel when seen from ahead, endplate numbers when seen side-on
  ctx.textAlign='center';ctx.textBaseline='middle';
  {
    const np=toWorld(2.28,0.50,0,false,false);
    const seesNose=(cam.gx-car.x)*ch+(cam.gy-car.y)*sh>0.5; // camera ahead of the car
    const c=camSpace(np[0],np[1],np[2]);
    if(seesNose&&c[2]>NEAR&&c[2]<60){
      const sx=CX+c[0]/c[2]*FL,sy=CY-c[1]/c[2]*FL;
      const r=clamp(FL*0.16/c[2],2.5,26);
      ctx.fillStyle='rgba(240,240,238,0.95)';
      ctx.beginPath();ctx.arc(sx,sy,r,0,TAU);ctx.fill();
      ctx.fillStyle='#15151a';
      ctx.font='700 '+Math.round(r*1.4)+'px ui-monospace,monospace';
      ctx.fillText(CAR_NUM,sx,sy+r*0.08);
    }
  }
  for(const s of[-1,1]){ // rear-wing endplate numbers
    const p=toWorld(-2.51,0.84,s*0.52,false,false);
    const nx2=-s*sh,ny2=s*ch; // outward endplate normal in world
    const vx2=cam.gx-p[0],vy2=cam.gy-p[1];
    const fac=(nx2*vx2+ny2*vy2)/(Math.hypot(vx2,vy2)||1);
    if(fac<0.30)continue;
    const c=camSpace(p[0],p[1],p[2]);
    if(c[2]<NEAR||c[2]>60)continue;
    const sx=CX+c[0]/c[2]*FL,sy=CY-c[1]/c[2]*FL;
    const fs=clamp(FL*0.30/c[2],4,30)*fac;
    ctx.fillStyle='rgba(236,236,232,0.92)';
    ctx.font='700 '+Math.round(fs)+'px ui-monospace,monospace';
    ctx.fillText(CAR_NUM,sx,sy);
  }
  ctx.textAlign='left';ctx.textBaseline='alphabetic';
}

// ---------- frame ----------
function render(fdt){
  updateCamera(fdt);
  const sp=Math.hypot(car.vx,car.vy);
  let shx=0,shy=0;
  if(camMode>=1){
    const base=camMode===2?3.2:1.6;
    const mag=base*car.kerbShake*((car.grass||car.gravel)?2.4:1.4);
    shx=(Math.random()-0.5)*mag;shy=(Math.random()-0.5)*mag;
  }
  CX=W/2+shx;CY=H*0.5+shy;
  FL=H*flCur;
  _cs=Math.cos(cam.yaw);_sn=Math.sin(cam.yaw);
  _cp=Math.cos(cam.pitch);_sp=Math.sin(cam.pitch);

  ctx.setTransform(DPR,0,0,DPR,0,0);
  const horizonY=CY-FL*Math.tan(cam.pitch);
  const sky=ctx.createLinearGradient(0,0,0,Math.max(1,horizonY));
  sky.addColorStop(0,ATMO.skyTop);sky.addColorStop(0.7,ATMO.skyMid);sky.addColorStop(1,ATMO.skyBot);
  ctx.fillStyle=sky;ctx.fillRect(0,0,W,Math.max(0,horizonY));
  // sun (day) / moon + stars (night)
  if(ATMO.night){
    const sa=wrapAngle(2.35-cam.yaw);
    if(Math.abs(sa)<1.2){
      const mx=CX+sa*FL,my=horizonY-0.30*FL;
      ctx.fillStyle='rgba(235,238,245,0.9)';
      ctx.beginPath();ctx.arc(mx,my,11,0,TAU);ctx.fill();
      ctx.fillStyle=ATMO.skyTop;ctx.beginPath();ctx.arc(mx-5,my-3,9,0,TAU);ctx.fill();
    }
    const srnd=mulberry(7);
    ctx.fillStyle='rgba(255,255,255,0.65)';
    for(let k=0;k<90;k++){
      const a=wrapAngle(srnd()*TAU-cam.yaw),h=0.06+srnd()*0.42;
      if(Math.abs(a)>1.4)continue;
      const sx2=CX+a*FL,sy2=horizonY-h*FL;
      if(sy2>0)ctx.fillRect(sx2,sy2,1.6,1.6);
    }
  }else if(ATMO.sun!==false){
    const sa=wrapAngle(2.35-cam.yaw);
    if(Math.abs(sa)<1.2){
      const sx=CX+sa*FL,sy=horizonY-0.22*FL;
      const gr=ctx.createRadialGradient(sx,sy,4,sx,sy,60);
      gr.addColorStop(0,'rgba(255,250,225,0.95)');gr.addColorStop(1,'rgba(255,250,225,0)');
      ctx.fillStyle=gr;ctx.fillRect(sx-60,sy-60,120,120);
    }
  }
  // clouds
  if(!ATMO.night)for(const cl of scenery.clouds){
    const a=wrapAngle(cl.a-cam.yaw);
    if(Math.abs(a)>1.4)continue;
    const cx2=CX+a*FL,cy2=horizonY-cl.h*FL;
    ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(cx2,cy2,52*cl.s,13*cl.s,0,0,TAU);
    ctx.ellipse(cx2+30*cl.s,cy2+5*cl.s,36*cl.s,10*cl.s,0,0,TAU);
    ctx.fill();
  }
  // backdrop: alpine ridges (RBR) or a hazy city skyline (Monaco)
  const ridge=(amp,freq,ph,col,lift)=>{
    ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,horizonY+2);
    for(let x=0;x<=W;x+=14){
      const a=cam.yaw+(x-CX)/FL;
      const hpx=FL*Math.max(0,amp*Math.sin(a*freq+ph)+amp*0.55*Math.sin(a*freq*2.3+ph*1.7)+lift);
      ctx.lineTo(x,horizonY-hpx);
    }
    ctx.lineTo(W,horizonY+2);ctx.closePath();ctx.fill();
  };
  if(track.style==='city'){
    ridge(0.055,1.3,0.4,ATMO.night?'#101827':'#9fb0c0',0.06);
    // blocky skyline silhouette (night: dark towers with lit windows + glow)
    ctx.fillStyle=ATMO.night?'#161f33':'#a9b4c2';
    for(let x=0;x<W;x+=26){
      const a=cam.yaw+(x-CX)/FL;
      const hpx=FL*(0.03+0.05*Math.abs(Math.sin(a*5.3+x)));
      ctx.fillRect(x,horizonY-hpx,24,hpx+2);
      if(ATMO.night){
        ctx.fillStyle='rgba(255,214,130,0.75)';
        const wr=mulberry((x*7+13)|0);
        for(let k=0;k<6;k++){const wx=x+3+wr()*18,wy=horizonY-hpx+3+wr()*(hpx-6);
          if(wy<horizonY-2)ctx.fillRect(wx,wy,2,2.6);}
        ctx.fillStyle='#161f33';
      }
    }
    if(ATMO.night){ // skyline glow wash above the rooftops
      const gl=ctx.createLinearGradient(0,horizonY-0.1*FL,0,horizonY);
      gl.addColorStop(0,'rgba(90,110,170,0)');gl.addColorStop(1,'rgba(120,140,200,0.20)');
      ctx.fillStyle=gl;ctx.fillRect(0,horizonY-0.1*FL,W,0.1*FL);
    }
  }else{
    ridge(0.045,1.6,0.6,'#8fa5b5',0.055);
    ridge(0.035,2.3,2.1,'#7e997f',0.032);
    ridge(0.020,3.4,4.0,'#5c7a56',0.012);
  }
  // ground base (grass green / city grey), from the track palette
  const G=track.ground;
  const gg=ctx.createLinearGradient(0,horizonY,0,H);
  gg.addColorStop(0,fogMix([G[0]+8,G[1]+8,G[2]+8],0.8));
  gg.addColorStop(0.3,fogMix(G,0.35));
  gg.addColorStop(1,`rgb(${(G[0]*0.7)|0},${(G[1]*0.7)|0},${(G[2]*0.7)|0})`);
  ctx.fillStyle=gg;ctx.fillRect(0,Math.max(0,horizonY),W,H-horizonY);

  // harbour water (Monaco): flat blue disc on the ground plane
  if(scenery.water)for(const w of scenery.water){
    const rx=w.rx||w.r,ry=w.ry||w.r,poly=[];
    for(let k=0;k<20;k++){const a=k/20*TAU;poly.push([w.cx+Math.cos(a)*rx,w.cy+Math.sin(a)*ry,w.e]);}
    const pp=projectPoly(poly);
    if(pp){const dz=camSpace(w.cx,w.cy,w.e)[2];
      fillPoly(pp,fogMix((track.scn&&track.scn.waterCol)||[30,98,160],Math.min(0.32,Math.pow(dz/FAR,1.5))));}
  }

  // ---- world list: road segs, trees, structures ----
  const T=track,N=T.n;
  const list=[];
  for(let i=0;i<N;i++){
    const dx=T.X[i]-cam.gx,dy=T.Y[i]-cam.gy;
    const d2=dx*dx+dy*dy;
    if(d2>FAR*FAR)continue;
    list.push({k:0,z:Math.sqrt(d2),i});
  }
  for(let ti=0;ti<scenery.trees.length;ti++){
    const tr=scenery.trees[ti];
    const dx=tr.x-cam.gx,dy=tr.y-cam.gy,d2=dx*dx+dy*dy;
    if(d2>460*460)continue;
    list.push({k:1,z:Math.sqrt(d2),i:ti});
  }
  for(let si=0;si<scenery.structs.length;si++){
    const stc=scenery.structs[si];
    const dx=stc.x-cam.gx,dy=stc.y-cam.gy,d2=dx*dx+dy*dy;
    const cr=stc.cull||620;
    if(d2>cr*cr)continue;
    const d=Math.sqrt(d2);
    if(d<(stc.br||0)*0.75)continue;               // camera inside this structure -> skip
    // LOD: past ~60% of its cull range a structure draws only its primary box
    // (first 5 faces) — roof caps / window strips are sub-pixel there anyway
    list.push({k:2,z:d-(stc.br||0)*0.5,i:si,lod:d>cr*0.6});
  }
  list.sort((a,b)=>b.z-a.z);
  for(const it of list){
    const t=Math.min(1,Math.pow(it.z/FAR,1.25));
    if(it.k===0)drawSeg(it.i,it.z,t);
    else if(it.k===1)drawTree(scenery.trees[it.i],t);
    else drawStruct(scenery.structs[it.i],t,it.lod);
  }
  // checker
  for(const c of scenery.checker){
    const pp=projectPoly(c.pts);
    if(pp)fillPoly(pp,c.col);
  }
  // skids
  for(const sk of skids){
    const dx=sk.x1-cam.gx,dy=sk.y1-cam.gy;
    if(dx*dx+dy*dy>250*250)continue;
    const ux=sk.x2-sk.x1,uy=sk.y2-sk.y1;
    const l=Math.hypot(ux,uy)||1;
    const px=-uy/l*0.17,py=ux/l*0.17;
    const pp=projectPoly([[sk.x1-px,sk.y1-py,sk.e+0.01],[sk.x1+px,sk.y1+py,sk.e+0.01],
      [sk.x2+px,sk.y2+py,sk.e+0.01],[sk.x2-px,sk.y2-py,sk.e+0.01]]);
    if(pp)fillPoly(pp,`rgba(16,16,18,${sk.a.toFixed(2)})`);
  }
  // car (cockpit mode draws only the forward bodywork — see drawCarMesh)
  if(camMode<=1){
    const ch=Math.cos(car.heading),sh=Math.sin(car.heading);
    const shq=[[-2.6,-1.15],[2.9,-1.15],[2.9,1.15],[-2.6,1.15]].map(o=>
      [car.x+o[0]*ch-o[1]*sh,car.y+o[0]*sh+o[1]*ch,car.elev+0.015]);
    const sq=projectPoly(shq);
    if(sq)fillPoly(sq,'rgba(0,0,0,0.38)');
  }
  drawCarMesh();
  // floodlight glow sprites (night tracks)
  if(scenery.glows&&scenery.glows.length){
    ctx.globalCompositeOperation='lighter';
    for(const g of scenery.glows){
      const c=camSpace(g.x,g.y,g.e);
      if(c[2]<NEAR||c[2]>380)continue;
      const sx=CX+c[0]/c[2]*FL,sy=CY-c[1]/c[2]*FL;
      const rr=Math.min(70,FL*1.1/c[2]);
      if(rr<3)continue; // sub-pixel glow isn't worth a gradient allocation
      const gr=ctx.createRadialGradient(sx,sy,0,sx,sy,rr);
      gr.addColorStop(0,'rgba(255,246,214,0.55)');gr.addColorStop(1,'rgba(255,246,214,0)');
      ctx.fillStyle=gr;ctx.fillRect(sx-rr,sy-rr,rr*2,rr*2);
    }
    ctx.globalCompositeOperation='source-over';
  }
  // particles
  for(const p of parts){
    const csp=camSpace(p.x,p.y,p.e+p.h);
    if(csp[2]<2.5||csp[2]>300)continue;
    const sx=CX+csp[0]*FL/csp[2],sy=CY-csp[1]*FL/csp[2];
    const rr=Math.min(p.s*FL/csp[2],H*0.11);
    const f=1-p.t/p.life;
    ctx.fillStyle=`rgba(${p.c[0]},${p.c[1]},${p.c[2]},${(p.a*f).toFixed(2)})`;
    ctx.beginPath();ctx.arc(sx,sy,rr,0,TAU);ctx.fill();
  }
  if(camMode===2)drawCockpitOverlay();
  drawHUD(sp);
}
function drawSeg(i,z,t){
  const T=track,j=(i+1)%T.n;
  // verge near the camera: mown-grass stripes (circuit) or paved (city)
  if(z<300){
    const city=T.style==='city';
    for(const side of[-1,1]){
      const ex=side<0?T.LX:T.RX,ey=side<0?T.LY:T.RY;
      const w=city?4:23;
      const g=city?((i>>2)&1?[92,90,86]:[82,80,76])
                  :((i>>3)&1?[70,116,60]:[58,104,50]);
      fogQuadFill([[ex[i],ey[i],T.E[i]],[ex[j],ey[j],T.E[j]],
        [ex[j]+T.NX[j]*side*w,ey[j]+T.NY[j]*side*w,T.E[j]-0.06],
        [ex[i]+T.NX[i]*side*w,ey[i]+T.NY[i]*side*w,T.E[i]-0.06]],g,t);
    }
  }
  // runoff: gravel trap (tan) or the iconic red-white striped tarmac
  if(T.gravelMask[i]!==0&&z<380){
    const side=T.gravelMask[i];
    const ex=side<0?T.LX:T.RX,ey=side<0?T.LY:T.RY;
    const o0=KERB_W,o1=KERB_W+9.5;
    const col=T.trapType[i]===2?(((i>>2)&1)?[198,52,44]:[224,220,212]):[176,158,116];
    fogQuadFill([[ex[i]+T.NX[i]*side*o0,ey[i]+T.NY[i]*side*o0,T.E[i]],
      [ex[j]+T.NX[j]*side*o0,ey[j]+T.NY[j]*side*o0,T.E[j]],
      [ex[j]+T.NX[j]*side*o1,ey[j]+T.NY[j]*side*o1,T.E[j]-0.04],
      [ex[i]+T.NX[i]*side*o1,ey[i]+T.NY[i]*side*o1,T.E[i]-0.04]],col,t);
  }
  const quad=[[T.LX[i],T.LY[i],T.E[i]],[T.LX[j],T.LY[j],T.E[j]],
              [T.RX[j],T.RY[j],T.E[j]],[T.RX[i],T.RY[i],T.E[i]]];
  const pp=projectPoly(quad);
  if(!pp)return;
  let minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9;
  for(const p of pp){minx=Math.min(minx,p[0]);maxx=Math.max(maxx,p[0]);
    miny=Math.min(miny,p[1]);maxy=Math.max(maxy,p[1]);}
  if(maxx<-40||minx>W+40||maxy<-40||miny>H+40)return;
  fillPoly(pp,fogMix(ASPHALT,t));
  if(T.kerb[i]){
    for(const side of[-1,1]){
      const ex=side<0?T.LX:T.RX,ey=side<0?T.LY:T.RY;
      fogQuadFill([[ex[i],ey[i],T.E[i]],[ex[j],ey[j],T.E[j]],
        [ex[j]+T.NX[j]*side*KERB_W,ey[j]+T.NY[j]*side*KERB_W,T.E[j]],
        [ex[i]+T.NX[i]*side*KERB_W,ey[i]+T.NY[i]*side*KERB_W,T.E[i]]],
        (i>>1)&1?[200,51,43]:[228,224,216],t);
    }
  }
  if(t<0.92&&pp.length===4){
    ctx.strokeStyle=`rgba(255,255,255,${(0.8*(1-t)).toFixed(2)})`;
    ctx.lineWidth=clamp(0.15*FL/z,0.5,3);
    ctx.beginPath();
    ctx.moveTo(pp[0][0],pp[0][1]);ctx.lineTo(pp[1][0],pp[1][1]);
    ctx.moveTo(pp[2][0],pp[2][1]);ctx.lineTo(pp[3][0],pp[3][1]);
    ctx.stroke();
  }
  if(i%25===0&&t<0.85){
    for(const side of[-1,1]){
      const px=T.X[i]+T.NX[i]*side*(HALF_W+1.6),py=T.Y[i]+T.NY[i]*side*(HALF_W+1.6);
      const pq=projectPoly([[px-0.1,py,T.E[i]],[px+0.1,py,T.E[i]],
        [px+0.1,py,T.E[i]+0.9],[px-0.1,py,T.E[i]+0.9]]);
      if(pq)fillPoly(pq,fogMix([235,235,235],t));
    }
  }
}
function drawTree(tr,t){
  const base=camSpace(tr.x,tr.y,tr.e);
  if(base[2]<NEAR)return;
  const sx=CX+base[0]*FL/base[2],sy=CY-base[1]*FL/base[2];
  const s=FL/base[2];
  const h=tr.h*s,w=tr.w*s;
  if(sx<-w||sx>W+w||sy<-h||sy>H+h)return;
  ctx.fillStyle=fogMix([64,52,38],t);
  ctx.fillRect(sx-0.12*s,sy-0.18*tr.h*s,0.24*s,0.18*tr.h*s);
  const g=Math.round(84*tr.shade),g2=Math.round(64*tr.shade);
  for(let l=0;l<3;l++){
    const yy=sy-h*(0.18+l*0.27),ww=w*(1-l*0.26);
    ctx.fillStyle=fogMix(l===1?[38,g,30]:[30,g2,26],t);
    ctx.beginPath();
    ctx.moveTo(sx-ww/2,yy);ctx.lineTo(sx+ww/2,yy);ctx.lineTo(sx,yy-h*0.38);
    ctx.closePath();ctx.fill();
  }
}
function drawStruct(stc,t,lod){
  const zs=[];
  const src=lod&&stc.faces.length>5?(stc.lodF||(stc.lodF=stc.faces.slice(0,5))):stc.faces;
  for(const f of src){
    let cx4=0,cy4=0,ce4=0;
    for(const p of f.pts){cx4+=p[0];cy4+=p[1];ce4+=p[2];}
    const n=f.pts.length;
    const z=camSpace(cx4/n,cy4/n,ce4/n)[2];
    if(z<NEAR)continue;
    zs.push({z,f});
  }
  zs.sort((a,b)=>b.z-a.z);
  for(const e of zs){
    const pp=projectPoly(e.f.pts);
    if(!pp)continue;
    if(t>0.05){ // fog the precomputed color (numeric rgb avoids re-parsing)
      const m=e.f.rgb||(e.f.rgb=e.f.col.match(/\d+/g).map(Number));
      fillPoly(pp,fogMix(m,t));
    }else fillPoly(pp,e.f.col);
  }
}

// cockpit overlay with steering wheel + halo
function drawCockpitOverlay(){
  // (front tyres + nose are the real 3D mesh now — see drawCarMesh)
  // --- low cockpit-rim flanks in the bottom corners (not full-height blobs) ---
  for(const side of[-1,1]){
    const m=x=>W/2+side*x;
    const grd=ctx.createLinearGradient(m(W*0.42),H*0.84,m(W*0.12),H);
    grd.addColorStop(0,`rgb(${C_RED[0]},${C_RED[1]},${C_RED[2]})`);
    grd.addColorStop(1,`rgb(${C_RED[0]*0.6|0},${C_RED[1]*0.6|0},${C_RED[2]*0.6|0})`);
    ctx.fillStyle=grd;
    ctx.beginPath();
    ctx.moveTo(m(W*0.52),H+20);
    ctx.quadraticCurveTo(m(W*0.34),H*0.87,m(W*0.16),H*0.905);
    ctx.quadraticCurveTo(m(W*0.105),H*0.92,m(W*0.10),H+20);
    ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(255,120,105,0.45)';ctx.lineWidth=2.5;
    ctx.beginPath();
    ctx.moveTo(m(W*0.48),H*0.935);
    ctx.quadraticCurveTo(m(W*0.32),H*0.875,m(W*0.16),H*0.91);
    ctx.stroke();
  }
  // --- dash cowl behind the wheel ---
  ctx.fillStyle='#121217';
  ctx.beginPath();
  ctx.moveTo(W*0.33,H+10);ctx.quadraticCurveTo(W*0.37,H*0.80,W/2,H*0.79);
  ctx.quadraticCurveTo(W*0.63,H*0.80,W*0.67,H+10);ctx.closePath();ctx.fill();
  // --- mirrors ---
  for(const side of[-1,1]){
    ctx.save();
    ctx.translate(W/2+side*W*0.335,H*0.58);ctx.rotate(side*0.06);
    ctx.fillStyle='#15151a';
    ctx.beginPath();ctx.roundRect(-W*0.032,-H*0.026,W*0.064,H*0.052,6);ctx.fill();
    ctx.fillStyle='#8fa9bd';
    ctx.beginPath();ctx.roundRect(-W*0.026,-H*0.017,W*0.052,H*0.034,4);ctx.fill();
    ctx.restore();
  }
  // --- halo: dark arch + widening centre pillar with camera pod ---
  ctx.fillStyle='rgba(14,16,21,0.97)';
  ctx.beginPath();
  ctx.moveTo(-20,H*0.02);
  ctx.quadraticCurveTo(W/2,-H*0.40,W+20,H*0.02);
  ctx.lineTo(W+20,H*0.30);
  ctx.quadraticCurveTo(W/2,-H*0.09,-20,H*0.30);
  ctx.closePath();ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W/2-W*0.011,H*0.47);ctx.lineTo(W/2+W*0.011,H*0.47);
  ctx.lineTo(W/2+W*0.032,H*0.09);ctx.lineTo(W/2-W*0.032,H*0.09);
  ctx.closePath();ctx.fill();
  ctx.fillStyle='#08090c';
  ctx.beginPath();ctx.roundRect(W/2-W*0.024,H*0.115,W*0.048,H*0.055,8);ctx.fill();
  ctx.fillStyle='#20242c';
  ctx.beginPath();ctx.arc(W/2,H*0.143,H*0.012,0,TAU);ctx.fill();
  // --- steering wheel (rotates with input) ---
  const kmh=Math.abs(car.vx)*3.6;
  let g8=1;for(let g=7;g>=0;g--)if(kmh>=GEAR_KMH[g]){g8=g+1;break;}
  const lo=GEAR_KMH[g8-1],hi=g8<8?GEAR_KMH[g8]:356;
  const rf=clamp((kmh-lo)/(hi-lo),0,1);
  ctx.save();
  ctx.translate(W/2,H*0.905);
  ctx.rotate(car.steer*0.9);
  // grips + hands
  for(const side of[-1,1]){
    ctx.fillStyle='#101013';
    ctx.beginPath();ctx.roundRect(side*W*0.082-W*0.016,-H*0.055,W*0.032,H*0.115,14);ctx.fill();
    ctx.fillStyle='#1b1b1f'; // gloves
    ctx.beginPath();ctx.ellipse(side*W*0.086,-H*0.005,W*0.017,H*0.045,side*0.15,0,TAU);ctx.fill();
    ctx.beginPath();ctx.ellipse(side*W*0.066,-H*0.028,W*0.008,H*0.016,side*0.5,0,TAU);ctx.fill();
  }
  // body
  ctx.fillStyle='#141419';
  ctx.beginPath();ctx.roundRect(-W*0.085,-H*0.062,W*0.17,H*0.115,14);ctx.fill();
  ctx.strokeStyle='#26262c';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(-W*0.085,-H*0.062,W*0.17,H*0.115,14);ctx.stroke();
  // LED strip
  for(let i=0;i<12;i++){
    ctx.fillStyle=i/12<rf?(i<6?'#37d67a':i<9?'#ffd75e':'#ff5a4f'):'#26262e';
    ctx.beginPath();ctx.arc(-W*0.052+i*(W*0.0095),-H*0.050,3.2,0,TAU);ctx.fill();
  }
  // screen: gear, speed, rev bar
  ctx.fillStyle='#050607';
  ctx.beginPath();ctx.roundRect(-W*0.036,-H*0.038,W*0.072,H*0.070,6);ctx.fill();
  ctx.strokeStyle='#2a3340';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.roundRect(-W*0.036,-H*0.038,W*0.072,H*0.070,6);ctx.stroke();
  ctx.fillStyle='#1c2532';ctx.fillRect(-W*0.030,-H*0.033,W*0.060,H*0.008);
  ctx.fillStyle=rf>0.92?'#ff5a4f':'#37d67a';
  ctx.fillRect(-W*0.030,-H*0.033,W*0.060*rf,H*0.008);
  ctx.fillStyle='#fff';ctx.textAlign='center';
  ctx.font='700 '+Math.round(H*0.042)+'px ui-monospace,monospace';
  ctx.fillText(String(car.reverse?'R':g8),0,H*0.014);
  ctx.font='500 '+Math.round(H*0.014)+'px ui-monospace,monospace';
  ctx.fillStyle='#8fd0ff';ctx.fillText(Math.round(kmh)+' kph',0,H*0.029);
  ctx.textAlign='left';
  // buttons + knobs
  const btn=(x,y,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,H*0.0075,0,TAU);ctx.fill();};
  btn(-W*0.062,-H*0.028,'#2fbf63');btn(-W*0.062,-H*0.004,'#ffd75e');btn(-W*0.062,H*0.020,'#d3382e');
  btn(W*0.062,-H*0.028,'#3f7bd9');btn(W*0.062,-H*0.004,'#d3382e');btn(W*0.062,H*0.020,'#e8e4dc');
  for(const kx of[-W*0.030,W*0.030]){
    ctx.fillStyle='#2a2a31';ctx.beginPath();ctx.arc(kx,H*0.042,H*0.011,0,TAU);ctx.fill();
    ctx.strokeStyle='#4a4a54';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(kx,H*0.042);ctx.lineTo(kx,H*0.032);ctx.stroke();
  }
  ctx.restore();
}

// ---------- HUD ----------
const MM={w:200,h:164,pts:[]};
function buildMinimap(){
  const pad=10;
  const sx=(MM.w-2*pad)/(track.maxx-track.minx),sy=(MM.h-2*pad)/(track.maxy-track.miny);
  MM.s=Math.min(sx,sy);
  MM.ox=pad-track.minx*MM.s+((MM.w-2*pad)-(track.maxx-track.minx)*MM.s)/2;
  MM.oy=pad-track.miny*MM.s+((MM.h-2*pad)-(track.maxy-track.miny)*MM.s)/2;
  MM.pts=[];
  for(let i=0;i<track.n;i+=4)MM.pts.push([track.X[i]*MM.s+MM.ox,track.Y[i]*MM.s+MM.oy]);
}
buildMinimap();

// ---- track switching (press N to cycle) ----
function switchTrack(id){
  const def=TRACKS[id];if(!def)return;
  curTrackKey=id;
  track=buildTrack(def);
  if(window.SIM)window.SIM.track=track;
  scenery=buildScenery(track);
  buildMinimap();
  parts.length=0;skids.length=0;
  timing.lapActive=false;timing.lapN=0;timing.last=null;timing.cp=0;
  try{const b=localStorage.getItem('rbr2_best_'+id);timing.best=b?parseFloat(b):null;}catch(e){timing.best=null;}
  placeCarAtS(track.length-60);
  msg(track.name,'#8fd0ff');
}
function roundRectPath(x,y,w,h,r){
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}
function drawHUD(sp){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  const kmh=Math.abs(car.vx)*3.6;
  let gear=1;
  for(let g=7;g>=0;g--)if(kmh>=GEAR_KMH[g]){gear=g+1;break;}
  if(car.reverse)gear='R';
  // desktop: bottom-left. touch landscape: bottom-CENTRE between the steering
  // (left) and pedal (right) clusters. touch portrait: still centred but
  // RAISED above the control clusters and scaled down so nothing overlaps.
  const narrow=TOUCH&&W<620;
  const ps=narrow?0.82:1;               // panel scale (about its bx,by anchor)
  const bx=TOUCH?Math.round(W/2-126*ps):22;
  const by=narrow?H-306:H-24;
  ctx.textAlign='left';ctx.textBaseline='alphabetic';
  ctx.save();
  if(ps!==1){ctx.translate(bx,by);ctx.scale(ps,ps);ctx.translate(-bx,-by);}
  ctx.fillStyle='rgba(8,12,18,0.72)';roundRectPath(bx-10,by-118,272,132,10);ctx.fill();
  // ERS battery gauge: level bar + state (yellow deploy / green harvest)
  {
    const ersF=car.ersE/P.ersCap;
    ctx.fillStyle='#8fa1b5';ctx.font='700 10px ui-monospace,monospace';
    ctx.fillText('ERS',bx+2,by-102);
    ctx.fillStyle='#1c2532';ctx.fillRect(bx+30,by-110,150,9);
    ctx.fillStyle=ersF<0.15?'#ff5a4f':car.ersMode===3?'#ff8f3a':car.ersMode===1?'#ffd75e':car.ersMode===2?'#37d67a':'#4fa3ff';
    ctx.fillRect(bx+30,by-110,150*ersF,9);
    ctx.fillStyle='#67788c';ctx.font='500 10px ui-monospace,monospace';
    ctx.fillText(Math.round(ersF*100)+'%',bx+186,by-102);
    if(car.ersMode===3){ctx.fillStyle='#ff8f3a';ctx.fillText('BOOST',bx+218,by-102);}
    else if(car.ersMode===1){ctx.fillStyle='#ffd75e';ctx.fillText('DEPLOY',bx+218,by-102);}
    else if(car.ersMode===2){ctx.fillStyle='#37d67a';ctx.fillText('CHARGE',bx+218,by-102);}
    else if(ersF<0.02){ctx.fillStyle='#ff5a4f';ctx.fillText('EMPTY',bx+218,by-102);}
  }
  ctx.fillStyle='#fff';ctx.font='700 46px ui-monospace,Menlo,monospace';
  ctx.fillText(String(Math.round(kmh)),bx+4,by-38);
  ctx.font='500 14px ui-monospace,Menlo,monospace';ctx.fillStyle='#8fa1b5';
  ctx.fillText('km/h',bx+112,by-38);
  ctx.fillStyle='#8fa1b5';ctx.font='500 12px ui-monospace,monospace';ctx.fillText('GEAR',bx+180,by-78);
  ctx.fillStyle='#ffd75e';ctx.font='700 40px ui-monospace,Menlo,monospace';
  ctx.fillText(String(gear),bx+182,by-38);
  let rf=0;
  if(gear!=='R'){const lo=GEAR_KMH[gear-1],hi=gear<8?GEAR_KMH[gear]:356;rf=clamp((kmh-lo)/(hi-lo),0,1);}
  ctx.fillStyle='#1c2532';ctx.fillRect(bx+2,by-26,204,8);
  ctx.fillStyle=rf>0.92?'#ff5a4f':'#4fa3ff';ctx.fillRect(bx+2,by-26,204*rf,8);
  // active-aero mode (automatic): STR = Straight Mode (wings open), COR = Corner
  ctx.font='700 12px ui-monospace,Menlo,monospace';
  const straight=car.wingFlap>0.5;
  ctx.fillStyle=straight?'#4fd0ff':'#1c2532';roundRectPath(bx+2,by-14,36,16,4);ctx.fill();
  ctx.fillStyle=straight?'#04121a':'#6f8296';ctx.fillText(straight?'STR':'COR',bx+8,by-1);
  // Overtake Mode (player-triggered): dim = idle, outline = armed, filled = active
  if(car.otActive){ctx.fillStyle='#ff8f3a';roundRectPath(bx+42,by-14,30,16,4);ctx.fill();
    ctx.fillStyle='#1a0d04';ctx.fillText('OT',bx+50,by-1);}
  else if(car.otAvail){ctx.strokeStyle='#ffd75e';ctx.lineWidth=1.5;roundRectPath(bx+42,by-14,30,16,4);ctx.stroke();
    ctx.fillStyle='#ffd75e';ctx.fillText('OT',bx+50,by-1);}
  else{ctx.fillStyle='#3a4656';ctx.fillText('OT',bx+50,by-1);}
  ctx.fillStyle='#1c2532';ctx.fillRect(bx+80,by-14,80,6);ctx.fillRect(bx+80,by-6,80,6);
  ctx.fillStyle='#37d67a';ctx.fillRect(bx+80,by-14,80*car.throttle,6);
  ctx.fillStyle='#ff5a4f';ctx.fillRect(bx+80,by-6,80*car.brake,6);
  ctx.fillStyle='#67788c';ctx.font='500 9px ui-monospace,monospace';
  ctx.fillText('THR',bx+164,by-8);ctx.fillText('BRK',bx+164,by+0);
  ctx.fillStyle='#67788c';ctx.font='500 11px ui-monospace,monospace';
  ctx.fillText('[C] '+CAM_NAMES[camMode],bx+186,by-2);
  ctx.fillStyle=SND.ready&&!SND.muted?'#37d67a':'#67788c';
  ctx.fillText(SND.ready?(SND.muted?'[M] MUTED':'[M] ♪ AUDIO'):'[M] audio',bx+186,by-13);
  ctx.restore(); // end speed/ERS panel scale

  // lap timer box (top-left) — scaled down on narrow touch screens
  ctx.save();
  if(narrow)ctx.scale(0.74,0.74);
  ctx.fillStyle='rgba(8,12,18,0.72)';roundRectPath(14,14,232,106,10);ctx.fill();
  const cur=timing.lapActive?simT-timing.lapStart:null;
  ctx.font='500 12px ui-monospace,Menlo,monospace';
  ctx.fillStyle='#8fa1b5';ctx.fillText('LAP '+(timing.lapN||'-'),24,36);
  ctx.font='700 20px ui-monospace,Menlo,monospace';
  ctx.fillStyle=car.lapValid?'#fff':'#ff8a80';
  ctx.fillText(fmtTime(cur),100,40);
  ctx.font='500 13px ui-monospace,Menlo,monospace';
  ctx.fillStyle='#8fa1b5';ctx.fillText('LAST',24,62);
  ctx.fillStyle='#dfe6ee';ctx.fillText(fmtTime(timing.last),100,62);
  ctx.fillStyle='#8fa1b5';ctx.fillText('BEST',24,82);
  ctx.fillStyle='#7ee787';ctx.fillText(fmtTime(timing.best),100,82);
  const nCP=track.CPS.length;
  for(let i=0;i<nCP;i++){
    ctx.beginPath();ctx.arc(26+i*17,102,4,0,TAU);
    ctx.fillStyle=timing.cp>i?'#37d67a':(timing.lapActive?'#2a3444':'#1c2530');ctx.fill();
  }
  if(!car.lapValid&&timing.lapActive){
    ctx.fillStyle='#ff8a80';ctx.font='500 10px ui-monospace,monospace';
    ctx.fillText('INVALID',26+nCP*17+4,106);
  }
  ctx.restore(); // end timer scale

  // minimap (top-right) — scaled down on narrow touch screens so it and the
  // timer box fit side by side without overlapping
  const mmS=narrow?0.62:1;
  const mx=W-MM.w*mmS-14,my=14;
  ctx.save();ctx.translate(mx,my);ctx.scale(mmS,mmS);
  ctx.fillStyle='rgba(8,12,18,0.72)';roundRectPath(0,0,MM.w,MM.h+16,10);ctx.fill();
  ctx.fillStyle='#dfe6ee';ctx.font='700 11px ui-monospace,monospace';ctx.textAlign='left';
  ctx.fillText(track.name,10,MM.h+11);
  ctx.fillStyle='#67788c';ctx.textAlign='right';
  ctx.fillText('[N] change',MM.w-10,MM.h+11);
  ctx.textAlign='left';
  ctx.strokeStyle='#55606e';ctx.lineWidth=3;ctx.lineJoin='round';
  ctx.beginPath();
  for(let i=0;i<MM.pts.length;i++){const p=MM.pts[i];i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);}
  ctx.closePath();ctx.stroke();
  // cyan overlay = Straight-Mode sections (wings open automatically)
  ctx.strokeStyle='#4fd0ff';ctx.lineWidth=3;ctx.beginPath();
  let started=false;
  for(let i=0;i<track.n;i+=4){
    if(track.cd[i]>90){const x=track.X[i]*MM.s+MM.ox,y=track.Y[i]*MM.s+MM.oy;
      started?ctx.lineTo(x,y):ctx.moveTo(x,y);started=true;}
    else if(started){ctx.stroke();ctx.beginPath();started=false;}
  }
  if(started)ctx.stroke();
  ctx.fillStyle='#eee';
  ctx.fillRect(track.X[0]*MM.s+MM.ox-2,track.Y[0]*MM.s+MM.oy-2,4,4);
  ctx.fillStyle='#ff4436';
  ctx.beginPath();ctx.arc(car.x*MM.s+MM.ox,car.y*MM.s+MM.oy,4,0,TAU);ctx.fill();
  ctx.restore();

  // grip circles sit bottom-right — hidden on touch, where the pedals live there
  if(!TOUCH){
    const fx=W-150,fy=H-70;
    ctx.fillStyle='rgba(8,12,18,0.72)';roundRectPath(fx-52,fy-52,190,104,10);ctx.fill();
    drawFC(fx,fy,'F',car.utilF,car.slideF);
    drawFC(fx+84,fy,'R',car.utilR,car.slideR);
  }

  if((car.grass||car.gravel)&&Math.abs(car.vx)>3){
    ctx.fillStyle='#ffb35e';ctx.font='700 14px ui-monospace,monospace';
    ctx.textAlign='center';ctx.fillText(car.gravel?'GRAVEL!':'OFF TRACK',W/2,TOUCH?by-118*ps-16:H-46);ctx.textAlign='left';
  }
  ctx.textAlign='center';
  let yy=narrow?226:64; // narrow: below the timer/minimap/button stack
  for(const m of msgs){
    if(simT>m.until)continue;
    ctx.font='700 18px ui-monospace,Menlo,monospace';
    ctx.fillStyle=m.col;ctx.fillText(m.t,W/2,yy);yy+=26;
  }
  ctx.textAlign='left';
  while(msgs.length&&simT>msgs[0].until)msgs.shift();
  // pause overlay eases in/out instead of snapping
  if(paused||pauseFade>0.01){
    ctx.fillStyle=`rgba(0,0,0,${(0.34*pauseFade).toFixed(2)})`;ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=pauseFade;
    ctx.fillStyle='#fff';ctx.font='700 28px ui-monospace,monospace';
    ctx.textAlign='center';ctx.fillText('PAUSED',W/2,H/2);
    ctx.fillStyle='#8fa1b5';ctx.font='500 13px ui-monospace,monospace';
    ctx.fillText('P resume  ·  H controls  ·  ESC track select',W/2,H/2+26);
    ctx.textAlign='left';ctx.globalAlpha=1;
  }
  if(showTelemetry)drawTelemetry();
  drawButtons();
}
// clickable on-screen buttons (top-centre). Also registers hit-boxes for the mouse.
function drawButtons(){
  const defs=[['OVERTAKE',actOvertake],['CAM',actCamera],['AUDIO',actAudio],['PAUSE',actPause],['RESET',actReset],
    ['MENU',()=>{window.location.href='index.html#tracks';}]];
  if(TRACK_IDS.length>1)defs.push(['TRACK',actTrack]);
  const narrow=TOUCH&&W<620;
  // narrow touch screens: 3x2 grid of bigger tap targets below the (scaled)
  // timer + minimap. otherwise one top-centre row that never overlaps the
  // timer (left) or minimap (right); on mid widths it drops below the timer.
  const cols=narrow?3:defs.length;
  const bw=narrow?Math.min(88,Math.floor((W-24-(cols-1)*6)/cols)):64,bh=narrow?30:26,gap=6;
  const total=cols*bw+(cols-1)*gap;
  let y0=narrow?138:12;   // below the scaled timer (h~89) and minimap (h~126)
  if(!narrow){const xs=W/2-total/2;if(xs<254||xs+total>W-MM.w-22)y0=128;}
  hudButtons=[];
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font=(narrow?'700 11px ':'700 12px ')+'ui-monospace,Menlo,monospace';
  let i=0;
  for(const[label,act]of defs){
    const col=i%cols,row=(i/cols)|0;
    const x0=W/2-total/2+col*(bw+gap),yy=y0+row*(bh+gap);
    const active=(label==='PAUSE'&&paused)||(label==='AUDIO'&&SND.ready&&!SND.muted)
      ||(label==='OVERTAKE'&&car.otActive);
    const armed=label==='OVERTAKE'&&car.otAvail&&!car.otActive;
    ctx.fillStyle=label==='OVERTAKE'&&car.otActive?'rgba(255,143,58,0.9)'
      :active?'rgba(47,150,90,0.85)':'rgba(8,12,18,0.72)';
    roundRectPath(x0,yy,bw,bh,7);ctx.fill();
    ctx.strokeStyle=armed?'rgba(255,215,94,0.95)':'rgba(120,150,180,0.5)';
    ctx.lineWidth=armed?1.8:1;roundRectPath(x0,yy,bw,bh,7);ctx.stroke();
    ctx.fillStyle=armed?'#ffd75e':'#dfe6ee';ctx.fillText(label,x0+bw/2,yy+bh/2+1);
    hudButtons.push({x:x0,y:yy,w:bw,h:bh,act});
    i++;
  }
  ctx.textAlign='left';ctx.textBaseline='alphabetic';
}
function drawFC(cx,cy,label,util,slide){
  const R=30;
  ctx.strokeStyle=slide>0.03?'#ff5a4f':'#3a4656';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.stroke();
  ctx.strokeStyle='#242e3c';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(cx-R,cy);ctx.lineTo(cx+R,cy);ctx.moveTo(cx,cy-R);ctx.lineTo(cx,cy+R);ctx.stroke();
  const ux=clamp(util.x,-1.15,1.15),uy=clamp(-util.y,-1.15,1.15);
  const m=Math.hypot(ux,uy);
  ctx.fillStyle=m>0.98?'#ff5a4f':(m>0.8?'#ffd75e':'#37d67a');
  ctx.beginPath();ctx.arc(cx+ux*R,cy+uy*R,4.5,0,TAU);ctx.fill();
  ctx.fillStyle='#8fa1b5';ctx.font='700 12px ui-monospace,monospace';
  ctx.fillText(label,cx-4,cy+R+16);
}
function drawTelemetry(){
  const rows=[
    ['v fwd/lat kmh',(car.vx*3.6).toFixed(1)+' / '+(car.vy*3.6).toFixed(1)],
    ['slip F/R deg',(car.alphaF*57.3).toFixed(1)+' / '+(car.alphaR*57.3).toFixed(1)],
    ['Fz F/R N',car.FzF.toFixed(0)+' / '+car.FzR.toFixed(0)],
    ['slide F/R',car.slideF.toFixed(2)+' / '+car.slideR.toFixed(2)],
    ['yaw rate',car.r.toFixed(3)],
    ['beta deg',(Math.atan2(car.vy,Math.max(Math.abs(car.vx),1))*57.3).toFixed(1)],
    ['s / lat',car.s.toFixed(0)+' / '+car.lat.toFixed(1)],
    ['surface',car.gravel?'GRAVEL':car.grass?'GRASS':(car.kerb?'KERB':'ASPHALT')],
    ['ers MJ / kW',(car.ersE/1e6).toFixed(2)+' / '+(car.ersFlow/1000).toFixed(0)+(car.ersMode===2?' in':car.ersMode?' out':'')],
    ['active aero',car.wingFlap>0.5?'STRAIGHT (open)':'CORNER (closed)'],
    ['overtake',car.otActive?'ACTIVE':car.otAvail?'ARMED':'—'],
    ['nan events',String(car.nanEvents)],
  ];
  ctx.fillStyle='rgba(8,12,18,0.8)';roundRectPath(14,H-24-rows.length*17-14,280,rows.length*17+14,8);ctx.fill();
  ctx.font='500 12px ui-monospace,Menlo,monospace';
  let y=H-24-rows.length*17+4;
  for(const[k,v]of rows){
    ctx.fillStyle='#67788c';ctx.fillText(k,24,y);
    ctx.fillStyle='#dfe6ee';ctx.fillText(v,150,y);y+=17;
  }
}

// =========================================================================
// MAIN LOOP
// =========================================================================
// =========================================================================
// AUDIO — procedural F1 soundscape (Web Audio, no files): engine note that
// tracks revs through the gears, turbo whistle + blow-off on lift, tyre
// screech on slides, wind roar at speed, gearshift blip. Toggle with M.
// =========================================================================
const SND=(function(){
  let ctx=null,started=false,muted=false,master;
  let engOscs=[],engGain,engFilt,rasp,raspGain;
  let turbo,turboGain,tyre,tyreGain,tyreFilt,wind,windGain,windFilt;
  let lastGear=1,lastThr=0;
  function noise(sec){const b=ctx.createBuffer(1,ctx.sampleRate*sec|0,ctx.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b;}
  function init(){
    if(started)return;
    try{ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
    started=true;
    master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
    engGain=ctx.createGain();engGain.gain.value=0;
    engFilt=ctx.createBiquadFilter();engFilt.type='lowpass';engFilt.frequency.value=2600;
    engGain.connect(engFilt);engFilt.connect(master);
    for(const m of[0.5,1,2,3]){const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=55*m;
      const g=ctx.createGain();g.gain.value=m===0.5?0.5:0.6/m;o.connect(g);g.connect(engGain);o.start();engOscs.push({o,m});}
    rasp=ctx.createBufferSource();rasp.buffer=noise(2);rasp.loop=true;
    const rf=ctx.createBiquadFilter();rf.type='bandpass';rf.frequency.value=1800;rf.Q.value=1.2;
    raspGain=ctx.createGain();raspGain.gain.value=0;rasp.connect(rf);rf.connect(raspGain);raspGain.connect(master);rasp.start();
    turbo=ctx.createOscillator();turbo.type='sine';turbo.frequency.value=2600;
    turboGain=ctx.createGain();turboGain.gain.value=0;turbo.connect(turboGain);turboGain.connect(master);turbo.start();
    tyre=ctx.createBufferSource();tyre.buffer=noise(2);tyre.loop=true;
    tyreFilt=ctx.createBiquadFilter();tyreFilt.type='bandpass';tyreFilt.frequency.value=1300;tyreFilt.Q.value=5;
    tyreGain=ctx.createGain();tyreGain.gain.value=0;tyre.connect(tyreFilt);tyreFilt.connect(tyreGain);tyreGain.connect(master);tyre.start();
    wind=ctx.createBufferSource();wind.buffer=noise(2);wind.loop=true;
    windFilt=ctx.createBiquadFilter();windFilt.type='lowpass';windFilt.frequency.value=500;
    windGain=ctx.createGain();windGain.gain.value=0;wind.connect(windFilt);windFilt.connect(windGain);windGain.connect(master);wind.start();
    master.gain.linearRampToValueAtTime(0.85,ctx.currentTime+0.4);
  }
  function resume(){if(ctx&&ctx.state==='suspended')ctx.resume();}
  function update(s){
    if(!ctx||muted)return;const t=ctx.currentTime;
    const f=52+s.rev*175+(s.gear-1)*3;                     // engine fundamental Hz
    for(const e of engOscs)e.o.frequency.setTargetAtTime(f*e.m,t,0.03);
    const load=0.10+0.20*s.rev+0.32*s.throttle;
    engGain.gain.setTargetAtTime(load,t,0.05);
    engFilt.frequency.setTargetAtTime(900+s.rev*4200+s.throttle*1200,t,0.05);
    raspGain.gain.setTargetAtTime(0.03+0.10*s.rev,t,0.06);
    if(s.gear!==lastGear){engGain.gain.cancelScheduledValues(t);
      engGain.gain.setValueAtTime(load*0.35,t);engGain.gain.setTargetAtTime(load,t+0.05,0.05);lastGear=s.gear;}
    turbo.frequency.setTargetAtTime(2200+s.rev*2800,t,0.05);
    let tg=s.throttle>0.3?0.015+0.025*s.rev:0.001;
    if(lastThr-s.throttle>0.25&&s.speed>50){turboGain.cancelScheduledValues(t);   // blow-off chirp
      turboGain.gain.setValueAtTime(0.09,t);turboGain.gain.setTargetAtTime(tg,t+0.04,0.12);}
    else turboGain.gain.setTargetAtTime(tg,t,0.05);
    lastThr=s.throttle;
    tyreGain.gain.setTargetAtTime(Math.min(0.5,s.slide*0.6),t,0.03);
    tyreFilt.frequency.setTargetAtTime(1150+s.slide*700,t,0.05);
    windGain.gain.setTargetAtTime(Math.min(0.22,s.speed/130*0.22),t,0.1);
    windFilt.frequency.setTargetAtTime(300+s.speed*4,t,0.1);
  }
  function toggleMute(){muted=!muted;if(master)master.gain.setTargetAtTime(muted?0:0.85,ctx.currentTime,0.05);return muted;}
  return {init,resume,update,toggleMute,get ready(){return started;},get muted(){return muted;}};
})();
function audioTick(){
  const kmh=Math.abs(car.vx)*3.6;
  let g=1;for(let gg=7;gg>=0;gg--)if(kmh>=GEAR_KMH[gg]){g=gg+1;break;}
  const lo=GEAR_KMH[g-1],hi=g<8?GEAR_KMH[g]:356;
  let rev=clamp((kmh-lo)/(hi-lo),0,1);
  if(kmh<8)rev=Math.max(rev,car.throttle*0.55);      // blip on the spot
  SND.update({rev,throttle:car.throttle,slide:Math.max(car.slideF,car.slideR),
    speed:kmh,gear:car.reverse?1:g});
}

msg('P — pause & controls','#8fd0ff'); // one-time hint instead of a blocking intro
// fade the canvas in over the first frames so track load doesn't pop/flicker
cv.style.opacity='0';cv.style.transition='opacity .35s ease';
let pauseFade=0;
let last=performance.now(),acc=0;
function frame(now){
  let fdt=Math.min(0.05,(now-last)/1000);last=now;
  if(!paused){
    acc+=fdt;
    let steps=0;
    while(acc>=DT&&steps<8){step(DT);acc-=DT;steps++;}
    updateFX(fdt);
  }
  pauseFade+=((paused?1:0)-pauseFade)*Math.min(1,fdt*12);
  audioTick();
  render(fdt);
  if(cv.style.opacity==='0')cv.style.opacity='1'; // first frame is drawn — reveal
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// =========================================================================
// MOBILE TOUCH CONTROLS — injected on touch devices (or when a real touch is
// seen at runtime). Right: pedal-shaped accelerator + brake pads with a
// press-down feel. Left: steering, switchable between big arrow buttons and
// a drag steering wheel (choice remembered). Desktop keeps the keyboard
// path; these DOM controls feed the same key.* / touchSteerAxis inputs.
// =========================================================================
function initTouchUI(){
  if(document.getElementById('tc'))return;   // idempotent (runtime upgrade path)
  cv.style.touchAction='none';               // no scroll/zoom while driving
  const el=(t,c,html)=>{const n=document.createElement(t);if(c)n.className=c;if(html!=null)n.innerHTML=html;return n;};
  const style=document.createElement('style');
  style.textContent=`
  #tc{position:fixed;inset:0;z-index:30;pointer-events:none;touch-action:none;
    font:700 12px ui-monospace,Menlo,monospace;color:#cfd8e3;user-select:none;-webkit-user-select:none;}
  #tc *{pointer-events:auto;touch-action:none;-webkit-tap-highlight-color:transparent;box-sizing:border-box;}
  /* ---- pedals (right column, anchored bottom, kept below the minimap) ---- */
  #tc .pedals{position:absolute;right:14px;top:210px;bottom:14px;width:104px;
    display:flex;flex-direction:column;justify-content:flex-end;gap:14px;pointer-events:none;}
  /* pedal pads: rounded-rect plates with tread grooves, raised until pressed */
  #tc .pedal{position:relative;width:104px;height:min(128px,calc((100% - 14px)/2));
    min-height:76px;border-radius:14px 14px 18px 18px;border:2px solid;
    display:flex;flex-direction:column;align-items:center;justify-content:flex-end;
    padding-bottom:8px;letter-spacing:1.5px;font-size:12px;
    box-shadow:0 6px 0 rgba(0,0,0,.5),0 10px 16px rgba(0,0,0,.38);
    transition:transform .06s ease,box-shadow .06s ease,filter .06s ease;}
  #tc .pedal::before{content:'';position:absolute;left:14px;right:14px;top:10px;bottom:30px;
    border-radius:8px;border:1px solid rgba(255,255,255,.14);
    background:repeating-linear-gradient(180deg,transparent 0 7px,rgba(255,255,255,.16) 7px 10px);}
  #tc .gas{background:linear-gradient(180deg,rgba(34,120,62,.85),rgba(18,72,38,.85));
    border-color:rgba(96,220,138,.9);color:#a6f2bc;}
  #tc .brk{background:linear-gradient(180deg,rgba(150,44,38,.85),rgba(96,26,24,.85));
    border-color:rgba(255,122,110,.9);color:#ffb9b0;}
  /* press-down: pad sinks, shadow flattens, face brightens */
  #tc .pedal.on{transform:translateY(5px);filter:brightness(1.45);
    box-shadow:0 1px 0 rgba(0,0,0,.55),inset 0 3px 9px rgba(0,0,0,.55);}
  /* ---- steering (left, anchored bottom) ---- */
  #tc .steer{position:absolute;left:14px;bottom:14px;display:flex;flex-direction:column;
    align-items:flex-start;gap:10px;pointer-events:none;}
  #tc .toggle{padding:9px 13px;border-radius:10px;background:rgba(16,22,32,.8);
    border:1.5px solid rgba(120,150,180,.6);color:#cfd8e3;font:700 11px ui-monospace,monospace;
    letter-spacing:.5px;}
  #tc .toggle:active{background:rgba(40,60,84,.9);}
  #tc .arrows{display:flex;gap:12px;}
  #tc .arrow{width:86px;height:104px;border-radius:16px;background:rgba(16,22,32,.55);
    border:2px solid rgba(120,150,180,.6);display:flex;align-items:center;justify-content:center;
    font-size:42px;color:#dfe6ee;box-shadow:0 5px 0 rgba(0,0,0,.45),0 8px 14px rgba(0,0,0,.3);
    transition:transform .06s,background .06s,box-shadow .06s;}
  #tc .arrow.on{background:rgba(79,160,255,.6);border-color:#4fd0ff;color:#eaf6ff;
    transform:translateY(4px);box-shadow:0 1px 0 rgba(0,0,0,.5),inset 0 3px 8px rgba(0,0,0,.45);}
  #tc .wheel{width:150px;height:150px;border-radius:50%;position:relative;
    background:radial-gradient(circle at 50% 42%,rgba(64,74,88,.55),rgba(14,18,26,.78));
    border:8px solid rgba(150,160,175,.8);box-shadow:0 6px 18px rgba(0,0,0,.4),inset 0 0 18px rgba(0,0,0,.5);
    transition:transform .18s ease;}
  #tc .wheel.grab{transition:none;}
  #tc .wheel .hub{position:absolute;left:50%;top:50%;width:44px;height:44px;margin:-22px 0 0 -22px;
    border-radius:50%;background:rgba(20,26,36,.92);border:2px solid rgba(150,160,175,.5);}
  #tc .wheel .spoke{position:absolute;left:50%;top:50%;height:6px;width:116px;margin:-3px 0 0 -58px;
    background:rgba(150,160,175,.5);transform-origin:50% 50%;border-radius:3px;}
  #tc .wheel .mark{position:absolute;left:50%;top:6px;width:6px;height:16px;margin-left:-3px;
    border-radius:3px;background:rgba(255,90,79,.9);}
  /* short landscape phones: shrink so everything still fits vertically */
  @media (max-height:480px){
    #tc .wheel{width:126px;height:126px;}
    #tc .wheel .spoke{width:96px;margin-left:-48px;}
    #tc .arrow{width:76px;height:88px;font-size:36px;}
    #tc .pedals{top:200px;}
  }
  #tc .hidden{display:none!important;}`;
  document.head.appendChild(style);

  const root=el('div');root.id='tc';
  // --- pedals (right): accelerator on top, brake below ---
  const pedals=el('div','pedals');
  const gas=el('div','pedal gas','<span>GAS</span>');
  const brk=el('div','pedal brk','<span>BRAKE</span>');
  pedals.appendChild(gas);pedals.appendChild(brk);
  // --- steering (left): toggle + arrows or wheel ---
  const steer=el('div','steer');
  const toggle=el('button','toggle','');
  const arrows=el('div','arrows');
  const aL=el('div','arrow','&lsaquo;'),aR=el('div','arrow','&rsaquo;');
  arrows.appendChild(aL);arrows.appendChild(aR);
  const wheel=el('div','wheel','<div class="hub"></div><div class="mark"></div>');
  for(let i=0;i<3;i++){const s=el('div','spoke');s.style.transform='rotate('+(i*60)+'deg)';wheel.appendChild(s);}
  steer.appendChild(toggle);steer.appendChild(arrows);steer.appendChild(wheel);
  root.appendChild(pedals);root.appendChild(steer);
  document.body.appendChild(root);

  const wake=()=>{SND.init();SND.resume();dismissHelp();};
  // press-and-hold for the digital controls (pedals + arrows), pointer-captured
  function hold(node,on,off){
    node.addEventListener('pointerdown',e=>{e.preventDefault();wake();
      try{node.setPointerCapture(e.pointerId);}catch(_){}
      node.classList.add('on');on();});
    const up=()=>{node.classList.remove('on');off();};
    node.addEventListener('pointerup',up);
    node.addEventListener('pointercancel',up);
  }
  hold(gas,()=>key.up=true,()=>key.up=false);
  hold(brk,()=>key.down=true,()=>key.down=false);
  hold(aL,()=>key.left=true,()=>key.left=false);
  hold(aR,()=>key.right=true,()=>key.right=false);

  // --- steering wheel: drag left/right -> proportional axis; release recenters ---
  let wPid=null,wStart=0;
  wheel.addEventListener('pointerdown',e=>{e.preventDefault();wake();
    wPid=e.pointerId;wStart=e.clientX;wheel.classList.add('grab');
    try{wheel.setPointerCapture(e.pointerId);}catch(_){}});
  wheel.addEventListener('pointermove',e=>{if(e.pointerId!==wPid)return;
    const ax=Math.max(-1,Math.min(1,(e.clientX-wStart)/70));
    touchSteerAxis=ax;wheel.style.transform='rotate('+(ax*70)+'deg)';});
  const wEnd=e=>{if(e.pointerId!==wPid)return;wPid=null;touchSteerAxis=null;
    wheel.classList.remove('grab');wheel.style.transform='rotate(0deg)';};
  wheel.addEventListener('pointerup',wEnd);
  wheel.addEventListener('pointercancel',wEnd);

  // --- steering-style toggle (remembered) ---
  let styleMode=(()=>{try{return localStorage.getItem('f1sim-steer')||'arrows';}catch(e){return'arrows';}})();
  function applyStyle(){
    const w=styleMode==='wheel';
    arrows.classList.toggle('hidden',w);
    wheel.classList.toggle('hidden',!w);
    toggle.textContent=(w?'STEER: WHEEL':'STEER: ARROWS')+'  ⇆';
    key.left=key.right=false;touchSteerAxis=null;      // reset on switch
    aL.classList.remove('on');aR.classList.remove('on');
    wheel.style.transform='rotate(0deg)';
    try{localStorage.setItem('f1sim-steer',styleMode);}catch(e){}
  }
  toggle.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();
    styleMode=styleMode==='wheel'?'arrows':'wheel';applyStyle();});
  applyStyle();
  window.__touchUI={root,gas,brk,aL,aR,wheel,toggle,get style(){return styleMode;}}; // for verification
}
if(TOUCH)initTouchUI();

window.SIM={car,track,P,timing,key,placeCarAtS,switchTrack,actOvertake,
  get TOUCH(){return TOUCH;},get touchSteerAxis(){return touchSteerAxis;},
  get trackRef(){return track;},
  get sceneRef(){return scenery;},
  tick:(n,surf)=>{for(let i=0;i<n;i++)step(DT,surf);},
  draw:dt=>{updateFX(dt||1/60);render(dt||1/60);}};
