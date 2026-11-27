// 0.63 궁수 집중 점검: 멈춤 사격·정지 공속·정지 흡수 범위, 장궁 발현 A·B → 무기 각성 A·B, 궁극기 3종(매의 시선 감속 포함),
//   인물 각성 A 매의 눈(서 있는 시간 상승)·B 치고 빠지기(멈춘 직후 강화), 연성 7종 발동·피해·특수 동작, 궁수 전용 자동 플레이, 페이지 오류
// 사용: NODE_PATH=$(npm root -g) node dev/varc63.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), PORT = +(process.env.PORT || 48363);
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
    const crowd = (n = 12) => { for (let i = 0; i < n; i++) { const a = i / n * 6.283, r = 50 + (i % 3) * 40; makeEnemy(T[i % T.length], G.p.x + Math.cos(a) * r, G.p.y + Math.sin(a) * r); } };
    const run = (sec, cr) => { for (let i = 0; i < sec * 60; i++) { if (cr && i % 90 === 0) crowd(); settle(); step(1 / 60); if (i % 5 === 0) render(); if (G.result) { G.result = null; G.endT = 0; } } };
    const runT = sec => { const t1 = G.time + sec; for (let i = 0; i < sec * 600 && G.time < t1; i++) { settle(); step(1 / 60); if (i % 5 === 0) render(); if (G.result) { G.result = null; G.endT = 0; } } };   // 게임 시간 기준 (궁극기 슬로모션 포함)
    const base0 = () => { SETTINGS.dlgAuto = true; STATE.dev.auto = true; STATE.dev.god = true; newRun(); STATE.mode = 'play'; hideUI(); G.sel = null; G.storyOn = true; run(1); };
    const cine = () => { for (let i = 0; i < 600 && G.h47 && G.h47.cine; i++) step(1 / 60); };   // 연출(시간 정지) 끝까지
    const fresh = () => { base0(); G.p.weapons = G.p.weapons.filter(w => w.id === 'arrow'); applyHero60('archer'); settle(); cine(); STATE.dev.auto = false; INPUT.keys = {}; };
    const A = () => G.a63, base = () => baseW(), S6 = () => S60();
    const mv = on => { INPUT.keys = on ? { d: true } : {}; };
    const runM = (sec, cr, move) => { mv(move); run(sec, cr); mv(false); };
    try {
    // 1. 궁수 선택·구현 상태
    fresh();
    ok(G.p.job === 'archer' && HERO60.archer.impl && heroSlotN() === 4 && base() && base().id === 'arrow', '궁수 선택·구현 상태·전용 장궁·일반 무기 4칸');
    ok(HERO60.archer.br.length === 2 && HERO60.archer.wak.A && HERO60.archer.wak.B && FUSE60.archer && Object.keys(FUSE60.archer).length === 7, '발현 2·무기 각성 2·연성 7종 등록');
    // 2. 멈춤 사격 · 정지 공속 · 흡수 범위
    run(1);
    ok(Math.abs(heroStat60(base()).cd - 1 / (1 + A63C.still.spd)) < 1e-6, '정지 중 장궁 간격 ×1/' + (1 + A63C.still.spd) + ' (공속 +' + Math.round(A63C.still.spd * 100) + '%, 실제 ' + wStats(base()).cd.toFixed(2) + '초)');
    const r0 = pickR(); mv(true); step(1 / 60); const r1 = pickR();
    ok(Math.abs(r0 / r1 - 1.6) < 0.01, '정지 중 경험치 흡수 범위 +60% (' + Math.round(r1) + ' → ' + Math.round(r0) + ')');
    ok(heroStat60(base()).cd === 1 && heroStatus60('').includes('이동'), '이동 중 공속 보너스 없음·상태 글자');
    let d0 = G.stats.dmg.arrow || 0, h0 = S6().held || 0; runM(4, 1, true);
    ok((G.stats.dmg.arrow || 0) === d0 && (S6().held || 0) > h0, '이동 중 장궁 발동 없음 (대기 ' + ((S6().held || 0) - h0) + '회)');
    d0 = G.stats.dmg.arrow || 0; run(4, 1);
    ok((G.stats.dmg.arrow || 0) > d0, '멈추면 장궁 발동 (' + Math.round((G.stats.dmg.arrow || 0) - d0) + ')');
    G.p.weapons.push({ id: 'bell', lvl: 1, t: 0.2 }); const bw = G.p.weapons.find(w => w.id === 'bell');
    ok(heroStat60(bw).cd === 1, '일반 무기(짝 무기 기본형)는 정지 공속 없음');
    d0 = G.stats.dmg.bell || 0; runM(4, 1, true); ok((G.stats.dmg.bell || 0) > d0, '일반 무기는 이동 중에도 발동');
    G.p.weapons = G.p.weapons.filter(w => w !== bw);
    // 3. 장궁 발현 A 연사 → 무기 각성 A 속사 연발
    fresh(); let w = base(); w.lvl = 3; checkBranch('w', w.id); ok(G.pendingBr.some(q => q.id === 'arrow'), 'Lv 3 장궁 발현 대기');
    G.pendingBr = []; applyBranch({ t: 'branch', id: 'arrow', k: 'A', kind: 'w' }); ok(w.br === 'A', '발현 A 연사');
    const n0 = A().ar.length; const e0 = makeEnemy(T[0], G.p.x + 120, G.p.y); e0.hp = e0.mhp = 9999; w.t = 0; step(1 / 60); const n1 = A().ar.length; runT(0.15);
    ok(n1 - n0 >= 1 && (A().ar.length >= 2 || (G.stats.dmg.arrow || 0) > 0), '연사: 한 발동에 2발 (0.1초 간격)');
    e0.dead = true; G.enemies = G.enemies.filter(e => !e.dead);
    w.lvl = 5; checkBranch('w', w.id); ok(w.aw === 'A', '무기 각성 A 자동 (속사 연발)');
    run(10, 1); ok((S6().volley || 0) > 0, '속사 연발 발동 (' + S6().volley + '회)');
    // 4. 발현 B 꿰뚫기 → 무기 각성 B 거대 화살
    fresh(); w = base(); w.lvl = 3; checkBranch('w', w.id); G.pendingBr = []; applyBranch({ t: 'branch', id: 'arrow', k: 'B', kind: 'w' });
    const L3 = [0, 1, 2].map(i => makeEnemy(T[0], G.p.x + 80 + i * 60, G.p.y)); L3.forEach(e => { e.hp = e.mhp = 9999; e.frz = 99; }); const hp3 = L3.map(e => e.hp);
    w.t = 0; runT(0.8); ok(L3.every((e, i) => e.hp < hp3[i]), '꿰뚫기: 일직선 적 3마리 모두 맞음');
    L3.forEach(e => e.dead = true); G.enemies = G.enemies.filter(e => !e.dead);
    w.lvl = 5; checkBranch('w', w.id); ok(w.br === 'B' && w.aw === 'B', '발현 B 꿰뚫기 → 무기 각성 B 거대 화살');
    run(10, 1); ok((S6().giant || 0) > 0, '거대 화살 발동 (' + S6().giant + '회)');
    // 5. 기본 궁극기 사냥 개시 (이동 중에도 5초 사격)
    fresh(); crowd(16); const u0 = G.stats.dmg.ult || 0; G.p.ult = JOB_CFG.ultNeed; useUlt(); runT(1.6);
    ok((G.stats.dmg.ult || 0) > u0 && (S6().hunt || 0) > 0, '사냥 개시: 화살비 피해 (' + Math.round((G.stats.dmg.ult || 0) - u0) + ')');
    crowd(16); d0 = G.stats.dmg.arrow || 0; mv(true); runT(2); const hs = heroStatus60(''); mv(false);
    ok((G.stats.dmg.arrow || 0) > d0 && hs.startsWith('사냥 개시'), '사냥 개시 중 이동하며 장궁 발동·상태 글자');
    runT(2.5); mv(true); runT(0.8); d0 = G.stats.dmg.arrow || 0; runT(2); mv(false); ok((G.stats.dmg.arrow || 0) === d0, '5초 뒤 다시 멈춤 사격');
    // 6. 인물 각성 A 매의 눈 · 매의 시선
    fresh(); applyAw60('A'); cine(); mv(true); step(1 / 60); mv(false);
    runT(0.5); const bA = stillBonus63(); runT(1.5); const bB = stillBonus63(); runT(1.5); const bC = stillBonus63();
    const s0 = A63C.still.spd, sM = A63C.eye.max; ok(Math.abs(bA - s0) < 1e-6 && bB > s0 && bB < sM && Math.abs(bC - sM) < 1e-6, `매의 눈: 서 있는 시간에 따라 공속 +${Math.round(s0 * 100)}% → +${Math.round(bB * 100)}% → +${Math.round(sM * 100)}%`);
    G.enemies.forEach(e => e.dead = true); G.enemies = G.enemies.filter(e => !e.dead); mv(true); step(1 / 60); mv(false);
    const sl = makeEnemy('slime', G.p.x + 150, G.p.y); sl.speed = 60; const x0 = sl.x; for (let i = 0; i < 30; i++) step(1 / 60); const dN = x0 - sl.x;
    G.p.ult = JOB_CFG.ultNeed; useUlt(); runT(0.1); const x1 = sl.x; for (let i = 0; i < 30; i++) step(1 / 60); const dS = x1 - sl.x;
    ok(A().gaze > 3 && dS < dN * 0.65 && Math.abs(stillBonus63() - A63C.eye.max) < 1e-6, `매의 시선: 적 이동 감속 (${dN.toFixed(1)} → ${dS.toFixed(1)})·정지 공속 즉시 최대`);
    // 7. 인물 각성 B 치고 빠지기 · 화살 폭풍
    fresh(); applyAw60('B'); cine(); crowd(10); const hb0 = S6().hb || 0;
    for (let k = 0; k < 6; k++) { runM(0.4, 0, true); runT(1.0); }
    ok((S6().hb || 0) > hb0, '치고 빠지기: 움직였다 멈춘 직후 첫 발동 강화 (' + ((S6().hb || 0) - hb0) + '회)');
    const hb1 = S6().hb || 0; runT(3); ok((S6().hb || 0) === hb1, '계속 서 있으면 강화 없음');
    crowd(16); const u1 = G.stats.dmg.ult || 0; G.p.ult = JOB_CFG.ultNeed; useUlt(); runT(1); ok(A().storm > 0 && heroStatus60('') === '화살 폭풍', '화살 폭풍: 사방 난사·상태 글자');
    runT(2.2); ok((G.stats.dmg.ult || 0) > u1 && A().stormBuf > 3, '화살 폭풍 피해 (' + Math.round((G.stats.dmg.ult || 0) - u1) + ') → 4초 첫 발동 강화');
    const hs0 = S6().hbStorm || 0; crowd(); runT(2); ok((S6().hbStorm || 0) > hs0, '폭풍 뒤 모든 발동 강화 (' + ((S6().hbStorm || 0) - hs0) + '회)');
    // 8. 연성 7종 (일반 무기 4칸: 4개 + 3개)
    const groups = [['cleave', 'dagger', 'turret', 'fireball'], ['lamp', 'bell', 'thorn']];
    for (const ids of groups) {
      fresh();
      for (const id of ids) { G.p.weapons.push({ id, lvl: 5, t: 0.2 }); applyFuse60(id); settle(); cine(); }
      STATE.dev.auto = false;
      ok(ids.every(id => G.p.weapons.find(x => x.id === id && x.fu && x.fu.nm === FUSE60_NM.archer[id])), '연성 적용: ' + ids.map(id => FUSE60_NM.archer[id]).join('·'));
      const dd = Object.assign({}, G.stats.dmg); run(20, 1);
      for (const id of ids) ok((G.stats.dmg[id] || 0) > (dd[id] || 0), FUSE60_NM.archer[id] + ' 피해 (' + Math.round((G.stats.dmg[id] || 0) - (dd[id] || 0)) + ')');
      if (ids.includes('cleave')) ok((S6().moonN || 0) > (S6().cleaveHits0 || 0), '초승달촉: 칼날 폭 안 함께 베임 (' + S6().moonN + '마리)');
      if (ids.includes('turret')) { ok((S6().perch || 0) > 0 && (S6().hawk || 0) > 0 && A().perches.length <= 3, `매 횃대: 설치 ${S6().perch}·매 공격 ${S6().hawk}·최대 3개`);
        const hk0 = S6().hawk || 0, pc0 = S6().perch || 0; runM(3, 1, true); ok((S6().hawk || 0) > hk0, '궁수가 움직여도 매는 싸움 (' + ((S6().hawk || 0) - hk0) + '회)'); ok((S6().perch || 0) === pc0, '움직이는 동안 새 횃대 없음'); }
      if (ids.includes('fireball')) ok((S6().fireN || 0) > 0, '불화살: 무리 한가운데 폭발 (' + S6().fireN + '회)');
      if (ids.includes('lamp')) { ok((S6().barb || 0) > 0 && (S6().reel || 0) > 0, `미늘 줄화살: 박기 ${S6().barb}·되감아 다시 박기 ${S6().reel}`);
        const lw = G.p.weapons.find(x => x.id === 'lamp'); mv(true); step(1 / 60); step(1 / 60); ok(!lw.lk63, '움직이면 줄이 풀림'); mv(false); }
      if (ids.includes('bell')) ok((S6().whistle || 0) > 0 && (S6().whPass || 0) > 0, `우는살: 꽂힌 자리 고리 ${S6().whistle}·지나는 길 멈칫 ${S6().whPass}`);
      if (ids.includes('thorn')) ok((S6().vineN || 0) > 0, '가시줄 화살: 묶음 (' + S6().vineN + '마리)');
      runM(1, 0, true); const dm = Object.assign({}, G.stats.dmg); runM(3, 1, true);   // 이미 날아가던 화살·예약 폭발이 끝난 뒤부터 집계
      const mvd = ids.filter(id => id !== 'turret').map(id => [id, (G.stats.dmg[id] || 0) - (dm[id] || 0)]).filter(a => a[1] >= 1);
      ok(!mvd.length, '이동 중 연성 발동 없음 (매 제외)' + (mvd.length ? ' ' + JSON.stringify(mvd) : ''));
    }
    // 9. 궁수 전용 자동 플레이 (멈춰 쏘기)
    fresh(); STATE.dev.auto = true; INPUT.keys = {}; const st0 = S6().rngStill || 0, mt0 = S6().rngMove || 0; run(60, 0);   // 실제 출현 흐름 (인위적 몰이 없음)
    const st = (S6().rngStill || 0) - st0, mt = (S6().rngMove || 0) - mt0;
    ok(st > mt && (S6().aMove || 0) > 0 && (S6().aStand || 0) > 0, `자동 플레이: 사거리 안에 적이 있을 때 서 있는 시간 ${st.toFixed(1)}초 > 이동 ${mt.toFixed(1)}초, 이동 ${S6().aMove}회 (${JSON.stringify(S6().aWhy || {})})`);
    ok((G.stats.dmg.arrow || 0) > 0, '자동 플레이 중 장궁 피해 (' + Math.round(G.stats.dmg.arrow || 0) + ')');
    fresh(); applyAw60('B'); cine(); STATE.dev.auto = true; const hb2 = S6().hb || 0; run(90, 0);
    ok(((S6().aWhy || {}).hop || 0) > 0 && (S6().hb || 0) > hb2, '자동 플레이 각성 B: 짧게 물러섰다 멈추기 (' + ((S6().aWhy || {}).hop || 0) + '회, 강화 ' + ((S6().hb || 0) - hb2) + '회)');
    render();
    } catch (e) { ok(false, '실행 오류 ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' / ')); }
    return out;
  }).catch(e => ['FAIL 실행 오류 ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' / ')]);
  console.log(res.join('\n'));
  console.log('page errors', errs.length, errs.slice(0, 5));
  const fails = res.filter(l => l.startsWith('FAIL')).length + errs.length;
  console.log(`궁수 점검 ${res.length - res.filter(l => l.startsWith('FAIL')).length}/${res.length} 통과, 페이지 오류 ${errs.length}`);
  await b.close(); SERVER.close(); process.exit(fails ? 1 : 0);
})();
