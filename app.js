const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const modal = $('#modal'), body = $('#modalBody');

const defaultState = {
  name:'Kawan', avatar:'🧒', stars:60, xp:0, played:{}, achievements:{},
  pet:{name:'Momo', stage:0, hunger:78, happy:82, clean:84, energy:80, born:Date.now(), last:Date.now(), accessories:[], species:'momo'},
  best:{race:0,runner:0,merge:0,maze:0,bubble:0},
  owned:['room-sunny'], equipped:{room:'room-sunny',hat:'none',toy:'ball',pet:'pet-momo'}, daily:{lastClaim:0,streak:0},
  stories:[], avatarBuild:{face:'🙂',hair:'🧢',item:'⭐'}
};
let state = loadState();
function loadState(){
  try{
    const raw=JSON.parse(localStorage.getItem('duniaku-state')||'{}');
    return {...defaultState,...raw,pet:{...defaultState.pet,...(raw.pet||{})},best:{...defaultState.best,...(raw.best||{})},equipped:{...defaultState.equipped,...(raw.equipped||{})},daily:{...defaultState.daily,...(raw.daily||{})},owned:Array.isArray(raw.owned)?raw.owned:[...defaultState.owned]};
  }catch{return structuredClone(defaultState)}
}
function save(){localStorage.setItem('duniaku-state',JSON.stringify(state));renderHeader()}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1600)}
function addStars(n, reason=''){state.stars+=n;state.xp+=n;save(); if(n>0) toast(`+${n} ⭐ ${reason}`); checkAchievements()}
function markPlayed(id){state.played[id]=(state.played[id]||0)+1;save();checkAchievements()}
function openModal(title,subtitle=''){ $('#modalTitle').textContent=title;$('#modalSubtitle').textContent=subtitle;$('#modalStars').textContent=state.stars;body.innerHTML='';modal.classList.remove('hidden') }
function closeModal(){modal.classList.add('hidden'); body.innerHTML=''; if(window.__cleanup){try{window.__cleanup()}catch{};window.__cleanup=null} }
$('#closeModal').onclick=closeModal;

const activities=[
{id:'pet',cat:'pet',icon:'🐣',name:'Momo Pet',desc:'Jaga, beri makan, mandikan dan besarkan pet.',tag:'VIRTUAL PET'},
{id:'merge',cat:'game',icon:'🍉',name:'Fruit Merge',desc:'Gabungkan buah sama jadi buah lebih besar.',tag:'MERGE'},
{id:'race',cat:'game',icon:'🏎️',name:'Racing Challenge',desc:'Pilih lane jawapan betul sambil berlumba.',tag:'RACING'},
{id:'memory',cat:'think',icon:'🃏',name:'Memory Match',desc:'Cari semua pasangan kad.',tag:'MEMORY'},
{id:'maze',cat:'think',icon:'🌀',name:'Maze Adventure',desc:'Cari jalan keluar dari maze.',tag:'MAZE'},
{id:'runner',cat:'game',icon:'🏃',name:'Endless Runner',desc:'Lompat halangan dan kejar high score.',tag:'RUNNER'},
{id:'bubble',cat:'game',icon:'🫧',name:'Bubble Pop',desc:'Pop bubble secepat mungkin.',tag:'ARCADE'},
{id:'wordhunt',cat:'think',icon:'🔤',name:'Word Hunt',desc:'Cari perkataan tersembunyi dalam grid.',tag:'WORDS'},
{id:'jigsaw',cat:'think',icon:'🧩',name:'Jigsaw Shuffle',desc:'Susun semula tile sehingga lengkap.',tag:'PUZZLE'},
{id:'difference',cat:'think',icon:'🔎',name:'Spot Difference',desc:'Cari benda yang berbeza antara dua gambar.',tag:'OBSERVE'},
{id:'rhythm',cat:'game',icon:'🥁',name:'Rhythm Tap',desc:'Ikut urutan bunyi dan cahaya.',tag:'MUSIC GAME'},
{id:'hidden',cat:'think',icon:'🕵️',name:'Hidden Object',desc:'Cari objek kecil yang bersembunyi.',tag:'SEARCH'},
{id:'logic',cat:'think',icon:'💡',name:'Logic Lights',desc:'Padam semua lampu dengan langkah paling bijak.',tag:'LOGIC'},
{id:'draw',cat:'create',icon:'✏️',name:'Free Drawing',desc:'Lukis apa sahaja atas canvas.',tag:'DRAW'},
{id:'colour',cat:'create',icon:'🎨',name:'Colouring',desc:'Warnakan gambar dengan warna pilihan.',tag:'COLOUR'},
{id:'stickers',cat:'create',icon:'🌳',name:'Sticker Scene',desc:'Cipta dunia dengan sticker yang boleh digerak.',tag:'CREATE'},
{id:'room',cat:'create',icon:'🏠',name:'Build-a-Room',desc:'Susun perabot dan bina bilik sendiri.',tag:'DESIGN'},
{id:'avatar',cat:'create',icon:'🧑‍🎤',name:'Character Creator',desc:'Cipta watak dan gaya sendiri.',tag:'AVATAR'},
{id:'music',cat:'create',icon:'🎹',name:'Music Pad',desc:'Main beat dan melodi sendiri.',tag:'MUSIC'},
{id:'story',cat:'create',icon:'📖',name:'Story Maker',desc:'Cipta cerita, komik ringkas dan simpan.',tag:'STORY'},
{id:'coding',cat:'think',icon:'🧱',name:'Block Coding',desc:'Susun arahan untuk bawa robot ke bintang.',tag:'CODING'}
];

