// 궁극기 점검 (0.32): 직업 10종 × (변화형 2 + 숙련 1) = 30종 각 3회 시전, 오류·시전 1회 피해 합계·지속 시간 기록
// 사용: node dev/vult.js [--level 20] [--out dev/sim_log/ult_0.32.json]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const ROOT = path.resolve(__dirname, '..'), LV = +opt('level', 20), OUT = path.resolve(ROOT, opt('out', 'dev/sim_log/ult_0.32.json'));
const SRV = http.createServer((q, s) => { s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')); });
(async () => {
  await new Promise(r => SRV.listen(48390, r));
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 400, height: 800 } }), errs = [];
  pg.on('pageerror', e => errs.push(String(e.message).slice(0, 160)));
  await pg.goto('http://127.0.0.1:48390/'); await pg.waitForTimeout(800);
  const res = await pg.evaluate(LV => {
    const out = [], dt = 1 / 60;
    for (const j of JOB_ORDER) for (const k of JOB2[j].map(o => o.k).concat('veteran')) {
      startRun(); STATE.dev.god = true; STATE.mode = 'play';
      const p = G.p; p.level = LV; applyJob(j); applyJob2(k); STATE.mode = 'play'; G.sel = null; G.pendingJob2 = false;
      const runs = [];
      for (let c = 0; c < 3; c++) {
        for (let i = 0; i < 90; i++) { const q = ringAt(60, 220); { const e = makeEnemy(ENEMY_ORDER[3], q.x, q.y); if (e) e.hp *= 6; else { const L = G.enemies[G.enemies.length - 1]; L.hp *= 6; } } }
        step(dt); STATE.mode = 'play'; G.sel = null; const s0 = G.stats.dmg.ult || 0, t0 = G.time; p.ult = JOB_CFG.ultNeed; useUlt();
        let t = 0; while ((G.U.on || t < 1) && t < 20) { step(dt); STATE.mode = 'play'; G.sel = null; t += dt; if (G.result) break; }
        runs.push({ d: Math.round((G.stats.dmg.ult || 0) - s0), sec: +(G.time - t0).toFixed(1) });
        for (let i = 0; i < 240; i++) { step(dt); STATE.mode = 'play'; G.sel = null; }
      }
      out.push({ j, k, runs, avg: Math.round(runs.reduce((s, r) => s + r.d, 0) / runs.length) });
    }
    return out;
  }, LV).catch(e => [{ fatal: String(e.message).slice(0, 300) }]);
  fs.writeFileSync(OUT, JSON.stringify({ v: '0.32', level: LV, errs, res }, null, 1));
  for (const r of res) console.log(r.fatal || `${r.j.padEnd(10)} ${r.k.padEnd(11)} avg ${String(r.avg).padStart(6)}  ${r.runs.map(x => x.d + '/' + x.sec + 's').join('  ')}`);
  console.log('errs', errs.length, errs.slice(0, 3).join(' || '));
  await b.close(); SRV.close();
})();
