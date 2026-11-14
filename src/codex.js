/* ============================================================
   도감 확장 (0.34, 표현·보강 단계) — 회차 35 요청 반영
   — 7탭: 무기 · 보조 효과 · 유물 · 직업 · 적 · 기록 조각 · 해금 현황
   — 전 항목 세부 수치 상시 표시 (펼치기 등 추가 기능 없음, 카드 크기 고정, 가로 스크롤 없음)
   — 미획득 항목: 흐림 표시 + '미획득' 표기 (무기·보조 효과·유물·직업은 내용 공개, 적·기록 조각은 기존 잠금 유지)
   — 게임 중 열람: 일시정지 화면 '도감' 버튼, 진행 중인 판의 획득분도 즉시 반영
   — 기록: 저장 데이터 seenW·seenE·seenJ(기존) + seenP(보조 효과)·seenR(유물) 추가
   ============================================================ */
const CODEX_TABS = [['w', '무기'], ['p', '보조'], ['x', '연성'], ['j', '직업'], ['e', '적'], ['f', '조각'], ['u', '해금']];   // 0.37 한 줄 탭 (짧은 이름)

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
  const L = o.lock ? [esc(o.hint || '')] : (o.lines || []).filter(Boolean), wrap = l => l.startsWith('<div') || l.startsWith('<details') ? l : `<p>${l}</p>`;
  const ic = o.lock ? '<span class="ic" style="background:var(--panel2)">?</span>' : o.portrait ? cxEnemyPortrait(o) : o.trait ? uiTraitIcon(o.trait, o.col) : o.fuse ? uiFuseCrest(o.fuse) : o.trial ? uiTrialCrest(o.trial) : o.job ? uiJobCrest(o.job) : icBox(o.col, o.ic, o.id);
  return `<div class="cx ${st}"><div class="cxt">${ic}<div class="cxb"><div class="cxh"><b>${esc(o.lock ? '???' : o.nm)}</b>${o.tag ? `<span class="tag">${esc(o.tag)}</span>` : ''}${o.dim ? '<span class="tag nw">미획득</span>' : ''}</div>${L.length ? wrap(L[0]) : ''}</div></div>${L.slice(1).map(wrap).join('')}</div>`;
}
const cxL = (k, v) => `<i>${esc(k)}</i> ${esc(v)}`;
/* 0.36 압축 표기: 수치 칩(1레벨→5레벨, 0.43) · 분기 2칸 상자 */
const cxChips = a => `<div class="cxs">${a.filter(Boolean).map(([k, v]) => `<span><i>${esc(k)}</i>${v}</span>`).join('')}</div>`;
const cxArrow = (a, b, u = '') => a === b ? `${a}${u}` : `${a}<em>→${b}${u}</em>`;
const cxBr = (list, head, art) => list && list.length ? `<details class="acc"><summary>${esc(head || '분기')} ${list.length}종</summary><div class="cxg">${list.map(o => `<div>${art ? art(o) : ''}<b>${esc(o.nm)}</b><span>${esc(o.ds).replace(' · 궁극기: ', '</span><span class="u">궁극기 · ')}</span></div>`).join('')}</div></details>` : '';
const cxRound = v => Math.round(v * 100) / 100;

