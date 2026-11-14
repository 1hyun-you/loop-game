// 0.52 화면 점검: 대검 휘두름 단계별 진행(이동 중 추종)·방패 충격 단계·얼음 냉기 물결·서리 자국
// 사용: node dev/vshot52.js [저장 폴더]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), PORT = 48295, OUT = process.argv[2] || '/tmp/shot52';
fs.mkdirSync(OUT, { recursive: true });
const SERVER = http.createServer((q, s) => { const u = decodeURIComponent((q.url || '/').split('?')[0]), f = path.join(ROOT, u); if (/\.(png|woff2)$/.test(u) && fs.existsSync(f)) return s.end(fs.readFileSync(f)); s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(fs.readFileSync(path.join(ROOT, 'index.html'))); });
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  await new Promise(r => SERVER.listen(PORT, '127.0.0.1', r));
  const b = await chromium.launch({ args: ['--disable-gpu'] }), ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }), p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => p.evaluate(f, a), click = id => ev(i => { const e = document.getElementById(i) || document.querySelector(i); if (e) e.click(); return !!e; }, id);
  await p.goto(`http://127.0.0.1:${PORT}/`); await wait(500);
  await click('start'); await wait(400);
  for (let i = 0; i < 12 && await ev(() => STATE.mode === 'talk'); i++) { await click('dlg'); await wait(120); await click('dlg'); await wait(120); }
  await click('.card[data-i="0"]'); await click('.card[data-i="0"]'); await wait(300);
  await ev(() => { addXp = () => {}; G.pendingLv = 0; if (STATE.mode === 'select') { hideUI(); G.sel = null; } STATE.mode = 'pause'; G.p.weapons = []; G.enemies.length = 0; G.fx.length = 0; G.p.hp = G.p.maxHp = 9999; });
  const clip = { x: 45, y: 272, width: 300, height: 300 };
  // 단계별 그리기: 효과 1개 생성 후 t를 고정해 그림, 플레이어는 단계마다 오른쪽으로 이동(추종 확인)
  const phases = async (nm, make, n, move) => {
    await ev(make);
    const dur = await ev(() => G.fx[G.fx.length - 1].dur), p0 = await ev(() => G.p.x);
    for (let i = 0; i < n; i++) {
      await ev(([k, dx]) => { const f = G.fx[G.fx.length - 1]; for (const g of G.fx) g.t = Math.min(g.dur * 0.999, k * g.dur); f.t = Math.min(f.dur * 0.999, k * f.dur); G.p.x += dx; render(); }, [i / n, move]);
      await p.screenshot({ path: `${OUT}/${nm}_${String(i).padStart(2, '0')}.png`, clip });
    }
    await ev(x => { G.fx.length = 0; G.p.x = x; }, p0);
    return dur;
  };
  const d1 = await phases('cleave', () => { CUR48 = { id: 'cleave', k: 'heavy', branchArt: 'cleave' }; slash(-0.6, WEAPONS.cleave.base.arc, WEAPONS.cleave.base.range, 1, 0, true); CUR48 = null; }, 12, 3);
  const d2 = await phases('shield', () => { CUR48 = { id: 'shield', k: 'heavy', branchArt: 'shield' }; shieldBash(G.p.x, G.p.y, WEAPONS.shield.base.R, 1, 0, false); CUR48 = null; }, 10, 0);
  const d3 = await phases('ice', () => { CUR48 = { id: 'icering', k: 'dot', branchArt: 'icering' }; fx({ kind: 'ring', x: G.p.x, y: G.p.y, r0: 8, r1: 120, dur: 0.5, element: 'ice', color: '#bfe8ff', follow: true, trk48: true }); CUR48 = null; }, 10, 2);
  // 서리 자국 잔류 확인: 시간 경과 후 그림
  await ev(() => { CUR48 = { id: 'icering', k: 'dot', branchArt: 'icering' }; fx({ kind: 'ring', x: G.p.x, y: G.p.y, r0: 8, r1: 120, dur: 0.5, element: 'ice', color: '#bfe8ff', follow: true, trk48: true }); CUR48 = null; });
  for (let i = 0; i < 8; i++) { await ev(() => { G.time += 0.09; for (const f of G.fx) f.t += 0.09; G.p.x += 6; render(); }); await p.screenshot({ path: `${OUT}/frost_${i}.png`, clip }); }
  const st = await ev(() => ({ v: CFG.VERSION, v52: G.stats.v52, slow: (() => { RC().slow = 0; rcSlow(0.25, 1); return rcScale(0.016); })(), bot: BOT49 }));
  console.log(JSON.stringify({ d1, d2, d3, ...st }), 'errs', errs.length, errs.slice(0, 3));
  await b.close(); SERVER.close();
})();
