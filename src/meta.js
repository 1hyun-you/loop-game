/* ============================================================
   메뉴·메타 진행 — 설정 8종(0.14) · 도감 4탭(0.14) · 고난도 3단계·도전 조건 6종·판 점수·칭호·색상 변형(0.15)
   4단계 결정 안건 2·3: 진엔딩 후 고난도 1단계부터 해금, 단계 k 마왕 처치 시 k+1 해금
   보상은 성능 영향 없음(판 점수 배율·칭호·주인공 색상), 배율·강화 수치는 초기값 (5단계 시험으로 확정)
   ============================================================ */
/* ---------- 설정 (기기 저장) ---------- */
const SET_DEF = { autoUlt: false, joy: 'float', confirm2: false, sfx: 80, bgm: 60, vibe: true, shake: true, dlgAuto: false, dmgNum: false };
const SETTINGS = (() => { try { return Object.assign({}, SET_DEF, JSON.parse(localStorage.getItem(CFG.SAVE_KEY + '_set') || '{}')); } catch (e) { return Object.assign({}, SET_DEF); } })();
function saveSettings() { try { localStorage.setItem(CFG.SAVE_KEY + '_set', JSON.stringify(SETTINGS)); } catch (e) { } }
/* 0.27f 전체 화면 옵션 삭제: 상태 표시줄 표시형 확정 (웹 전체 화면은 뒤로가기 시 해제·재적용 버벅임 발생) */
let vibeAt = 0;
function vibe(ms) {
  if (!SETTINGS.vibe || STATE.dev.auto || !navigator.vibrate) return;
  const t = performance.now(); if (t - vibeAt < 220) return; vibeAt = t;
  try { navigator.vibrate(ms); } catch (e) { }
}
const joyFixed = () => ({ x: VIEW.cw / 2, y: VIEW.ch - VIEW.sab - 130 });

/* ---------- 고난도 단계·도전 조건 ---------- */
const TIERS = [
  { nm: '기본', k: 0, mul: 1 },
  { nm: '고난도 1', k: 0.3, mul: 1.5 },
  { nm: '고난도 2', k: 0.6, mul: 2 },
  { nm: '고난도 3', k: 0.9, mul: 2.5 },
];
const CONDS = {
  melee: { nm: '근접 무기만', ds: '근접 계열 무기만 등장', mul: 1.2, title: '칼끝만 믿는 자', ex: 'ranged' },
  ranged: { nm: '원거리 무기만', ds: '원거리·마법 계열 무기만 등장, 시작 무기 화살', mul: 1.15, title: '먼 곳의 사수', ex: 'melee' },
  two: { nm: '선택지 2개', ds: '레벨 업 선택지 3개 → 2개', mul: 1.3, title: '좁은 갈림길' },
  noheal: { nm: '회복 없음', ds: '모든 체력 회복 효과 무효', mul: 1.35, title: '상처를 견딘 자' },
  nojob: { nm: '전직 금지', ds: '전직 제단 미등장 (궁극기 없음)', mul: 1.3, title: '이름 없는 검사' },
  slot3: { nm: '무기 3칸', ds: '무기 칸 5칸 → 3칸', mul: 1.25, title: '세 자루의 무기' },
};
const COND_ORDER = ['melee', 'ranged', 'two', 'noheal', 'nojob', 'slot3'];
const META_CAP = { kPerCond: 0.12, kMin: 0.45, condMul: 2.5 };   // 0.17 (5단계 결정 안건 1-4·1-5): 조건 1개당 고난도 적 강화 -12%(하한 45%), 조건 점수 배율 누적 상한 2.5
/* 칭호 — 진엔딩·고난도 단계별 첫 마왕 처치·도전 조건별 첫 마왕 처치 / 색상 — 진엔딩·고난도 단계 칭호에 연동 */
const TITLES = Object.assign({ end: '고리를 끊은 자', t1: '고난도 1 돌파', t2: '고난도 2 돌파', t3: '고난도 3 돌파' },
  Object.fromEntries(COND_ORDER.map(k => ['c_' + k, CONDS[k].title])));
