// 사용성 점검 (0.31): 토글 시 스크롤 유지, 제외한 유물 재등장, 화면별 가로 넘침·버튼 줄바꿈·작은 터치 영역
// 사용: node dev/vux.js
// 0.34 도감 7탭·게임 중 도감 점검 추가
// 0.35 선택 화면 도감 버튼·복귀 점검 추가
// 0.40 좌우 끌기 탭(탭별 스크롤)·화면 진입 시 배경 불투명 유지 점검 추가
// 0.37 첫 화면 히어로형·고정 헤더·밀기 탭·분기 접기·설정 스위치·전직 2회 확정·회오리 생성 위치 점검 추가
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
        document.querySelectorAll('#ui *').forEach(e => { if (e.closest('.pgp:not(.on)') || e.classList.contains('pgtr')) return; const q = e.getBoundingClientRect(); if (q.width && (q.right > vw + 1 || q.left < -1)) bad.push('넘침:' + (e.id || e.className || e.tagName) + ' ' + Math.round(q.left) + '~' + Math.round(q.right)); });
        document.querySelectorAll('#ui button').forEach(e => {
          if (e.closest('.pgp:not(.on)')) return;
          const q = e.getBoundingClientRect(); if (!q.width) return;
          const t = e.textContent.trim(), lh = parseFloat(getComputedStyle(e).lineHeight) || 20;
          if (t.length && t.length <= 12 && !e.classList.contains('card') && e.scrollHeight > lh * 1.9 + parseFloat(getComputedStyle(e).paddingTop) * 2) bad.push('줄바꿈:' + t);
          if (q.height < 36 || q.width < 36) bad.push('작음:' + t + ' ' + Math.round(q.width) + 'x' + Math.round(q.height));
        });
        return bad;
      });
      chk(`[${W}x${H}] ${name} 배치`, !r.length, r.slice(0, 4).join(' / '));
    };
    const scrollKeep = async (name, sel) => {
      const y0 = await ev(() => { const a = document.querySelector('#ui .pgp.on') || document.querySelector('#ui>.layer'); a.scrollTop = a.scrollHeight; return a.scrollTop; });
      if (!y0) { chk(`[${W}x${H}] ${name} 스크롤 유지`, true, '스크롤 없음'); return; }
      await ev(s => { const all = document.querySelectorAll(s); all[all.length - 1].click(); }, sel); await wait(60);
      const y1 = await ev(() => (document.querySelector('#ui .pgp.on') || document.querySelector('#ui>.layer')).scrollTop);
      chk(`[${W}x${H}] ${name} 스크롤 유지`, Math.abs(y1 - y0) < 2, `${y0}→${y1}`);
    };
    await audit('시작 화면');
    chk(`[${W}x${H}] 첫 화면 일러스트·아이콘·기록 제거`, await ev(() => { const c = document.getElementById('herocv'), a = document.getElementById('codex'), b = document.getElementById('settings'); const qa = a.getBoundingClientRect(), qb = b.getBoundingClientRect(); return !!c && c.width === 144 && !document.querySelector('.layer.title .stats') && qa.left < innerWidth / 2 && qa.top < 90 && qb.left > innerWidth / 2 && qb.top < 90; }));
    await click('settings'); await wait(60); await audit('설정');
    await scrollKeep('설정 토글', 'button.tg[data-k]'); await scrollKeep('설정 조이스틱', '#s_joy');
    chk(`[${W}x${H}] 설정 스위치 제자리 전환`, await ev(() => { const b = document.querySelector('button.tg[data-k="dmgNum"]'), v0 = SETTINGS.dmgNum; b.click(); const ok = SETTINGS.dmgNum !== v0 && b.isConnected && b.classList.contains('on') === SETTINGS.dmgNum; b.click(); return ok && SETTINGS.dmgNum === v0; }));
    await click('s_back');
    await click('codex'); await wait(60); await audit('도감');
    for (const t of ['w', 'p', 'r', 'j', 'e', 'f', 'u']) { await click(`[data-tab="${t}"]`); await wait(320); await audit('도감 ' + t); }
    await click('[data-tab="w"]'); await wait(320);
    chk(`[${W}x${H}] 도감 분기 접힘 기본·펼침`, await ev(() => { const d = [...document.querySelectorAll('details.acc')]; if (!d.length || d.some(x => x.open)) return false; d[0].querySelector('summary').click(); return d[0].open; }));
    chk(`[${W}x${H}] 도감 고정 헤더`, await ev(() => { const L = document.querySelector('#ui .pgp.on'); L.scrollTop = 1500; const q = document.querySelector('.pgh').getBoundingClientRect(); return L.scrollTop > 0 && Math.abs(q.top) < 2; }));
    const swipe = async (dx, mv = true) => { await ev(([dx, mv]) => { const V = document.querySelector('.pgv'), t = (x) => new Touch({ identifier: 1, target: V, clientX: x, clientY: 400 });
      V.dispatchEvent(new TouchEvent('touchstart', { touches: [t(200)], changedTouches: [t(200)], bubbles: true }));
      if (mv) for (const k of [0.25, 0.6, 1]) V.dispatchEvent(new TouchEvent('touchmove', { touches: [t(200 + dx * k)], changedTouches: [t(200 + dx * k)], bubbles: true, cancelable: true }));
      V.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t(200 + dx)], bubbles: true })); }, [dx, mv]); await wait(320);
      return ev(() => document.querySelector('.ptabs button.on').dataset.tab + '|' + document.querySelector('.pgp.on').dataset.pk); };
    chk(`[${W}x${H}] 도감 좌우 끌기 탭 전환`, (await swipe(-120)) === 'p|p' && (await swipe(120)) === 'w|w' && (await swipe(20)) === 'w|w' && (await swipe(120)) === 'w|w');
    chk(`[${W}x${H}] 끌기 중 화면 따라 이동·탭별 스크롤`, await ev(() => { const V = document.querySelector('.pgv'), T = V.querySelector('.pgtr'), t = (x) => new Touch({ identifier: 1, target: V, clientX: x, clientY: 400 });
      V.dispatchEvent(new TouchEvent('touchstart', { touches: [t(250)], changedTouches: [t(250)], bubbles: true }));
      V.dispatchEvent(new TouchEvent('touchmove', { touches: [t(170)], changedTouches: [t(170)], bubbles: true, cancelable: true }));
      const m = new DOMMatrix(getComputedStyle(T).transform).m41, nb = document.querySelector('.pgp[data-pk="p"]').getBoundingClientRect().left;
      V.dispatchEvent(new TouchEvent('touchcancel', { touches: [], changedTouches: [t(170)], bubbles: true }));
      const a = document.querySelector('.pgp[data-pk="w"]'), b = document.querySelector('.pgp[data-pk="p"]'); b.scrollTop = 0;
      return Math.abs(m + 80) < 2 && nb < innerWidth && nb > 0 && a.scrollTop > 0 && b.scrollTop === 0; }));
    chk(`[${W}x${H}] 탭 누름 시 끌기 탭 이동`, await (async () => { await click('[data-tab="j"]'); await wait(320); return ev(() => { const q = document.querySelector('.pgp[data-pk="j"]').getBoundingClientRect(); return document.querySelector('.pgp.on').dataset.pk === 'j' && Math.abs(q.left) < 2; }); })());
    chk(`[${W}x${H}] 화면 진입 시 배경 불투명 유지`, await ev(async () => { showTitle(); await new Promise(r => setTimeout(r, 0)); const a = getComputedStyle(document.querySelector('#ui>.layer')).animationName; showCodex('w', showTitle); await new Promise(r => setTimeout(r, 0)); const L = document.querySelector('#ui>.layer'), c = getComputedStyle(L.querySelector('.pgv')).animationName; return a === 'none' && getComputedStyle(L).animationName === 'none' && getComputedStyle(L).opacity === '1' && L.classList.contains('enter') && c === 'lyIn'; }));
    await click('cx_back');
    await ev(() => { localStorage.setItem(CFG.SAVE_KEY, JSON.stringify({ runs: 5, trueEnd: 1, tierMax: 3, titles: ['end', 't1'], frags: FRAGS.map(f => f.id), gates: GK_ORDER })); saveCache = null; showTitle(); });
    await audit('시작 화면(진엔딩 후)');
    await click('codex'); await click('[data-tab="u"]'); await wait(320); await audit('해금 현황'); await scrollKeep('해금 현황 칭호', '[data-t]'); await click('cx_back');
    await click('prep'); await wait(60); await audit('도전 준비');
    await scrollKeep('고난도 단계', '[data-tier]:not([disabled])');
    await click('[data-ptab="c"]'); await wait(320); await audit('도전 준비 조건');
    chk(`[${W}x${H}] 도전 조건 스위치 제자리 전환·배율 갱신`, await ev(() => { const b = document.querySelector('[data-cond]'), m = document.getElementById('pr_mul').textContent; b.click(); const ok = b.isConnected && b.classList.contains('on') && document.getElementById('pr_mul').textContent !== m; b.click(); return ok; }));
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
      // 0.37 전직 2회 터치 확정
      const jt = await ev(() => { G.sel = { kind: 'job', cards: jobCands(), offer: false }; STATE.mode = 'select'; renderSelect(); const c = () => document.querySelector('.card[data-i="0"]'); c().click(); const a = STATE.mode === 'select' && !G.p.job && c().classList.contains('armed') && /한 번 더/.test(document.querySelector('.sel-head .sub').textContent); c().click(); return { a, b: STATE.mode === 'play' && !!G.p.job }; });
      chk(`[${W}x${H}] 전직 1회 강조·2회 확정`, jt.a && jt.b, JSON.stringify(jt));
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
    // 0.37 회오리: 플레이어와 140 이상 떨어진 적 무리 지점 생성, 플레이어 근처 적 미흡인
    const vx = await ev(() => {
      G.enemies.length = 0; const p = G.p; p.face = { x: 1, y: 0 };
      const mk = (x, y) => { const e = makeEnemy('slime', x, y); if (!G.enemies.includes(e)) G.enemies.push(e); return e; };
      const near = mk(p.x + 40, p.y); for (let i = 0; i < 8; i++) mk(p.x + 230 + (i % 3) * 12, p.y + (i % 4) * 10);
      gridBuild(G.enemies);
      const w = G.p.weapons.find(x => x.id === 'vortex') || { id: 'vortex', lvl: 1 }; G.vortex = [];
      WEAPON_FIRE.vortex(w, { dmg: 5, area: 1, n: 1 });
      const v = G.vortex[0], d = v ? Math.hypot(v.x - p.x, v.y - p.y) : 0, nx = near.x;
      for (let i = 0; i < 20; i++) updateArsenal(0.05);
      return { d: Math.round(d), moved: Math.round(Math.abs(near.x - nx)) };
    });
    chk(`[${W}x${H}] 회오리 전방 무리 생성·근접 적 미흡인`, vx.d >= 140 && vx.moved === 0, JSON.stringify(vx));
    // 일시정지 화면
    await ev(() => { STATE.mode = 'play'; hideUI(); pauseGame(); }); await wait(60); await audit('일시정지');
    // 0.34 게임 중 도감: 진행 중 획득분 반영·탭 전환·복귀
    await click('pcodex'); await wait(60); await audit('게임 중 도감');
    const cw = await ev(() => { const id = G.p.weapons[0].id, nm = WEAPONS[id].name; const c = [...document.querySelectorAll('.cx')].find(x => x.querySelector('b').textContent === nm); return !!c && !c.classList.contains('dim'); });
    chk(`[${W}x${H}] 게임 중 도감 획득분 반영`, cw);
    for (const t of ['p', 'r', 'j', 'e']) { await click(`[data-tab="${t}"]`); await wait(320); await audit('게임 중 도감 ' + t); }
    await click('cx_back'); await wait(60); chk(`[${W}x${H}] 도감 → 일시정지 복귀`, await ev(() => STATE.mode === 'pause' && !!document.getElementById('pcodex')));
    await click('psettings'); await wait(60); await audit('일시정지 설정'); await scrollKeep('일시정지 설정 토글', 'button.tg[data-k]');
    chk(`[${W}x${H}] 페이지 오류 0`, !errs.length, errs.slice(0, 2).join(' / '));
    await p.context().close();
  }
  console.log(out.join('\n')); console.log('FAIL', out.filter(x => x.startsWith('FAIL')).length, '/', out.length);
  await b.close(); SERVER.close();
})();
