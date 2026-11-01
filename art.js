// Momo Maze — art. Loads ChatGPT sprite sheets (magenta background, grid) at runtime.
// If a sheet is missing, a procedural placeholder is drawn so the game always works.
(function () {
  'use strict';
  const SHEETS = {
    hero_walk: [3, 2], hero_pose: [3, 1], items: [3, 2], keys: [3, 2], enemies: [2, 2], worlds: [3, 2],
    tiles_taman: [3, 2], tiles_hutan: [3, 2], tiles_gua: [3, 2], tiles_salji: [3, 2], tiles_istana: [3, 2],
  };
  const ART = {}; // name -> array of canvases (row-major)
  let titleBg = null;

  function keyAndSlice(img, cols, rows) {
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      const r = p[i], g = p[i + 1], b = p[i + 2];
      const m = Math.min(r, b) - g; // magenta-ness
      if (r > 120 && b > 120 && m > 60) p[i + 3] = 0;
      else if (r > 100 && b > 100 && m > 25) { p[i + 3] = Math.min(p[i + 3], 255 - (m - 25) * 6); p[i] = p[i + 2] = Math.min(r, b, g + 40); }
    }
    x.putImageData(d, 0, 0);
    const cw = c.width / cols, ch = c.height / rows, out = [];
    for (let ry = 0; ry < rows; ry++) for (let rx = 0; rx < cols; rx++) {
      const sx = Math.round(rx * cw), sy = Math.round(ry * ch), w = Math.round(cw), h = Math.round(ch);
      const cd = x.getImageData(sx, sy, w, h).data;
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (cd[(yy * w + xx) * 4 + 3] > 24) {
        if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy;
      }
      if (x1 < 0) { out.push(null); continue; }
      const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
      o.getContext('2d').drawImage(c, sx + x0, sy + y0, o.width, o.height, 0, 0, o.width, o.height);
      out.push(o);
    }
    return out;
  }

  function loadImg(src) {
    return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  }

  async function load() {
    await Promise.all(Object.entries(SHEETS).map(async ([n, [c, r]]) => {
      const img = await loadImg(`sprites/sheets/${n}.png?v=${window.MAZE_VERSION}`);
      if (img) try { ART[n] = keyAndSlice(img, c, r); } catch (e) { console.warn('sheet', n, e); }
    }));
    titleBg = await loadImg(`sprites/sheets/title_bg.png?v=${window.MAZE_VERSION}`);
    if (titleBg) document.documentElement.style.setProperty('--title-bg', `url("sprites/sheets/title_bg.png?v=${window.MAZE_VERSION}")`);
    return Object.keys(ART);
  }
  const get = (n, i) => (ART[n] && ART[n][i]) || null;

  // ---------- procedural placeholders ----------
  const PAL = {
    taman:  { f: ['#a6d873', '#9bcf68'], top: '#5fa040', front: '#3d7428', deco: '#ff8fb6', bg: '#2e5a24' },
    hutan:  { f: ['#d2b37f', '#c8a873'], top: '#3f8048', front: '#24502c', deco: '#8b5a2b', bg: '#1d3b22' },
    gua:    { f: ['#8d82a3', '#857a9b'], top: '#3f3652', front: '#241e31', deco: '#9be7ff', bg: '#16121f' },
    salji:  { f: ['#f2f8fd', '#e6eff8'], top: '#7fb2dc', front: '#4f7fae', deco: '#ffffff', bg: '#4d6f8f' },
    istana: { f: ['#d3c6e0', '#cabdd8'], top: '#5a4670', front: '#382a4a', deco: '#ffd36b', bg: '#1e1528' },
  };
  // tint over real floor art where it is too close in colour to the walls
  const FLOOR_TINT = { hutan: 'rgba(226,196,138,.5)', taman: null, salji: null };
  function rr(x, a, b, w, h, r) { x.beginPath(); x.roundRect ? x.roundRect(a, b, w, h, r) : x.rect(a, b, w, h); }

  function floor(x, wid, px, py, s, v) {
    const art = get('tiles_' + wid, v === 2 ? 2 : v);
    if (art) {
      x.fillStyle = PAL[wid].f[0]; x.fillRect(px, py, s + 0.5, s + 0.5); // fills any keyed-out holes
      x.drawImage(art, px, py, s + 0.5, s + 0.5);
      if (FLOOR_TINT[wid]) { x.fillStyle = FLOOR_TINT[wid]; x.fillRect(px, py, s + 0.5, s + 0.5); }
      return;
    }
    const P = PAL[wid]; x.fillStyle = P.f[v === 1 ? 1 : 0]; x.fillRect(px, py, s + 0.5, s + 0.5);
    if (v === 2) {
      x.fillStyle = P.deco; const r = s * 0.07;
      for (const [a, b] of [[0.3, 0.35], [0.62, 0.6], [0.4, 0.72]]) { x.beginPath(); x.arc(px + a * s, py + b * s, r, 0, 7); x.fill(); }
    }
  }
  function wall(x, wid, px, py, s, v) {
    const art = get('tiles_' + wid, v === 2 ? 5 : 3 + (v & 1));
    const lift = s * 0.32;
    if (art) { x.drawImage(art, px, py - lift, s + 0.5, s + lift + 0.5); return; }
    const P = PAL[wid];
    x.fillStyle = P.front; x.fillRect(px, py + s - lift, s + 0.5, lift);
    x.fillStyle = P.top; x.fillRect(px, py - lift, s + 0.5, s + 0.5);
    x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(px, py - lift, s + 0.5, s * 0.12);
    if (v === 2) { x.fillStyle = P.deco; x.globalAlpha = .6; x.beginPath(); x.arc(px + s * .5, py - lift + s * .45, s * .12, 0, 7); x.fill(); x.globalAlpha = 1; }
  }

  function hero(x, cx, by, s, dir, frame, pose) {
    // dir: 0 down,1 up,2 right,3 left ; pose: null|'happy'|'hurt'
    let art = null, flip = false;
    if (pose) art = get('hero_pose', pose === 'happy' ? 1 : pose === 'hurt' ? 2 : 0);
    else if (dir === 0) art = get('hero_walk', frame);
    else if (dir === 1) art = get('hero_walk', 2 + frame);
    else { art = get('hero_walk', 4 + frame); flip = dir === 3; }
    if (!art && !pose && dir === 0 && frame === 0) art = get('hero_pose', 0);
    if (art) return blit(x, art, cx, by, s * 1.35, flip);
    s *= 1.25; const b = frame ? -s * 0.05 : 0;
    x.save(); x.translate(cx, by + b);
    x.fillStyle = 'rgba(0,0,0,.18)'; x.beginPath(); x.ellipse(0, -b, s * .32, s * .1, 0, 0, 7); x.fill();
    if (dir === 1) { x.strokeStyle = '#e8892f'; x.lineWidth = s * .09; x.lineCap = 'round'; x.beginPath(); x.moveTo(0, -s * .25); x.quadraticCurveTo(s * .35, -s * .3, s * .3, -s * .6); x.stroke(); }
    x.fillStyle = '#ffa647'; x.beginPath(); x.ellipse(0, -s * .3, s * .28, s * .26, 0, 0, 7); x.fill();
    x.beginPath(); x.arc(0, -s * .72, s * .3, 0, 7); x.fill();
    for (const k of [-1, 1]) { x.beginPath(); x.moveTo(k * s * .28, -s * .8); x.lineTo(k * s * .2, -s * 1.08); x.lineTo(k * s * .05, -s * .92); x.fill(); }
    x.fillStyle = '#fff3e0'; x.beginPath(); x.ellipse(0, -s * .26, s * .15, s * .14, 0, 0, 7); x.fill();
    if (dir !== 1) {
      const ox = dir === 2 ? s * .08 : dir === 3 ? -s * .08 : 0;
      x.fillStyle = '#3a2416';
      if (pose === 'hurt') { x.lineWidth = s * .05; x.strokeStyle = '#3a2416'; for (const k of [-1, 1]) { x.beginPath(); x.moveTo(ox + k * s * .13 - s * .05, -s * .76); x.lineTo(ox + k * s * .13 + s * .05, -s * .68); x.moveTo(ox + k * s * .13 + s * .05, -s * .76); x.lineTo(ox + k * s * .13 - s * .05, -s * .68); x.stroke(); } }
      else for (const k of [-1, 1]) { x.beginPath(); x.ellipse(ox + k * s * .12, -s * .73, s * .05, pose === 'happy' ? s * .025 : s * .07, 0, 0, 7); x.fill(); }
      x.fillStyle = '#ff7a9a'; x.beginPath(); x.arc(ox, -s * .63, s * .035, 0, 7); x.fill();
    }
    x.fillStyle = '#3b8ed8'; rr(x, -s * .2, -s * .5, s * .4, s * .08, s * .04); x.fill(); // scarf
    x.restore();
  }

  function blit(x, art, cx, by, h, flip) {
    const w = h * art.width / art.height;
    if (flip) { x.save(); x.translate(cx, 0); x.scale(-1, 1); x.drawImage(art, -w / 2, by - h, w, h); x.restore(); }
    else x.drawImage(art, cx - w / 2, by - h, w, h);
  }

  function star(x, cx, cy, s, t) {
    const art = get('items', 0), bob = Math.sin(t * 3) * s * .06;
    if (art) return blit(x, art, cx, cy + s * .35 + bob, s * .75);
    x.save(); x.translate(cx, cy + bob); x.rotate(Math.sin(t * 2) * .15);
    x.fillStyle = '#ffd23f'; x.strokeStyle = '#e09a12'; x.lineWidth = s * .05; x.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? s * .14 : s * .32, a = -Math.PI / 2 + i * Math.PI / 5; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    x.closePath(); x.fill(); x.stroke(); x.fillStyle = 'rgba(255,255,255,.6)'; x.beginPath(); x.arc(-s * .08, -s * .1, s * .05, 0, 7); x.fill(); x.restore();
  }
  const KC = { red: '#ff5a5a', blue: '#4a8dff', green: '#3fcf6a' }, KI = { red: 0, blue: 1, green: 2 };
  function key(x, cx, cy, s, color, t) {
    const art = get('keys', KI[color]), bob = Math.sin(t * 3 + 1) * s * .06;
    if (art) return blit(x, art, cx, cy + s * .35 + bob, s * .7);
    x.save(); x.translate(cx, cy + bob); x.rotate(-.5); x.fillStyle = KC[color]; x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = s * .04;
    x.beginPath(); x.arc(-s * .15, 0, s * .15, 0, 7); x.fill(); x.stroke();
    x.fillRect(-s * .02, -s * .05, s * .36, s * .1); x.fillRect(s * .22, 0, s * .07, s * .14); x.fillRect(s * .1, 0, s * .06, s * .1);
    x.fillStyle = '#fff'; x.beginPath(); x.arc(-s * .15, 0, s * .06, 0, 7); x.fill(); x.restore();
  }
  function door(x, cx, cy, s, color) {
    const art = get('keys', 3 + KI[color]), lift = s * .32;
    if (art) return x.drawImage(art, cx - s / 2, cy - s / 2 - lift, s, s + lift);
    const px = cx - s / 2, py = cy - s / 2;
    x.fillStyle = '#5b3a1f'; x.fillRect(px, py + s - lift, s, lift);
    x.fillStyle = KC[color]; rr(x, px + s * .04, py - lift, s * .92, s, s * .12); x.fill();
    x.strokeStyle = 'rgba(0,0,0,.3)'; x.lineWidth = s * .05; x.stroke();
    x.fillStyle = '#2a1a10'; x.beginPath(); x.arc(cx, py - lift + s * .42, s * .1, 0, 7); x.fill(); x.fillRect(cx - s * .04, py - lift + s * .45, s * .08, s * .2);
  }
  function exit(x, cx, cy, s, t) {
    const art = get('items', 3);
    x.save(); x.globalAlpha = .5 + Math.sin(t * 3) * .2; x.fillStyle = '#fff6a8';
    x.beginPath(); x.arc(cx, cy, s * (.55 + Math.sin(t * 3) * .05), 0, 7); x.fill(); x.restore();
    if (art) return blit(x, art, cx, cy + s * .45, s * 1.15);
    x.fillStyle = '#c0533a'; x.beginPath(); x.moveTo(cx - s * .45, cy - s * .1); x.lineTo(cx, cy - s * .5); x.lineTo(cx + s * .45, cy - s * .1); x.fill();
    x.fillStyle = '#ffe9c2'; x.fillRect(cx - s * .33, cy - s * .12, s * .66, s * .5);
    x.fillStyle = '#7b4a2a'; rr(x, cx - s * .1, cy + s * .08, s * .2, s * .3, s * .05); x.fill();
  }
  function torch(x, cx, cy, s, t) {
    const art = get('items', 2);
    if (art) return blit(x, art, cx, cy + s * .38, s * .8);
    x.fillStyle = '#7b4a2a'; x.fillRect(cx - s * .05, cy - s * .05, s * .1, s * .38);
    x.fillStyle = '#ffb02e'; x.beginPath(); x.ellipse(cx, cy - s * .15, s * .13, s * .2 + Math.sin(t * 12) * s * .02, 0, 0, 7); x.fill();
    x.fillStyle = '#fff1a0'; x.beginPath(); x.ellipse(cx, cy - s * .1, s * .06, s * .1, 0, 0, 7); x.fill();
  }
  function spike(x, cx, cy, s, on) {
    const art = get('items', on ? 5 : 4);
    if (art) return x.drawImage(art, cx - s / 2, cy - s / 2, s, s);
    x.fillStyle = 'rgba(40,30,50,.45)'; rr(x, cx - s * .42, cy - s * .42, s * .84, s * .84, s * .1); x.fill();
    x.fillStyle = on ? '#e8e8f0' : '#6a6478';
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const ax = cx + (i - 1) * s * .26, ay = cy + (j - 1) * s * .26, h = on ? s * .2 : s * .05;
      x.beginPath(); x.moveTo(ax - s * .08, ay + s * .06); x.lineTo(ax, ay + s * .06 - h); x.lineTo(ax + s * .08, ay + s * .06); x.fill();
    }
  }
  function enemy(x, kind, cx, by, s, frame, flip) {
    const art = get('enemies', (kind === 'ghost' ? 2 : 0) + frame);
    if (art) return blit(x, art, cx, by, s * 1.15, flip);
    s *= 1.2; x.save(); x.translate(cx, by);
    if (kind === 'ghost') {
      x.globalAlpha = .85; x.fillStyle = '#c7b6ff'; x.beginPath(); x.arc(0, -s * .62, s * .32, Math.PI, 0);
      x.lineTo(s * .32, -s * .15); for (let i = 0; i < 4; i++) x.lineTo(s * (.32 - (i + .5) * .16), -s * (frame ^ (i & 1) ? .05 : .15)); x.lineTo(-s * .32, -s * .15); x.fill(); x.globalAlpha = 1;
    } else {
      x.fillStyle = 'rgba(0,0,0,.15)'; x.beginPath(); x.ellipse(0, 0, s * .3, s * .08, 0, 0, 7); x.fill();
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(0, -s * .25, s * .28, 0, 7); x.fill(); x.beginPath(); x.arc(0, -s * .65, s * .2 + frame * s * .02, 0, 7); x.fill();
      x.fillStyle = '#ff8a3d'; x.beginPath(); x.moveTo(0, -s * .64); x.lineTo(s * .18, -s * .6); x.lineTo(0, -s * .57); x.fill();
    }
    x.fillStyle = kind === 'ghost' ? '#3a1d5c' : '#24456b';
    for (const k of [-1, 1]) { x.beginPath(); x.ellipse(k * s * .09, -s * .7, s * .045, s * .06, 0, 0, 7); x.fill(); }
    x.restore();
  }
  function heart(x, cx, cy, s, full) {
    x.fillStyle = full ? '#ff4d6d' : 'rgba(255,255,255,.25)'; x.beginPath();
    x.moveTo(cx, cy + s * .35); x.bezierCurveTo(cx - s * .6, cy - s * .05, cx - s * .25, cy - s * .55, cx, cy - s * .2);
    x.bezierCurveTo(cx + s * .25, cy - s * .55, cx + s * .6, cy - s * .05, cx, cy + s * .35); x.fill();
  }

  window.MazeArt = { load, get, PAL, floor, wall, hero, star, key, door, exit, torch, spike, enemy, heart, KC, SHEETS };
})();
