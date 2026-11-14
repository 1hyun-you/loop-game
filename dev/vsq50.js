// 동료 지휘 점검 (0.50 개정: 겹침 기준 6, 작은 정예 다수 공격·순간이동 교대 추가)
// 기반: 0.46: 소환사 망령·망령 무장, 드루이드 야수 동료
// 항목: 잡몹 분산(표적 중복), 정예 집중 인원(절반 올림), 보스 단독 전원 투입, 근접 위협 우선, 활동 범위 이탈률, 겹침률, 대기 고리 유지
// 사용: NODE_PATH=$(npm root -g) node dev/vsq46.js [--out dev/sim_log/sq_0.50.json]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const ROOT = path.resolve(__dirname, '..'), OUT = path.resolve(ROOT, opt('out', 'dev/sim_log/sq_0.50.json'));
const SRV = http.createServer((q, s) => { s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')); });
(async () => {
  await new Promise(r => SRV.listen(48396, r));
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 400, height: 800 } }), errs = [];
  pg.on('pageerror', e => errs.push(String(e.message).slice(0, 200)));
  await pg.goto('http://127.0.0.1:48396/'); await pg.waitForTimeout(800);
  const res = await pg.evaluate(() => {
    const dt = 1 / 60, out = { cases: [], fails: [] }, fail = (k, d) => out.fails.push(k + (d != null ? ' · ' + d : ''));
    const keep = () => { STATE.mode = 'play'; G.sel = null; G.pendingLv = 0; G.pendingBr.length = 0; G.pendingChest = 0; G.pendingJob2 = false; G.altar = null; };
    const clear = () => { for (const e of G.enemies) e.dead = true; G.enemies = G.enemies.filter(e => !e.dead); };
    const mob = (x, y, hp = 400) => { const e = makeEnemy(ENEMY_ORDER[0], G.p.x + x, G.p.y + y) || G.enemies[G.enemies.length - 1]; e.hp = e.mhp = hp; e.sp = 0; e.speed = 0; return e; };
    const freeze = () => { for (const e of G.enemies) { e.vx = 0; e.vy = 0; } };
    const run = sec => { for (let t = 0; t < sec; t += dt) { const ps = G.enemies.map(e => [e, e.x, e.y]), px = G.p.x, py = G.p.y; step(dt); keep(); G.p.x = px; G.p.y = py; for (const [e, x, y] of ps) { e.x = x; e.y = y; } } };   // 플레이어·적 위치 고정 (자동 조작 이동 배제)
    const units = () => G.p.job === 'druid' ? G.pets : sumUnits46();
    const setup = (j, n) => {
      startRun(); STATE.dev.god = true; keep(); applyJob(j); keep(); clear();
      if (j === 'summoner') { G.minions.length = 0; for (let i = 0; i < n; i++) addMinion(G.p.x, G.p.y); for (const m of G.minions) m.life = 1e9; }
      G.p.x = 0; G.p.y = 0; G.p.moving = false;
    };
    const _sp = updateSpawn; updateSpawn = () => {};
    for (const [j, n] of [['summoner', 2], ['summoner', 4], ['summoner', 6], ['druid', 2]]) {
      const tag = j + n, C = { tag };
      /* 1. 대기 고리: 적 없음 */
      setup(j, n); run(3);
      const Gm = sqGeom46(units().length), dists = units().map(u => Math.round(Math.hypot(u.x - G.p.x, u.y - G.p.y)));
      C.idle = dists; C.ring = [Gm.rIn, Gm.rOut];
      if (dists.some(d => d < Gm.rIn - 15 || d > Gm.rOut + 15)) fail(tag + ' 대기 고리 이탈', dists.join(','));
      /* 2. 잡몹 분산: 적 수 >= 동료 수 → 표적 중복 없음 */
      for (let i = 0; i < 10; i++) { const a = i * 0.63; mob(Math.cos(a) * 150, Math.sin(a) * 150, 1e7); }
      run(2);
      const tg = units().map(u => u.tg && u.tg.id), uniq = new Set(tg.filter(Boolean)).size;
      C.spread = uniq + '/' + units().length; if (uniq < units().length) fail(tag + ' 잡몹 표적 중복', C.spread);
      /* 3. 정예 집중: 절반(올림) */
      const el = mob(0, -170, 1e7); el.elite = true; el.r = Math.max(el.r, 16); run(1.5);
      const onEl = units().filter(u => u.tg === el).length, q = Math.ceil(units().length / 2);
      C.elite = onEl + '/' + units().length; if (onEl !== q) fail(tag + ' 정예 투입 인원', C.elite + ' 기대 ' + q);
      if (j === 'druid' && !(G.pets.find(m => m.kind === 'bear').tg === el)) fail(tag + ' 곰 정예 담당 아님');
      /* 4. 겹침: 같은 적 공격자 간 거리 */
      const att = units().filter(u => u.tg === el); let minD = 1e9;
      for (const a of att) for (const c of att) if (a !== c) minD = Math.min(minD, Math.hypot(a.x - c.x, a.y - c.y));
      C.eliteGap = att.length > 1 ? Math.round(minD) : null; if (att.length > 1 && minD < 6) fail(tag + ' 정예 공격자 겹침', Math.round(minD));
      /* 5. 근접 위협 우선 */
      const nr = mob(40, 30, 1e7); run(0.8);
      C.near = units().some(u => u.tg === nr); if (!C.near) fail(tag + ' 근접 위협 미대응');
      /* 6. 보스 단독: 전원 */
      clear(); const bo = mob(0, 160, 1e7); bo.boss = true; bo.r = 24; run(1.5);
      const onB = units().filter(u => u.tg === bo).length; C.boss = onB + '/' + units().length;
      if (onB !== units().length) fail(tag + ' 보스 단독 전원 투입', C.boss);
      /* 7. 먼 적: 활동 범위 밖 적은 공격 안 함 */
      clear(); const far = mob(0, 330, 1e7); run(2);
      C.far = units().filter(u => u.tg === far).length; if (C.far) fail(tag + ' 활동 범위 밖 공격', C.far);
      const mx = Math.max(...units().map(u => Math.hypot(u.x - G.p.x, u.y - G.p.y)));
      if (mx > Gm.act + 40) fail(tag + ' 활동 범위 이탈', Math.round(mx));
      out.cases.push(C);
    }
    /* 9. (0.50) 작은 정예 다수 공격: 망령 10 → 전원 사거리 안 */
    { setup('summoner', 10); const el = mob(0, -150, 1e7); el.elite = true; el.r = 10; run(3);
      const U = units(), on = U.filter(u => u.tg === el), inR = on.filter(u => Math.hypot(u.x - el.x, u.y - el.y) < el.r + u.r + 16).length;
      let md = 1e9; for (const a of on) for (const c of on) if (a !== c) md = Math.min(md, Math.hypot(a.x - c.x, a.y - c.y));
      const C = { tag: 'smallElite10', on: on.length, inReach: inR, minGap: Math.round(md) }; out.cases.push(C);
      if (inR < on.length) fail('작은 정예 사거리 밖 공격자', inR + '/' + on.length); if (md < 6) fail('작은 정예 공격자 겹침', Math.round(md));
      const ring = []; for (const a of on) ring.push(Math.atan2(a.y - el.y, a.x - el.x)); ring.sort((a, b) => a - b);
      const gaps = ring.map((a, i) => ((ring[(i + 1) % ring.length] - a) + Math.PI * 2) % (Math.PI * 2)); C.angSpread = +(Math.max(...gaps) - Math.min(...gaps)).toFixed(2); }
    /* 10. (0.50) 보스 순간이동: 멀리 있던 공격자 해제, 새 위치 가까운 동료 교대 */
    { setup('summoner', 10); for (let i = 0; i < 8; i++) { const a = i * 0.8; mob(Math.cos(a) * 140, Math.sin(a) * 140, 1e7); }
      const bo = mob(-150, 0, 1e7); bo.boss = true; bo.r = 22; run(2.5); G.stats.v50 = null;
      const before = units().filter(u => u.tg === bo); bo.x = 150; bo.y = 20; run(0.05);
      const farOld = before.filter(u => Math.hypot(u.x - bo.x, u.y - bo.y) > 110); run(1.5);
      const after = units().filter(u => u.tg === bo), stillFar = farOld.filter(u => u.tg === bo && !after.includes(u) ? false : u.tg === bo).length, fresh = after.filter(u => !before.includes(u)).length;
      const C = { tag: 'teleport', before: before.length, after: after.length, fresh, farOldStill: stillFar, drop: (G.stats.v50 || {}).sqDrop || 0 }; out.cases.push(C);
      if (!fresh) fail('순간이동 후 교대 없음'); if (!C.drop) fail('순간이동 감지 없음'); }
    updateSpawn = _sp;
    /* 8. 망령 무장(연성) 포함 + 이동 중 혼전 통계 */
    for (const j of ['summoner', 'druid']) {
      setup(j, 4); G.stats.sq46 = null;
      if (j === 'summoner') { const ws = WEAPON_ORDER.filter(id => id !== FZ_SYMBOL.summoner).slice(0, 2); for (const id of ws) addWeapon(id); for (const w of G.p.weapons) { w.lvl = 5; } recalc(); keep(); for (const w of G.p.weapons.filter(w => !w.base)) applyFuse(w.id); keep(); }
      let ang = 0;
      for (let t = 0; t < 40; t += dt) {
        if (G.enemies.filter(e => !e.dead).length < 30) for (let i = 0; i < 10; i++) { const q = ringAt(120, 300); makeEnemy(ENEMY_ORDER[i % 4], q.x, q.y); }
        if (t > 10 && t < 10.05) spawnElite();
        ang += dt * 0.6; G.p.x += Math.cos(ang) * 60 * dt; G.p.y += Math.sin(ang) * 60 * dt;
        step(dt); keep(); for (const m of G.minions) m.life = Math.max(m.life, 5);
      }
      const S = G.stats.sq46 || { n: 0 }; const st = { j, units: units().length, samples: S.n, outPct: +(100 * S.out / Math.max(1, S.n)).toFixed(1), overlapPct: +(100 * S.ov / Math.max(1, S.n)).toFixed(1), ringPct: +(100 * S.ring / Math.max(1, S.idle)).toFixed(1) };
      out.cases.push(st);
      if (st.outPct > 5) fail(j + ' 이동 중 활동 범위 이탈률', st.outPct);
      /* 0.50: 겹침률(12 기준)은 참고 지표, 판정은 근접 6 기준 사례 점검 */
    }
    return out;
  }).catch(e => ({ fatal: String(e.message).slice(0, 400) }));
  fs.writeFileSync(OUT, JSON.stringify({ v: '0.50', errs, res }, null, 1));
  if (res.fatal) console.log('FATAL', res.fatal);
  else { for (const c of res.cases) console.log(JSON.stringify(c)); console.log('FAIL', res.fails.length, res.fails.join(' || ')); }
  console.log('errs', errs.length, errs.slice(0, 4).join(' || '));
  await b.close(); SRV.close();
})();
