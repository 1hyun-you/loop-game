// 0.58 궁극기 버튼·명칭 점검: 표시 조건·위치(좌/우·가장자리 반전·고정형)·터치 발동·다중 터치·조이스틱 차단·정지 발동 폐지·자동 설정·명칭
// 사용: NODE_PATH=$(npm root -g) node dev/vshot58.js [저장 폴더]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), PORT = 48298, OUT = process.argv[2] || '/tmp/shot58';
fs.mkdirSync(OUT, { recursive: true });
const SERVER = http.createServer((q, s) => { const u = decodeURIComponent((q.url || '/').split('?')[0]), f = path.join(ROOT, u); if (/\.(png|woff2)$/.test(u) && fs.existsSync(f)) return s.end(fs.readFileSync(f)); s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(fs.readFileSync(path.join(ROOT, 'index.html'))); });
const wait = ms => new Promise(r => setTimeout(r, ms));
const VIEWS = (process.env.VIEWS || '360x780,412x915,768x1024').split(',').map(v => v.split('x').map(Number));
(async () => {
  await new Promise(r => SERVER.listen(PORT, '127.0.0.1', r));
  const b = await chromium.launch({ args: ['--disable-gpu'] }); const fails = [], allErr = []; let n = 0;
  let VW = 0; const ok = (c, m) => { n++; if (!c) fails.push(VW + ': ' + m); };
  for (const [W, H] of VIEWS) {
    VW = W; const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true }), p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    const ev = (f, a) => p.evaluate(f, a);
    const shot = (nm) => p.screenshot({ path: `${OUT}/${W}_${nm}.png` });
    await p.goto(`http://127.0.0.1:${PORT}/`); await wait(500);
    await ev(() => { localStorage.clear(); saveCache = null; });
    await ev(() => { SETTINGS.dlgAuto = true; STATE.dev.auto = false; newRun(); STATE.mode = 'play'; hideUI(); G.sel = null; });
    for (let i = 0; i < 60; i++) { await wait(80); const m = await ev(() => { if (STATE.mode === 'talk') dlgTap(); else if (STATE.mode === 'select' && G.sel && G.sel.kind === 'start') pickCard(0); return STATE.mode; }); if (m === 'play' && i > 3 && await ev(() => G.p.weapons.length > 0)) break; }
    await ev(() => { if (STATE.mode === 'select') { hideUI(); G.sel = null; STATE.mode = 'play'; } STATE.dev.god = true; applyJob('pyromancer'); if (STATE.mode !== 'play') { hideUI(); G.sel = null; STATE.mode = 'play'; } });
    ok(await ev(() => JOBS.pyromancer.name === '화염술사' && JOBS.pyromancer.ic === '화'), '화염술사 명칭');
    ok(await ev(() => ult58Visible()), '인물 선택 순간 궁극기 가득·버튼 표시');   // 0.60 선택 순간 게이지 가득
    await ev(() => { G.p.ult = 0; });
    ok(await ev(() => !ult58Visible()), '게이지 미충전 시 버튼 없음');
    // 정지 발동 폐지: 가득 채우고 손 뗀 채 2초
    await ev(() => { G.p.ult = JOB_CFG.ultNeed; G.tm.readyAt = G.time; });
    const u0 = await ev(() => G.stats.ults); await wait(2000);
    ok(await ev(u => G.stats.ults === u && ultReady(), u0), '정지 2초 발동 없음');
    ok(await ev(() => ult58Visible()), '가득 시 버튼 표시');
    await shot('ready_first');
    // 기준점: 첫 터치 전 = 고정 위치 왼쪽
    let bp = await ev(() => ({ ...ult58Pos(), f: joyFixed(), R: CFG.joyR }));
    ok(bp.x < bp.f.x - bp.R && Math.abs(bp.y - bp.f.y) < 2, '기본 왼쪽·가동 범위 바깥 ' + JSON.stringify(bp));
    // 조이스틱 잡은 채(가운데) 다른 손가락으로 버튼
    const cx = Math.round(W / 2), cy = Math.round(H * 0.7);
    await ev(([x, y]) => { const t = document.getElementById('c'); t.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: x, clientY: y, bubbles: true, cancelable: true })); t.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: x + 30, clientY: y, bubbles: true })); }, [cx, cy]);
    await wait(100);
    bp = await ev(() => ult58Pos());
    ok(await ev(([x, y]) => { const b = ult58Pos(); return Math.abs(b.y - y) < 2 && b.x < x - CFG.joyR; }, [cx, cy]), '조이스틱 중심 왼쪽 따라감');
    await shot('ready_joy');
    const u1 = await ev(() => G.stats.ults);
    await ev(b => { const t = document.getElementById('c'); t.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 2, clientX: b.x, clientY: b.y, bubbles: true, cancelable: true })); t.dispatchEvent(new PointerEvent('pointerup', { pointerId: 2, clientX: b.x, clientY: b.y, bubbles: true })); }, bp);
    await wait(150);
    ok(await ev(u => G.stats.ults === u + 1 && !ultReady(), u1), '다중 터치 버튼 발동');
    ok(await ev(() => INPUT.active && INPUT.id === 1), '조이스틱 유지');
    await ev(([x, y]) => document.getElementById('c').dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: x, clientY: y, bubbles: true })), [cx, cy]);
    await wait(100);
    // 손 뗀 뒤: 마지막 중심 유지, 버튼 탭이 조이스틱을 시작하지 않음
    await ev(() => { G.p.ult = JOB_CFG.ultNeed; G.tm.readyAt = G.time; });
    await wait(400);
    ok(await ev(([x, y]) => { const b = ult58Pos(); return Math.abs(b.y - y) < 2 && b.x < x; }, [cx, cy]), '손 뗀 뒤 마지막 위치 유지');
    bp = await ev(() => ult58Pos());
    const u2 = await ev(() => G.stats.ults);
    await p.touchscreen.tap(bp.x, bp.y); await wait(150);
    ok(await ev(u => G.stats.ults === u + 1 && !INPUT.active, u2), '실제 탭 발동·조이스틱 미시작');
    // 버튼 없는 위치 탭은 조이스틱 시작 (회귀 확인)
    await ev(([x, y]) => document.getElementById('c').dispatchEvent(new PointerEvent('pointerdown', { pointerId: 3, clientX: x, clientY: y, bubbles: true, cancelable: true })), [cx, cy]);
    ok(await ev(() => INPUT.active && INPUT.id === 3), '일반 터치 조이스틱 시작');
    await ev(([x, y]) => document.getElementById('c').dispatchEvent(new PointerEvent('pointerup', { pointerId: 3, clientX: x, clientY: y, bubbles: true })), [cx, cy]);
    // 가장자리: 왼쪽 끝에서 조이스틱 → 버튼 오른쪽으로 반전
    await ev(() => { G.p.ult = JOB_CFG.ultNeed; ULT58.ax = innerWidth - 80; });
    await ev(() => document.getElementById('c').dispatchEvent(new PointerEvent('pointerdown', { pointerId: 4, clientX: 40, clientY: innerHeight * 0.7, bubbles: true, cancelable: true })));
    await wait(80);
    ok(await ev(() => { const b = ult58Pos(); return b.x > 40 + CFG.joyR && b.x <= innerWidth - ULT58.r; }), '왼쪽 끝 → 오른쪽 반전');
    await shot('edge_left');
    await ev(() => document.getElementById('c').dispatchEvent(new PointerEvent('pointerup', { pointerId: 4, clientX: 40, clientY: 400, bubbles: true })));
    // 설정 오른쪽
    await ev(() => { SETTINGS.ultSide = 'R'; });
    ok(await ev(() => { const b = ult58Pos(), a = ult58Anchor(); return b.x > a.x + CFG.joyR || b.x < a.x; }), '설정 오른쪽(가장자리면 반전)');
    await ev(() => { ULT58.ax = innerWidth / 2; });
    ok(await ev(() => ult58Pos().x > innerWidth / 2 + CFG.joyR), '설정 오른쪽 표시');
    await shot('right');
    // 고정형
    await ev(() => { SETTINGS.joy = 'fixed'; SETTINGS.ultSide = 'L'; });
    ok(await ev(() => { const b = ult58Pos(), f = joyFixed(); return b.x < f.x - CFG.joyR && Math.abs(b.y - f.y) < 2; }), '고정형 기준');
    await shot('fixed');
    await ev(() => { SETTINGS.joy = 'float'; });
    // 키보드
    await ev(() => { G.p.ult = JOB_CFG.ultNeed; }); const u3 = await ev(() => G.stats.ults); await p.keyboard.press('q'); await wait(100);
    ok(await ev(u => G.stats.ults === u + 1, u3), 'Q 키 발동');
    // 일시정지 중 숨김
    await ev(() => { G.p.ult = JOB_CFG.ultNeed; pauseGame(); });
    ok(await ev(() => !ult58Visible()), '일시정지 중 숨김');
    await ev(() => { resumeGame(); hideUI(); STATE.mode = 'play'; });
    // 자동 설정: 버튼 표시·자동 발동 둘 다 동작
    await ev(() => { SETTINGS.autoUlt = true; G.p.ult = JOB_CFG.ultNeed; G.tm.readyAt = G.time - 13; });
    for (let i = 0; i < 20 && await ev(() => ultReady()); i++) await wait(150);
    ok(await ev(() => !ultReady()), '자동 궁극기 설정 유지');
    await ev(() => { SETTINGS.autoUlt = false; });
    // 안내 문구
    ok(await ev(() => !/손 떼|손을 떼/.test(document.documentElement.innerHTML.replace(/<script[\s\S]*?<\/script>/g, ''))), '화면 문구 정리');
    // 설정 화면 버튼
    await ev(() => { pauseGame(); showSettings(() => {}); });
    await wait(150);
    ok(await ev(() => !!document.getElementById('s_ults') && document.getElementById('s_ults').textContent === '왼쪽'), '설정 행 표시');
    await ev(() => document.getElementById('s_ults').click()); await wait(150);
    ok(await ev(() => SETTINGS.ultSide === 'R' && document.getElementById('s_ults').textContent === '오른쪽' && JSON.parse(localStorage.getItem(CFG.SAVE_KEY + '_set')).ultSide === 'R'), '설정 전환·저장');
    await shot('settings');
    ok(await ev(() => { const r = document.getElementById('s_ults').getBoundingClientRect(); return r.right <= innerWidth && r.height >= 28; }), '설정 버튼 화면 안');
    errs.forEach(e => allErr.push(`${W}: ${e}`));
    await ctx.close();
  }
  await b.close(); SERVER.close();
  const nf = fails.filter(Boolean);
  console.log(`0.58 점검 ${n - nf.length}/${n} 통과, 오류 ${allErr.length}`); nf.forEach(f => console.log(' 실패: ' + f)); allErr.forEach(e => console.log(' 오류: ' + e));
})();
