/* ============================================================
   레벨업 3지선다 — 후보 생성 · 카드 화면 · 다시 뽑기 · 제외
   구조 출처: 초안 0.2l ui.js levelCands·drawCards·renderSelect (분기·유물·직업 카드 제거)
   ============================================================ */
function levelCands() {
  const p = G.p, out = [], ban = G.banished, nW = p.weapons.length, K = CFG.select;
  const jc = id => p.job && JOBS[p.job].cat === WEAPONS[id].cat ? JOB_CFG.jobCatW : 1;   // 전직 계열 후보 비중 증가
  for (const w of p.weapons) if (w.lvl < CFG.weaponMax && !ban.has(w.id)) out.push({ t: 'wup', id: w.id, w: K.wupW * (nW >= 3 ? K.wupW3 : 1) * jc(w.id) });
  if (nW < CFG.slots.weapon) for (const id of WEAPON_ORDER) if (!hasW(id) && !ban.has(id)) out.push({ t: 'wnew', id, w: (nW >= 3 ? K.wnewW3 : K.wnewW) * jc(id) });
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
  for (const f of FILL_CARDS) if (res.length < n && !res.some(x => same(x, f)) && !exclude.some(x => same(x, f))) res.push(f);
  return res;
}
function isFill(c) { return c.t === 'power' || c.t === 'heal'; }

function openSelect() {
  G.pendingLv--; G.stats.selOpen++;
  STATE.mode = 'select'; clearInput();
  G.sel = { kind: 'level', cards: drawCards(CFG.select.cards), banish: false, rerolled: false };
  renderSelect(); autoLater();
}
function autoLater() { if (STATE.dev.auto) { const s = G.sel; setTimeout(() => { if (G && G.sel === s) autoSelect(); }, rand(700, 1200) / Math.sqrt(STATE.dev.speed)); } }
function cardInfo(c) {
  const p = G.p;
  switch (c.t) {
    case 'wnew': { const d = WEAPONS[c.id]; return { k: 'k-' + d.cat, col: CFG.colors[d.cat], ic: d.ic, nm: d.name, tag: '신규 · ' + CAT_NAME[d.cat] + ' 무기', ds: d.desc }; }
    case 'wup': { const d = WEAPONS[c.id], w = p.weapons.find(x => x.id === c.id); return { k: 'k-' + d.cat, col: CFG.colors[d.cat], ic: d.ic, nm: d.name, tag: `Lv ${w.lvl} → ${w.lvl + 1}`, ds: upText(c.id, d.ups[w.lvl - 1]) }; }
    case 'pnew': { const d = PASSIVES[c.id]; return { k: 'k-passive', col: CFG.colors.passive, ic: d.ic, nm: d.name, tag: '신규 · 보조 효과', ds: d.desc(1) }; }
    case 'pup': { const d = PASSIVES[c.id], L = passLv(c.id); return { k: 'k-passive', col: CFG.colors.passive, ic: d.ic, nm: d.name, tag: `Lv ${L} → ${L + 1}`, ds: d.desc(L + 1) }; }
    case 'relic': { const d = RELICS[c.id]; return { k: 'k-relic', col: '#ffd24a', ic: d.ic, nm: d.name, tag: `유물 · ${itemName(d.a)} + ${itemName(d.b)}`, ds: d.ds }; }
    case 'branch': { const o = BRANCHES[c.id].find(x => x.k === c.k); return { k: 'k-branch', col: c.kind === 'w' ? CFG.colors[WEAPONS[c.id].cat] : CFG.colors.passive, ic: (WEAPONS[c.id] || PASSIVES[c.id]).ic, nm: o.nm, tag: itemName(c.id) + ' 분기', ds: o.ds }; }
    case 'job': { const d = JOBS[c.id]; return { k: 'k-job', col: CFG.colors[d.cat], ic: d.ic, nm: d.name, tag: CAT_NAME[d.cat] + ' 계열', ds: d.rule + '\n궁극기 · ' + d.ult }; }
    case 'job2': { const o = JOB2[c.id].concat(JOB2_STAT).find(x => x.k === c.k); return { k: 'k-job', col: c.k === 'veteran' ? '#8a86a0' : CFG.colors[JOBS[c.id].cat], ic: o.nm.slice(0, 1), nm: o.nm, tag: c.k === 'veteran' ? '능력치 강화형' : JOBS[c.id].name + ' 2차', ds: o.ds }; }
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
    <div class="sel-head"><h2>${h}</h2><p class="sub">${sub}</p></div>
    <div class="cards">${cards}</div>
    ${acts ? `<div class="sel-actions">${acts}</div>` : ''}</div>`;
  UI.querySelectorAll('.card[data-i]').forEach(b => b.addEventListener('click', () => pickCard(+b.dataset.i)));
  UI.querySelectorAll('.card[data-w]').forEach(b => b.addEventListener('click', () => offerWeapon(b.dataset.w)));
  on('reroll', reroll);
  on('banish', () => { if (!G.banishes) return; s.banish = !s.banish; renderSelect(); });
  on('offer', () => { if (G.p.weapons.length < 2) return; s.offer = !s.offer; renderSelect(); });
  on('leave', leaveAltar);
}
function reroll() {
  if (!G.rerolls || !G.sel) return;
  G.rerolls--; G.sel.cards = drawCards(CFG.select.cards); G.sel.banish = false; renderSelect();
}
function pickCard(i) {
  const s = G.sel; if (!s) return;
  const c = s.cards[i]; if (!c) return;
  if (s.kind === 'branch') { applyBranch(c); return closeSel(); }
  if (s.kind === 'job') { applyJob(c.id); return closeSel(); }
  if (s.kind === 'job2') { applyJob2(c.k); return closeSel(); }
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
    case 'wnew': addWeapon(c.id); if (p.weapons.length >= CFG.slots.weapon && G.stats.wFullAt == null) G.stats.wFullAt = Math.round(G.time); break;
    case 'wup': p.weapons.find(x => x.id === c.id).lvl++; checkBranch('w', c.id); break;
    case 'pnew': p.passives.push({ id: c.id, lvl: 1 }); if (p.passives.length >= PASSIVE_ORDER.length && G.stats.pFullAt == null) G.stats.pFullAt = Math.round(G.time); break;
    case 'pup': p.passives.find(x => x.id === c.id).lvl++; checkBranch('p', c.id); break;
    case 'relic': p.relics.push(c.id); G.stats.relics.push(c.id); toast(`유물 ${RELICS[c.id].name}`, '#ffd24a'); break;
    case 'power': p.bonusDmg += CFG.fill.power; break;
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
  return (G.ai = { cat, pPref: shuffle(PASSIVE_ORDER.slice()), slip: rand(0.03, 0.12), leave: 0.1, offer: 0.2, autoUlt: Math.random() < 0.3 });
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
    const sc = s.cards.map(c => (ai.cat[JOBS[c.id].cat] || 0) + rand(0, 1.5)); let bi = 0; sc.forEach((v, i) => { if (v > sc[bi]) bi = i; });
    return pickCard(bi);
  }
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
