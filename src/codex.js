/* ============================================================
   도감 확장 (0.34, 표현·보강 단계) — 회차 35 요청 반영
   — 7탭: 무기 · 보조 효과 · 유물 · 직업 · 적 · 기록 조각 · 해금 현황
   — 전 항목 세부 수치 상시 표시 (펼치기 등 추가 기능 없음, 카드 크기 고정, 가로 스크롤 없음)
   — 미획득 항목: 흐림 표시 + '미획득' 표기 (무기·보조 효과·유물·직업은 내용 공개, 적·기록 조각은 기존 잠금 유지)
   — 게임 중 열람: 일시정지 화면 '도감' 버튼, 진행 중인 판의 획득분도 즉시 반영
   — 기록: 저장 데이터 seenW·seenE·seenJ(기존) + seenP(보조 효과)·seenR(유물) 추가
   ============================================================ */
const CODEX_TABS = [['w', '무기'], ['p', '보조 효과'], ['r', '유물'], ['j', '직업'], ['e', '적'], ['f', '기록 조각'], ['u', '해금 현황']];

/* 기본 수치 표기 순서·명칭 (밀쳐내기·투사체 속도 등 체감 어려운 항목 제외) */
const CX_STAT = [['dmg', '피해', v => Math.round(v)], ['cd', '재사용', v => v + '초'], ['n', '개수', v => v], ['pierce', '관통', v => v], ['range', '사거리', v => v], ['len', '길이', v => v], ['R', '범위', v => v],
  ['arc', '각도', v => Math.round(v * 57.3) + '°'], ['rot', '회전', v => v + '/초'], ['dur', '지속', v => v + '초'], ['tick', '타격 간격', v => v + '초'], ['life', '사거리 시간', v => v + '초'], ['max', '최대 설치', v => v], ['hitCd', '같은 적 타격 간격', v => v + '초']];
const CX_GK_PAT = {
  bargan: { p: '추격 돌진 · 강타 · 대지 균열 · 바위 투척', r: '연속 돌진 · 투기장 (벽·바위 충돌 시 기절)' },
  igna: { p: '원형 탄막 · 조준 부채꼴 · 화염 장판 · 화염 회오리 · 불기둥 격자', r: '작열하는 태양' },
  morden: { p: '망자 소환 · 뼈의 감옥 · 뼈 화살 · 망자 행렬 · 저주 표식', r: '망자의 무덤 (부수기 전까지 소환)' },
  seren: { p: '거울 분열 (본체만 주기적 미광) · 거울진 · 반사막', r: '위치 교환' },
};
const CX_DEMON = ['1페이즈 그림자 군주 (체력 100~60%): 낫 휘두르기 · 혼령 추적탄 · 그림자 도약 · 그림자 손', '2페이즈 암흑 결계 (60~25%): 수축 결계 · 회전 광선 3갈래 · 낫 휘두르기 · 탄막 파도', '3페이즈 종언 (25% 이하): 운석 연속 낙하 · 광선 4갈래 가속 · 추적탄 증가 · 분할 낙하'];
const CX_MB = { shoot: '거리를 두고 사격', split: '처치 시 작은 개체로 분열', bomb: '근접 시 예고 후 자폭', dash: '예고 후 직선 돌진', shield: '받는 피해 감소 (치명타·출혈은 무시)', weave: '좌우로 흔들리며 접근' };

/* 진행 중인 판 획득분 포함 기록 */
function cxSeen() {
  const s = loadSave(), out = {};
  for (const k of ['seenW', 'seenP', 'seenR', 'seenJ', 'seenE']) out[k] = new Set(s[k] || []);
  if (G && G.p && !G.result && STATE.mode !== 'title') {
    for (const w of G.p.weapons) out.seenW.add(w.id);
    for (const x of G.p.passives) out.seenP.add(x.id);
    for (const r of G.p.relics || []) out.seenR.add(r);
    if (G.p.job) out.seenJ.add(G.p.job);
    for (const k in (G.stats && G.stats.kt) || {}) out.seenE.add(k);
  }
  return { s, ...out };
}

