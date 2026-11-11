// 연성 점검 (0.43): 직업 10종 × 무기 칸 무기(기본 무기 제외 9종 중 3종) 연성 흐름·발동·피해 배율 점검
// 점검: 전직 시 기본 무기 이동, Lv 5·각성 후 레벨업 연성 카드 등장(1장), 연성 적용·분기/각성 계승, 연성 발동 횟수, 연성 전후 피해 배율,
//       전 칸 연성 시 기본 무기 단독 발동 종료, 전직 후보 규칙, 오류
// 사용: node dev/vfuse.js [--out dev/sim_log/fuse_0.43.json] [--sec 15]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const ROOT = path.resolve(__dirname, '..'), OUT = path.resolve(ROOT, opt('out', 'dev/sim_log/fuse_0.43.json')), SEC = +opt('sec', 15);
const SRV = http.createServer((q, s) => { s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')); });
(async () => {
  await new Promise(r => SRV.listen(48392, r));
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 400, height: 800 } }), errs = [];
  pg.on('pageerror', e => errs.push(String(e.message).slice(0, 200)));
  await pg.goto('http://127.0.0.1:48392/'); await pg.waitForTimeout(800);
  const res = await pg.evaluate((SEC) => {
    const dt = 1 / 60, out = { jobs: [], cands: [], fails: [] }, fail = (k, d) => out.fails.push(k + (d ? ' · ' + d : ''));
    const keep = () => { STATE.mode = 'play'; G.sel = null; G.pendingLv = 0; G.pendingBr.length = 0; G.pendingChest = 0; G.pendingJob2 = false; G.altar = null; };
    const feed = n => { for (let i = 0; i < n; i++) { const q = ringAt(70, 260); const e = makeEnemy(ENEMY_ORDER[i % 4], q.x, q.y) || G.enemies[G.enemies.length - 1]; if (e) e.hp *= 150; } };
    const maxW = w => { w.lvl = 5; if (BRANCHES[w.id]) { w.br = w.br || BRANCHES[w.id][0].k; w.brQ = true; } if (AWAKEN[w.id]) { w.aw = w.aw || AWAKEN[w.id][1].k; w.awQ = true; } };
    const total = () => Object.values(G.stats.dmg).reduce((a, v) => a + v, 0);
    const sim = sec => { const d0 = total(); for (let t = 0; t < sec; t += dt) { if (G.enemies.filter(e => !e.dead).length < 40) feed(20); step(dt); keep(); if (G.result) break; } return total() - d0; };
    const setup = (j, ws) => { startRun(); STATE.dev.god = true; keep(); G.p.weapons.length = 0; for (const id of ws) addWeapon(id); applyJob(j); keep(); for (const w of G.p.weapons) maxW(w); recalc(); keep(); };
    // 전직 후보 규칙
    startRun(); keep(); G.p.weapons.length = 0; addWeapon('arrow'); addWeapon('orb'); addWeapon('fireball');
    for (let i = 0; i < 20; i++) { const c = jobCands().map(x => x.id).sort().join(','); if (!out.cands.includes(c)) out.cands.push(c); }
    if (out.cands.some(c => c.split(',').some(j => !['archer', 'priest', 'mage'].includes(j)))) fail('전직 후보 대응 외 직업', out.cands.join(' / '));
    G.p.weapons.length = 0; addWeapon('arrow'); const one = jobCands(); if (one.length !== 1 || one[0].id !== 'archer') fail('대응 1개 후보', JSON.stringify(one));
    G.p.weapons.length = 0; addWeapon('lance'); const none = jobCands(); if (none.length !== 3) fail('대응 0개 무작위 3', JSON.stringify(none));
    if (WEAPON_ORDER.length !== 10 || CFG.weaponMax !== 5) fail('무기 10종·Lv 5', WEAPON_ORDER.length + '/' + CFG.weaponMax);
    for (const j of JOB_ORDER) {
      const sym = FZ_SYMBOL[j], pool = WEAPON_ORDER.filter(id => id !== sym), ws = pool.slice(JOB_ORDER.indexOf(j) % 7, JOB_ORDER.indexOf(j) % 7 + 3);
      const r = { j, sym, ws };
      // 기본 무기 이동 (보유 시 같은 개체·레벨 유지)
      startRun(); keep(); G.p.weapons.length = 0; addWeapon(sym); G.p.weapons[0].lvl = 3; addWeapon(ws[0]); applyJob(j); keep();
      const B = G.p.weapons.find(w => w.base); r.baseMove = !!B && B.id === sym && B.lvl === 3 && G.p.weapons.filter(w => w.id === sym).length === 1;
      if (!r.baseMove) fail(j + ' 기본 무기 이동', JSON.stringify(G.p.weapons));
      // 연성 전 피해 (같은 구성)
      let base = 0, fused = 0;
      for (let k = 0; k < 2; k++) { setup(j, ws); base += sim(SEC); }
      // 연성 카드 등장·적용
      setup(j, ws);
      const cards = drawCards(selN()), fc = cards.filter(c => c.t === 'fuse');
      r.card = fc.length; if (fc.length !== 1) fail(j + ' 연성 카드 1장', JSON.stringify(cards));
      G.sel = { kind: 'level', cards, banish: false }; STATE.mode = 'select'; renderSelect();
      const el = document.querySelector('.card.k-fuse'); r.cardUI = !!el && !!el.querySelector('.fuse-corner') && el.querySelector('.nm').textContent === fuseName(j, fc[0] && fc[0].id);
      if (!r.cardUI) fail(j + ' 연성 카드 화면', el ? el.outerHTML.slice(0, 120) : '없음');
      const i0 = cards.findIndex(c => c.t === 'fuse'); const tw = G.p.weapons.find(w => fc[0] && w.id === fc[0].id), br0 = tw && tw.br, aw0 = tw && tw.aw;
      pickCard(i0); keep();
      r.applied = !!tw && !!tw.fu && tw.br === br0 && tw.aw === aw0; if (!r.applied) fail(j + ' 연성 적용·계승');
      r.name = tw && tw.fu && tw.fu.nm;
      // 나머지 칸 연성 → 기본 무기 단독 발동 종료
      for (const w of G.p.weapons.filter(w => !w.base && !w.fu)) applyFuse(w.id);
      r.retiredAll = baseRetired() === (G.p.weapons.filter(w => !w.base).length >= slotCount());
      G.stats.fuseFires = 0; G.f43.fires = {};
      const bt0 = (G.p.weapons.find(w => w.base) || {}).t;
      fused += sim(SEC);
      r.fires = G.stats.fuseFires || 0; if (r.fires < 3) fail(j + ' 연성 발동 부족', r.fires);
      // 2회 측정 평균 대비
      setup(j, ws); for (const w of G.p.weapons.filter(w => !w.base)) applyFuse(w.id); fused += sim(SEC);
      r.ratio = +(fused / Math.max(1, base)).toFixed(2);
      r.slots = G.p.weapons.length + '/' + slotW();
      out.jobs.push(r);
    }
    // 각성 Lv 5 흐름
    startRun(); keep(); STATE.dev.god = true; G.p.weapons.length = 0; addWeapon('arrow'); const w = G.p.weapons[0]; w.lvl = 4; w.br = 'pierce'; w.brQ = true;
    applyCard({ t: 'wup', id: 'arrow' }); out.awFlow = { q: G.pendingBr.slice(), lvl: w.lvl };
    if (!(G.pendingBr.length === 1 && G.pendingBr[0].aw)) fail('Lv 5 각성 대기열', JSON.stringify(G.pendingBr));
    if (levelCands().some(c => c.t === 'wup' && c.id === 'arrow')) fail('Lv 5 이후 강화 후보 잔존');
    return out;
  }, SEC).catch(e => ({ fatal: String(e.message).slice(0, 400) }));
  fs.writeFileSync(OUT, JSON.stringify({ v: '0.43', errs, res }, null, 1));
  if (res.fatal) console.log('FATAL', res.fatal);
  else {
    for (const r of res.jobs) console.log(`${r.j.padEnd(10)} ${r.sym.padEnd(9)} ${r.ws.join(',').padEnd(26)} 카드${r.card} 발동${String(r.fires).padStart(4)} x${r.ratio} ${r.name}`);
    console.log('후보', res.cands.join(' / '));
    console.log('FAIL', res.fails.length, res.fails.join(' || '));
  }
  console.log('errs', errs.length, errs.slice(0, 4).join(' || '));
  await b.close(); SRV.close();
})();
