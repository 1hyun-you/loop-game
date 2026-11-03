// 0.26a 화면 고정·적 탄환 외형 점검: 창 높이 순간 축소 시 캔버스 유지, 확대 즉시 반영, 적 탄환·예고 구역 화면 캡처
// 사용: node dev/vshot.js [저장 폴더]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), PORT = 48295, OUT = process.argv[2] || path.join(ROOT, 'dev');
const SERVER = http.createServer((q, s) => { s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(fs.readFileSync(path.join(ROOT, 'index.html'))); });
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  await new Promise(r => SERVER.listen(PORT, '127.0.0.1', r));
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }), p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => p.evaluate(f, a), click = id => ev(i => { const e = document.getElementById(i) || document.querySelector(i); if (e) e.click(); return !!e; }, id);
  const out = [], chk = (k, v) => out.push((v ? 'ok  ' : 'FAIL') + ' ' + k);
  await p.goto(`http://127.0.0.1:${PORT}/`); await wait(400);
  await ev(() => { SETTINGS.dlgAuto = false; });
  await click('start'); await wait(400);
  for (let i = 0; i < 12 && await ev(() => STATE.mode === 'talk'); i++) { await click('dlg'); await wait(120); await click('dlg'); await wait(120); }
  await click('.card[data-i="0"]'); await click('.card[data-i="0"]'); await wait(300);
  chk('play', await ev(() => STATE.mode === 'play'));
  const size = () => ev(() => ({ w: cv.style.width, h: cv.style.height, bw: cv.width, bh: cv.height, ui: document.getElementById('ui').style.height }));
  const s0 = await size();
  await p.setViewportSize({ width: 390, height: 800 }); await wait(300);
  const s1 = await size(); chk('shrink ignored (transient) ' + s1.h, s1.h === s0.h && s1.bh === s0.bh && s1.ui === s0.ui);
  await p.setViewportSize({ width: 390, height: 844 }); await wait(300);
  const s2 = await size(); chk('restore no realloc', s2.bh === s0.bh);
  await p.setViewportSize({ width: 390, height: 780 }); await wait(1500);
  const s3 = await size(); chk('sustained shrink applied ' + s3.h, s3.h === '780px');
  await p.setViewportSize({ width: 390, height: 844 }); await wait(100);
  const s4 = await size(); chk('grow immediate ' + s4.h, s4.h === '844px');
  // 적 탄환·예고 구역 배치 후 캡처
  await ev(() => {
    STATE.mode = 'pause'; const P = G.p; G.eb = G.eb || []; G.hz = G.hz || [];
    const cols = ['#ffb050', '#c8ff7a', '#c9a8ff'];
    for (let i = 0; i < 10; i++) { const a = i * 0.63; G.eb.push({ x: P.x + Math.cos(a) * 110, y: P.y + Math.sin(a) * 110, vx: Math.cos(a) * (i % 3 === 0 ? 320 : 150), vy: Math.sin(a) * (i % 3 === 0 ? 320 : 150), r: i === 4 ? 9 : 6, dmg: 1, src: 't', life: 9, col: cols[i % 3] }); }
    G.hz.push({ k: 'circ', x: P.x - 80, y: P.y + 170, r: 60, warn: 1, t: 0.55, dmg: 1, src: 't' });
    G.hz.push({ k: 'circ', x: P.x + 90, y: P.y + 170, r: 55, warn: 0.2, t: 0.6, fired: true, pool: 3, dmg: 1, src: 't' });
    G.hz.push({ k: 'line', x: P.x - 150, y: P.y - 190, dx: 1, dy: 0, len: 300, w: 40, warn: 1, t: 0.5, dmg: 1, src: 't' });
    hideUI && hideUI();
  });
  await wait(200);
  await p.screenshot({ path: path.join(OUT, 'shot_0.26a_eshots.png') });
  chk('page errors 0', !errs.length); if (errs.length) console.log(errs.slice(0, 3).join('\n'));
  console.log(out.join('\n')); await b.close(); SERVER.close();
})();