function renderHeader(){
  $('#stars').textContent=state.stars; $('#modalStars').textContent=state.stars;
  $('#childName').textContent=state.name||'Kawan'; $('#profileBtn').textContent=state.avatar||'🧒';
  const preview=$('#petPreview'); if(preview){preview.dataset.stage=String(Math.min(4,state.pet.stage||0));preview.dataset.room=state.equipped?.room||'room-sunny';}
  if($('#quickPetName')) $('#quickPetName').textContent=state.pet.name||'Momo';
  if($('#quickXp')) $('#quickXp').textContent=`${state.xp||0} XP`;
  if($('#quickBest')) $('#quickBest').textContent=Math.max(0,...Object.values(state.best||{}));
  if($('#quickOwned')) $('#quickOwned').textContent=(state.owned||[]).length;
}
function renderActivities(cat='all'){
 const arr=cat==='all'?activities:activities.filter(a=>a.cat===cat);
 const engineIds=new Set(['pet','merge','race','runner','maze','bubble']);
 $('#activityCount').textContent=arr.length;
 $('#activityGrid').innerHTML=arr.map(a=>`<button class="activity-card ${engineIds.has(a.id)?'engine-card':''}" data-id="${a.id}"><div class="activity-icon">${a.icon}</div>${engineIds.has(a.id)?'<span class="engine-label">2D ENGINE</span>':''}<h4>${a.name}</h4><p>${a.desc}</p><div class="tag">${a.tag}</div></button>`).join('');
 $$('.activity-card').forEach(b=>b.onclick=()=>launch(b.dataset.id));
}
$$('.tab').forEach(t=>t.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');renderActivities(t.dataset.tab)});

function launch(id){markPlayed(id); const f=games[id]; if(f)f()}

function checkAchievements(){
 const a=state.achievements;
 if(Object.keys(state.played).length>=1)a.first=true;
 if(Object.keys(state.played).length>=5)a.explorer=true;
 if(Object.keys(state.played).length>=15)a.super=true;
 if(state.stars>=50)a.star50=true;
 if(state.stars>=150)a.star150=true;
 if((state.played.pet||0)>=5)a.petpal=true;
 save();
}
$('#achievementsBtn').onclick=()=>{
 openModal('🏆 Pencapaian','Badge yang telah dibuka');
 const list=[['first','🌟','First Play','Main aktiviti pertama'],['explorer','🧭','Explorer','Cuba 5 aktiviti'],['super','🚀','Super Explorer','Cuba 15 aktiviti'],['star50','⭐','Star Collector','Kumpul 50 bintang'],['star150','💫','Star Master','Kumpul 150 bintang'],['petpal','🐣','Pet Pal','Lawat pet 5 kali']];
 body.innerHTML=`<div class="achievement-grid">${list.map(x=>`<div class="achievement ${state.achievements[x[0]]?'':'locked'}"><b>${x[1]} ${x[2]}</b><div class="mini-note">${x[3]}</div></div>`).join('')}</div>`;
};
$('#profileBtn').onclick=()=>{
 openModal('Profil Saya','Disimpan dalam device ini');
 body.innerHTML=`<div class="game-panel profile-form"><label>Nama<input id="pname" value="${esc(state.name)}" maxlength="20"></label><div><b>Pilih avatar</b><div class="choice-grid" id="avatars">${['🧒','👧','👦','🧑','👩','👨','🦸','🧙'].map(x=>`<button class="choice">${x}</button>`).join('')}</div></div><button class="btn" id="saveProfile">Simpan Profil</button><button class="btn secondary" id="resetApp">Reset semua data</button></div>`;
 let av=state.avatar; $$('#avatars .choice').forEach(b=>b.onclick=()=>{av=b.textContent;$$('#avatars .choice').forEach(x=>x.style.outline='');b.style.outline='3px solid #6c5ce7'});
 $('#saveProfile').onclick=()=>{state.name=$('#pname').value.trim()||'Kawan';state.avatar=av;save();closeModal();toast('Profil disimpan')};
 $('#resetApp').onclick=()=>{if(confirm('Padam semua progress DuniaKu dalam device ini?')){localStorage.removeItem('duniaku-state');location.reload()}};
};
$('#starsBtn').onclick=()=>$('#achievementsBtn').click();

const games={};

// PET
games.pet=()=>{
 decayPet(); openModal('🐣 Momo Pet','Jaga pet supaya sihat dan gembira');
 const p=state.pet, stage=['🥚','🐣','🐥','🐤','🦜'][Math.min(4,p.stage)];
 body.innerHTML=`<div class="pet-room"><span class="decor d1">🌷</span><span class="decor d2">☀️</span><span class="decor d3">🏡</span><div class="pet-character" id="petChar">${stage}</div></div><div class="game-panel" style="margin-top:12px"><div class="game-row space"><div><b>${esc(p.name)}</b><div class="mini-note">Stage ${p.stage+1} • XP ${state.xp}</div></div><button class="btn secondary" id="renamePet">✏️ Nama</button></div><div class="stat-grid" style="margin-top:13px">${petStat('🍎 Lapar',p.hunger)}${petStat('💖 Happy',p.happy)}${petStat('🫧 Bersih',p.clean)}${petStat('⚡ Tenaga',p.energy)}</div><div class="game-row" style="margin-top:14px"><button class="btn" data-pet="feed">🍎 Makan</button><button class="btn" data-pet="play">⚽ Main</button><button class="btn" data-pet="bath">🛁 Mandi</button><button class="btn" data-pet="sleep">😴 Tidur</button></div><p class="mini-note">Pet akan perlahan-lahan lapar dan penat mengikut masa sebenar. Jaga selalu untuk evolve.</p></div>`;
 $$('[data-pet]').forEach(b=>b.onclick=()=>petAction(b.dataset.pet));
 $('#renamePet').onclick=()=>{const n=prompt('Nama pet:',state.pet.name);if(n){state.pet.name=n.slice(0,18);save();games.pet()}};
};
function petStat(n,v){return `<div class="stat"><b>${n} ${Math.round(v)}%</b><div class="bar"><i style="width:${v}%"></i></div></div>`}
function decayPet(){const p=state.pet, hours=Math.max(0,(Date.now()-p.last)/36e5);p.hunger=Math.max(0,p.hunger-hours*2.2);p.happy=Math.max(0,p.happy-hours*1.2);p.clean=Math.max(0,p.clean-hours*.9);p.energy=Math.max(0,p.energy-hours*1.5);p.last=Date.now();save()}
function petAction(a){const p=state.pet;if(a==='feed'){p.hunger=Math.min(100,p.hunger+22);p.clean=Math.max(0,p.clean-3)}if(a==='play'){p.happy=Math.min(100,p.happy+24);p.energy=Math.max(0,p.energy-8);p.hunger=Math.max(0,p.hunger-4)}if(a==='bath')p.clean=Math.min(100,p.clean+28);if(a==='sleep')p.energy=Math.min(100,p.energy+35);const avg=(p.hunger+p.happy+p.clean+p.energy)/4;if(avg>72&&state.xp>(p.stage+1)*45&&p.stage<4){p.stage++;toast('🎉 Momo evolve!')}save();addStars(2,'Pet happy');games.pet()}

// DRAW
games.draw=()=>drawingGame(false); games.colour=()=>drawingGame(true);
function drawingGame(colourMode){openModal(colourMode?'🎨 Colouring':'✏️ Free Drawing',colourMode?'Warnakan gambar pelangi':'Lukis apa sahaja');body.innerHTML=`<div class="palette" id="palette"></div><div class="canvas-wrap"><canvas id="drawCanvas" class="draw-canvas" width="900" height="600"></canvas></div><div class="game-row" style="margin-top:10px"><button class="btn secondary" id="clearDraw">🧹 Clear</button><button class="btn" id="doneDraw">✓ Siap</button></div>`;
 const c=$('#drawCanvas'),ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);if(colourMode)drawColourTemplate(ctx,c.width,c.height);let color='#6c5ce7',down=false,lw=colourMode?18:8;const colors=['#202238','#6c5ce7','#ff5d73','#ffb72b','#21b573','#2e9bf0','#9b59b6','#8d5a3b'];$('#palette').innerHTML=colors.map(x=>`<button class="color-dot" style="background:${x}" data-c="${x}"></button>`).join('');$$('.color-dot').forEach(b=>b.onclick=()=>color=b.dataset.c);
 const pos=e=>{const r=c.getBoundingClientRect(),t=e.touches?e.touches[0]:e;return{x:(t.clientX-r.left)*c.width/r.width,y:(t.clientY-r.top)*c.height/r.height}};let prev;
 const start=e=>{e.preventDefault();down=true;prev=pos(e)};const move=e=>{if(!down)return;e.preventDefault();const p=pos(e);ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.lineTo(p.x,p.y);ctx.stroke();prev=p};const end=()=>down=false;c.addEventListener('pointerdown',start);c.addEventListener('pointermove',move);window.addEventListener('pointerup',end);
 $('#clearDraw').onclick=()=>{ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);if(colourMode)drawColourTemplate(ctx,c.width,c.height)};$('#doneDraw').onclick=()=>addStars(5,'Karya siap');window.__cleanup=()=>window.removeEventListener('pointerup',end);
}
function drawColourTemplate(ctx,w,h){ctx.strokeStyle='#d1d1da';ctx.lineWidth=7;ctx.beginPath();ctx.arc(w*.5,h*.68,230,Math.PI,0);ctx.stroke();ctx.beginPath();ctx.arc(w*.5,h*.68,180,Math.PI,0);ctx.stroke();ctx.beginPath();ctx.arc(w*.5,h*.68,130,Math.PI,0);ctx.stroke();ctx.font='100px serif';ctx.fillStyle='#f0f0f4';ctx.fillText('☁️',100,470);ctx.fillText('☁️',670,470);ctx.font='80px serif';ctx.fillText('⭐',410,150)}

