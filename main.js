import * as THREE from "./lib/three.module.js";
import {createBoat,updateBoat,getWaveHeight} from "./boat.js";
import {createInput} from "./input.js";
import {createChaseCamera} from "./camera.js";
import {TRACKS,BOATS,LAPS,SAVE_KEY} from "./data.js";
import {createTrack} from "./track.js";
import {createRacers} from "./ai.js";
import {createHUD} from "./hud.js";
import {createAudio} from "./audio.js";
const $=id=>document.getElementById(id);
function loadSave(){
 const defaults={coins:0,stars:{},bestLap:{},unlockedBoats:["mochi"],unlockedTracks:["sunny"],settings:{sound:true,tilt:false,wobble:false,difficulty:"normal"}};
 try{
  const parsed=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");
  if(!parsed||typeof parsed!=="object")return defaults;
  return {...defaults,coins:Math.max(0,Math.min(1e8,Number(parsed.coins)||0)),
    stars:parsed.stars&&typeof parsed.stars==="object"?parsed.stars:{},
    bestLap:parsed.bestLap&&typeof parsed.bestLap==="object"?parsed.bestLap:{},
    unlockedBoats:Array.isArray(parsed.unlockedBoats)?[...new Set(["mochi",...parsed.unlockedBoats.filter(id=>BOATS.some(b=>b.id===id))])]:["mochi"],
    unlockedTracks:Array.isArray(parsed.unlockedTracks)?[...new Set(["sunny",...parsed.unlockedTracks.filter(id=>TRACKS.some(t=>t.id===id))])]:["sunny"],
    settings:{...defaults.settings,...parsed.settings}};
 }catch(_){return defaults;}
}
const save=loadSave();
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch(_){/* private mode or quota */}}
const canvas=$("game"),renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:"high-performance"});
renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffebce,0x3396a8,2.2));
const sunlight=new THREE.DirectionalLight(0xffe1ab,2.0);sunlight.position.set(-12,30,22);scene.add(sunlight);
const waterGeo=new THREE.PlaneGeometry(1250,1250,64,64);waterGeo.rotateX(-Math.PI/2);
const waterMat=new THREE.MeshLambertMaterial({color:0x47bfd0,flatShading:true});
const water=new THREE.Mesh(waterGeo,waterMat);water.frustumCulled=false;scene.add(water);
let selectedBoat=BOATS[0],selectedTrack=TRACKS[0],track=null,boat=null,ai=null,hud=null;
const chase=createChaseCamera();
const input=createInput(canvas,$("boostBtn"),$("tiltBtn"));
const audio=createAudio();audio.setMuted(!save.settings.sound);
let state="title",beforeSettings="title",countdown=3.8,goTime=0,last=performance.now(),elapsed=0,frames=0,framesTime=0,tipTime=0,prevBoost=0,prevPips=0,prevAir=false;
let lowResHeight=360;
const debug=new URLSearchParams(location.search).get("debug")==="1",fps=$("fps");if(debug)fps.hidden=false;
function hideMenus(){for(const id of ["titleMenu","boatMenu","trackMenu","settingsMenu","pauseMenu","results"])$(id).hidden=true;}
function showMenu(id){hideMenus();$(id).hidden=false;}
function setState(s){state=s;const visible=s==="countdown"||s==="race"||s==="paused";$("overlay").hidden=!visible;}
function updateWallet(){document.querySelectorAll(".coinCount").forEach(e=>e.textContent=String(save.coins));}
function makeCard(title,meta,selected,locked){
 const div=document.createElement("button");div.type="button";div.className="choice"+(selected?" selected":"")+(locked?" locked":"");
 div.innerHTML='<b>'+title+'</b><small>'+meta+'</small>';
 return div;
}
function drawBoatCards(){
 const target=$("boatCards");target.replaceChildren();
 BOATS.forEach((b,i)=>{
  const owned=save.unlockedBoats.includes(b.id),cost=i*100;
  const stats=b.stats;
  const bars=[["Speed",stats.maxSpeed/47],["Accel",stats.accel/23],["Handling",stats.handling/1.5],["Boost",stats.boostPower/1.6]];
  const card=makeCard(b.name,owned?b.driver+" · READY":(cost+" COINS TO UNLOCK"),selectedBoat.id===b.id,!owned);
  const illustration=document.createElement("div");illustration.className="boatIcon";illustration.style.background=b.color;illustration.textContent="🚤";card.prepend(illustration);
  const statWrap=document.createElement("div");statWrap.className="stats";
  bars.forEach(([name,value])=>{const el=document.createElement("div");el.className="statBar";el.innerHTML="<label>"+name+"</label><i><em style='width:"+Math.round(value*100)+"%'></em></i>";statWrap.append(el);});
  card.append(statWrap);
  card.addEventListener("click",()=>{
   audio.init();
   if(!owned){
    if(save.coins<cost){card.classList.add("shake");setTimeout(()=>card.classList.remove("shake"),350);return;}
    save.coins-=cost;save.unlockedBoats.push(b.id);persist();updateWallet();
   }
   selectedBoat=b;drawBoatCards();
  });
  target.append(card);
 });
}
function drawTrackCards(){
 const target=$("trackCards");target.replaceChildren();
 TRACKS.forEach((t,i)=>{
  const implemented=t.id==="sunny";
  const unlocked=save.unlockedTracks.includes(t.id);
  const best=save.bestLap[t.id];
  const desc=implemented?(unlocked?(best?"BEST "+Number(best).toFixed(2)+"s":"READY · 3 LAPS"):"LOCKED"):
     "COMING IN TASK F";
  const card=makeCard(t.name,t.subtitle+" · "+desc,selectedTrack.id===t.id,!implemented||!unlocked);
  card.disabled=!implemented||!unlocked;
  card.addEventListener("click",()=>{selectedTrack=t;drawTrackCards();});
  target.append(card);
 });
}
function buildGame(){
 if(ai)ai.dispose();
 if(boat){scene.remove(boat.group,boat.shadow,boat.wake);boat.wake.geometry.dispose();boat.wake.material.dispose();boat.shadow.geometry.dispose();boat.shadow.material.dispose();}
 if(track)track.dispose();
 track=createTrack(scene,selectedTrack);
 scene.background=new THREE.Color(selectedTrack.sky);scene.fog=new THREE.Fog(selectedTrack.fog,65,235);waterMat.color.set(selectedTrack.water);
 boat=createBoat(scene,{...selectedBoat});
 track.resetBoat(boat,0,0);
 ai=createRacers(scene,track,boat);hud=createHUD(track,boat,ai);
 chase.reset(boat);
 useSprites();
 applyWobble(save.settings.wobble);
 prevBoost=0;prevPips=boat.boostPips;prevAir=false;
}
function startRace(){
 audio.init();hideMenus();
 buildGame();setState("countdown");countdown=3.8;goTime=0;tipTime=0;elapsed=0;frames=0;framesTime=0;
 $("tip").style.opacity="1";$("countdown").hidden=false;
}
function result(){
 setState("results");
 const rank=hud.rank(),stars=rank===1?3:rank<=3?2:1,coins=Math.max(35,150-rank*18);
 save.coins+=coins;
 save.stars[selectedTrack.id]=Math.max(Number(save.stars[selectedTrack.id])||0,stars);
 if(Number.isFinite(boat.bestLap))save.bestLap[selectedTrack.id]=Math.min(Number(save.bestLap[selectedTrack.id])||Infinity,boat.bestLap);
 if(rank<=3){
  const i=TRACKS.findIndex(t=>t.id===selectedTrack.id);
  if(TRACKS[i+1]&&!save.unlockedTracks.includes(TRACKS[i+1].id))save.unlockedTracks.push(TRACKS[i+1].id);
 }
 persist();hud.showResult(rank,boat.finishTime,boat.bestLap,stars,coins);showMenu("results");updateWallet();audio.play("win");
}
function enterTitle(){setState("title");showMenu("titleMenu");updateWallet();}
function pause(){if(state!=="race")return;setState("paused");showMenu("pauseMenu");}
function resume(){if(state!=="paused")return;hideMenus();setState("race");last=performance.now();}
function settingsReturn(){save.settings.sound=$("soundToggle").checked;save.settings.tilt=$("tiltToggle").checked;save.settings.wobble=$("wobbleToggle").checked;save.settings.difficulty=$("difficultySelect").value;
 audio.setMuted(!save.settings.sound);applyWobble(save.settings.wobble);
 input.setTilt(save.settings.tilt).then(enabled=>{if(!enabled&&save.settings.tilt){save.settings.tilt=false;persist();}});
 persist();setState(beforeSettings);if(beforeSettings==="paused")showMenu("pauseMenu");else showMenu("titleMenu");
}
function openSettings(){
 beforeSettings=state;setState("settings");
 $("soundToggle").checked=save.settings.sound!==false;
 $("tiltToggle").checked=!!save.settings.tilt;
 $("wobbleToggle").checked=!!save.settings.wobble;
 $("difficultySelect").value=["easy","normal","hard"].includes(save.settings.difficulty)?save.settings.difficulty:"normal";
 showMenu("settingsMenu");
}
function applyWobble(enabled){
 // Subtle PS1 geometry snapping (local vertices only); one shader compilation per toggle.
 scene.traverse(obj=>{
  if(!obj.isMesh||obj.isPoints||obj===water)return;
  const materials=Array.isArray(obj.material)?obj.material:[obj.material];
  for(const m of materials){
   if(!m||!m.isMaterial)continue;
   const prior=!!m.userData.rapidsWobble;
   if(prior===!!enabled)continue;
   if(!m.userData.rapidsOriginalOnBeforeCompile)m.userData.rapidsOriginalOnBeforeCompile=m.onBeforeCompile;
   m.userData.rapidsWobble=!!enabled;
   m.onBeforeCompile=enabled ? shader=>{
    m.userData.rapidsOriginalOnBeforeCompile(shader);
    shader.vertexShader=shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\ntransformed.xyz = floor(transformed.xyz * 18.0 + 0.5) / 18.0;");
   }:m.userData.rapidsOriginalOnBeforeCompile;
   m.customProgramCacheKey=()=>enabled?"rapids-wobble-v1":"rapids-normal-v1";
   m.needsUpdate=true;
  }
 });
}
let spriteList=null,loadedDrivers={};
async function loadSpriteList(){
 try{
  const r=await fetch("./sprites/list.json",{cache:"no-store"});
  if(!r.ok)return;
  const data=await r.json();
  spriteList=data;
  if(boat)useSprites();
 }catch(_){/* sheet/art not ready: keep procedural driver and materials */ }
}
function artPath(name){
 if(!spriteList)return null;
 let value=spriteList[name]||spriteList?.drivers?.[name]||spriteList?.sprites?.[name];
 if(value&&typeof value==="object")value=value.file||value.path||value.src;
 if(typeof value!=="string")return null;
 // Only local sprite files: never allow CDN/runtime network dependencies.
 const relative=value.replace(/^\.?\//,"");
 return /^sprites\/[a-zA-Z0-9_./-]+\.webp$/.test(relative)?("./"+relative):null;
}
function useSprites(){
 if(!boat||!spriteList)return;
 const name=selectedBoat.id;
 const path=artPath("driver_"+name)||artPath(name);
 if(!path)return;
 const key=name+"@"+path;
 if(loadedDrivers[key]){attachDriver(boat,loadedDrivers[key]);return;}
 new THREE.TextureLoader().load(path,t=>{
  t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;loadedDrivers[key]=t;
  if(boat&&selectedBoat.id===name)attachDriver(boat,t);
 },undefined,()=>{});
}
function attachDriver(b,texture){
 b.driver.visible=false;
 if(b.driverBillboard){b.model.remove(b.driverBillboard);b.driverBillboard.geometry.dispose();b.driverBillboard.material.dispose();}
 const board=new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.1),new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.08,side:THREE.DoubleSide,depthWrite:false}));
 board.position.set(0,1.25,.1);board.rotation.y=Math.PI;b.model.add(board);b.driverBillboard=board;
}
$("playBtn").addEventListener("click",()=>{audio.init();setState("boats");drawBoatCards();showMenu("boatMenu");});
$("settingsBtn").addEventListener("click",()=>{audio.init();openSettings();});
$("boatBack").addEventListener("click",()=>enterTitle());
$("boatNext").addEventListener("click",()=>{setState("tracks");drawTrackCards();showMenu("trackMenu");});
$("trackBack").addEventListener("click",()=>{setState("boats");drawBoatCards();showMenu("boatMenu");});
$("startRace").addEventListener("click",startRace);
$("restartBtn").addEventListener("click",startRace);
$("resultMenuBtn").addEventListener("click",enterTitle);
$("pauseBtn").addEventListener("click",()=>{audio.init();pause();});
$("resumeBtn").addEventListener("click",resume);
$("quitBtn").addEventListener("click",enterTitle);
$("pauseSettings").addEventListener("click",openSettings);
$("closeSettings").addEventListener("click",()=>{audio.init();settingsReturn();});
window.addEventListener("keydown",e=>{if(e.code==="Escape"){if(state==="race")pause();else if(state==="paused")resume();}});
function resize(){
 const w=window.innerWidth,h=window.innerHeight,renderHeight=Math.min(360,Math.max(240,Math.round(h*.65)));
 if(lowResHeight!==renderHeight)lowResHeight=renderHeight;
 renderer.setSize(Math.max(1,Math.round(renderHeight*w/h)),renderHeight,false);chase.resize(w,h);
}
window.addEventListener("resize",resize);resize();updateWallet();loadSpriteList();enterTitle();
function tick(now){
 const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;
 if(state==="countdown"){
  countdown-=dt;
  if(countdown>0){
   const n=String(Math.ceil(countdown));
   if($("countdown").textContent!==n)audio.play("beep");
   hud.showCountdown(n);
  }else{setState("race");hud.showCountdown("GO!");audio.play("go");goTime=.55;}
 }else if(state==="race"){
  if(goTime>0){goTime-=dt;if(goTime<=0)hud.hideCountdown();}
  const controls=input.read();updateBoat(boat,controls,dt,elapsed);
  track.updateBoatTrack(boat,dt,elapsed);
  ai.update(dt,elapsed,save.settings.difficulty);
  if(boat.boostTime>0&&prevBoost<=0)audio.play("boost");
  if(boat.boostPips>prevPips)audio.play("pickup");
  if(prevAir&&!boat.inAir)audio.play("splash");
  prevBoost=boat.boostTime;prevPips=boat.boostPips;prevAir=boat.inAir;
  if(boat.done)result();
 }
 if(track)track.update(dt,elapsed);
 if(track&&boat){
  const attr=waterGeo.attributes.position;
  for(let i=0;i<attr.count;i++)attr.setY(i,getWaveHeight(attr.getX(i),attr.getZ(i),elapsed));
  attr.needsUpdate=true;if(frames%3===0)waterGeo.computeVertexNormals();
  chase.update(boat,dt);
  hud.update(dt,state);
  if(state==="race"&&elapsed>7&&tipTime===0){tipTime=1;$("tip").style.opacity="0";}
 }
 audio.update(boat?.speed||0,boat?.boostTime>0,state==="race");
 renderer.render(scene,chase.camera);
 if(debug){frames++;framesTime+=dt;if(framesTime>.75){fps.textContent="FPS "+Math.round(frames/framesTime)+" | draw "+renderer.info.render.calls;frames=0;framesTime=0;}}
 requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
window.addEventListener("error",e=>{$("fatal").hidden=false;$("fatalText").textContent=e.message||"WebGL error";});