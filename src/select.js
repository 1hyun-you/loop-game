/* ============================================================
   레벨업 3지선다 — 후보 생성 · 카드 화면 · 다시 뽑기 · 제외
   구조 출처: 초안 0.2l ui.js levelCands·drawCards·renderSelect (분기·유물·직업 카드 제거)
   ============================================================ */
const jobColor = id => JOBS[id].cats ? '#7fc8a0' : CFG.colors[JOBS[id].cat];
function levelCands() {
  const p = G.p, out = [], ban = G.banished, nW = p.weapons.length, K = CFG.select;
  const jc = id => jobCat(WEAPONS[id].cat) ? JOB_CFG.jobCatW : 1;   // 전직 계열 후보 비중 증가
  for (const w of p.weapons) if (w.lvl < CFG.weaponMax && !ban.has(w.id)) out.push({ t: 'wup', id: w.id, w: K.wupW * (nW >= 3 ? K.wupW3 : 1) * jc(w.id) });
  if (nW < slotW()) for (const id of WEAPON_ORDER) if (!hasW(id) && !ban.has(id) && catOk(WEAPONS[id].cat)) out.push({ t: 'wnew', id, w: (nW >= 3 ? K.wnewW3 : K.wnewW) * jc(id) });
  for (const id of RELIC_ORDER) if (relicReady(id)) out.push({ t: 'relic', id, w: 2.5 });
  for (const ps of p.passives) if (ps.lvl < CFG.passiveMax && !ban.has(ps.id)) out.push({ t: 'pup', id: ps.id, w: K.pupW });
  if (p.passives.length < CFG.slots.passive) for (const id of PASSIVE_ORDER) if (!hasP(id) && !ban.has(id)) out.push({ t: 'pnew', id, w: K.pnewW });
  return out;
}
const FILL_CARDS = [{ t: 'power', id: 'power' }, { t: 'heal', id: 'heal' }];
function drawCards(n, exclude = []) {
  const same = (a, b) => a.t === b.t && a.id === b.id;
  const pool = levelCands().filter(c => !exclude.some(x => same(x, c))), res = [];
  while (res.length < n && pool.length) { const c = weightedPick(pool); res.push(c); pool.splice(pool.indexOf(c), 1); }
  for (const t of traitCands(exclude.concat(res))) if (res.length < n) res.push(t);   // 숙련 특성 우선 (0.23)
  for (const f of FILL_CARDS) if (res.length < n && !res.some(x => same(x, f)) && !exclude.some(x => same(x, f))) res.push(f);
  return res;
}
function isFill(c) { return c.t === 'power' || c.t === 'heal' || c.t === 'trait'; }

