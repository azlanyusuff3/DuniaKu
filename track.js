import * as THREE from "./lib/three.module.js";
import {getWaveHeight,launchBoat,addBoost} from "./boat.js";
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const diff=(a,b)=>{let d=a-b;if(d>.5)d-=1;if(d<-.5)d+=1;return d;};
function color(c){return new THREE.MeshLambertMaterial({color:c,flatShading:true,side:THREE.DoubleSide});}
function baseGeo(type){
  if(type==="rock")return new THREE.DodecahedronGeometry(1,0);
  if(type==="palm")return new THREE.ConeGeometry(1,3.4,5);
  return new THREE.CylinderGeometry(.5,.58,1.55,7);
}
export function createTrack(scene,definition) {
  const spec=definition;
  const points=spec.points.map(([x,z])=>new THREE.Vector3(x,0,z));
  const spline=new THREE.CatmullRomCurve3(points,true,"catmullrom",.4);
  const samples=480;
  const center=Array.from({length:samples},(_,i)=>spline.getPointAt(i/samples));
  const tangentAt=u=>spline.getTangentAt(((u%1)+1)%1).normalize();
  const pointAt=(u,lane=0)=>{
    const p=spline.getPointAt(((u%1)+1)%1),t=tangentAt(u);
    p.x+=t.z*lane;p.z-=t.x*lane;return p;
  };
  const tangentHeading=u=>{const t=tangentAt(u);return Math.atan2(t.x,t.z);};
  const group=new THREE.Group();scene.add(group);
  const meshes=[];
  const add=(geometry,material,x,y,z,scale=1,rotation=0)=>{
    const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.scale.setScalar(scale);m.rotation.y=rotation;group.add(m);meshes.push(m);return m;
  };
  // Two low-cost instanced shore belts. Far-side objects help mask track edges.
  function instanced(geometry,material,count,items){
    const mesh=new THREE.InstancedMesh(geometry,material,count);
    const dummy=new THREE.Object3D();
    items.forEach((o,i)=>{dummy.position.set(o.x,o.y,o.z);dummy.scale.set(o.sx||1,o.sy||1,o.sz||1);dummy.rotation.set(0,o.rot||0,0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
    mesh.instanceMatrix.needsUpdate=true;group.add(mesh);meshes.push(mesh);return mesh;
  }
  const coast=[],stones=[],palms=[],buoys=[],hills=[];
  for(let i=0;i<300;i++){
    const u=i/300;
    for(const side of [-1,1]){
      const p=pointAt(u,side*(spec.width*.5+4));
      coast.push({x:p.x,y:-.9,z:p.z,sx:4.6,sy:2,sz:4.6});
      if(i%5===0){
        const rocky=pointAt(u,side*(spec.width*.5+9));
        stones.push({x:rocky.x,y:1.7,z:rocky.z,sx:3.0+(i%3),sy:2.7+(i%5),sz:3.2,rot:i*.43});
      }
      if(i%15===0){
        const farther=pointAt(u,side*(spec.width*.5+16));
        palms.push({x:farther.x,y:6.7,z:farther.z,sx:3,sy:3.5,sz:3,rot:i});
      }
    }
  }
  instanced(new THREE.IcosahedronGeometry(1,0),color(spec.ground),coast.length,coast);
  instanced(baseGeo("rock"),color(spec.ground),stones.length,stones);
  instanced(baseGeo("palm"),color(spec.id==="frost"?"#dce7f8":"#5c9e71"),palms.length,palms);
  for(let i=0;i<28;i++){
    const u=i/28;
    for(const side of [-1,1]){const p=pointAt(u,side*spec.width*.47);buoys.push({x:p.x,y:.65,z:p.z,sx:.8,sy:1.5,sz:.8});}
  }
  instanced(baseGeo("buoy"),color("#fff8d9"),buoys.length,buoys);
  const rampMaterial=color("#a66d55");
  const ramps=spec.ramps.map((u,i)=>{
    const p=pointAt(u),heading=tangentHeading(u);
    const ramp=add(new THREE.BoxGeometry(spec.width*.48,.7,7),rampMaterial,p.x,.7,p.z,1,heading);
    ramp.rotation.x=-.15;
    const side=add(new THREE.BoxGeometry(spec.width*.48,.25,.9),color("#ffebbc"),p.x,1.35,p.z,1,heading);
    return {u,x:p.x,z:p.z,radius:7,triggered:new WeakSet()};
  });
  const pickupMat=new THREE.MeshBasicMaterial({color:0x78ebff});
  const pickups=spec.pickups.map((u,i)=>{
    const lane=(i%3-1)*spec.width*.21;
    const p=pointAt(u,lane);
    const mesh=add(new THREE.OctahedronGeometry(1.2,0),pickupMat.clone(),p.x,2,p.z);
    const ring=add(new THREE.TorusGeometry(1.35,.15,4,8),color("#fdf4ff"),p.x,2,p.z);
    return {u,p,mesh,ring,active:true,timer:0};
  });
  const hazards=[];
  const hazardMat=color("#656c77");
  for(const [kind,values] of [["rock",spec.rocks||[]],["log",spec.logs||[]],["whirlpool",spec.whirlpools||[]]]){
    for(const u of values){
      const lane=((Math.round(u*100)%3)-1)*spec.width*.19;
      const p=pointAt(u,lane);
      const geometry=kind==="log"?new THREE.CylinderGeometry(.45,.45,6,6):
         kind==="whirlpool"?new THREE.TorusGeometry(2.2,.33,5,12):new THREE.DodecahedronGeometry(2.3,0);
      const m=add(geometry,kind==="whirlpool"?color("#3e8dbe"):hazardMat,p.x,kind==="rock"?1:kind==="log"?.3:.12,p.z);
      if(kind==="log")m.rotation.z=Math.PI/2;
      if(kind==="whirlpool")m.rotation.x=-Math.PI/2;
      hazards.push({type:kind,p,mesh:m,radius:kind==="rock"?3.5:kind==="log"?3.5:4.7});
    }
  }
  const start=pointAt(0),line=add(new THREE.BoxGeometry(spec.width,.13,1),color("#fff5eb"),start.x,.12,start.z,1,tangentHeading(0));
  for(let i=0;i<7;i++){
    const p=pointAt(0,(i-3)*spec.width/7);
    add(new THREE.BoxGeometry(spec.width/7,.15,.95),color(i%2?"#243d59":"#fef9f4"),p.x,.2,p.z,1,tangentHeading(0));
  }
  const decorGeo=new THREE.SphereGeometry(1.4,6,4),decorMat=color("#f6dfa2");
  for(let i=0;i<8;i++){
    const u=i/8+.03,p=pointAt(u,(i%2?1:-1)*spec.width*.68);
    add(decorGeo,decorMat,p.x,3,p.z,1.5);
  }
  function nearest(x,z,guess=null) {
    let best=Infinity,index=0;
    // A local sliding lookup is fast, with a full search for resets/teleports.
    const iterate=guess===null ? Array.from({length:samples},(_,i)=>i) :
      Array.from({length:51},(_,i)=>(Math.round(guess*samples)+i-25+samples*3)%samples);
    for(const i of iterate){
      const p=center[i],d=(p.x-x)**2+(p.z-z)**2;
      if(d<best){best=d;index=i;}
    }
    const u=index/samples,p=pointAt(u),t=tangentAt(u);
    return {u,p,t,distance:Math.sqrt(best),lane:(x-p.x)*t.z-(z-p.z)*t.x};
  }
  function resetBoat(b,lane=0,offset=0) {
    const u=((offset%1)+1)%1,p=pointAt(u,lane);
    b.x=p.x;b.z=p.z;b.heading=tangentHeading(u);b.vx=0;b.vz=0;b.speed=0;
    b.progress=u;b.lastU=u;b.travel=0;b.lap=1;b.checkpoint=0;b.done=false;b.wrongWay=false;
    b.inAir=false;b.yOffset=0;b.verticalSpeed=0;b.boostTime=0;b.boostPips=1;
    b.rampCooldown=0;b.hazardCooldown=0;b.elapsed=0;b.bestLap=Infinity;b.lapTime=0;
    b.group.position.set(b.x,getWaveHeight(b.x,b.z,0),b.z);
  }
  function updateBoatTrack(b,dt,time) {
    if(b.done)return;
    const n=nearest(b.x,b.z,b.lastU);
    const progressDelta=diff(n.u,b.lastU??n.u);
    const directional=b.vx*n.t.x+b.vz*n.t.z;
    b.wrongWay=directional < -6 && b.speed>8;
    if(Math.abs(progressDelta)<.06){
      if(progressDelta>0 || b.travel>0) {
        b.travel=Math.max(0,b.travel+progressDelta);
        const stage=Math.floor(b.travel*12);
        if(stage>b.checkpoint && stage<=b.checkpoint+2)b.checkpoint=stage;
        if(b.checkpoint>=b.lap*12){
          b.bestLap=Math.min(b.bestLap,b.lapTime);
          b.lap++;b.lapTime=0;
          if(b.lap>3){b.done=true;b.finishTime=b.elapsed;b.lap=3;}
        }
      }
    }
    b.progress=n.u;b.lastU=n.u;
    b.elapsed+=dt;b.lapTime+=dt;
    // Soft shore bounce when leaving navigable water.
    const limit=spec.width*.5-1.5;
    if(Math.abs(n.lane)>limit){
      const over=Math.abs(n.lane)-limit,sign=Math.sign(n.lane);
      b.x-=n.t.z*sign*over*.38;b.z+=n.t.x*sign*over*.38;
      b.vx-=n.t.z*sign*6*dt;b.vz+=n.t.x*sign*6*dt;
      b.speed=Math.max(8,b.speed*(1-dt*2.2));
    }
    b.rampCooldown=Math.max(0,(b.rampCooldown||0)-dt);
    b.hazardCooldown=Math.max(0,(b.hazardCooldown||0)-dt);
    for(const ramp of ramps){
      if(b.rampCooldown>0||b.inAir)break;
      if(Math.hypot(b.x-ramp.x,b.z-ramp.z)<ramp.radius && directional>8){
        if(launchBoat(b,7.8+b.speed*.045))b.rampCooldown=2;
      }
    }
    if(!b.inAir && b.hazardCooldown<=0){
      for(const hazard of hazards){
        if(Math.hypot(b.x-hazard.p.x,b.z-hazard.p.z)<hazard.radius){
          b.speed*=hazard.type==="whirlpool"?.65:.45;b.hazardCooldown=1.1;
          b.heading+=(b.x<hazard.p.x?-1:1)*.35;break;
        }
      }
    }
    for(const pickup of pickups){
      if(!pickup.active)continue;
      if(Math.hypot(b.x-pickup.p.x,b.z-pickup.p.z)<2.7){
        addBoost(b,1);pickup.active=false;pickup.mesh.visible=false;pickup.ring.visible=false;pickup.timer=8;
      }
    }
  }
  function update(dt,time) {
    pickups.forEach((p,i)=>{
      if(!p.active){p.timer-=dt;if(p.timer<=0){p.active=true;p.mesh.visible=true;p.ring.visible=true;}}
      if(p.active){p.mesh.rotation.y+=dt*2.2;p.mesh.position.y=1.9+Math.sin(time*3+i)*.4;p.ring.position.y=p.mesh.position.y;p.ring.rotation.z+=dt*.5;}
    });
  }
  function dispose(){group.traverse(obj=>{if(obj.isMesh||obj.isInstancedMesh){obj.geometry?.dispose();if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose());else obj.material?.dispose();}});scene.remove(group);}
  return {group,spec,spline,samples,center,pointAt,tangentAt,tangentHeading,nearest,resetBoat,updateBoatTrack,update,dispose,ramps,pickups,hazards};
}
