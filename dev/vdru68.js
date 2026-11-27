// 0.68 드루이드 집중 점검: 야수 변신(1.5초 멈춤·4초 재전환 불가·형태 효과·전환 효과), 가시 덩굴 발현 A·B → 덤불·가시꽃, 궁극기 3종, 인물 각성 A·B, 연성 7종, 자동 플레이, 페이지 오류
//
// 사용: NODE_PATH=$(npm root -g) node dev/vdru68.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), PORT = +(process.env.PORT || 48368);
const SERVER = http.createServer((q, s) => { const u = decodeURIComponent((q.url || '/').split('?')[0]), f = path.join(ROOT, u); if (/\.(png|woff2|webmanifest)$/.test(u) && fs.existsSync(f)) return s.end(fs.readFileSync(f)); s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(fs.readFileSync(path.join(ROOT, 'index.html'))); });
(async () => {
  await new Promise(r => SERVER.listen(PORT, '127.0.0.1', r));
  const b = await chromium.launch({ args: ['--disable-gpu'] }), p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://127.0.0.1:${PORT}/`); await p.waitForTimeout(1500);
  const res = await p.evaluate(() => {
    const out = [], ok = (c, m) => out.push((c ? 'ok  ' : 'FAIL') + ' ' + m);
    const settle = () => { let g = 0; while (STATE.mode !== 'play' && g++ < 20) { if (STATE.mode === 'talk') { if (typeof dlgTap === 'function') dlgTap(); else STATE.mode = 'play'; } else if (STATE.mode === 'select' && G.sel) { if (G.sel.kind === 'keep') keepOk60(); else pickCard(0); } else { hideUI(); G.sel = null; STATE.mode = 'play'; } } };
    const T = Object.keys(TOUGH60).filter(k => ENEMIES[k]).slice(0, 3);
    const crowd = (n = 12, type) => { for (let i = 0; i < n; i++) { const a = i / n * 6.283, r = 50 + (i % 3) * 40; makeEnemy(type || T[i % T.length], G.p.x + Math.cos(a) * r, G.p.y + Math.sin(a) * r); } };
    const run = (sec, cr, type) => { for (let i = 0; i < sec * 60; i++) { if (cr && i % 90 === 0) crowd(12, type); settle(); step(1 / 60); if (i % 5 === 0) render(); if (G.result) { G.result = null; G.endT = 0; } } };
    const runT = sec => { const t1 = G.time + sec; for (let i = 0; i < sec * 600 && G.time < t1; i++) { settle(); step(1 / 60); if (i % 5 === 0) render(); if (G.result) { G.result = null; G.endT = 0; } } };
    const base0 = () => { SETTINGS.dlgAuto = true; STATE.dev.auto = true; STATE.dev.god = true; newRun(); STATE.mode = 'play'; hideUI(); G.sel = null; G.storyOn = true; run(1); };
    const cine = () => { for (let i = 0; i < 600 && G.h47 && G.h47.cine; i++) step(1 / 60); };
    const clear = () => { G.enemies.forEach(e => e.dead = true); G.enemies = G.enemies.filter(e => !e.dead); };
    const fresh = () => { base0(); G.p.weapons = G.p.weapons.filter(w => w.id === 'thorn'); applyHero60('druid'); settle(); cine(); STATE.dev.auto = false; INPUT.keys = {}; G.p.need = 1e9; clear(); };
    try {
    const P = () => G.d68, base = () => baseW(), S6 = () => S60();
    const tank = (x, y, n = 1) => { const L = []; for (let i = 0; i < n; i++) { const e = makeEnemy(T[0], x + i * 30, y); e.hp = e.mhp = 1e6; e.frz = 99; L.push(e); } return L; };
    const mv = on => { INPUT.keys = on ? { d: true, ArrowRight: true } : {}; };
    // 1. 선택·구현 상태
    fresh();
    ok(G.p.job === 'druid' && HERO60.druid.impl && heroSlotN() === 4 && base() && base().id === 'thorn', '드루이드 선택·구현 상태·전용 가시 덩굴·일반 무기 4칸');
    ok(HERO60.druid.br.length === 2 && HERO60.druid.wak.A && HERO60.druid.wak.B && Object.keys(FUSE60.druid).length === 7, '발현 2·무기 각성 2·연성 7종 등록');
    // 2. 야수 변신
    ok(P().form === 'wolf', '늑대로 시작');
    base().t = 99; runT(1.4); ok(P().form === 'wolf', '1.4초 멈춤: 아직 늑대'); runT(0.2); ok(P().form === 'bear' && (S6().slam || 0) === 1, '1.5초 멈추면 곰 전환 + 내려찍기 충격');
    runT(3.5); ok(P().form === 'bear', '전환 후 4초 재전환 불가'); runT(2.2); ok(P().form === 'wolf' && (S6().roar || 0) === 1, '4초 뒤 다시 1.5초 멈추면 늑대 + 포효');
    mv(1); runT(3); ok(P().form === 'wolf' && P().still === 0, '움직이는 동안은 전환 없음'); mv(0);
    // 형태 효과
    P().form = 'wolf'; const sW = HERO60.druid.spdMul(), cW = HERO60.druid.stat(base()).cd; P().form = 'bear'; const hB = HERO60.druid.hurtMul(), aB = HERO60.druid.stat(base()).area; P().form = 'wolf';
    ok(Math.abs(sW - 1.2) < 1e-6 && Math.abs(cW - 1 / 1.3) < 1e-6, `늑대: 이동 +20%·발동 속도 +30% (${sW.toFixed(2)}·${(1 / cW).toFixed(2)})`);
    ok(Math.abs(hB - 0.7) < 1e-6 && Math.abs(aB - 1.3) < 1e-6, `곰: 받는 피해 -30%·범위 +30% (${hB.toFixed(2)}·${aB.toFixed(2)})`);
    const gw = { id: 'dagger', lvl: 1, t: 0 }; G.p.weapons.push(gw); ok(Math.abs(wStats(gw).cd - wStats({ id: 'dagger', lvl: 1 }).cd) < 1e-9 && heroStat60(gw).cd === 1, '일반 무기는 형태 효과 밖'); G.p.weapons = G.p.weapons.filter(x => x !== gw);
    // 포효: 적이 바깥으로 물러남
    fresh(); base().t = 99; P().form = 'bear'; P().lock = 0; const r1 = makeEnemy('slime', G.p.x + 50, G.p.y); r1.hp = r1.mhp = 1e6; r1.frz = 1.45; const d0 = Math.hypot(r1.x - G.p.x, r1.y - G.p.y); runT(1.62);
    ok(P().form === 'wolf' && Math.hypot(r1.x - G.p.x, r1.y - G.p.y) > d0 + 5, '포효: 주변 적이 바깥으로 물러남 (' + d0.toFixed(0) + ' → ' + Math.hypot(r1.x - G.p.x, r1.y - G.p.y).toFixed(0) + ')');
    // 3. 가시 덩굴 기본 + 형태별 간격·반경
    fresh(); P().lock = 99; const e0 = tank(G.p.x + 100, G.p.y)[0]; base().t = 0; step(1 / 60); const tW = base().t;
    ok(e0.hp < 1e6 && Math.abs(tW - wStats(base()).cd) < 0.02 && wStats(base()).cd < 1.05, '늑대: 덩굴 약 1.0초 간격 (' + tW.toFixed(2) + ')');
    // 4. 발현 A 얽는 덩굴 → 덩굴 덤불
    fresh(); P().lock = 99; let w = base(); w.lvl = 3; checkBranch('w', w.id); ok(G.pendingBr.some(q => q.id === 'thorn'), 'Lv 3 가시 덩굴 발현 대기');
    G.pendingBr = []; applyBranch({ t: 'branch', id: 'thorn', k: 'A', kind: 'w' }); tank(G.p.x + 100, G.p.y); tank(G.p.x + 100, G.p.y + 62); tank(G.p.x + 155, G.p.y - 35); w.t = 0; step(1 / 60);
    ok((S6().tangle || 0) === 2, '얽는 덩굴: 줄기가 2마리에게 더 뻗음 (' + S6().tangle + ')');
    w.lvl = 5; checkBranch('w', w.id); ok(w.aw === 'A', '무기 각성 A 덩굴 덤불 자동'); clear(); const bz = makeEnemy('slime', G.p.x + 100, G.p.y); bz.hp = bz.mhp = 1e6; w.t = 0; runT(3.2);
    ok((S6().bush || 0) > 0 && (S6().bushHit || 0) >= 2 && P().bushes.length <= 6, `덩굴 덤불: ${S6().bush}개·들어온 적 피해 ${S6().bushHit}회·동시 ${P().bushes.length}`);
    // 5. 발현 B 가시 창 → 가시꽃
    fresh(); P().lock = 99; w = base(); w.lvl = 3; checkBranch('w', w.id); G.pendingBr = []; applyBranch({ t: 'branch', id: 'thorn', k: 'B', kind: 'w' });
    const sp1 = tank(G.p.x + 100, G.p.y)[0], dA = G.stats.dmg.thorn || 0; w.t = 0; step(1 / 60);
    ok(Math.abs(((G.stats.dmg.thorn || 0) - dA) / wStats(w).dmg - 1.5) < 0.02, '가시 창: 피해 +50% (' + (((G.stats.dmg.thorn || 0) - dA) / wStats(w).dmg).toFixed(2) + ')');
    w.lvl = 5; checkBranch('w', w.id); ok(w.aw === 'B', '무기 각성 B 가시꽃 자동'); tank(G.p.x + 160, G.p.y); w.t = 0; runT(0.5);
    ok((S6().bloom || 0) >= 1 && (S6().bloomHit || 0) >= 1, '가시꽃: 0.3초 뒤 6방향 가시 줄기 (' + S6().bloom + '회·' + S6().bloomHit + '마리)');
    // 6. 기본 궁극기 수호목
    fresh(); P().lock = 99; crowd(12); G.enemies.forEach(e => { e.hp = e.mhp = 1e6; }); base().t = 99; G.p.hp = G.p.maxHp * 0.5; const u0 = G.stats.dmg.ult || 0, hp0 = G.p.hp;
    G.p.ult = JOB_CFG.ultNeed; useUlt(); runT(2.7);
    ok((S6().branch || 0) === 4 && (G.stats.dmg.ult || 0) > u0, '수호목: 가지 4번 내려치기 (' + S6().branch + ')');
    ok((S6().treeHeal || 0) === 1 && G.p.hp >= hp0 + G.p.maxHp * 0.099, '수호목: 사라지며 체력 10% 회복');
    // 7. 인물 각성 A 깊어지는 야성 · 만월
    fresh(); applyAw60('A'); cine(); base().t = 99; mv(1); runT(0.2); P().keep = 0; runT(5.8); ok(wildLv68() === 1, '깊어지는 야성: 6초 전 1단계'); runT(0.4); ok(wildLv68() === 2, '6초 2단계');
    runT(6.2); ok(wildLv68() === 3 && Math.abs(HERO60.druid.spdMul() - 1.4) < 1e-6, '12초 3단계·형태 효과 2배 (이동 +' + Math.round((HERO60.druid.spdMul() - 1) * 100) + '%)'); mv(0);
    runT(1.6); ok(P().form === 'bear' && wildLv68() === 1, '바꾸면 1단계부터');
    P().lock = 0; const m0 = S6().slam || 0; G.p.ult = JOB_CFG.ultNeed; useUlt(); ok(wildLv68() === 3 && (S6().slam || 0) === m0 + 1, '만월: 단번에 3단계·전환 효과');
    P().lock = 0; runT(1.6); ok(P().form === 'wolf' && wildLv68() === 3, '만월: 바꿔도 3단계 유지'); runT(7); ok(wildLv68() < 3, '만월 8초 뒤 해제');
    // 8. 인물 각성 B 자연의 응답 · 숲의 부름
    fresh(); applyAw60('B'); cine(); base().t = 99; crowd(10); G.enemies.forEach(e => { e.hp = e.mhp = 1e6; e.frz = 0; }); P().lock = 0; const a0 = S6().answer || 0; runT(1.6);
    ok((S6().answer || 0) === a0 + 1 && (S6().answerHit || 0) >= 3, '자연의 응답: 곰 변신 순간 원형 덩굴 분출 (' + S6().answerHit + '마리)');
    G.p.ult = JOB_CFG.ultNeed; useUlt(); ok(!!P().forest, '숲의 부름: 숲 생성');
    const sl = makeEnemy('slime', P().forest.x + 100, P().forest.y); ok(Math.abs(chronoSlow(sl) / _chronoSlowD68(sl) - 0.7) < 1e-6, '숲 안 적 이동 -30%');
    P().lock = 0; const fv = S6().forestVine || 0; runT(1.7); ok((S6().forestVine || 0) === fv + 1, '숲 안에서 변신하면 숲 전체에서 덩굴'); runT(7); ok(!P().forest, '숲 8초 뒤 사라짐');
    // 9. 연성 7종
    const groups = [['cleave', 'dagger', 'arrow', 'turret'], ['fireball', 'lamp', 'bell']];
    for (const ids of groups) {
      fresh(); P().lock = 99;
      for (const id of ids) { G.p.weapons.push({ id, lvl: 5, t: 0.2 }); applyFuse60(id); settle(); cine(); }
      STATE.dev.auto = false; base().t = 999;
      ok(ids.every(id => G.p.weapons.find(x => x.id === id && x.fu && x.fu.nm === FUSE60_NM.druid[id])), '연성 적용: ' + ids.map(id => FUSE60_NM.druid[id]).join('·'));
      const dd = Object.assign({}, G.stats.dmg); run(20, 1);
      for (const id of ids) ok((G.stats.dmg[id] || 0) > (dd[id] || 0), FUSE60_NM.druid[id] + ' 피해 (' + Math.round((G.stats.dmg[id] || 0) - (dd[id] || 0)) + ')');
      if (ids.includes('cleave')) ok((S6().swipe2 || 0) > 0, '앞발 휩쓸기: 반대쪽 앞발 ' + S6().swipe2);
      if (ids.includes('dagger')) ok((S6().leafMax || 0) === 3, '칼잎: 3마리 동시 (' + S6().leafMax + ')');
      if (ids.includes('arrow')) ok((S6().hawkMax || 0) >= 2, '매 강하: 지나는 길 관통 (최대 ' + S6().hawkMax + '마리)');
      if (ids.includes('turret')) ok((S6().spit || 0) > 0 && (S6().poolTk || 0) > 0 && P().flowers.length <= 3, `식충 꽃: 독액 ${S6().spit}·바닥 피해 ${S6().poolTk}·현재 ${P().flowers.length}개`);
      if (ids.includes('fireball')) ok((S6().shroom || 0) > 0, '포자 버섯: 펑 ' + S6().shroom);
      if (ids.includes('lamp')) ok((S6().rootMax || 0) === 2, '생명 뿌리: 2마리 (' + S6().rootMax + ')');
      if (ids.includes('bell')) { ok((S6().pollen || 0) > 0, '초롱꽃: 꽃가루 ' + S6().pollen); clear(); const e = makeEnemy('slime', G.p.x + 80, G.p.y); e.hp = e.mhp = 1e6; for (const x of G.p.weapons) x.t = 9; G.p.weapons.find(x => x.id === 'bell').t = 0; step(1 / 60); e.stg51 = 0; ok(Math.abs(chronoSlow(e) / _chronoSlowD68(e) - 0.8) < 1e-6, '초롱꽃: 남은 꽃가루 안 적 이동 -20%'); }
      // 형태에 따라 모습만 바뀜: 곰 = 범위 +30%
      P().form = 'bear'; const s1 = wStats(G.p.weapons.find(x => x.fu)).area; P().form = 'wolf'; const s2 = wStats(G.p.weapons.find(x => x.fu)).area; ok(Math.abs(s1 / s2 - 1.3) < 1e-6, '연성 무기도 곰 범위 +30%');
    }
    // 10. 자동 플레이
    fresh(); STATE.dev.auto = true; run(90, 1);
    ok((G.stats.dmg.thorn || 0) > 0 && (S6().shift || 0) > 0, `자동 플레이: 덩굴 피해 ${Math.round(G.stats.dmg.thorn || 0)}·변신 ${S6().shift || 0}회·곰 ${Math.round(S6().bearT || 0)}초·늑대 ${Math.round(S6().wolfT || 0)}초`);
    ok(/^(늑대|곰|수호목)/.test(heroStatus60('')), '상태 글자 (' + heroStatus60('') + ')');
    render();
    } catch (e) { ok(false, '실행 오류 ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' / ')); }
    return out;
  }).catch(e => ['FAIL 실행 오류 ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' / ')]);
  console.log(res.join('\n'));
  console.log('page errors', errs.length, errs.slice(0, 5));
  const fails = res.filter(l => l.startsWith('FAIL')).length + errs.length;
  console.log(`드루이드 점검 ${res.length - res.filter(l => l.startsWith('FAIL')).length}/${res.length} 통과, 페이지 오류 ${errs.length}`);
  await b.close(); SERVER.close(); process.exit(fails ? 1 : 0);
})();
