/* ============================================================
   메뉴·메타 진행 — 설정 8종(0.14) · 도감 4탭(0.14) · 고난도 3단계·도전 조건 6종·판 점수·칭호·색상 변형(0.15)
   4단계 결정 안건 2·3: 진엔딩 후 고난도 1단계부터 해금, 단계 k 마왕 처치 시 k+1 해금
   보상은 성능 영향 없음(판 점수 배율·칭호·주인공 색상), 배율·강화 수치는 초기값 (5단계 시험으로 확정)
   ============================================================ */
/* ---------- 설정 (기기 저장) ---------- */
const SET_DEF = { autoUlt: false, joy: 'float', confirm2: false, sfx: 80, bgm: 60, vibe: true, shake: true, dlgAuto: false, dmgNum: false };
const SETTINGS = (() => { try { return Object.assign({}, SET_DEF, JSON.parse(localStorage.getItem(CFG.SAVE_KEY + '_set') || '{}')); } catch (e) { return Object.assign({}, SET_DEF); } })();
function saveSettings() { try { localStorage.setItem(CFG.SAVE_KEY + '_set', JSON.stringify(SETTINGS)); } catch (e) { } }
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
  add('seenW', G.p.weapons.map(w => w.id)); add('seenE', Object.keys(G.stats.kt)); add('seenJ', [G.p.job]);
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
  const T = (k, nm, ds) => `<div class="row"><div class="rt"><b>${nm}</b><span>${ds}</span></div><button class="tg ${SETTINGS[k] ? 'pri' : ''}" data-k="${k}">${SETTINGS[k] ? '켜짐' : '꺼짐'}</button></div>`;
  const V = (k, nm) => `<div class="row"><div class="rt"><b>${nm}</b><span>0~100</span></div><input type="range" min="0" max="100" step="10" value="${SETTINGS[k]}" data-v="${k}" aria-label="${nm}"><output>${SETTINGS[k]}</output></div>`;
  UI.innerHTML = `<div class="layer scroll"><h2>설정</h2><div class="rows">
    <div class="row"><div class="rt"><b>조이스틱</b><span>${SETTINGS.joy === 'fixed' ? '고정형: 화면 아래 중앙 기준' : '유동형: 처음 누른 위치 기준'}</span></div><button class="tg" id="s_joy">${SETTINGS.joy === 'fixed' ? '고정형' : '유동형'}</button></div>
    ${T('autoUlt', '궁극기 자동 발동', '꺼짐: 손을 떼고 잠시 멈춰 발동 · 켜짐: 적이 몰리면 자동')}
    ${T('confirm2', '두 번 눌러 확정', '선택 카드를 한 번 더 눌러야 선택')}
    ${T('dlgAuto', '대사 자동 넘김', '대사가 끝나면 잠시 후 다음 줄로')}
    ${T('vibe', '진동', '피격·보스 등장 시 짧은 진동')}
    ${T('shake', '화면 흔들림', '피격·보스 등장 시 화면 흔들림')}
    ${T('dmgNum', '피해 숫자', '적에게 준 피해를 숫자로 표시')}
    ${V('sfx', '효과음 음량')}${V('bgm', '배경음 음량')}
    </div><div class="menu"><button id="s_back">돌아가기</button></div></div>`;
  UI.querySelectorAll('button.tg[data-k]').forEach(b => b.addEventListener('click', () => { const k = b.dataset.k; SETTINGS[k] = !SETTINGS[k]; saveSettings(); showSettings(back); }));
  UI.querySelectorAll('input[data-v]').forEach(i => i.addEventListener('input', () => { SETTINGS[i.dataset.v] = +i.value; i.nextElementSibling.textContent = i.value; saveSettings(); auVol(); if (i.dataset.v === 'sfx') sfx('ui'); }));
  on('s_joy', () => { SETTINGS.joy = SETTINGS.joy === 'fixed' ? 'float' : 'fixed'; saveSettings(); showSettings(back); });
  on('s_back', back);
}

