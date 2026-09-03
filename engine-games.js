/* DuniaKu v2 engine layer
   Phaser 4.2.1 is loaded by index.html and cached by sw.js after first online launch.
   The main app stays DOM-based; Phaser instances exist only while an engine game is open.
*/

const DK_ENGINE_IDS = new Set(['pet','merge','race','runner','maze','bubble']);
let dkGame = null;
let dkCurrentScene = null;

function dkEngineAvailable(){ return typeof Phaser !== 'undefined' && typeof Phaser.Game === 'function'; }
function dkDestroyGame(){
  if(dkGame){ try{ dkGame.destroy(true); }catch(e){} }
  dkGame=null; dkCurrentScene=null;
}
function dkSetCleanup(fn){
  window.__cleanup=()=>{ try{ fn && fn(); }finally{ dkDestroyGame(); } };
}
function dkMountFallback(parentId='engineStage'){
  const host=document.getElementById(parentId);
  if(!host) return;
  host.innerHTML=`<div class="phaser-fallback"><h3>🎮 2D engine belum tersedia</h3><p>Buka DuniaKu sekali ketika ada internet supaya Phaser 4 boleh dicache. Lepas itu game engine boleh digunakan offline.</p></div>`;
}
function dkConfig(parent, scene, physics){
  return {
    type: Phaser.AUTO,
    parent,
    width: 720,
    height: 520,
    backgroundColor:'#1e2032',
    transparent:false,
    render:{antialias:true,pixelArt:false,roundPixels:false},
    fps:{target:60,forceSetTimeOut:false},
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
    physics: physics || undefined,
    scene
  };
}
function dkStart(parent, scene, physics){
  dkDestroyGame();
  if(!dkEngineAvailable()){dkMountFallback(parent);return null;}
  try{ dkGame=new Phaser.Game(dkConfig(parent,scene,physics)); return dkGame; }
  catch(err){ console.error('DuniaKu engine start failed',err); dkMountFallback(parent); return null; }
}
function dkCredit(n, reason='', noisy=false){
  state.stars=Math.max(0,(state.stars||0)+n);
  if(n>0) state.xp=(state.xp||0)+n;
  save();
  if(noisy && n>0) toast(`+${n} ⭐ ${reason}`);
  checkAchievements();
}
function dkSpend(n){ if((state.stars||0)<n) return false; state.stars-=n; save(); return true; }
function dkBest(key,value){ state.best=state.best||{}; state.best[key]=Math.max(state.best[key]||0,Math.floor(value||0)); save(); }
function dkStatBar(label,value){return `<div class="stat"><b>${label} ${Math.round(value)}%</b><div class="bar"><i style="width:${Math.max(0,Math.min(100,value))}%"></i></div></div>`}
function dkTodayKey(){const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`}
function dkSeedColor(hex,amount){
  const c=parseInt(hex.replace('#',''),16),r=Math.max(0,Math.min(255,(c>>16)+amount)),g=Math.max(0,Math.min(255,((c>>8)&255)+amount)),b=Math.max(0,Math.min(255,(c&255)+amount));
  return (r<<16)|(g<<8)|b;
}
function dkHexNum(hex){return parseInt(hex.replace('#',''),16)}
function dkSpeciesColors(){
  const id=state.equipped?.pet||'pet-momo';
  if(id==='pet-sky') return {body:'#73baf3',ear:'#5ca5e0',belly:'#dff3ff',accent:'#316a9d'};
  if(id==='pet-mint') return {body:'#7bd6b0',ear:'#59bc96',belly:'#e7fff4',accent:'#307962'};
  if(id==='pet-berry') return {body:'#ec83ac',ear:'#d56e97',belly:'#fff0f6',accent:'#8f3e61'};
  return {body:'#f2b45f',ear:'#dfa04d',belly:'#fff0cc',accent:'#87573e'};
}

/* ---------- reusable Phaser art ---------- */
function dkAddCloud(scene,x,y,scale=1,alpha=.85){
  const c=scene.add.container(x,y).setScale(scale).setAlpha(alpha);
  c.add([scene.add.circle(-28,3,21,0xffffff),scene.add.circle(0,-7,28,0xffffff),scene.add.circle(29,5,19,0xffffff),scene.add.rectangle(0,12,76,27,0xffffff).setOrigin(.5)]);
  return c;
}
function dkAddSparkles(scene,x,y,count=8,color=0xffe46c){
  for(let i=0;i<count;i++){
    const a=Math.PI*2*i/count + Math.random()*.25, dist=45+Math.random()*40;
    const s=scene.add.circle(x,y,3+Math.random()*3,color,1);
    scene.tweens.add({targets:s,x:x+Math.cos(a)*dist,y:y+Math.sin(a)*dist,alpha:0,scale:.2,duration:450+Math.random()*250,ease:'Cubic.Out',onComplete:()=>s.destroy()});
  }
}
function dkRoomPalette(){
  const room=state.equipped?.room||'room-sunny';
  if(room==='room-night') return {wall:0x536185,top:0x24314f,floor:0x6e5b55,light:0xffd76a,sky:0x14203c};
  if(room==='room-space') return {wall:0x323463,top:0x171934,floor:0x4d4a71,light:0x8ce8ff,sky:0x0e1026};
  if(room==='room-forest') return {wall:0xa5d7aa,top:0x73ba7d,floor:0xb28a60,light:0xffe99a,sky:0x8ee0f4};
  return {wall:0xf3dfbc,top:0xa8e0f5,floor:0xd4aa75,light:0xffd769,sky:0x75d1f4};
}
function dkDrawRoom(scene){
  const p=dkRoomPalette(), w=720,h=520;
  scene.add.rectangle(w/2,170,w,340,p.wall);
  scene.add.rectangle(w/2,58,w,116,p.top,.75);
  scene.add.rectangle(w/2,450,w,140,p.floor);
  for(let x=0;x<w;x+=90) scene.add.rectangle(x,450,2,140,0x6e5038,.08);
  const winFrame=scene.add.rectangle(112,135,154,128,0xf6ead5).setStrokeStyle(5,0xffffff,.8);
  scene.add.rectangle(112,135,128,102,p.sky);
  scene.add.rectangle(112,135,4,102,0xffffff,.75);scene.add.rectangle(112,135,128,4,0xffffff,.75);
  const sun=scene.add.circle(82,111,17,p.light,.95);
  if((state.equipped?.room||'')==='room-night' || (state.equipped?.room||'')==='room-space'){
    sun.setFillStyle(0xf4f1cf,1);
    for(let i=0;i<12;i++) scene.add.circle(55+Math.random()*115,95+Math.random()*80,1.4,0xffffff,.9);
  } else {
    dkAddCloud(scene,136,104,.45,.8);
  }
  scene.add.ellipse(370,462,360,68,0x6f5b87,.18);
  // shelf and books
  scene.add.rectangle(611,235,130,12,0x8d6649); scene.add.rectangle(611,315,130,12,0x8d6649);
  const bookCols=[0xef6b78,0x6c86dd,0x60b780,0xf1bd55];
  for(let i=0;i<4;i++) scene.add.rectangle(576+i*22,211,16,36,bookCols[i]);
  // plant
  scene.add.rectangle(607,397,56,44,0xd77f57).setOrigin(.5,1);
  scene.add.ellipse(589,343,35,75,0x55a767).setAngle(-25);scene.add.ellipse(623,343,35,75,0x4d9a61).setAngle(25);scene.add.ellipse(607,330,30,82,0x66b976);
  // toy / equipped toy
  const toy=state.equipped?.toy||'ball';
  if(toy==='duck'){
    scene.add.circle(558,430,24,0xffd65e);scene.add.circle(575,414,16,0xffd65e);scene.add.triangle(590,414,590,408,604,414,590,420,0xef8c49);
  } else if(toy==='rocket'){
    scene.add.triangle(554,442,574,394,594,442,0x5d78d9);scene.add.rectangle(574,425,26,40,0xe9edf8);scene.add.triangle(561,443,568,443,568,457,0xf08b64);
  } else {
    scene.add.circle(560,429,25,0xffcf59).setStrokeStyle(5,0xf2747b);scene.add.line(560,429,-18,0,18,0,0xffffff,.7).setLineWidth(3);
  }
}
function dkBuildPet(scene,x,y){
  const stage=Math.max(0,Math.min(4,state.pet.stage||0)), cols=dkSpeciesColors();
  const c=scene.add.container(x,y);
  c.setData('stage',stage);
  const shadow=scene.add.ellipse(0,72,115,27,0x3b3146,.18);
  c.add(shadow);
  if(stage===0){
    const egg=scene.add.ellipse(0,5,105,137,0xfff5db).setStrokeStyle(5,0xe1caa3,.7);
    const patch=scene.add.ellipse(-15,4,22,34,0xf0d8ae,.75).setAngle(-22);
    c.add([egg,patch]);
  }else{
    const earL=scene.add.triangle(-49,-63,-69,-105,-24,-78,0,0,0,dkHexNum(cols.ear));
    const earR=scene.add.triangle(49,-63,69,-105,24,-78,0,0,0,dkHexNum(cols.ear));
    const body=scene.add.ellipse(0,2,132,155,dkHexNum(cols.body)).setStrokeStyle(3,dkSeedColor(cols.body,-25),.4);
    const belly=scene.add.ellipse(0,30,76,83,dkHexNum(cols.belly),.75);
    const cheekL=scene.add.circle(-38,2,9,0xff8fa2,.42),cheekR=scene.add.circle(38,2,9,0xff8fa2,.42);
    const eyeL=scene.add.ellipse(-24,-22,12,17,0x302b35),eyeR=scene.add.ellipse(24,-22,12,17,0x302b35);
    eyeL.setData('eye',true);eyeR.setData('eye',true);
    const shineL=scene.add.circle(-22,-26,3,0xffffff,.85),shineR=scene.add.circle(26,-26,3,0xffffff,.85);
    const nose=scene.add.triangle(0,-1,-5,0,5,0,0,6,dkHexNum(cols.accent));
    const mouth1=scene.add.arc(-6,8,8,20,160,false,dkHexNum(cols.accent),0).setStrokeStyle(2,dkHexNum(cols.accent));
    const mouth2=scene.add.arc(6,8,8,20,160,false,dkHexNum(cols.accent),0).setStrokeStyle(2,dkHexNum(cols.accent));
    const pawL=scene.add.ellipse(-48,41,35,22,dkHexNum(cols.ear)),pawR=scene.add.ellipse(48,41,35,22,dkHexNum(cols.ear));
    c.add([earL,earR,body,belly,cheekL,cheekR,eyeL,eyeR,shineL,shineR,nose,mouth1,mouth2,pawL,pawR]);
    if(stage>=2){
      const tuft=scene.add.triangle(0,-83,-18,-97,0,-120,18,-97,dkHexNum(cols.body));c.add(tuft);tuft.setDepth(-1);
    }
    if(stage>=3){
      const tail=scene.add.arc(66,22,28,210,110,false,dkHexNum(cols.body),0).setStrokeStyle(13,dkHexNum(cols.body));c.add(tail);tail.setDepth(-2);
    }
    const hat=state.equipped?.hat||'none';
    if(hat==='hat-red'){
      c.add([scene.add.ellipse(0,-89,89,20,0xe65d5d),scene.add.arc(-6,-98,39,180,360,false,0xe65d5d,1)]);
    }else if(hat==='hat-crown'){
      c.add(scene.add.polygon(0,-102,[-38,14,-30,-18,-10,2,0,-28,12,2,32,-18,39,14],0xffd75d).setStrokeStyle(3,0xe9ab36));
    }else if(hat==='hat-stars'){
      c.add([scene.add.arc(0,-101,42,180,360,false,0x675bd8,1),scene.add.star(19,-119,5,4,9,0xffe66d)]);
    }
  }
  c.setSize(170,200).setInteractive({useHandCursor:true});
  scene.tweens.add({targets:c,scaleY:1.025,y:y-5,duration:1250,yoyo:true,repeat:-1,ease:'Sine.InOut'});
  if(stage>0){
    scene.time.addEvent({delay:2800+Math.random()*1800,loop:true,callback:()=>{
      const eyes=c.list.filter(o=>o.getData&&o.getData('eye'));
      scene.tweens.add({targets:eyes,scaleY:.12,duration:70,yoyo:true,hold:55});
    }});
  }
  c.on('pointerdown',()=>{scene.tweens.add({targets:c,scaleX:1.07,scaleY:.92,duration:90,yoyo:true});dkAddSparkles(scene,x,y-45,5,0xffdf65)});
  return c;
}

/* ---------- PET WORLD ---------- */
games.pet=()=>{
  decayPet();
  openModal('Momo Pet World','2D animated pet • jaga, evolve & customize');
  const p=state.pet;
  body.innerHTML=`
    <div class="pet-v2-layout">
      <div>
        <div class="engine-stage" id="engineStage"></div>
      </div>
      <div class="pet-side">
        <div class="game-panel">
          <div class="game-row space"><div><b style="font-size:19px">${esc(p.name)}</b><div class="mini-note">Stage ${p.stage+1} • ${state.xp||0} XP</div></div><span class="mood-badge" id="moodBadge">Happy</span></div>
          <div class="stat-grid" id="petStats" style="margin-top:12px"></div>
        </div>
        <div class="pet-actions-v2">
          <button class="pet-action-btn" data-pa="feed">🍎 Makan<small>+ Hunger</small></button>
          <button class="pet-action-btn" data-pa="play">⚽ Main<small>+ Happy</small></button>
          <button class="pet-action-btn" data-pa="bath">🛁 Mandi<small>+ Clean</small></button>
          <button class="pet-action-btn" data-pa="sleep">🌙 Tidur<small>+ Energy</small></button>
        </div>
        <div class="pet-shop-mini"><h4>✨ Customise Momo</h4><div class="mini-note">Stars daripada semua game boleh digunakan dalam Star Shop.</div><div class="game-row" style="margin-top:9px"><button class="btn secondary" id="petRename">✏️ Nama</button><button class="btn" id="petShop">🛍️ Shop</button></div></div>
      </div>
    </div>`;
  const updateStats=()=>{
    const pp=state.pet, avg=(pp.hunger+pp.happy+pp.clean+pp.energy)/4;
    $('#petStats').innerHTML=[dkStatBar('🍎',pp.hunger),dkStatBar('💖',pp.happy),dkStatBar('🫧',pp.clean),dkStatBar('⚡',pp.energy)].join('');
    const mood=$('#moodBadge'); if(mood) mood.textContent=avg>78?'Super Happy':avg>55?'Happy':avg>35?'Okay':'Perlu dijaga';
  };
  updateStats();
  const PetScene={
    create(){
      dkCurrentScene=this; dkDrawRoom(this); this.pet=dkBuildPet(this,354,335);
      this.add.text(28,28,`${state.pet.name} • Stage ${state.pet.stage+1}`,{fontFamily:'system-ui',fontSize:'18px',fontStyle:'700',color:'#ffffff',backgroundColor:'rgba(31,32,55,.35)',padding:{x:10,y:7}}).setDepth(10);
      this.action=(kind)=>{
        if(!this.pet) return;
        if(kind==='feed'){
          const apple=this.add.circle(116,355,21,0xe7525b).setStrokeStyle(3,0xb83c45);this.add.ellipse(126,329,13,7,0x4c9f5c).setAngle(-25);
          this.tweens.add({targets:apple,x:330,y:319,scale:.3,alpha:.25,duration:650,ease:'Cubic.In',onComplete:()=>{apple.destroy();dkAddSparkles(this,354,300,7,0xffdb65)}});
        }
        if(kind==='play'){
          this.tweens.add({targets:this.pet,x:495,duration:390,yoyo:true,repeat:1,ease:'Sine.InOut'});dkAddSparkles(this,480,315,6,0x8be8ff);
        }
        if(kind==='bath'){
          for(let i=0;i<12;i++){const b=this.add.circle(320+Math.random()*90,360+Math.random()*55,6+Math.random()*9,0xdff8ff,.7).setStrokeStyle(2,0xffffff,.8);this.tweens.add({targets:b,y:b.y-100-Math.random()*70,alpha:0,duration:900+Math.random()*500,onComplete:()=>b.destroy()})}
        }
        if(kind==='sleep'){
          const shade=this.add.rectangle(360,260,720,520,0x17203f,.28).setDepth(20);const z=this.add.text(450,230,'Z  z  z',{fontFamily:'system-ui',fontSize:'30px',color:'#ffffff'}).setDepth(22);this.tweens.add({targets:[shade,z],alpha:0,duration:1500,delay:500,onComplete:()=>{shade.destroy();z.destroy()}});
        }
        this.tweens.add({targets:this.pet,scaleX:1.09,scaleY:.93,duration:120,yoyo:true});
      };
    }
  };
  dkStart('engineStage',PetScene);
  $$('[data-pa]').forEach(btn=>btn.onclick=()=>{
    const kind=btn.dataset.pa, pp=state.pet;
    if(kind==='feed'){pp.hunger=Math.min(100,pp.hunger+22);pp.clean=Math.max(0,pp.clean-2)}
    if(kind==='play'){pp.happy=Math.min(100,pp.happy+23);pp.energy=Math.max(0,pp.energy-7);pp.hunger=Math.max(0,pp.hunger-3)}
    if(kind==='bath') pp.clean=Math.min(100,pp.clean+29);
    if(kind==='sleep') pp.energy=Math.min(100,pp.energy+34);
    const avg=(pp.hunger+pp.happy+pp.clean+pp.energy)/4;
    if(avg>73 && (state.xp||0)>(pp.stage+1)*45 && pp.stage<4){pp.stage++; toast('🎉 Momo evolve ke stage baru!');}
    pp.last=Date.now(); save(); dkCredit(2,'Pet happy',false); updateStats(); if(dkCurrentScene?.action) dkCurrentScene.action(kind);
  });
  $('#petRename').onclick=()=>{const n=prompt('Nama pet:',state.pet.name);if(n){state.pet.name=n.trim().slice(0,18)||'Momo';save();games.pet()}};
  $('#petShop').onclick=()=>dkOpenShop();
  dkSetCleanup(()=>{});
};

/* ---------- FRUIT MERGE / MATTER ---------- */
function dkMakeFruitTextures(scene){
  const defs=[
    ['cherry',19,0xc9324b,0x8f2338],['berry',24,0xe45a7d,0xb63e5d],['orange',30,0xf59b45,0xc66d2c],
    ['apple',37,0xe55252,0xb83939],['pear',44,0xb9d65d,0x7eaa3f],['peach',52,0xf2a57d,0xd77b61],
    ['pine',61,0xe4be4b,0xa67d2d],['melon',70,0x8dcc68,0x549a42],['watermelon',82,0x3ea768,0x217a49]
  ];
  defs.forEach(([key,r,col,dark],lv)=>{
    if(scene.textures.exists(`dk-${key}`)) return;
    const g=scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(col,1);g.fillCircle(r+5,r+6,r);g.lineStyle(Math.max(2,r*.075),dark,.75);g.strokeCircle(r+5,r+6,r-2);
    g.fillStyle(0xffffff,.20);g.fillCircle(r-r*.25,r-r*.27,r*.22);
    if(lv!==8){g.fillStyle(0x4f9a53,1);g.fillEllipse(r+11,5,Math.max(12,r*.55),Math.max(6,r*.24));}
    if(lv===6){g.lineStyle(2,0x9a752e,.35);for(let i=0;i<5;i++)g.lineBetween(10+i*20,12,30+i*20,r*2);}
    if(lv===8){g.fillStyle(0xe75a63,1);g.fillCircle(r+5,r+6,r*.68);g.fillStyle(0x2b2b32,1);for(let i=0;i<8;i++){const a=i*.75;g.fillEllipse(r+5+Math.cos(a)*r*.4,r+6+Math.sin(a)*r*.4,4,7)}}
    g.generateTexture(`dk-${key}`,r*2+12,r*2+12);g.destroy();
  });
  return defs;
}

games.merge=()=>{
  openModal('Fruit Merge','Matter physics • roll, bounce & merge secara natural');
  body.innerHTML=`<div class="engine-toolbar"><div class="engine-stats"><div class="engine-stat"><b id="mergeScore">0</b>Score</div><div class="engine-stat"><b id="mergeBest">${state.best?.merge||0}</b>Best</div><div class="engine-stat"><b id="mergeNext">●</b>Next</div></div><div class="mini-note">Slide pada board untuk aim • tekan DROP</div></div><div class="engine-stage" id="engineStage"></div><div class="engine-controls"><button class="control-btn alt" id="mergeLeft">←</button><button class="control-btn accent" id="mergeDrop">DROP</button><button class="control-btn alt" id="mergeRight">→</button><button class="control-btn alt" id="mergeRestart">↻ New</button></div>`;
  let domScore=0;
  const MergeScene={
    create(){
      dkCurrentScene=this; const W=720,H=520;
      this.cameras.main.setBackgroundColor('#f9f4e8');
      this.add.rectangle(W/2,H-10,W,20,0x745840);this.add.rectangle(12,H/2,24,H,0x745840);this.add.rectangle(W-12,H/2,24,H,0x745840);
      this.add.rectangle(W/2,92,W-48,3,0xe36b72,.5);this.add.text(28,66,'LIMIT',{fontFamily:'system-ui',fontSize:'11px',fontStyle:'700',color:'#b85a60'});
      this.defs=dkMakeFruitTextures(this);this.nextLevel=Phaser.Math.Between(0,2);this.aimX=360;this.score=0;this.merges=0;this.gameOver=false;
      this.aimLine=this.add.rectangle(this.aimX,64,2,60,0x5d55bb,.5).setOrigin(.5,0);this.aimDot=this.add.circle(this.aimX,64,7,0x6559d7);
      this.matter.world.setBounds(12,0,W-24,H-9,24,true,true,false,true);
      this.matter.world.on('collisionstart',event=>{
        event.pairs.forEach(pair=>{
          const A=(pair.bodyA.gameObject||pair.bodyA.parent?.gameObject),B=(pair.bodyB.gameObject||pair.bodyB.parent?.gameObject);
          if(!A||!B||!A.active||!B.active) return;
          const la=A.getData('level'),lb=B.getData('level');
          if(la===undefined||lb===undefined||la!==lb||la>=this.defs.length-1||A.getData('merging')||B.getData('merging')) return;
          A.setData('merging',true);B.setData('merging',true);
          const x=(A.x+B.x)/2,y=(A.y+B.y)/2, nl=la+1;
          this.time.delayedCall(1,()=>{
            if(A.active)A.destroy();if(B.active)B.destroy();
            const n=this.spawnFruit(x,y,nl);n.setVelocity((Math.random()-.5)*1.8,-2.2);this.score+=(nl+1)*12;this.merges++;
            $('#mergeScore').textContent=this.score;domScore=this.score;dkBest('merge',this.score);$('#mergeBest').textContent=state.best.merge;dkCredit(1,'Merge',false);dkAddSparkles(this,x,y,7,0xffd75b);
          });
        });
      });
      this.spawnFruit=(x,y,lv)=>{
        const [key,r]=this.defs[lv]; const o=this.matter.add.image(x,y,`dk-${key}`,undefined,{restitution:.18,friction:.02,frictionAir:.005,density:.0015});
        o.setCircle(r);o.setData('level',lv);o.setData('merging',false);o.setDepth(3);return o;
      };
      this.updateNext=()=>{const [k,r,col]=this.defs[this.nextLevel];$('#mergeNext').innerHTML=`<span style="color:#${col.toString(16).padStart(6,'0')}">●</span>`};this.updateNext();
      this.setAim=x=>{this.aimX=Phaser.Math.Clamp(x,55,665);this.aimLine.x=this.aimX;this.aimDot.x=this.aimX};
      this.drop=()=>{if(this.gameOver)return;this.spawnFruit(this.aimX,46,this.nextLevel);this.nextLevel=Phaser.Math.Between(0,2);this.updateNext();this.time.delayedCall(1200,()=>this.checkLimit())};
      this.checkLimit=()=>{
        const danger=this.children.list.filter(o=>o.getData&&o.getData('level')!==undefined&&o.y<92&&Math.abs(o.body?.velocity?.y||0)<.8);
        if(danger.length){this.gameOver=true;dkBest('merge',this.score);const t=this.add.rectangle(360,250,420,150,0x25243b,.9).setDepth(20);this.add.text(360,223,'Game Over',{fontFamily:'system-ui',fontSize:'32px',fontStyle:'800',color:'#fff'}).setOrigin(.5).setDepth(21);this.add.text(360,271,`Score ${this.score} • tap New untuk cuba lagi`,{fontFamily:'system-ui',fontSize:'15px',color:'#d8d5ee'}).setOrigin(.5).setDepth(21);dkCredit(Math.min(12,Math.floor(this.score/80)),'Fruit Merge',true)};
      };
      this.input.on('pointermove',p=>this.setAim(p.x));this.input.on('pointerdown',p=>this.setAim(p.x));
    }
  };
  dkStart('engineStage',MergeScene,{default:'matter',matter:{gravity:{x:0,y:1.05},enableSleeping:true,debug:false}});
  $('#mergeLeft').onclick=()=>dkCurrentScene?.setAim?.((dkCurrentScene.aimX||360)-45);$('#mergeRight').onclick=()=>dkCurrentScene?.setAim?.((dkCurrentScene.aimX||360)+45);$('#mergeDrop').onclick=()=>dkCurrentScene?.drop?.();$('#mergeRestart').onclick=()=>games.merge();
  dkSetCleanup(()=>dkBest('merge',domScore));
};

/* ---------- RACING ---------- */
function dkBuildCar(scene,x,y){
  const c=scene.add.container(x,y);
  c.add([scene.add.rectangle(-28,16,11,31,0x222533),scene.add.rectangle(28,16,11,31,0x222533),scene.add.rectangle(-28,-28,11,31,0x222533),scene.add.rectangle(28,-28,11,31,0x222533)]);
  c.add(scene.add.rectangle(0,0,49,94,0xe3545b).setStrokeStyle(4,0xaf353c));
  c.add(scene.add.polygon(0,-18,[-18,-15,18,-15,14,15,-14,15],0xa8e4f2));c.add(scene.add.rectangle(0,25,34,19,0xf8d258));
  c.add(scene.add.rectangle(0,-45,20,7,0xffffff,.75));
  return c;
}

games.race=()=>{
  openModal('Racing Challenge','2D top-down racing • pilih lane jawapan betul');
  body.innerHTML=`<div class="engine-toolbar"><div class="engine-stats"><div class="engine-stat"><b id="raceScore">0</b>Score</div><div class="engine-stat"><b id="raceRound">1/10</b>Round</div><div class="engine-stat"><b id="raceBest">${state.best?.race||0}</b>Best</div></div><b id="raceQuestion" style="font-size:20px">Ready?</b></div><div class="engine-stage" id="engineStage"></div><div class="engine-controls"><button class="control-btn alt" data-race-lane="0">← Kiri</button><button class="control-btn accent" data-race-lane="1">Tengah</button><button class="control-btn alt" data-race-lane="2">Kanan →</button><button class="control-btn alt" id="raceNew">↻ New</button></div>`;
  let finalScore=0;
  const RaceScene={
    create(){
      dkCurrentScene=this;const W=720,H=520;this.lane=1;this.score=0;this.round=0;this.finished=false;this.speed=245;
      this.add.rectangle(W/2,H/2,W,H,0x72b85f);this.add.rectangle(W/2,H/2,438,H,0x4b4d57);this.add.rectangle(141,H/2,10,H,0xffffff,.65);this.add.rectangle(579,H/2,10,H,0xffffff,.65);
      this.markers=[];for(let y=-20;y<600;y+=90){[-1,1].forEach(side=>{const m=this.add.rectangle(360+side*73,y,5,48,0xffffff,.62);this.markers.push(m)})}
      dkAddCloud(this,80,70,.45,.65);dkAddCloud(this,640,125,.35,.55);
      this.car=dkBuildCar(this,360,430).setDepth(6);
      this.laneX=[214,360,506];
      this.moveLane=l=>{if(this.finished)return;this.lane=Phaser.Math.Clamp(l,0,2);this.tweens.add({targets:this.car,x:this.laneX[this.lane],angle:(this.lane-1)*4,duration:150,ease:'Sine.Out',onComplete:()=>this.tweens.add({targets:this.car,angle:0,duration:100})})};
      this.nextRound=()=>{
        if(this.round>=10){this.finish();return;}
        this.round++;$('#raceRound').textContent=`${this.round}/10`;
        const a=Phaser.Math.Between(2,12),b=Phaser.Math.Between(1,10);this.answer=a+b;
        const wrong1=this.answer+(Math.random()>.5?1:-1)*Phaser.Math.Between(1,2),wrong2=this.answer+(Math.random()>.5?1:-1)*Phaser.Math.Between(2,4);
        this.vals=Phaser.Utils.Array.Shuffle([this.answer,wrong1,wrong2]);$('#raceQuestion').textContent=`${a} + ${b} = ?`;
        this.spawnGate();
      };
      this.spawnGate=()=>{
        const gate=this.add.container(0,-65).setDepth(5);this.vals.forEach((v,i)=>{const x=this.laneX[i];gate.add(this.add.rectangle(x,0,112,52,i===this.lane?0x7669db:0xeeeeef,.96).setStrokeStyle(3,0xffffff,.85));gate.add(this.add.text(x,0,String(v),{fontFamily:'system-ui',fontSize:'22px',fontStyle:'800',color:'#2e2e3d'}).setOrigin(.5))});
        this.currentGate=gate;this.gateResolved=false;
      };
      this.resolveGate=()=>{if(this.gateResolved||!this.currentGate)return;this.gateResolved=true;const ok=this.vals[this.lane]===this.answer;if(ok){this.score++;$('#raceScore').textContent=this.score;dkAddSparkles(this,this.car.x,385,6,0xffdf62)}else{this.cameras.main.shake(150,.009)}this.currentGate.destroy();this.currentGate=null;this.time.delayedCall(260,()=>this.nextRound())};
      this.finish=()=>{this.finished=true;finalScore=this.score;dkBest('race',this.score);$('#raceBest').textContent=state.best.race;dkCredit(3+this.score,`Race ${this.score}/10`,true);this.add.rectangle(360,250,420,150,0x22223b,.91).setDepth(20);this.add.text(360,222,'🏁 Finish!',{fontFamily:'system-ui',fontSize:'31px',fontStyle:'800',color:'#fff'}).setOrigin(.5).setDepth(21);this.add.text(360,274,`${this.score}/10 betul`,{fontFamily:'system-ui',fontSize:'20px',color:'#e4e1fb'}).setOrigin(.5).setDepth(21)};
      this.nextRound();
      let sx=0;this.input.on('pointerdown',p=>sx=p.x);this.input.on('pointerup',p=>{const dx=p.x-sx;if(Math.abs(dx)>35)this.moveLane(this.lane+(dx>0?1:-1))});
    },
    update(_,delta){
      if(this.finished)return;const dy=this.speed*delta/1000;this.markers.forEach(m=>{m.y+=dy;if(m.y>550)m.y=-40});if(this.currentGate){this.currentGate.y+=dy;if(this.currentGate.y>390)this.resolveGate()}
    }
  };
  dkStart('engineStage',RaceScene);
  $$('[data-race-lane]').forEach(b=>b.onclick=()=>dkCurrentScene?.moveLane?.(+b.dataset.raceLane));$('#raceNew').onclick=()=>games.race();dkSetCleanup(()=>dkBest('race',finalScore));
};

/* ---------- ENDLESS RUNNER / ARCADE PHYSICS ---------- */
function dkRunnerTextures(scene){
  if(!scene.textures.exists('dk-runner')){
    let g=scene.make.graphics({add:false});g.fillStyle(0x574dd0,1);g.fillRoundedRect(14,20,38,47,13);g.fillStyle(0xf4c89a,1);g.fillCircle(33,13,13);g.fillStyle(0x2d2a36,1);g.fillCircle(29,10,2);g.fillCircle(37,10,2);g.fillStyle(0x242534,1);g.fillRect(15,63,14,24);g.fillRect(38,63,14,24);g.generateTexture('dk-runner',68,92);g.destroy();
  }
  if(!scene.textures.exists('dk-crate')){let g=scene.make.graphics({add:false});g.fillStyle(0xb97945,1);g.fillRoundedRect(2,2,55,55,7);g.lineStyle(5,0x7d4b2d,.85);g.strokeRoundedRect(2,2,55,55,7);g.lineBetween(9,9,50,50);g.lineBetween(50,9,9,50);g.generateTexture('dk-crate',60,60);g.destroy();}
  if(!scene.textures.exists('dk-ground')){let g=scene.make.graphics({add:false});g.fillStyle(0x83bf62,1);g.fillRect(0,0,60,20);g.fillStyle(0xa77648,1);g.fillRect(0,20,60,40);g.generateTexture('dk-ground',60,60);g.destroy();}
}

games.runner=()=>{
  openModal('Endless Runner','Arcade physics • tap untuk lompat');
  body.innerHTML=`<div class="engine-toolbar"><div class="engine-stats"><div class="engine-stat"><b id="runnerScore">0</b>Distance</div><div class="engine-stat"><b id="runnerBest">${state.best?.runner||0}</b>Best</div></div><div class="mini-note">Tap screen / JUMP • elak halangan</div></div><div class="engine-stage" id="engineStage"></div><div class="engine-controls"><button class="control-btn accent" id="runnerJump">JUMP ↑</button><button class="control-btn alt" id="runnerNew">↻ New</button></div>`;
  let finalScore=0;
  const RunnerScene={
    create(){
      dkCurrentScene=this;const W=720,H=520;this.score=0;this.dead=false;this.speed=300;this.lastSpawn=0;this.spawnGap=1500;dkRunnerTextures(this);
      this.cameras.main.setBackgroundColor('#9edff5');
      // parallax hills
      this.hills=[];for(let i=0;i<7;i++){const h=this.add.ellipse(i*145,415,240,130,i%2?0x7fc179:0x72b36f);this.hills.push(h)}
      this.clouds=[dkAddCloud(this,120,90,.7,.75),dkAddCloud(this,520,145,.55,.65)];
      this.ground=this.physics.add.staticImage(360,498,'dk-ground').setDisplaySize(760,76).refreshBody();
      this.player=this.physics.add.sprite(118,405,'dk-runner').setScale(.85).setBounce(.02).setCollideWorldBounds(true);this.player.body.setSize(43,76);this.player.body.setOffset(13,12);
      this.obstacles=this.physics.add.group();this.physics.add.collider(this.player,this.ground);this.physics.add.collider(this.obstacles,this.ground);
      this.physics.add.overlap(this.player,this.obstacles,()=>this.gameOver(),null,this);
      this.jump=()=>{if(this.dead)return;if(this.player.body.blocked.down||this.player.body.touching.down){this.player.setVelocityY(-590);this.tweens.add({targets:this.player,angle:-12,duration:130,yoyo:true})}};
      this.input.on('pointerdown',()=>this.jump());
      this.spawn=()=>{if(this.dead)return;const o=this.obstacles.create(760,426,'dk-crate').setScale(.75+Math.random()*.25);o.setVelocityX(-this.speed);o.setImmovable(true);o.body.allowGravity=true;this.lastSpawn=this.time.now;this.spawnGap=1200+Math.random()*1000};
      this.gameOver=()=>{if(this.dead)return;this.dead=true;this.physics.pause();this.player.setTint(0xff9c9c);this.cameras.main.shake(190,.012);finalScore=Math.floor(this.score);dkBest('runner',finalScore);$('#runnerBest').textContent=state.best.runner;dkCredit(Math.min(15,2+Math.floor(finalScore/120)),`Runner ${finalScore}`,true);this.add.rectangle(360,245,420,140,0x22223b,.92).setDepth(20);this.add.text(360,220,'Oops! 🧱',{fontFamily:'system-ui',fontSize:'30px',fontStyle:'800',color:'#fff'}).setOrigin(.5).setDepth(21);this.add.text(360,268,`Distance ${finalScore}`,{fontFamily:'system-ui',fontSize:'18px',color:'#dedbf3'}).setOrigin(.5).setDepth(21)};
    },
    update(time,delta){
      if(this.dead)return;this.score+=delta/18;$('#runnerScore').textContent=Math.floor(this.score);this.speed=Math.min(465,300+this.score*.08);
      if(time-this.lastSpawn>this.spawnGap)this.spawn();
      this.obstacles.children.iterate(o=>{if(o){o.setVelocityX(-this.speed);if(o.x<-80)o.destroy()}});
      this.hills.forEach((h,i)=>{h.x-=delta*(i%2?.018:.012)*this.speed;if(h.x<-150)h.x=840});
      this.clouds.forEach((c,i)=>{c.x-=delta*(i?0.006:0.009)*this.speed;if(c.x<-100)c.x=820});
      if(this.player.body.blocked.down){this.player.angle=Math.sin(time/95)*2.5}
    }
  };
  dkStart('engineStage',RunnerScene,{default:'arcade',arcade:{gravity:{y:1200},debug:false}});$('#runnerJump').onclick=()=>dkCurrentScene?.jump?.();$('#runnerNew').onclick=()=>games.runner();dkSetCleanup(()=>dkBest('runner',finalScore));
};

/* ---------- MAZE ---------- */
function dkMazeGrid(){
  return [
    '111111111111','100000100001','101110101101','101000101001','101011101011','101010001001','101010111101','100010000001','111011111101','100000000001','101111111101','100000000001','111111111111'
  ];
}

games.maze=()=>{
  openModal('Maze Adventure','Animated 2D maze • cari jalan ke bintang');
  body.innerHTML=`<div class="engine-toolbar"><div class="engine-stats"><div class="engine-stat"><b id="mazeMoves">0</b>Moves</div><div class="engine-stat"><b id="mazeBest">${state.best?.maze||0}</b>Best score</div></div><div class="mini-note">Gerakkan orb biru ke ⭐</div></div><div class="engine-stage" id="engineStage"></div><div class="engine-controls"><button class="control-btn alt" data-maze="L">←</button><button class="control-btn alt" data-maze="U">↑</button><button class="control-btn alt" data-maze="D">↓</button><button class="control-btn alt" data-maze="R">→</button><button class="control-btn alt" id="mazeNew">↻</button></div>`;
  const MazeScene={
    create(){
      dkCurrentScene=this;this.grid=dkMazeGrid();this.rows=this.grid.length;this.cols=this.grid[0].length;this.cell=36;this.ox=(720-this.cols*this.cell)/2;this.oy=(520-this.rows*this.cell)/2;this.pos={r:1,c:1};this.goal={r:11,c:10};this.moves=0;this.done=false;
      this.cameras.main.setBackgroundColor('#25283e');
      for(let r=0;r<this.rows;r++)for(let c=0;c<this.cols;c++){const x=this.ox+c*this.cell+this.cell/2,y=this.oy+r*this.cell+this.cell/2;if(this.grid[r][c]==='1')this.add.rectangle(x,y,this.cell-2,this.cell-2,0x4e5272).setStrokeStyle(1,0x636989,.4);else this.add.rectangle(x,y,this.cell-2,this.cell-2,0x30344f)}
      const gx=this.ox+this.goal.c*this.cell+this.cell/2,gy=this.oy+this.goal.r*this.cell+this.cell/2;this.star=this.add.star(gx,gy,5,9,18,0xffd75c);this.tweens.add({targets:this.star,angle:360,scale:1.1,duration:2200,repeat:-1});
      this.player=this.add.circle(this.ox+1*this.cell+this.cell/2,this.oy+1*this.cell+this.cell/2,12,0x6ed4ff).setStrokeStyle(4,0xffffff,.75);this.add.circle(this.player.x-4,this.player.y-4,3,0xffffff,.7);
      this.move=dir=>{if(this.done)return;const d={L:[0,-1],R:[0,1],U:[-1,0],D:[1,0]}[dir],nr=this.pos.r+d[0],nc=this.pos.c+d[1];if(this.grid[nr]?.[nc]!=='0')return;this.pos={r:nr,c:nc};this.moves++;$('#mazeMoves').textContent=this.moves;const x=this.ox+nc*this.cell+this.cell/2,y=this.oy+nr*this.cell+this.cell/2;this.tweens.add({targets:this.player,x,y,duration:120,ease:'Sine.Out'});if(nr===this.goal.r&&nc===this.goal.c){this.done=true;const score=Math.max(1,140-this.moves);dkBest('maze',score);$('#mazeBest').textContent=state.best.maze;dkCredit(Math.max(4,Math.floor(score/20)),'Maze solved',true);dkAddSparkles(this,x,y,14,0xffd75a);this.time.delayedCall(400,()=>this.add.text(360,55,'Maze Complete! ✨',{fontFamily:'system-ui',fontSize:'28px',fontStyle:'800',color:'#ffffff'}).setOrigin(.5))}};
    }
  };
  dkStart('engineStage',MazeScene);$$('[data-maze]').forEach(b=>b.onclick=()=>dkCurrentScene?.move?.(b.dataset.maze));$('#mazeNew').onclick=()=>games.maze();dkSetCleanup(()=>{});
};

/* ---------- BUBBLE POP ---------- */
games.bubble=()=>{
  openModal('Bubble Pop','Phaser arcade mini-game • pop sebanyak mungkin');
  body.innerHTML=`<div class="engine-toolbar"><div class="engine-stats"><div class="engine-stat"><b id="bubbleScore">0</b>Score</div><div class="engine-stat"><b id="bubbleTime">30</b>Seconds</div><div class="engine-stat"><b id="bubbleBest">${state.best?.bubble||0}</b>Best</div></div><div class="mini-note">Tap bubble sebelum ia terbang keluar</div></div><div class="engine-stage" id="engineStage"></div><div class="engine-controls"><button class="control-btn alt" id="bubbleNew">↻ New</button></div>`;
  let finalScore=0;
  const BubbleScene={
    create(){
      dkCurrentScene=this;this.score=0;this.left=30;this.done=false;this.cameras.main.setBackgroundColor('#bcecff');
      for(let i=0;i<9;i++)dkAddCloud(this,Phaser.Math.Between(20,700),Phaser.Math.Between(20,500),Phaser.Math.FloatBetween(.2,.5),.23);
      this.spawn=()=>{if(this.done)return;const r=Phaser.Math.Between(18,43),colors=[0x7b7be8,0xff7f9f,0x5ed0c7,0xffc95d,0x80b8f2],x=Phaser.Math.Between(r+12,708-r),y=Phaser.Math.Between(250,500);const b=this.add.circle(x,y,r,Phaser.Utils.Array.GetRandom(colors),.46).setStrokeStyle(3,0xffffff,.8).setInteractive({useHandCursor:true});const shine=this.add.circle(x-r*.28,y-r*.28,Math.max(3,r*.15),0xffffff,.55);b.setData('shine',shine);b.on('pointerdown',()=>{if(!b.active||this.done)return;this.score++;$('#bubbleScore').textContent=this.score;dkAddSparkles(this,b.x,b.y,4,0xffffff);shine.destroy();this.tweens.add({targets:b,scale:1.35,alpha:0,duration:110,onComplete:()=>b.destroy()})});this.tweens.add({targets:[b,shine],y:-60,duration:Phaser.Math.Between(2800,5200),onComplete:()=>{if(b.active)b.destroy();if(shine.active)shine.destroy()}})};
      this.time.addEvent({delay:350,loop:true,callback:()=>{if(!this.done&&this.children.list.filter(o=>o.input?.enabled).length<16)this.spawn()}});
      this.time.addEvent({delay:1000,repeat:29,callback:()=>{this.left--;$('#bubbleTime').textContent=this.left;if(this.left<=0){this.done=true;finalScore=this.score;dkBest('bubble',this.score);$('#bubbleBest').textContent=state.best.bubble;dkCredit(2+Math.floor(this.score/5),`Bubble ${this.score}`,true);this.add.rectangle(360,250,420,145,0x293750,.88).setDepth(20);this.add.text(360,222,'Time! 🫧',{fontFamily:'system-ui',fontSize:'30px',fontStyle:'800',color:'#fff'}).setOrigin(.5).setDepth(21);this.add.text(360,272,`${this.score} bubbles`,{fontFamily:'system-ui',fontSize:'19px',color:'#e8f7ff'}).setOrigin(.5).setDepth(21)}}});
    }
  };
  dkStart('engineStage',BubbleScene);$('#bubbleNew').onclick=()=>games.bubble();dkSetCleanup(()=>dkBest('bubble',finalScore));
};

/* ---------- STAR SHOP + DAILY REWARD ---------- */
const dkShopItems=[
  {id:'room-sunny',type:'room',name:'Sunny Room',art:'☀️',price:0,desc:'Bilik cerah dan warm.'},
  {id:'room-night',type:'room',name:'Night Room',art:'🌙',price:30,desc:'Bilik malam yang tenang.'},
  {id:'room-forest',type:'room',name:'Forest Room',art:'🌿',price:40,desc:'Suasana hijau nature.'},
  {id:'room-space',type:'room',name:'Space Room',art:'🚀',price:50,desc:'Bilik angkasa gelap.'},
  {id:'hat-red',type:'hat',name:'Red Cap',art:'🧢',price:20,desc:'Topi santai untuk Momo.'},
  {id:'hat-stars',type:'hat',name:'Star Hat',art:'🪄',price:35,desc:'Hat ajaib dengan bintang.'},
  {id:'hat-crown',type:'hat',name:'Golden Crown',art:'👑',price:55,desc:'Untuk pet paling legendary.'},
  {id:'toy-ball',type:'toy',name:'Play Ball',art:'⚽',price:0,desc:'Toy klasik Momo.'},
  {id:'toy-duck',type:'toy',name:'Yellow Duck',art:'🐤',price:18,desc:'Toy comel untuk bilik.'},
  {id:'toy-rocket',type:'toy',name:'Mini Rocket',art:'🚀',price:28,desc:'Toy untuk explorer.'},
  {id:'pet-momo',type:'pet',name:'Momo Gold',art:'🟠',price:0,desc:'Warna asal Momo.'},
  {id:'pet-sky',type:'pet',name:'Momo Sky',art:'🔵',price:65,desc:'Pet skin warna sky blue.'},
  {id:'pet-mint',type:'pet',name:'Momo Mint',art:'🟢',price:65,desc:'Pet skin warna mint.'},
  {id:'pet-berry',type:'pet',name:'Momo Berry',art:'🩷',price:75,desc:'Pet skin berry pink.'}
];
function dkOpenShop(){
  dkDestroyGame();openModal('Star Shop','Gunakan Stars daripada semua aktiviti');
  state.owned=state.owned||['room-sunny'];['room-sunny','toy-ball','pet-momo'].forEach(x=>{if(!state.owned.includes(x))state.owned.push(x)});save();
  const render=()=>{
    body.innerHTML=`<div class="game-row space" style="margin-bottom:12px"><div><b style="font-size:20px">⭐ ${state.stars}</b><div class="mini-note">Semua unlock simpan local dalam device</div></div><button class="btn secondary" id="shopPetBack">🐣 Pet World</button></div><div class="shop-grid">${dkShopItems.map(it=>{
      const owned=state.owned.includes(it.id);const eq=state.equipped?.[it.type]===(it.type==='toy'?it.id.replace('toy-',''):it.id);
      return `<div class="shop-card"><div class="shop-art">${it.art}</div><h4>${it.name}</h4><p>${it.desc}</p><div class="shop-bottom"><span class="price">${it.price?`⭐ ${it.price}`:'FREE'}</span>${owned?`<button class="btn ${eq?'good':'secondary'}" data-equip="${it.id}" data-type="${it.type}">${eq?'✓ Dipakai':'Pakai'}</button>`:`<button class="btn" data-buy="${it.id}">Beli</button>`}</div></div>`}).join('')}</div>`;
    $$('[data-buy]').forEach(btn=>btn.onclick=()=>{const item=dkShopItems.find(x=>x.id===btn.dataset.buy);if(!item)return;if(!dkSpend(item.price)){toast('Stars tak cukup lagi');return}state.owned.push(item.id);save();toast(`${item.name} unlocked ✨`);render()});
    $$('[data-equip]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.equip,type=btn.dataset.type;if(type==='toy')state.equipped.toy=id.replace('toy-','');else state.equipped[type]=id;save();toast('Dipakai ✓');render()});
    $('#shopPetBack').onclick=()=>games.pet();
  };render();dkSetCleanup(()=>{});
}
function dkOpenDaily(){
  dkDestroyGame();openModal('Daily Gift','Satu hadiah setiap hari');state.daily=state.daily||{lastClaim:0,streak:0};const today=dkTodayKey(),claimed=state.daily.lastClaim===today;const reward=10+Math.min(20,(state.daily.streak||0)*2);
  body.innerHTML=`<div class="daily-card"><div class="gift-box">🎁</div><div class="eyebrow" style="color:#fff;opacity:.8">DAILY REWARD</div><h3>${claimed?'Hadiah hari ini dah diambil':'Buka hadiah hari ini!'}</h3><p>${claimed?`Datang semula esok. Current streak: ${state.daily.streak||1} hari.`:`Hari ini ada <b>${reward} Stars</b> untuk digunakan di Star Shop.`}</p><button class="btn" id="claimDaily" ${claimed?'disabled':''}>${claimed?'✓ Claimed':`Claim ⭐ ${reward}`}</button></div>`;
  $('#claimDaily').onclick=()=>{if(state.daily.lastClaim===today)return;const prev=state.daily.lastClaim;state.daily.streak=(state.daily.streak||0)+1;state.daily.lastClaim=today;dkCredit(reward,'Daily Gift',true);dkOpenDaily()};dkSetCleanup(()=>{});
}

/* ---------- v2 hooks ---------- */
if(document.getElementById('heroPetBtn')) $('#heroPetBtn').onclick=()=>{markPlayed('pet');games.pet()};
if(document.getElementById('shopBtn')) $('#shopBtn').onclick=dkOpenShop;
if(document.getElementById('dailyBtn')) $('#dailyBtn').onclick=dkOpenDaily;
if(document.getElementById('engineChip')){
  const chip=$('#engineChip');
  if(!dkEngineAvailable()){chip.innerHTML='<span class="engine-dot" style="background:#e9a33f"></span> Engine cache';chip.title='Phaser akan dicache pada first online load';}
}

// Pause active game when the app is backgrounded; Phaser resumes when visible again.
document.addEventListener('visibilitychange',()=>{
  if(!dkGame) return;
  try{ if(document.hidden) dkGame.loop?.sleep?.(); else dkGame.loop?.wake?.(); }catch(e){}
});

renderHeader();
