// 0.57 치트 패널 점검 (0.57a 보스전 자동 전직 포함): 위치·묶음·버튼 동작·무기 고르기·연성 완료·구간 이동
// 사용: NODE_PATH=$(npm root -g) node dev/vshot57.js [저장 폴더]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), PORT = 48299, OUT = process.argv[2] || '/tmp/shot57';
fs.mkdirSync(OUT, { recursive: true });
const SERVER = http.createServer((q, s) => { const u = decodeURIComponent((q.url || '/').split('?')[0]), f = path.join(ROOT, u); if (/\.(png|woff2)$/.test(u) && fs.existsSync(f)) return s.end(fs.readFileSync(f)); s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(fs.readFileSync(path.join(ROOT, 'index.html'))); });
fs.mkdirSync(OUT, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
const VIEWS = (process.env.VIEWS || '360x780,412x915').split(',').map(v => v.split('x').map(Number));
(async () => {
  await new Promise(r => SERVER.listen(PORT, '127.0.0.1', r));
  const b = await chromium.launch({ args: ['--disable-gpu'] }); const allErr = [], fails = [];
  const ok = (c, m) => { if (!c) fails.push(m); };
  for (const [W, H] of VIEWS) {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true }), p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    const ev = (f, a) => p.evaluate(f, a);
    const shot = async (n, ms = 0) => { if (ms) await wait(ms); await p.screenshot({ path: `${OUT}/${W}_${n}.png` }); };
    const start = async () => {
      await ev(() => { window.__onErr = e => { (window.__errs = window.__errs || []).push(String(e && e.stack || e).slice(0, 300)); }; SETTINGS.dlgAuto = true; STATE.dev.auto = false; newRun(); STATE.mode = 'play'; hideUI(); G.sel = null; });
      for (let i = 0; i < 60; i++) { await wait(80); const m = await ev(() => { if (STATE.mode === 'talk') dlgTap(); else if (STATE.mode === 'select' && G.sel && G.sel.kind === 'start') pickCard(0); return STATE.mode; }); if (m === 'play' && i > 3 && await ev(() => G.p.weapons.length > 0)) break; }
    };
    const click = k => ev(k => { const e = document.querySelector(`.dev button[data-k="${k}"]`); if (!e) return false; e.click(); return true; }, k);
    const wclick = k => ev(k => { const e = document.querySelector(`.devwin button[data-k="${k}"]`); if (!e) return false; e.click(); return true; }, k);
    const clearSel = () => ev(() => { if (STATE.mode === 'select') { hideUI(); G.sel = null; STATE.mode = 'play'; } G.pendingLv = 0; });
    await p.goto(`http://127.0.0.1:${PORT}/`); await wait(500);
    await ev(() => { localStorage.clear(); saveCache = null; });
    await start();
    ok(await ev(() => STATE.dev.fps === false), 'FPS 기본 꺼짐');
    await ev(() => document.getElementById('devbtn').click()); await wait(150);
    const secs = await ev(() => document.querySelectorAll('.dev .sec').length + ':' + document.querySelectorAll('.dev .sec>b').length);
    ok(secs === '4:0', '묶음 4개·제목 없음 ' + secs);
    ok(await ev(() => [...document.querySelectorAll('.dev button')].every(e => e.getBoundingClientRect().height <= 32)), '버튼 축소');
    const inView = () => ev(() => { const r = document.querySelector('.dev').getBoundingClientRect(); return r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1; });
    ok(await inView(), '패널 화면 안 (기본 위치)'); await shot('panel_left');
    const keys = await ev(() => [...document.querySelectorAll('.dev button')].map(e => e.dataset.k).join(','));
    ok(!/altar|fz|sp16|gate|demon/.test(keys), '삭제 버튼 잔존 ' + keys);
    // 버튼을 오른쪽 아래로 옮긴 뒤 패널이 따라오는지
    await ev(() => { const b = document.getElementById('devbtn'); b.style.left = (innerWidth - 70) + 'px'; b.style.top = (innerHeight - 120) + 'px'; b.style.bottom = 'auto'; DEV.place(); });
    ok(await inView(), '패널 화면 안 (오른쪽 아래)');
    ok(await ev(() => { const a = document.getElementById('devbtn').getBoundingClientRect(), r = document.querySelector('.dev').getBoundingClientRect(); return r.right <= a.left + 1 || r.bottom <= a.top + 1; }), '패널이 버튼과 겹치지 않음');
    await shot('panel_right');
    // 진행
    await click('sp8'); ok(await ev(() => STATE.dev.speed === 8), '8배'); await click('sp1');
    await click('m_semi'); ok(await ev(() => STATE.dev.auto && STATE.dev.semi), '반자동'); await click('m_off');
    // 성장
    await click('god'); ok(await ev(() => STATE.dev.god), '무적');
    const lv0 = await ev(() => G.p.level); await click('lv10'); ok(await ev(l => G.p.level === l + 10 && STATE.mode === 'play', lv0), '레벨 +10 자동');
    await click('lv1'); await wait(300); ok(await ev(() => STATE.mode === 'select' || G.pendingLv > 0), '레벨 +1 카드'); await clearSel();
    // 무기 고르기
    await click('wpick'); await wait(100); ok(await ev(() => STATE.mode === 'devwin' && !!document.querySelector('.devwin')), '무기 창 열림');
    await shot('win_nojob');
    const wid = await ev(() => WEAPON_ORDER.find(id => !G.p.weapons.some(w => w.id === id)));
    await wclick('w_' + wid); await wclick('lv_5'); await shot('win_detail');
    const br0 = await ev(id => BRANCHES[id] ? BRANCHES[id][1].k : null, wid); if (br0) await wclick('br_' + br0);
    await wclick('apply'); await wait(100);
    ok(await ev(([id, br]) => { const w = G.p.weapons.find(x => x.id === id); return w && w.lvl === 5 && (!br || w.br === br) && (!AWAKEN[id] || !!w.aw) && STATE.mode === 'play'; }, [wid, br0]), '무기 지정 Lv5·발현·각성');
    // 연성 완료 (인물 없음 → 인물 선택 → 짝 무기)
    await click('wpick'); await wait(100);
    await wclick('job_mage'); await wait(100); ok(await ev(() => G.p.job === 'mage' && !!baseW()), '창에서 인물 선택');
    await wclick('fu_' + wid); await wait(100);
    ok(await ev(id => { const w = G.p.weapons.find(x => x.id === id); return w && !!w.fu && baseW().lvl >= AW43; }, wid), '연성 완료');
    await clearSel();
    for (let i = 0; i < 30; i++) { await wait(60); if (await ev(() => !(G.h47 && G.h47.cine))) break; }
    // 구간 이동: 인물 각성 직전
    await ev(() => { document.getElementById('devbtn').click(); document.getElementById('devbtn').click(); });
    await click('j_awk'); for (let i = 0; i < 40; i++) { await wait(100); if (await ev(() => STATE.mode === 'select')) break; } ok(await ev(() => STATE.mode === 'select' && G.sel && G.sel.kind === 'job2' && G.p.level >= 26), '인물 각성 직전 ' + await ev(() => STATE.mode + ':' + (G.sel && G.sel.kind) + ':' + G.p.level));
    await shot('job2'); await clearSel();
    // 보스전: 이그나
    await click('boss'); ok(await ev(() => document.querySelectorAll('.dev button[data-k^="b_"]').length === 5), '보스 5종');
    await click('b_igna');
    for (let i = 0; i < 60; i++) { await wait(100); const r = await ev(() => { if (STATE.mode !== 'play') { if (STATE.mode === 'talk') dlgTap(); else if (STATE.mode === 'select') { hideUI(); G.sel = null; STATE.mode = 'play'; G.pendingLv = 0; G.pendingBr = []; } } return G.gkMob && !G.gkMob.dead ? G.gkMob.gk : null; }); if (r) break; }
    ok(await ev(() => G.gkMob && G.gkMob.gk === 'igna' && G.p.level >= 53), '이그나전 ' + await ev(() => (G.gkMob && G.gkMob.gk) + ':' + G.p.level + ':' + G.ph.id));
    ok(await ev(() => !!G.p.job && !!G.p.job2), '보스전 레벨 맞춤 2차 전직 자동');
    await shot('gate');
    // 새 판 두 번 누르기
    await ev(() => { if (!DEV.el) document.getElementById('devbtn').click(); });
    const r0 = await ev(() => G.time); await click('restart'); ok(await ev(t => G.time >= t, r0), '새 판 1회는 대기');
    ok(await ev(() => document.querySelector('.dev button[data-k="restart"]').textContent === '확인'), '새 판 확인 문구');
    await click('restart'); await wait(200); ok(await ev(() => G.time < 2), '새 판 2회 실행');
    // 새 판: 인물 선택 직전
    for (let i = 0; i < 40; i++) { await wait(80); const m = await ev(() => { if (STATE.mode === 'talk') dlgTap(); else if (STATE.mode === 'select' && G.sel && G.sel.kind === 'start') pickCard(0); return STATE.mode; }); if (m === 'play' && i > 3 && await ev(() => G.p.weapons.length > 0)) break; }
    await ev(() => { if (!DEV.el) document.getElementById('devbtn').click(); });
    await click('j_pick'); await wait(100); ok(await ev(() => !!G.altar && G.p.level >= 19), '인물 선택 직전 제단');
    await click('fit'); ok(await ev(() => STATE.dev.fit === false), '레벨 맞춤 끔');
    await click('b_demon').catch(() => {}); await click('boss'); await click('b_demon'); await wait(100);
    ok(await ev(() => G.ph.order[G.ph.order.length - 1] === 'demon' && G.runType === 'retry'), '마왕전 예약');
    ok(await ev(() => !G.p.job2), '레벨 맞춤 끔: 전직 자동 없음');
    // 0.57a: 전직 전 새 판에서 보스전 + 레벨 맞춤 → 전직·2차 전직 자동
    await click('fit'); await click('restart'); await click('restart'); await wait(200);
    for (let i = 0; i < 40; i++) { await wait(80); const m = await ev(() => { if (STATE.mode === 'talk') dlgTap(); else if (STATE.mode === 'select' && G.sel && G.sel.kind === 'start') pickCard(0); return STATE.mode; }); if (m === 'play' && i > 3 && await ev(() => G.p.weapons.length > 0)) break; }
    await ev(() => { if (!DEV.el) document.getElementById('devbtn').click(); });
    await click('boss'); await click('b_' + await ev(() => GK_ORDER[0])); await wait(100);
    ok(await ev(() => !!G.p.job && !!G.p.job2 && G.p.level >= 53 && G.p.ult >= JOB_CFG.ultNeed), '전직 전 보스전 자동 전직 ' + await ev(() => G.p.job + ':' + G.p.job2 + ':' + G.p.level));
    await click('boss'); await click('b_demon'); await wait(100);
    ok(await ev(() => !!G.p.job2), '마왕전 자동 전직 유지');
    const e2 = await ev(() => window.__errs || []);
    console.log(W + 'x' + H, 'errs', errs.length, errs.slice(0, 3), e2.slice(0, 3)); allErr.push(...errs, ...e2);
    await ctx.close();
  }
  console.log('fails', fails.length, fails);
  await b.close(); SERVER.close(); process.exit(allErr.length || fails.length ? 1 : 0);
})();
