// 연성 배율 측정 (0.54): 조합 90종 각각 '짝 무기 단독(연성 전)' 대비 '연성 후' 피해 배율 측정 → 배율표 M44 재산정 자료
// 방법: 직업 j + 기본 무기만(C) / + 짝 무기 Lv 5 각성(A) / + 연성(B) 을 같은 조건에서 SEC초씩 실행, r = B / A (기본 구성 C에 없는 피해 출처만 합산)
// 사용: node dev/vfuse54.js [--out dev/sim_log/fusek_0.54.json] [--sec 15] [--rep 2] [--jobs warrior,rogue]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const ROOT = path.resolve(__dirname, '..'), OUT = path.resolve(ROOT, opt('out', 'dev/sim_log/fusek_0.54.json')), SEC = +opt('sec', 15), REP = +opt('rep', 2), JOBS = opt('jobs', ''), PORT = +opt('port', 48394);
const SRV = http.createServer((q, s) => { s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')); });
(async () => {
  await new Promise(r => SRV.listen(PORT, r));
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 400, height: 800 } }), errs = [];
  pg.on('pageerror', e => errs.push(String(e.message).slice(0, 200)));
  await pg.goto('http://127.0.0.1:' + PORT + '/'); await pg.waitForTimeout(800);
  const res = await pg.evaluate(({ SEC, REP, JOBS }) => {
    const dt = 1 / 60, out = { combos: [] };
    const keep = () => { STATE.mode = 'play'; G.sel = null; G.pendingLv = 0; G.pendingBr.length = 0; G.pendingChest = 0; G.pendingJob2 = false; G.altar = null; };
    const feed = n => { for (let i = 0; i < n; i++) { const q = ringAt(70, 260); const e = makeEnemy(ENEMY_ORDER[i % 4], q.x, q.y) || G.enemies[G.enemies.length - 1]; if (e) e.hp *= 150; } };
    const maxW = w => { w.lvl = 5; if (BRANCHES[w.id]) { w.br = w.br || BRANCHES[w.id][0].k; w.brQ = true; } if (AWAKEN[w.id]) { w.aw = w.aw || AWAKEN[w.id][1].k; w.awQ = true; } };
    const total = () => Object.values(G.stats.dmg).reduce((a, v) => a + v, 0);
    const sim = sec => { const d0 = total(); for (let t = 0; t < sec; t += dt) { if (G.enemies.filter(e => !e.dead).length < 40) feed(20); step(dt); keep(); if (G.result) break; } return total() - d0; };
    const setup = (j, ws) => { startRun(); STATE.dev.god = true; keep(); G.p.weapons.length = 0; for (const id of ws) addWeapon(id); applyJob(j); keep(); for (const w of G.p.weapons) maxW(w); recalc(); keep(); };
    // 출처별 피해 집계: 기본 구성(C)에 없는 출처만 합산 → 짝 무기(연성 전 A / 연성 후 B) 몫만 분리 (기본 무기·직업 효과 잡음 제거)
    const run = (j, ws, fuse) => { const acc = {}; for (let i = 0; i < REP; i++) { setup(j, ws); if (fuse) for (const w of G.p.weapons.filter(w => !w.base)) applyFuse(w.id); sim(2); G.stats.dmg = {}; sim(SEC); for (const k in G.stats.dmg) acc[k] = (acc[k] || 0) + G.stats.dmg[k] / REP; } return acc; };
    const sum = (o, skip) => Object.keys(o).filter(k => !skip || !(k in skip)).reduce((a, k) => a + o[k], 0);
    for (const j of (JOBS ? JOBS.split(',') : JOB_ORDER)) {
      const sym = FZ_SYMBOL[j], Cd = run(j, [], false), C = sum(Cd);
      for (const id of WEAPON_ORDER.filter(x => x !== sym)) {
        const A = sum(run(j, [id], false), Cd), B = sum(run(j, [id], true), Cd);
        out.combos.push({ j, id, nm: fu44(j, id).nm, ds: fu44(j, id).ds, C: Math.round(C), A: Math.round(A), B: Math.round(B), m: (M44[j] || {})[id] || 1, r: +(B / Math.max(1, A)).toFixed(2) });
      }
    }
    return out;
  }, { SEC, REP, JOBS }).catch(e => ({ fatal: String(e.message).slice(0, 400) }));
  fs.writeFileSync(OUT, JSON.stringify({ v: '0.54', errs, res }, null, 1));
  if (res.fatal) console.log('FATAL', res.fatal);
  else for (const c of res.combos) console.log(c.j.padEnd(10), c.id.padEnd(9), ('x' + c.r).padEnd(7), 'm' + c.m, c.nm, `C${c.C} A${c.A} B${c.B}`);
  console.log('errs', errs.length, errs.slice(0, 4).join(' || '));
  await b.close(); SRV.close();
})();
