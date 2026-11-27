// 0.64 사령술사 집중 점검: 영혼 떨어짐·줍기·망령 소환(상한·적에게 안 맞음), 등불 발현 A·B → 무기 각성 A 봉혼·B 폭혼,
//   궁극기 3종(거대 망령·영혼 방출·귀속), 인물 각성 A 작은 망령·B 강한 망령, 연성 7종 발동·피해·특수 동작, 자동 플레이, 페이지 오류
// 사용: NODE_PATH=$(npm root -g) node dev/vnec64.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), PORT = +(process.env.PORT || 48364);
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
    const fresh = () => { base0(); G.p.weapons = G.p.weapons.filter(w => w.id === 'lamp'); applyHero60('necromancer'); settle(); cine(); STATE.dev.auto = false; INPUT.keys = {}; };
    const N = () => G.n64, base = () => baseW(), S6 = () => S60();
    const clear = () => { G.enemies.forEach(e => e.dead = true); G.enemies = G.enemies.filter(e => !e.dead); };
    const wrN = k => N().ally.filter(a => !k || a.kind === k).length;
    try {
    // 1. 선택·구현 상태
    fresh();
    ok(G.p.job === 'necromancer' && HERO60.necromancer.impl && heroSlotN() === 4 && base() && base().id === 'lamp', '사령술사 선택·구현 상태·전용 영혼 등불·일반 무기 4칸');
    ok(HERO60.necromancer.br.length === 2 && HERO60.necromancer.wak.A && HERO60.necromancer.wak.B && Object.keys(FUSE60.necromancer).length === 7, '발현 2·무기 각성 2·연성 7종 등록');
    // 2. 영혼 떨어짐·줍기·망령
    const sd0 = S6().soulDrop || 0; for (let i = 0; i < 100; i++) { const e = makeEnemy('slime', G.p.x + 300, G.p.y + 300); damageEnemy(e, 99999, { src: 'cleave' }); }
    const dr = (S6().soulDrop || 0) - sd0; ok(dr >= 25 && dr <= 55, '처치 영혼 확률 약 40% (100마리 중 ' + dr + '개)');
    ok(N().souls.length > 0 && N().souls.every(s => !s.mag), '흡수 범위 밖 영혼은 바닥에 남음');
    G.p.x += 300; G.p.y += 300; runT(1.2); ok(N().souls.length === 0 && (S6().soulGot || 0) >= dr, '흡수 범위로 영혼 줍기 (' + (S6().soulGot || 0) + '개)');
    ok(wrN('wr') === Math.min(5, Math.floor(dr / 7)) && N().soulN === dr % 7 || wrN('wr') === 5, `영혼 7개마다 망령 (망령 ${wrN('wr')}·남은 영혼 ${N().soulN})`);
    N().soulN = 0; for (let i = 0; i < 6; i++) { N().soulN = 6; dropSoul64(G.p.x, G.p.y); runT(0.3); }
    ok(wrN('wr') === 5, '망령 상한 5마리 (' + wrN('wr') + ')');
    const hp0 = G.p.hp; STATE.dev.god = false; crowd(10, 'slime'); const wh0 = S6().wrHit || 0; runT(3); STATE.dev.god = true;
    ok((S6().wrHit || 0) > wh0 && (G.stats.dmg.n64wr || 0) > 0, '망령 할퀴기 (' + ((S6().wrHit || 0) - wh0) + '회, 피해 ' + Math.round(G.stats.dmg.n64wr || 0) + ')');
    ok(N().ally.every(a => !G.enemies.includes(a)), '망령은 적 대상 목록에 없음 (적에게 공격받지 않음)');
    G.p.hp = G.p.maxHp; clear(); runT(16); ok(wrN('wr') === 0, '망령 15초 뒤 사라짐');
    ok(heroStatus60('').startsWith('영혼') && heroDials60().length === 1, '상태 글자·영혼 표시');
    // 3. 등불 발현 A 흡혼 → 봉혼
    fresh(); let w = base(); w.lvl = 3; checkBranch('w', w.id); ok(G.pendingBr.some(q => q.id === 'lamp'), 'Lv 3 등불 발현 대기');
    G.pendingBr = []; applyBranch({ t: 'branch', id: 'lamp', k: 'A', kind: 'w' }); crowd(8);
    w.t = 0; step(1 / 60); ok(w.br === 'A' && w.lk.length === 3, '흡혼: 줄기 3마리 (' + w.lk.length + ')');
    clear(); w.lvl = 5; checkBranch('w', w.id); ok(w.aw === 'A', '무기 각성 A 봉혼 자동');
    run(8, 1, 'slime'); ok((S6().seal || 0) > 0 && (S6().swallow || 0) > 0, `봉혼: 구멍 ${S6().seal}회·약한 적 삼킴 ${S6().swallow}`);
    clear(); const bk = makeEnemy(T[0], G.p.x + 60, G.p.y); bk.hp = bk.mhp = 99999; const bx0 = bk.x; w.seal64 = 0; runT(0.3);
    ok(!bk.dead && Math.abs(bk.x - bx0) < 30, '봉혼: 단단한 적은 삼키지 않음·끌어당기지 않음');
    // 4. 발현 B 수혼 → 폭혼
    fresh(); w = base(); w.lvl = 3; checkBranch('w', w.id); G.pendingBr = []; applyBranch({ t: 'branch', id: 'lamp', k: 'B', kind: 'w' });
    const sl0 = S6().soulLamp || 0; for (let i = 0; i < 6; i++) { const e = makeEnemy('slime', G.p.x + 50, G.p.y); e.hp = 1; w.t = 0; runT(0.1); }
    ok((S6().soulLamp || 0) - sl0 >= 4 && N().souls.length === 0, '수혼: 등불 처치 영혼 즉시 흡수 (' + ((S6().soulLamp || 0) - sl0) + ')');
    w.lvl = 5; checkBranch('w', w.id); ok(w.aw === 'B', '무기 각성 B 폭혼 자동');
    const bu0 = S6().burst || 0; for (let i = 0; i < 4; i++) { const e = makeEnemy('slime', G.p.x + 50, G.p.y); e.hp = 3; runT(1.6); }
    ok((S6().burst || 0) > bu0, '폭혼: 줄기에 이어진 채 죽은 적 영혼 폭발 (' + ((S6().burst || 0) - bu0) + '회)');
    // 5. 기본 궁극기 거대 망령
    fresh(); crowd(16); const u0 = G.stats.dmg.ult || 0; G.p.ult = JOB_CFG.ultNeed; useUlt(); runT(4);
    ok(N().giant && (S6().giantSw || 0) >= 2 && (G.stats.dmg.ult || 0) > u0, `거대 망령: 낫 휘두르기 ${S6().giantSw}회·피해 ${Math.round((G.stats.dmg.ult || 0) - u0)}`);
    ok(heroStatus60('').startsWith('거대 망령'), '거대 망령 상태 글자'); runT(9); ok(!N().giant, '12초 뒤 등불로 돌아감');
    // 6. 인물 각성 A 작은 망령 · 영혼 방출
    fresh(); applyAw60('A'); cine(); N().soulN = 6; dropSoul64(G.p.x, G.p.y); runT(0.3);
    ok(wrN('small') === 3 && wrN('wr') === 0, '각성 A: 영혼 7개마다 작은 망령 3마리');
    for (let i = 0; i < 6; i++) { N().soulN = 6; dropSoul64(G.p.x, G.p.y); runT(0.3); } ok(wrN('small') === 15, '작은 망령 상한 15 (' + wrN('small') + ')');
    crowd(16); const u1 = G.stats.dmg.ult || 0; G.p.ult = JOB_CFG.ultNeed; useUlt(); runT(4.5);
    ok((S6().release || 0) > 0 && (G.stats.dmg.ult || 0) > u1, '영혼 방출 피해 (' + Math.round((G.stats.dmg.ult || 0) - u1) + ')');
    // 7. 인물 각성 B 강한 망령 · 귀속
    fresh(); applyAw60('B'); cine(); N().soulN = 9; dropSoul64(G.p.x, G.p.y); runT(0.3);
    ok(wrN('strong') === 1 && heroStatus60('').includes('/10'), '각성 B: 영혼 10개마다 강한 망령');
    for (let i = 0; i < 5; i++) { N().soulN = 9; dropSoul64(G.p.x, G.p.y); runT(0.3); } ok(wrN('strong') === 4, '강한 망령 상한 4 (' + wrN('strong') + ')');
    crowd(12, 'slime'); const wh1 = S6().wrHit || 0; runT(3); ok((S6().wrHit || 0) > wh1, '강한 망령 휘두르기 (' + ((S6().wrHit || 0) - wh1) + ')');
    ok(N().ally.filter(a => a.kind === 'strong').every(a => dist2(a.x, a.y, G.p.x, G.p.y) < 300 * 300), '강한 망령 결속 범위 안');
    G.p.ult = JOB_CFG.ultNeed; useUlt(); runT(0.2); ok(wrN('strong') === 0 && N().bind > 7 && N().bindK === 1, '귀속: 망령 흡수 → 8초 강화');
    ok(Math.abs(HERO60.necromancer.hurtMul() - 0.8) < 1e-6, '귀속 받는 피해 -20%');
    clear(); const e1 = makeEnemy(T[0], G.p.x + 60, G.p.y); e1.hp = e1.mhp = 99999; for (let i = 0; i < 3; i++) { const e = makeEnemy(T[0], G.p.x + 70, G.p.y + 20 * i - 20); e.hp = e.mhp = 99999; }
    base().t = 0; step(1 / 60); ok(base().lk.length === 3, '귀속: 줄기 1 → 3 (' + base().lk.length + ')');
    runT(8.5); ok(!(N().bind > 0), '귀속 8초 뒤 종료');
    // 8. 연성 7종
    const groups = [['cleave', 'dagger', 'arrow', 'turret'], ['fireball', 'bell', 'thorn']];
    for (const ids of groups) {
      fresh();
      for (const id of ids) { G.p.weapons.push({ id, lvl: 5, t: 0.2 }); applyFuse60(id); settle(); cine(); }
      STATE.dev.auto = false;
      ok(ids.every(id => G.p.weapons.find(x => x.id === id && x.fu && x.fu.nm === FUSE60_NM.necromancer[id])), '연성 적용: ' + ids.map(id => FUSE60_NM.necromancer[id]).join('·'));
      if (ids.includes('bell')) { N().soulN = 6; dropSoul64(G.p.x, G.p.y); runT(0.3); }
      const dd = Object.assign({}, G.stats.dmg); run(20, 1);
      for (const id of ids) ok((G.stats.dmg[id] || 0) > (dd[id] || 0), FUSE60_NM.necromancer[id] + ' 피해 (' + Math.round((G.stats.dmg[id] || 0) - (dd[id] || 0)) + ')');
      if (ids.includes('cleave')) ok((S6().eatMax || 0) >= 2, '넋 먹는 칼날: 벤 수만큼 다음 휩쓸기 확대 (최대 ' + S6().eatMax + '마리분)');
      if (ids.includes('dagger')) ok((S6().rend || 0) > 0, '넋 가르기: 한 박자 뒤 넋 긋기 (' + S6().rend + ')');
      if (ids.includes('arrow')) { clear(); const L = [0, 1, 2].map(i => makeEnemy(T[0], G.p.x + 80 + i * 60, G.p.y)); L.forEach(e => { e.hp = e.mhp = 9999; e.frz = 99; }); const h = L.map(e => e.hp);
        const aw = G.p.weapons.find(x => x.id === 'arrow'); aw.t = 0; runT(0.8); ok(L.every((e, i) => e.hp < h[i]), '꿰뚫는 혼살: 일직선 적 3마리 모두 맞음'); }
      if (ids.includes('turret')) { const tm = N().tombs.length; ok((S6().tomb || 0) > 0 && tm <= 3 && (S6().tombWr || 0) > 0, `묘비: 세움 ${S6().tomb}·망령 일어남 ${S6().tombWr}·현재 ${tm}개(최대 3)`); }
      if (ids.includes('fireball')) ok((S6().wisp || 0) > 0, '도깨비불: 따라가 닿아 폭발 (' + S6().wisp + ')');
      if (ids.includes('bell')) ok((S6().knell || 0) > 0 && (S6().knellWr || 0) > 0, `조종: 울림 ${S6().knell}·망령 곁 울림 ${S6().knellWr}`);
      if (ids.includes('thorn')) { ok((S6().hand || 0) > 0 && (S6().handTk || 0) > 0, `망자의 손: 붙잡음 ${S6().hand}·빨아들임 ${S6().handTk}`);
        clear(); const e = makeEnemy(T[0], G.p.x + 120, G.p.y); e.hp = e.mhp = 9999; const x0 = e.x; const tw = G.p.weapons.find(x => x.id === 'thorn'); tw.t = 0; runT(0.3); ok(Math.abs(e.x - x0) < 25, '망자의 손: 끌어당김 없음'); }
    }
    // 9. 자동 플레이 (일반 흐름)
    fresh(); STATE.dev.auto = true; run(60, 0);
    ok((G.stats.dmg.lamp || 0) > 0 && (S6().soulGot || 0) > 0, `자동 플레이: 등불 피해 ${Math.round(G.stats.dmg.lamp || 0)}·영혼 ${S6().soulGot || 0}·망령 소환 ${S6().wr || 0}`);
    render();
    } catch (e) { ok(false, '실행 오류 ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' / ')); }
    return out;
  }).catch(e => ['FAIL 실행 오류 ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' / ')]);
  console.log(res.join('\n'));
  console.log('page errors', errs.length, errs.slice(0, 5));
  const fails = res.filter(l => l.startsWith('FAIL')).length + errs.length;
  console.log(`사령술사 점검 ${res.length - res.filter(l => l.startsWith('FAIL')).length}/${res.length} 통과, 페이지 오류 ${errs.length}`);
  await b.close(); SERVER.close(); process.exit(fails ? 1 : 0);
})();