// MEMORY
games.memory=()=>{openModal('🃏 Memory Match','Cari semua pasangan');const icons=['🍓','🐼','🚀','🌈','⚽','🍕','🎈','🦕'],cards=[...icons,...icons].sort(()=>Math.random()-.5);let open=[],matched=0,moves=0;body.innerHTML=`<div class="game-row space"><b>Moves: <span id="moves">0</span></b><button class="btn secondary" id="restartMem">Restart</button></div><div class="memory-grid">${cards.map((x,i)=>`<button class="memory-card" data-i="${i}" data-v="${x}">?</button>`).join('')}</div>`;$$('.memory-card').forEach(b=>b.onclick=()=>{if(open.length>=2||b.classList.contains('matched')||b.classList.contains('revealed'))return;b.classList.add('revealed');b.textContent=b.dataset.v;open.push(b);if(open.length===2){moves++;$('#moves').textContent=moves;if(open[0].dataset.v===open[1].dataset.v){open.forEach(x=>x.classList.add('matched'));matched+=2;open=[];if(matched===cards.length)addStars(10,'Memory complete')}else setTimeout(()=>{open.forEach(x=>{x.classList.remove('revealed');x.textContent='?'});open=[]},650)}});$('#restartMem').onclick=games.memory};

// MAZE
games.maze=()=>{openModal('🌀 Maze Adventure','Bawa 🐰 ke 🥕');const M=[[0,0,1,0,0,0,0],[1,0,1,0,1,1,0],[0,0,0,0,0,1,0],[0,1,1,1,0,1,0],[0,0,0,1,0,0,0],[1,1,0,1,1,1,0],[0,0,0,0,0,0,0]],goal=[6,6];let p=[0,0];body.innerHTML=`<div class="maze" id="maze" style="grid-template-columns:repeat(7,1fr)"></div><div class="maze-pad"><span></span><button class="btn" data-d="u">↑</button><span></span><button class="btn" data-d="l">←</button><button class="btn" data-d="d">↓</button><button class="btn" data-d="r">→</button></div>`;const render=()=>{$('#maze').innerHTML=M.flatMap((row,r)=>row.map((v,c)=>`<div class="maze-cell ${v?'wall':''}">${r===p[0]&&c===p[1]?'🐰':r===goal[0]&&c===goal[1]?'🥕':''}</div>`)).join('')};render();$$('[data-d]').forEach(b=>b.onclick=()=>{let [r,c]=p,n=[r,c];if(b.dataset.d==='u')n=[r-1,c];if(b.dataset.d==='d')n=[r+1,c];if(b.dataset.d==='l')n=[r,c-1];if(b.dataset.d==='r')n=[r,c+1];if(M[n[0]]&&M[n[0]][n[1]]===0){p=n;render();if(p[0]===goal[0]&&p[1]===goal[1]){addStars(10,'Maze solved');setTimeout(games.maze,700)}}})};

