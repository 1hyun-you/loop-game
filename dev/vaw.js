// 각성·변환 점검 (0.38): 무기 18종 × 각성 2종 = 36종 + 직업 10종 변환 규칙, 각 15초 가상 진행
// 기록: 오류, 각성 전용 피해원 발생 여부, 무기 피해 합계(각성 없음 대비 배율), 6레벨 도달 시 각성 화면 진입
// 사용: node dev/vaw.js [--out dev/sim_log/aw_0.38.json]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const ROOT = path.resolve(__dirname, '..'), OUT = path.resolve(ROOT, opt('out', 'dev/sim_log/aw_0.38.json'));
const SRV = http.createServer((q, s) => { s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')); });
(async () => {
  await new Promise(r => SRV.listen(48391, r));
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 400, height: 800 } }), errs = [];
  pg.on('pageerror', e => errs.push(String(e.message).slice(0, 200)));
  await pg.goto('http://127.0.0.1:48391/'); await pg.waitForTimeout(800);
  const res = await pg.evaluate(() => {
    const dt = 1 / 60, out = { aw: [], job: [], flow: null };
    const keep = () => { STATE.mode = 'play'; G.sel = null; G.pendingLv = 0; G.pendingBr.length = 0; G.pendingChest = 0; G.pendingJob2 = false; G.altar = null; };
    const feed = n => { for (let i = 0; i < n; i++) { const q = ringAt(70, 260); const e = makeEnemy(ENEMY_ORDER[i % 4], q.x, q.y) || G.enemies[G.enemies.length - 1]; if (e) e.hp *= 30; } };
    const bullets = () => { for (let i = 0; i < 6; i++) { const a = rand(7); G.eb.push({ x: G.p.x + Math.cos(a) * 160, y: G.p.y + Math.sin(a) * 160, vx: -Math.cos(a) * 90, vy: -Math.sin(a) * 90, r: 6, dmg: 1, src: '시험 탄환', life: 3, col: '#fff' }); } };
    const run = (setup, sec = 15) => {
      startRun(); STATE.dev.god = true; keep(); G.p.weapons.length = 0; setup(); recalc(); keep();
      let eb0 = 0;
      for (let t = 0; t < sec; t += dt) { if (G.enemies.filter(e => !e.dead).length < 40) feed(20); if (Math.random() < 0.03) { bullets(); eb0 += 6; } step(dt); keep(); if (G.result) break; }
      return { dmg: Object.assign({}, G.stats.dmg), eb0, ebLeft: G.eb.length };
    };
    const tot = (d, id) => Object.entries(d).filter(([k]) => k === id || k.startsWith(id + '_') || (id === 'orb' && k.startsWith('mbolt')) || (id === 'fireball' && k === 'fireball_pool')).reduce((s, [, v]) => s + v, 0);
    for (const id of WEAPON_ORDER) {
      const base = run(() => { addWeapon(id); G.p.weapons[0].lvl = 6; G.p.weapons[0].awQ = true; });
      for (const o of AWAKEN[id]) {
        const r = run(() => { addWeapon(id); const w = G.p.weapons[0]; w.lvl = 6; w.awQ = true; w.aw = o.k; });
        out.aw.push({ id, k: o.k, nm: o.nm, base: Math.round(tot(base.dmg, id)), dmg: Math.round(tot(r.dmg, id)), ratio: +(tot(r.dmg, id) / Math.max(1, tot(base.dmg, id))).toFixed(2), aws: Object.keys(r.dmg).filter(k => k.endsWith('_aw')) });
      }
    }
    for (const j of JOB_ORDER) {
      const ws = WEAPON_ORDER.filter(id => jobCats(j).includes(WEAPONS[id].cat)).slice(0, 3);
      const set = (job) => () => { if (job) { applyJob(j); keep(); } for (const id of ws) { addWeapon(id); G.p.weapons[G.p.weapons.length - 1].lvl = 6; G.p.weapons[G.p.weapons.length - 1].awQ = true; } };
      const s = d => ws.reduce((x, id) => x + tot(d, id), 0), all = d => Object.values(d).reduce((x, v) => x + v, 0);
      let A = 0, C = 0, AA = 0, CA = 0; for (let k = 0; k < 3; k++) { const a = run(set(false)), c = run(set(true)); A += s(a.dmg); C += s(c.dmg); AA += all(a.dmg); CA += all(c.dmg); }
      out.job.push({ j, ws, base: Math.round(A / 3), conv: Math.round(C / 3), ratio: +(C / Math.max(1, A)).toFixed(2), allRatio: +(CA / Math.max(1, AA)).toFixed(2) });
    }
    // 6레벨 도달 → 각성 화면 진입 흐름
    startRun(); keep(); STATE.dev.god = true; G.p.weapons.length = 0; addWeapon('arrow'); const w = G.p.weapons[0]; w.lvl = 5; w.br = 'pierce'; w.brQ = true;
    applyCard({ t: 'wup', id: 'arrow' }); const q = G.pendingBr.slice();
    openBranch(); const sk = G.sel && G.sel.kind, cards = G.sel && G.sel.cards.map(c => c.k), head = document.querySelector('.sel-head h2') && document.querySelector('.sel-head h2').textContent;
    pickCard(0); out.flow = { queued: q, kind: sk, cards, head, aw: w.aw, branches: G.stats.branches.slice() };
    return out;
  }).catch(e => ({ fatal: String(e.message).slice(0, 400) }));
  fs.writeFileSync(OUT, JSON.stringify({ v: '0.38', errs, res }, null, 1));
  if (res.fatal) console.log('FATAL', res.fatal);
  else {
    for (const r of res.aw) console.log(`${r.id.padEnd(10)} ${r.k.padEnd(8)} ${String(r.base).padStart(6)} → ${String(r.dmg).padStart(6)}  x${r.ratio}  ${r.aws.join(',')}`);
    for (const r of res.job) console.log(`${r.j.padEnd(10)} ${r.ws.join(',').padEnd(26)} ${String(r.base).padStart(6)} → ${String(r.conv).padStart(6)}  x${r.ratio} 전체 x${r.allRatio}`);
    console.log('flow', JSON.stringify(res.flow));
  }
  console.log('errs', errs.length, errs.slice(0, 4).join(' || '));
  await b.close(); SRV.close();
})();
