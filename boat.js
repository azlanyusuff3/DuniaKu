import * as THREE from "./lib/three.module.js";
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const lerp = (a,b,t) => a+(b-a)*t;
const DEFAULTS = {maxSpeed:38, accel:17, handling:1, boostPower:1};
function box(w,h,d,material,x=0,y=0,z=0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.position.set(x,y,z); return mesh;
}
function mat(color) { return new THREE.MeshLambertMaterial({color,flatShading:true}); }
export function getWaveHeight(x,z,t) {
  return .16*Math.sin(x*.075+t*1.5) + .18*Math.cos(z*.092-t*1.06) +
    .065*Math.sin((x+z)*.19+t*2.8);
}
export function createBoat(scene, options={}) {
  const stats = {...DEFAULTS,...(options.stats||{})};
  const color = options.color || "#ff8bb2", accent = options.accent || "#fff4d9";
  const hullMat=mat(color), deckMat=mat(accent), dark=mat("#294865"), glass=mat("#a1eafb");
  const group=new THREE.Group(), model=new THREE.Group();
  group.add(model);
  model.add(box(1.36,.43,3.05,hullMat,0,.26,0));
  model.add(box(1.12,.21,2.5,deckMat,0,.54,-.12));
  const bow=new THREE.Mesh(new THREE.ConeGeometry(.69,1.12,4),hullMat);
  bow.rotation.x=Math.PI/2; bow.rotation.z=Math.PI/4;
  bow.position.set(0,.34,1.6); model.add(bow);
  model.add(box(.89,.38,1.1,glass,0,.79,-.18));
  model.add(box(.64,.18,.18,dark,0,.96,-.77));
  model.add(box(.95,.2,.28,dark,0,.47,-1.46));
  model.add(box(.2,.22,1.48,deckMat,-.71,.43,-.28));
  model.add(box(.2,.22,1.48,deckMat,.71,.43,-.28));
  // Procedural chibi driver: driver sprite billboard may replace this via sprites/list.json.
  const driver=new THREE.Group();
  const helmet=new THREE.Mesh(new THREE.SphereGeometry(.34,7,5),mat(options.helmet||"#fff1ac"));
  helmet.position.y=1.34; driver.add(helmet);
  const visor=box(.4,.14,.1,dark,0,1.37,.27);driver.add(visor);
  model.add(driver);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(1.35,16),new THREE.MeshBasicMaterial({color:0x155f78,transparent:true,opacity:.25,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2; shadow.scale.set(.82,1.45,1); scene.add(shadow);
  const count=30, positions=new Float32Array(count*3), particles=[];
  for(let i=0;i<count;i++){positions.set([0,-1000,0],i*3);particles.push({life:0,max:1,x:0,y:0,z:0,vx:0,vy:0,vz:0});}
  const wakeGeo=new THREE.BufferGeometry();
  wakeGeo.setAttribute("position",new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  const wake=new THREE.Points(wakeGeo,new THREE.PointsMaterial({color:0xe8ffff,size:.32,transparent:true,opacity:.88,depthWrite:false,sizeAttenuation:true}));
  wake.frustumCulled=false; scene.add(wake);
  scene.add(group);
  return {group,model,driver,shadow,wake,particles,stats,
    x:options.x||0,z:options.z||0,heading:options.heading||0,y:0,
    speed:0,vx:0,vz:0,steer:0,boostPips:0,boostTime:0,
    inAir:false,yOffset:0,verticalSpeed:0,trickSpin:0,trickProgress:0,
    wakeClock:0,splash:0,done:false,lap:1,progress:0,checkpoint:0,
    onLand:null,name:options.name||"Mochi Dart"};
}
function spawn(b,splash=false) {
  const p=b.particles.find(q=>q.life<=0);
  if(!p) return;
  const backX=Math.sin(b.heading), backZ=Math.cos(b.heading);
  p.max=splash ? .65 : .5; p.life=p.max;
  p.x=b.x-backX*(splash?.4:1.6)+(Math.random()-.5)*1.1;
  p.z=b.z-backZ*(splash?.4:1.6)+(Math.random()-.5)*1.1;
  p.y=b.y+.2;
  p.vx=(Math.random()-.5)*(splash?5:2)-backX*2;
  p.vy=splash?2+Math.random()*3:Math.random()*.7;
  p.vz=(Math.random()-.5)*(splash?5:2)-backZ*2;
}
export function launchBoat(b,power=7.2) {
  if (b.inAir) return false;
  b.inAir=true; b.verticalSpeed=power; b.yOffset=Math.max(b.yOffset,.3);
  b.trickSpin=0; b.trickProgress=0; return true;
}
export function addBoost(b,n=1) {b.boostPips=clamp(b.boostPips+n,0,3);}
export function updateBoat(b,controls,dt,time) {
  dt=Math.min(dt,.05);
  const steer=clamp(controls.steer||0,-1,1);
  b.steer=steer;
  const norm=clamp(b.speed/b.stats.maxSpeed,0,1.45);
  b.heading+=steer*(.55+1.02*norm)*(b.stats.handling||1)*dt;
  if(controls.boost && b.boostTime<=0 && b.boostPips>0){
    b.boostPips--; b.boostTime=.95+(b.stats.boostPower||1)*.22;
  }
  b.boostTime=Math.max(0,b.boostTime-dt);
  const target=b.stats.maxSpeed*(b.boostTime>0?1.57:1);
  b.speed=lerp(b.speed,target,1-Math.exp(-dt*b.stats.accel/Math.max(9,target)));
  if(b.boostTime<=0 && b.speed>b.stats.maxSpeed) b.speed=Math.max(b.stats.maxSpeed,b.speed-20*dt);
  // Slippery inertial drift: the hull faces steering direction before velocity catches up.
  const blend=1-Math.exp(-dt*(1.6+(b.stats.handling||1)*1.8));
  b.vx=lerp(b.vx,Math.sin(b.heading)*b.speed,blend);
  b.vz=lerp(b.vz,Math.cos(b.heading)*b.speed,blend);
  b.x+=b.vx*dt; b.z+=b.vz*dt;
  const sea=getWaveHeight(b.x,b.z,time);
  if(b.inAir){
    b.verticalSpeed-=15.5*dt;
    b.yOffset+=b.verticalSpeed*dt;
    if(Math.abs(steer)>.12){b.trickSpin+=steer*dt*6.8;b.trickProgress+=Math.abs(steer)*dt*6.8;}
    if(b.yOffset<=0 && b.verticalSpeed<0){
      b.inAir=false;b.yOffset=0;b.verticalSpeed=0;b.splash=1.0;
      if(b.trickProgress>Math.PI*1.85){b.boostTime=Math.max(b.boostTime,.75);b.speed+=5;}
      for(let i=0;i<15;i++)spawn(b,true);
      if(b.onLand)b.onLand(b);
      b.trickSpin=0;
    }
  }
  b.y=sea+b.yOffset;
  const roll=-steer*.13-(b.vx-Math.sin(b.heading)*b.speed)*.006;
  b.group.position.set(b.x,b.y,b.z); b.group.rotation.y=b.heading;
  b.model.rotation.z=lerp(b.model.rotation.z,roll,Math.min(1,5*dt));
  b.model.rotation.x=lerp(b.model.rotation.x,Math.sin(time*3+b.x*.1)*.025,Math.min(1,4*dt));
  b.model.rotation.y=b.inAir?b.trickSpin:lerp(b.model.rotation.y,0,Math.min(1,9*dt));
  b.shadow.position.set(b.x,sea+.02,b.z);b.shadow.rotation.z=0;
  b.shadow.material.opacity=b.inAir?clamp(.24-b.yOffset*.02,.06,.24):.24;
  b.wakeClock+=dt;
  if(b.speed>4 && !b.inAir && b.wakeClock>.045){
    b.wakeClock=0;spawn(b);if(b.boostTime>0){spawn(b);spawn(b);}
  }
  const pos=b.wake.geometry.attributes.position;
  b.particles.forEach((p,i)=>{
    if(p.life>0){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vy-=4*dt;pos.setXYZ(i,p.x,p.y,p.z);}
    else pos.setXYZ(i,0,-1000,0);
  });
  pos.needsUpdate=true;
  return b;
}
export function bounceBoats(a,b) {
  const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);
  if(d>=1.65 || d<.0001)return;
  const nx=dx/d,nz=dz/d,push=(1.65-d)*.5;
  a.x-=nx*push;a.z-=nz*push;b.x+=nx*push;b.z+=nz*push;
  a.vx-=nx*2;a.vz-=nz*2;b.vx+=nx*2;b.vz+=nz*2;
  a.speed*=.94;b.speed*=.94;
}
export function disposeBoat(b,scene){
  scene.remove(b.group,b.shadow,b.wake);
  b.wake.geometry.dispose();b.wake.material.dispose();b.shadow.geometry.dispose();b.shadow.material.dispose();
}