// RUNNER
games.runner=()=>{openModal('🏃 Endless Runner','Tap LOMPAT untuk elak batu');body.innerHTML=`<div class="game-row space"><b>Score: <span id="runScore">0</span></b><button class="btn" id="jump">LOMPAT</button></div><div class="runner-board" id="runner"><div class="ground"></div><div class="runner-player" id="rp">🦊</div><div class="runner-obstacle" id="ro">🪨</div></div>`;let y=0,vy=0,obs=650,score=0,alive=true,last=performance.now();const loop=t=>{if(!alive)return;const dt=Math.min(30,t-last)/16.7;last=t;vy-=1.2*dt;y+=vy*dt;if(y<0){y=0;vy=0}obs-=6*dt;if(obs<-60){obs=650+Math.random()*220;score++;$('#runScore').textContent=score;if(score%5===0)addStars(2,'Runner')}$('#rp').style.transform=`translateY(${-y}px)`;$('#ro').style.right=`${650-obs}px`;if(obs<565&&obs>510&&y<35){alive=false;$('#ro').textContent='💥';toast(`Game over • Score ${score}`);if(score>=3)addStars(Math.min(10,score),'Runner score');return}requestAnimationFrame(loop)};$('#jump').onclick=()=>{if(y===0)vy=18};requestAnimationFrame(loop);window.__cleanup=()=>alive=false};

// BUBBLE
games.bubble=()=>{openModal('🫧 Bubble Pop','Pop 20 bubble');body.innerHTML=`<div class="game-row space"><b>Pop: <span id="popCount">0</span>/20</b><b>Time: <span id="popTime">30</span>s</b></div><div class="bubbles" id="bubbles"></div>`;let count=0,time=30,active=true;const spawn=()=>{if(!active||count>=20)return;const b=document.createElement('button');b.className='bubble';const s=45+Math.random()*45;b.style.width=b.style.height=s+'px';b.style.left=Math.random()*85+'%';b.style.top=Math.random()*82+'%';b.textContent=['⭐','🐟','🍬','🌸'][Math.floor(Math.random()*4)];b.onclick=()=>{if(!active)return;b.remove();count++;$('#popCount').textContent=count;if(count>=20){active=false;addStars(10,'Bubble master')}};$('#bubbles').append(b);setTimeout(()=>b.remove(),2200)};const si=setInterval(spawn,240);const ti=setInterval(()=>{if(!active){clearInterval(ti);clearInterval(si);return}time--;$('#popTime').textContent=time;if(time<=0){active=false;toast(`Masa tamat • ${count}/20`);clearInterval(si);clearInterval(ti)}},1000);window.__cleanup=()=>{active=false;clearInterval(si);clearInterval(ti)}};

