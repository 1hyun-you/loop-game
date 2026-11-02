/* ============================================================
   화면 겹침 UI — 시작·일시정지·결과 화면, 대사창 틀 (0.4)
   ============================================================ */
const UI = document.getElementById('ui');
function hideUI() { UI.innerHTML = ''; }
const brName = (id, k) => k ? ' · ' + BRANCHES[id].find(o => o.k === k).nm : '';
const buildChips = () => (G.p.job ? `<span class="chip" style="border-color:#d9a8ff">${JOBS[G.p.job].name}${G.p.job2 ? ' · ' + JOB2[G.p.job].concat(JOB2_STAT).find(o => o.k === G.p.job2).nm : ''}</span>` : '')
  + G.p.weapons.map(w => `<span class="chip" style="border-color:${CFG.colors[WEAPONS[w.id].cat]}">${WEAPONS[w.id].name} ${w.lvl}${brName(w.id, w.br)}</span>`).join('')
  + (G.p.exw ? `<span class="chip" style="border-color:#ffe08a">${EXW[G.p.exw.id].name}</span>` : '')
  + G.p.passives.map(x => `<span class="chip" style="border-color:${CFG.colors.passive}">${PASSIVES[x.id].name} ${x.lvl}${brName(x.id, x.br)}</span>`).join('')
  + G.p.relics.map(r => `<span class="chip" style="border-color:#ffd24a">유물 ${RELICS[r].name}</span>`).join('');

/* 설정 (0.7) — 기기 저장, 궁극기 자동 발동 */
const SETTINGS = (() => { try { return Object.assign({ autoUlt: false }, JSON.parse(localStorage.getItem(CFG.SAVE_KEY + '_set') || '{}')); } catch (e) { return { autoUlt: false }; } })();
function saveSettings() { try { localStorage.setItem(CFG.SAVE_KEY + '_set', JSON.stringify(SETTINGS)); } catch (e) { } }
function showSettings(back) {
  UI.innerHTML = `<div class="layer"><h2>설정</h2>
    <div class="menu"><button id="s_ult" class="${SETTINGS.autoUlt ? 'pri' : ''}">궁극기 자동 발동 · ${SETTINGS.autoUlt ? '켜짐' : '꺼짐'}</button>
    <p class="hint">꺼짐: 게이지가 차면 손을 떼고 잠시 멈춰 발동 · 켜짐: 적이 몰리면 자동 발동</p>
    <button id="s_back">돌아가기</button></div></div>`;
  on('s_ult', () => { SETTINGS.autoUlt = !SETTINGS.autoUlt; saveSettings(); showSettings(back); });
  on('s_back', back);
}
const on = (id, fn) => { const b = document.getElementById(id); if (b) b.addEventListener('click', fn); };

/* 시작 화면 — 배경은 새 판 들판(정지 상태), 기록 요약 표시 */
function showTitle() {
  newRun(); STATE.mode = 'title';
  const s = loadSave();
  UI.innerHTML = `<div class="layer title">
    <div class="ttl"><h1>회귀의 들판</h1><p class="sub">몰려오는 무리를 버티고 다섯 페이즈를 돌파 · 제단에서 전직</p></div>
    <button class="pri big" id="start">시작</button>
    <button id="settings">설정</button>
    <div class="stats"><span>플레이</span><span>${s.runs || 0}판</span><span>돌파</span><span>${s.clears || 0}회</span><span>최고 생존</span><span>${s.bestTime ? fmtTime(s.bestTime) : '-'}</span></div>
    <p class="hint">화면을 누른 채 끌어 이동 · 공격은 자동</p>
    <p class="ver">v${CFG.VERSION}</p></div>`;
  on('start', startRun);
  on('settings', () => showSettings(showTitle));
}
function startRun() { if (STATE.mode !== 'title') newRun(); STATE.mode = 'play'; hideUI(); }

/* 일시정지 */
function togglePause() { if (STATE.mode === 'play') pauseGame(); else if (STATE.mode === 'pause') resumeGame(); }
function pauseGame() {
  if (STATE.mode !== 'play' || !G || G.result) return;
  STATE.mode = 'pause'; INPUT.active = false; INPUT.id = null; INPUT.mag = 0;
  const P = curPhase(), ph = G.ph;
  UI.innerHTML = `<div class="layer">
    <h2>일시정지</h2>
    <div class="stats"><span>경과 시간</span><span>${fmtTime(G.time)}</span><span>페이즈</span><span>${P ? `${ph.i + 1}/${ph.order.length} ${P.name}` : '이동 중'}</span><span>레벨</span><span>${G.p.level}</span><span>체력</span><span>${Math.ceil(G.p.hp)}/${G.p.maxHp}</span></div>
    <div class="build">${buildChips()}</div>
    <div class="menu"><button class="pri" id="resume">계속</button><button id="psettings">설정</button><button id="restart">다시 시작</button><button id="home">처음 화면</button></div></div>`;
  on('resume', resumeGame);
  on('psettings', () => showSettings(() => { STATE.mode = 'play'; pauseGame(); }));
  on('restart', () => { if (confirmStep('restart')) newRun(); });
  on('home', () => { if (confirmStep('home')) showTitle(); });
}
function resumeGame() { if (STATE.mode !== 'pause') return; STATE.mode = 'play'; hideUI(); lastT = performance.now(); }
/* 진행 중인 판을 버리는 버튼은 한 번 더 눌러 확정 (오터치 방지) */
function confirmStep(id) {
  const b = document.getElementById(id); if (!b) return true;
  if (b.dataset.armed) return true;
  b.dataset.armed = '1'; b.classList.add('warn'); b.textContent = (id === 'home' ? '처음 화면' : '다시 시작') + ' · 한 번 더 누르면 확정';
  return false;
}

