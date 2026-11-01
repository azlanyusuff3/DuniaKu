import * as THREE from "./lib/three.module.js";
import {createBoat,updateBoat,getWaveHeight} from "./boat.js";
import {createInput} from "./input.js";
import {createChaseCamera} from "./camera.js";
const canvas=document.getElementById("game");
const renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:"high-performance"});
renderer.setPixelRatio(1);
renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();
scene.background=new THREE.Color("#a3dce4");
scene.fog=new THREE.Fog("#9fdadc",48,210);
scene.add(new THREE.HemisphereLight(0xffebce,0x3396a8,2.2));
const sunlight=new THREE.DirectionalLight(0xffe1ab,2.0);sunlight.position.set(-12,30,22);scene.add(sunlight);
const waterGeo=new THREE.PlaneGeometry(1600,1600,64,64);waterGeo.rotateX(-Math.PI/2);
const water=new THREE.Mesh(waterGeo,new THREE.MeshLambertMaterial({color:0x47bfd0,flatShading:true}));
water.frustumCulled=false;scene.add(water);
const boat=createBoat(scene,{x:0,z:0,color:"#fe91af"});
const chase=createChaseCamera();
chase.reset(boat);
const input=createInput(canvas,document.getElementById("boostBtn"),document.getElementById("tiltBtn"));
const debug=new URLSearchParams(location.search).get("debug")==="1";
const fps=document.getElementById("fps");if(debug)fps.hidden=false;
let last=performance.now(),elapsed=0,frames=0,framesTime=0,tipTime=0;
function resize(){
  const w=window.innerWidth,h=window.innerHeight;
  const renderHeight=Math.min(360,Math.max(240,Math.round(h*.65)));
  const renderWidth=Math.max(1,Math.round(renderHeight*w/h));
  renderer.setSize(renderWidth,renderHeight,false);
  chase.resize(w,h);
}
window.addEventListener("resize",resize);resize();
function tick(now){
  const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;
  const controls=input.read();
  updateBoat(boat,controls,dt,elapsed);
  // Offset undulating vertices in world space. Geometry remains low-poly and pixel-crisp.
  const attr=waterGeo.attributes.position;
  for(let i=0;i<attr.count;i++){
    const x=attr.getX(i),z=attr.getZ(i);
    attr.setY(i,getWaveHeight(x,z,elapsed));
  }
  attr.needsUpdate=true;
  if(frames%3===0) waterGeo.computeVertexNormals();
  chase.update(boat,dt);
  renderer.render(scene,chase.camera);
  document.getElementById("speedValue").textContent=String(Math.round(boat.speed*4));
  if(elapsed>6 && tipTime===0){tipTime=1;document.getElementById("tip").style.opacity="0";}
  if(debug){frames++;framesTime+=dt;if(framesTime>.75){fps.textContent="FPS "+Math.round(frames/framesTime)+" | draw "+renderer.info.render.calls;frames=0;framesTime=0;}}
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
window.addEventListener("error",e=>{
  const f=document.getElementById("fatal");f.hidden=false;document.getElementById("fatalText").textContent=e.message||"WebGL error";
});