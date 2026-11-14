// 0.51 화면 점검: 얼음 퍼짐 띠·대지 내리찍기 함몰/먼지/파편·방패 충격파·지속 장판 일렁임
// 사용: node dev/vshot51.js [저장 폴더]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), PORT = 48294, OUT = process.argv[2] || '/tmp/shot51';
fs.mkdirSync(OUT, { recursive: true });
const SERVER = http.createServer((q, s) => { const u = decodeURIComponent((q.url || '/').split('?')[0]), f = path.join(ROOT, u); if (/\.(png|woff2)$/.test(u) && fs.existsSync(f)) return s.end(fs.readFileSync(f)); s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(fs.readFileSync(path.join(ROOT, 'index.html'))); });
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  await new Promise(r => SERVER.listen(PORT, '127.0.0.1', r));
  const b = await chromium.launch({ args: ['--disable-gpu'] }), ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }), p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => p.evaluate(f, a), click = id => ev(i => { const e = document.getElementById(i) || document.querySelector(i); if (e) e.click(); return !!e; }, id);
  await p.goto(`http://127.0.0.1:${PORT}/`); await wait(500);
  await click('settings'); await wait(300); await p.screenshot({ path: OUT + '/settings.png' });
  await click('s_back'); await wait(200);
  await click('start'); await wait(400);
  for (let i = 0; i < 12 && await ev(() => STATE.mode === 'talk'); i++) { await click('dlg'); await wait(120); await click('dlg'); await wait(120); }
  await click('.card[data-i="0"]'); await click('.card[data-i="0"]'); await wait(300);
  await ev(() => { addXp = () => {}; });
  const setW = list => ev(L => { G.pendingLv = 0; if (STATE.mode === 'select') { hideUI(); STATE.mode = 'play'; G.sel = null; } G.p.weapons = L.map(([id, br, aw]) => ({ id, lvl: aw ? 5 : 3, t: 0.2, br, aw })); recalc(); G.p.hp = G.p.maxHp = 9999; }, list);
  const crowd = () => ev(() => { for (let i = 0; i < 26; i++) { const a = i / 26 * 6.283, d = 70 + (i % 3) * 30; const e = makeEnemy('skel', G.p.x + Math.cos(a) * d, G.p.y + Math.sin(a) * d); if (e && !G.enemies.includes(e)) G.enemies.push(e); if (e) e.hp = 9999; } });
  const sets = [
    ['a_heavy', [['cleave', 'wide'], ['shield', 'twin'], ['slam', 'fissure', 'grav']]],
    ['b_heavy2', [['cleave', 'double', 'x'], ['shield', 'wall'], ['slam', 'after']]],
    ['c_pierce', [['arrow', 'pierce'], ['beam', 'prism'], ['shuriken', 'ricochet']]],
    ['d_blast', [['fireball', 'big'], ['trap', 'cluster'], ['icering', 'freeze'], ['orb', 'nova']]],
    ['e_alt', [['arrow', 'split'], ['beam', 'track'], ['fireball', 'pool'], ['orb', 'swarm'], ['icering', 'shatter'], ['shuriken', 'scatter'], ['trap', 'snare']]],
  ];
  for (const [nm, L] of sets) {
    await setW(L.map(([id, br]) => [id, br, null]));
    await ev(L => { for (const [id, br, aw] of L) { const w = G.p.weapons.find(x => x.id === id); if (aw && AWAKEN[id]) w.aw = AWAKEN[id][aw === 'x' ? 1 : 0].k; } recalc(); }, L);
    await crowd();
    for (let k = 0; k < 4; k++) { await ev(() => { G.p.x += 18; }); await wait(150); await p.screenshot({ path: `${OUT}/${nm}_${k}.png` }); }
  }
  console.log('deco', await ev(() => JSON.stringify(G.stats.v51)));
  const st = await ev(() => ({ v: CFG.VERSION, v47: G.stats.v47, v48: G.stats.v48, marks: G.h47 && G.h47.marks.length, fps: SETTINGS.fps }));
  console.log(JSON.stringify(st), 'errs', errs.length, errs.slice(0, 3));
  await b.close(); SERVER.close();
})();
