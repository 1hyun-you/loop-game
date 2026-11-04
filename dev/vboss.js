// 보스 패턴 점검 (0.33): 수문장 4인·마왕(재도전 판) 직행 전투, 고정 빌드 + 자동 회피, 체력 대용량(피해 기록용)
// 기록: 오류, 처치 시간, 패턴 사용 횟수(순번표), 연속 동일 패턴 수, 피해원별 받은 피해
// 사용: node dev/vboss.js [회당 판 수 3] [--out dev/sim_log/boss_0.33.json]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const ROOT = path.resolve(__dirname, '..'), N = +(args[0] && !args[0].startsWith('--') ? args[0] : 3), OUT = path.resolve(ROOT, opt('out', 'dev/sim_log/boss_0.33.json'));
const SRV = http.createServer((q, s) => { s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')); });
(async () => {
  await new Promise(r => SRV.listen(48391, r));
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 400, height: 800 } }), errs = [];
  pg.on('pageerror', e => errs.push(String(e.message).slice(0, 200)));
  await pg.goto('http://127.0.0.1:48391/'); await pg.waitForTimeout(800);
  const res = await pg.evaluate(N => {
    const out = [], dt = 1 / 60;
    for (const k of ['bargan', 'igna', 'morden', 'seren', 'demon']) for (let n = 0; n < N; n++) {
      STATE.dev.gk = k === 'demon' ? null : k; STATE.dev.demon = k === 'demon' ? 'retry' : null; STATE.dev.auto = true;
      startRun(); const p = G.p; p.level = 22;
      for (const w of ['arrow', 'fireball', 'lightning', 'spin']) if (!p.weapons.find(x => x.id === w)) addWeapon(w);
      for (const w of p.weapons) w.lvl = 5;
      p.maxHp = p.hp = 1e7; G.ph.i = G.ph.order.length - 2; G.ph.inGap = false; phaseStart();
      const seq = []; let rep = 0, last = null, t = 0, perr = 0; const kinds = {};
      while (t < 420) {
        try { step(dt); } catch (e) { perr++; if (perr < 3) window.__ERR = (window.__ERR || []).concat(String(e.message)); }
        STATE.mode = 'play'; G.sel = null; G.pendingJob2 = false; t += dt;
        const ai = G.gkMob && G.gkMob.ai; if (ai && ai.last !== undefined && ai._seen !== ai.last + '|' + (G.stats.bpat ? Object.values(G.stats.bpat).reduce((s, v) => s + v, 0) : 0)) {
          const tot = Object.values(G.stats.bpat || {}).reduce((s, v) => s + v, 0); ai._seen = ai.last + '|' + tot; if (ai.last === last) rep++; last = ai.last; seq.push(ai.last); }
        for (const h of G.hz || []) kinds[h.k] = 1;
        if (!G.gkMob || G.gkMob.dead || G.result) break;
      }
      const hurt = {}; for (const s in G.stats.hurt) hurt[s] = Math.round(G.stats.hurt[s]);
      out.push({ k, n, kill: !!(G.gkMob && G.gkMob.dead), sec: Math.round(t), bpat: G.stats.bpat || {}, rep, seq: seq.slice(0, 14).join(' '), kinds: Object.keys(kinds).join(','), hurt, perr, rocksLeft: (G.rocks || []).length });
    }
    return { out, err: window.__ERR || [] };
  }, N).catch(e => ({ fatal: String(e.message).slice(0, 400) }));
  fs.writeFileSync(OUT, JSON.stringify({ v: '0.33', errs, res }, null, 1));
  if (res.fatal) console.log('FATAL', res.fatal);
  else for (const r of res.out) console.log(`${r.k.padEnd(7)} ${r.kill ? 'kill' : 'time'} ${String(r.sec).padStart(4)}s rep${r.rep} perr${r.perr} [${Object.entries(r.bpat).map(([a, v]) => a + v).join(' ')}] hz:${r.kinds}\n   hurt ${Object.entries(r.hurt).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([a, v]) => a + ' ' + v).join(' · ')}`);
  console.log('errs', errs.length, errs.slice(0, 4).join(' || '), res.err ? res.err.slice(0, 3).join(' || ') : '');
  await b.close(); SRV.close();
})();