const COLORS = [
  { id: 'base', nm: '푸른 망토', c: '#7fb4ff' },
  { id: 'silver', nm: '은빛', c: '#d8dce8', need: 'end' },
  { id: 'teal', nm: '청록', c: '#5fd0c0', need: 't1' },
  { id: 'crimson', nm: '진홍', c: '#e05a6a', need: 't2' },
  { id: 'gold', nm: '황금', c: '#f0c850', need: 't3' },
];
const META = (() => { try { return Object.assign({ tier: 0, conds: [] }, JSON.parse(localStorage.getItem(CFG.SAVE_KEY + '_run') || '{}')); } catch (e) { return { tier: 0, conds: [] }; } })();
function saveMeta() { try { localStorage.setItem(CFG.SAVE_KEY + '_run', JSON.stringify({ tier: META.tier, conds: META.conds })); } catch (e) { } }
/* 판 시작 시 적용 옵션 — 진엔딩 전에는 항상 기본 */
function runOpt() {
  const s = loadSave();
  if (!s.trueEnd) return { tier: 0, conds: [] };
  const tier = clamp(META.tier | 0, 0, Math.min(3, s.tierMax || 1));
  return { tier, conds: META.conds.filter(k => CONDS[k]) };
}
const optOf = () => (G && G.opt) || { tier: 0, conds: [] };
const hasCond = k => optOf().conds.includes(k);
const tierK = () => TIERS[optOf().tier].k * Math.max(META_CAP.kMin, 1 - META_CAP.kPerCond * optOf().conds.length);   // 0.17 조건 수만큼 적 강화 완화
const slotW = () => hasCond('slot3') ? 3 : CFG.slots.weapon;
const selN = () => hasCond('two') ? 2 : CFG.select.cards;
const catOk = cat => hasCond('melee') ? cat === 'melee' : hasCond('ranged') ? cat !== 'melee' : true;
const startWeapon = () => hasCond('ranged') ? 'arrow' : START_WEAPON;
function optMul(o) { return TIERS[o.tier].mul * Math.min(META_CAP.condMul, o.conds.reduce((m, k) => m * CONDS[k].mul, 1)); }   // 0.17 조건 배율 누적 상한
function optText(o) { return [o.tier ? TIERS[o.tier].nm : null].concat(o.conds.map(k => CONDS[k].nm)).filter(Boolean).join(' · '); }
function playerColor() { const s = loadSaveCached(); const C = COLORS.find(x => x.id === s.color); return C && colorOpen(s, C) ? C.c : COLORS[0].c; }
const colorOpen = (s, C) => !C.need || (s.titles || []).includes(C.need);
let saveCache = null;                                       // 그리기용 저장 사본 (새 판·저장 변경 시 비움)
function loadSaveCached() { if (!saveCache) saveCache = loadSave(); return saveCache; }
function unlockTitle(s, id, R) { s.titles = s.titles || []; if (s.titles.includes(id)) return; s.titles.push(id); if (R) (R.newTitles = R.newTitles || []).push(TITLES[id]); }

/* 판 종료 저장 — 도감 기록·점수·칭호 (finishRun에서 호출) */
function metaSave(s) {
  const R = G.report, o = optOf(), add = (k, arr) => { s[k] = s[k] || []; for (const x of arr) if (x && !s[k].includes(x)) s[k].push(x); };
  add('seenW', G.p.weapons.map(w => w.id)); add('seenE', Object.keys(G.stats.kt)); add('seenJ', [G.p.job]); add('seenP', G.p.passives.map(x => x.id)); add('seenR', G.p.relics);
  const ok = G.ph.log.filter(x => x[2] === 'ok' && x[0] !== 'gate' && x[0] !== 'demon').length, dm = R.demon, dk = dm && dm[0] === 'kill', gk = R.gate && R.gate[1] === 'kill';
  const base = Math.round(G.kills * 0.2) + ok * 150 + (gk ? 2000 : 0) + (dk ? 6000 : 0), mul = optMul(o);   // 점수 초기식 (5단계 조정)
  R.score = Math.round(base * mul); R.mul = +mul.toFixed(2); R.opt = [o.tier, o.conds.join(',')];
  R.newBestScore = R.score > (s.bestScore || 0); s.bestScore = Math.max(s.bestScore || 0, R.score);
  if (dk && s.trueEnd) {                                     // 진엔딩 후 마왕 처치: 다음 단계 해금·칭호
    if (o.tier > 0) unlockTitle(s, 't' + o.tier, R);
    s.tierMax = Math.min(3, Math.max(s.tierMax || 1, o.tier + 1));
    for (const k of o.conds) unlockTitle(s, 'c_' + k, R);
  }
  saveCache = null;
}