function cxWeapon(id, seen) {
  const D = WEAPONS[id], B = D.base, tot = { dmg: 0, area: 0, cd: 0, n: 0, pierce: 0 }, etc = {};
  for (const u of D.ups) for (const k in u) { if (k in tot) tot[k] += u[k]; else etc[k] = (etc[k] || 0) + u[k]; }
  const rk = ['R', 'range', 'len'].find(k => B[k] != null);
  const chips = [
    ['피해', cxArrow(Math.round(B.dmg), Math.round(B.dmg * (1 + tot.dmg)))],
    B.cd ? ['재사용', cxArrow(cxRound(B.cd), cxRound(B.cd * (1 - tot.cd)), '초')] : null,
    (B.n || tot.n) ? [W_UNIT[id] || '개수', cxArrow(B.n || 1, (B.n || 1) + tot.n)] : null,
    (B.pierce || tot.pierce) ? [id === 'boomerang' ? '타격 수' : '관통', cxArrow(B.pierce || 0, (B.pierce || 0) + tot.pierce)] : null,
    rk ? [{ R: '범위', range: '사거리', len: '길이' }[rk], `${B[rk]}${tot.area ? `<em>+${Math.round(tot.area * 100)}%</em>` : ''}`] : null,
    B.dur ? ['지속', B.dur + '초'] : null,
    ...Object.keys(etc).map(k => { const t = upText(id, { [k]: etc[k] }); const m = t.match(/^(.*?) ([+-].*)$/); return m ? [m[1], `<em>${esc(m[2])}</em>`] : null; }),
  ];
  const branchIcon = o => {
    const art = branchWeaponArt(id, o.k);
    return art === id ? '' : icBox(CFG.colors[D.cat], D.ic, art, 'cx-branch-icon');
  };
  return cxCard({ dim: !seen, id, col: CFG.colors[D.cat], ic: D.ic, nm: D.name, tag: CAT_NAME[D.cat], lines: [esc(D.desc), cxChips(chips), cxBr(BRANCHES[id], '3렙 분기', branchIcon), cxBr(AWAKEN[id], '5렙 각성')] });
}
/* 보조 효과: 1단계·5단계 문구의 수치만 화살표로 병합 */
function cxRange(a, b) {
  const re = /([+-]?\d+(?:\.\d+)?%?)/, A = a.split(re), Bs = b.split(re);
  if (A.length !== Bs.length) return esc(a) + ' <em>→ ' + esc(b) + '</em>';
  return A.map((t, i) => i % 2 && t !== Bs[i] ? `${esc(t)}<em>→${esc(Bs[i])}</em>` : esc(t)).join('');
}
function cxPassive(id, seen) {
  const D = PASSIVES[id];
  return cxCard({ dim: !seen, id, col: CFG.colors.passive, ic: D.ic, nm: D.name, tag: '1→5단계', lines: [cxRange(D.desc(1), D.desc(5)), cxBr(BRANCHES[id], '3단계 분기')] });
}
const cxMat = id => `<span class="cxm">${icBox(WEAPONS[id] ? CFG.colors[WEAPONS[id].cat] : CFG.colors.passive, (WEAPONS[id] || PASSIVES[id]).ic, id, 'sm')}${esc(itemName(id))}</span>`;
function cxRelic(id, seen) {
  const R = RELICS[id];
  return cxCard({ dim: !seen, col: '#ffd27a', ic: R.ic, nm: R.name, tag: '유물', lines: [`<div class="cxr">${cxMat(R.a)}<b>+</b>${cxMat(R.b)}</div>`, esc(R.ds)] });
}
function cxJob2(id) {
  return `<details class="acc"><summary>2차 전직 ${JOB2[id].length}종</summary><div class="cxg">${JOB2[id].map(o => `<div>${uiJob2Crest(id,o.k,'sm')}<b>${esc(o.nm)}</b><span>${esc(o.ds).replace(' · 궁극기: ', '</span><span class="u">궁극기 · ')}</span></div>`).join('')}</div></details>`;
}
function cxJob(id, seen) {
  const J = JOBS[id], U = ULT_TXT[id], X = JOB_WX[id];
  return cxCard({ dim: !seen, job: id, col: JOB_COL[id], ic: J.ic, nm: J.name, tag: X.tag, lines: [`<b>${esc(JOB_SHORT[id])}</b>`, cxChips([['궁극기', esc(U[0])], ['연성', esc(X.pre)]]),
    `<details class="acc"><summary>상세</summary><div class="cxg"><div><b>핵심 규칙</b><span>${esc(J.rule)}</span></div><div><b>궁극기 ${esc(U[0])}</b><span>${esc(U[1])}</span></div><div><b>연성 · ${esc(X.pre)}</b><span>${esc(X.ds)}</span></div></div></details>`, cxJob2(id)] });
}
function cxFuse() {
  const types = Object.entries(FZ_TYPES).map(([k, T]) => cxCard({ fuse: T[1], col: '#ffd27a', ic: T[0].slice(0, 1), nm: T[0], tag: k, lines: [`<b>${esc(T[2])}</b>`] })).join('');
  const jobs = JOB_ORDER.map(id => { const T = FZ_TRIAL[id], W = WEAPONS[FZ_SYMBOL[id]];
    return cxCard({ trial: id, col: JOB_COL[id], ic: JOBS[id].ic, nm: JOBS[id].name, tag: T.nm, lines: [`<b>${esc(T.ds)}</b>`, cxChips([['상징 무기', esc(W.name)], ['연성', esc(FZ_JOB[id])]]), `<details class="acc"><summary>상징 무기 효과</summary><div class="cxg"><div><b>${esc(W.name)}</b><span>${esc(FZ_SYM_TX[id])}</span></div></div></details>`] }); }).join('');
  return '<p class="hint">직업 시련 완수 시 Lv 6 무기 2종을 합침 · 판당 최대 2회 · 부품 무기는 슬롯을 차지하지 않음</p>' + types + '<h3>직업별 시련·연성</h3>' + jobs;
}
function cxEnemyPortrait(o) {
  const src = CODEX_PORTRAITS[o.portrait];
  if (!src) return icBox(o.col, o.ic);
  return `<span class="ic cx-portrait" style="--portrait-accent:${o.col}" aria-hidden="true"><i hidden>${esc(o.ic)}</i><img data-enemy-portrait="${esc(o.portrait)}" src="${src}" width="40" height="40" alt="" onerror="this.hidden=true;this.previousElementSibling.hidden=false"></span>`;
}