function openSelect() {
  G.pendingLv--; G.stats.selOpen++;
  STATE.mode = 'select'; clearInput();
  G.sel = { kind: 'level', cards: drawCards(selN()), banish: false, rerolled: false };
  renderSelect(); autoLater();
}
/* 0.24 시작 무기 3지선다 — 도전 조건 계열 제한 반영, 후보 부족 시 같은 계열 공용 무기로 보충 */
function startPickInit() {
  let pool = START_POOL.filter(id => catOk(WEAPONS[id].cat));
  if (pool.length < 3) pool = pool.concat(shuffle(WEAPON_ORDER.filter(id => !pool.includes(id) && catOk(WEAPONS[id].cat))).slice(0, 3 - pool.length));
  G.startCands = shuffle(pool).slice(0, 3);
  if (G.startCands.length <= 1) { addWeapon(G.startCands[0] || startWeapon()); G.stats.start = G.p.weapons[0].id; } else G.pendingStart = true;
}
function openStart() {
  G.pendingStart = false; STATE.mode = 'select'; clearInput();
  G.sel = { kind: 'start', cards: G.startCands.map(id => ({ t: 'wnew', id })), banish: false };
  renderSelect(); autoLater();
}
/* 0.25 보유 능력 목록 (선택 화면·일시정지 화면) */
function abilityHTML() {
  const p = G.p, row = (col, ic, nm, lv, ds, cls = '') => `<div class="ab ${cls}"><span class="ic" style="background:${col}">${esc(ic)}</span><span><b>${esc(nm)}</b><span class="lv">${esc(lv)}</span><p>${esc(ds)}</p></span></div>`;
  const brNm = (id, k) => { const o = k && BRANCHES[id] && BRANCHES[id].find(x => x.k === k); return o ? `\n분기 · ${o.nm}: ${o.ds}` : ''; };
  let h = '';
  if (p.job) { const J = JOBS[p.job], J2 = p.job2 && JOB2[p.job].concat(JOB2_STAT).find(o => o.k === p.job2);
    h += '<h3>직업</h3>' + row(jobColor(p.job), J.ic, J.name, J2 ? '2차 · ' + J2.nm : '1차', J.rule + '\n궁극기 · ' + J.ult + (J2 ? '\n' + J2.nm + ' · ' + J2.ds : ''));
    if (p.exw) { const X = EXW[p.exw.id]; h += '<h3>전용 무기</h3>' + row('#ffd24a', X.ic, X.name, JOBS[p.job].name + ' 전용', X.ds, 'exw'); }
    if (p.job === 'druid' && G.pets.length) h += '<h3>야수 동료</h3>' + ['wolf', 'bear'].map(k => { const n = G.pets.filter(m => m.kind === k).length; if (!n) return ''; const S = petStat(k), D = PET[k]; return row('#7fd07a', D.ic, D.name + (n > 1 ? ' ×' + n : ''), '', `피해 ${Math.round(S.dmg)} · 공격 간격 ${S.atk.toFixed(2)}초 · 이동 속도 ${Math.round(S.sp)}\n${k === 'wolf' ? '울부짖음' : '강타'} ${S.sk.toFixed(1)}초마다 · 범위 ${Math.round(S.skR)}`); }).join(''); }
  if (p.weapons.length) h += '<h3>무기</h3>' + p.weapons.map(w => { const d = WEAPONS[w.id]; const wx = wxOn(d.cat) ? `\n${JOBS[p.job].name} 변환 · ${JOB_WX[p.job].ds}` : ''; return row(CFG.colors[d.cat], d.ic, wName(w.id), 'Lv ' + w.lvl, d.desc + wx + brNm(w.id, w.br)); }).join('');
  if (p.passives.length) h += '<h3>보조 효과</h3>' + p.passives.map(x => { const d = PASSIVES[x.id]; return row(CFG.colors.passive, d.ic, d.name, 'Lv ' + x.lvl, d.desc(x.lvl) + brNm(x.id, x.br)); }).join('');
  if (p.relics.length) h += '<h3>유물</h3>' + p.relics.map(id => row('#ffd24a', RELICS[id].ic, RELICS[id].name, '', RELICS[id].ds)).join('');
  const tk = Object.keys(p.tr || {}); if (tk.length) h += '<h3>숙련 특성</h3>' + tk.map(k => row('#c8b0ff', TRAITS[k].ic, TRAITS[k].nm, '', TRAITS[k].ds)).join('');
  if (p.curses && p.curses.length) h += '<h3>저주</h3>' + p.curses.map(k => row('#8a6aa0', '저', CURSES[k].name, '', CURSES[k].ds)).join('');
  return `<div class="abil">${h || '<p class="sub">보유 능력 없음</p>'}</div>`;
}
function toggleAbil() { const s = G.sel; if (!s) return; s.abil = !s.abil; renderSelect(); }
function autoLater() { if (STATE.dev.auto) { const s = G.sel; setTimeout(() => { if (G && G.sel === s) autoSelect(); }, rand(700, 1200) / Math.sqrt(STATE.dev.speed)); } }
function cardInfo(c) {
  const p = G.p;
  switch (c.t) {
    case 'wnew': { const d = WEAPONS[c.id]; return { k: 'k-' + d.cat, col: CFG.colors[d.cat], ic: d.ic, nm: wName(c.id), tag: '신규 · ' + CAT_NAME[d.cat] + ' 무기', ds: d.desc }; }
    case 'wup': { const d = WEAPONS[c.id], w = p.weapons.find(x => x.id === c.id); return { k: 'k-' + d.cat, col: CFG.colors[d.cat], ic: d.ic, nm: wName(c.id), tag: `Lv ${w.lvl} → ${w.lvl + 1}`, ds: upText(c.id, d.ups[w.lvl - 1]) }; }
    case 'pnew': { const d = PASSIVES[c.id]; return { k: 'k-passive', col: CFG.colors.passive, ic: d.ic, nm: d.name, tag: '신규 · 보조 효과', ds: d.desc(1) }; }
    case 'pup': { const d = PASSIVES[c.id], L = passLv(c.id); return { k: 'k-passive', col: CFG.colors.passive, ic: d.ic, nm: d.name, tag: `Lv ${L} → ${L + 1}`, ds: d.desc(L + 1) }; }
    case 'relic': { const d = RELICS[c.id]; return { k: 'k-relic', col: '#ffd24a', ic: d.ic, nm: d.name, tag: `유물 · ${itemName(d.a)} + ${itemName(d.b)}`, ds: d.ds }; }
    case 'branch': { const o = BRANCHES[c.id].find(x => x.k === c.k); return { k: 'k-branch', col: c.kind === 'w' ? CFG.colors[WEAPONS[c.id].cat] : CFG.colors.passive, ic: (WEAPONS[c.id] || PASSIVES[c.id]).ic, nm: o.nm, tag: itemName(c.id) + ' 분기', ds: o.ds }; }
    case 'job': { const d = JOBS[c.id]; return { k: 'k-job', col: jobColor(c.id), ic: d.ic, nm: d.name, tag: d.cats ? '혼합 계열 · ' + d.cats.map(x => CAT_NAME[x]).join('+') : CAT_NAME[d.cat] + ' 계열', ds: d.rule + '\n궁극기 · ' + d.ult + '\n무기 변환 · ' + jobCats(c.id).map(x => CAT_NAME[x]).join('·') + ' 무기 → ' + JOB_WX[c.id].pre + ' 무기 (' + JOB_WX[c.id].ds + ')' }; }
    case 'job2': { const o = JOB2[c.id].concat(JOB2_STAT).find(x => x.k === c.k); return { k: 'k-job', col: c.k === 'veteran' ? '#8a86a0' : jobColor(c.id), ic: o.nm.slice(0, 1), nm: o.nm, tag: c.k === 'veteran' ? '능력치 강화형' : JOBS[c.id].name + ' 2차', ds: o.ds }; }
    case 'campRest': return { k: 'k-fill', col: '#8ff0b0', ic: '휴', nm: '휴식', tag: '야영지', ds: '체력 전부 회복' };
    case 'campTrain': return { k: 'k-fill', col: '#7fe0ff', ic: '련', nm: '수련', tag: '야영지', ds: '즉시 레벨 업 2회' };
    case 'campSupply': return { k: 'k-fill', col: '#ffd24a', ic: '급', nm: '보급', tag: '야영지', ds: '보물 상자 1개 (유물 후보 우선)' };
    case 'doorYes': return { k: 'k-fill', col: '#c8a0ff', ic: '문', nm: '문을 연다', tag: '저주 감수', ds: `저주 ${CURSES[c.id].name}(${CURSES[c.id].ds}) 이번 판 지속\n즉시 레벨 업 ${EV_CFG.doorLv}회` };
    case 'doorNo': return { k: 'k-fill', col: '#8a86a0', ic: '×', nm: '물러난다', tag: '보상 없음', ds: '문이 다시 닫힘' };
    case 'trait': { const d = TRAITS[c.id]; return { k: 'k-fill', col: '#c8b0ff', ic: d.ic, nm: d.nm, tag: '숙련 특성', ds: d.ds }; }
    case 'power': return { k: 'k-fill', col: '#ffb070', ic: '↑', nm: '단련', tag: '추가 성장', ds: `모든 피해 +${Math.round(CFG.fill.power * 100)}% (중첩)` };
    default: return { k: 'k-fill', col: '#e04848', ic: '+', nm: '응급 처치', tag: '회복', ds: `체력 ${CFG.fill.heal} 회복` };
  }
}
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const SEL_HEAD = {
  level: s => ['레벨 업', s.banish ? '제외할 카드 선택 · 이번 판에서 다시 등장하지 않음' : `Lv ${G.p.level - G.pendingLv} · 하나를 선택`],
  branch: s => ['분기 선택', `${itemName(s.q.id)} 강화 ${BRANCH_AT}단계 · 플레이 방식 선택`],
  chest: () => ['보물 상자', '정예 처치 보상 · 하나를 선택'],
  job: s => ['전직 제단', s.offer ? '봉헌할 무기 선택 · 무기가 사라지고 다른 직업 3종 호출' : '직업 선택 · 무기 봉헌 시 다시 호출'],
  camp: () => ['떠돌이 야영지', '휴식·보상 중 하나를 선택'],
  door: () => ['봉인된 문', '저주를 받아들이면 문이 열림'],
  start: () => ['출발 무기', '이번 판의 첫 무기 선택'],
  job2: () => ['2차 전직', `${JOBS[G.p.job].name} · 필수 선택 · 전용 무기 ${EXW[G.p.job].name} 지급`],
};
function renderSelect() {
  const s = G.sel, kind = s.kind || 'level';
  let cards;
  if (kind === 'job' && s.offer) cards = G.p.weapons.map((w, i) => { const d = WEAPONS[w.id]; return `<button class="card k-${d.cat} banish" data-w="${w.id}"><span class="ic" style="background:${CFG.colors[d.cat]}">${esc(d.ic)}</span><span class="tx"><span class="nm">${esc(d.name)} <span class="tag">Lv ${w.lvl}</span></span><span class="ds">봉헌 시 무기 삭제</span></span></button>`; }).join('');
  else cards = s.cards.map((c, i) => {
    const f = cardInfo(c), off = s.banish && isFill(c);
    return `<button class="card ${f.k}${s.banish ? ' banish' : ''}" data-i="${i}" ${off ? 'disabled' : ''}>
      <span class="ic" style="background:${f.col}">${esc(f.ic)}</span>
      <span class="tx"><span class="nm">${esc(f.nm)} <span class="tag">${esc(f.tag)}</span></span><span class="ds">${esc(f.ds)}</span></span></button>`;
  }).join('');
  const [h, sub] = SEL_HEAD[kind](s);
  let acts = '';
  if (kind === 'level') acts = `<button id="reroll" ${G.rerolls ? '' : 'disabled'}>다시 뽑기 (${G.rerolls})</button><button id="banish" class="${s.banish ? 'on' : ''}" ${G.banishes ? '' : 'disabled'}>${s.banish ? '제외 취소' : `제외 (${G.banishes})`}</button>`;
  if (kind === 'job') acts = `<button id="offer" class="${s.offer ? 'on' : ''}" ${G.p.weapons.length >= 2 ? '' : 'disabled'}>${s.offer ? '봉헌 취소' : '무기 봉헌'}</button><button id="leave">떠나기</button>`;
  UI.innerHTML = `<div class="layer sel sel-${kind}">
    <div class="sel-head"><h2>${h}</h2><p class="sub">${sub}</p>${kind === 'start' ? '' : `<button id="abtn">${s.abil ? '닫기' : '내 능력'}</button>`}</div>
    ${s.abil ? abilityHTML() : `<div class="cards">${cards}</div>`}
    ${acts ? `<div class="sel-actions">${acts}</div>` : ''}</div>`;
  s.armed = null;
  UI.querySelectorAll('.card[data-i]').forEach(b => b.addEventListener('click', () => { sfx('pick');
    const i = +b.dataset.i;
    if (SETTINGS.confirm2 && !s.banish && s.armed !== i) {          // 두 번 눌러 확정 (0.14)
      s.armed = i; UI.querySelectorAll('.card.armed').forEach(x => x.classList.remove('armed')); b.classList.add('armed'); return;
    }
    pickCard(i);
  }));
  UI.querySelectorAll('.card[data-w]').forEach(b => b.addEventListener('click', () => offerWeapon(b.dataset.w)));
  on('reroll', reroll);
  on('banish', () => { if (!G.banishes) return; s.banish = !s.banish; renderSelect(); });
  on('offer', () => { if (G.p.weapons.length < 2) return; s.offer = !s.offer; renderSelect(); });
  on('leave', leaveAltar);
  on('abtn', toggleAbil);
}
function reroll() {
  if (!G.rerolls || !G.sel) return;
  G.rerolls--; G.sel.cards = drawCards(selN()); G.sel.banish = false; renderSelect();
}
function pickCard(i) {
  const s = G.sel; if (!s) return;
  const c = s.cards[i]; if (!c) return;
  if (s.kind === 'branch') { applyBranch(c); return closeSel(); }
  if (s.kind === 'job') { applyJob(c.id); return closeSel(); }
  if (s.kind === 'job2') { applyJob2(c.k); return closeSel(); }
  if (s.kind === 'camp') { applyCamp(c); return closeSel(); }
  if (s.kind === 'door') { applyDoor(c); return closeSel(); }
  if (s.kind === 'start') { addWeapon(c.id); G.stats.start = c.id; recalc(); return closeSel(); }
  if (s.banish) {
    if (isFill(c) || !G.banishes) return;
    G.banished.add(c.id); G.banishes--; s.banish = false;
    s.cards[i] = drawCards(1, s.cards)[0] || FILL_CARDS[1];
    renderSelect(); return;
  }
  applyCard(c);
  closeSel();
}
function closeSel() { G.sel = null; hideUI(); STATE.mode = 'play'; }
function applyCard(c) {
  const p = G.p;
  if (G.sel && G.sel.kind === 'chest') (G.stats.chestPicks = G.stats.chestPicks || []).push(c.t + ':' + c.id);
  else G.stats.picks.push(p.level - G.pendingLv + ':' + c.t + ':' + c.id);
  switch (c.t) {
    case 'wnew': addWeapon(c.id); if (p.weapons.length >= slotW() && G.stats.wFullAt == null) G.stats.wFullAt = Math.round(G.time); break;
    case 'wup': p.weapons.find(x => x.id === c.id).lvl++; checkBranch('w', c.id); break;
    case 'pnew': p.passives.push({ id: c.id, lvl: 1 }); if (p.passives.length >= PASSIVE_ORDER.length && G.stats.pFullAt == null) G.stats.pFullAt = Math.round(G.time); break;
    case 'pup': p.passives.find(x => x.id === c.id).lvl++; checkBranch('p', c.id); break;
    case 'relic': p.relics.push(c.id); G.stats.relics.push(c.id); toast(`유물 ${RELICS[c.id].name}`, '#ffd24a'); break;
    case 'power': p.bonusDmg += CFG.fill.power; break;
    case 'trait': applyTrait(c.id); break;
    default: heal(CFG.fill.heal);
  }
  recalc();
}

