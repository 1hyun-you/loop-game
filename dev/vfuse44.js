// 연성 90종 점검 (0.44): 직업 10종 × 짝 무기 9종 전부 연성 → 발동·피해 발생·카드 이름·오류 점검, 연성 전후 피해 배율
// 사용: node dev/vfuse44.js [--out dev/sim_log/fuse_0.44.json] [--sec 12]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const ROOT = path.resolve(__dirname, '..'), OUT = path.resolve(ROOT, opt('out', 'dev/sim_log/fuse_0.44.json')), SEC = +opt('sec', 12);
const SRV = http.createServer((q, s) => { s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')); });
(async () => {
  await new Promise(r => SRV.listen(48393, r));
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 400, height: 800 } }), errs = [];
  pg.on('pageerror', e => errs.push(String(e.message).slice(0, 200)));
  await pg.goto('http://127.0.0.1:48393/'); await pg.waitForTimeout(800);
  const res = await pg.evaluate((SEC) => {
    const dt = 1 / 60, out = { combos: [], jobs: [], fails: [] }, fail = (k, d) => out.fails.push(k + (d ? ' · ' + d : ''));
    const keep = () => { STATE.mode = 'play'; G.sel = null; G.pendingLv = 0; G.pendingBr.length = 0; G.pendingChest = 0; G.pendingJob2 = false; G.altar = null; };
    const feed = n => { for (let i = 0; i < n; i++) { const q = ringAt(70, 260); const e = makeEnemy(ENEMY_ORDER[i % 4], q.x, q.y) || G.enemies[G.enemies.length - 1]; if (e) e.hp *= 150; } };
    const maxW = w => { w.lvl = 5; if (BRANCHES[w.id]) { w.br = w.br || BRANCHES[w.id][0].k; w.brQ = true; } if (AWAKEN[w.id]) { w.aw = w.aw || AWAKEN[w.id][1].k; w.awQ = true; } };
    const total = () => Object.values(G.stats.dmg).reduce((a, v) => a + v, 0);
    const sim = sec => { const d0 = total(); for (let t = 0; t < sec; t += dt) { if (G.enemies.filter(e => !e.dead).length < 40) feed(20); step(dt); keep(); if (G.result) break; } return total() - d0; };
    const setup = (j, ws) => { startRun(); STATE.dev.god = true; keep(); G.p.weapons.length = 0; for (const id of ws) addWeapon(id); applyJob(j); keep(); for (const w of G.p.weapons) maxW(w); recalc(); keep(); };
    if (Object.keys(F44).length !== 10 || Object.values(F44).some(v => v.length !== 9)) fail('조합표 90종');
    for (const j of JOB_ORDER) {
      const sym = FZ_SYMBOL[j], pool = WEAPON_ORDER.filter(id => id !== sym); let base = 0, fused = 0;
      if (pool.some(id => !FU44[j][id])) fail(j + ' 연성 정의 누락', pool.filter(id => !FU44[j][id]).join(','));
      for (let g = 0; g < 3; g++) {
        const ws = pool.slice(g * 3, g * 3 + 3);
        setup(j, ws); base += sim(SEC);
        setup(j, ws);
        // 카드: 이름·설명이 조합표와 일치
        const cards = drawCards(selN()), fc = cards.find(c => c.t === 'fuse'); if (!fc) fail(j + ' 연성 카드 미등장', ws.join(','));
        else { const ci = cardInfo(fc); if (ci.nm !== fu44(j, fc.id).nm) fail(j + ' 카드 이름', ci.nm); }
        for (const w of G.p.weapons.filter(w => !w.base)) applyFuse(w.id);
        G.stats.dmg = {}; G.stats.fu44 = {};
        fused += sim(SEC);
        for (const id of ws) {
          const src = fsrc(j, id), d = G.stats.dmg[src] || 0, n = (G.stats.fu44 || {})[src] || 0, nm = fu44(j, id).nm, w = G.p.weapons.find(x => x.id === id);
          out.combos.push({ j, id, nm, fires: n, dmg: Math.round(d), named: !!w && w.fu && w.fu.nm === nm });
          if (!n) fail(j + ' ' + nm + ' 발동 0'); if (d <= 0) fail(j + ' ' + nm + ' 피해 0'); if (!w || !w.fu || w.fu.nm !== nm) fail(j + ' ' + nm + ' 이름');
        }
      }
      out.jobs.push({ j, ratio: +(fused / Math.max(1, base)).toFixed(2) });
    }
    return out;
  }, SEC).catch(e => ({ fatal: String(e.message).slice(0, 400) }));
  fs.writeFileSync(OUT, JSON.stringify({ v: '0.44', errs, res }, null, 1));
  if (res.fatal) console.log('FATAL', res.fatal);
  else {
    for (const j of res.jobs) { const cs = res.combos.filter(c => c.j === j.j); console.log(j.j.padEnd(10), 'x' + j.ratio, cs.map(c => `${c.nm}(${c.fires}/${c.dmg})`).join(' ')); }
    console.log('FAIL', res.fails.length, res.fails.join(' || '));
  }
  console.log('errs', errs.length, errs.slice(0, 4).join(' || '));
  await b.close(); SRV.close();
})();
