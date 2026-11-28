// 0.69 대규모 밸런스 점검: 임시 보정 제거·정식 수치, 연성 카드 시점(Lv 4 → 5), 시야 1.2배, 우두머리 페이즈(순서·등장·패턴 4종·보상·퇴각),
//   보조 효과 치명타, 프리스트 보호막 1회 막음, 궁수 버티기 사격, 엔지니어 기계 체력 성장·출력·상한, 페이지 오류
// 사용: NODE_PATH=$(npm root -g) node dev/vbal69.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), PORT = +(process.env.PORT || 48369);
const SERVER = http.createServer((q, s) => { const u = decodeURIComponent((q.url || '/').split('?')[0]), f = path.join(ROOT, u); if (/\.(png|woff2|webmanifest)$/.test(u) && fs.existsSync(f)) return s.end(fs.readFileSync(f)); s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(fs.readFileSync(path.join(ROOT, 'index.html'))); });
(async () => {
  await new Promise(r => SERVER.listen(PORT, '127.0.0.1', r));
  const b = await chromium.launch({ args: ['--disable-gpu'] }), p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://127.0.0.1:${PORT}/`); await p.waitForTimeout(1500);
  const res = await p.evaluate(() => {
    const out = [], ok = (c, m) => out.push((c ? 'ok  ' : 'FAIL') + ' ' + m);
    const settle = () => { let g = 0; while (STATE.mode !== 'play' && g++ < 20) { if (STATE.mode === 'talk') { if (typeof dlgTap === 'function') dlgTap(); else STATE.mode = 'play'; } else if (STATE.mode === 'select' && G.sel) { if (G.sel.kind === 'keep') keepOk60(); else pickCard(0); } else { hideUI(); G.sel = null; STATE.mode = 'play'; } } };
    const run = sec => { for (let i = 0; i < sec * 60; i++) { settle(); step(1 / 60); if (i % 5 === 0) render(); if (G.result) { G.result = null; G.endT = 0; } } };
    const base0 = () => { SETTINGS.dlgAuto = true; STATE.dev.auto = true; STATE.dev.god = true; newRun(); STATE.mode = 'play'; hideUI(); G.sel = null; G.storyOn = true; run(1); };
    const cine = () => { for (let i = 0; i < 600 && G.h47 && G.h47.cine; i++) step(1 / 60); };
    const clear = () => { G.enemies.forEach(e => e.dead = true); G.enemies = G.enemies.filter(e => !e.dead); G.hz = []; G.eb = []; };
    const fresh = (job, wid) => { base0(); G.p.weapons = G.p.weapons.filter(w => w.id === wid); if (!G.p.weapons.length) G.p.weapons.push({ id: wid, lvl: 1, t: 0 }); applyHero60(job); settle(); cine(); STATE.dev.auto = false; INPUT.keys = {}; G.p.need = 1e9; clear(); };
    try {
      // 1. 임시 보정 제거·정식 수치
      ok(typeof TEMP60 === 'undefined', '전환기 임시 보정(TEMP60) 제거');
      const bd = PW60.map(id => WEAPONS[id].base.dmg).join(',');
      ok(bd === '23,19,21,11,22,7,14,18', '짝 무기 표 피해 (대검·단검·장궁·포탑·화염구·등불·종·덩굴) ' + bd);
      ok(CFG.xp.base === 4 && CFG.xp.linear === 4 && CFG.xp.powMul === 0.72 && CFG.spawn.base === 1.12 && CFG.spawn.perMin === 1.89, '경험치 곡선·출현 정식 수치 (옛 1.25배·0.7배 편입)');
      ok(CFG.scale.hpPerMin === 0.42, '적 체력 성장 분당 +42%');
      base0(); const w0 = { id: 'dagger', lvl: 1, t: 0 }; G.p.weapons = [w0]; recalc();
      ok(Math.abs(wStats(w0).dmg - 19 * G.p.mod.dmg) < 0.01, '무기 피해 = 표 피해 × 공격력 (추가 배율 없음) ' + wStats(w0).dmg.toFixed(1));
      // 2. 연성 카드 시점
      fresh('pyromancer', 'fireball'); const d4 = { id: 'dagger', lvl: 4, t: 0 }; G.p.weapons.push(d4); recalc();
      ok(!levelCands().some(c => c.t === 'wup' && c.id === 'dagger'), 'Lv 4 짝 무기: 일반 강화 카드 없음');
      ok(fuseCands60().includes(d4), 'Lv 4 짝 무기: 연성 후보');
      let cs = drawCards(selN()); ok(cs[0] && cs[0].t === 'fuse60' && cs[0].id === 'dagger', 'Lv 4 → 5 카드 = 연성 카드 (맨 앞)');
      applyCard(cs[0]); ok(d4.lvl === 5 && d4.fu && d4.fu.nm === FUSE60_NM.pyromancer.dagger, '연성 카드 선택 → Lv 5 + 연성 (' + (d4.fu && d4.fu.nm) + ')');
      const d3 = { id: 'arrow', lvl: 3, t: 0 }; G.p.weapons.push(d3); recalc();
      ok(!fuseCands60().includes(d3) && levelCands().some(c => c.t === 'wup' && c.id === 'arrow'), 'Lv 3 짝 무기: 연성 후보 아님·일반 강화');
      base0(); G.p.job = null; const pre = { id: 'bell', lvl: 4, t: 0 }; G.p.weapons = [pre]; recalc();
      ok(levelCands().some(c => c.t === 'wup' && c.id === 'bell'), '인물 선택 전: Lv 4 → 5 일반 강화 (인물 선택 후 연성 카드)');
      // 3. 시야 1.2배
      const vw = 360 / battleZoom(360, 780); ok(vw > 325 && vw < 345, 'S23 폭 360 기준 보이는 폭 ' + vw.toFixed(0) + ' (옛 279)');
      // 4. 우두머리 페이즈 순서
      let mid = 0, cnt = 0, lens = {};
      for (let i = 0; i < 40; i++) { const o = pickPhaseOrder(false); cnt += o.filter(x => x === 'chief').length; if (o.indexOf('chief') === Math.ceil((o.length - 1) / 2)) mid++; lens[o.length] = 1; }
      ok(cnt === 40 && mid === 40, '판마다 우두머리 1번·가운데 고정 (길이 ' + Object.keys(lens).join('/') + ' + 수문장)');
      ok(!pickPhaseOrder(true).includes('chief'), '재도전 판은 우두머리 없음');
      base0(); const ph = G.ph; const ci = ph.order.indexOf('chief');
      for (let k = 0; k < 6; k++) { if (ph.i + 1 >= ci) break; ph.i++; phaseChooseNext(); }
      ok(ph.order.indexOf('chief') === ci, '강함 판정 순서 바꾸기에도 우두머리 위치 유지');
      // 5. 등장·패턴·보상
      const pats = {}, T0 = CH69.types.slice();
      for (const t of T0) {
        base0(); clear(); G.time = 360; const P = G.ph; P.order = ['horde', 'chief', 'horde', 'gate']; P.i = 0; P.inGap = true; P.gapT = 0; CH69.types = [t];
        updatePhase(1 / 60); const e = chiefOf69();
        ok(e && e.chief === t && e.cmd && e.maxHp > CH69.hp * 3 && e.r > ENEMIES[t].r * 2, `${CH69[t].nm} 등장 (체력 ${e ? Math.round(e.maxHp) : 0}·크기 ${e ? e.r.toFixed(0) : 0})`);
        if (!e) continue;
        e.x = G.p.x + 150; e.y = G.p.y; e.ai69.cd = 0; const hz0 = G.hz.length, eb0 = G.eb.length, n0 = G.enemies.length;
        for (let i = 0; i < 150; i++) { e.hp = e.maxHp; step(1 / 60); }
        pats[t] = S60().chief.slice(-1)[0][3];
        ok(pats[t] >= 1 && (G.hz.length > hz0 || G.eb.length > eb0 || G.enemies.length > n0 || t === 'knight'), `${CH69[t].nm} 패턴 '${CH69[t].pat}' 발동 ${pats[t]}회`);
        e.x = G.p.x + 400; e.y = G.p.y; const ch0 = G.chests.length; e.hp = 1; damageEnemy(e, 999, { src: 'test' }); for (let i = 0; i < 5; i++) step(1 / 60);
        ok(G.chests.length - ch0 === CH69.chests, `${CH69[t].nm} 처치 → 보물 상자 ${G.chests.length - ch0}개`);
      }
      CH69.types = T0;
      base0(); clear(); const P2 = G.ph; P2.order = ['horde', 'chief', 'horde', 'gate']; P2.i = 0; P2.inGap = true; P2.gapT = 0; updatePhase(1 / 60);
      const e2 = chiefOf69(), c0 = G.chests.length; P2.t = CH69.fail + 0.1; e2.hp = e2.maxHp; updatePhase(1 / 60);
      ok(G.chests.length === c0 && e2.dead && G.ph.inGap && S60().chief.slice(-1)[0][2] === -1, '120초 초과 → 우두머리 퇴각·보상 없음');
      // 6. 공용·인물 조정
      ok(CRIT60.per === 0.08 && /\+40%/.test(PASSIVES.crit.desc(5)), '보조 효과 치명타 레벨당 +8% (Lv 5 = 40%)');
      fresh('priest', 'bell'); Qg().shieldT = 2; G.p.invT = 0;
      ok(HERO60.priest.avoid() === true && Qg().shieldT === 0 && HERO60.priest.avoid() === false, '프리스트 보호막: 2초 안 피격 1번 막고 깨짐');
      fresh('archer', 'arrow'); const ea = makeEnemy('slime', G.p.x + 40, G.p.y); ea.hp = ea.maxHp = 1e5; G.p.moving = false; const kb0 = ea.kbx;
      HERO60.archer.onHit(ea, { src: 'arrow' }); ok(ea.kbx > kb0 + 100, '궁수 버티기 사격: 서서 쏠 때 반경 90 안 적 밀어냄');
      const eb2 = makeEnemy('slime', G.p.x + 200, G.p.y); eb2.hp = 1e5; HERO60.archer.onHit(eb2, { src: 'arrow' }); ok(!eb2.kbx, '반경 밖 적은 밀지 않음');
      { fresh('archer', 'arrow'); const bw = baseW(), t = makeEnemy('slime', G.p.x + 120, G.p.y); t.hp = t.maxHp = 1e6; G.p.moving = true; Ag().hunt = 0; bw.t = 0; const mv0 = S60().mvShot || 0;
        for (let i = 0; i < 30; i++) { INPUT.keys = { arrowup: true, w: true }; step(1 / 60); }
        ok((S60().mvShot || 0) > mv0 && (G.stats.dmg.arrow || 0) > 0, '궁수 이동 사격: 움직이는 동안에도 장궁 발동 (' + ((S60().mvShot || 0) - mv0) + '회)');
        ok(bw.t > wStats(bw).cd * 1.5, '이동 중 다음 발동 간격 3배 (남은 ' + bw.t.toFixed(2) + '초, 기본 ' + wStats(bw).cd.toFixed(2) + '초)'); INPUT.keys = {}; }
      { fresh('engineer', 'turret'); G.time = 120; const near = makeEnemy('slime', G.p.x + 30, G.p.y); near.hp = near.maxHp = 1e6; const m = place65('turret', baseW(), {}); m.x = G.p.x + 200; m.y = G.p.y; const far = makeEnemy('slime', m.x + 20, m.y); far.hp = far.maxHp = 1e6; gridBuild(G.enemies);
        ok(cover65(m.x, m.y, 240) === near && cover65(m.x, m.y, 100) === far, '엔지니어 엄호 사격: 사거리 안이면 캐릭터에 붙은 적 먼저, 아니면 기계 가까운 적');
        ok(E65C.cover.bossK === 0, '포탑 수문장 1.3배 조준: 승인 전 꺼짐'); }
      fresh('engineer', 'turret'); G.time = 600;
      const m = place65('turret', baseW(), {}); ok(m && Math.abs(m.mhp - 80 * 4) < 1, '엔지니어 기계 체력 80 × (1 + 분당 30%) = 10분 ' + (m ? m.mhp : 0));
      ok(heroStat60(baseW()).dmg === 1.5 && E65C.cap.turret === 5 && E65C.build.first === 1.5 && E65C.build.next === 1 && E65C.turret.fire === 0.65, '엔지니어 기계 출력 +50%·포탑 5대·설치 1.5초(이어서 1초)·발사 0.65초');
      render();
    } catch (e) { ok(false, '실행 오류 ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' / ')); }
    return out;
  }).catch(e => ['FAIL 실행 오류 ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' / ')]);
  console.log(res.join('\n'));
  console.log('page errors', errs.length, errs.slice(0, 5));
  const fails = res.filter(l => l.startsWith('FAIL')).length + errs.length;
  console.log(`0.69 밸런스 점검 ${res.length - res.filter(l => l.startsWith('FAIL')).length}/${res.length} 통과, 페이지 오류 ${errs.length}`);
  await b.close(); SERVER.close(); process.exit(fails ? 1 : 0);
})();
