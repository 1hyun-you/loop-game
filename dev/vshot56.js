// 0.56 화면 점검: 무기 이름표·무기 칸 강조, 사망 클로즈업, 마왕 처치 클로즈업, 결과 화면, 첫 선택 도움말 캡처
// 사용: NODE_PATH=$(npm root -g) node dev/vshot56.js [저장 폴더] [접두어]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), PORT = 48298, OUT = process.argv[2] || '/tmp/shot56', PRE = process.argv[3] || '';
fs.mkdirSync(OUT, { recursive: true });
const SERVER = http.createServer((q, s) => { const u = decodeURIComponent((q.url || '/').split('?')[0]), f = path.join(ROOT, u); if (/\.(png|woff2)$/.test(u) && fs.existsSync(f)) return s.end(fs.readFileSync(f)); s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(fs.readFileSync(path.join(ROOT, 'index.html'))); });
const wait = ms => new Promise(r => setTimeout(r, ms));
const VIEWS = (process.env.VIEWS || '360x780,412x915').split(',').map(v => v.split('x').map(Number));
(async () => {
  await new Promise(r => SERVER.listen(PORT, '127.0.0.1', r));
  const b = await chromium.launch({ args: ['--disable-gpu'] }); const allErr = [];
  for (const [W, H] of VIEWS) {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true }), p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    const ev = (f, a) => p.evaluate(f, a);
    const shot = async (n, ms = 0) => { if (ms) await wait(ms); await p.screenshot({ path: `${OUT}/${PRE}${W}_${n}.png` }); };
    const start = async () => {
      await ev(() => { window.__onErr = e => { (window.__errs = window.__errs || []).push(String(e && e.stack || e).slice(0, 300)); }; SETTINGS.dlgAuto = true; newRun(); STATE.mode = 'play'; hideUI(); G.sel = null; });
      for (let i = 0; i < 60; i++) { await wait(80); const m = await ev(() => { if (STATE.mode === 'talk') dlgTap(); else if (STATE.mode === 'select' && G.sel && G.sel.kind === 'start') pickCard(0); return STATE.mode; }); if (m === 'play' && i > 3) break; }
    };
    await p.goto(`http://127.0.0.1:${PORT}/`); await wait(500);
    await ev(() => { localStorage.clear(); saveCache = null; });
    await start();
    await ev(() => { G.p.hp = G.p.maxHp = 9999; });
    for (let i = 0; i < 30; i++) { await wait(60); if (await ev(() => G.t56 && G.t56.length > 0 && G.t56[0].t > 0.15)) break; }
    await shot('tag');
    await ev(() => { G.pendingLv = 1; }); await wait(500); await shot('sel_first');
    await ev(() => { if (STATE.mode === 'select') pickCard(0); }); await wait(200);
    // 사망 클로즈업 → 결과
    await ev(() => { applyJob('warrior'); const pl = G.p; for (const id of WEAPON_ORDER) { if (pl.weapons.length >= slotW()) break; if (!hasW(id)) addWeapon(id); } pl.weapons.forEach((w, i) => { w.lvl = Math.min(CFG.weaponMax, 2 + i); }); pl.level = 19; G.kills = 1234; });
    for (let i = 0; i < 40; i++) { await wait(80); const m = await ev(() => { if (STATE.mode === 'select') { hideUI(); G.sel = null; STATE.mode = 'play'; G.pendingLv = 0; G.pendingBr = []; } const C = G.h47 && G.h47.cine; return !C; }); if (m && i > 4) break; }
    await wait(900); await shot('tags_multi');
    await ev(() => { if (!window.__s0) { window.__s0 = step; step = dt => { if (!window.__frz) window.__s0(dt); }; } window.__adv = sec => { for (let t = 0; t < sec; t += 1 / 60) window.__s0(1 / 60); }; });
    await ev(() => { window.__frz = 1; G.p.hp = 1; G.p.maxHp = 100; G.p.invT = 0; STATE.dev.god = false; hurtPlayer(50, '고블린 궁수'); __adv(0.12); });
    await shot('dead_a', 200); await ev(() => __adv(0.7)); await shot('dead_b', 200); console.log(W, 'dead view', await ev(() => JSON.stringify([G.cu56.t, G.cu56.v && G.cu56.v.z, G.endT])));
    await ev(() => { __adv(1.3); }); await shot('dead_c', 200); await ev(() => { window.__frz = 0; });
    for (let i = 0; i < 80; i++) { await wait(100); const m = await ev(() => { if (STATE.mode === 'talk') dlgTap(); return STATE.mode; }); if (m === 'result') break; }
    await shot('result_dead', 400);
    console.log(W, 'result ids', await ev(() => ['again', 'home', 'rabil', 'rbuild'].map(i => !!document.getElementById(i)).join(',')), 'cu', await ev(() => JSON.stringify(G.stats.v56)));
    await ev(() => document.getElementById('rabil').click()); await shot('result_abil', 400);
    await ev(() => document.getElementById('ab_back').click()); await wait(200);
    console.log(W, 'back to result', await ev(() => STATE.mode === 'result' && !!document.getElementById('again')));
    // 마왕 처치 클로즈업 → 결과
    await start();
    await ev(() => { applyJob('priest'); const pl = G.p; pl.hp = pl.maxHp = 9999; G.enemies.length = 0; G.stats.demon = { t0: 0, st: [0, 0], type: 'final', n: 1 }; });
    for (let i = 0; i < 30; i++) { await wait(80); const m = await ev(() => { if (STATE.mode === 'select') { hideUI(); G.sel = null; STATE.mode = 'play'; } return !(G.h47 && G.h47.cine); }); if (m && i > 4) break; }
    await ev(() => { window.__frz = 1; const pl = G.p; G.enemies.length = 0; dmKilled({ x: pl.x + 95, y: pl.y - 150, r: 34 }); G.result = 'clear'; G.endT = 2.2; __adv(0.7); });
    await shot('demon_a', 200); await ev(() => __adv(0.7)); await shot('demon_b', 200); await ev(() => __adv(0.3)); await shot('demon_c', 200); await ev(() => __adv(1.0)); await shot('demon_d', 200);
    console.log(W, 'demon', await ev(() => JSON.stringify([G.cu56.t, G.endT]))); await ev(() => { window.__frz = 0; });
    for (let i = 0; i < 80; i++) { await wait(100); const m = await ev(() => { if (STATE.mode === 'talk') dlgTap(); return STATE.mode; }); if (m === 'result') break; }
    await shot('result_win', 400);
    const g = await ev(() => GUIDE.map(x => x.id).join(','));
    const e2 = await ev(() => window.__errs || []);
    console.log(W + 'x' + H, 'guide', g, 'errs', errs.length, errs.slice(0, 3), e2.slice(0, 3)); allErr.push(...errs, ...e2);
    await ctx.close();
  }
  await b.close(); SERVER.close(); process.exit(allErr.length ? 1 : 0);
})();
