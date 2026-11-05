// 사용성 점검 (0.31): 토글 시 스크롤 유지, 제외한 유물 재등장, 화면별 가로 넘침·버튼 줄바꿈·작은 터치 영역
// 사용: node dev/vux.js
// 0.34 도감 7탭·게임 중 도감 점검 추가
// 0.35 선택 화면 도감 버튼·복귀 점검 추가
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), PORT = 48291;
const SERVER = http.createServer((q, s) => { s.setHeader('content-type', 'text/html; charset=utf-8'); s.end(fs.readFileSync(path.join(ROOT, 'index.html'))); });
const VIEWS = [[360, 560], [390, 844], [412, 915]];
(async () => {
  await new Promise(r => SERVER.listen(PORT, '127.0.0.1', r));
  const b = await chromium.launch(), out = [], chk = (k, v, d) => out.push((v ? 'ok  ' : 'FAIL') + ' ' + k + (d ? ' · ' + d : ''));
  for (const [W, H] of VIEWS) {
    const p = await (await b.newContext({ viewport: { width: W, height: H }, hasTouch: true })).newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(`http://127.0.0.1:${PORT}/`);
    const ev = (f, a) => p.evaluate(f, a), wait = ms => p.waitForTimeout(ms);
    const click = sel => ev(s => { const e = document.getElementById(s) || document.querySelector(s); if (e) e.click(); return !!e; }, sel);
    // 화면 배치 점검: 가로 넘침, 짧은 버튼 줄바꿈, 터치 영역
    const audit = async (name) => {
      const r = await ev(() => {
        const vw = innerWidth, bad = [];
        document.querySelectorAll('#ui *').forEach(e => { const q = e.getBoundingClientRect(); if (q.width && (q.right > vw + 1 || q.left < -1)) bad.push('넘침:' + (e.id || e.className || e.tagName) + ' ' + Math.round(q.left) + '~' + Math.round(q.right)); });
        document.querySelectorAll('#ui button').forEach(e => {
          const q = e.getBoundingClientRect(); if (!q.width) return;
          const t = e.textContent.trim(), lh = parseFloat(getComputedStyle(e).lineHeight) || 20;
          if (t.length <= 12 && !e.classList.contains('card') && e.scrollHeight > lh * 1.9 + parseFloat(getComputedStyle(e).paddingTop) * 2) bad.push('줄바꿈:' + t);
          if (q.height < 36 || q.width < 36) bad.push('작음:' + t + ' ' + Math.round(q.width) + 'x' + Math.round(q.height));
        });
        return bad;
      });
      chk(`[${W}x${H}] ${name} 배치`, !r.length, r.slice(0, 4).join(' / '));
    };
    const scrollKeep = async (name, sel) => {
      const y0 = await ev(() => { const a = document.querySelector('#ui>.layer'); a.scrollTop = a.scrollHeight; return a.scrollTop; });
      if (!y0) { chk(`[${W}x${H}] ${name} 스크롤 유지`, true, '스크롤 없음'); return; }
      await ev(s => { const all = document.querySelectorAll(s); all[all.length - 1].click(); }, sel); await wait(60);
      const y1 = await ev(() => document.querySelector('#ui>.layer').scrollTop);
      chk(`[${W}x${H}] ${name} 스크롤 유지`, Math.abs(y1 - y0) < 2, `${y0}→${y1}`);
    };
    await audit('시작 화면');
    await click('settings'); await wait(60); await audit('설정');
    await scrollKeep('설정 토글', 'button.tg[data-k]'); await scrollKeep('설정 조이스틱', '#s_joy');
    await click('s_back');
    await click('codex'); await wait(60); await audit('도감');
    for (const t of ['w', 'p', 'r', 'j', 'e', 'f', 'u']) { await click(`[data-tab="${t}"]`); await wait(40); await audit('도감 ' + t); }
    await click('cx_back');
    await ev(() => { localStorage.setItem(CFG.SAVE_KEY, JSON.stringify({ runs: 5, trueEnd: 1, tierMax: 3, titles: ['end', 't1'], frags: FRAGS.map(f => f.id), gates: GK_ORDER })); saveCache = null; showTitle(); });
    await audit('시작 화면(진엔딩 후)');
    await click('codex'); await click('[data-tab="u"]'); await wait(40); await audit('해금 현황'); await scrollKeep('해금 현황 칭호', '[data-t]'); await click('cx_back');
    await click('prep'); await wait(60); await audit('도전 준비');
    await scrollKeep('도전 조건 토글', '[data-cond]'); await scrollKeep('고난도 단계', '[data-tier]:not([disabled])');
    await ev(() => { META.conds = []; META.tier = 0; saveMeta(); });
    await click('pr_back');
    // 판 진입 → 선택 화면
    await ev(() => { SETTINGS.dlgAuto = true; localStorage.removeItem(CFG.SAVE_KEY); saveCache = null; newRun(); STATE.mode = 'play'; hideUI(); G.sel = null; });
    for (let i = 0; i < 40; i++) { await wait(80); const m = await ev(() => { if (STATE.mode === 'talk') dlgTap(); else if (STATE.mode === 'select' && G.sel && G.sel.kind === 'start') pickCard(0); return STATE.mode; }); if (m === 'play' && i > 3) break; }
    await wait(100);
    await ev(() => { G.pendingLv = 1; }); await wait(300);
    if (await ev(() => STATE.mode === 'select')) {
      await audit('레벨업 선택'); await scrollKeep('제외 버튼', '#banish');
      await ev(() => { if (G.sel.banish) G.sel.banish = false; toggleAbil(); }); await wait(60); await audit('내 능력'); await ev(() => toggleAbil());
      // 0.35 선택 화면 도감 버튼 → 복귀 (레벨 업·보물 상자 각각)
      for (const kd of ['level', 'chest']) {
        await ev(k => { G.sel = { kind: k, cards: drawCards(3), banish: false }; STATE.mode = 'select'; renderSelect(); }, kd); await wait(60);
        chk(`[${W}x${H}] ${kd} 선택 화면 내 능력·도감 버튼`, await ev(() => !!document.getElementById('cbtn') && !!document.getElementById('abtn')));
        await click('cbtn'); await wait(60); if (kd === 'level') await audit('선택 중 도감');
        chk(`[${W}x${H}] ${kd} 선택 중 도감 진입`, await ev(() => !!document.getElementById('cx_back') && STATE.mode === 'select'));
        await click('cx_back'); await wait(60); chk(`[${W}x${H}] ${kd} 도감 → 선택 화면 복귀`, await ev(() => STATE.mode === 'select' && !!document.querySelector('.card[data-i]') && !!document.getElementById('cbtn')));
      }
      await ev(() => pickCard(0));
    } else chk(`[${W}x${H}] 레벨업 선택 진입`, false, 'mode ' + await ev(() => STATE.mode));
    // 제외한 유물 재등장
    const rel = await ev(() => {
      if (!hasW('vortex')) addWeapon('vortex');
      if (!G.p.passives.some(x => x.id === 'magnet')) G.p.passives.push({ id: 'magnet', lvl: 1 });
      const before = levelCands().some(c => c.t === 'relic' && c.id === 'eyestorm');
      G.sel = { kind: 'level', cards: [{ t: 'relic', id: 'eyestorm' }], banish: true }; G.banishes = Math.max(1, G.banishes); STATE.mode = 'select';
      pickCard(0);
      const after = levelCands().some(c => c.t === 'relic' && c.id === 'eyestorm');
      let chest = false; try { chest = chestCards ? JSON.stringify(chestCards()).includes('eyestorm') : false; } catch (e) { }
      closeSel && G.sel && closeSel();
      return { before, after, chest };
    });
    chk(`[${W}x${H}] 유물 제외 전 후보`, rel.before); chk(`[${W}x${H}] 유물 제외 후 미등장`, !rel.after && !rel.chest, JSON.stringify(rel));
    // 일시정지 화면
    await ev(() => { STATE.mode = 'play'; hideUI(); pauseGame(); }); await wait(60); await audit('일시정지');
    // 0.34 게임 중 도감: 진행 중 획득분 반영·탭 전환·복귀
    await click('pcodex'); await wait(60); await audit('게임 중 도감');
    const cw = await ev(() => { const id = G.p.weapons[0].id, nm = WEAPONS[id].name; const c = [...document.querySelectorAll('.cx')].find(x => x.querySelector('b').textContent === nm); return !!c && !c.classList.contains('dim'); });
    chk(`[${W}x${H}] 게임 중 도감 획득분 반영`, cw);
    for (const t of ['p', 'r', 'j', 'e']) { await click(`[data-tab="${t}"]`); await wait(40); await audit('게임 중 도감 ' + t); }
    await click('cx_back'); await wait(60); chk(`[${W}x${H}] 도감 → 일시정지 복귀`, await ev(() => STATE.mode === 'pause' && !!document.getElementById('pcodex')));
    await click('psettings'); await wait(60); await audit('일시정지 설정'); await scrollKeep('일시정지 설정 토글', 'button.tg[data-k]');
    chk(`[${W}x${H}] 페이지 오류 0`, !errs.length, errs.slice(0, 2).join(' / '));
    await p.context().close();
  }
  console.log(out.join('\n')); console.log('FAIL', out.filter(x => x.startsWith('FAIL')).length, '/', out.length);
  await b.close(); SERVER.close();
})();