function cxEnemies(S) {
  const mob = ENEMY_ORDER.map(k => { const E = ENEMIES[k], v = S.seenE.has(k); return cxCard({ lock: !v, portrait: k, hint: '조우 시 기록', col: E.color, ic: E.name.slice(0, 1), nm: E.name, tag: '잡몹', lines: [cxL('능력치', `체력 ${E.hp} · 이동 ${E.speed} · 접촉 피해 ${E.dmg} · 경험치 ${E.xp}`), cxL('등장', `${E.from}분 이후`) + (E.mb ? ' · ' + esc(CX_MB[E.mb] || '') : '')] }); });
  const gk = GK_ORDER.map(k => { const D = GATEKEEPERS[k], v = S.s.metGk && S.s.metGk.includes(k) || (S.s.gates || []).includes(k); return cxCard({ lock: !v, portrait: k, hint: '조우 시 기록', col: D.color, ic: D.name.slice(0, 1), nm: D.name, tag: '사문의 수문장 · ' + D.gate, lines: [cxL('특징', D.ds + ` · 이동 ${D.speed}`), cxL('패턴', CX_GK_PAT[k].p), cxL('격노(체력 50%)', CX_GK_PAT[k].r + ' · 패턴 간격 단축'), cxL('면역', '시간 정지·빙결(둔화 0.3배)·밀쳐내기')] }); });
  const dv = !!(S.s.metDemon || S.s.demonTries);
  const dm = cxCard({ lock: !dv, portrait: 'demon', hint: '조우 시 기록', col: DEMON.color, ic: '마', nm: DEMON.name, tag: '마왕성의 주인', lines: CX_DEMON.map(t => esc(t)).concat([cxL('전환', '공격 정지 연출 (피해는 받음) · 체력 0 즉시 처치')]) });
  const el = cxCard({ col: '#ffd24a', ic: '정', nm: '엘리트', tag: '잡몹 강화형', lines: [cxL('능력치', `크기 ${ELITE.size}배 · 체력 ${ELITE.hp}배 · 경험치 ${ELITE.xp}배`), cxL('특수 능력 1종', ELITE.ab.map(a => ELITE_AB[a]).join(' · ')), cxL('출현', `페이즈당 ${ELITE.perPhase.join('~')}회 · 처치 시 보물 상자`)] });
  return mob.join('') + el + '<h3>보스</h3>' + gk.join('') + dm;
}
function cxUnlock(S) {
  const s = S.s, n = a => (s[a] || []).length, titles = s.titles || [], ce = ENEMY_ORDER.length + GK_ORDER.length + 1;
  const eSeen = ENEMY_ORDER.filter(k => S.seenE.has(k)).length + GK_ORDER.filter(k => (s.metGk || []).includes(k) || (s.gates || []).includes(k)).length + (s.metDemon || s.demonTries ? 1 : 0);
  return `<div class="stats">
    <span>플레이</span><span>${s.runs || 0}판</span><span>돌파</span><span>${s.clears || 0}회</span><span>최고 생존</span><span>${s.bestTime ? fmtTime(s.bestTime) : '-'}</span><span>열린 문</span><span>${n('gates')}/4</span>
    <span>마왕 처치</span><span>${s.demonKills || 0}회</span><span>기록 조각</span><span>${n('frags')}/${FRAG_N}</span>
    <span>무기</span><span>${WEAPON_ORDER.filter(id => S.seenW.has(id)).length}/${WEAPON_ORDER.length}</span><span>보조 효과</span><span>${PASSIVE_ORDER.filter(id => S.seenP.has(id)).length}/${PASSIVE_ORDER.length}</span>
    <span>직업</span><span>${JOB_ORDER.filter(id => S.seenJ.has(id)).length}/${JOB_ORDER.length}</span>
    <span>적</span><span>${eSeen}/${ce}</span>
    <span>진엔딩</span><span>${s.trueEnd ? '달성' : '-'}</span><span>최고 점수</span><span>${s.bestScore || 0}</span><span>최고 단계</span><span>${s.trueEnd ? TIERS[Math.min(3, s.tierMax || 1)].nm + ' 개방' : '-'}</span></div>
    <h3>칭호</h3><div class="chips">${titles.length ? `<button class="chipb ${!s.title ? 'pri' : ''}" data-t="">없음</button>` + titles.map(t => `<button class="chipb ${s.title === t ? 'pri' : ''}" data-t="${t}">${esc(TITLES[t])}</button>`).join('') : '<p class="hint">진엔딩·고난도·도전 조건 첫 돌파 시 해금</p>'}</div>
    <h3>주인공 색상</h3><div class="chips">${COLORS.map(C => { const v = colorOpen(s, C); return `<button class="chipb ${(s.color || 'base') === C.id ? 'pri' : ''}" data-c="${C.id}" ${v ? '' : 'disabled'}><i style="background:${C.c}"></i>${v ? C.nm : '잠김'}</button>`; }).join('')}</div>`;
}