// WORD HUNT
games.wordhunt=()=>{openModal('🔤 Word Hunt','Cari CAT, SUN, RED, BUS');const words=['CAT','SUN','RED','BUS'];const grid=['C','A','T','M','Q','R','P','S','U','N','E','E','B','U','S','D','D','L','A','R','E','D','O','W','T','Y','P','K','I','N','Z','X','V','B','N','M'];let selected=[],found=new Set();body.innerHTML=`<div class="word-list">${words.map(w=>`<span class="word-chip" data-word="${w}">${w}</span>`).join('')}</div><div class="word-grid">${grid.map((x,i)=>`<button class="word-cell" data-i="${i}" data-l="${x}">${x}</button>`).join('')}</div><div class="center"><button class="btn secondary" id="wordClear">Clear selection</button></div>`;$$('.word-cell').forEach(b=>b.onclick=()=>{b.classList.toggle('sel');if(b.classList.contains('sel'))selected.push(b);else selected=selected.filter(x=>x!==b);const s=selected.map(x=>x.dataset.l).join('');const rev=[...s].reverse().join('');const hit=words.find(w=>w===s||w===rev);if(hit&&!found.has(hit)){found.add(hit);$(`[data-word="${hit}"]`).classList.add('done');selected.forEach(x=>x.disabled=true);selected=[];$$('.word-cell:not(:disabled)').forEach(x=>x.classList.remove('sel'));addStars(2,hit);if(found.size===words.length)addStars(5,'Semua word jumpa')}});$('#wordClear').onclick=()=>{selected=[];$$('.word-cell:not(:disabled)').forEach(x=>x.classList.remove('sel'))}};

// JIGSAW SLIDING
games.jigsaw=()=>{openModal('🧩 Jigsaw Shuffle','Susun 1 hingga 8');let arr=[1,2,3,4,5,6,7,8,0];for(let k=0;k<80;k++){let z=arr.indexOf(0),r=Math.floor(z/3),c=z%3,ns=[];if(r)ns.push(z-3);if(r<2)ns.push(z+3);if(c)ns.push(z-1);if(c<2)ns.push(z+1);let n=ns[Math.floor(Math.random()*ns.length)];[arr[z],arr[n]]=[arr[n],arr[z]]}body.innerHTML=`<div class="tile-grid" id="tilegrid"></div><div class="center"><button class="btn secondary" id="resetJig">Shuffle</button></div>`;const render=()=>{$('#tilegrid').innerHTML=arr.map((n,i)=>`<button class="tile ${n?'':'empty'}" data-i="${i}">${n||''}</button>`).join('');$$('.tile').forEach(b=>b.onclick=()=>{const i=+b.dataset.i,z=arr.indexOf(0);if([i-1,i+1,i-3,i+3].includes(z)&&!(Math.abs(i-z)===1&&Math.floor(i/3)!==Math.floor(z/3))){[arr[i],arr[z]]=[arr[z],arr[i]];render();if(arr.join(',')==='1,2,3,4,5,6,7,8,0')addStars(10,'Puzzle complete')}})};render();$('#resetJig').onclick=games.jigsaw};

// DIFFERENCE
games.difference=()=>{openModal('🔎 Spot Difference','Cari 4 perbezaan pada gambar kanan');const left=[['☀️',70,20],['🌳',20,155],['🏠',62,145],['🐕',48,205],['🌸',78,215],['☁️',25,35]],right=[['🌙',70,20],['🌳',20,155],['🏡',62,145],['🐈',48,205],['🌻',78,215],['☁️',25,35]];let found=0;const scene=(arr,isRight)=>`<div class="scene">${arr.map((x,i)=>`<button style="left:${x[1]}%;top:${x[2]/2.6}px" ${isRight?`data-diff="${i}"`:''}>${x[0]}</button>`).join('')}</div>`;body.innerHTML=`<div class="game-row space"><b>Jumpa: <span id="df">0</span>/4</b></div><div class="diff-scene">${scene(left,false)}${scene(right,true)}</div>`;const diffs=new Set([0,2,3,4]);$$('[data-diff]').forEach(b=>b.onclick=()=>{const i=+b.dataset.diff;if(diffs.has(i)&&!b.classList.contains('found')){b.classList.add('found');found++;$('#df').textContent=found;addStars(2,'Betul');if(found===4)addStars(5,'Semua beza')}else{b.classList.add('wrong');setTimeout(()=>b.classList.remove('wrong'),300)}})};

// RHYTHM
games.rhythm=()=>{openModal('🥁 Rhythm Tap','Ingat dan ikut urutan');body.innerHTML=`<div class="game-row space"><b>Level: <span id="rhLvl">1</span></b><button class="btn" id="rhStart">Mula</button></div><div class="rhythm-track" style="margin-top:12px">${['🥁','👏','🔔','🎵'].map((x,i)=>`<button class="rhythm-pad" data-r="${i}">${x}</button>`).join('')}</div>`;let seq=[],input=[],locked=true,level=1;const flash=i=>{const b=$(`[data-r="${i}"]`);b.classList.add('flash');tone(220+i*110,.12);setTimeout(()=>b.classList.remove('flash'),330)};const next=()=>{locked=true;input=[];seq.push(Math.floor(Math.random()*4));let k=0;const tm=setInterval(()=>{flash(seq[k++]);if(k>=seq.length){clearInterval(tm);setTimeout(()=>locked=false,400)}},600)};$$('[data-r]').forEach(b=>b.onclick=()=>{if(locked)return;const i=+b.dataset.r;flash(i);input.push(i);const j=input.length-1;if(input[j]!==seq[j]){locked=true;toast('Oops, cuba lagi');setTimeout(()=>{seq=[];level=1;$('#rhLvl').textContent=1;next()},700);return}if(input.length===seq.length){level++;$('#rhLvl').textContent=level;addStars(2,'Rhythm');if(level>6){addStars(10,'Rhythm master');seq=[];level=1}setTimeout(next,600)}});$('#rhStart').onclick=()=>{seq=[];level=1;$('#rhLvl').textContent=1;next()}};
function tone(freq,dur=.15){try{const A=window.AudioContext||window.webkitAudioContext,a=new A(),o=a.createOscillator(),g=a.createGain();o.frequency.value=freq;o.connect(g);g.connect(a.destination);g.gain.setValueAtTime(.08,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+dur);o.start();o.stop(a.currentTime+dur)}catch{}}

