/* ============================================================
   화면 겹침 UI — 시작·일시정지·결과 화면, 대사창 틀 (0.4)
   ============================================================ */
const UI = document.getElementById('ui');
function hideUI() { UI.innerHTML = ''; }

/* 결과 화면 빌드 요약 (0.31): 피해 비중 상위 5개 막대 + 보유 능력 칩 */
const SRC_NM = { ult: '궁극기', pet: '야수 동료', maul: '곰 강타', howl: '늑대 울부짖음', minion: '소환수', turret: '포탑', react: '반응 폭발', bleed: '출혈', trail: '불길 자국', mark: '사냥 표식',
  dance: '칼춤', banner: '정복의 깃발', holy: '정화 폭발', wx: '직업 변환', fireball_pool: '화염구 불바다', bomb_pool: '폭탄 화염', fissure: '균열', split: '분열 화살', mbolt: '비전 탄', wind: '질풍 창', thunder: '뇌광',
  waraxe: '전투 도끼', shade: '그림자 칼날', gshield: '금빛 방패', xbow: '연발 석궁', coil: '전기 코일', shard: '시간 파편', flameorb: '불꽃 구슬', bonehand: '해골 손', bless: '축복 고리', thornshot: '가시 사출',
  quake: '지진 망치', dagger: '독 단검', longbow: '관통 장궁', mine: '지뢰', frost: '서리', pendulum: '시간 진자', orb: '영혼 구체', radiance: '광휘', thorn: '가시 덤불', shatter: '얼음 파쇄' };
function srcName(k) {
  if (WEAPONS[k]) return WEAPONS[k].name;
  if (SRC_NM[k]) return SRC_NM[k];
  if (RELICS[k]) return '유물 ' + RELICS[k].name;
  return '기타 효과';
}

/* 설정·도감·도전 준비 화면은 meta.js (0.14·0.15) */
const on = (id, fn) => { const b = document.getElementById(id); if (b) b.addEventListener('click', fn); };

/* 시작 화면 (0.37 히어로형): 도트 일러스트 배경, 하단 글씨 메뉴, 좌상단 도감·우상단 설정 아이콘, 기록류는 도감 해금 현황으로 이관 */
function showTitle() {
  newRun(); STATE.mode = 'title';
  const s = loadSave(), ro = runOpt();
  UI.innerHTML = `<div class="layer title hero">
    <canvas class="herobg" id="herocv" aria-hidden="true"></canvas><div class="heroshade"></div>
    ${icBtn('codex', 'book', '도감', 'tl')}${icBtn('settings', 'gear', '설정', 'tr')}
    <div class="hlogo"><h1>회귀의 들판</h1>${s.title && TITLES[s.title] ? `<p class="best">${TITLES[s.title]}</p>` : ''}</div>
    <div class="hmenu"><button class="txb main" id="start">시작</button>
    ${s.trueEnd ? `<button class="txb" id="prep">도전 준비</button><p class="hint">${optText(ro) || '기본 난이도'} · 점수 배율 ×${optMul(ro).toFixed(2)}</p>` : ''}</div>
    <p class="ver">v${CFG.VERSION}</p></div>`;
  heroMount(document.getElementById('herocv'));
  on('start', e => { uiSpark(e.currentTarget); startRun(); });
  on('settings', () => showSettings(showTitle));
  on('codex', () => showCodex('w', showTitle));
  on('prep', () => showPrep(showTitle));
}
/* 0.25 휴대폰 뒤로가기: 플레이 중 일시정지, 일시정지·하위 화면은 이전 화면, 처음 화면은 2초 내 두 번 눌러 종료 */
const BACK = { armT: 0 };
function backInit() { try { history.pushState({ g: 1 }, ''); } catch (e) { } window.addEventListener('popstate', onBack); }
function backHint(t) { let d = document.getElementById('backhint'); if (!d) { d = document.createElement('div'); d.id = 'backhint'; document.body.appendChild(d); } d.textContent = t; d.style.display = 'block'; clearTimeout(BACK.h); BACK.h = setTimeout(() => { d.style.display = 'none'; }, 2000); }
function onBack() {
  backAct();
  try { history.pushState({ g: 1 }, ''); } catch (e) { }
}
function backAct() {
  const sub = ['s_back', 'cx_back', 'pr_back', 'ab_back'].map(id => document.getElementById(id)).find(Boolean);
  if (STATE.mode === 'title' && !sub) {
    if (performance.now() - BACK.armT < 2000) { window.removeEventListener('popstate', onBack); history.back(); return; }   // 앱 종료(이전 기록으로 이동)
    BACK.armT = performance.now(); backHint('한 번 더 누르면 종료');
  } else if (sub) sub.click();
  else if (STATE.mode === 'play') pauseGame();
  else if (STATE.mode === 'pause') { if (PAUSE_ABIL.on) { PAUSE_ABIL.on = false; STATE.mode = 'play'; pauseGame(); } else resumeGame(); }
  else if (STATE.mode === 'select' && G.sel && G.sel.abil) toggleAbil();
  else if (STATE.mode === 'result') { const h = document.getElementById('home'); if (h) h.click(); }
}
function startRun() { newRun(); STATE.mode = 'play'; hideUI(); }     // 도전 옵션 반영 위해 항상 새 판 (0.15)

