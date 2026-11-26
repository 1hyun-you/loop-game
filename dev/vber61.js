// 0.61 광전사 집중 점검: 투지·격노, 발현 A·B → 무기 각성 A·B, 궁극기 3종, 인물 각성 A·B, 연성 7종 발동·피해·그리기 오류
// 사용: NODE_PATH=$(npm root -g) node dev/vber61.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), PORT = +(process.env.PORT || 48361);
const SERVER = http.createServer((q, s) => { const u = decodeURIComponent((q.url || '/').split('?')[0]), f = path.join(ROOT, u); if (/\.(png|woff2|webmanifest)$/.test(u) && fs.existsSync(f)) return s.end(fs.readFileSync(f)); s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(fs.readFileSync(path.join(ROOT, 'index.html'))); });
(async () => {
  await new Promise(r => SERVER.listen(PORT, '127.0.0.1', r));
  const b = await chromium.launch({ args: ['--disable-gpu'] }), p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://127.0.0.1:${PORT}/`); await p.waitForTimeout(1500);
  const res = await p.evaluate(() => {
    const out = [], ok = (c, m) => out.push((c ? 'ok  ' : 'FAIL') + ' ' + m);
    const settle = () => { let g = 0; while (STATE.mode !== 'play' && g++ < 20) { if (STATE.mode === 'talk') { if (typeof dlgTap === 'function') dlgTap(); else STATE.mode = 'play'; } else if (STATE.mode === 'select' && G.sel) pickCard(0); else { hideUI(); G.sel = null; STATE.mode = 'play'; } } };
    const T = Object.keys(TOUGH60).filter(k => ENEMIES[k]).slice(0, 3);
    const crowd = (n = 12) => { for (let i = 0; i < n; i++) { const a = i / n * 6.283, r = 50 + (i % 3) * 40; makeEnemy(T[i % T.length], G.p.x + Math.cos(a) * r, G.p.y + Math.sin(a) * r); } };
    const run = (sec, cr) => { for (let i = 0; i < sec * 60; i++) { if (cr && i % 90 === 0) crowd(); settle(); step(1 / 60); if (i % 5 === 0) render(); if (G.result) { G.result = null; G.endT = 0; } } };
    const fresh = () => { SETTINGS.dlgAuto = true; STATE.dev.auto = true; STATE.dev.god = true; newRun(); STATE.mode = 'play'; hideUI(); G.sel = null; G.storyOn = true; run(1); applyHero60('berserker'); settle(); };
    const B = () => G.b60, base = () => baseW();
    // 1. 선택·고유 규칙
    fresh();
    ok(G.p.job === 'berserker' && HERO60.berserker.impl, '광전사 선택·구현 상태');
    ok(heroDials60().some(d => d.ic === '투'), '투지 주기 표시');
    run(6, 1); ok(B().fury > 0 || B().mode, '전투로 투지 충전 (' + Math.round(B().fury) + ')');
    const cdN = wStats(base()).cd; B().fury = 99; B().idle = 0; furyGain60(5);
    ok(B().mode === 'rage' && heroStatus60('').startsWith('격노'), '투지 가득 → 격노·상태 글자');
    const cd0 = wStats(base()).cd; ok(Math.abs(cd0 * 1.25 - cdN) < 0.01, '격노 중 대검 속도 +25% (' + cdN.toFixed(2) + ' → ' + cd0.toFixed(2) + ')');
    ok(Math.abs(playerHurtMul() - 0.85) < 0.01, '격노 받는 피해 -15%');
    run(9); ok(!B().mode, '격노 8초 후 종료');
    G.enemies.length = 0; B().fury = 50; B().idle = 5; const f1 = B().fury; for (let i = 0; i < 60; i++) { G.enemies.length = 0; step(1 / 60); } ok(B().fury < f1, '피격·명중 없으면 투지 감소 (' + f1 + ' → ' + Math.round(B().fury) + ')');
    // 2. 발현 A → 무기 각성 A 회오리
    const w = base(); w.br = w.aw = null; w.brQ = false; G.pendingBr = []; w.lvl = 3; checkBranch('w', w.id); ok(G.pendingBr.some(q => q.id === 'cleave'), 'Lv 3 발현 대기');
    G.pendingBr = []; applyBranch({ t: 'branch', id: 'cleave', k: 'A', kind: 'w' }); ok(w.br === 'A', '발현 A 광역 베기');
    w.lvl = 5; checkBranch('w', w.id); ok(w.aw === 'A', '무기 각성 A 자동 (회오리 베기)');
    run(15, 1); ok((S60().spin || 0) > 0, '회오리 베기 발동 (' + (S60().spin || 0) + '회)');
    // 3. 기본 궁극기 대지 분쇄
    crowd(); const u0 = G.stats.dmg.ult || 0; G.p.ult = JOB_CFG.ultNeed; useUlt(); run(2); ok((G.stats.dmg.ult || 0) > u0, '대지 분쇄 피해');
    // 4. 인물 각성 A 광란 + 광란의 포효
    applyAw60('A'); ok(G.p.job2 === 'A' && B().max === 100, '인물 각성 A 광란');
    B().fury = 100; furyGain60(1); B().mode || furyStart60(); ok(B().mode === 'frenzy', '광란: 게이지형 격노');
    run(3); const fr = B().fury; furyGain60(10); ok(B().fury > fr || !B().mode, '광란 중 충전');
    G.p.ult = JOB_CFG.ultNeed; useUlt(); run(1.2); ok(B().roar > 0 && ultSpdMul() > 1.2, '광란의 포효: 이동 증가');
    run(6, 1); ok((G.stats.dmg.b60burn || 0) > 0, '광란의 포효 화상 피해 (' + Math.round(G.stats.dmg.b60burn || 0) + ')');
    ok((G.stats.dmg.b60boom || 0) >= 0, '처치 폭발 (' + Math.round(G.stats.dmg.b60boom || 0) + ')');
    // 5. 발현 B → 무기 각성 B 찌르기 + 인물 각성 B 광폭 + 분출 강타
    fresh();
    const w2 = base(); w2.br = w2.aw = null; w2.brQ = false; G.pendingBr = []; w2.lvl = 3; checkBranch('w', w2.id); G.pendingBr = []; applyBranch({ t: 'branch', id: 'cleave', k: 'B', kind: 'w' }); w2.lvl = 5; checkBranch('w', w2.id);
    ok(w2.br === 'B' && w2.aw === 'B', '발현 B 무거운 베기 → 무기 각성 B 찌르기');
    run(15, 1); ok((S60().thrust || 0) > 0, '찌르기 발동 (' + (S60().thrust || 0) + '회)');
    applyAw60('B'); ok(B().max === 60, '인물 각성 B 광폭: 투지 가득 60');
    B().fury = 59; furyGain60(5); ok(B().mode === 'ramp', '폭주 진입');
    ok(wStats(w2).area > 1.15 && Math.abs(playerHurtMul() - 0.7) < 0.01, '폭주: 범위 +20%·받는 피해 -30%');
    const e0 = S60().furyEnd || 0; render(); run(7); ok((S60().furyEnd || 0) > e0, '폭주 4초 후 종료 (' + B().mode + ' ' + B().rageT.toFixed(2) + ' ' + G.time.toFixed(1) + ')');
    crowd(16); const u1 = G.stats.dmg.ult || 0; G.p.ult = JOB_CFG.ultNeed; useUlt(); run(0.6); ok(B().mode === 'ramp', '분출 강타 착지 즉시 폭주'); run(1.5); ok((G.stats.dmg.ult || 0) > u1, '분출 강타 피해');
    // 6. 연성 7종 (4 + 3, 무기 칸 4칸)
    const groups = [['dagger', 'arrow', 'turret', 'fireball'], ['lamp', 'bell', 'thorn']];
    for (const ids of groups) {
      fresh();
      for (const id of ids) { G.p.weapons.push({ id, lvl: 5, t: 0.2 }); applyFuse60(id); settle(); }
      ok(ids.every(id => G.p.weapons.find(x => x.id === id && x.fu && x.fu.nm === FUSE60_NM.berserker[id])), '연성 카드 적용: ' + ids.map(id => FUSE60_NM.berserker[id]).join('·'));
      const d0 = Object.assign({}, G.stats.dmg);
      run(25, 1); B().fury = B().max - 1; furyGain60(3); run(10, 1);
      for (const id of ids) ok((G.stats.dmg[id] || 0) > (d0[id] || 0), FUSE60_NM.berserker[id] + ' 피해 (' + Math.round((G.stats.dmg[id] || 0) - (d0[id] || 0)) + ')');
    }
    ok((S60().spikeBurst || 0) > 0, '투기 가시: 붙잡힌 적을 대검으로 베면 터짐 (' + (S60().spikeBurst || 0) + '회)');
    ok((S60().drain || 0) > 0 && (G.stats.dmg.bell || 0) > 0, '피의 갈증 줄기·고동 발동');
    return out;
  }).catch(e => ['FAIL 실행 오류 ' + e.message]);
  console.log(res.join('\n'));
  console.log('page errors', errs.length, errs.slice(0, 5));
  const fails = res.filter(l => l.startsWith('FAIL')).length + errs.length;
  console.log(`광전사 점검 ${res.length - res.filter(l => l.startsWith('FAIL')).length}/${res.length} 통과, 페이지 오류 ${errs.length}`);
  await b.close(); SERVER.close(); process.exit(fails ? 1 : 0);
})();