function showCodex(tab, back) {
  const S = cxSeen(), K = CODEX_TABS.map(t => t[0]);
  const bodyOf = t => {
    if (t === 'w') return '<p class="hint">수치: 1레벨 → 5레벨 (보조 효과 미포함) · 분기는 눌러서 펼침</p>' + WEAPON_ORDER.map(id => cxWeapon(id, S.seenW.has(id))).join('');
    if (t === 'p') return '<p class="hint">수치: 1단계 → 5단계 · 분기는 눌러서 펼침</p>' + PASSIVE_ORDER.map(id => cxPassive(id, S.seenP.has(id))).join('') + '<h3>숙련 특성</h3><p class="hint">무기·보조 효과 전부 최대 후 등장, 종류별 1회</p>' + TRAIT_ORDER.map(k => cxCard({ col: '#c8c0ff', trait: k, ic: TRAITS[k].ic, nm: TRAITS[k].nm, lines: [esc(TRAITS[k].ds)] })).join('');
    if (t === 'x') return cxFuse();
    if (t === 'j') return `<p class="hint">2차 전직은 눌러서 펼침 · 공통 선택지 ${esc(JOB2_STAT.nm)}(${esc(JOB2_STAT.ds)})</p>` + JOB_ORDER.map(id => cxJob(id, S.seenJ.has(id))).join('');
    if (t === 'e') return cxEnemies(S);
    if (t === 'f') return FRAGS.map((f, i) => { const v = (S.s.frags || []).includes(f.id); return cxCard({ lock: !v, hint: '해금 조건 · ' + f.cond, col: '#e8d8ff', ic: String(i + 1), nm: f.nm, lines: [esc(f.tx)] }); }).join('');
    if (t === 'u') return cxUnlock(S);
    return '';
  };
  UI.innerHTML = `<div class="layer pg pager">${pgHead('도감', 'cx_back', CODEX_TABS, tab)}${pgPanes(K.map(k => [k, bodyOf(k)]), tab, 'cxl')}</div>`;
  let cur = tab; uiPager(UI.querySelector('.layer'), K, tab, k => { cur = k; });
  const setS = (k, v) => { const x = loadSave(); x[k] = v; try { localStorage.setItem(CFG.SAVE_KEY, JSON.stringify(x)); } catch (e) { } saveCache = null; if (k === 'color') heroReset(); keepScroll(() => showCodex(cur, back)); };
  UI.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => setS('title', b.dataset.t || null)));
  UI.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => setS('color', b.dataset.c)));
  on('cx_back', back);
}
