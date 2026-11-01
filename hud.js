import {LAPS} from "./data.js";
const $=id=>document.getElementById(id);
const ordinal=n=>n+(n%100>=11&&n%100<=13?"th":{1:"st",2:"nd",3:"rd"}[n%10]||"th");
function canvasRound(ctx,x,y,r,color){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
export function createHUD(track,player,ai){
  const mini=$("minimap"),ctx=mini.getContext("2d",{alpha:true});
  const bounds=track.center.reduce((o,p)=>({minX:Math.min(o.minX,p.x),maxX:Math.max(o.maxX,p.x),minZ:Math.min(o.minZ,p.z),maxZ:Math.max(o.maxZ,p.z)}),
    {minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity});
  const scale=Math.min(112/(bounds.maxX-bounds.minX),85/(bounds.maxZ-bounds.minZ));
  const map=p=>[11+(p.x-bounds.minX)*scale,11+(p.z-bounds.minZ)*scale];
  let miniTimer=0;
  const competitors=()=>[player,...ai.racers];
  const positions=()=>competitors().slice().sort((a,b)=>{
    if(a.done&&b.done)return a.finishTime-b.finishTime;
    if(a.done)return -1;if(b.done)return 1;
    return (b.travel||0)-(a.travel||0);
  });
  function drawMinimap(){
    ctx.clearRect(0,0,150,115);
    ctx.lineCap="round";ctx.lineJoin="round";ctx.beginPath();
    track.center.forEach((p,i)=>{const [x,y]=map(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();
    ctx.strokeStyle="#194f71";ctx.lineWidth=8;ctx.stroke();
    ctx.strokeStyle="#91eafa";ctx.lineWidth=4;ctx.stroke();
    // Shortcut branches are drawn on minimap as distinct dashed gold/cyan paths.
    for(const route of track.shortcuts){
      ctx.beginPath();route.path.forEach((p,i)=>{const [x,y]=map(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
      ctx.setLineDash([4,3]);ctx.strokeStyle=route.kind==="cave"?"#ffe4a0":"#c7fdff";ctx.lineWidth=3;ctx.stroke();ctx.setLineDash([]);
    }
    for(const b of ai.racers){const [x,y]=map({x:b.x,z:b.z});canvasRound(ctx,x,y,3.4,"#ffdda0");}
    const [x,y]=map({x:player.x,z:player.z});canvasRound(ctx,x,y,5.3,"#ff6c9d");
    ctx.strokeStyle="#fff";ctx.lineWidth=1.5;ctx.stroke();
  }
  function update(dt,gameState){
    const ordered=positions(),rank=ordered.indexOf(player)+1;
    $("positionValue").textContent=ordinal(rank);
    $("speedValue").textContent=String(Math.round(player.speed*4));
    $("lapValue").textContent=String(Math.min(LAPS,player.lap));
    $("boostPips").textContent="⚡".repeat(player.boostPips)+"○".repeat(3-player.boostPips);
    $("boostBtn").disabled=gameState!=="race"||(player.boostPips===0&&player.boostTime<=0);
    $("wrongWay").hidden=!player.wrongWay||gameState!=="race";
    const notice=$("routeHint");
    if(notice){
      const incoming=track.nearbyShortcut(player.progress);
      const inside=player.shortcut?.route;
      const route=inside||incoming;
      notice.hidden=!route||gameState!=="race";
      if(route)notice.textContent=inside?(inside.kind==="cave"?"CAVE SHORTCUT!":"WATERFALL JUMP!"):"✦ SECRET SHORTCUT AHEAD";
    }
    miniTimer+=dt;if(miniTimer>.11){miniTimer=0;drawMinimap();}
  }
  function showCountdown(text){$("countdown").textContent=text;$("countdown").hidden=false;}
  function hideCountdown(){$("countdown").hidden=true;}
  function showResult(rank,time,bestLap,stars,coins){
    $("results").hidden=false;
    $("resultTitle").textContent=rank===1?"CHAMPION!":rank<=3?"GREAT RACE!":"RACE COMPLETE!";
    $("resultStars").textContent="★".repeat(stars)+"☆".repeat(3-stars);
    $("resultSummary").textContent=ordinal(rank)+" / 6 · "+time.toFixed(1)+"s · Best lap "+(Number.isFinite(bestLap)?bestLap.toFixed(1):"—")+"s";
    $("resultCoins").textContent="+"+coins+" coins";
  }
  return {update,showCountdown,hideCountdown,showResult,positions,rank:()=>positions().indexOf(player)+1};
}
