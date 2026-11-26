// 사용성 점검 (0.31): 토글 시 스크롤 유지, 제외한 유물 재등장, 화면별 가로 넘침·버튼 줄바꿈·작은 터치 영역
// 사용: node dev/vux.js
// 0.34 도감 7탭·게임 중 도감 점검 추가
// 0.35 선택 화면 도감 버튼·복귀 점검 추가
// 0.40 좌우 끌기 탭(탭별 스크롤)·화면 진입 시 배경 불투명 유지 점검 추가
// 0.37 첫 화면 히어로형·고정 헤더·밀기 탭·분기 접기·설정 스위치·전직 2회 확정·회오리 생성 위치 점검 추가
// 0.60 전직·회오리 점검 → 기억 잔영 인물 선택·인물 각성 2회 확정·짝 무기 기본형 점검으로 교체
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
      await ev(() => Promise.race([Promise.all(document.getAnimations().filter(a => a instanceof CSSTransition).map(a => a.finished.catch(() => 0))), new Promise(r => setTimeout(r, 1500))]));   // 0.43 탭 전환 이동 중 측정 방지 (전환 완료 후 배치 점검)
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
    await ev(() => { STATE.dev.auto = false; G.pendingLv = 1; }); await wait(300);   // 0.56 자동 선택이 배치 점검 대기(1.5초)보다 먼저 카드를 고르는 시간 의존 실패 방지
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
      // 0.60 인물 선택(기억 잔영): 잔영 3명·누르면 정보·확정 버튼 / 인물 각성 2회 터치 확정
      await ev(() => { closeSel(); G.p.job = null; G.p.job2 = null; G.p.weapons = G.p.weapons.filter(w => !w.base); G.h60q = 'hero'; openJob2(); }); await wait(80);
      const hs = await ev(() => ({ g: document.querySelectorAll('.h60g').length, ok0: !!document.getElementById('h60ok') }));
      chk(`[${W}x${H}] 기억 잔영 3명·처음엔 확정 버튼 없음`, hs.g === 3 && !hs.ok0, JSON.stringify(hs));
      await click('.h60g[data-g="1"]'); await wait(60); await audit('기억 잔영');
      const hp = await ev(() => { const b = document.getElementById('h60ok'), r = b && b.getBoundingClientRect(); return { ok: !!b, h: r ? Math.round(r.height) : 0, info: !!document.querySelector('.h60i .h b'), pick: G.sel && G.sel.pick, id: G.sel && G.sel.cards[1].id }; });
      chk(`[${W}x${H}] 잔영 누르면 정보·확정 버튼(40px 이상)`, hp.ok && hp.h >= 40 && hp.info && hp.pick === 1, JSON.stringify(hp));
      await click('#h60ok'); await wait(60);
      const hc = await ev(() => ({ mode: STATE.mode, job: G.p.job, base: !!baseW(), ult: G.p.ult, need: JOB_CFG.ultNeed }));
      chk(`[${W}x${H}] 확정 → 인물·전용 칸·궁극기 가득`, hc.mode === 'play' && hc.job === hp.id && hc.base && hc.ult >= hc.need - 0.01, JSON.stringify(hc));
      const at = await ev(() => { G.h60q = 'aw'; openJob2(); const c = () => document.querySelector('.card[data-i="0"]'); c().click(); const a = STATE.mode === 'select' && !G.p.job2 && c().classList.contains('armed') && /한 번 더/.test(document.querySelector('.sel-head .sub').textContent); c().click(); return { a, b: STATE.mode === 'play' && G.p.job2 === 'A' }; });
      chk(`[${W}x${H}] 인물 각성 1회 강조·2회 확정`, at.a && at.b, JSON.stringify(at));
    } else chk(`[${W}x${H}] 레벨업 선택 진입`, false, 'mode ' + await ev(() => STATE.mode));
    // 0.43 제외한 무기 재등장 (0.42 유물 폐지 → 무기 카드 기준으로 교체)
    const rel = await ev(() => {
      const free = WEAPON_ORDER.find(id => !hasW(id) && !G.banished.has(id)) || 'beam';
      while (G.p.weapons.filter(w => !w.base).length >= slotW() - (G.p.weapons.some(w => w.base) ? 1 : 0)) G.p.weapons.pop();
      const before = levelCands().some(c => c.t === 'wnew' && c.id === free);
      G.sel = { kind: 'level', cards: [{ t: 'wnew', id: free }], banish: true }; G.banishes = Math.max(1, G.banishes); STATE.mode = 'select';
      pickCard(0);
      const after = levelCands().some(c => c.t === 'wnew' && c.id === free);
      let chest = false; try { chest = JSON.stringify(chestCands()).includes('"' + free + '"'); } catch (e) { }
      closeSel && G.sel && closeSel();
      return { free, before, after, chest };
    });
    chk(`[${W}x${H}] 무기 제외 전 후보`, rel.before, JSON.stringify(rel)); chk(`[${W}x${H}] 무기 제외 후 미등장`, !rel.after && !rel.chest, JSON.stringify(rel));
    // 0.60 짝 무기 기본형: 가시 덩굴 묶음·단검 상처 선·포탑 설치 후 사격
    const pw = await ev(() => {
      G.enemies.length = 0; G.f60 = null; G.proj.length = 0; const p = G.p;
      const mk = (x, y) => { const e = makeEnemy('skel', x, y); if (!G.enemies.includes(e)) G.enemies.push(e); e.hp = e.maxHp = 9999; return e; };
      const a = mk(p.x + 120, p.y); gridBuild(G.enemies);
      const S = k => wStats({ id: k, lvl: 1 });
      PAIR60.thorn({ id: 'thorn', lvl: 1 }, S('thorn')); const root = a.frz > 0;
      PAIR60.dagger({ id: 'dagger', lvl: 1 }, S('dagger')); const cut = G.f60.cuts.length > 0;
      const w = { id: 'turret', lvl: 1, t: 0 }; G.p.weapons.push(w); PAIR60.turret(w, S('turret')); const tw = G.f60.tw.length;
      for (let i = 0; i < 20; i++) tick60(0.05); const shot = G.proj.some(q => q.src === 'turret');
      G.p.weapons = G.p.weapons.filter(x => x !== w); G.f60.tw.length = 0;
      return { root, cut, tw, shot };
    });
    chk(`[${W}x${H}] 짝 무기 기본형 (묶음·상처 선·포탑 사격)`, pw.root && pw.cut && pw.tw === 1 && pw.shot, JSON.stringify(pw));
    // 일시정지 화면
    await ev(() => { STATE.mode = 'play'; hideUI(); pauseGame(); }); await wait(60); await audit('일시정지');
    // 0.55 일시정지 재배치·내 능력 전체 화면
    chk(`[${W}x${H}] 일시정지 버튼 3단·화면 안 배치`, await ev(() => { const m = document.querySelector('.pz-menu'), q = m && m.getBoundingClientRect(), r = document.getElementById('resume').getBoundingClientRect(), a = document.getElementById('pabil').getBoundingClientRect(), h = document.getElementById('home').getBoundingClientRect(); return !!m && q.height < innerHeight * 0.4 && r.top < a.top && a.top < h.top && h.bottom <= innerHeight; }));
    await click('pabil'); await wait(60); await audit('일시정지 내 능력');
    chk(`[${W}x${H}] 내 능력 전체 화면·탭 3종`, await ev(() => !!document.getElementById('ab_back') && document.querySelectorAll('.ptabs button').length === 3 && document.querySelectorAll('.pgp.on .cx').length >= 1));
    for (const t of ['p', 'j', 'w']) { await click(`[data-atab="${t}"]`); await wait(320); await audit('내 능력 ' + t); }
    await click('ab_back'); await wait(60); chk(`[${W}x${H}] 내 능력 → 일시정지 복귀`, await ev(() => STATE.mode === 'pause' && !!document.getElementById('pabil')));
    await click('pbuild'); await wait(60); chk(`[${W}x${H}] 보유 능력 묶음 → 내 능력`, await ev(() => !!document.getElementById('ab_back'))); await click('ab_back'); await wait(60);
    chk(`[${W}x${H}] 상단 화면 크기 설정 반영`, await ev(() => { const v0 = SETTINGS.hud, a = hudLayout().k; SETTINGS.hud = 'l'; const b = hudLayout().k, L = hudLayout(); SETTINGS.hud = v0; return a === 1 && b > 1 && (L.x + L.w) * L.k <= innerWidth && L.x >= 0; }));
    // 0.34 게임 중 도감: 진행 중 획득분 반영·탭 전환·복귀
    await click('pcodex'); await wait(60); await audit('게임 중 도감');
    const cw = await ev(() => { const id = G.p.weapons[0].id, nm = WEAPONS[id].name; const c = [...document.querySelectorAll('.cx')].find(x => x.querySelector('b').textContent === nm); return !!c && !c.classList.contains('dim'); });
    chk(`[${W}x${H}] 게임 중 도감 획득분 반영`, cw);
    for (const t of ['p', 'r', 'j', 'e']) { await click(`[data-tab="${t}"]`); await wait(320); await audit('게임 중 도감 ' + t); }
    await click('cx_back'); await wait(60); chk(`[${W}x${H}] 도감 → 일시정지 복귀`, await ev(() => STATE.mode === 'pause' && !!document.getElementById('pcodex')));
    await click('psettings'); await wait(60); await audit('일시정지 설정'); await scrollKeep('일시정지 설정 토글', 'button.tg[data-k]');
    // 0.56 결과 화면: 배치·내 능력 왕복·버튼 3종
    await ev(() => { hideUI(); STATE.mode = 'play'; G.report = buildReport(); G.report.score = 1234; showResult(); }); await wait(80); await audit('결과 화면');
    chk(`[${W}x${H}] 결과 화면 핵심 수치 4칸·버튼 3종`, await ev(() => document.querySelectorAll('.rs-kpi>div').length === 4 && ['again', 'home', 'rabil'].every(i => !!document.getElementById(i))));
    await click('rabil'); await wait(60); await audit('결과 내 능력'); await click('ab_back'); await wait(60);
    chk(`[${W}x${H}] 결과 → 내 능력 → 결과 복귀`, await ev(() => STATE.mode === 'result' && !!document.getElementById('again')));
    await ev(() => { STATE.mode = 'play'; hideUI(); pauseGame(); }); await wait(60);
    chk(`[${W}x${H}] 페이지 오류 0`, !errs.length, errs.slice(0, 2).join(' / '));
    await p.context().close();
  }
  console.log(out.join('\n')); console.log('FAIL', out.filter(x => x.startsWith('FAIL')).length, '/', out.length);
  await b.close(); SERVER.close();
})();