/* ============================================================
   자동 선택 (시험용) — 판마다 성향(계열 선호·보조 효과 우선순위·착오율) 무작위
   점수식 출처: 초안 0.2l telemetry.js cardScore (직업·유물 항목 제거)
   ============================================================ */
function aiProfile() {
  if (G.ai) return G.ai;
  const cat = { melee: 0, ranged: 0, magic: 0 }; cat[pick(['melee', 'ranged', 'magic'])] = 1.6; cat[pick(['melee', 'ranged', 'magic'])] += 0.6;
  return (G.ai = { cat, pPref: shuffle(PASSIVE_ORDER.slice()), slip: rand(0.03, 0.12), leave: 0.1, offer: 0.2, autoUlt: Math.random() < 0.3, evGo: Math.random() < 0.8, curse: 0.7 });
}
function cardScore(c) {
  const p = G.p, ai = aiProfile(), nW = p.weapons.length, nP = p.passives.length;
  const core = ai.pPref.slice(0, 2).includes(c.id), low = p.hp < p.maxHp * 0.5;
  let s = 0;
  switch (c.t) {
    case 'wnew': { const avgL = p.weapons.reduce((a, w) => a + w.lvl, 0) / Math.max(1, nW); s = 4.6 + (nW < 2 ? 2.2 : 0) - Math.max(0, nW - nP - 1) * 1.3 + (ai.cat[WEAPONS[c.id].cat] || 0) + (nW >= 3 && avgL < 2 ? -2.4 : nW >= 2 && avgL < 1.5 ? -1 : 0); break; }
    case 'wup': { const w = p.weapons.find(x => x.id === c.id), top = Object.entries(G.stats.dmg).sort((a, b) => b[1] - a[1])[0]; s = 4.2 + (top && top[0] === c.id ? 1 : 0) + (w.lvl < 3 && G.time < 300 ? 1.4 : 0); break; }
    case 'pnew': s = 3.4 + (core ? 2.4 : 0.8) + (nP < nW - 1 ? 1.3 : 0); break;
    case 'pup': s = 3.4 + (core ? 2 : 0.3); break;
    case 'heal': s = p.hp < p.maxHp * 0.4 ? 6 : 1; break;
    case 'power': s = 3; break;
    case 'trait': s = 3.4; break;
    case 'relic': s = 6.5; break;
  }
  if ((c.t === 'pnew' || c.t === 'pup') && low && c.id === 'vit') s += 2;
  return s + rand(0, 2.2);
}
function autoSelect() {
  if (!STATE.dev.auto || STATE.mode !== 'select' || !G.sel) return;
  const s = G.sel, ai = aiProfile(), later = f => setTimeout(f, rand(500, 900) / Math.sqrt(STATE.dev.speed));
  if (s.kind === 'branch' || s.kind === 'job2') return pickCard(Math.floor(Math.random() * s.cards.length));
  if (s.kind === 'job') {
    if (!s.tried && Math.random() < ai.leave) { s.tried = true; return leaveAltar(); }
    if (!s.tried && G.p.weapons.length >= 3 && Math.random() < ai.offer) {          // 무기 봉헌 재호출 (가장 낮은 레벨 무기)
      s.tried = true; const w = G.p.weapons.slice().sort((a, b) => a.lvl - b.lvl)[0];
      s.offer = true; renderSelect(); return later(() => { if (G.sel === s) offerWeapon(w.id); });
    }
    const sc = s.cards.map(c => Math.max(...jobCats(c.id).map(k => ai.cat[k] || 0)) + rand(0, 1.5)); let bi = 0; sc.forEach((v, i) => { if (v > sc[bi]) bi = i; });
    return pickCard(bi);
  }
  if (s.kind === 'camp') { const p = G.p; return pickCard(p.hp < p.maxHp * 0.5 ? 0 : Math.random() < 0.55 ? 2 : 1); }
  if (s.kind === 'door') return pickCard(Math.random() < ai.curse ? 0 : 1);
  if (s.kind === 'start') { const sc = s.cards.map(c => (ai.cat[WEAPONS[c.id].cat] || 0) + rand(0, 1.2)); let bi = 0; sc.forEach((v, i) => { if (v > sc[bi]) bi = i; }); return pickCard(bi); }
  if (s.kind === 'chest') { const sc = s.cards.map(c => cardScore(c)); let bi = 0; sc.forEach((v, i) => { if (v > sc[bi]) bi = i; }); return pickCard(bi); }
  // 원하지 않는 계열 신규 무기는 가끔 제외 (사람의 제외 사용 재현)
  if (!s.banished && G.banishes > 0 && G.p.weapons.length >= 2) {
    const bi = s.cards.findIndex(c => c.t === 'wnew' && !ai.cat[WEAPONS[c.id].cat]);
    if (bi >= 0 && Math.random() < 0.35) { s.banished = true; s.banish = true; renderSelect(); later(() => { if (G.sel === s) { pickCard(bi); later(autoSelect); } }); return; }
  }
  const sc = s.cards.map(cardScore); let bi = 0; sc.forEach((v, i) => { if (v > sc[bi]) bi = i; });
  if (sc[bi] < 4 && G.rerolls > 0 && !s.rerolled) { s.rerolled = true; reroll(); G.sel.rerolled = true; later(autoSelect); return; }
  if (s.cards.length > 1 && Math.random() < ai.slip) { let si = bi === 0 ? 1 : 0; sc.forEach((v, i) => { if (i !== bi && v > sc[si]) si = i; }); if (s.cards[si].t !== 'heal') bi = si; }
  pickCard(bi);
}
