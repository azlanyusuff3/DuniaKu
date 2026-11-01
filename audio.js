// Original tiny WebAudio synth, no imported media. Audio is started only from user input.
export function createAudio(){
  let ctx=null,master=null,engine=null,engineGain=null,muted=false,initialized=false;
  function init(){
    if(initialized){if(ctx?.state==="suspended")ctx.resume().catch(()=>{});return;}
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)return;
    try{
      ctx=new AudioContext();master=ctx.createGain();master.gain.value=muted?0:.28;master.connect(ctx.destination);
      engine=ctx.createOscillator();engine.type="sawtooth";engine.frequency.value=60;
      engineGain=ctx.createGain();engineGain.gain.value=0;engine.connect(engineGain);engineGain.connect(master);engine.start();
      initialized=true;if(ctx.state==="suspended")ctx.resume().catch(()=>{});
    }catch(_){ctx=null;initialized=false;}
  }
  function tone(type,freq,duration=.2,volume=.14,endFreq=null){
    if(!ctx||!master||muted)return;
    const t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,t);
    if(endFreq!==null)o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),t+duration);
    g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(Math.max(.002,volume),t+.012);
    g.gain.exponentialRampToValueAtTime(.001,t+duration);
    o.connect(g);g.connect(master);o.start(t);o.stop(t+duration+.03);
  }
  function play(name){
    const sounds={
      beep:()=>tone("square",480,.13,.09,390),
      go:()=>tone("triangle",850,.38,.21,1220),
      boost:()=>tone("sawtooth",180,.42,.15,860),
      pickup:()=>{tone("triangle",680,.14,.15,900);setTimeout(()=>tone("triangle",1020,.22,.11,1350),90);},
      splash:()=>tone("triangle",140,.28,.09,65),
      crash:()=>tone("sawtooth",90,.24,.11,43),
      win:()=>{tone("triangle",660,.2,.17,820);setTimeout(()=>tone("triangle",960,.32,.17,1300),180);}
    };
    if(sounds[name])sounds[name]();
  }
  function update(speed,boost,active){
    if(!ctx||!engine||!engineGain)return;
    engine.frequency.setTargetAtTime(55+speed*2.8+(boost?35:0),ctx.currentTime,.11);
    engineGain.gain.setTargetAtTime(active&&!muted?.028+Math.min(speed/2700,.022):0,ctx.currentTime,.14);
  }
  function setMuted(value){muted=!!value;if(ctx&&master)master.gain.setTargetAtTime(muted?0:.28,ctx.currentTime,.04);}
  return {init,play,update,setMuted,get muted(){return muted;}};
}