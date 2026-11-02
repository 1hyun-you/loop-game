/* ============================================================
   레벨업 3지선다 — 후보 생성 · 카드 화면 · 다시 뽑기 · 제외
   구조 출처: 초안 0.2l ui.js levelCands·drawCards·renderSelect (분기·유물·직업 카드 제거)
   ============================================================ */
function levelCands() {
  const p = G.p, out = [], ban = G.banished, nW = p.weapons.length, K = CFG.select;
  for (const w of p.weapons) if (w.lvl < CFG.weaponMax && !ban.has(w.id)) out.push({ t: 'wup', id: w.id, w: K.wupW * (nW >= 3 ? K.wupW3 : 1) });
  if (nW < CFG.slots.weapon) for (const id of WEAPON_ORDER) if (!hasW(id) && !ban.has(id)) out.push({ t: 'wnew', id, w: nW >= 3 ? K.wnewW3 : K.wnewW });
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
  STATE.mode = 'select'; INPUT.active = false; INPUT.id = null; INPUT.mag = 0;
  G.sel = { cards: drawCards(CFG.select.cards), banish: false, rerolled: false };
  renderSelect();
  if (STATE.dev.auto) { const s = G.sel; setTimeout(() => { if (G && G.sel === s) autoSelect(); }, rand(700, 1200) / Math.sqrt(STATE.dev.speed)); }
}
function cardInfo(c) {
  const p = G.p;
  switch (c.t) {
    case 'wnew': { const d = WEAPONS[c.id]; return { k: 'k-' + d.cat, col: CFG.colors[d.cat], ic: d.ic, nm: d.name, tag: '신규 · ' + CAT_NAME[d.cat] + ' 무기', ds: d.desc }; }
    case 'wup': { const d = WEAPONS[c.id], w = p.weapons.find(x => x.id === c.id); return { k: 'k-' + d.cat, col: CFG.colors[d.cat], ic: d.ic, nm: d.name, tag: `Lv ${w.lvl} → ${w.lvl + 1}`, ds: upText(c.id, d.ups[w.lvl - 1]) }; }
    case 'pnew': { const d = PASSIVES[c.id]; return { k: 'k-passive', col: CFG.colors.passive, ic: d.ic, nm: d.name, tag: '신규 · 보조 효과', ds: d.desc(1) }; }
    case 'pup': { const d = PASSIVES[c.id], L = passLv(c.id); return { k: 'k-passive', col: CFG.colors.passive, ic: d.ic, nm: d.name, tag: `Lv ${L} → ${L + 1}`, ds: d.desc(L + 1) }; }
    case 'power': return { k: 'k-fill', col: '#ffb070', ic: '↑', nm: '단련', tag: '추가 성장', ds: `모든 피해 +${Math.round(CFG.fill.power * 100)}% (중첩)` };
    default: return { k: 'k-fill', col: '#e04848', ic: '+', nm: '응급 처치', tag: '회복', ds: `체력 ${CFG.fill.heal} 회복` };
  }
}
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
function renderSelect() {
  const s = G.sel;
  const cards = s.cards.map((c, i) => {
    const f = cardInfo(c), off = s.banish && isFill(c);
    return `<button class="card ${f.k}${s.banish ? ' banish' : ''}" data-i="${i}" ${off ? 'disabled' : ''}>
      <span class="ic" style="background:${f.col}">${esc(f.ic)}</span>
      <span class="tx"><span class="nm">${esc(f.nm)} <span class="tag">${esc(f.tag)}</span></span><span class="ds">${esc(f.ds)}</span></span></button>`;
  }).join('');
  UI.innerHTML = `<div class="layer sel">
    <div class="sel-head"><h2>레벨 업</h2><p class="sub">${s.banish ? '제외할 카드 선택 · 이번 판에서 다시 등장하지 않음' : `Lv ${G.p.level - G.pendingLv} · 하나를 선택`}</p></div>
    <div class="cards">${cards}</div>
    <div class="sel-actions"><button id="reroll" ${G.rerolls ? '' : 'disabled'}>다시 뽑기 (${G.rerolls})</button><button id="banish" class="${s.banish ? 'on' : ''}" ${G.banishes ? '' : 'disabled'}>${s.banish ? '제외 취소' : `제외 (${G.banishes})`}</button></div></div>`;
  UI.querySelectorAll('.card').forEach(b => b.addEventListener('click', () => pickCard(+b.dataset.i)));
  document.getElementById('reroll').addEventListener('click', reroll);
  document.getElementById('banish').addEventListener('click', () => { if (!G.banishes) return; s.banish = !s.banish; renderSelect(); });
}
function reroll() {
  if (!G.rerolls || !G.sel) return;
  G.rerolls--; G.sel.cards = drawCards(CFG.select.cards); G.sel.banish = false; renderSelect();
}
function pickCard(i) {
  const s = G.sel; if (!s) return;
  const c = s.cards[i]; if (!c) return;
  if (s.banish) {
    if (isFill(c) || !G.banishes) return;
    G.banished.add(c.id); G.banishes--; s.banish = false;
    s.cards[i] = drawCards(1, s.cards)[0] || FILL_CARDS[1];
    renderSelect(); return;
  }
  applyCard(c);
  G.sel = null; hideUI(); STATE.mode = 'play';
}
function applyCard(c) {
  const p = G.p;
  G.stats.picks.push(p.level - G.pendingLv + ':' + c.t + ':' + c.id);
  switch (c.t) {
    case 'wnew': addWeapon(c.id); if (p.weapons.length >= CFG.slots.weapon && G.stats.wFullAt == null) G.stats.wFullAt = Math.round(G.time); break;
    case 'wup': p.weapons.find(x => x.id === c.id).lvl++; break;
    case 'pnew': p.passives.push({ id: c.id, lvl: 1 }); if (p.passives.length >= PASSIVE_ORDER.length && G.stats.pFullAt == null) G.stats.pFullAt = Math.round(G.time); break;
    case 'pup': p.passives.find(x => x.id === c.id).lvl++; break;
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
  return (G.ai = { cat, pPref: shuffle(PASSIVE_ORDER.slice()), slip: rand(0.03, 0.12) });
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
  }
  if ((c.t === 'pnew' || c.t === 'pup') && low && c.id === 'vit') s += 2;
  return s + rand(0, 2.2);
}
function autoSelect() {
  if (!STATE.dev.auto || STATE.mode !== 'select' || !G.sel) return;
  const s = G.sel, ai = aiProfile(), later = f => setTimeout(f, rand(500, 900) / Math.sqrt(STATE.dev.speed));
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
