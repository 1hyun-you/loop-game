// 0.55 화면 점검: 상단 화면(폭별)·일시정지·내 능력·선택 카드·도감 캡처
// 사용: node dev/vshot55.js [저장 폴더] [접두어]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), PORT = 48297, OUT = process.argv[2] || '/tmp/shot55', PRE = process.argv[3] || '';
fs.mkdirSync(OUT, { recursive: true });
const SERVER = http.createServer((q, s) => { const u = decodeURIComponent((q.url || '/').split('?')[0]), f = path.join(ROOT, u); if (/\.(png|woff2)$/.test(u) && fs.existsSync(f)) return s.end(fs.readFileSync(f)); s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(fs.readFileSync(path.join(ROOT, 'index.html'))); });
const wait = ms => new Promise(r => setTimeout(r, ms));
const VIEWS = (process.env.VIEWS || '360x780,412x915,720x660').split(',').map(v => v.split('x').map(Number));
(async () => {
  await new Promise(r => SERVER.listen(PORT, '127.0.0.1', r));
  const b = await chromium.launch({ args: ['--disable-gpu'] }); const allErr = [];
  for (const [W, H] of VIEWS) {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true }), p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    const ev = (f, a) => p.evaluate(f, a), click = id => ev(i => { const e = document.getElementById(i) || document.querySelector(i); if (e) e.click(); return !!e; }, id);
    const shot = async n => { await wait(350); await p.screenshot({ path: `${OUT}/${PRE}${W}_${n}.png` }); };
    await p.goto(`http://127.0.0.1:${PORT}/`); await wait(500);
    await ev(() => { SETTINGS.dlgAuto = true; localStorage.removeItem(CFG.SAVE_KEY); saveCache = null; newRun(); STATE.mode = 'play'; hideUI(); G.sel = null; });
    for (let i = 0; i < 40; i++) { await wait(80); const m = await ev(() => { if (STATE.mode === 'talk') dlgTap(); else if (STATE.mode === 'select' && G.sel && G.sel.kind === 'start') pickCard(0); return STATE.mode; }); if (m === 'play' && i > 3) break; }
    await ev(() => { G.p.hp = G.p.maxHp = 9999; G.pendingLv = 1; }); await wait(400);
    await shot('sel_level');
    await ev(() => { if (STATE.mode === 'select') pickCard(0); });
    await wait(200);
    // 전직 카드
    await ev(() => { G.sel = { kind: 'job', cards: jobCands(), offer: false }; STATE.mode = 'select'; renderSelect(); }); await shot('sel_job');
    await ev(() => { const c = document.querySelector('.card[data-i="0"]'); c.click(); }); await shot('sel_job_armed');
    await ev(() => { hideUI(); G.sel = null; STATE.mode = 'play'; applyJob(window.__job || 'warrior'); });
    // 무기·보조 효과 채우기
    await ev(() => { const p = G.p; for (const id of WEAPON_ORDER) { if (p.weapons.length >= slotW()) break; if (!hasW(id)) addWeapon(id); } for (const id of PASSIVE_ORDER) { if (p.passives.length >= CFG.slots.passive) break; if (!hasP(id)) applyCard({ t: 'pnew', id }); }
      p.weapons.forEach((w, i) => { w.lvl = Math.min(CFG.weaponMax, 2 + i); }); p.level = 23; });
    await ev(() => { const w = G.p.weapons.find(x => !x.base && !x.br && BRANCHES[x.id]); if (w) { w.lvl = 3; G.sel = { kind: 'branch', q: { kind: 'w', id: w.id }, cards: BRANCHES[w.id].map(o => ({ t: 'branch', kind: 'w', id: w.id, k: o.k })) }; STATE.mode = 'select'; renderSelect(); } }); await shot('sel_branch');
    await ev(() => { hideUI(); G.sel = null; STATE.mode = 'play'; G.sel = { kind: 'level', cards: drawCards(3), banish: false }; STATE.mode = 'select'; renderSelect(); }); await shot('sel_level2');
    await ev(() => { toggleAbil(); }); await shot('sel_abil'); await ev(() => { toggleAbil(); hideUI(); G.sel = null; STATE.mode = 'play'; });
    // 연성 카드
    await ev(() => { try { DEVACT && 0; } catch (e) { } G.p.weapons.forEach(w => { if (w.fu) return; w.lvl = CFG.weaponMax; if (BRANCHES[w.id] && !w.br) { w.br = BRANCHES[w.id][0].k; w.brQ = true; } if (AWAKEN[w.id] && !w.aw) { w.aw = AWAKEN[w.id][0].k; w.awQ = true; } }); });
    await ev(() => { G.sel = { kind: 'level', cards: drawCards(3), banish: false }; STATE.mode = 'select'; renderSelect(); }); await shot('sel_fuse');
    await ev(() => { const i = G.sel.cards.findIndex(c => c.t === 'fuse'); if (i >= 0) pickCard(i); else { hideUI(); G.sel = null; STATE.mode = 'play'; } }); await wait(1500);
    await ev(() => { if (STATE.mode === 'select') { hideUI(); G.sel = null; } STATE.mode = 'play'; G.enemies.length = 0; G.pendingLv = 0; addXp = () => { }; }); await wait(600);
    await shot('hud');
    await ev(() => { STATE.mode = 'play'; hideUI(); pauseGame(); }); await shot('pause');
    await click('pabil'); await shot('pause_abil');
    await ev(() => { const a = document.querySelector('#ui .abil') || document.querySelector('#ui>.layer'); const s = a.closest('.layer') || a; s.scrollTop = 600; (document.querySelector('#ui .pgp.on') || s).scrollTop = 600; }); await shot('pause_abil2');
    await ev(() => { if (document.getElementById('ab_back')) document.getElementById('ab_back').click(); else if (PAUSE_ABIL.on) document.getElementById('pabil').click(); }); await wait(100);
    await click('pcodex'); await shot('codex_w');
    for (const t of ['p', 'j', 'f']) { await click(`[data-tab="${t}"]`); await shot('codex_' + t); }
    await ev(() => { const d = document.querySelector('.pgp.on details.acc summary'); if (d) d.click(); }); await shot('codex_f_open');
    await click('cx_back'); await click('psettings'); await shot('settings');
    await ev(() => { (document.querySelector('#ui .pgp.on') || document.querySelector('#ui>.layer')).scrollTop = 900; }); await shot('settings2');
    console.log(W + 'x' + H, 'errs', errs.length, errs.slice(0, 3)); allErr.push(...errs);
    await ctx.close();
  }
  await b.close(); SERVER.close(); process.exit(allErr.length ? 1 : 0);
})();
