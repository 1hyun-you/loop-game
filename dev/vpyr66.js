// 0.66 화염술사 집중 점검: 불붙음(3초·매초 10%·전용 상태), 화염구 발현 A·B → 불기둥·폭렬 창, 궁극기 3종, 인물 각성 A 불 거두기·B 불티,
//   연성 7종 발동·피해·불붙음·특수 동작, 자동 플레이, 페이지 오류
// 사용: NODE_PATH=$(npm root -g) node dev/vpyr66.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), PORT = +(process.env.PORT || 48366);
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
    const fresh = () => { base0(); G.p.weapons = G.p.weapons.filter(w => w.id === 'fireball'); applyHero60('pyromancer'); settle(); cine(); STATE.dev.auto = false; INPUT.keys = {}; G.p.need = 1e9; clear(); };
    try {
    const P = () => G.p66, base = () => baseW(), S6 = () => S60();
    const tank = (x, y, n = 1) => { const L = []; for (let i = 0; i < n; i++) { const e = makeEnemy(T[0], x + i * 30, y); e.hp = e.mhp = 1e6; e.frz = 99; L.push(e); } return L; };
    // 1. 선택·구현 상태
    fresh();
    ok(G.p.job === 'pyromancer' && HERO60.pyromancer.impl && heroSlotN() === 4 && base() && base().id === 'fireball', '화염술사 선택·구현 상태·전용 화염구·일반 무기 4칸');
    ok(HERO60.pyromancer.br.length === 2 && HERO60.pyromancer.wak.A && HERO60.pyromancer.wak.B && Object.keys(FUSE60.pyromancer).length === 7, '발현 2·무기 각성 2·연성 7종 등록');
    // 2. 불붙음
    let [e1] = tank(G.p.x + 120, G.p.y); base().t = 0; runT(1.2);
    ok(burning66(e1), '화염구에 맞은 적 불붙음');
    const bd0 = G.stats.dmg.burn66 || 0; runT(2.2); const bd = (G.stats.dmg.burn66 || 0) - bd0;
    const nt = bd / (fbD66() * 0.1); ok(bd > 0 && Math.abs(nt - Math.round(nt)) < 0.05 && Math.round(nt) >= 2 && Math.round(nt) <= 3, '불붙음: 1초마다 화염구 피해 10% (2.2초 ' + nt.toFixed(2) + '틱)');
    clear(); [e1] = tank(G.p.x + 600, G.p.y); burn66(e1); runT(3.2); ok(!burning66(e1), '불 지속 3초');
    clear(); G.p.weapons.push({ id: 'dagger', lvl: 1, t: 0 }); const [e2] = tank(G.p.x + 60, G.p.y); base().t = 99; runT(1.5);
    ok(!burning66(e2) && (G.stats.dmg.dagger || 0) > 0, '공용 무기(짝 무기 단검)는 불붙음 없음');
    G.p.weapons = G.p.weapons.filter(w => w.id !== 'dagger');
    // 3. 발현 A 큰 불꽃 → 불기둥
    fresh(); let w = base(); w.lvl = 3; checkBranch('w', w.id); ok(G.pendingBr.some(q => q.id === 'fireball'), 'Lv 3 화염구 발현 대기');
    G.pendingBr = []; applyBranch({ t: 'branch', id: 'fireball', k: 'A', kind: 'w' }); tank(G.p.x + 100, G.p.y); G.proj = []; w.t = 0; step(1 / 60);
    const pr = G.proj.find(q => q.p66); ok(pr && Math.abs(pr.R / (35 * wStats(w).area) - 1.6) < 0.01, '큰 불꽃: 폭발 반경 +60%');
    w.lvl = 5; checkBranch('w', w.id); ok(w.aw === 'A', '무기 각성 A 불기둥 자동');
    runT(6); ok((S6().pillar || 0) > 0, '불기둥: 4번째 발동마다 (' + S6().pillar + '회)');
    // 4. 발현 B 불의 창 → 폭렬 창
    fresh(); w = base(); w.lvl = 3; checkBranch('w', w.id); G.pendingBr = []; applyBranch({ t: 'branch', id: 'fireball', k: 'B', kind: 'w' });
    const L3 = tank(G.p.x + 70, G.p.y, 3), h3 = L3.map(e => e.hp); w.t = 0; runT(0.8);
    ok(L3.every((e, i) => e.hp < h3[i] && burning66(e)), '불의 창: 일직선 3마리 관통·불붙음');
    w.lvl = 5; checkBranch('w', w.id); ok(w.aw === 'B', '무기 각성 B 폭렬 창 자동'); runT(6);
    ok((S6().burstSp || 0) > 0, '폭렬 창: 3번째 발동마다 박힌 자리 폭발 (' + S6().burstSp + '회)');
    // 5. 기본 궁극기 화염 해방
    fresh(); crowd(14); const cw = G.enemies.filter(e => !e.dead); cw.forEach(e => { e.hp = e.mhp = 1e6; }); const u0 = G.stats.dmg.ult || 0; G.p.ult = JOB_CFG.ultNeed; useUlt(); runT(0.5);
    ok((G.stats.dmg.ult || 0) > u0 && cw.every(burning66), '화염 해방: 큰 폭발·범위 안 적 전부 불붙음 (' + Math.round((G.stats.dmg.ult || 0) - u0) + ')');
    // 6. 인물 각성 A 불 거두기 · 불사조
    fresh(); applyAw60('A'); cine(); for (let i = 0; i < 8; i++) { const e = makeEnemy('slime', G.p.x + 300, G.p.y + i * 10); burn66(e); damageEnemy(e, 99999, { src: 'cleave' }); }
    ok(P().embers === 5, '불 거두기: 불붙은 적이 죽으면 불꽃 (최대 5, 현재 ' + P().embers + ')');
    clear(); tank(G.p.x + 100, G.p.y); G.proj = []; base().t = 0; step(1 / 60); const pe = G.proj.find(q => q.p66);
    ok(P().embers === 0 && pe && Math.abs(pe.dmg / wStats(base()).dmg - 1.5) < 0.01, '다음 화염구에 실림: 피해 +10% × 5 (' + (pe ? (pe.dmg / wStats(base()).dmg).toFixed(2) : '-') + ')');
    clear(); crowd(14); base().t = 999; const u1 = G.stats.dmg.ult || 0; G.p.ult = JOB_CFG.ultNeed; useUlt(); runT(6.3);
    ok((S6().phHit || 0) > 0 && (G.stats.dmg.ult || 0) > u1 && !P().phoenix && P().embers === 5, '불사조: 3번 가로지름·피해 (' + Math.round((G.stats.dmg.ult || 0) - u1) + ')·끝나면 불꽃 5개 [통과 ' + (S6().phHit || 0) + '·진행 ' + !!P().phoenix + '·불꽃 ' + P().embers + ']');
    // 7. 인물 각성 B 불티 · 거대 불덩이
    fresh(); applyAw60('B'); cine(); const tb = tank(G.p.x + 100, G.p.y, 1)[0]; const near = tank(G.p.x + 130, G.p.y + 40, 3); burn66(tb); G.proj = []; base().t = 0; const sp0 = S6().spark || 0; runT(1.5);
    ok((S6().spark || 0) - sp0 >= 2 && near.filter(burning66).length >= 2, '불티: 불붙은 적을 또 맞히면 3번 튀며 불을 옮김 (' + ((S6().spark || 0) - sp0) + '번)');
    clear(); crowd(16); G.enemies.forEach(e => { e.hp = e.mhp = 1e6; }); const u2 = G.stats.dmg.ult || 0, mh0 = S6().meteorHop || 0; G.p.ult = JOB_CFG.ultNeed; useUlt(); runT(3);
    ok((S6().meteorHop || 0) - mh0 >= 8 && (G.stats.dmg.ult || 0) > u2, '거대 불덩이: 적에서 적으로 튐 (' + ((S6().meteorHop || 0) - mh0) + '번)');
    // 8. 연성 7종
    const groups = [['cleave', 'dagger', 'arrow', 'turret'], ['lamp', 'bell', 'thorn']];
    for (const ids of groups) {
      fresh();
      for (const id of ids) { G.p.weapons.push({ id, lvl: 5, t: 0.2 }); applyFuse60(id); settle(); cine(); }
      STATE.dev.auto = false; base().t = 999;
      ok(ids.every(id => G.p.weapons.find(x => x.id === id && x.fu && x.fu.nm === FUSE60_NM.pyromancer[id])), '연성 적용: ' + ids.map(id => FUSE60_NM.pyromancer[id]).join('·'));
      const dd = Object.assign({}, G.stats.dmg), bn0 = S6().burnN || 0; run(20, 1);
      for (const id of ids) ok((G.stats.dmg[id] || 0) > (dd[id] || 0), FUSE60_NM.pyromancer[id] + ' 피해 (' + Math.round((G.stats.dmg[id] || 0) - (dd[id] || 0)) + ')');
      ok((S6().burnN || 0) > bn0, '연성 무기에 맞은 적 불붙음 (' + ((S6().burnN || 0) - bn0) + ')');
      if (ids.includes('cleave')) ok((S6().blade || 0) > 0, '불꽃 대검 휩쓸기 ' + S6().blade);
      if (ids.includes('dagger')) ok((S6().xcut || 0) > 0, 'X자 불칼금: 둘째 줄 ' + S6().xcut);
      if (ids.includes('arrow')) ok((S6().arrowK || 0) > 1.2, '불씨살: 멀리 날수록 강해짐 (최대 ×' + (S6().arrowK || 0).toFixed(2) + ')');
      if (ids.includes('turret')) ok((S6().spiritHit || 0) > 0 && P().spirits.length <= 3, `불꽃 정령: 들이받기 ${S6().spiritHit}·현재 ${P().spirits.length}마리(최대 3)`);
      if (ids.includes('lamp')) { clear(); tank(G.p.x + 60, G.p.y, 2); for (let i = 0; i < 200; i++) { for (const x of G.p.weapons) if (x.id !== 'lamp') x.t = 9; step(1 / 60); } ok((S6().lampMax || 0) > 1 && G.p.weapons.find(x => x.id === 'lamp').lk.length === 2, '화염 등불: 2마리·오래 쬘수록 증가 (×' + (S6().lampMax || 0).toFixed(2) + ')'); }
      if (ids.includes('bell')) ok((S6().breath2 || 0) > 0, '뜨거운 숨: 두 번째 고리 ' + S6().breath2);
      if (ids.includes('thorn')) { ok((S6().vine || 0) > 0 && (S6().vineTk || 0) > 0, `불넝쿨: 묶음 ${S6().vine}·조임 ${S6().vineTk}`);
        clear(); const e = makeEnemy(T[0], G.p.x + 120, G.p.y); e.hp = e.mhp = 9999; const x0 = e.x; const tw = G.p.weapons.find(x => x.id === 'thorn'); tw.t = 0; runT(0.3); ok(Math.abs(e.x - x0) < 25, '불넝쿨: 끌어당김 없음'); }
    }
    // 9. 자동 플레이 (일반 흐름)
    fresh(); STATE.dev.auto = true; run(60, 0);
    ok((G.stats.dmg.fireball || 0) > 0, `자동 플레이: 화염구 피해 ${Math.round(G.stats.dmg.fireball || 0)}·불붙임 ${S6().burnN || 0}회·불붙음 피해 ${Math.round(G.stats.dmg.burn66 || 0)}`);
    ok(/^(불붙음|불사조|거대)/.test(heroStatus60('')), '상태 글자');
    render();
    } catch (e) { ok(false, '실행 오류 ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' / ')); }
    return out;
  }).catch(e => ['FAIL 실행 오류 ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' / ')]);
  console.log(res.join('\n'));
  console.log('page errors', errs.length, errs.slice(0, 5));
  const fails = res.filter(l => l.startsWith('FAIL')).length + errs.length;
  console.log(`화염술사 점검 ${res.length - res.filter(l => l.startsWith('FAIL')).length}/${res.length} 통과, 페이지 오류 ${errs.length}`);
  await b.close(); SERVER.close(); process.exit(fails ? 1 : 0);
})();