/* 일시정지 */
function togglePause() { if (STATE.mode === 'play') pauseGame(); else if (STATE.mode === 'pause') resumeGame(); }
const PAUSE_ABIL = { on: false };
function pauseGame() {
  if (STATE.mode !== 'play' || !G || G.result) return;
  STATE.mode = 'pause'; INPUT.active = false; INPUT.id = null; INPUT.mag = 0;
  /* 0.55 재배치: 정보 한 묶음 + 보유 능력 아이콘 + 버튼 3단(계속 / 내 능력·도감·설정 / 다시 시작·처음 화면) */
  const P = curPhase(), ph = G.ph, p = G.p;
  const tile = (h, lv) => `<span class="pz-t">${h}${lv ? `<em>${lv}</em>` : ''}</span>`;
  const ws = p.weapons.slice().sort((a, b) => (b.base ? 1 : 0) - (a.base ? 1 : 0)).map(w => { const d = WEAPONS[w.id]; return tile(icBox(w.fu || w.base ? JOB_COL[p.job] : CFG.colors[d.cat], d.ic, branchWeaponArt(w.id, w.br)), w.lvl); }).join('');
  const ps = p.passives.map(x => tile(icBox(CFG.colors.passive, PASSIVES[x.id].ic, x.id), x.lvl)).join('');
  const job = p.job ? (p.job2 && JOBS[p.job2] ? JOBS[p.job2].name : JOBS[p.job].name) : '';
  UI.innerHTML = `<div class="layer pz">
    <h2>일시정지</h2>
    <div class="pz-info"><span class="l1">${job ? esc(job) + ' · ' : ''}Lv ${p.level}</span><span class="l2"><span>${fmtTime(G.time)}</span><span>${P ? `${ph.i + 1}/${ph.order.length} ${esc(curPhaseName())}` : '이동 중'}</span><span>체력 ${Math.ceil(p.hp)}/${p.maxHp}</span></span></div>
    ${ws || ps ? `<div class="pz-build" id="pbuild" role="button" tabindex="0" aria-label="내 능력 보기">${ws ? `<div class="r"><i>무기</i>${ws}</div>` : ''}${ps ? `<div class="r"><i>보조</i>${ps}</div>` : ''}</div>` : ''}
    <div class="pz-menu"><button class="pri" id="resume">계속</button>
      <div class="r3"><button id="pabil">내 능력</button><button id="pcodex">도감</button><button id="psettings">설정</button></div>
      <div class="r2"><button id="restart">다시 시작</button><button id="home">처음 화면</button></div></div></div>`;
  const again = () => { STATE.mode = 'play'; pauseGame(); };
  on('resume', resumeGame);
  on('pabil', () => showAbil(again));
  on('pbuild', () => showAbil(again));
  on('pcodex', () => showCodex('w', again));   // 0.34 게임 중 도감
  on('psettings', () => showSettings(again));
  on('restart', () => { if (confirmStep('restart')) newRun(); });
  on('home', () => { if (confirmStep('home')) showTitle(); });
}
function resumeGame() { if (STATE.mode !== 'pause') return; PAUSE_ABIL.on = false; STATE.mode = 'play'; hideUI(); lastT = performance.now(); }
/* 진행 중인 판을 버리는 버튼은 한 번 더 눌러 확정 (오터치 방지) */
function confirmStep(id) {
  const b = document.getElementById(id); if (!b) return true;
  if (b.dataset.armed) return true;
  b.dataset.armed = '1'; b.classList.add('warn'); b.textContent = '한 번 더 눌러 확정';
  return false;
}