/* ---------- 도감 (무기·적·기록 조각·해금 현황) ---------- */
const CODEX_TABS = [['w', '무기'], ['e', '적'], ['f', '기록 조각'], ['u', '해금 현황']];
function codexEnemies() {
  return ENEMY_ORDER.map(k => ({ id: k, nm: ENEMIES[k].name, ds: `체력 ${ENEMIES[k].hp} · 속도 ${ENEMIES[k].speed}`, col: ENEMIES[k].color, seen: s => (s.seenE || []).includes(k) }))
    .concat(GK_ORDER.map(k => ({ id: k, nm: GATEKEEPERS[k].name, ds: `사문의 수문장 · ${GATEKEEPERS[k].gate} · ${GATEKEEPERS[k].ds}`, col: GATEKEEPERS[k].color, seen: s => (s.metGk || []).includes(k) || (s.gates || []).includes(k) })))
    .concat([{ id: 'demon', nm: DEMON.name, ds: '마왕성의 주인 · 그림자 군주 → 암흑 결계 → 종언', col: DEMON.color, seen: s => !!(s.metDemon || s.demonTries) }]);
}
function showCodex(tab, back) {
  const s = loadSave(); let body = '';
  const item = (seen, col, ic, nm, tag, ds) => `<div class="cx ${seen ? '' : 'lock'}"><span class="ic" style="background:${seen ? col : 'var(--panel2)'}">${esc(seen ? ic : '?')}</span><div><b>${esc(seen ? nm : '???')}</b>${tag ? `<span class="tag">${esc(tag)}</span>` : ''}<p>${esc(ds)}</p></div></div>`;
  if (tab === 'w') body = WEAPON_ORDER.map(id => { const d = WEAPONS[id], v = (s.seenW || []).includes(id); return item(v, CFG.colors[d.cat], d.ic, d.name, CAT_NAME[d.cat], v ? d.desc : '획득 시 기록'); }).join('');
  if (tab === 'e') body = codexEnemies().map(x => { const v = x.seen(s); return item(v, x.col, x.nm.slice(0, 1), x.nm, '', v ? x.ds : '조우 시 기록'); }).join('');
  if (tab === 'f') body = FRAGS.map((f, i) => { const v = (s.frags || []).includes(f.id); return item(v, '#e8d8ff', String(i + 1), f.nm, '', v ? f.tx : '해금 조건 · ' + f.cond); }).join('');
  if (tab === 'u') {
    const n = (a) => (s[a] || []).length, ce = codexEnemies(), titles = s.titles || [];
    body = `<div class="stats">
      <span>플레이</span><span>${s.runs || 0}판</span><span>돌파</span><span>${s.clears || 0}회</span><span>열린 문</span><span>${n('gates')}/4</span>
      <span>마왕 처치</span><span>${s.demonKills || 0}회</span><span>기록 조각</span><span>${n('frags')}/${FRAG_N}</span><span>무기 도감</span><span>${WEAPON_ORDER.filter(id => (s.seenW || []).includes(id)).length}/${WEAPON_ORDER.length}</span>
      <span>적 도감</span><span>${ce.filter(x => x.seen(s)).length}/${ce.length}</span><span>경험한 직업</span><span>${n('seenJ')}/${JOB_ORDER.length}</span>
      <span>진엔딩</span><span>${s.trueEnd ? '달성' : '-'}</span><span>최고 점수</span><span>${s.bestScore || 0}</span><span>최고 단계</span><span>${s.trueEnd ? TIERS[Math.min(3, s.tierMax || 1)].nm + ' 개방' : '-'}</span></div>
      <h3>칭호</h3><div class="chips">${titles.length ? `<button class="chipb ${!s.title ? 'pri' : ''}" data-t="">없음</button>` + titles.map(t => `<button class="chipb ${s.title === t ? 'pri' : ''}" data-t="${t}">${esc(TITLES[t])}</button>`).join('') : '<p class="hint">진엔딩·고난도·도전 조건 첫 돌파 시 해금</p>'}</div>
      <h3>주인공 색상</h3><div class="chips">${COLORS.map(C => { const v = colorOpen(s, C); return `<button class="chipb ${(s.color || 'base') === C.id ? 'pri' : ''}" data-c="${C.id}" ${v ? '' : 'disabled'}><i style="background:${C.c}"></i>${v ? C.nm : '잠김'}</button>`; }).join('')}</div>`;
  }
  UI.innerHTML = `<div class="layer scroll"><h2>도감</h2>
    <div class="tabs">${CODEX_TABS.map(([k, nm]) => `<button class="${tab === k ? 'pri' : ''}" data-tab="${k}">${nm}</button>`).join('')}</div>
    <div class="cxl">${body}</div><div class="menu"><button id="cx_back">돌아가기</button></div></div>`;
  UI.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => showCodex(b.dataset.tab, back)));
  const setS = (k, v) => { const x = loadSave(); x[k] = v; try { localStorage.setItem(CFG.SAVE_KEY, JSON.stringify(x)); } catch (e) { } saveCache = null; showCodex('u', back); };
  UI.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => setS('title', b.dataset.t || null)));
  UI.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => setS('color', b.dataset.c)));
  on('cx_back', back);
}

/* ---------- 도전 준비 (진엔딩 후) ---------- */
function showPrep(back) {
  const s = loadSave(), mx = Math.min(3, s.tierMax || 1);
  if (META.tier > mx) META.tier = mx;
  const o = { tier: META.tier, conds: META.conds };
  UI.innerHTML = `<div class="layer scroll"><h2>도전 준비</h2><p class="sub">점수 배율 ×${optMul(o).toFixed(2)} · 보상은 성능에 영향 없음</p>
    <h3>고난도 단계</h3><div class="tabs">${TIERS.map((T, i) => `<button class="${META.tier === i ? 'pri' : ''}" data-tier="${i}" ${i > mx ? 'disabled' : ''}>${i > mx ? '잠김' : T.nm}</button>`).join('')}</div>
    <p class="hint">${META.tier ? `적 체력·피해 +${Math.round(TIERS[META.tier].k * 100)}% · 배율 ×${TIERS[META.tier].mul}` : '기본 난이도'} · 단계별 마왕 처치 시 다음 단계 개방</p>
    <h3>도전 조건</h3><div class="rows">${COND_ORDER.map(k => { const C = CONDS[k], v = META.conds.includes(k); return `<div class="row"><div class="rt"><b>${C.nm}</b><span>${C.ds} · ×${C.mul}${(s.titles || []).includes('c_' + k) ? ' · 돌파' : ''}</span></div><button class="tg ${v ? 'pri' : ''}" data-cond="${k}">${v ? '켜짐' : '꺼짐'}</button></div>`; }).join('')}</div>
    <div class="menu"><button class="pri" id="pr_go">이대로 시작</button><button id="pr_back">돌아가기</button></div></div>`;
  UI.querySelectorAll('[data-tier]').forEach(b => b.addEventListener('click', () => { META.tier = +b.dataset.tier; saveMeta(); showPrep(back); }));
  UI.querySelectorAll('[data-cond]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.cond, i = META.conds.indexOf(k);
    if (i >= 0) META.conds.splice(i, 1); else { META.conds.push(k); const ex = CONDS[k].ex; if (ex) META.conds = META.conds.filter(x => x !== ex); }
    saveMeta(); showPrep(back);
  }));
  on('pr_go', startRun);
  on('pr_back', back);
}
