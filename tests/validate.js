// node tests/validate.js  — proves every level is solvable and fair.
const M = require('../levels.js');
let bad = 0;
const t0 = Date.now();
for (let L = 1; L <= M.TOTAL; L++) {
  const g = M.generate(L);
  const err = m => { bad++; console.log(`L${L}: ${m}`); };
  const at = (x, y) => g.tile[y * g.W + x];
  const keyAt = new Map(g.keys.map(k => [k.x + ',' + k.y, k.color]));
  const doorAt = new Map(g.doors.map(d => [d.x + ',' + d.y, d.color]));
  for (const o of [...g.keys, ...g.doors, ...g.coins, ...g.torches, ...g.spikes, g.start, g.exit])
    if (at(o.x, o.y) !== 0) err('item on wall ' + JSON.stringify(o));
  const have = new Set();
  let reach;
  for (let it = 0; it < 10; it++) {
    reach = new Set([g.start.x + ',' + g.start.y]);
    const q = [[g.start.x, g.start.y]];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, id = nx + ',' + ny;
        if (reach.has(id) || at(nx, ny) !== 0) continue;
        if (doorAt.has(id) && !have.has(doorAt.get(id))) continue;
        reach.add(id); q.push([nx, ny]);
      }
    }
    let got = false;
    for (const [id, c] of keyAt) if (reach.has(id) && !have.has(c)) { have.add(c); got = true; }
    if (!got) break;
  }
  if (!reach.has(g.exit.x + ',' + g.exit.y)) err('exit unreachable');
  for (const c of g.coins) if (!reach.has(c.x + ',' + c.y)) err('coin unreachable');
  if (g.coins.length !== 3) err('coins ' + g.coins.length);
  if (g.doors.length !== g.params.doors) err(`doors ${g.doors.length}/${g.params.doors}`);
  if (g.enemies.length !== g.params.enemies) err(`enemies ${g.enemies.length}/${g.params.enemies}`);
  const patrol = new Set(); g.enemies.forEach(e => e.route.forEach(r => patrol.add(r.x + ',' + r.y)));
  for (const k of g.keys) if (patrol.has(k.x + ',' + k.y)) err('key on patrol');
  if (patrol.has(g.start.x + ',' + g.start.y)) err('patrol on start');
  for (const e of g.enemies) if (e.route.length < 3) err('short route');
}
console.log(`${M.TOTAL} levels checked in ${Date.now() - t0}ms, problems: ${bad}`);
const s = [1, 20, 21, 41, 61, 81, 100].map(L => { const g = M.generate(L); return `L${L} ${g.W}x${g.H} path${g.pathLen} d${g.doors.length} e${g.enemies.length} s${g.spikes.length}`; });
console.log(s.join('\n'));
process.exit(bad ? 1 : 0);
