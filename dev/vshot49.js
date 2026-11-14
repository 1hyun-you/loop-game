// 0.48 화면 점검: 효과 등장·절정·소멸 움직임, 범위 그라데이션·질감, 파편, 얼음 고리 추종, 군주 근위병 크기, 설정 문구
// 사용: node dev/vshot48.js [저장 폴더]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), PORT = 48299, OUT = process.argv[2] || '/tmp/shot49';
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
  // 0.49 군주 근위병: 침입 적 요격·가장자리 경계, 사망 동작
  await ev(() => { G.p.need = 1e12; G.p.job = null; applyJob('sovereign'); if (G.h47) G.h47.cine = null; G.enemies.length = 0; G.p.weapons = []; recalc(); G.banner = { x: G.p.x, y: G.p.y, r: 110 }; });
  await wait(900);
  await ev(() => { for (let i = 0; i < 5; i++) { const a = i * 1.3, e = makeEnemy(i % 2 ? 'skel' : 'slime', G.banner.x + Math.cos(a) * 60, G.banner.y + Math.sin(a) * 60); if (e && !G.enemies.includes(e)) G.enemies.push(e); } });
  for (let k = 0; k < 4; k++) { await wait(220); await ev(() => { G.p.x = G.banner.x; G.p.y = G.banner.y + 30; }); await wait(30); await p.screenshot({ path: OUT + '/sov_' + k + '.png', clip: { x: 45, y: 272, width: 300, height: 300 } }); }
  await wait(1500);
  console.log('guard', await ev(() => JSON.stringify(G.stats.v49) + ' gd ' + JSON.stringify(J41().gd.map(g => [Math.round(Math.hypot(g.x - G.banner.x, g.y - G.banner.y)), !!g.tg]))));
  // 사망 동작
  await ev(() => { G.p.job = null; G.banner = null; const L = ['slime', 'skel', 'bat', 'brute', 'boar', 'jelly']; L.forEach((t, i) => { const e = makeEnemy(t, G.p.x - 100 + i * 40, G.p.y - 45); if (e) e.xp = 0; if (e) { if (!G.enemies.includes(e)) G.enemies.push(e); if (i === 3) e.chestless = 1; } }); });
  await wait(100); await ev(() => { for (const k in V49.dur) V49.dur[k] *= 10; for (const e of G.enemies.slice()) if (!e.dead) killEnemy(e); });
  for (let k = 0; k < 3; k++) { await wait(k ? 90 : 20); await ev(() => { if (G.gems) G.gems.length = 0; }); await p.screenshot({ path: OUT + '/death_' + k + '.png', clip: { x: 45, y: 272, width: 300, height: 300 } }); }
  // 수치 점검: 얼음 고리 추종, 회전검 칼날 개별
  const chk = await ev(() => {
    G.p.job = null; G.p.weapons = [{ id: 'icering', lvl: 3, t: 0, br: 'freeze' }]; recalc(); G.fx.length = 0;
    WEAPON_FIRE.icering(G.p.weapons[0], wStats(G.p.weapons[0]));
    const f = G.fx.find(o => o.kind === 'ring' && o.element === 'ice'); const x0 = G.p.x; G.p.x += 50; updateJuice(0.016);
    return { follow: !!(f && f.follow && f.trk48), fx: f && f.x - x0, tagged: !!(f && f.k48), dur: f && f.dur };
  });
  console.log('ice', JSON.stringify(chk));
  const st = await ev(() => ({ v: CFG.VERSION, v47: G.stats.v47, v48: G.stats.v48, marks: G.h47 && G.h47.marks.length, fps: SETTINGS.fps }));
  console.log(JSON.stringify(st), 'errs', errs.length, errs.slice(0, 3));
  await b.close(); SERVER.close();
})();
