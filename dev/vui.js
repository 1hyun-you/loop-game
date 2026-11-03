// 메뉴·설정·도감·도전 준비·대사창·두 번 눌러 확정·고정형 조이스틱 화면 점검 (0.13~0.15)
// 사용: node dev/vui.js  (오류·누락 단계 출력)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), PORT = 48290;
const SERVER = http.createServer((q, s) => { s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(fs.readFileSync(path.join(ROOT, 'index.html'))); });
(async () => {
  await new Promise(r => SERVER.listen(PORT, '127.0.0.1', r));
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const out = [], chk = (k, v) => out.push((v ? 'ok  ' : 'FAIL') + ' ' + k);
  await p.goto(`http://127.0.0.1:${PORT}/`);
  const ev = (f, a) => p.evaluate(f, a), click = id => ev(i => { const e = document.getElementById(i) || document.querySelector(i); if (e) e.click(); return !!e; }, id);
  const wait = ms => p.waitForTimeout(ms);
  // 진행 전: 도전 준비 버튼 없음, 도감·설정 있음
  chk('title no prep before end', !(await ev(() => !!document.getElementById('prep'))));
  chk('codex open', await click('codex')); chk('codex frag tab 10', await ev(() => document.querySelectorAll('.cx').length === 10));
  for (const t of ['w', 'e', 'u']) { await click(`[data-tab="${t}"]`); chk('codex tab ' + t, await ev(() => document.querySelectorAll('.cx, .stats').length > 0)); }
  await click('cx_back'); chk('back to title', await ev(() => STATE.mode === 'title'));
  // 설정 8종
  await click('settings'); chk('settings rows 9', await ev(() => document.querySelectorAll('.row').length === 9));
  for (const k of ['confirm2', 'dlgAuto', 'vibe', 'shake']) { const a = await ev(k => SETTINGS[k], k); await click(`[data-k="${k}"]`); chk('toggle ' + k, (await ev(k => SETTINGS[k], k)) === !a); }
  await click('s_joy'); chk('joy fixed', await ev(() => SETTINGS.joy === 'fixed'));
  await ev(() => { const i = document.querySelector('input[data-v="sfx"]'); i.value = 30; i.dispatchEvent(new Event('input')); }); chk('sfx 30', await ev(() => SETTINGS.sfx === 30));
  await click('s_back');
  // 시작 → 첫 대사(도입) 수동 넘김 (dlgAuto 켜짐 상태 → 끄고 확인)
  await ev(() => { SETTINGS.dlgAuto = false; });
  await click('start'); for (let i = 0; i < 3; i++) await wait(50);
  await wait(300); chk('intro dialog', await ev(() => STATE.mode === 'talk' && !!document.getElementById('dlg')));
  chk('portrait img', await ev(() => /url\(/.test(document.getElementById('dpt').style.background)));
  for (let i = 0; i < 12 && await ev(() => STATE.mode === 'talk'); i++) { await click('dlg'); await wait(120); await click('dlg'); await wait(120); }
  chk('play after dialog', await ev(() => STATE.mode === 'play'));
  // 고정형 조이스틱: 화면 아무 곳 터치 → 기준점은 고정 위치
  await p.mouse.move(100, 300); await p.mouse.down(); await wait(100);
  chk('fixed joy origin', await ev(() => { const f = joyFixed(); return INPUT.active && INPUT.ox === f.x && INPUT.oy === f.y; }));
  await p.mouse.up();
  // 두 번 눌러 확정: 레벨업 강제
  await ev(() => { G.pendingLv = 1; }); await wait(300);
  chk('select open', await ev(() => STATE.mode === 'select'));
  await click('.card[data-i="0"]'); chk('first tap arms', await ev(() => STATE.mode === 'select' && !!document.querySelector('.card.armed')));
  await click('.card[data-i="0"]'); chk('second tap picks', await ev(() => STATE.mode === 'play'));
  // 진엔딩 후 상태 주입 → 도전 준비
  await ev(() => { localStorage.setItem(CFG.SAVE_KEY, JSON.stringify({ runs: 5, trueEnd: 1, tierMax: 2, titles: ['end', 't1'], frags: FRAGS.map(f => f.id), gates: GK_ORDER })); showTitle(); });
  chk('prep button', await click('prep'));
  chk('tier3 locked', await ev(() => document.querySelector('[data-tier="3"]').disabled));
  await click('[data-tier="2"]'); await click('[data-cond="melee"]'); await click('[data-cond="ranged"]');
  chk('melee/ranged exclusive', await ev(() => META.conds.join() === 'ranged' && META.tier === 2));
  await click('pr_go'); await wait(200);
  chk('run opt applied', await ev(() => G.opt.tier === 2 && G.opt.conds[0] === 'ranged' && G.p.weapons[0].id === 'arrow'));
  await ev(() => showCodex('u', showTitle)); await click('[data-c="teal"]');
  chk('color teal', await ev(() => loadSave().color === 'teal' && playerColor() === '#5fd0c0'));
  await click('[data-t="end"]'); chk('title equip', await ev(() => loadSave().title === 'end'));
  chk('page errors 0', errs.length === 0); if (errs.length) console.log(errs);
  console.log(out.join('\n')); await b.close(); SERVER.close();
})();
