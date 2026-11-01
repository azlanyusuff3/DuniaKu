// Momo Maze — level generator. Deterministic: same level number = same maze.
// Works in browser (window.MazeLevels) and Node (module.exports) for tests.
(function (root) {
  'use strict';

  const WORLDS = [
    { id: 'taman',  name: 'Taman Bunga',  desc: 'Cari jalan & kutip 3 bintang' },
    { id: 'hutan',  name: 'Hutan Kunci',  desc: 'Kunci warna buka pintu warna' },
    { id: 'gua',    name: 'Gua Gelap',    desc: 'Nampak dekat je. Kutip obor!' },
    { id: 'salji',  name: 'Lembah Salji', desc: 'Elak Snowbo yang meronda' },
    { id: 'istana', name: 'Istana Hantu', desc: 'Duri, hantu & gelap' },
  ];
  const PER_WORLD = 20, TOTAL = WORLDS.length * PER_WORLD;
  const KEY_COLORS = ['red', 'blue', 'green'];

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function params(L) {
    const w = Math.floor((L - 1) / PER_WORLD), k = (L - 1) % PER_WORLD;
    const cw = Math.min(5 + Math.floor((L - 1) / 6), 19);
    const p = { L, world: w, k, cw, ch: cw + 2 + Math.floor(cw / 4), coins: 3,
      doors: 0, enemies: 0, spikes: 0, dark: 0, torches: 0, enemySpeed: 2.0 };
    if (w === 1) p.doors = 1 + Math.floor(k / 7);
    if (w === 2) { p.dark = 3.2; p.torches = 2; p.doors = k < 8 ? 1 : 2; }
    if (w === 3) { p.enemies = 1 + Math.floor(k / 5); p.doors = k < 10 ? 0 : 1; p.enemySpeed = 2.0 + k * 0.04; }
    if (w === 4) {
      p.spikes = 2 + Math.floor(k / 4); p.enemies = 1 + Math.floor(k / 8); p.doors = 1 + Math.floor(k / 10);
      p.enemySpeed = 2.6; if (k >= 10) { p.dark = 3.6; p.torches = 2; }
    }
    return p;
  }

  function generate(L) {
    const p = params(L), R = rng(L * 9973 + 17);
    const CW = p.cw, CH = p.ch, W = CW * 2 + 1, H = CH * 2 + 1;
    const ci = (x, y) => y * CW + x;
    const tile = new Uint8Array(W * H).fill(1); // 1 wall, 0 floor
    const T = (x, y) => y * W + x;
    const adj = Array.from({ length: CW * CH }, () => []);
    // iterative recursive-backtracker
    const seen = new Uint8Array(CW * CH);
    const start = { x: 0, y: CH - 1 };
    const stack = [ci(start.x, start.y)]; seen[stack[0]] = 1;
    const D = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (stack.length) {
      const c = stack[stack.length - 1], cx = c % CW, cy = (c / CW) | 0;
      const opts = [];
      for (const [dx, dy] of D) {
        const nx = cx + dx, ny = cy + dy;
        if (nx >= 0 && ny >= 0 && nx < CW && ny < CH && !seen[ci(nx, ny)]) opts.push(ci(nx, ny));
      }
      if (!opts.length) { stack.pop(); continue; }
      const n = opts[(R() * opts.length) | 0];
      seen[n] = 1; adj[c].push(n); adj[n].push(c); stack.push(n);
    }
    for (let c = 0; c < CW * CH; c++) {
      const cx = c % CW, cy = (c / CW) | 0;
      tile[T(cx * 2 + 1, cy * 2 + 1)] = 0;
      for (const n of adj[c]) {
        const nx = n % CW, ny = (n / CW) | 0;
        tile[T(cx + nx + 1, cy + ny + 1)] = 0;
      }
    }
    const bfs = (from, blocked) => {
      const dist = new Int32Array(CW * CH).fill(-1), par = new Int32Array(CW * CH).fill(-1);
      const q = [from]; dist[from] = 0;
      for (let i = 0; i < q.length; i++) {
        const c = q[i];
        for (const n of adj[c]) {
          if (dist[n] >= 0 || (blocked && blocked(c, n))) continue;
          dist[n] = dist[c] + 1; par[n] = c; q.push(n);
        }
      }
      return { dist, par };
    };
    const s = ci(start.x, start.y);
    const b0 = bfs(s);
    let e = 0; for (let c = 0; c < CW * CH; c++) if (b0.dist[c] > b0.dist[e]) e = c;
    const path = []; for (let c = e; c >= 0; c = b0.par[c]) path.unshift(c);
    const onPath = new Uint8Array(CW * CH); path.forEach(c => onPath[c] = 1);
    const used = new Uint8Array(CW * CH); used[s] = used[e] = 1;
    const danger = new Uint8Array(CW * CH);
    const cellXY = c => ({ x: (c % CW) * 2 + 1, y: ((c / CW) | 0) * 2 + 1 });
    const edgeXY = (a, b) => { const A = cellXY(a), B = cellXY(b); return { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }; };

    // enemies: patrol from a junction on the path into a side branch and back
    const enemies = [];
    if (p.enemies) {
      const js = path.map((c, i) => ({ c, i })).filter(o => o.i > 3 && o.i < path.length - 2 &&
        adj[o.c].some(n => !onPath[n]));
      const picks = [];
      for (let t = 0; t < 200 && picks.length < p.enemies && js.length; t++) {
        const o = js[(R() * js.length) | 0];
        if (picks.some(q => Math.abs(q.i - o.i) < 4)) continue;
        picks.push(o);
      }
      for (const o of picks) {
        const side = adj[o.c].filter(n => !onPath[n] && !danger[n]);
        if (!side.length) continue;
        const first = side[(R() * side.length) | 0];
        let prev = o.c, cur = first;
        const route = [cellXY(o.c), edgeXY(o.c, cur), cellXY(cur)];
        for (let n = 0; n < 2; n++) {
          const nxt = adj[cur].filter(x => x !== prev);
          if (nxt.length !== 1) break;
          route.push(edgeXY(cur, nxt[0]), cellXY(nxt[0])); prev = cur; cur = nxt[0];
        }
        // mark whole side subtree as danger: no keys/coins in there
        const st = [first];
        const vis = new Set([o.c]);
        while (st.length) { const c = st.pop(); if (vis.has(c)) continue; vis.add(c); danger[c] = 1; for (const n of adj[c]) if (!vis.has(n)) st.push(n); }
        enemies.push({ route, phase: R() * (route.length - 1) * 2 });
      }
    }

    // doors on path edges, keys reachable before each door
    const doors = [], keys = [];
    const doorEdges = [];
    for (let i = 0; i < p.doors; i++) {
      const at = Math.max(2, Math.floor(path.length * (i + 1) / (p.doors + 1)));
      if (at >= path.length - 1) break;
      doorEdges.push([path[at - 1], path[at]]);
    }
    const isDoor = (a, b, from) => {
      for (let i = from; i < doorEdges.length; i++) {
        const [x, y] = doorEdges[i];
        if ((a === x && b === y) || (a === y && b === x)) return true;
      }
      return false;
    };
    let prevReach = null;
    for (let i = 0; i < doorEdges.length; i++) {
      const reach = bfs(s, (a, b) => isDoor(a, b, i)).dist;
      const cand = [], back = [];
      for (let c = 0; c < CW * CH; c++) {
        if (reach[c] < 0 || used[c] || danger[c]) continue;
        if (prevReach && prevReach[c] >= 0) { back.push(c); continue; }
        cand.push(c);
      }
      let pool = cand.filter(c => !onPath[c] && adj[c].length === 1);
      if (!pool.length) pool = cand.filter(c => !onPath[c]);
      if (!pool.length) pool = cand.length ? cand : back;
      pool.sort((a, b) => reach[b] - reach[a]);
      const kc = pool[Math.min(pool.length - 1, (R() * Math.min(3, pool.length)) | 0)];
      used[kc] = 1;
      const col = KEY_COLORS[i % 3];
      keys.push({ ...cellXY(kc), color: col });
      doors.push({ ...edgeXY(doorEdges[i][0], doorEdges[i][1]), color: col });
      prevReach = reach;
    }

    const deadEnds = [];
    for (let c = 0; c < CW * CH; c++) if (adj[c].length === 1 && !used[c] && !danger[c]) deadEnds.push(c);
    const pickSpread = (pool, n) => {
      const out = [];
      for (let t = 0; t < n && pool.length; t++) {
        let best = -1, bd = -1;
        for (let j = 0; j < 12; j++) {
          const c = pool[(R() * pool.length) | 0];
          const xy = cellXY(c);
          const d = out.length ? Math.min(...out.map(o => Math.abs(o.x - xy.x) + Math.abs(o.y - xy.y))) : R();
          if (d > bd) { bd = d; best = c; }
        }
        used[best] = 1; pool.splice(pool.indexOf(best), 1); out.push(cellXY(best));
      }
      return out;
    };
    let coinPool = deadEnds.slice();
    if (coinPool.length < p.coins) for (let c = 0; c < CW * CH; c++) if (!used[c] && !danger[c] && !onPath[c] && !coinPool.includes(c)) coinPool.push(c);
    if (coinPool.length < p.coins) for (let c = 0; c < CW * CH; c++) if (!used[c] && !danger[c] && !coinPool.includes(c)) coinPool.push(c);
    const coins = pickSpread(coinPool, p.coins);
    const torchPool = [];
    for (let c = 0; c < CW * CH; c++) if (!used[c] && !danger[c] && b0.dist[c] > 3) torchPool.push(c);
    const torches = pickSpread(torchPool, p.torches);

    // spikes on path edges (not near start/exit, not on doors)
    const spikes = [];
    if (p.spikes) {
      const idx = [];
      for (let i = 3; i < path.length - 2; i++) if (!doorEdges.some(([a, b]) => a === path[i - 1] && b === path[i])) idx.push(i);
      for (let t = 0; t < p.spikes && idx.length; t++) {
        const j = idx.splice((R() * idx.length) | 0, 1)[0];
        spikes.push({ ...edgeXY(path[j - 1], path[j]), phase: R() });
        for (let q = idx.length - 1; q >= 0; q--) if (Math.abs(idx[q] - j) < 2) idx.splice(q, 1);
      }
    }

    // decorations: random wall/floor variants (purely visual)
    const deco = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) { const r = R(); deco[i] = r < 0.08 ? 2 : r < 0.5 ? 1 : 0; }

    return {
      L, world: p.world, worldId: WORLDS[p.world].id, params: p, W, H, tile, deco,
      start: cellXY(s), exit: cellXY(e), pathLen: path.length,
      keys, doors, coins, torches, enemies, spikes,
      dark: p.dark, enemySpeed: p.enemySpeed,
      par: Math.round(path.length * 2 * 0.22 + 4), // seconds for "laju" medal
    };
  }

  const api = { WORLDS, PER_WORLD, TOTAL, generate, params };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MazeLevels = api;
})(this);
