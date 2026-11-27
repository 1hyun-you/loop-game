// 0.65 엔지니어 집중 점검: 설치(2.5초·1.2초·이동 취소·위쪽 자리), 수량·상한·순서, 기계 체력·적이 기계를 노림·정예·수문장 광역기, 재설치 대기,
//   탭 철거, 영역(밖 5초 분해·밖에서 안 지음), 발현 A·B → 회전 기관포·박격포, 궁극기 3종, 인물 각성 A·B, 연성 7종 기계, 자동 플레이, 페이지 오류
// 사용: NODE_PATH=$(npm root -g) node dev/veng65.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), PORT = +(process.env.PORT || 48365);
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
    const fresh = () => { base0(); G.p.weapons = G.p.weapons.filter(w => w.id === 'turret'); applyHero60('engineer'); settle(); cine(); STATE.dev.auto = false; INPUT.keys = {}; G.p.moving = false; G.p.need = 1e9; clear(); };   // 레벨업 차단 (포탑 강화 카드가 상한을 바꾸지 않게)
    const E = () => G.e65, base = () => baseW(), S6 = () => S60();
    const mN = t => E().mach.filter(m => !m.dead && (!t || m.type === t) && !m.tmp).length;
    const tapW = (x, y) => { const Z = VIEW.zoom, p = G.p; return tapAt65((x - p.x + VIEW.cameraW / 2) * Z, (y - p.y + VIEW.cameraH / 2) * Z); };
    const fill = () => { for (let i = 0; i < 80 && eNext65(); i++) place65(eNext65().type, eNext65().w); };
    try {
    const runH = sec => { for (let k = 0; k < sec * 4; k++) { for (const m of E().mach) if (m.mhp < 1e5) { m.hp = 1e6; m.mhp = 1e6 + 1; } else m.hp = m.mhp; runT(0.25); } };   // 자연 출현 적이 기계를 부수지 않게
    // 1. 선택·구현 상태
    fresh();
    ok(G.p.job === 'engineer' && HERO60.engineer.impl && heroSlotN() === 4 && base() && base().id === 'turret', '엔지니어 선택·구현 상태·전용 포탑 설치·일반 무기 4칸');
    ok(HERO60.engineer.br.length === 2 && HERO60.engineer.wak.A && HERO60.engineer.wak.B && Object.keys(FUSE60.engineer).length === 7, '발현 2·무기 각성 2·연성 7종 등록');
    // 2. 설치: 가만히 2.5초 → 위쪽, 계속 서 있으면 1.2초, 움직이면 취소
    runT(2.3); ok(mN() === 0, '2.3초 서 있음: 아직 설치 안 됨');
    runT(0.3); const m1 = E().mach[0]; ok(mN() === 1 && m1.y < G.p.y - 5, '2.5초 서 있음 → 캐릭터 위쪽 설치 (dy ' + Math.round(m1.y - G.p.y) + ')');
    runT(1.25); ok(mN() === 2, '계속 서 있으면 1.2초 간격 (' + mN() + '대)');
    INPUT.keys = { d: true }; runT(0.6); INPUT.keys = {}; step(1 / 60);
    ok(E().bt < 0.1 && !E().chain, '움직이면 진행 취소·연속 설치 해제');
    runT(2.0); ok(mN() === 2, '움직인 뒤 다시 2.5초부터 (2.0초 시점 ' + mN() + '대)');
    runT(0.6); ok(mN() === 3, '2.5초 뒤 설치');
    runH(6); ok(mN() === eCap65('turret') && eCap65('turret') === 4, '기본 포탑 상한 4대 (' + mN() + ')');
    const ms = E().mach; let ov = 0; for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) if (Math.hypot(ms[i].x - ms[j].x, ms[i].y - ms[j].y) < ms[i].r + ms[j].r + 5.9) ov++;
    ok(ov === 0, '빈자리 보정: 기계끼리 겹침 없음·틈 6');
    runH(30); ok(mN() === 4, '기계는 시간이 지나도 사라지지 않음 (30초 뒤 ' + mN() + ')');
    // 3. 공격·적이 기계를 노림
    const ts0 = S6().tShot || 0; for (let i = 0; i < 6; i++) makeEnemy('slime', G.p.x + 150, G.p.y - 120 + i * 30); runT(3);
    ok((S6().tShot || 0) > ts0 && (G.stats.dmg.turret || 0) > 0, '포탑 사격 (' + ((S6().tShot || 0) - ts0) + '발·피해 ' + Math.round(G.stats.dmg.turret || 0) + ')');
    clear(); for (const m of E().mach) { m.hp = m.mhp = 60; } const tm = E().mach[0]; tm.hp = tm.mhp = 99999; for (const m of E().mach) m.cd = 99;
    const sl = makeEnemy('slime', tm.x, tm.y - 90); sl.hp = sl.mhp = 99999; sl.speed = 60;
    G.p.x = tm.x; G.p.y = tm.y + 60; const mh0 = S6().mHurt || 0; runT(4);
    ok(sl.m65 && (S6().mHurt || 0) > mh0, '가까운 일반 적은 기계를 먼저 노림 (기계 피해 ' + Math.round((S6().mHurt || 0) - mh0) + ')');
    clear(); const el = makeEnemy('slime', tm.x + 90, tm.y); el.elite = true; el.hp = el.mhp = 99999; const d0 = Math.hypot(el.x - G.p.x, el.y - G.p.y); runT(0.5);
    ok(!el.m65 && Math.hypot(el.x - G.p.x, el.y - G.p.y) < d0, '정예는 캐릭터를 노림');
    clear(); tm.hp = 30; tm.mhp = 60; const he = makeEnemy('slime', tm.x + 12, tm.y); he.elite = true; he.hp = he.mhp = 99999; he.frz = 9; const eh0 = S6().mHurtElite || 0; runT(1.5);
    ok((S6().mHurtElite || 0) > eh0, '정예: 길 막는(붙은) 기계는 공격');
    clear(); for (const m of E().mach) { m.hp = m.mhp = 60; m.cd = 0; } G.hz.push({ k: 'circ', x: tm.x, y: tm.y, r: 30, warn: 0.2, t: 0, dmg: 999, src: '시험' });
    runT(0.5); ok(tm.dead && !E().mach.includes(tm), '수문장 광역기(예고 구역)에 기계도 피해 → 부서짐');
    // 4. 재설치 대기
    const nT = mN('turret'); ok(eCool65('turret') >= 1 && !eNext65(), '부서짐: 10초 재설치 대기 (대기 ' + eCool65('turret') + '·남은 ' + nT + ')');
    G.p.x = E().mach[0].x; G.p.y = E().mach[0].y + 40; runH(9); ok(mN('turret') === nT, '10초 전 재설치 없음');
    runH(5); ok(mN('turret') === 4, '10초 뒤 재설치 (' + mN('turret') + ')');
    // 5. 탭 철거
    const tg = E().mach[1]; ok(tapW(tg.x, tg.y) && E().mark && E().mark.m === tg, '탭 1회: X 표시');
    runT(0.5); ok(E().bt === 0, 'X 표시 중 건설 정지');
    tapW(tg.x + 300, tg.y + 300); ok(!E().mark, '다른 곳 탭 → 취소');
    tapW(tg.x, tg.y); runT(2.1); ok(!E().mark, 'X 표시 2초 뒤 취소');
    tapW(tg.x, tg.y); tapW(tg.x, tg.y); ok(tg.dead && mN('turret') === 3 && eCool65('turret') === 1, '탭 2회: 철거 + 5초 재설치 대기');
    runH(4.5); ok(mN('turret') === 3, '철거 5초 전 재설치 없음'); runH(5); ok(mN('turret') === 4, '철거 5초 뒤 재설치');
    // 6. 영역
    const c0 = E().mach[0]; G.p.x = c0.x + 400; G.p.y = c0.y; runH(3); ok(mN() === 4 && E().outT > 2.5 && heroStatus60('').includes('분해'), '영역 밖: 무너짐 게이지 (분해 표시)');
    ok(E().bt === 0, '영역 밖에서는 짓지 않음');
    G.p.x = c0.x; G.p.y = c0.y + 40; runT(0.2); ok(E().outT === 0 && mN() === 4, '돌아오면 유지');
    G.p.x = c0.x + 400; runT(5.2); ok(mN() === 0 && (S6().outAll || 0) > 0, '영역 밖 5초 → 전체 분해');
    runT(2.6); ok(mN() === 1, '기계가 없으면 그 자리에서 새로 지음');
    // 7. 흡수 범위
    G.p.moving = false; ok(Math.abs(pickR() / _pickRE65() - 1.6) < 1e-6, '서 있는 동안 흡수 범위 +60%');
    // 8. 발현 A 쌍열 → 회전 기관포
    fresh(); fill(); let w = base(); w.lvl = 3; checkBranch('w', w.id); ok(G.pendingBr.some(q => q.id === 'turret'), 'Lv 3 포탑 발현 대기');
    G.pendingBr = []; applyBranch({ t: 'branch', id: 'turret', k: 'A', kind: 'w' });
    const ea = makeEnemy('slime', G.p.x + 100, G.p.y - 60); ea.hp = ea.mhp = 9999; G.proj = []; for (const m of E().mach) m.cd = 0; step(1 / 60);
    ok(G.proj.filter(q => q.e65).length >= 2 * mN(), '쌍열 포탑: 2발 동시 (' + G.proj.filter(q => q.e65).length + '발 / ' + mN() + '대)');
    w.lvl = 5; checkBranch('w', w.id); ok(w.aw === 'A', '무기 각성 A 회전 기관포 자동');
    clear(); const eg = makeEnemy(T[0], G.p.x + 120, G.p.y - 40); eg.hp = eg.mhp = 1e6; eg.frz = 99; const sh0 = S6().tShot || 0; runT(4);
    const shotsGat = (S6().tShot || 0) - sh0; ok((S6().gatMax || 0) >= 5 && shotsGat > mN() * 4 / 0.8 * 1.3, '회전 기관포: 같은 적을 계속 쏘면 빨라짐 (연속 ' + S6().gatMax + '·4초 ' + shotsGat + '발)');
    // 9. 발현 B 대구경 → 박격포
    fresh(); fill(); w = base(); w.lvl = 3; checkBranch('w', w.id); G.pendingBr = []; applyBranch({ t: 'branch', id: 'turret', k: 'B', kind: 'w' });
    const eb = makeEnemy('slime', G.p.x + 100, G.p.y - 60); eb.hp = eb.mhp = 9999; G.proj = []; for (const m of E().mach) m.cd = 0; step(1 / 60);
    ok(G.proj.some(q => q.e65 && q.kind === 'shell' && q.R > 0), '대구경 포탑: 포탄 + 작은 폭발');
    w.lvl = 5; checkBranch('w', w.id); ok(w.aw === 'B', '무기 각성 B 박격포 자동');
    run(8, 1, 'slime'); ok((S6().mortar || 0) > 0, '박격포: 4번째 발사마다 곡사 포탄 (' + S6().mortar + '회)');
    // 10. 기본 궁극기 긴급 증설
    fresh(); fill(); for (const m of E().mach) m.hp = 5; crowd(10, 'slime'); const u0 = G.stats.dmg.ult || 0; G.p.ult = JOB_CFG.ultNeed; useUlt(); runT(0.6);
    ok(E().mach.filter(m => m.tmp).length === 3 && eCount65('turret') <= 4, '긴급 증설: 포탑 3대 낙하 (상한 초과 허용, 임시 표시)');
    ok((G.stats.dmg.ult || 0) > u0, '착지 충격 피해 (' + Math.round((G.stats.dmg.ult || 0) - u0) + ')');
    clear(); runT(20); ok(E().mach.filter(m => m.tmp).length === 0, '임시 포탑 20초 뒤 분해');
    fresh(); fill(); for (const m of E().mach) m.hp = 5; G.p.ult = JOB_CFG.ultNeed; useUlt(); ok(E().mach.every(m => m.hp === m.mhp), '긴급 증설: 모든 기계 수리');
    // 11. 인물 각성 A 현장 지휘관 · 총지휘
    fresh(); applyAw60('A'); cine(); fill(); const ma = E().mach[0]; ma.hp = 10; const rp0 = S6().rep || 0; runT(2);
    ok(ma.hp > 10 && (S6().rep || 0) > rp0 && mSpd65(ma) === 1.6, '현장 지휘관: 곁 기계 공속 +60%·초당 5% 수리');
    G.p.x += 150; runT(0.1); ok(E().mach.every(m => dist2(m.x, m.y, G.p.x, G.p.y) < 120 * 120 || mSpd65(m) === 1), '지휘 반경 120 밖은 보통');
    for (let i = 0; i < 6; i++) makeEnemy('slime', G.p.x + 50, G.p.y - 100 + i * 20).hp = 9999;
    G.p.x -= 150; G.p.ult = JOB_CFG.ultNeed; useUlt(); ok(E().cmdT > 7.9 && (S6().cmdVol || 0) >= 4 && E().mach.every(m => !inArea65(m.x, m.y) || mSpd65(m) === 1.6), '총지휘: 8초 영역 안 모든 기계 지휘 + 일제 사격');
    ok(heroStatus60('').startsWith('총지휘'), '총지휘 상태 글자'); runT(8.2); ok(!(E().cmdT > 0), '8초 뒤 종료');
    // 12. 인물 각성 B 전기 울타리 · 결전 병기
    fresh(); applyAw60('B'); cine(); fill(); for (const m of E().mach) m.cd = 99; const c1 = E().mach[0]; runT(0.1);
    let fx0 = c1.x, fy0 = c1.y; for (const m of E().mach) { if (m.x > fx0) { fx0 = m.x; fy0 = m.y; } }
    const fz = makeEnemy(T[0], fx0 + 260, fy0); fz.hp = fz.mhp = 99999; fz.speed = 120; const f0 = S6().fence || 0; G.p.x = fx0 - 40; G.p.y = fy0;
    for (let i = 0; i < 150; i++) { for (const m of E().mach) m.cd = 99; settle(); step(1 / 60); }
    ok((S6().fence || 0) - f0 === 1 && (G.stats.dmg.fence65 || 0) > 0, '전기 울타리: 테두리를 넘어온 적 감전 (' + ((S6().fence || 0) - f0) + '회)');
    fz.x = fx0 + 260; fz.in65 = false; fz.y = fy0; for (let i = 0; i < 20; i++) { fz.x = fx0 + 150; step(1 / 60); } ok((S6().fence || 0) - f0 === 1, '같은 적 2초에 1번');
    clear(); crowd(14, 'slime'); const u2 = G.stats.dmg.ult || 0, ch0 = S6().cannonHit || 0; G.p.ult = JOB_CFG.ultNeed; useUlt(); runT(3.6);
    ok((S6().cannonHit || 0) - ch0 === 3 && (G.stats.dmg.ult || 0) > u2 && !E().cannon, '결전 병기: 조립 → 대형 포탄 3발 폭발 (' + ((S6().cannonHit || 0) - ch0) + ')');
    // 13. 연성 7종 (기계 설치형)
    const groups = [['cleave', 'dagger', 'arrow', 'fireball'], ['lamp', 'bell', 'thorn']];
    for (const ids of groups) {
      fresh();
      for (const id of ids) { G.p.weapons.push({ id, lvl: 5, t: 0.2 }); applyFuse60(id); settle(); cine(); }
      STATE.dev.auto = false; G.p.moving = false;
      ok(ids.every(id => G.p.weapons.find(x => x.id === id && x.fu && x.fu.nm === FUSE60_NM.engineer[id])), '연성 적용: ' + ids.map(id => FUSE60_NM.engineer[id]).join('·'));
      ok(eCap65('turret') === 4 + ids.length && ids.every(id => eCap65(id) === 2), '연성마다 기본 포탑 +1 (' + eCap65('turret') + ')·연성 기계 종류별 2기');
      const first = eNext65(); ok(first && first.type === ids[0], '설치 순서: 빈 비율 같으면 연성 기계 먼저·무기 칸 순서 (' + (first && first.type) + ')');
      fill(); ok(ids.every(id => mN(id) === 2) && mN('turret') === 4 + ids.length, '기계 전부 설치 (' + E().mach.length + '대)');
      for (const m of E().mach) m.hp = m.mhp = 99999;
      const dd = Object.assign({}, G.stats.dmg); run(20, 1);
      for (const id of ids) ok((G.stats.dmg[id] || 0) > (dd[id] || 0), FUSE60_NM.engineer[id] + ' 피해 (' + Math.round((G.stats.dmg[id] || 0) - (dd[id] || 0)) + ')');
      if (ids.includes('cleave')) ok((S6().botHit || 0) > 0 && E().mach.filter(m => m.type === 'cleave').every(m => Math.hypot(m.x - m.hx, m.y - m.hy) <= E65C.bot.roam + 1), `대검 기계병: 베기 ${S6().botHit}·회전 ${S6().botSpin || 0}·자리 반경 80 안`);
      if (ids.includes('cleave')) { const t0 = place65('cleave', G.p.weapons.find(x => x.id === 'cleave')); ok(t0.mhp === 120, '대검 기계병 체력 기본 포탑 2배'); t0.dead = true; sweepDead65(); }
      if (ids.includes('dagger')) ok((S6().drone || 0) > 0, `칼날 드론: 왕복 ${S6().drone}·돌아오는 길 ${S6().droneBack || 0}`);
      if (ids.includes('arrow')) { clear(); const bm = E().mach.find(m => m.type === 'arrow'); const L = [0, 1, 2].map(i => makeEnemy(T[0], bm.x + 70 + i * 50, bm.y)); L.forEach(e => { e.hp = e.mhp = 9999; e.frz = 99; }); const h = L.map(e => e.hp); for (const m of E().mach) if (m.type === 'arrow') m.cd = 0;
        for (let i = 0; i < 48; i++) { for (const m of E().mach) if (m.type !== 'arrow') m.cd = 99; step(1 / 60); } ok(L.every((e, i) => e.hp < h[i]), '쇠뇌 포대: 일직선 적 3마리 모두 꿰뚫음'); }
      if (ids.includes('fireball')) ok((S6().furn || 0) > 0 && (S6().furnBody || 0) > 0, `용광로: 쇳물 덩이 ${S6().furn}·몸통 열기 ${S6().furnBody}`);
      if (ids.includes('lamp')) { clear(); const lm = E().mach.find(m => m.type === 'lamp'); const te = makeEnemy(T[0], lm.x + 60, lm.y); te.hp = te.mhp = 1e6; te.frz = 99; for (let i = 0; i < 180; i++) { for (const m of E().mach) if (m.type !== 'lamp') m.cd = 99; step(1 / 60); } }
      if (ids.includes('lamp')) ok((S6().torchMax || 0) > 1, '용접 토치: 오래 지질수록 피해 증가 (최대 ×' + (S6().torchMax || 0).toFixed(2) + ')');
      if (ids.includes('bell')) ok((S6().alarm || 0) > 0 && (S6().alarmEcho || 0) > 0, `경보종: 울림 ${S6().alarm}·다른 기계 울림 ${S6().alarmEcho}`);
      if (ids.includes('thorn')) { ok((S6().wire || 0) > 0, '철조망 발사기: 묶음 ' + S6().wire);
        clear(); const wm = E().mach.find(m => m.type === 'thorn'); const e = makeEnemy(T[0], wm.x + 120, wm.y); e.hp = e.mhp = 9999; const x0 = e.x; for (const m of E().mach) m.cd = m.type === 'thorn' ? 0 : 99; step(1 / 60); ok(Math.abs(e.x - x0) < 25 && e.frz > 0, '철조망 발사기: 묶기만·끌어당김 없음'); }
    }
    // 14. 자동 플레이 (일반 흐름)
    fresh(); STATE.dev.auto = true; STATE.dev.god = true; run(60, 0);
    ok((S6().built || 0) >= 2 && (G.stats.dmg.turret || 0) > 0, `자동 플레이: 기계 최대 ${S6().mMax}·포탑 피해 ${Math.round(G.stats.dmg.turret || 0)}·서 있음 ${Math.round(S6().stillT || 0)}초/이동 ${Math.round(S6().moveT || 0)}초`);
    ok(/^(기계|총지휘|결전)/.test(heroStatus60('')), '상태 글자 · 이동 이유 ' + JSON.stringify(S6().eWhy || {}));
    render(); drawSlots(document.createElement('canvas').getContext('2d'));
    } catch (e) { ok(false, '실행 오류 ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' / ')); }
    return out;
  }).catch(e => ['FAIL 실행 오류 ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' / ')]);
  console.log(res.join('\n'));
  console.log('page errors', errs.length, errs.slice(0, 5));
  const fails = res.filter(l => l.startsWith('FAIL')).length + errs.length;
  console.log(`엔지니어 점검 ${res.length - res.filter(l => l.startsWith('FAIL')).length}/${res.length} 통과, 페이지 오류 ${errs.length}`);
  await b.close(); SERVER.close(); process.exit(fails ? 1 : 0);
})();
