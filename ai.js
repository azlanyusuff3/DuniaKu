import {createBoat,updateBoat,bounceBoats} from "./boat.js";
import {BOATS,DIFFICULTIES} from "./data.js";
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const wrapAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
export function createRacers(scene,track,player) {
  const palettes=["#ffd36b","#7fe1cc","#ab96fa","#f57d88","#d4e8ff"];
  const racers=Array.from({length:5},(_,i)=>{
    const preset=BOATS[(i+1)%BOATS.length];
    const b=createBoat(scene,{
      name:["Tiki","Zippy","Cocoa","Pebble","Sprinkles"][i],
      color:palettes[i],accent:preset.accent,helmet:preset.helmet,
      stats:{...preset.stats,maxSpeed:preset.stats.maxSpeed*(.93+(i%3)*.025)}
    });
    b.ai=true;b.aiIndex=i;b.lane=((i%5)-2)*track.spec.width*.105;
    b.phase=i*1.8;b.error=0;b.errorTimer=0;b.boostUseTimer=4+i*.6;
    track.resetBoat(b,b.lane,-.006*(i+1));b.boostPips=1;
    return b;
  });
  function reset(){
    racers.forEach((b,i)=>{
      track.resetBoat(b,b.lane,-.006*(i+1));
      b.boostPips=1;b.error=0;b.errorTimer=0;b.boostUseTimer=4+i*.6;
    });
  }
  function update(dt,time,difficulty="normal",active=true){
    if(!active)return;
    const tuning=DIFFICULTIES[difficulty]||DIFFICULTIES.normal;
    for(const b of racers){
      if(b.done)continue;
      b.errorTimer-=dt;
      if(b.errorTimer<=0){
        b.errorTimer=1.4+Math.random()*2.4;
        b.error=(Math.random()-.5)*track.spec.width*.11*tuning.mistake;
      }
      const n=track.nearest(b.x,b.z,b.lastU);
      const lookAhead=.014+Math.min(.012,b.speed/4500);
      const target=track.pointAt(n.u+lookAhead,b.lane+b.error);
      const desired=Math.atan2(target.x-b.x,target.z-b.z);
      const angle=wrapAngle(desired-b.heading);
      const steer=clamp(angle*2.2,-1,1);
      const gap=clamp((player.travel||0)-(b.travel||0),-.8,.8);
      // Trailing bots receive a little extra pace; runaway leaders ease off.
      const rubber=clamp(gap*tuning.rubber,-.11,.11);
      const nominal=b.stats.maxSpeed;
      b.stats.maxSpeed=nominal*clamp(tuning.aiSpeed+rubber,.82,1.16);
      b.boostUseTimer-=dt;
      const useBoost=b.boostUseTimer<=0 && b.boostPips>0 && Math.abs(angle)<.34;
      if(useBoost)b.boostUseTimer=5+Math.random()*5;
      updateBoat(b,{steer,boost:useBoost},dt,time);
      b.stats.maxSpeed=nominal;
      if(Math.abs(angle)>.65)b.speed*=Math.max(.94,1-dt*.65);
      track.updateBoatTrack(b,dt,time);
      for(const other of [player,...racers]){
        if(other===b||other.done)continue;
        // Avoid resolving an AI-AI pair twice.
        if(other.ai && other.aiIndex<b.aiIndex)continue;
        bounceBoats(b,other);
      }
    }
  }
  function dispose(){for(const b of racers){scene.remove(b.group,b.shadow,b.wake);b.wake.geometry.dispose();b.wake.material.dispose();b.shadow.geometry.dispose();b.shadow.material.dispose();}}
  return {racers,update,reset,dispose};
}
