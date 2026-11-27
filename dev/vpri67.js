// 0.67 프리스트 집중 점검: 기도(멈추면 2배)·축복 일제 발동(범위·피해·보호막·투사체 정화), 종 발현 A·B → 공명·겹울림, 궁극기 3종, 인물 각성 A·B, 연성 7종, 자동 플레이, 페이지 오류
//
// 사용: NODE_PATH=$(npm root -g) node dev/vpri67.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), PORT = +(process.env.PORT || 48367);
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
    const fresh = () => { base0(); G.p.weapons = G.p.weapons.filter(w => w.id === 'bell'); applyHero60('priest'); settle(); cine(); STATE.dev.auto = false; INPUT.keys = {}; G.p.need = 1e9; clear(); };
    try {
    const P = () => G.r67, base = () => baseW(), S6 = () => S60();
    const tank = (x, y, n = 1) => { const L = []; for (let i = 0; i < n; i++) { const e = makeEnemy(T[0], x + i * 30, y); e.hp = e.mhp = 1e6; e.frz = 99; L.push(e); } return L; };
    const mv = on => { INPUT.keys = on ? { d: true, ArrowRight: true, KeyD: true } : {}; };
    // 1. 선택·구현 상태
    fresh();
    ok(G.p.job === 'priest' && HERO60.priest.impl && heroSlotN() === 4 && base() && base().id === 'bell', '프리스트 선택·구현 상태·전용 축복의 종·일반 무기 4칸');
    ok(HERO60.priest.br.length === 2 && HERO60.priest.wak.A && HERO60.priest.wak.B && Object.keys(FUSE60.priest).length === 7, '발현 2·무기 각성 2·연성 7종 등록');
    // 2. 기도: 멈추면 2배
    P().pray = 0; base().t = 99; runT(2); const pS = P().pray;
    mv(1); P().pray = 0; runT(2); const pM = P().pray, wasMv = G.p.moving; mv(0);
    ok(wasMv && pM > 0 && Math.abs(pS / pM - 2) < 0.15, `기도: 멈추면 2배 (서서 ${pS.toFixed(2)} / 움직이며 ${pM.toFixed(2)}, 이동 ${wasMv})`);
    ok(Math.abs(pS - 2 * 2 / 3) < 0.1, '서서 4.5초에 3단계 (2초 ' + pS.toFixed(2) + '단계)');
    // 3. 축복 일제 발동
    fresh(); base().t = 99; const L = tank(G.p.x + 60, G.p.y, 3);
    G.eb.push({ x: G.p.x + 50, y: G.p.y, vx: 0, vy: 0, r: 5, dmg: 1, src: 'test', life: 5, col: '#fff' });
    P().pray = 2.999; const b0 = S6().bless || 0, d0 = G.stats.dmg.bell || 0; runT(0.6);
    const dB = (G.stats.dmg.bell || 0) - d0, dS = wStats(base()).dmg;
    ok((S6().bless || 0) - b0 === 1 && P().pray < 0.5, '3단계 → 0.3초 모으기 → 축복 일제 발동 1회·기도 초기화');
    ok(Math.abs(dB / 3 / dS - 2) < 0.05, `일제 발동: 종 피해 2배 (${(dB / 3 / dS).toFixed(2)}배)`);
    ok(P().shieldT > 1 && P().shieldT <= 2, '보호막 2초 (' + P().shieldT.toFixed(2) + ')');
    ok(G.eb.every(b => b.life <= 0 || b.src !== 'test') && (S6().purify || 0) >= 1, '일제 발동 종소리: 투사체 정화');
    ok(HERO60.priest.avoid() === true, '보호막 중 피해 막음');
    const near = tank(G.p.x + 190, G.p.y, 1)[0], hn = near.hp; P().pray = 2.999; P().shieldT = 0; runT(0.5);
    ok(near.hp < hn, '일제 발동 범위 +50% (반경 140 밖 190 적 맞음)');
    // 4. 발현 A 잔향 → 공명
    fresh(); let w = base(); w.lvl = 3; checkBranch('w', w.id); ok(G.pendingBr.some(q => q.id === 'bell'), 'Lv 3 축복의 종 발현 대기');
    G.pendingBr = []; applyBranch({ t: 'branch', id: 'bell', k: 'A', kind: 'w' }); P().pray = -99; tank(G.p.x + 60, G.p.y); w.t = 0; runT(0.8);
    ok((S6().echo || 0) >= 1, '잔향: 0.5초 뒤 같은 적에게 약한 울림 (' + S6().echo + ')');
    w.lvl = 5; checkBranch('w', w.id); ok(w.aw === 'A', '무기 각성 A 공명 자동'); clear(); tank(G.p.x + 60, G.p.y); tank(G.p.x + 60, G.p.y + 50); w.t = 0; runT(0.8);
    ok((S6().reso || 0) >= 2, '공명: 맞은 적마다 작은 고리 (' + S6().reso + ')');
    // 5. 발현 B 뻗는 울림 → 겹울림
    fresh(); w = base(); w.lvl = 3; checkBranch('w', w.id); G.pendingBr = []; applyBranch({ t: 'branch', id: 'bell', k: 'B', kind: 'w' }); P().pray = -99;
    const far = tank(G.p.x + 230, G.p.y, 1)[0], back = tank(G.p.x - 100, G.p.y, 1)[0], hf = far.hp, hb = back.hp; w.t = 0; runT(0.3);
    ok(far.hp < hf && back.hp === hb, '뻗는 울림: 적 많은 쪽 부채꼴 반경 260 (230 맞음·반대쪽 안 맞음)');
    w.lvl = 5; checkBranch('w', w.id); ok(w.aw === 'B', '무기 각성 B 겹울림 자동'); const l0 = S6().layer || 0; w.t = 0; runT(0.7);
    ok((S6().layer || 0) - l0 === 3, '겹울림: 세 겹 (' + ((S6().layer || 0) - l0) + ')');
    // 6. 기본 궁극기 하늘의 대종
    fresh(); crowd(12); G.enemies.forEach(e => { e.hp = e.mhp = 1e6; }); base().t = 99; P().pray = -99; G.p.hp = G.p.maxHp * 0.5; const u0 = G.stats.dmg.ult || 0, hp0 = G.p.hp;
    G.p.ult = JOB_CFG.ultNeed; useUlt(); const B = P().sky; B.x = G.p.x; B.y = G.p.y; runT(7);
    ok((G.stats.dmg.ult || 0) > u0 && (S6().skyRing || 0) === 6, '하늘의 대종: 낙하 피해·6번 울림 (' + S6().skyRing + ')');
    ok((S6().skyBless || 0) === 1 && (S6().skyHeal || 0) >= 5 && G.p.hp > hp0, '마지막 울림 일제 발동·범위 안 회복 (' + (S6().skyHeal || 0) + ')');
    // 7. 인물 각성 A 넘치는 기도 · 여신 강림
    fresh(); applyAw60('A'); cine(); base().t = 99; tank(G.p.x + 60, G.p.y); P().pray = 3; P().hold = -1; const b4 = S6().bless4 || 0; runT(3);
    ok(P().hold > 2 && (S6().bless4 || 0) === b4, '서서 기도: 3단계 뒤 계속 모음 (' + P().hold.toFixed(1) + '초)');
    runT(1.6); ok((S6().bless4 || 0) - b4 === 1, '4초 뒤 4단계 일제 발동');
    P().pray = 3; P().hold = 1; mv(1); const b3 = S6().bless || 0; runT(0.5); mv(0);
    ok((S6().bless || 0) - b3 === 1 && (S6().bless4 || 0) - b4 === 1, '모으는 도중 움직이면 그 순간 3단계 크기로');
    const dd0 = S6().descendB || 0; G.p.ult = JOB_CFG.ultNeed; useUlt(); runT(2.8);
    ok((S6().descendB || 0) - dd0 === 3, '여신 강림: 일제 발동 1초 간격 3번 (' + ((S6().descendB || 0) - dd0) + ')');
    // 8. 인물 각성 B 맡기는 기도 · 심판
    fresh(); applyAw60('B'); cine(); base().t = 99; P().pray = -99; tank(G.p.x + 70, G.p.y); const bo0 = S6().bolt || 0; runT(2);
    ok((S6().bolt || 0) - bo0 >= 2, '맡기는 기도: 서 있는 동안 빛 번개 (' + ((S6().bolt || 0) - bo0) + ')');
    mv(1); runT(0.1); const bo1 = S6().bolt || 0; runT(1.6); mv(0);
    ok((S6().bolt || 0) === bo1, '움직이면 번개 멈춤');
    clear(); crowd(14); G.enemies.forEach(e => { e.hp = e.mhp = 1e6; }); P().pray = -99; G.p.ult = JOB_CFG.ultNeed; useUlt(); mv(1); runT(0.2); const x0 = G.p.x; runT(0.4);
    ok(HERO60.priest.avoid() === true && Math.abs(G.p.x - x0) < 2, '심판: 이동 불가·피해 무효 (이동 ' + Math.abs(G.p.x - x0).toFixed(1) + ')'); runT(1.8); mv(0);
    ok((S6().judgeBolt || 0) === 10 && !P().judge, '심판: 빛 번개 10줄기 (' + S6().judgeBolt + ')');
    // 9. 연성 7종
    const groups = [['cleave', 'dagger', 'arrow', 'turret'], ['fireball', 'lamp', 'thorn']];
    for (const ids of groups) {
      fresh();
      for (const id of ids) { G.p.weapons.push({ id, lvl: 5, t: 0.2 }); applyFuse60(id); settle(); cine(); }
      STATE.dev.auto = false; base().t = 999; P().pray = -999;
      ok(ids.every(id => G.p.weapons.find(x => x.id === id && x.fu && x.fu.nm === FUSE60_NM.priest[id])), '연성 적용: ' + ids.map(id => FUSE60_NM.priest[id]).join('·'));
      const dd = Object.assign({}, G.stats.dmg); run(20, 1);
      for (const id of ids) ok((G.stats.dmg[id] || 0) > (dd[id] || 0), FUSE60_NM.priest[id] + ' 피해 (' + Math.round((G.stats.dmg[id] || 0) - (dd[id] || 0)) + ')');
      if (ids.includes('cleave')) { const sp = (S6().swordPray || 0); P().pray = 0; clear(); tank(G.p.x + 50, G.p.y - 10, 3); for (const x of G.p.weapons) x.t = 9; const sw = G.p.weapons.find(x => x.id === 'cleave'); sw.t = 0; step(1 / 60); ok(P().pray > 0.17, '성검: 벤 적 3마리 → 기도 +6% (' + (P().pray / 3 * 100).toFixed(1) + '%, 누적 ' + sp.toFixed(2) + ')'); P().pray = -999; }
      if (ids.includes('dagger')) ok((S6().cross || 0) > 0 && (S6().crossSide || 0) >= 2, '십자 긋기: 가로 획이 양옆 적까지 (최대 ' + S6().crossSide + '마리)');
      if (ids.includes('arrow')) ok((S6().split || 0) > 0, '갈라지는 빛살: 갈라짐 ' + S6().split);
      if (ids.includes('turret')) ok((S6().candleTk || 0) > 0 && P().candles.length <= 3, `금빛 촛대: 그을림 ${S6().candleTk}·현재 ${P().candles.length}개(최대 3)`);
      if (ids.includes('fireball')) { clear(); tank(G.p.x + 120, G.p.y); P().pray = 2.1; for (const x of G.p.weapons) x.t = 9; const fw = G.p.weapons.find(x => x.id === 'fireball'); fw.t = 0; S6().holyR = 0; step(1 / 60); ok(S6().holyR === 55, '성화: 기도 2단계 폭발 반경 55 (' + S6().holyR + ')'); P().pray = -999; }
      if (ids.includes('lamp')) { clear(); tank(G.p.x + 60, G.p.y, 1); G.p.hp = G.p.maxHp * 0.5; const h1 = G.p.hp, ph0 = S6().purHeal || 0; G.p.weapons.find(x => x.id === 'lamp').t = 0; for (let i = 0; i < 120; i++) { for (const x of G.p.weapons) if (x.id !== 'lamp') x.t = 9; P().pray = -9; step(1 / 60); } ok(G.p.hp > h1 && (S6().purHeal || 0) > ph0, '정화의 등불: 준 피해 10% 회복 (' + ((S6().purHeal || 0) - ph0).toFixed(1) + ')'); }
      if (ids.includes('thorn')) { ok((S6().bind || 0) > 0 && (S6().bindMax || 0) <= 4, `결박진: ${S6().bind}회·최대 ${S6().bindMax}마리`);
        clear(); const e = makeEnemy(T[0], G.p.x + 120, G.p.y); e.hp = e.mhp = 9999; const ex = e.x; const tw = G.p.weapons.find(x => x.id === 'thorn'); tw.t = 0; runT(0.3); ok(Math.abs(e.x - ex) < 25, '결박진: 끌어당김 없음'); }
      clear(); tank(G.p.x + 70, G.p.y, 3); for (const x of G.p.weapons) x.t = 99; const bb = Object.assign({}, G.stats.dmg); P().pray = 2.999; runT(0.8);
      const fired = ids.filter(id => id !== 'turret').filter(id => (G.stats.dmg[id] || 0) > (bb[id] || 0));
      ok(fired.length === ids.filter(id => id !== 'turret').length, '일제 발동: 연성 무기도 간격 무관 한꺼번에 발동 (' + fired.map(id => FUSE60_NM.priest[id]).join('·') + ')');
    }
    // 10. 자동 플레이
    fresh(); STATE.dev.auto = true; run(60, 0);
    ok((G.stats.dmg.bell || 0) > 0 && (S6().bless || 0) > 0, `자동 플레이: 종 피해 ${Math.round(G.stats.dmg.bell || 0)}·일제 발동 ${S6().bless || 0}회·서 있던 시간 ${Math.round(S6().stillT || 0)}초/${Math.round((S6().stillT || 0) + (S6().moveT || 0))}초`);
    ok(/^(기도|축복|넘치는|하늘|심판)/.test(heroStatus60('')), '상태 글자 (' + heroStatus60('') + ')');
    render();
    } catch (e) { ok(false, '실행 오류 ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' / ')); }
    return out;
  }).catch(e => ['FAIL 실행 오류 ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' / ')]);
  console.log(res.join('\n'));
  console.log('page errors', errs.length, errs.slice(0, 5));
  const fails = res.filter(l => l.startsWith('FAIL')).length + errs.length;
  console.log(`프리스트 점검 ${res.length - res.filter(l => l.startsWith('FAIL')).length}/${res.length} 통과, 페이지 오류 ${errs.length}`);
  await b.close(); SERVER.close(); process.exit(fails ? 1 : 0);
})();