// HIDDEN OBJECT
games.hidden=()=>{openModal('🕵️ Hidden Object','Cari: 🔑 🐞 🍎 ⭐ 🧸');const items=[['🔑',13,74],['🐞',82,21],['🍎',61,67],['⭐',31,15],['🧸',86,74],['🌼',50,77],['🦋',23,30],['☁️',66,10],['🌳',8,45],['🏠',70,43]];const targets=new Set(['🔑','🐞','🍎','⭐','🧸']);let found=0;body.innerHTML=`<div class="game-row space"><b>Jumpa: <span id="hid">0</span>/5</b><span class="mini-note">🔑 🐞 🍎 ⭐ 🧸</span></div><div class="hidden-scene">${items.map((x,i)=>`<button class="hidden-item" style="left:${x[1]}%;top:${x[2]}%" data-h="${i}">${x[0]}</button>`).join('')}</div>`;$$('[data-h]').forEach(b=>b.onclick=()=>{if(targets.has(items[+b.dataset.h][0])&&!b.classList.contains('found')){b.classList.add('found');found++;$('#hid').textContent=found;addStars(2,'Jumpa');if(found===5)addStars(5,'Hidden master')}})};

// LOGIC LIGHTS
games.logic=()=>{openModal('💡 Logic Lights','Matikan semua lampu');let g=Array.from({length:16},()=>Math.random()>.55);if(!g.some(Boolean))g[5]=true;body.innerHTML=`<div class="game-row space"><b>Moves: <span id="lm">0</span></b><button class="btn secondary" id="logicReset">New</button></div><div class="light-grid" id="lights"></div>`;let moves=0;const toggle=i=>{[i,i-1,i+1,i-4,i+4].forEach(j=>{if(j>=0&&j<16&&!(Math.abs(j-i)===1&&Math.floor(j/4)!==Math.floor(i/4)))g[j]=!g[j]})};const render=()=>{$('#lights').innerHTML=g.map((v,i)=>`<button class="light ${v?'on':''}" data-l="${i}"></button>`).join('');$$('[data-l]').forEach(b=>b.onclick=()=>{toggle(+b.dataset.l);moves++;$('#lm').textContent=moves;render();if(!g.some(Boolean))addStars(12,'Logic solved')})};render();$('#logicReset').onclick=games.logic};

// STICKER SCENE
games.stickers=()=>stageBuilder('🌳 Sticker Scene',['🌳','☁️','🌈','🦄','🚗','🏡','🌸','🦋','🐶','🐱'],'sticker');
// ROOM
games.room=()=>stageBuilder('🏠 Build-a-Room',['🛏️','🛋️','🪑','🪴','📺','🧸','🪞','💡','🖼️','📚'],'room');
function stageBuilder(title,items,type){openModal(title,'Tap item untuk tambah. Drag untuk susun.');body.innerHTML=`<div class="${type==='room'?'room-stage':'sticker-stage'}" id="stage"></div><div class="${type==='room'?'item-bank':'sticker-bank'}">${items.map(x=>`<button class="bank-btn">${x}</button>`).join('')}</div><div class="game-row"><button class="btn secondary" id="stageClear">Clear</button><button class="btn" id="stageDone">✓ Siap</button></div>`;const stage=$('#stage');$$('.bank-btn').forEach(b=>b.onclick=()=>{const d=document.createElement('div');d.className=type==='room'?'room-item':'sticker-item';d.textContent=b.textContent;d.style.left=20+Math.random()*60+'%';d.style.top=20+Math.random()*55+'%';stage.append(d);dragEl(d,stage)});$('#stageClear').onclick=()=>stage.innerHTML='';$('#stageDone').onclick=()=>addStars(6,'Design siap')}
function dragEl(el,stage){let dragging=false,dx=0,dy=0;el.onpointerdown=e=>{dragging=true;el.setPointerCapture(e.pointerId);const r=el.getBoundingClientRect();dx=e.clientX-r.left;dy=e.clientY-r.top};el.onpointermove=e=>{if(!dragging)return;const s=stage.getBoundingClientRect();el.style.left=Math.max(0,Math.min(s.width-45,e.clientX-s.left-dx))+'px';el.style.top=Math.max(0,Math.min(s.height-45,e.clientY-s.top-dy))+'px'};el.onpointerup=()=>dragging=false}

