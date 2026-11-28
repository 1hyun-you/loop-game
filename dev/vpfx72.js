// 0.72 pixelfx 광전사 이펙트 화면 점검: 굽기 완료·장면 캡처·그리기 시간
// 사용: NODE_PATH=$(npm root -g) node dev/vpfx72.js [출력 폴더]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), PORT = +(process.env.PORT || 48372), OUT = process.argv[2] || '/tmp/vpfx72';
fs.mkdirSync(OUT, { recursive: true });
const SERVER = http.createServer((q, s) => { const u = decodeURIComponent((q.url || '/').split('?')[0]), f = path.join(ROOT, u); if (/\.(png|woff2|webmanifest)$/.test(u) && fs.existsSync(f)) return s.end(fs.readFileSync(f)); s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(fs.readFileSync(path.join(ROOT, 'index.html'))); });
(async () => {
  await new Promise(r => SERVER.listen(PORT, '127.0.0.1', r));
  const b = await chromium.launch({ args: ['--disable-gpu'] }), p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://127.0.0.1:${PORT}/`); await p.waitForTimeout(1500);
  await p.evaluate(() => {
    window.T72 = {};
    const settle = () => { let g = 0; while (STATE.mode !== 'play' && g++ < 20) { if (STATE.mode === 'talk') { if (typeof dlgTap === 'function') dlgTap(); else STATE.mode = 'play'; } else if (STATE.mode === 'select' && G.sel) pickCard(0); else { hideUI(); G.sel = null; STATE.mode = 'play'; } } };
    const T = Object.keys(TOUGH60).filter(k => ENEMIES[k]).slice(0, 3);
    T72.crowd = (n = 12, R = 60) => { for (let i = 0; i < n; i++) { const a = i / n * 6.283, r = R + (i % 3) * 40; makeEnemy(T[i % T.length], G.p.x + Math.cos(a) * r, G.p.y + Math.sin(a) * r); } };
    T72.run = sec => { for (let i = 0; i < Math.round(sec * 60); i++) { settle(); step(1 / 60); if (G.result) { G.result = null; G.endT = 0; } } render(); };
    T72.fresh = () => { SETTINGS.dlgAuto = true; STATE.dev.auto = false; STATE.dev.god = true; newRun(); STATE.mode = 'play'; hideUI(); G.sel = null; G.storyOn = true; T72.run(1); applyHero60('berserker'); settle(); };
    T72.settle = settle;
  });
  // 1. 굽기: 4ms씩 나눠 구워 전부 끝나는지, 걸린 프레임 수
  const bake = await p.evaluate(() => { T72.fresh(); let f = 0; const t0 = performance.now(); while (f < 3000 && Object.values(PFX72.state).some(s => s.st === 'q' || s.st === 'b')) { PFX72.bake(4); f++; } return { frames: f, ms: Math.round(performance.now() - t0), st: Object.fromEntries(Object.entries(PFX72.state).map(([k, s]) => [k, s.st + (s.cv ? ' ' + s.cv.width + 'x' + s.cv.height : '')])) }; });
  console.log('굽기', JSON.stringify(bake));
  const shot = async (nm) => { await p.evaluate(() => render()); await p.screenshot({ path: path.join(OUT, nm + '.png') }); };
  const scene = async (nm, setup, times) => { await p.evaluate(setup); for (const [i, t] of times.entries()) { await p.evaluate(t => T72.run(t), t); await shot(nm + '_' + i); } };
  const F = ids => `T72.fresh(); for (const id of ${JSON.stringify(ids)}) { G.p.weapons.push({ id, lvl: 5, t: 0.2 }); applyFuse60(id); T72.settle(); }`;
  await scene('a_slash', () => { T72.fresh(); T72.crowd(8, 70); }, [1.1, 0.08, 0.08]);
  await scene('b_heavy', () => { T72.fresh(); const w = baseW(); w.lvl = 3; checkBranch('w', w.id); G.pendingBr = []; applyBranch({ t: 'branch', id: 'cleave', k: 'B', kind: 'w' }); T72.crowd(8, 70); }, [1.2, 0.15, 0.15]);
  await scene('c_rage', () => { T72.fresh(); G.b60.fury = 99; furyGain60(5); }, [0.05, 0.3, 0.4]);
  await scene('d_slam', () => { T72.fresh(); T72.crowd(12, 90); G.p.ult = JOB_CFG.ultNeed; useUlt(); }, [0.4, 0.12, 0.3]);
  await scene('e_roar', () => { T72.fresh(); applyAw60('A'); T72.crowd(12, 90); G.p.ult = JOB_CFG.ultNeed; useUlt(); }, [0.05, 0.15, 0.25]);
  await scene('f_fuse1', new Function(F(['dagger', 'arrow', 'turret', 'fireball']) + '; T72.crowd(14, 80);'), [1.0, 0.15, 0.15, 0.6]);
  await scene('g_fuse2', new Function(F(['lamp', 'bell', 'thorn']) + '; T72.crowd(14, 80);'), [1.0, 0.15, 0.15, 0.6]);
  await scene('h_burst', () => { T72.fresh(); applyAw60('B'); T72.crowd(16, 90); G.p.ult = JOB_CFG.ultNeed; useUlt(); }, [0.45, 0.3, 0.35]);
  // 2. 그리기 시간: 연성 7종 + 격노 + 적 40마리, render 100회 평균 (이펙트 있음 / 없음)
  const perf = await p.evaluate(() => {
    T72.fresh(); for (const id of ['dagger', 'arrow', 'turret', 'fireball']) { G.p.weapons.push({ id, lvl: 5, t: 0.2 }); applyFuse60(id); T72.settle(); }
    T72.crowd(40, 60); G.b60.fury = 99; furyGain60(5); T72.run(2);
    const m = () => { const t0 = performance.now(); for (let i = 0; i < 100; i++) { step(1 / 60); render(); } return (performance.now() - t0) / 100; };
    const a = m(), n = PFX72.count(); const keep = PFX72.state.slash.st; for (const s of Object.values(PFX72.state)) s.st0 = s.st, s.st = 'off'; const b = m(); for (const s of Object.values(PFX72.state)) s.st = s.st0;
    return { withFx: a.toFixed(2), withoutFx: b.toFixed(2), live: n };
  });
  console.log('프레임당 (step+render, ms)', JSON.stringify(perf));
  console.log('페이지 오류', errs.length, errs.slice(0, 3));
  await b.close(); SERVER.close();
})();
