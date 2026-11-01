import * as THREE from "./lib/three.module.js";
import {getWaveHeight,launchBoat,addBoost} from "./boat.js";

const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const wrap = n => (n % 1 + 1) % 1;
const signedDelta = (a,b) => { let d=a-b; if(d>.5)d-=1; if(d<-.5)d+=1; return d; };
const material = (hex, extra={}) => new THREE.MeshLambertMaterial({color:hex,flatShading:true,side:THREE.DoubleSide,...extra});
const glow = (hex, opacity=1) => new THREE.MeshBasicMaterial({color:hex,transparent:opacity<1,opacity,side:THREE.DoubleSide,depthWrite:opacity>=1});

export function createTrack(scene,spec) {
  const points=spec.points.map(([x,z])=>new THREE.Vector3(x,0,z));
  const spline=new THREE.CatmullRomCurve3(points,true,"catmullrom",.4);
  const samples=480;
  const center=Array.from({length:samples},(_,i)=>spline.getPointAt(i/samples));
  const tangentAt=u=>spline.getTangentAt(wrap(u)).normalize();
  const pointAt=(u,lane=0)=>{
    const p=spline.getPointAt(wrap(u)),t=tangentAt(u);
    p.x+=t.z*lane;p.z-=t.x*lane;return p;
  };
  const tangentHeading=u=>{const t=tangentAt(u);return Math.atan2(t.x,t.z);};
  const group=new THREE.Group();scene.add(group);
  const add=(geometry,mat,x,y,z,scale=1,rotation=0)=>{
    const mesh=new THREE.Mesh(geometry,mat);
    mesh.position.set(x,y,z);mesh.scale.setScalar(scale);mesh.rotation.y=rotation;group.add(mesh);return mesh;
  };
  const instanced=(geometry,mat,items)=>{
    if(!items.length)return null;
    const mesh=new THREE.InstancedMesh(geometry,mat,items.length);
    const temp=new THREE.Object3D();
    items.forEach((item,i)=>{
      temp.position.set(item.x,item.y,item.z);
      temp.scale.set(item.sx??1,item.sy??1,item.sz??1);
      temp.rotation.set(item.rx||0,item.rot||0,item.rz||0);temp.updateMatrix();mesh.setMatrixAt(i,temp.matrix);
    });
    mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
    group.add(mesh);return mesh;
  };

  // Each shortcut is an actual navigable branch, not a decoration or a teleport.
  const shortcuts=(spec.shortcuts||[]).map((raw,index)=>{
    const start=pointAt(raw.from,raw.entryLane*spec.width);
    const end=pointAt(raw.to,raw.exitLane*spec.width);
    const midpoint=start.clone().add(end).multiplyScalar(.5);
    const dx=end.x-start.x,dz=end.z-start.z,len=Math.hypot(dx,dz)||1;
    midpoint.x+=-dz/len*(raw.bend||0);midpoint.z+=dx/len*(raw.bend||0);
    const curve=new THREE.QuadraticBezierCurve3(start,midpoint,end);
    const path=Array.from({length:65},(_,i)=>curve.getPoint(i/64));
    const route={...raw,index,start,end,curve,path,
      entryRadius:5.8,exitRadius:17,width:raw.width||13};
    return route;
  });
  function closestRoute(route,x,z) {
    let distance=Infinity,t=0,p=route.start;
    for(let i=0;i<route.path.length;i++){
      const q=route.path[i],d=(x-q.x)**2+(z-q.z)**2;
      if(d<distance){distance=d;t=i/(route.path.length-1);p=q;}
    }
    return {t,p,distance:Math.sqrt(distance)};
  }
  function pathClear(x,z,extra=0){
    return shortcuts.some(route=>closestRoute(route,x,z).distance < route.width*.75+extra);
  }
  function shortcutAt(route,t){return route.curve.getPoint(clamp(t,0,1));}
  function nearbyShortcut(u){
    return shortcuts.find(route=>signedDelta(u,route.from)>-.045&&signedDelta(u,route.from)<.025)||null;
  }

  // Shoreline, low-poly cliffs and palms/ice, all batched via instancing.
  const banks=[],rocks=[],plants=[],buoys=[],posts=[],lights=[],crystals=[];
  const rockKind=spec.id==="canyon"?"#bd6d64":spec.id==="frost"?"#b8d2e6":"#659879";
  const plantKind=spec.id==="canyon"?"#704f69":spec.id==="frost"?"#eff8fc":"#50a06f";
  for(let i=0;i<265;i++){
    const u=i/265;
    for(const side of [-1,1]){
      const bank=pointAt(u,side*(spec.width*.5+3.5));
      if(!pathClear(bank.x,bank.z,5)){
        banks.push({x:bank.x,y:-1,z:bank.z,sx:4.5,sy:2.2,sz:4.5});
        if(i%5===0){
          const p=pointAt(u,side*(spec.width*.5+9));
          if(!pathClear(p.x,p.z,6))rocks.push({x:p.x,y:spec.id==="canyon"?4.7:2.5,z:p.z,
            sx:spec.id==="canyon"?4.9:3.2,sy:spec.id==="canyon"?6.9:3.7,sz:3.5,rot:i*.43});
        }
        if(i%14===0){
          const p=pointAt(u,side*(spec.width*.5+15));
          if(!pathClear(p.x,p.z,6))plants.push({x:p.x,y:spec.id==="canyon"?8:spec.id==="frost"?5.7:6.5,z:p.z,
            sx:spec.id==="canyon"?4.3:3.1,sy:spec.id==="canyon"?4.3:3.5,sz:3.1,rot:i});
        }
        if(spec.id==="canyon"&&i%20===0){
          const p=pointAt(u,side*(spec.width*.5+1.5));
          posts.push({x:p.x,y:2.7,z:p.z,sx:.3,sy:5.3,sz:.3});
          lights.push({x:p.x,y:5.4,z:p.z,sx:.65,sy:.8,sz:.65});
        }
        if(spec.id==="frost"&&i%18===0){
          const p=pointAt(u,side*(spec.width*.5+6));
          crystals.push({x:p.x,y:2.5,z:p.z,sx:2.2,sy:4.3,sz:2.2,rot:i*.7});
        }
      }
    }
  }
  instanced(new THREE.IcosahedronGeometry(1,0),material(spec.ground),banks);
  instanced(new THREE.DodecahedronGeometry(1,0),material(rockKind),rocks);
  instanced(new THREE.ConeGeometry(1,3.4,5),material(plantKind),plants);
  instanced(new THREE.CylinderGeometry(1,1,1,5),material("#76565c"),posts);
  instanced(new THREE.OctahedronGeometry(1,0),glow("#ffcf87"),lights);
  instanced(new THREE.ConeGeometry(1,3,4),material("#cff7ff"),crystals);
  for(let i=0;i<28;i++){
    const u=i/28;
    for(const side of [-1,1]){
      const p=pointAt(u,side*spec.width*.47);
      buoys.push({x:p.x,y:.6,z:p.z,sx:.72,sy:1.45,sz:.72});
    }
  }
  instanced(new THREE.CylinderGeometry(.5,.58,1.55,7),material("#fff6dd"),buoys);

  // Procedural ramp meshes and collectible boost orbs.
  const rampMat=material(spec.id==="frost"?"#a9deef":"#a46e57");
  const ramps=(spec.ramps||[]).map(u=>{
    const p=pointAt(u),heading=tangentHeading(u);
    const m=add(new THREE.BoxGeometry(spec.width*.48,.7,7),rampMat,p.x,.7,p.z,1,heading);
    m.rotation.x=-.17;
    add(new THREE.BoxGeometry(spec.width*.48,.25,.9),material("#fff4c2"),p.x,1.4,p.z,1,heading);
    return {u,p,radius:7.2};
  });
  const pickups=(spec.pickups||[]).map((u,i)=>{
    const p=pointAt(u,(i%3-1)*spec.width*.21);
    const mesh=add(new THREE.OctahedronGeometry(1.2,0),glow("#79efff"),p.x,2,p.z);
    const ring=add(new THREE.TorusGeometry(1.35,.15,4,8),glow("#ffffff"),p.x,2,p.z);
    return {u,p,mesh,ring,active:true,timer:0};
  });
  const hazards=[];
  for(const [type,locations] of Object.entries({
    rock:spec.rocks||[],log:spec.logs||[],whirlpool:spec.whirlpools||[],
    barrel:spec.barrels||[],ice:spec.ice||[]
  })){
    locations.forEach((u,i)=>{
      const p=pointAt(u,((Math.round(u*100)%3)-1)*spec.width*.19);
      const geom=type==="log"?new THREE.CylinderGeometry(.48,.48,6,6):
        type==="whirlpool"?new THREE.TorusGeometry(2.2,.32,5,12):
        type==="barrel"?new THREE.CylinderGeometry(1.2,1,2.7,7):
        type==="ice"?new THREE.ConeGeometry(1.6,4.1,5):new THREE.DodecahedronGeometry(2.3,0);
      const mat=material(type==="ice"?"#ecf8ff":type==="barrel"?"#bf7557":type==="whirlpool"?"#368bb3":"#666f79");
      const mesh=add(geom,mat,p.x,type==="rock"?1:type==="ice"?1.6:type==="whirlpool"?.15:.45,p.z);
      if(type==="log")mesh.rotation.z=Math.PI/2;
      if(type==="whirlpool")mesh.rotation.x=-Math.PI/2;
      hazards.push({type,p,mesh,radius:type==="whirlpool"?4.7:type==="log"?3.5:type==="ice"?2.8:3.4,phase:i*2+u*10});
    });
  }

  // Checkered start line. The same geometry works on all three tracks.
  const start=pointAt(0),heading=tangentHeading(0);
  add(new THREE.BoxGeometry(spec.width,.13,1),material("#fff0dc"),start.x,.14,start.z,1,heading);
  for(let i=0;i<8;i++){
    const p=pointAt(0,(i-3.5)*spec.width/8);
    add(new THREE.BoxGeometry(spec.width/8,.16,.95),material(i%2?"#294564":"#faf7ef"),p.x,.24,p.z,1,heading);
  }

  // Visible portals and marked water corridor for each optional alternate route.
  for(const route of shortcuts){
    const portalMat=material(route.kind==="cave"?"#635571":"#addaf0");
    const trimMat=glow(route.kind==="cave"?"#ffdb8c":"#d5fcff");
    const createGate=(p,t)=>{
      const tangent=route.curve.getTangent(t).normalize(),yaw=Math.atan2(tangent.x,tangent.z);
      const side=new THREE.Vector3(tangent.z,0,-tangent.x),width=route.width*.48;
      for(const sign of [-1,1]){
        const x=p.x+side.x*width*sign,z=p.z+side.z*width*sign;
        add(new THREE.CylinderGeometry(1.3,1.7,7,6),portalMat,x,3.15,z);
        add(new THREE.OctahedronGeometry(.9,0),trimMat,x,7.35,z);
      }
      add(new THREE.BoxGeometry(route.width+1,1.2,1.7),portalMat,p.x,7.1,p.z,1,yaw);
    };
    createGate(route.start,0);createGate(route.end,1);
    const routeGuides=[];
    for(let i=1;i<=17;i++){
      const t=i/18,p=shortcutAt(route,t);
      routeGuides.push({x:p.x,y:.55,z:p.z,sx:.6,sy:.7,sz:.6});
    }
    instanced(new THREE.OctahedronGeometry(1,0),glow(route.kind==="cave"?"#ffd89b":"#a3f5ff"),routeGuides);
    if(route.kind==="cave"){
      const walls=[],roof=[];
      for(let i=0;i<9;i++){
        const t=(i+.5)/9,p=shortcutAt(route,t),tangent=route.curve.getTangent(t).normalize();
        const side=new THREE.Vector3(tangent.z,0,-tangent.x);
        for(const sign of [-1,1]){
          walls.push({x:p.x+side.x*(route.width*.5+1.5)*sign,y:4.2,z:p.z+side.z*(route.width*.5+1.5)*sign,sx:2.6,sy:8.4,sz:3.1,rot:i*.31});
        }
        if(i%2===0)roof.push({x:p.x,y:9.5,z:p.z,sx:route.width*.63,sy:2.5,sz:5.8});
      }
      instanced(new THREE.DodecahedronGeometry(1,0),material("#66536f"),walls);
      instanced(new THREE.IcosahedronGeometry(1,0),material("#765e74"),roof);
    }
    if(route.kind==="waterfall"){
      const p=shortcutAt(route,.48),tangent=route.curve.getTangent(.48).normalize();
      const yaw=Math.atan2(tangent.x,tangent.z);
      const curtain=add(new THREE.PlaneGeometry(route.width+5,15),glow("#a9efff",.46),p.x,7.5,p.z,1,yaw);
      curtain.userData.waterfall=true;
      const mist=[];
      for(let i=0;i<15;i++){
        const q=shortcutAt(route,.38+(i%6)*.036),side=((i%5)-2)*2.1;
        mist.push({x:q.x+tangent.z*side,y:1.1+(i%3)*.4,z:q.z-tangent.x*side,sx:.8,sy:.4,sz:.8});
      }
      instanced(new THREE.OctahedronGeometry(1,0),glow("#e8faff",.78),mist);
      const rp=shortcutAt(route,route.jumpAt),direction=route.curve.getTangent(route.jumpAt).normalize();
      const ramp=add(new THREE.BoxGeometry(route.width*.7,.8,7),material("#daeff4"),rp.x,.9,rp.z,1,Math.atan2(direction.x,direction.z));
      ramp.rotation.x=-.18;
    }
    if(Number.isFinite(route.hazardT)){
      const p=shortcutAt(route,route.hazardT);
      const m=add(route.kind==="cave"?new THREE.CylinderGeometry(1.2,1.2,2.7,7):new THREE.ConeGeometry(1.5,3.4,5),
        material(route.kind==="cave"?"#b97b61":"#d6f6ff"),p.x,1.1,p.z);
      hazards.push({type:route.kind==="cave"?"barrel":"ice",p,mesh:m,radius:2.7,phase:0,branch:route});
    }
  }

  function nearest(x,z,guess=null) {
    let best=Infinity,index=0;
    // Restrict search to the most recently visited 1/10 lap. Prevent track jumps.
    const startIndex=guess===null?0:Math.round(wrap(guess)*samples);
    const count=guess===null?samples:61;
    for(let j=0;j<count;j++){
      const i=guess===null?j:(startIndex+j-30+samples*3)%samples;
      const p=center[i],d=(p.x-x)**2+(p.z-z)**2;
      if(d<best){best=d;index=i;}
    }
    const u=index/samples,p=pointAt(u),t=tangentAt(u);
    return {u,p,t,distance:Math.sqrt(best),lane:(x-p.x)*t.z-(z-p.z)*t.x};
  }
  function resetBoat(b,lane=0,offset=0) {
    const u=wrap(offset),p=pointAt(u,lane);
    b.x=p.x;b.z=p.z;b.heading=tangentHeading(u);b.vx=0;b.vz=0;b.speed=0;
    b.progress=u;b.lastU=u;b.travel=0;b.lap=1;b.checkpoint=0;b.done=false;b.wrongWay=false;
    b.inAir=false;b.yOffset=0;b.verticalSpeed=0;b.boostTime=0;b.boostPips=1;
    b.rampCooldown=0;b.hazardCooldown=0;b.elapsed=0;b.bestLap=Infinity;b.lapTime=0;
    b.shortcut=null;b.shortcutPlan=null;b.lastPlanLap=0;
    b.group.position.set(b.x,getWaveHeight(b.x,b.z,0),b.z);
  }
  function advanceProgress(b,travel,dt) {
    b.travel=Math.max(0,travel);
    const stage=Math.floor((b.travel+1e-6)*12);
    if(stage>b.checkpoint&&stage<=b.checkpoint+2)b.checkpoint=stage;
    if(b.checkpoint>=b.lap*12){
      b.bestLap=Math.min(b.bestLap,b.lapTime);
      b.lap++;b.lapTime=0;
      if(b.lap>3){b.done=true;b.finishTime=b.elapsed;b.lap=3;}
    }
  }
  function hazardCollision(b,route=null) {
    if(b.inAir||b.hazardCooldown>0)return;
    for(const h of hazards){
      if((h.branch||null)!==route)continue;
      if(Math.hypot(b.x-h.mesh.position.x,b.z-h.mesh.position.z)<h.radius){
        b.speed*=h.type==="whirlpool"?.67:.48;
        b.hazardCooldown=1.15;b.heading+=(b.x<h.p.x?-1:1)*.37;break;
      }
    }
  }
  function updateBoatTrack(b,dt,time) {
    if(b.done)return;
    b.elapsed+=dt;b.lapTime+=dt;
    b.rampCooldown=Math.max(0,(b.rampCooldown||0)-dt);
    b.hazardCooldown=Math.max(0,(b.hazardCooldown||0)-dt);
    // Shortcut corridor: advance along a visible, steerable curve, preserving checkpoint order.
    if(b.shortcut){
      const active=b.shortcut,route=active.route,hit=closestRoute(route,b.x,b.z);
      const previous=active.t;active.t=hit.t;
      const tangent=route.curve.getTangent(hit.t).normalize();
      b.wrongWay=b.vx*tangent.x+b.vz*tangent.z < -6 && b.speed>8;
      const allowed=route.width*.48;
      if(hit.distance>allowed){
        const excess=Math.min(2.4,hit.distance-allowed),dx=hit.p.x-b.x,dz=hit.p.z-b.z;
        const length=Math.hypot(dx,dz)||1;
        b.x+=dx/length*excess*.42;b.z+=dz/length*excess*.42;
        b.speed=Math.max(8,b.speed*(1-.7*dt));
      }
      advanceProgress(b,active.base+active.t*(route.to-route.from),dt);
      if(route.jumpAt && previous<route.jumpAt && active.t>=route.jumpAt && !b.inAir){
        launchBoat(b,11.7);b.rampCooldown=2.3;
      }
      hazardCollision(b,route);
      if(active.t>.91 && Math.hypot(b.x-route.end.x,b.z-route.end.z)<route.exitRadius &&
         b.vx*tangent.x+b.vz*tangent.z>3){
        advanceProgress(b,active.base+(route.to-route.from),dt);
        b.lastU=route.to;b.progress=route.to;b.shortcut=null;
      }
      return;
    }

    const n=nearest(b.x,b.z,b.lastU);
    const progressDelta=signedDelta(n.u,b.lastU??n.u);
    const directional=b.vx*n.t.x+b.vz*n.t.z;
    b.wrongWay=directional<-6&&b.speed>8;
    if(Math.abs(progressDelta)<.055){
      // Signed motion allows reverse driving without awarding extra laps.
      advanceProgress(b,b.travel+progressDelta,dt);
    }
    b.progress=n.u;b.lastU=n.u;

    for(const route of shortcuts){
      if(signedDelta(n.u,route.from)<-.028||signedDelta(n.u,route.from)>.03)continue;
      if(directional<5||Math.hypot(b.x-route.start.x,b.z-route.start.z)>route.entryRadius)continue;
      b.shortcut={route,base:Math.floor(b.travel)+route.from,t:0};
      b.shortcutPlan=null;b.travel=Math.max(b.travel,b.shortcut.base);
      b.wrongWay=false;
      return;
    }
    const limit=spec.width*.5-1.5;
    if(Math.abs(n.lane)>limit){
      const over=Math.abs(n.lane)-limit,sign=Math.sign(n.lane);
      b.x-=n.t.z*sign*over*.38;b.z+=n.t.x*sign*over*.38;
      b.vx-=n.t.z*sign*6*dt;b.vz+=n.t.x*sign*6*dt;
      b.speed=Math.max(8,b.speed*(1-dt*2.2));
    }
    for(const ramp of ramps){
      if(b.rampCooldown>0||b.inAir)break;
      if(Math.hypot(b.x-ramp.p.x,b.z-ramp.p.z)<ramp.radius&&directional>8){
        if(launchBoat(b,7.8+b.speed*.045))b.rampCooldown=2;
      }
    }
    hazardCollision(b,null);
    for(const pickup of pickups){
      if(!pickup.active)continue;
      if(Math.hypot(b.x-pickup.p.x,b.z-pickup.p.z)<2.7){
        addBoost(b,1);pickup.active=false;pickup.mesh.visible=false;pickup.ring.visible=false;pickup.timer=8;
      }
    }
  }
  function update(dt,time){
    pickups.forEach((p,i)=>{
      if(!p.active){p.timer-=dt;if(p.timer<=0){p.active=true;p.mesh.visible=true;p.ring.visible=true;}}
      if(p.active){
        p.mesh.rotation.y+=dt*2.2;p.mesh.position.y=1.9+Math.sin(time*3+i)*.4;
        p.ring.position.y=p.mesh.position.y;p.ring.rotation.z+=dt*.5;
      }
    });
    for(const h of hazards){
      if(h.type==="barrel"&&!h.branch){
        const t=tangentAt(nearest(h.p.x,h.p.z).u),d=Math.sin(time*.8+h.phase)*1.4;
        h.mesh.position.x=h.p.x+t.z*d;h.mesh.position.z=h.p.z-t.x*d;
        h.mesh.rotation.z=Math.sin(time+h.phase)*.13;
      }
      if(h.type==="ice")h.mesh.rotation.y=time*.17+h.phase;
    }
  }
  function dispose(){
    const geometries=new Set(),materials=new Set();
    group.traverse(obj=>{
      if(obj.geometry)geometries.add(obj.geometry);
      if(obj.material)(Array.isArray(obj.material)?obj.material:[obj.material]).forEach(m=>materials.add(m));
    });
    geometries.forEach(g=>g.dispose());
    materials.forEach(m=>m.dispose());
    scene.remove(group);
  }
  return {group,spec,spline,samples,center,pointAt,tangentAt,tangentHeading,nearest,resetBoat,updateBoatTrack,
    update,dispose,ramps,pickups,hazards,shortcuts,shortcutAt,nearbyShortcut};
}