// AVATAR
games.avatar=()=>{openModal('🧑‍🎤 Character Creator','Cipta watak kegemaran');let build={...state.avatarBuild};body.innerHTML=`<div class="avatar-display" id="avDisplay"></div><div class="game-panel"><b>Muka</b><div class="choice-grid" data-kind="face">${['🙂','😎','🤓','😁','🥳'].map(x=>`<button class="choice">${x}</button>`).join('')}</div><b>Gaya</b><div class="choice-grid" data-kind="hair">${['🧢','👑','🎓','⛑️','🎩'].map(x=>`<button class="choice">${x}</button>`).join('')}</div><b>Item</b><div class="choice-grid" data-kind="item">${['⭐','⚽','🎸','📚','🪄'].map(x=>`<button class="choice">${x}</button>`).join('')}</div><button class="btn" id="saveAvatar" style="margin-top:12px">Simpan Watak</button></div>`;const render=()=>$('#avDisplay').textContent=`${build.hair}${build.face}${build.item}`;render();$$('[data-kind]').forEach(g=>$$('.choice',g));$$('[data-kind] .choice').forEach(b=>b.onclick=()=>{build[b.parentElement.dataset.kind]=b.textContent;render()});$('#saveAvatar').onclick=()=>{state.avatarBuild=build;save();addStars(4,'Watak disimpan')}};

// MUSIC
games.music=()=>{openModal('🎹 Music Pad','Tap pad dan cipta beat');const notes=[['Kick',110],['Snare',180],['Clap',260],['Bell',440],['Do',261],['Re',293],['Mi',329],['Sol',392]];body.innerHTML=`<div class="music-grid">${notes.map((n,i)=>`<button class="music-pad" data-note="${i}">${['🥁','💥','👏','🔔','🎵','🎶','🎼','✨'][i]}<br>${n[0]}</button>`).join('')}</div><div class="center" style="margin-top:15px"><button class="btn" id="musicDone">Simpan Session ⭐</button></div>`;$$('[data-note]').forEach(b=>b.onclick=()=>tone(notes[+b.dataset.note][1],.22));$('#musicDone').onclick=()=>addStars(4,'Music session')};

// STORY
games.story=()=>{openModal('📖 Story Maker','Cipta cerita sendiri');body.innerHTML=`<div class="story-fields"><input id="stTitle" placeholder="Tajuk cerita"><input id="stHero" placeholder="Nama watak utama"><select id="stPlace"><option>di hutan ajaib</option><option>di angkasa lepas</option><option>di bawah laut</option><option>di bandar robot</option></select><textarea id="stText" placeholder="Sambung cerita di sini..."></textarea><div class="game-row"><button class="btn secondary" id="storyMagic">✨ Idea</button><button class="btn" id="storySave">Simpan Cerita</button></div></div><div id="storyPreview"></div>`;$('#storyMagic').onclick=()=>{const h=$('#stHero').value||'Mika',p=$('#stPlace').value;$('#stText').value=`Pada suatu pagi, ${h} terjumpa sebuah pintu kecil ${p}. Bila pintu itu dibuka, satu cahaya biru keluar dan...`};$('#storySave').onclick=()=>{const title=$('#stTitle').value||'Cerita Saya',hero=$('#stHero').value||'Kawan',place=$('#stPlace').value,text=$('#stText').value;const full=`${title}\n\n${hero} ${place}.\n\n${text}`;state.stories.unshift({title,full,date:Date.now()});state.stories=state.stories.slice(0,20);save();$('#storyPreview').innerHTML=`<div class="story-preview">${esc(full).replace(/\n/g,'<br>')}</div>`;addStars(7,'Cerita disimpan')}};

// BLOCK CODING
games.coding=()=>{openModal('🧱 Block Coding','Bawa 🤖 ke ⭐');let robot=[4,0],dir=0,prog=[],goal=[0,5],rocks=new Set(['3,2','2,2','1,4']);body.innerHTML=`<div class="code-stage" id="codeStage"></div><div class="game-row" style="margin:12px 0"><button class="code-block" data-c="F">↑ Move</button><button class="code-block" data-c="L">↺ Left</button><button class="code-block" data-c="R">↻ Right</button></div><div class="code-program" id="program"></div><div class="game-row"><button class="btn" id="runCode">▶ Run</button><button class="btn secondary" id="clearCode">Clear</button></div>`;const render=()=>{$('#codeStage').innerHTML='';for(let r=0;r<5;r++)for(let c=0;c<6;c++){const d=document.createElement('div');d.className='code-cell';if(r===robot[0]&&c===robot[1])d.textContent=['🤖→','🤖↓','🤖←','🤖↑'][dir];else if(r===goal[0]&&c===goal[1])d.textContent='⭐';else if(rocks.has(`${r},${c}`))d.textContent='🪨';$('#codeStage').append(d)}};const renderP=()=>$('#program').innerHTML=prog.map(x=>`<span class="code-block">${x==='F'?'↑':x==='L'?'↺':'↻'}</span>`).join('');render();$$('[data-c]').forEach(b=>b.onclick=()=>{if(prog.length<16){prog.push(b.dataset.c);renderP()}});$('#clearCode').onclick=()=>{prog=[];renderP()};$('#runCode').onclick=async()=>{robot=[4,0];dir=0;render();for(const cmd of prog){await wait(300);if(cmd==='L')dir=(dir+3)%4;else if(cmd==='R')dir=(dir+1)%4;else{const ds=[[0,1],[1,0],[0,-1],[-1,0]],n=[robot[0]+ds[dir][0],robot[1]+ds[dir][1]];if(n[0]>=0&&n[0]<5&&n[1]>=0&&n[1]<6&&!rocks.has(`${n[0]},${n[1]}`))robot=n}render();if(robot[0]===goal[0]&&robot[1]===goal[1]){addStars(12,'Coding solved');break}}}}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}

