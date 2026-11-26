// 0.62 도적·치명타 공통 집중 점검: 치명타 1회 판정·1.5배·보조 효과 치명타·통달 Lv 5·압도, 남길 무기 고르기,
//   그림자 연격(기본 1번·각성 A 연격 3번·각성 B 상처), 단검 발현 A·B → 무기 각성 A·B, 궁극기 3종, 연성 7종 발동·피해·특수 동작, 통나무 유인, 페이지 오류
// 사용: NODE_PATH=$(npm root -g) node dev/vrog62.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), PORT = +(process.env.PORT || 48362);
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
    const fresh = () => { base0(); G.p.weapons = G.p.weapons.filter(w => w.id === 'dagger'); applyHero60('rogue'); settle(); cine(); };
    const R = () => G.r62, base = () => baseW(), S6 = () => S60();
    const C0 = R60C.crit;
    try {
    // 1. 치명타 공통
    base0();
    ok(PASSIVE_ORDER.includes('crit') && PASSIVES.crit.desc(5).includes('20%'), '보조 효과 치명타 신설 (Lv 5 = 20%)');
    ok(!BRANCHES.might.some(o => o.k === 'crit') && BRANCHES.might.some(o => o.k === 'over'), '공격력 통달: 치명 삭제 → 압도');
    const e1 = makeEnemy(T[0], G.p.x + 300, G.p.y), h0 = e1.hp; damageEnemy(e1, 10, { src: 'bell' }); const dN = h0 - e1.hp;
    const e2 = makeEnemy(T[0], G.p.x + 300, G.p.y + 40), h2 = e2.hp; withCR60({ cr: true }, () => damageEnemy(e2, 10, { src: 'bell' })); const dC = h2 - e2.hp;
    ok(Math.abs(dC / dN - 1.5) < 0.01, '치명타 피해 1.5배 (' + dN.toFixed(1) + ' → ' + dC.toFixed(1) + ')');
    const e3 = makeEnemy(T[0], G.p.x + 300, G.p.y - 40), h3 = e3.hp; withCR60({ cr: true }, () => damageEnemy(e3, 10, { src: 'b60boom' }));
    ok(Math.abs((h3 - e3.hp) - dN) < 0.01, '무기가 아닌 피해(처치 폭발 등)는 치명타 없음');
    G.p.passives = [{ id: 'crit', lvl: 5 }]; G.p.weapons.push({ id: 'bell', lvl: 5, t: 0.2 });
    ok(Math.abs(critCh60(G.p.weapons.find(w => w.id === 'bell')) - 0.2) < 1e-9, '보조 효과 치명타 Lv 5: 모든 무기 20%');
    const per = {}; const _dm = damageEnemy; damageEnemy = function (e, d, o = {}) { const r = _dm.apply(this, arguments); if (o.src === 'bell') { const k = G.time.toFixed(4); (per[k] = per[k] || []).push(!!o.crit); } return r; };
    for (let i = 0; i < 40 * 60; i++) { if (i % 60 === 0) crowd(6); settle(); step(1 / 60); if (G.result) { G.result = null; G.endT = 0; } }
    damageEnemy = _dm;
    const fires = Object.values(per).filter(a => a.length > 1), mixed = fires.filter(a => a.some(x => x) && a.some(x => !x)).length, crits = fires.filter(a => a.every(x => x)).length;
    ok(fires.length > 5 && mixed === 0, `치명타 판정 공격 1번에 1회 (여러 적 맞힌 발동 ${fires.length}회, 섞임 ${mixed})`);
    ok(crits > 0, '치명타 발생 (' + crits + '회)');
    const pv = G.p.passives[0]; pv.lvl = 3; pv.br = null; pv.brQ = false; G.pendingBr = []; checkBranch('p', 'crit'); ok(!G.pendingBr.length, 'Lv 3에서는 통달 없음');
    pv.lvl = 5; checkBranch('p', 'crit'); ok(G.pendingBr.some(q => q.kind === 'p' && q.id === 'crit'), 'Lv 5 통달 대기');
    ok(SEL_HEAD.branch({ q: { kind: 'p', id: 'crit' } })[0] === '통달', '통달 화면 제목');
    G.pendingBr = []; applyBranch({ t: 'branch', id: 'crit', k: 'vital', kind: 'p' });
    const e4 = makeEnemy(T[0], G.p.x + 300, G.p.y), h4 = e4.hp; withCR60({ cr: true }, () => damageEnemy(e4, 10, { src: 'bell' })); ok(Math.abs((h4 - e4.hp) / dN - 1.8) < 0.01, '통달 급소: 치명타 1.8배');
    pv.br = 'shake'; const e5 = makeEnemy(T[0], G.p.x + 300, G.p.y + 60); withCR60({ cr: true }, () => damageEnemy(e5, 1, { src: 'bell' })); ok((e5.stg51 || 0) > G.time, '통달 흔들기: 치명타 맞은 적 멈칫');
    G.p.passives = [{ id: 'might', lvl: 5, br: 'over' }]; recalc();
    const e6 = makeEnemy(T[0], G.p.x + 300, G.p.y), a6 = e6.hp; damageEnemy(e6, 10, { src: 'bell' }); const f6 = a6 - e6.hp, b6 = e6.hp; damageEnemy(e6, 10, { src: 'bell' }); const s6 = b6 - e6.hp;
    ok(Math.abs(f6 / s6 - 1.5) < 0.01, '통달 압도: 체력 가득 찬 적 첫 타격 +50%');
    // 2. 도적 선택·무기 칸·남길 무기 고르기
    base0(); G.p.weapons = [{ id: 'dagger', lvl: 2, t: 0.2 }, { id: 'arrow', lvl: 3, t: 0.2 }, { id: 'bell', lvl: 1, t: 0.2 }, { id: 'fireball', lvl: 2, t: 0.2 }, { id: 'thorn', lvl: 1, t: 0.2 }];
    G.p.xp = 0; const lv0 = G.p.level; STATE.dev.auto = false; applyHero60('rogue'); closeSel();
    ok(G.p.job === 'rogue' && HERO60.rogue.impl && heroSlotN() === 2, '도적 선택·구현 상태·일반 무기 2칸');
    ok(G.h60q === 'keep' && G.pendingJob2, '넘친 무기 → 남길 무기 고르기 대기');
    for (let i = 0; i < 300 && STATE.mode === 'play'; i++) step(1 / 60);   // 인물 선택 연출이 끝난 뒤 열림
    ok(STATE.mode === 'select' && G.sel && G.sel.kind === 'keep' && G.sel.n === 2, '남길 무기 화면 (기본 = 레벨 높은 2개: ' + [...G.sel.keep].join('·') + ')');
    ok(UI.querySelectorAll('.sel-keep .card').length === 4 && UI.querySelectorAll('.sel-keep .card.k-drop').length === 2 && !!document.getElementById('keepok'), '화면: 무기 4장·빠짐 2장 흐림·확정 버튼');
    const ix = G.sel.cards.findIndex(c => c.id === 'thorn'); pickCard(ix); ok(G.sel.keep.has('thorn') && G.sel.keep.size === 2, '누르면 남길 무기 교체 (가득 차면 먼저 고른 것과 교체)');
    const keepSet = [...G.sel.keep]; keepOk60(); STATE.dev.auto = true;
    const gen = G.p.weapons.filter(w => !w.base && !w.fu).map(w => w.id).sort();
    ok(STATE.mode === 'play' && gen.length === 2 && gen.join() === keepSet.sort().join() && G.p.weapons.length === 3, '확정: 단검 + 고른 2개만 남음 (' + gen.join('·') + ')');
    ok((S6().keep && S6().keep.xp > 0) && (G.p.xp > 0 || G.p.level > lv0 || G.pendingLv > 0), '빠진 무기 경험치 환급 (' + (S6().keep && S6().keep.xp) + ')');
    const cs = levelCands().filter(c => c.t === 'wnew'); ok(!cs.length, '칸이 가득 차면 새 무기 후보 없음');
    // 3. 고유 규칙: 그림자 연격 (기본형 1번)
    fresh();
    ok(Math.abs(critCh60(base()) - 0.2) < 1e-9, '도적 치명타 확률: 단검 20%');
    G.p.weapons.push({ id: 'bell', lvl: 1, t: 0.2 }); ok(critCh60(G.p.weapons.find(w => w.id === 'bell')) === 0, '일반 무기는 도적 치명타 없음');
    G.p.weapons = G.p.weapons.filter(w => w.id !== 'bell');
    R60C.crit = 1; run(8, 1);
    ok((S6().shadow || 0) > 0, '치명타 → 그림자가 한 번 더 긋기 (' + (S6().shadow || 0) + '회)');
    ok(!(S6().chain > 0) && !(S6().wound > 0), '기본형: 그림자 1번만 (연격·상처 없음)');
    // 4. 인물 각성 A: 연격 최대 3번 + 붉은 X자 / 그림자 분신
    applyAw60('A'); cine(); run(8, 1);
    ok((S6().chain || 0) > 0 && (S6().redX || 0) > 0, '인물 각성 A: 연격 이어짐 (' + S6().chain + '회)·3번째 붉은 X자 (' + S6().redX + '회)');
    crowd(); G.p.ult = JOB_CFG.ultNeed; useUlt(); runT(0.2); ok(R().clone > 7 && heroStatus60('').includes('분신'), '그림자 분신 2명·상태 글자');
    run(4, 1); ok((S6().cloneHit || 0) > 0, '분신이 단검을 따라 함 (' + S6().cloneHit + '회)');
    R60C.crit = C0;
    // 5. 인물 각성 B: 늦게 터지는 상처 / 일섬 → 단검 집중
    fresh(); applyAw60('B'); cine(); R60C.crit = 1; const tank = makeEnemy('brute', G.p.x + 90, G.p.y); tank.hp = tank.mhp = 99999; tank.frz = 99; runT(4); R60C.crit = C0; tank.dead = true; G.enemies = G.enemies.filter(e => !e.dead); gridBuild(G.enemies);
    ok((S6().wound || 0) > 0, '인물 각성 B: 그림자가 그은 자리 상처가 늦게 터짐 (' + S6().wound + '회)');
    R60C.crit = C0;
    STATE.dev.auto = false; G.p.weapons.push({ id: 'bell', lvl: 5, t: 0.2 }); crowd(16); step(1 / 60); const u0 = G.stats.dmg.ult || 0, n0 = S6().slashHit || 0; G.p.ult = JOB_CFG.ultNeed; useUlt(); runT(0.1);
    ok((S6().slashHit || 0) > n0 && (G.stats.dmg.ult || 0) > u0, '일섬: 한 줄 피해 (' + ((S6().slashHit || 0) - n0) + '마리, ' + Math.round((G.stats.dmg.ult || 0) - u0) + ')');
    runT(0.5); ok(R().focus > 3 && heroStatus60('').startsWith('단검 집중'), '0.4초 뒤 단검 집중 (' + (R().focus || 0).toFixed(2) + ' ' + heroStatus60('') + ')');
    const bw = G.p.weapons.find(w => w.id === 'bell'); ok(heroStat60(base()).cd === 0.5 && heroStat60(base()).dmg === 1.3, '단검 집중: 단검 간격 절반·피해 +30%'); runT(1); ok(bw.t > 0.05, '단검 집중: 다른 무기 멈춤');
    runT(4); ok(!(R().focus > 0) && !HERO60.rogue.stat(base()).cd && heroStat60(base()).cd === 1, '집중 끝 · 단검 간격 원래대로'); STATE.dev.auto = true;
    // 6. 기본 궁극기 그림자 잠행
    fresh(); crowd(); G.p.ult = JOB_CFG.ultNeed; useUlt(); runT(0.3);
    ok(G.p.invT > 1.2 && ultSpdMul() > 1.4 && heroStatus60('') === '잠행', '그림자 잠행: 피격 없음·이동 +50%·상태 글자');
    runT(2.2); ok((S6().stealthHit || 0) > 0, '잠행 끝: 스친 적 확정 치명타 (' + (S6().stealthHit || 0) + '마리)');
    // 7. 단검 발현 A → 무기 각성 A 그림자 난무 / 발현 B → 무기 각성 B 그림자 균열
    fresh(); let w = base(); w.lvl = 3; checkBranch('w', w.id); ok(G.pendingBr.some(q => q.id === 'dagger'), 'Lv 3 단검 발현 대기');
    G.pendingBr = []; const cdB = wStats(w).cd; applyBranch({ t: 'branch', id: 'dagger', k: 'A', kind: 'w' }); ok(w.br === 'A', '발현 A 쌍단검');
    w.lvl = 5; checkBranch('w', w.id); ok(w.aw === 'A', '무기 각성 A 자동 (그림자 난무)');
    run(12, 1); ok((S6().flurry || 0) > 0, '그림자 난무 발동 (' + S6().flurry + '회)');
    fresh(); w = base(); w.lvl = 3; checkBranch('w', w.id); G.pendingBr = []; applyBranch({ t: 'branch', id: 'dagger', k: 'B', kind: 'w' }); w.lvl = 5; checkBranch('w', w.id);
    ok(w.br === 'B' && w.aw === 'B', '발현 B 긴 선 → 무기 각성 B 그림자 균열');
    run(12, 1); ok((S6().rift || 0) > 0, '그림자 균열 발동 (' + S6().rift + '회)');
    // 8. 연성 7종 (무기 칸 3: 2개씩 + 1)
    const groups = [['cleave', 'arrow'], ['turret', 'fireball'], ['lamp', 'bell'], ['thorn']];
    for (const ids of groups) {
      fresh();
      for (const id of ids) { G.p.weapons.push({ id, lvl: 5, t: 0.2 }); applyFuse60(id); settle(); cine(); }
      ok(ids.every(id => G.p.weapons.find(x => x.id === id && x.fu && x.fu.nm === FUSE60_NM.rogue[id])), '연성 적용: ' + ids.map(id => FUSE60_NM.rogue[id]).join('·'));
      const d0 = Object.assign({}, G.stats.dmg), sh0 = S6().shadow || 0;
      R60C.crit = 0.6; run(24, 1); R60C.crit = C0;
      for (const id of ids) ok((G.stats.dmg[id] || 0) > (d0[id] || 0), FUSE60_NM.rogue[id] + ' 피해 (' + Math.round((G.stats.dmg[id] || 0) - (d0[id] || 0)) + ')');
      ok((S6().shadow || 0) > sh0, ids.map(id => FUSE60_NM.rogue[id]).join('·') + ' 그림자 동작 (' + ((S6().shadow || 0) - sh0) + '회)');
      if (ids.includes('turret')) ok((S6().log || 0) > 0 && (S6().logSpin || 0) > 0 && (S6().logBurst || 0) > 0, `대역 통나무: 설치 ${S6().log}·회전 반격 ${S6().logSpin}·쿠나이 폭발 ${S6().logBurst}`);
      if (ids.includes('lamp')) ok((S6().tear || 0) > 0, '그림자 도둑: 그림자 뜯기 굳음 (' + S6().tear + '회)');
      if (ids.includes('thorn')) ok((S6().snareGrp || 0) > 0, '올가미: 엮어 당겨 한 번에 긋기 (' + S6().snareGrp + '회)');
    }
    // 9. 대역 통나무 유인
    fresh(); G.p.weapons.push({ id: 'turret', lvl: 5, t: 0.2 }); applyFuse60('turret'); settle(); cine();
    const tw = G.p.weapons.find(x => x.id === 'turret'); makeEnemy(T[0], G.p.x + 200, G.p.y); tw.t = 0; step(1 / 60);
    const L0 = R().logs[0]; ok(!!L0 && R().hide > 1 && heroStatus60('') === '바꿔치기', '대역 통나무 설치·도적 반투명(바꿔치기)');
    G.enemies.forEach(e => e.dead = true); G.enemies = G.enemies.filter(e => !e.dead);
    STATE.dev.auto = false; G.p.x += 260; const lure = makeEnemy('slime', L0.x + 90, L0.y), far = makeEnemy('slime', G.p.x + 150, G.p.y);
    const dl0 = Math.hypot(lure.x - L0.x, lure.y - L0.y), df0 = Math.hypot(far.x - G.p.x, far.y - G.p.y);
    for (let i = 0; i < 40; i++) { STATE.dev.god = true; step(1 / 60); }
    ok(Math.hypot(lure.x - L0.x, lure.y - L0.y) < dl0 - 5, '주변 적은 통나무 쪽으로 감');
    ok(Math.hypot(far.x - G.p.x, far.y - G.p.y) < df0 - 2, '멀리 있는 적은 그대로 도적 추적');
    render();
    } catch (e) { ok(false, '실행 오류 ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' / ')); }
    return out;
  }).catch(e => ['FAIL 실행 오류 ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' / ')]);
  console.log(res.join('\n'));
  console.log('page errors', errs.length, errs.slice(0, 5));
  const fails = res.filter(l => l.startsWith('FAIL')).length + errs.length;
  console.log(`도적·치명타 점검 ${res.length - res.filter(l => l.startsWith('FAIL')).length}/${res.length} 통과, 페이지 오류 ${errs.length}`);
  await b.close(); SERVER.close(); process.exit(fails ? 1 : 0);
})();