/* 카드: dim = 미획득 흐림(내용 공개), lock = 잠금(내용 비공개) */
function cxCard(o) {
  const st = o.lock ? 'lock' : o.dim ? 'dim' : '';
  const lines = o.lock ? `<p>${esc(o.hint || '')}</p>` : (o.lines || []).filter(Boolean).map(l => `<p>${l}</p>`).join('');
  return `<div class="cx ${st}"><span class="ic" style="background:${o.lock ? 'var(--panel2)' : o.col}">${esc(o.lock ? '?' : o.ic)}</span><div class="cxb"><div class="cxh"><b>${esc(o.lock ? '???' : o.nm)}</b>${o.tag ? `<span class="tag">${esc(o.tag)}</span>` : ''}${o.dim ? '<span class="tag nw">미획득</span>' : ''}</div>${lines}</div></div>`;
}
const cxL = (k, v) => `<i>${esc(k)}</i> ${esc(v)}`;

function cxWeapon(id, seen) {
  const D = WEAPONS[id], B = D.base, tot = { dmg: 0, area: 0, cd: 0, n: 0, pierce: 0 };
  for (const u of D.ups) for (const k in u) if (k in tot) tot[k] += u[k];
  const base = CX_STAT.filter(([k]) => B[k] != null).map(([k, nm, f]) => `${id === 'boomerang' && k === 'pierce' ? '구간 타격 수' : nm} ${f(B[k])}`).join(' · ');
  const six = [`피해 ${Math.round(B.dmg * (1 + tot.dmg))}`, B.cd ? `재사용 ${(B.cd * (1 - tot.cd)).toFixed(2)}초` : '', tot.n ? `개수 ${(B.n || 1) + tot.n}` : '', tot.area ? `범위 +${Math.round(tot.area * 100)}%` : '', tot.pierce ? `관통 ${(B.pierce || 0) + tot.pierce}` : ''].filter(Boolean).join(' · ');
  const br = (BRANCHES[id] || []).map(b => `${b.nm}(${b.ds})`).join(' / ');
  return cxCard({ dim: !seen, col: CFG.colors[D.cat], ic: D.ic, nm: D.name, tag: CAT_NAME[D.cat], lines: [esc(D.desc), cxL('1레벨', base), cxL('강화', D.ups.map((u, i) => `${i + 2}렙 ${upText(id, u)}`).join(' · ')), cxL('6레벨', six + ' (보조 효과 제외)'), br ? cxL(BRANCH_AT + '렙 분기', br) : ''] });
}
function cxPassive(id, seen) {
  const D = PASSIVES[id], br = (BRANCHES[id] || []).map(b => `${b.nm}(${b.ds})`).join(' / ');
  return cxCard({ dim: !seen, col: '#8fd0ff', ic: D.ic, nm: D.name, tag: '보조 효과', lines: [cxL('단계별', [1, 2, 3, 4, 5].map(L => `${L}단계 ${D.desc(L)}`).join(' · ')), br ? cxL(BRANCH_AT + '단계 분기', br) : ''] });
}
function cxRelic(id, seen) {
  const R = RELICS[id];
  return cxCard({ dim: !seen, col: '#ffd27a', ic: R.ic, nm: R.name, tag: '유물', lines: [cxL('재료', `${itemName(R.a)} + ${itemName(R.b)} 보유 시 후보 등장`), cxL('효과', R.ds)] });
}
function cxJob(id, seen) {
  const J = JOBS[id], U = ULT_TXT[id], X = JOB_WX[id], E1 = EXW1[id], E2 = EXW[id];
  const cats = jobCats(id).map(c => CAT_NAME[c]).join('·');
  const j2 = JOB2[id].map(o => cxL('2차 ' + o.nm, o.ds));
  return cxCard({ dim: !seen, col: JOB_COL[id], ic: J.ic, nm: J.name, tag: cats + ' 계열', lines: [cxL('고유 규칙', J.rule), cxL('궁극기', `${U[0]}: ${U[1]}`), cxL('계열 무기 변환', `'${X.pre}' 접두어 · ${X.ds} · 계열 무기 피해 +10%`), cxL('전용 무기', `1차 ${E1.name}(${E1.ds}, 피해 ${E1.dmg}) · 2차 ${E2.name}(${E2.ds}, 피해 ${E2.dmg})`), ...j2, cxL('2차 ' + JOB2_STAT.nm, JOB2_STAT.ds)] });
}
function cxEnemies(S) {
  const mob = ENEMY_ORDER.map(k => { const E = ENEMIES[k], v = S.seenE.has(k); return cxCard({ lock: !v, hint: '조우 시 기록', col: E.color, ic: E.name.slice(0, 1), nm: E.name, tag: '잡몹', lines: [cxL('능력치', `체력 ${E.hp} · 이동 ${E.speed} · 접촉 피해 ${E.dmg} · 경험치 ${E.xp}`), cxL('등장', `${E.from}분 이후`) + (E.mb ? ' · ' + esc(CX_MB[E.mb] || '') : '')] }); });
  const gk = GK_ORDER.map(k => { const D = GATEKEEPERS[k], v = S.s.metGk && S.s.metGk.includes(k) || (S.s.gates || []).includes(k); return cxCard({ lock: !v, hint: '조우 시 기록', col: D.color, ic: D.name.slice(0, 1), nm: D.name, tag: '사문의 수문장 · ' + D.gate, lines: [cxL('특징', D.ds + ` · 이동 ${D.speed}`), cxL('패턴', CX_GK_PAT[k].p), cxL('격노(체력 50%)', CX_GK_PAT[k].r + ' · 패턴 간격 단축'), cxL('면역', '시간 정지·빙결(둔화 0.3배)·밀쳐내기')] }); });
  const dv = !!(S.s.metDemon || S.s.demonTries);
  const dm = cxCard({ lock: !dv, hint: '조우 시 기록', col: DEMON.color, ic: '마', nm: DEMON.name, tag: '마왕성의 주인', lines: CX_DEMON.map(t => esc(t)).concat([cxL('전환', '공격 정지 연출 (피해는 받음) · 체력 0 즉시 처치')]) });
  const el = cxCard({ col: '#ffd24a', ic: '정', nm: '엘리트', tag: '잡몹 강화형', lines: [cxL('능력치', `크기 ${ELITE.size}배 · 체력 ${ELITE.hp}배 · 경험치 ${ELITE.xp}배`), cxL('특수 능력 1종', ELITE.ab.map(a => ELITE_AB[a]).join(' · ')), cxL('출현', `페이즈당 ${ELITE.perPhase.join('~')}회 · 처치 시 보물 상자`)] });
  return mob.join('') + el + '<h3>보스</h3>' + gk.join('') + dm;
}
function cxUnlock(S) {
  const s = S.s, n = a => (s[a] || []).length, titles = s.titles || [], ce = ENEMY_ORDER.length + GK_ORDER.length + 1;
  const eSeen = ENEMY_ORDER.filter(k => S.seenE.has(k)).length + GK_ORDER.filter(k => (s.metGk || []).includes(k) || (s.gates || []).includes(k)).length + (s.metDemon || s.demonTries ? 1 : 0);
  return `<div class="stats">
    <span>플레이</span><span>${s.runs || 0}판</span><span>돌파</span><span>${s.clears || 0}회</span><span>열린 문</span><span>${n('gates')}/4</span>
    <span>마왕 처치</span><span>${s.demonKills || 0}회</span><span>기록 조각</span><span>${n('frags')}/${FRAG_N}</span>
    <span>무기</span><span>${WEAPON_ORDER.filter(id => S.seenW.has(id)).length}/${WEAPON_ORDER.length}</span><span>보조 효과</span><span>${PASSIVE_ORDER.filter(id => S.seenP.has(id)).length}/${PASSIVE_ORDER.length}</span>
    <span>유물</span><span>${RELIC_ORDER.filter(id => S.seenR.has(id)).length}/${RELIC_ORDER.length}</span><span>직업</span><span>${JOB_ORDER.filter(id => S.seenJ.has(id)).length}/${JOB_ORDER.length}</span>
    <span>적</span><span>${eSeen}/${ce}</span>
    <span>진엔딩</span><span>${s.trueEnd ? '달성' : '-'}</span><span>최고 점수</span><span>${s.bestScore || 0}</span><span>최고 단계</span><span>${s.trueEnd ? TIERS[Math.min(3, s.tierMax || 1)].nm + ' 개방' : '-'}</span></div>
    <h3>칭호</h3><div class="chips">${titles.length ? `<button class="chipb ${!s.title ? 'pri' : ''}" data-t="">없음</button>` + titles.map(t => `<button class="chipb ${s.title === t ? 'pri' : ''}" data-t="${t}">${esc(TITLES[t])}</button>`).join('') : '<p class="hint">진엔딩·고난도·도전 조건 첫 돌파 시 해금</p>'}</div>
    <h3>주인공 색상</h3><div class="chips">${COLORS.map(C => { const v = colorOpen(s, C); return `<button class="chipb ${(s.color || 'base') === C.id ? 'pri' : ''}" data-c="${C.id}" ${v ? '' : 'disabled'}><i style="background:${C.c}"></i>${v ? C.nm : '잠김'}</button>`; }).join('')}</div>`;
}