// RACING
games.race=()=>{openModal('🏎️ Racing Challenge','Pilih lane jawapan yang betul');let lane=1,score=0,round=0,answer=0,vals=[];body.innerHTML=`<div class="game-row space"><b id="raceQ">Soalan</b><b>Score: <span id="raceScore">0</span></b></div><div class="race" id="race"><div class="lane"></div><div class="lane"></div><div class="lane"></div><div class="car" id="car">🏎️</div></div><div class="game-row" style="justify-content:center;margin-top:10px"><button class="btn secondary" data-lane="0">← Kiri</button><button class="btn secondary" data-lane="1">Tengah</button><button class="btn secondary" data-lane="2">Kanan →</button></div>`;const car=$('#car'),race=$('#race');const placeCar=()=>car.style.left=((lane+.5)/3*100)+'%';placeCar();const newQ=()=>{const a=1+Math.floor(Math.random()*9),b=1+Math.floor(Math.random()*9);answer=a+b;vals=[answer,answer+(Math.random()>.5?1:-1),answer+(Math.random()>.5?2:-2)].sort(()=>Math.random()-.5);$('#raceQ').textContent=`${a} + ${b} = ?`;$$('.answer-gate').forEach(x=>x.remove());vals.forEach((v,i)=>{const d=document.createElement('div');d.className='answer-gate';d.style.left=(i*33.333+1.7)+'%';d.textContent=v;race.append(d)})};newQ();$$('[data-lane]').forEach(b=>b.onclick=()=>{lane=+b.dataset.lane;placeCar();round++;if(vals[lane]===answer){score++;addStars(2,'Jawapan betul')}else toast('Oops! Cuba soalan seterusnya');$('#raceScore').textContent=score;if(round>=10){addStars(score,'Race finish');toast(`Finish! ${score}/10`);round=0;score=0}newQ()})};

// FRUIT MERGE - lightweight physics-like stacking
games.merge=()=>{openModal('🍉 Fruit Merge','Drop & gabung buah yang sama');const fruits=[['🍒',38],['🍓',48],['🍊',60],['🍎',74],['🍐',88],['🍑',104],['🍍',120],['🍈',138],['🍉',158]];let balls=[],next=0,score=0,x=.5;body.innerHTML=`<div class="game-row space"><b>Score: <span id="mergeScore">0</span></b><span>NEXT: <b id="mergeNext"></b></span></div><div class="drop-line"><input id="dropX" type="range" min="5" max="95" value="50" style="width:70%"><button class="btn" id="dropFruit">DROP</button></div><div class="merge-board" id="mergeBoard"></div>`;const board=$('#mergeBoard'),rng=$('#dropX');const updateNext=()=>$('#mergeNext').textContent=fruits[next][0];next=Math.floor(Math.random()*3);updateNext();const render=()=>{board.innerHTML=balls.map((b,i)=>`<div class="fruit-ball" style="width:${fruits[b.lv][1]}px;height:${fruits[b.lv][1]}px;left:calc(${b.x}% - ${fruits[b.lv][1]/2}px);bottom:${b.y}px;font-size:${fruits[b.lv][1]*.58}px" data-b="${i}">${fruits[b.lv][0]}</div>`).join('')};const settle=()=>{balls.sort((a,b)=>a.x-b.x);for(let i=0;i<balls.length;i++){let b=balls[i],rad=fruits[b.lv][1]/2;b.y=0;for(let j=0;j<i;j++){let o=balls[j],rr=(fruits[o.lv][1]+fruits[b.lv][1])/2,dx=(b.x-o.x)/100*board.clientWidth;if(Math.abs(dx)<rr){const dy=Math.sqrt(Math.max(0,rr*rr-dx*dx));b.y=Math.max(b.y,o.y+dy)}}}let merged=true;while(merged){merged=false;outer:for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){let a=balls[i],b=balls[j];if(a.lv!==b.lv||a.lv>=fruits.length-1)continue;const dx=(a.x-b.x)/100*board.clientWidth,dy=a.y-b.y,rr=(fruits[a.lv][1]+fruits[b.lv][1])/2;if(Math.hypot(dx,dy)<rr*.78){balls.splice(j,1);balls.splice(i,1,{lv:a.lv+1,x:(a.x+b.x)/2,y:Math.min(a.y,b.y)});score+=(a.lv+1)*10;$('#mergeScore').textContent=score;addStars(1,'Merge');merged=true;break outer}}if(merged)settle()}render()};$('#dropFruit').onclick=()=>{balls.push({lv:next,x:+rng.value,y:430});next=Math.floor(Math.random()*3);updateNext();render();setTimeout(()=>{settle();if(balls.some(b=>b.y+fruits[b.lv][1]>470)){toast(`Game over • Score ${score}`);if(score>30)addStars(5,'Fruit Merge');balls=[];score=0;$('#mergeScore').textContent=0;render()}},180)}};

function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

// Service worker
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}))}
renderHeader();renderActivities();
