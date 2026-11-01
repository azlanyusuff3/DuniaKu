import * as THREE from "./lib/three.module.js";
import {createBoat,updateBoat,getWaveHeight} from "./boat.js";
import {createInput} from "./input.js";
import {createChaseCamera} from "./camera.js";
import {TRACKS,LAPS} from "./data.js";
import {createTrack} from "./track.js";
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
const boat=createBoat(scene,{color:"#fe91af"});
track.resetBoat(boat,0,0);
const chase=createChaseCamera();chase.reset(boat);
const input=createInput(canvas,$("boostBtn"),$("tiltBtn"));
const debug=new URLSearchParams(location.search).get("debug")==="1";
const fps=$("fps");if(debug)fps.hidden=false;
let last=performance.now(),elapsed=0,frames=0,framesTime=0,state="race",tipTime=0;
$("restartBtn").addEventListener("click",restart);
function restart(){track.resetBoat(boat);chase.reset(boat);state="race";$("results").hidden=true;$("tip").style.opacity="1";elapsed=0;tipTime=0;}
function resize(){
  const w=window.innerWidth,h=window.innerHeight;
  const renderHeight=Math.min(360,Math.max(240,Math.round(h*.65)));
  renderer.setSize(Math.max(1,Math.round(renderHeight*w/h)),renderHeight,false);chase.resize(w,h);
}
window.addEventListener("resize",resize);resize();
function tick(now){
  const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;
  if(state==="race"){
    updateBoat(boat,input.read(),dt,elapsed);
    track.updateBoatTrack(boat,dt,elapsed);track.update(dt,elapsed);
    if(boat.done){
      state="results";$("results").hidden=false;
      $("resultTitle").textContent="SUNNY COVE CLEARED!";
      $("resultSummary").textContent="3 laps · "+boat.finishTime.toFixed(1)+"s · Best lap "+(isFinite(boat.bestLap)?boat.bestLap.toFixed(1):"—")+"s";
    }
  }
  const attr=waterGeo.attributes.position;
  for(let i=0;i<attr.count;i++)attr.setY(i,getWaveHeight(attr.getX(i),attr.getZ(i),elapsed));
  attr.needsUpdate=true;if(frames%3===0)waterGeo.computeVertexNormals();
  chase.update(boat,dt);renderer.render(scene,chase.camera);
  $("speedValue").textContent=String(Math.round(boat.speed*4));
  $("lapValue").textContent=String(Math.min(LAPS,boat.lap));
  $("boostPips").textContent="⚡".repeat(boat.boostPips)+"○".repeat(3-boat.boostPips);
  $("boostBtn").disabled=boat.boostPips===0 && boat.boostTime<=0;
  $("wrongWay").hidden=!boat.wrongWay;
  if(elapsed>6 && tipTime===0){tipTime=1;$("tip").style.opacity="0";}
  if(debug){frames++;framesTime+=dt;if(framesTime>.75){fps.textContent="FPS "+Math.round(frames/framesTime)+" | draw "+renderer.info.render.calls;frames=0;framesTime=0;}}
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
window.addEventListener("error",e=>{$("fatal").hidden=false;$("fatalText").textContent=e.message||"WebGL error";});