/* 결과 화면 */

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
  const pt = document.getElementById('dpt'), url = L.pt && PT_URL[L.pt];   // 초상화 도트 (0.13), 없으면 이름 첫 글자
  document.getElementById('dnm').textContent = L.name || '';
  pt.style.background = url ? `${L.color || '#222'} url(${url}) center/100% 100% no-repeat` : (L.color || 'var(--panel2)');
  pt.textContent = url ? '' : (L.name || '?').slice(0, 1);
  document.getElementById('dnx').style.visibility = 'hidden';
  DLG.shown = 0; clearInterval(DLG.timer);
  DLG.timer = setInterval(() => { DLG.shown += 1; dlgPaint(); if (DLG.shown >= L.text.length) dlgFull(); }, 28);
  dlgPaint();
}
function dlgPaint() { const t = document.getElementById('dtx'); if (t) t.textContent = DLG.lines[DLG.i].text.slice(0, DLG.shown); }
function dlgFull() {
  clearInterval(DLG.timer); DLG.timer = null; DLG.shown = DLG.lines[DLG.i].text.length; dlgPaint(); const n = document.getElementById('dnx'); if (n) n.style.visibility = 'visible';
  if (SETTINGS.dlgAuto || STATE.dev.auto) { const L = DLG.lines, i = DLG.i; setTimeout(() => { if (DLG.lines === L && DLG.i === i && !DLG.timer) dlgTap(); }, STATE.dev.auto ? 400 : 1800); }   // 대사 자동 넘김 (0.14)
}
function dlgTap() {
  if (!DLG.lines) return;                                  // 0.30 닫힌 직후 중복 입력 무시
  if (DLG.timer) return dlgFull();                         // 출력 중 누르면 전체 표시
  if (++DLG.i < DLG.lines.length) return dlgLine();
  hideUI(); STATE.mode = DLG.prev; const f = DLG.done; DLG.lines = null; DLG.done = null; lastT = performance.now(); if (f) f();
}

/* 일시정지 버튼 — 진행 중에만 표시 */
const PBTN = document.createElement('button');
PBTN.id = 'pausebtn'; PBTN.className = 'pausebtn'; PBTN.setAttribute('aria-label', '일시정지'); PBTN.innerHTML = `<img src="${uiIcon('pause')}" alt="">`;
PBTN.addEventListener('click', pauseGame); document.body.appendChild(PBTN);
let pbShown = null;
function syncPauseBtn() { const L=hudLayout(),k=L.k||1;PBTN.style.left=L.pause.x*k+'px';PBTN.style.top=L.pause.y*k+'px';PBTN.style.width=L.pause.w*k+'px';PBTN.style.height=L.pause.h*k+'px'; const v = STATE.mode === 'play' && G && !G.result; if (v !== pbShown) { pbShown = v; PBTN.style.display = v ? '' : 'none'; } }
/* 화면 전환·앱 이탈 시 자동 일시정지 */
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
window.addEventListener('blur', () => { if (!STATE.dev.auto) pauseGame(); });

/* ============================================================
   주 반복
   ============================================================ */
let lastT = performance.now();
/* 성능 측정 (0.18, 5단계 결정 안건 3) — 판 진행 중 실제 프레임 간격 누적: 1ms 단위 분포로 평균·하위 1%·하위 5% FPS 산출 */
const PERF = { bins: new Uint32Array(101), n: 0, sum: 0 };
function perfAdd(dt) { const ms = Math.min(100, Math.round(dt * 1000)); PERF.bins[ms]++; PERF.n++; PERF.sum += dt; }
function perfReset() { PERF.bins.fill(0); PERF.n = 0; PERF.sum = 0; }
function perfStat() {
  if (PERF.n < 30) return null;
  const at = q => { let acc = 0; for (let ms = 100; ms >= 0; ms--) { acc += PERF.bins[ms]; if (acc >= PERF.n * q) return ms; } return 0; };
  const f = ms => Math.min(60, Math.round(1000 / Math.max(1, ms)));
  return { avg: Math.min(60, Math.round(PERF.n / PERF.sum)), low1: f(at(0.01)), low5: f(at(0.05)), sec: Math.round(PERF.sum), slow: Math.round(PERF.bins.slice(21).reduce((s, x) => s + x, 0) / PERF.n * 1000) / 10 };
}
function frame(now) {
  if (fpsSkip(now)) { requestAnimationFrame(frame); return; }   // 0.47 프레임 제한 (기본 60, 설정 120)
  const raw = Math.min(0.05, Math.max(0, (now - lastT) / 1000)); lastT = now;
  if (raw > 0) STATE.fps = STATE.fps * 0.92 + (1 / raw) * 0.08;
  if (raw > 0 && STATE.mode === 'play' && !document.hidden) perfAdd(raw);
  try {
    if (STATE.mode === 'play' && G) {
      const sp = STATE.dev.speed, n = Math.ceil(sp), rs = rcScale(raw);   // 정지·슬로모션 (0.28)
      for (let i = 0; i < n; i++) { step(raw * sp / n * rs); if (STATE.mode !== 'play') break; }
    }
    if (G) render();
    statusSync(now);                                          // 0.30 상태 표시줄 색 맞춤
    auWatch();
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
buildPortraits();
DEV.init();
showTitle(); backInit();
requestAnimationFrame(frame);
