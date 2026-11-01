import * as THREE from "./lib/three.module.js";
import {createBoat,updateBoat,getWaveHeight} from "./boat.js";
import {createInput} from "./input.js";
import {createChaseCamera} from "./camera.js";
import {TRACKS,BOATS,LAPS} from "./data.js";
import {createTrack} from "./track.js";
import {createRacers} from "./ai.js";
import {createHUD} from "./hud.js";
const $=id=>document.getElementById(id);
const canvas=$("game");
const renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:"high-performance"});
renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();
scene.background=new THREE.Color(TRACKS[0].sky);scene.fog=new THREE.Fog(TRACKS[0].fog,65,235);
scene.add(new THREE.HemisphereLight(0xffebce,0x3396a8,2.2));
const sunlight=new THREE.DirectionalLight(0xffe1ab,2.0);sunlight.position.set(-12,30,22);scene.add(sunlight);
const waterGeo=new THREE.PlaneGeometry(1250,1250,64,64);waterGeo.rotateX(-Math.PI/2);
const water=new THREE.Mesh(waterGeo,new THREE.MeshLambertMaterial({color:TRACKS[0].water,flatShading:true}));water.frustumCulled=false;scene.add(water);
const track=createTrack(scene,TRACKS[0]);
const boat=createBoat(scene,{...BOATS[0]});track.resetBoat(boat,0,0);
const chase=createChaseCamera();chase.reset(boat);
const input=createInput(canvas,$("boostBtn"),$("tiltBtn"));
const ai=createRacers(scene,track,boat);
const hud=createHUD(track,boat,ai);
const debug=new URLSearchParams(location.search).get("debug")==="1",fps=$("fps");
if(debug)fps.hidden=false;
let last=performance.now(),elapsed=0,frames=0,framesTime=0,state="countdown",countdown=3.8,tipTime=0;
$("restartBtn").addEventListener("click",restart);
function restart(){
 track.resetBoat(boat);ai.reset();chase.reset(boat);
 state="countdown";countdown=3.8;$("results").hidden=true;$("tip").style.opacity="1";elapsed=0;tipTime=0;
}
function resize(){
 const w=window.innerWidth,h=window.innerHeight;
 const renderHeight=Math.min(360,Math.max(240,Math.round(h*.65)));
 renderer.setSize(Math.max(1,Math.round(renderHeight*w/h)),renderHeight,false);chase.resize(w,h);
}
window.addEventListener("resize",resize);resize();
function tick(now){
 const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;
 if(state==="countdown"){
  countdown-=dt;
  if(countdown>0)hud.showCountdown(String(Math.ceil(countdown)));
  else{state="race";hud.showCountdown("GO!");countdown=-.6;}
 }else if(state==="race"){
  if(countdown<0){countdown+=dt;if(countdown>=0)hud.hideCountdown();}
  updateBoat(boat,input.read(),dt,elapsed);
  track.updateBoatTrack(boat,dt,elapsed);
  ai.update(dt,elapsed,"normal");
  if(boat.done){
   state="results";hud.hideCountdown();
   const rank=hud.rank(),stars=rank===1?3:rank<=3?2:1,coins=Math.max(35,150-rank*18);
   hud.showResult(rank,boat.finishTime,boat.bestLap,stars,coins);
  }
 }
 track.update(dt,elapsed);
 const attr=waterGeo.attributes.position;
 for(let i=0;i<attr.count;i++)attr.setY(i,getWaveHeight(attr.getX(i),attr.getZ(i),elapsed));
 attr.needsUpdate=true;if(frames%3===0)waterGeo.computeVertexNormals();
 chase.update(boat,dt);renderer.render(scene,chase.camera);
 hud.update(dt,state);
 if(elapsed>7 && tipTime===0){tipTime=1;$("tip").style.opacity="0";}
 if(debug){frames++;framesTime+=dt;if(framesTime>.75){fps.textContent="FPS "+Math.round(frames/framesTime)+" | draw "+renderer.info.render.calls;frames=0;framesTime=0;}}
 requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
window.addEventListener("error",e=>{$("fatal").hidden=false;$("fatalText").textContent=e.message||"WebGL error";});