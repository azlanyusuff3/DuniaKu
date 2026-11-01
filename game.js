// Momo Maze — game loop, input, UI.
(function () {
  'use strict';
  const VERSION = '1.1.0';
  window.MAZE_VERSION = VERSION;
  const M = window.MazeLevels, A = window.MazeArt;
  const $ = id => document.getElementById(id);
  const cv = $('cv'), cx = cv.getContext('2d');
  const SPEED = 7.5;            // tiles per second
  const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // down, up, right, left
  const WORLD_EMOJI = ['🌷', '🌲', '🕯️', '❄️', '🏰'];

  // ---------- save ----------
  const SKEY = 'momomaze-v1';
  let save = { unlocked: 1, stars: {}, best: {}, dpad: false, sound: true };
  try { Object.assign(save, JSON.parse(localStorage.getItem(SKEY) || '{}')); } catch (e) {}
  const store = () => { try { localStorage.setItem(SKEY, JSON.stringify(save)); } catch (e) {} };

  // ---------- audio ----------
  let ac = null;
  function beep(f, d = 0.08, type = 'square', v = 0.05, slide = 0) {
    if (!save.sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
      o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + d);
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.02);
    } catch (e) {}
  }
  const sfx = {
    star: () => { beep(880, .08, 'triangle', .07); setTimeout(() => beep(1320, .12, 'triangle', .07), 70); },
    key: () => { beep(660, .1, 'square', .04); setTimeout(() => beep(990, .15, 'square', .04), 90); },
    door: () => beep(220, .25, 'sawtooth', .04, 2),
    hurt: () => beep(300, .3, 'sawtooth', .06, .3),
    torch: () => beep(500, .3, 'triangle', .05, 2),
    win: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, .18, 'triangle', .07), i * 110)),
    step: () => beep(140, .03, 'triangle', .015),
  };

  // ---------- canvas sizing ----------
  let VW = 0, VH = 0, DPR = 1;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    VW = innerWidth; VH = innerHeight;
    cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR);
  }
  addEventListener('resize', resize); resize();

  // ---------- game state ----------
  let G = null; // current level runtime
  let screen = 'title', paused = false, time = 0;

  function startLevel(L) {
    const g = M.generate(L);
    G = {
      g, L, world: g.worldId, t: 0, hearts: 3, hurtCount: 0,
      p: { x: g.start.x, y: g.start.y, fx: g.start.x, fy: g.start.y, dir: 0, moving: false, tx: 0, ty: 0, prog: 0, frame: 0, walkT: 0 },
      want: null, hold: null, keys: new Set(), open: new Set(),
      coins: g.coins.map(c => ({ ...c, got: false })), keyItems: g.keys.map(k => ({ ...k, got: false })),
      torches: g.torches.map(c => ({ ...c, got: false })), light: g.dark,
      invuln: 0, done: false, fx: [], cam: { x: g.start.x, y: g.start.y }, pose: null, poseT: 0,
    };
    paused = false;
    show('play');
    updateHud();
    const p = g.params;
    if (p.k === 0) toast(`${WORLD_EMOJI[p.world]} ${M.WORLDS[p.world].name}<br><small>${M.WORLDS[p.world].desc}</small>`, 2600);
    else if (L === 1) toast('Swipe untuk gerak 👆<br><small>Kutip ⭐ dan cari rumah Momo</small>', 2600);
  }

  const tileAt = (x, y) => (x < 0 || y < 0 || x >= G.g.W || y >= G.g.H) ? 1 : G.g.tile[y * G.g.W + x];
  const doorAt = (x, y) => G.g.doors.find(d => d.x === x && d.y === y && !G.open.has(d.x + ',' + d.y));
  function passable(x, y) {
    if (tileAt(x, y)) return false;
    const d = doorAt(x, y);
    if (d) {
      if (G.keys.has(d.color)) { G.open.add(d.x + ',' + d.y); sfx.door(); burst(d.x, d.y, A.KC[d.color], 14); updateHud(); return true; }
      return false;
    }
    return true;
  }
  const openish = (x, y) => !tileAt(x, y); // doors count as corridor for junction logic
  function exits(x, y) { let n = 0; for (const [dx, dy] of DIRS) if (openish(x + dx, y + dy)) n++; return n; }

  function tryStep(dir) {
    const p = G.p, [dx, dy] = DIRS[dir];
    if (!passable(p.x + dx, p.y + dy)) {
      const d = doorAt(p.x + dx, p.y + dy);
      if (d && !G.lockedHint) { G.lockedHint = 1; toast(`Perlukan kunci ${({ red: 'merah', blue: 'biru', green: 'hijau' })[d.color]} 🔑`, 1500); beep(150, .15); }
      return false;
    }
    p.dir = dir; p.moving = true; p.tx = p.x + dx; p.ty = p.y + dy; p.prog = 0; G.lockedHint = 0;
    return true;
  }

  function decide() {
    const p = G.p;
    if (G.want != null) { const w = G.want; if (tryStep(w)) { G.want = null; return; } }
    if (G.hold != null && tryStep(G.hold)) return;
    if (p.lastDir == null) return;
    const back = p.lastDir ^ 1;
    // corridor follow: continue straight, or auto-turn when there is exactly one way on
    const opts = [];
    for (let d = 0; d < 4; d++) if (d !== back && openish(p.x + DIRS[d][0], p.y + DIRS[d][1])) opts.push(d);
    if (opts.length === 1) { if (!tryStep(opts[0])) p.lastDir = null; return; }
    p.lastDir = null; // junction or dead end: stop and let the player choose
  }

  function arrive() {
    const p = G.p; p.x = p.tx; p.y = p.ty; p.moving = false; p.lastDir = p.dir;
    for (const c of G.coins) if (!c.got && c.x === p.x && c.y === p.y) { c.got = true; sfx.star(); burst(c.x, c.y, '#ffd23f', 12); updateHud(); }
    for (const k of G.keyItems) if (!k.got && k.x === p.x && k.y === p.y) { k.got = true; G.keys.add(k.color); sfx.key(); burst(k.x, k.y, A.KC[k.color], 12); updateHud(); toast('Dapat kunci! 🔑', 1000); }
    for (const t of G.torches) if (!t.got && t.x === p.x && t.y === p.y) { t.got = true; G.light += 1.6; sfx.torch(); burst(t.x, t.y, '#ffb02e', 16); toast('Obor! Lebih terang 🔥', 1000); }
    if (p.x === G.g.exit.x && p.y === G.g.exit.y) return win();
    decide();
  }

  function hurt() {
    if (G.invuln > 0 || G.done) return;
    G.hearts--; G.hurtCount++; G.invuln = 1.6; G.pose = 'hurt'; G.poseT = .7; sfx.hurt();
    G.p.moving = false; G.p.lastDir = null; G.want = null;
    try { navigator.vibrate && navigator.vibrate(120); } catch (e) {}
    burst(G.p.fx, G.p.fy, '#ffffff', 16); G.shake = .35;
    updateHud();
    if (G.hearts <= 0) { G.done = true; setTimeout(lose, 700); return; }
    setTimeout(() => {
      if (!G || G.done) return;
      const p = G.p; Object.assign(p, { x: G.g.start.x, y: G.g.start.y, fx: G.g.start.x, fy: G.g.start.y, moving: false, lastDir: null });
      G.want = null; burst(p.x, p.y, '#bde0ff', 14);
    }, 450);
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) { const a = Math.random() * 7, s = 1.5 + Math.random() * 3; G.fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: .6 + Math.random() * .3, color }); }
  }

  function enemyPos(e, t) {
    const n = e.route.length - 1, L = n * 2, s = ((e.phase + t * G.g.enemySpeed) % L + L) % L;
    const u = s <= n ? s : L - s, i = Math.min(Math.floor(u), n - 1), f = u - i;
    const a = e.route[i], b = e.route[i + 1];
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, flip: (s <= n) === (b.x < a.x), frame: Math.floor(t * 4) % 2 };
  }
  const spikeOn = (s, t) => ((t / 2.4 + s.phase) % 1) < 0.5;

  function update(dt) {
    if (screen !== 'play' || paused || !G) return;
    G.t += dt;
    if (!G.done) {
      const p = G.p;
      if (!p.moving && G.pose !== 'hurt') decide();
      if (p.moving) {
        p.prog += dt * SPEED;
        p.walkT += dt;
        if (p.prog >= 1) { const over = Math.min(p.prog - 1, .99); p.fx = p.tx; p.fy = p.ty; arrive(); if (p.moving) p.prog = over; }
        if (p.moving) { p.fx = p.x + (p.tx - p.x) * p.prog; p.fy = p.y + (p.ty - p.y) * p.prog; }
        p.frame = Math.floor(p.walkT * 8) % 2;
      } else p.frame = 0;
      if (G.invuln > 0) G.invuln -= dt;
      if (G.poseT > 0 && (G.poseT -= dt) <= 0) G.pose = null;
      // hazards
      for (const e of G.g.enemies) { const q = enemyPos(e, G.t); if (Math.hypot(q.x - p.fx, q.y - p.fy) < .62) hurt(); }
      for (const s of G.g.spikes) if (spikeOn(s, G.t) && Math.hypot(s.x - p.fx, s.y - p.fy) < .5) hurt();
      $('hTime').textContent = fmt(G.t);
    }
    for (const f of G.fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 6 * dt; f.life -= dt; }
    G.fx = G.fx.filter(f => f.life > 0);
    if (G.shake) G.shake = Math.max(0, G.shake - dt);
    const k = 1 - Math.pow(0.0015, dt);
    G.cam.x += (G.p.fx - G.cam.x) * k; G.cam.y += (G.p.fy - G.cam.y) * k;
  }

  // ---------- render ----------
  let darkCv = null;
  function render() {
    const W = cv.width, H = cv.height;
    cx.setTransform(1, 0, 0, 1, 0, 0);
    if (screen !== 'play' || !G) { cx.clearRect(0, 0, W, H); return; }
    const g = G.g, wid = G.world, P = A.PAL[wid];
    cx.fillStyle = P.bg; cx.fillRect(0, 0, W, H);
    const S = Math.floor(Math.min(W / 8.5, H / 13));
    // camera: follow player, clamp to maze bounds (center if maze is smaller)
    const viewW = W / S, viewH = H / S;
    let camX = g.W <= viewW ? g.W / 2 - .5 : Math.max(viewW / 2 - .5, Math.min(g.W - viewW / 2 - .5, G.cam.x));
    let camY = g.H <= viewH - 1 ? g.H / 2 - .5 : Math.max(viewH / 2 - 1.2, Math.min(g.H - viewH / 2 + .2, G.cam.y));
    let ox = W / 2 - (camX + .5) * S, oy = H / 2 - (camY + .5) * S;
    if (G.shake) { ox += (Math.random() - .5) * S * .3 * G.shake * 3; oy += (Math.random() - .5) * S * .3 * G.shake * 3; }
    ox = Math.round(ox); oy = Math.round(oy);
    const x0 = Math.max(0, Math.floor(-ox / S) - 1), x1 = Math.min(g.W - 1, Math.ceil((W - ox) / S) + 1);
    const y0 = Math.max(0, Math.floor(-oy / S) - 1), y1 = Math.min(g.H - 1, Math.ceil((H - oy) / S) + 2);
    const t = G.t, sx = x => ox + x * S, sy = y => oy + y * S;
    // floors
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!g.tile[y * g.W + x]) A.floor(cx, wid, sx(x), sy(y), S, g.deco[y * g.W + x]);
    // floor items
    for (const s of g.spikes) A.spike(cx, sx(s.x) + S / 2, sy(s.y) + S / 2, S, spikeOn(s, t));
    A.exit(cx, sx(g.exit.x) + S / 2, sy(g.exit.y) + S / 2, S, t);
    // y-sorted pass: walls, doors, items, actors
    const rows = [];
    for (let y = y0; y <= y1; y++) rows[y] = [];
    const push = (y, fn) => { const r = Math.max(y0, Math.min(y1, Math.round(y))); rows[r].push(fn); };
    for (const c of G.coins) if (!c.got) push(c.y, () => A.star(cx, sx(c.x) + S / 2, sy(c.y) + S / 2, S, t));
    for (const k of G.keyItems) if (!k.got) push(k.y, () => A.key(cx, sx(k.x) + S / 2, sy(k.y) + S / 2, S, k.color, t));
    for (const o of G.torches) if (!o.got) push(o.y, () => A.torch(cx, sx(o.x) + S / 2, sy(o.y) + S / 2, S, t));
    for (const e of g.enemies) { const q = enemyPos(e, t); push(q.y + .01, () => A.enemy(cx, wid === 'istana' ? 'ghost' : 'snow', sx(q.x) + S / 2, sy(q.y) + S * .85, S, q.frame, q.flip)); }
    const p = G.p;
    push(p.fy + .02, () => {
      if (G.invuln > 0 && Math.floor(G.t * 12) % 2) return;
      A.hero(cx, sx(p.fx) + S / 2, sy(p.fy) + S * .88, S, p.dir, p.moving ? p.frame : 0, G.pose);
    });
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) if (g.tile[y * g.W + x]) A.wall(cx, wid, sx(x), sy(y), S, g.deco[y * g.W + x]);
      for (const d of g.doors) if (d.y === y && !G.open.has(d.x + ',' + d.y)) A.door(cx, sx(d.x) + S / 2, sy(d.y) + S / 2, S, d.color);
      for (const fn of rows[y]) fn();
    }
    for (const f of G.fx) { cx.globalAlpha = Math.max(0, f.life); cx.fillStyle = f.color; cx.beginPath(); cx.arc(sx(f.x) + S / 2, sy(f.y) + S / 2, S * .08, 0, 7); cx.fill(); }
    cx.globalAlpha = 1;
    // darkness
    if (G.light) {
      if (!darkCv || darkCv.width !== W || darkCv.height !== H) { darkCv = document.createElement('canvas'); darkCv.width = W; darkCv.height = H; }
      const d = darkCv.getContext('2d');
      d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, W, H); d.fillStyle = 'rgba(6,4,14,.93)'; d.fillRect(0, 0, W, H);
      d.globalCompositeOperation = 'destination-out';
      const hole = (x, y, r) => { const gr = d.createRadialGradient(x, y, r * .25, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = gr; d.beginPath(); d.arc(x, y, r, 0, 7); d.fill(); };
      hole(sx(p.fx) + S / 2, sy(p.fy) + S / 2, S * (G.light + Math.sin(t * 9) * .08));
      hole(sx(g.exit.x) + S / 2, sy(g.exit.y) + S / 2, S * 1.1);
      for (const o of G.torches) if (!o.got) hole(sx(o.x) + S / 2, sy(o.y) + S / 2, S * .8);
      cx.drawImage(darkCv, 0, 0);
    }
  }

  // ---------- input ----------
  let touch = null;
  cv.addEventListener('pointerdown', e => { if (screen !== 'play') return; touch = { x: e.clientX, y: e.clientY, used: false }; });
  cv.addEventListener('pointermove', e => {
    if (!touch || !G) return;
    const dx = e.clientX - touch.x, dy = e.clientY - touch.y;
    if (Math.hypot(dx, dy) > 22) {
      const d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 3) : (dy > 0 ? 0 : 1);
      setWant(d); touch = { x: e.clientX, y: e.clientY, used: true };
    }
  });
  addEventListener('pointerup', () => { touch = null; });
  function setWant(d) {
    if (!G || G.done || paused) return;
    G.want = d;
    if (G.p.moving && d === (G.p.dir ^ 1)) { // instant reverse
      const p = G.p; [p.x, p.tx] = [p.tx, p.x]; [p.y, p.ty] = [p.ty, p.y]; p.prog = 1 - p.prog; p.dir = d; G.want = null;
    }
  }
  const KEYMAP = { ArrowDown: 0, s: 0, ArrowUp: 1, w: 1, ArrowRight: 2, d: 2, ArrowLeft: 3, a: 3 };
  addEventListener('keydown', e => {
    if (e.key === 'Escape' || e.key === 'p') { if (screen === 'play') togglePause(); return; }
    const d = KEYMAP[e.key]; if (d == null || screen !== 'play') return;
    e.preventDefault(); if (!e.repeat) setWant(d); if (G) G.hold = d;
  });
  addEventListener('keyup', e => { const d = KEYMAP[e.key]; if (G && d === G.hold) G.hold = null; });
  document.querySelectorAll('#dpad button').forEach(b => {
    const d = +b.dataset.d;
    b.addEventListener('pointerdown', e => { e.preventDefault(); setWant(d); if (G) G.hold = d; });
    b.addEventListener('pointerup', () => { if (G && G.hold === d) G.hold = null; });
    b.addEventListener('pointerleave', () => { if (G && G.hold === d) G.hold = null; });
  });

  // ---------- UI ----------
  function show(s) {
    screen = s;
    $('title').classList.toggle('show', s === 'title');
    $('map').classList.toggle('show', s === 'map');
    $('hud').classList.toggle('show', s === 'play');
    $('dpad').classList.toggle('show', s === 'play' && save.dpad);
    if (s !== 'play') $('modal').classList.remove('show');
  }
  const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  function updateHud() {
    if (!G) return;
    $('hLv').textContent = 'Lv ' + G.L;
    $('hHearts').textContent = '❤️'.repeat(Math.max(0, G.hearts)) + '🤍'.repeat(3 - Math.max(0, G.hearts));
    $('hStars').textContent = `⭐ ${G.coins.filter(c => c.got).length}/3`;
    const col = { red: '🟥', blue: '🟦', green: '🟩' };
    $('hKeys').textContent = [...G.keys].map(k => '🔑' + col[k]).join(' ');
  }
  let toastT = 0;
  function toast(html, ms = 1400) { const el = $('toast'); el.innerHTML = html; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), ms); }

  function modal(title, starsN, text, btns) {
    $('mTitle').textContent = title;
    $('mStars').innerHTML = starsN == null ? '' : [0, 1, 2].map(i => `<i class="${i < starsN ? '' : 'off'}" style="animation-delay:${.2 + i * .25}s">⭐</i>`).join('');
    $('mText').innerHTML = text;
    const box = $('mBtns'); box.innerHTML = '';
    for (const [label, fn, alt] of btns) { const b = document.createElement('button'); b.textContent = label; if (alt) b.className = 'alt'; b.onclick = fn; box.appendChild(b); }
    $('modal').classList.add('show');
  }
  const closeModal = () => $('modal').classList.remove('show');

  function win() {
    G.done = true; G.pose = 'happy'; G.poseT = 99; sfx.win();
    burst(G.p.x, G.p.y, '#ffd23f', 30);
    const n = G.coins.filter(c => c.got).length, L = G.L;
    const prevBest = save.best[L];
    save.stars[L] = Math.max(save.stars[L] || 0, n);
    if (!prevBest || G.t < prevBest) save.best[L] = +G.t.toFixed(1);
    if (L >= save.unlocked && L < M.TOTAL) save.unlocked = L + 1;
    store();
    const msg = [`Masa: <b>${fmt(G.t)}</b>${prevBest && G.t < prevBest ? ' 🏆 rekod baru!' : ''}`];
    if (n < 3) msg.push(`Ada ${3 - n} ⭐ tertinggal. Cuba lagi?`);
    if (!G.hurtCount) msg.push('Tak kena langsung! 💪');
    setTimeout(() => modal(L === M.TOTAL ? 'Tamat! 🎉' : 'Jumpa Jalan! 🏡', n, msg.join('<br>'), [
      ...(L < M.TOTAL ? [['Level Seterusnya ›', () => { closeModal(); startLevel(L + 1); }]] : []),
      ['Main Semula', () => { closeModal(); startLevel(L); }, true],
      ['Peta', () => openMap(G.g.world), true],
    ]), 650);
  }
  function lose() {
    modal('Alamak! 😿', null, 'Momo kehabisan nyawa.', [
      ['Cuba Lagi', () => { closeModal(); startLevel(G.L); }],
      ['Peta', () => openMap(G.g.world), true],
    ]);
  }
  function togglePause() {
    if (!G || G.done) return;
    paused = !paused;
    if (!paused) return closeModal();
    modal('Rehat', null, `Level ${G.L} · ${M.WORLDS[G.g.world].name}`, [
      ['Sambung', togglePause],
      ['Mula Semula', () => { closeModal(); startLevel(G.L); }, true],
      [`D-pad: ${save.dpad ? 'ON' : 'OFF'}`, () => { save.dpad = !save.dpad; store(); $('dpad').classList.toggle('show', save.dpad); paused = false; togglePause(); togglePause(); }, true],
      [`Bunyi: ${save.sound ? 'ON' : 'OFF'}`, () => { save.sound = !save.sound; store(); paused = false; togglePause(); togglePause(); }, true],
      ['Peta', () => openMap(G.g.world), true],
    ]);
  }
  $('btnPause').onclick = togglePause;

  let mapWorld = 0;
  function openMap(w) {
    mapWorld = w == null ? Math.min(M.WORLDS.length - 1, Math.floor((save.unlocked - 1) / M.PER_WORLD)) : w;
    paused = false; show('map'); drawMap();
  }
  function drawMap() {
    const W = M.WORLDS[mapWorld];
    $('worldName').textContent = W.name; $('worldDesc').textContent = W.desc;
    $('totStars').textContent = '⭐ ' + Object.values(save.stars).reduce((a, b) => a + b, 0);
    const tabs = $('worldTabs'); tabs.innerHTML = '';
    M.WORLDS.forEach((w, i) => {
      const b = document.createElement('button'), locked = save.unlocked < i * M.PER_WORLD + 1;
      b.className = (i === mapWorld ? 'on ' : '') + (locked ? 'lock' : '');
      const art = A.get('worlds', locked ? 5 : i);
      if (art) b.appendChild(art.cloneNode ? copyCanvas(art) : art); else b.textContent = locked ? '🔒' : WORLD_EMOJI[i];
      b.onclick = () => { if (!locked) { mapWorld = i; drawMap(); } else toast('Habiskan dunia sebelum ni dulu 🔒'); };
      tabs.appendChild(b);
    });
    const grid = $('grid'); grid.innerHTML = '';
    for (let i = 1; i <= M.PER_WORLD; i++) {
      const L = mapWorld * M.PER_WORLD + i, b = document.createElement('button'), st = save.stars[L];
      if (L > save.unlocked) { b.className = 'lock'; b.innerHTML = '🔒'; }
      else {
        if (L === save.unlocked && st == null) b.className = 'next';
        b.innerHTML = `${L}<small>${st == null ? '' : '★'.repeat(st) + '☆'.repeat(3 - st)}</small>`;
        b.onclick = () => startLevel(L);
      }
      grid.appendChild(b);
    }
  }
  function copyCanvas(c) { const o = document.createElement('canvas'); o.width = c.width; o.height = c.height; o.getContext('2d').drawImage(c, 0, 0); return o; }
  $('mapBack').onclick = () => { show('title'); refreshTitle(); };
  $('btnPlay').onclick = () => { beep(600, .05); openMap(); };
  $('btnContinue').onclick = () => startLevel(save.unlocked);
  function refreshTitle() { $('contLv').textContent = save.unlocked; $('btnContinue').style.display = save.unlocked > 1 ? '' : 'none'; }
  $('ver').textContent = 'v' + VERSION;
  refreshTitle();

  // ---------- loop ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; time += dt;
    update(dt); render();
    requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && screen === 'play' && !paused && G && !G.done) togglePause(); });
  A.load().then(n => { console.log('sheets loaded:', n.join(',') || 'none (placeholder art)'); if (screen === 'map') drawMap(); });
  requestAnimationFrame(frame);

  // ---------- PWA ----------
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(r => r.update()).catch(() => {});
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded && screen !== 'play') { reloaded = true; location.reload(); } });
  }
  // test hooks
  window.__maze = { startLevel, get G() { return G; }, setWant, save, openMap };
})();