/* ---------- 설정 화면 ---------- */
function showSettings(back) {
  const T = (k, nm, ds) => `<div class="row"><div class="rt"><b>${nm}</b><span>${ds}</span></div><button class="tg sw ${SETTINGS[k] ? 'on' : ''}" data-k="${k}" role="switch" aria-checked="${!!SETTINGS[k]}" aria-label="${nm}"><i></i></button></div>`;
  const V = (k, nm) => `<div class="row"><div class="rt"><b>${nm}</b><span>0~100</span></div><input type="range" min="0" max="100" step="10" value="${SETTINGS[k]}" data-v="${k}" aria-label="${nm}"><output>${SETTINGS[k]}</output></div>`;
  UI.innerHTML = `<div class="layer scroll pg">${pgHead('설정', 's_back')}<div class="rows">
    <div class="row"><div class="rt"><b>조이스틱</b><span>${SETTINGS.joy === 'fixed' ? '고정형: 화면 아래 중앙 기준' : '유동형: 처음 누른 위치 기준'}</span></div><button class="tg" id="s_joy">${SETTINGS.joy === 'fixed' ? '고정형' : '유동형'}</button></div>
    ${T('autoUlt', '궁극기 자동 발동', '꺼짐: 손을 떼고 잠시 멈춰 발동 · 켜짐: 적이 몰리면 자동')}
    ${T('confirm2', '두 번 눌러 확정', '선택 카드를 한 번 더 눌러야 선택')}
    ${T('dlgAuto', '대사 자동 넘김', '대사가 끝나면 잠시 후 다음 줄로')}
    ${T('vibe', '진동', '피격·보스 등장 시 짧은 진동')}
    ${T('shake', '화면 흔들림', '피격·보스 등장 시 화면 흔들림')}
    ${T('dmgNum', '피해 숫자', '적에게 준 피해를 숫자로 표시')}
    ${V('sfx', '효과음 음량')}${V('bgm', '배경음 음량')}
    <div class="row"><div class="rt"><b>첫 판 안내</b><span>조작·목표 안내를 처음부터 다시 표시</span></div><button class="tg" id="s_guide">다시 보기</button></div>
    </div></div>`;
  on('s_guide', () => { guideReset(); const b = document.getElementById('s_guide'); if (b) { b.textContent = '초기화됨'; b.classList.add('pri'); } });
  UI.querySelectorAll('button.tg[data-k]').forEach(b => b.addEventListener('click', () => { const k = b.dataset.k; SETTINGS[k] = !SETTINGS[k]; saveSettings(); b.classList.toggle('on', SETTINGS[k]); b.setAttribute('aria-checked', SETTINGS[k]); sfx('ui'); }));   // 0.37 제자리 전환 (손잡이 이동)
  UI.querySelectorAll('input[data-v]').forEach(i => i.addEventListener('input', () => { SETTINGS[i.dataset.v] = +i.value; i.nextElementSibling.textContent = i.value; saveSettings(); auVol(); if (i.dataset.v === 'sfx') sfx('ui'); }));
  on('s_joy', () => { SETTINGS.joy = SETTINGS.joy === 'fixed' ? 'float' : 'fixed'; saveSettings(); keepScroll(() => showSettings(back)); });
  on('s_back', back);
}

/* ---------- 도감: codex.js (0.34 7탭·세부 수치·게임 중 열람) ---------- */

/* ---------- 도전 준비 (진엔딩 후) ---------- */
const PREP_TABS = [['t', '난이도'], ['c', '도전 조건']];
function showPrep(back, tab = 't') {
  const s = loadSave(), mx = Math.min(3, s.tierMax || 1);
  if (META.tier > mx) META.tier = mx;
  const o = { tier: META.tier, conds: META.conds };
  const bT = `<div class="rows">${TIERS.map((T, i) => `<button class="row pick ${META.tier === i ? 'on' : ''}" data-tier="${i}" ${i > mx ? 'disabled' : ''}><span class="rt"><b>${i > mx ? '잠김' : T.nm}</b><span>${i ? `적 체력·피해 +${Math.round(T.k * 100)}% · 배율 ×${T.mul}` : '기본 난이도 · 배율 ×1'}</span></span></button>`).join('')}</div><p class="hint">단계별 마왕 처치 시 다음 단계 개방</p>`;
  const bC = `<div class="rows">${COND_ORDER.map(k => { const C = CONDS[k], v = META.conds.includes(k); return `<div class="row"><div class="rt"><b>${C.nm}</b><span>${C.ds} · ×${C.mul}${(s.titles || []).includes('c_' + k) ? ' · 돌파' : ''}</span></div><button class="tg sw ${v ? 'on' : ''}" data-cond="${k}" role="switch" aria-checked="${v}" aria-label="${C.nm}"><i></i></button></div>`; }).join('')}</div>`;
  UI.innerHTML = `<div class="layer pg pager">${pgHead('도전 준비', 'pr_back', PREP_TABS, tab, 'data-ptab', `<p class="sub" id="pr_mul">점수 배율 ×${optMul(o).toFixed(2)} · 보상은 성능에 영향 없음</p>`)}
    ${pgPanes([['t', bT], ['c', bC]], tab, 'pgb')}<div class="pgf"><button class="pri" id="pr_go">이대로 시작</button></div></div>`;
  let cur = tab; uiPager(UI.querySelector('.layer'), PREP_TABS.map(t => t[0]), tab, k => { cur = k; });
  UI.querySelectorAll('[data-tier]').forEach(b => b.addEventListener('click', () => { META.tier = +b.dataset.tier; saveMeta(); sfx('ui'); keepScroll(() => showPrep(back, cur)); }));
  UI.querySelectorAll('[data-cond]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.cond, i = META.conds.indexOf(k);
    if (i >= 0) META.conds.splice(i, 1); else { META.conds.push(k); const ex = CONDS[k].ex; if (ex) META.conds = META.conds.filter(x => x !== ex); }
    saveMeta(); sfx('ui');
    UI.querySelectorAll('[data-cond]').forEach(x => { const v = META.conds.includes(x.dataset.cond); x.classList.toggle('on', v); x.setAttribute('aria-checked', v); });   // 0.37 제자리 전환
    const m = document.getElementById('pr_mul'); if (m) m.textContent = `점수 배율 ×${optMul({ tier: META.tier, conds: META.conds }).toFixed(2)} · 보상은 성능에 영향 없음`;
  }));
  on('pr_go', e => { uiSpark(e.currentTarget); startRun(); });
  on('pr_back', back);
}