function showCodex(tab, back) {
  const S = cxSeen(); let body = '';
  if (tab === 'w') body = WEAPON_ORDER.map(id => cxWeapon(id, S.seenW.has(id))).join('');
  if (tab === 'p') body = PASSIVE_ORDER.map(id => cxPassive(id, S.seenP.has(id))).join('') + '<h3>숙련 특성</h3><p class="hint">무기·보조 효과 전부 최대 후 등장, 종류별 1회</p>' + TRAIT_ORDER.map(k => cxCard({ col: '#c8c0ff', ic: TRAITS[k].ic, nm: TRAITS[k].nm, lines: [esc(TRAITS[k].ds)] })).join('');
  if (tab === 'r') body = RELIC_ORDER.map(id => cxRelic(id, S.seenR.has(id))).join('');
  if (tab === 'j') body = JOB_ORDER.map(id => cxJob(id, S.seenJ.has(id))).join('');
  if (tab === 'e') body = cxEnemies(S);
  if (tab === 'f') body = FRAGS.map((f, i) => { const v = (S.s.frags || []).includes(f.id); return cxCard({ lock: !v, hint: '해금 조건 · ' + f.cond, col: '#e8d8ff', ic: String(i + 1), nm: f.nm, lines: [esc(f.tx)] }); }).join('');
  if (tab === 'u') body = cxUnlock(S);
  UI.innerHTML = `<div class="layer scroll"><h2>도감</h2>
    <div class="tabs cxt">${CODEX_TABS.map(([k, nm]) => `<button class="${tab === k ? 'pri' : ''}" data-tab="${k}">${nm}</button>`).join('')}</div>
    <div class="cxl">${body}</div><div class="menu"><button id="cx_back">돌아가기</button></div></div>`;
  UI.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { showCodex(b.dataset.tab, back); const L = UI.querySelector('.layer'); if (L) L.scrollTop = 0; }));
  const setS = (k, v) => { const x = loadSave(); x[k] = v; try { localStorage.setItem(CFG.SAVE_KEY, JSON.stringify(x)); } catch (e) { } saveCache = null; keepScroll(() => showCodex('u', back)); };
  UI.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => setS('title', b.dataset.t || null)));
  UI.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => setS('color', b.dataset.c)));
  on('cx_back', back);
}
