// 0.37 화면 캡처: 첫 화면·도감·설정·도전 준비·선택 화면
// 사용: node dev/vshot37.js <저장 폴더>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), PORT = 48297, OUT = process.argv[2] || path.join(ROOT, 'dev');
const SERVER = http.createServer((q, s) => { s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(fs.readFileSync(path.join(ROOT, 'index.html'))); });
(async () => {
  await new Promise(r => SERVER.listen(PORT, '127.0.0.1', r));
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 2, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => p.evaluate(f, a), wait = ms => p.waitForTimeout(ms), click = s => ev(x => { const e = document.getElementById(x) || document.querySelector(x); if (e) e.click(); return !!e; }, s);
  const shot = n => p.screenshot({ path: path.join(OUT, n + '.png') });
  await p.goto(`http://127.0.0.1:${PORT}/`); await wait(700); await shot('1_title');
  await click('codex'); await wait(400); await shot('2_codex_w');
  await ev(() => document.querySelector('.acc summary').click()); await wait(300); await shot('3_codex_acc');
  await click('[data-tab="j"]'); await wait(400); await shot('4_codex_j');
  await click('cx_back'); await wait(300); await click('settings'); await wait(400); await shot('5_settings');
  await click('s_back');
  await ev(() => { localStorage.setItem(CFG.SAVE_KEY, JSON.stringify({ runs: 5, trueEnd: 1, tierMax: 3, titles: ['end'], gates: GK_ORDER })); saveCache = null; showTitle(); }); await wait(500); await shot('6_title_end');
  await click('prep'); await wait(400); await shot('7_prep_t'); await click('[data-ptab="c"]'); await wait(400); await shot('8_prep_c');
  await ev(() => { SETTINGS.dlgAuto = true; localStorage.removeItem(CFG.SAVE_KEY); saveCache = null; showTitle(); }); await wait(200);
  await click('start'); await wait(300);
  for (let i = 0; i < 40; i++) { await wait(80); const m = await ev(() => { if (STATE.mode === 'talk') dlgTap(); return STATE.mode + (G.sel ? G.sel.kind : ''); }); if (m === 'selectstart') break; }
  await wait(120); await shot('9_select_start');
  console.log(errs.length ? 'ERR ' + errs.join(' | ') : 'no errors');
  await b.close(); SERVER.close();
})();