/* 결과 화면 */
function showResult() {
  STATE.mode = 'result';
  const R = G.report, done = G.ph.log.filter(x => x[2] === 'ok').length;
  UI.innerHTML = `<div class="layer"><h2>${R.result === 'clear' ? '들판 돌파' : '쓰러졌다'}</h2>
    ${R.newBest ? '<p class="best">최고 생존 기록 갱신</p>' : ''}
    <div class="stats"><span>생존 시간</span><span>${fmtTime(R.time)}</span><span>돌파 페이즈</span><span>${done}/${G.ph.order.length}</span><span>레벨</span><span>${R.level}</span><span>처치</span><span>${R.kills}</span><span>마지막 피격</span><span>${R.result === 'clear' ? '-' : (R.lastHit || '-')}</span></div>
    <div class="build">${buildChips()}</div>
    <div class="menu"><button class="pri" id="again">다시 시작</button><button id="home">처음 화면</button></div></div>`;
  on('again', newRun); on('home', showTitle);
}

/* 대사창 틀 — 화면 하단 고정, 초상화 자리·이름·본문, 누르면 다음 줄 (대사 내용은 4단계)
   사용: showDialog([{ name, text, color }], 끝난 뒤 함수)  진행 중 게임 정지 */
const DLG = { lines: null, i: 0, shown: 0, timer: null, done: null, prev: 'play' };
function showDialog(lines, done) {
  if (!lines || !lines.length) return done && done();
  DLG.prev = STATE.mode === 'talk' ? DLG.prev : STATE.mode; STATE.mode = 'talk';
  INPUT.active = false; INPUT.id = null; INPUT.mag = 0;
  Object.assign(DLG, { lines, i: 0, done });
  UI.innerHTML = `<div class="dlg-wrap"><div class="dlg" id="dlg" role="dialog" aria-live="polite">
    <div class="pt" id="dpt"></div><div class="body"><div class="nm" id="dnm"></div><div class="tx" id="dtx"></div></div><div class="nx" id="dnx">▼</div></div></div>`;
  document.getElementById('dlg').addEventListener('click', dlgTap);
  dlgLine();
}
function dlgLine() {
  const L = DLG.lines[DLG.i];
  document.getElementById('dnm').textContent = L.name || '';
  document.getElementById('dpt').style.background = L.color || 'var(--panel2)';
  document.getElementById('dpt').textContent = (L.name || '?').slice(0, 1);
  document.getElementById('dnx').style.visibility = 'hidden';
  DLG.shown = 0; clearInterval(DLG.timer);
  DLG.timer = setInterval(() => { DLG.shown += 1; dlgPaint(); if (DLG.shown >= L.text.length) dlgFull(); }, 28);
  dlgPaint();
}
function dlgPaint() { const t = document.getElementById('dtx'); if (t) t.textContent = DLG.lines[DLG.i].text.slice(0, DLG.shown); }
function dlgFull() { clearInterval(DLG.timer); DLG.timer = null; DLG.shown = DLG.lines[DLG.i].text.length; dlgPaint(); const n = document.getElementById('dnx'); if (n) n.style.visibility = 'visible'; }
function dlgTap() {
  if (DLG.timer) return dlgFull();                         // 출력 중 누르면 전체 표시
  if (++DLG.i < DLG.lines.length) return dlgLine();
  hideUI(); STATE.mode = DLG.prev; const f = DLG.done; DLG.lines = null; DLG.done = null; lastT = performance.now(); if (f) f();
}

/* 일시정지 버튼 — 진행 중에만 표시 */
const PBTN = document.createElement('button');
PBTN.id = 'pausebtn'; PBTN.className = 'pausebtn'; PBTN.setAttribute('aria-label', '일시정지'); PBTN.textContent = 'Ⅱ';
PBTN.addEventListener('click', pauseGame); document.body.appendChild(PBTN);
let pbShown = null;
function syncPauseBtn() { const v = STATE.mode === 'play' && G && !G.result; if (v !== pbShown) { pbShown = v; PBTN.style.display = v ? '' : 'none'; } }
/* 화면 전환·앱 이탈 시 자동 일시정지 */
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
window.addEventListener('blur', () => { if (!STATE.dev.auto) pauseGame(); });

/* ============================================================
   주 반복
   ============================================================ */
let lastT = performance.now();
function frame(now) {
  const raw = Math.min(0.05, Math.max(0, (now - lastT) / 1000)); lastT = now;
  if (raw > 0) STATE.fps = STATE.fps * 0.92 + (1 / raw) * 0.08;
  try {
    if (STATE.mode === 'play' && G) {
      const sp = STATE.dev.speed, n = Math.ceil(sp);
      for (let i = 0; i < n; i++) { step(raw * sp / n); if (STATE.mode !== 'play') break; }
    }
    if (G) render();
    syncPauseBtn();
    if (DEV.open && Math.floor(now / 500) !== Math.floor((now - raw * 1000) / 500)) DEV.info();
  } catch (err) {
    console.error(err);
    if (!window.__errShown) { window.__errShown = true; const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;background:#400;color:#fff;font:12px monospace;padding:8px;z-index:99;white-space:pre-wrap'; d.textContent = '오류: ' + (err && err.stack || err); document.body.appendChild(d); }
    if (window.__onErr) window.__onErr(err);
  }
  requestAnimationFrame(frame);
}
resize();
DEV.init();
showTitle();
requestAnimationFrame(frame);
