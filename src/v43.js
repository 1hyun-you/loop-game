/* ============================================================
   0.43 연성 재설계 (회차 48·49 확정, 표현·보강 단계)
   • 무기 10종 체제: 대응 직업 없는 8종(회전검·창·철퇴·부메랑 도끼·투척 단검·폭탄·번개·회오리) 등장 제외, 코드 보존
   • 무기 최고 Lv 5 (Lv 3 분기 · Lv 5 각성), 기존 Lv 6 강화분은 Lv 5에 합산
   • 전직 후보: 보유 무기에 대응하는 직업만 최대 3 (대응 0개면 무작위 3)
   • 전직 시 상징 무기 → 기본 무기 칸 (무기 칸 미점유, 미보유 시 Lv 1 지급) · 직업 표시 병기
   • 연성: 무기 칸 무기 Lv 5(각성 완료) + 기본 무기 Lv 5(각성 완료) → 레벨업 선택지에 연성 카드 (레벨업 1회당 최대 1장)
     선택 시 해당 칸이 직업 특화 연성 무기로 변신 · 재료 분기·각성 계승 · 직업 뼈대 규칙 10종 × 짝 무기 효과
   • 기본 무기 단독 발동: 무기 칸 전부 연성 전까지 유지
   • 직업 시련 → 2차 전직 조건 (미달 시 전직 후 3페이즈 돌파로 대체)
   • 0.42 연성 1차 구조(시련 완수 → Lv 6 무기 2종 결합) 폐지
   • 연성 연출·뼈대 외형은 임시 도형 (최종본 아님, 시험 확인 후 GPT 요청 대상)
   ============================================================ */
const W43 = ['cleave', 'shield', 'slam', 'arrow', 'shuriken', 'trap', 'fireball', 'icering', 'orb', 'beam'];
const W43_OUT = WEAPON_ORDER.filter(id => !W43.includes(id));
WEAPON_ORDER.splice(0, WEAPON_ORDER.length, ...WEAPON_ORDER.filter(id => W43.includes(id)));
START_POOL.splice(0, START_POOL.length, 'cleave', 'shield', 'arrow', 'shuriken', 'fireball', 'orb');
CFG.weaponMax = 5;
const AW43 = 5;
for (const id in WEAPONS) { const u = WEAPONS[id].ups; if (u.length > 4) { const a = u[3], b = u[4]; for (const k in b) a[k] = (a[k] || 0) + b[k]; u.length = 4; } }   // Lv 6 강화분 → Lv 5 합산
/* 직업 색 겹침 보정 (Lab 거리 25 미만 3쌍: 기술자·프리스트, 마법사·소환사, 궁수·드루이드) */
Object.assign(JOB_COL, { archer: '#d4f56a', engineer: '#e0a86a', mage: '#f5a8e0', summoner: '#a890ff', druid: '#6cc870' });

/* ---------- 직업 뼈대 규칙 10종 ---------- */
const JOB43 = {
  warrior: { pre: '거신', nm: '거신화', ds: '연성 무기를 2배 크기로 휘두름 · 투지 비례 추가 확대', cd: 1.1 },
  rogue: { pre: '그림자', nm: '그림자 분담', ds: '분신 2체가 플레이어 궤적을 따라가며 연성 무기와 기본 무기를 나눠 발동' },
  sovereign: { pre: '왕실', nm: '왕의 병기', ds: '근위병(없으면 전방 3열 진형)이 연성 무기를 들고 동시 공격' },
  archer: { pre: '사냥', nm: '사냥 화살', ds: '연성 무기를 화살촉에 장착, 고속 사출 후 다음 적으로 꺾여 최대 3연속 명중 · 표식 +1' },
  engineer: { pre: '포대', nm: '병기 포대', ds: '연성 무기를 탑재한 대형 포대 설치, 6발마다 미사일 3연발' },
  chrono: { pre: '메아리', nm: '시간 메아리', ds: '연성 무기 공격이 1초 뒤 같은 자리에서 반복 · 정지한 적에게 반복 피해 2배' },
  mage: { pre: '원소', nm: '원소 연성', ds: '동시 시전 때 연성 무기가 6개로 분열·공전 후 차례로 사출, 사출마다 속성 순환' },
  summoner: { pre: '망령', nm: '망령 무장', ds: '연성 무기를 든 망령 2체가 자율 비행 공격, 처치 60회마다 증원 (최대 4)' },
  priest: { pre: '성물', nm: '성물', ds: '연성 무기가 머리 위 성물로 떠서 공격, 회복할 때마다 추가 발동' },
  druid: { pre: '야수', nm: '야수 무장', ds: '곰이 연성 무기로 강타, 늑대가 연성 무기를 물고 돌진' },
};
for (const j in JOB43) if (JOB_WX[j]) Object.assign(JOB_WX[j], { pre: JOB43[j].nm, ds: JOB43[j].ds });
let fuseName = (j, id) => JOB43[j].pre + ' ' + WEAPONS[id].name;
const F43 = () => G.f43 || (G.f43 = { trail: [], bat: null, wr: [], relicT: 0, kills0: 0, echoes: 0, fires: {} });
const baseW = () => G.p.weapons.find(w => w.base);
const slotWs = () => G.p.weapons.filter(w => !w.base);
const fusedWs = () => G.p.weapons.filter(w => w.fu);
const slotCount = () => slotW() - (baseW() ? 1 : 0);
const baseRetired = () => false;   // 0.50: 모든 칸 연성 후에도 기본 무기 계속 발동 (구: fusedWs().length >= slotCount())
const awDone = w => !AWAKEN[w.id] || !!w.aw;
function fuseCands() {
  const p = G.p, b = baseW(); if (!p.job || !b || b.lvl < AW43 || !awDone(b)) return [];
  return slotWs().filter(w => !w.fu && w.lvl >= AW43 && awDone(w));
}

/* ---------- 기본 무기 칸: 슬롯 계산 (meta.js slotW가 fusedN()=fz 개수를 더하므로 기본 무기에 fz 표시) ---------- */
function makeBase(w) { w.base = true; w.fz = 'base'; return w; }

/* ---------- 레벨 단계: Lv 3 분기 · Lv 5 각성 ---------- */
checkBranch = function (kind, id) {
  const it = kind === 'w' ? wObj(id) : G.p.passives.find(x => x.id === id); if (!it) return;
  if (it.lvl >= BRANCH_AT && !it.br && !it.brQ && BRANCHES[id]) { it.brQ = true; G.pendingBr.push({ kind, id }); }
  if (kind === 'w' && AWAKEN[id] && it.lvl >= AW43 && !it.aw && !it.awQ) { it.awQ = true; G.pendingBr.push({ kind: 'w', id, aw: true }); }
};
SEL_HEAD.branch = s => s.q.aw ? ['무기 각성', `${itemName(s.q.id)} ${AW43}레벨 · 각성 1종 선택`] : ['분기 선택', `${itemName(s.q.id)} 강화 ${BRANCH_AT}단계 · 플레이 방식 선택`];

/* ---------- 전직 후보: 보유 무기 대응 직업 ---------- */
const SYM_JOB = Object.fromEntries(Object.entries(FZ_SYMBOL).map(([j, w]) => [w, j]));
jobCands = function (prev = []) {
  if (typeof window !== 'undefined' && window.__vtJob && JOBS[window.__vtJob]) return [{ t: 'job', id: window.__vtJob }];
  let js = shuffle(G.p.weapons.map(w => SYM_JOB[w.id]).filter(Boolean));
  const fresh = js.filter(j => !prev.includes(j)); if (fresh.length) js = fresh;
  if (!js.length) js = shuffle(JOB_ORDER.filter(j => !prev.includes(j)));
  if (!js.length) js = shuffle(JOB_ORDER.slice());
  return js.slice(0, 3).map(id => ({ t: 'job', id }));
};

/* ---------- 전직: 상징 무기 → 기본 무기 칸 ---------- */
const _applyJob43 = applyJob;
applyJob = function (id) {
  const p = G.p, sym = FZ_SYMBOL[id], own = p.weapons.find(w => w.id === sym);
  if (own) p.weapons = p.weapons.filter(w => w !== own);           // 도적 무기 칸 정리 대상에서 제외
  _applyJob43(id);
  const b = makeBase(own || { id: sym, lvl: 1, t: 0.3 }); p.weapons.push(b);
  G.stats.base = sym + ':' + b.lvl; F43();
  toast(`기본 무기 · ${WEAPONS[sym].name} (${JOBS[id].name})`, JOB_COL[id]);
  checkBranch('w', sym); recalc();
};

/* ---------- 연성 카드 ---------- */
const _drawCards43 = drawCards;
drawCards = function (n, ex = []) {
  const r = _drawCards43(n, ex), c = fuseCands()[0];
  if (c && n === selN() && !ex.some(x => x.t === 'fuse') && r.length) {
    let i = r.length - 1; while (i > 0 && r[i].t === 'pet') i--;
    r.splice(i, 1); r.unshift({ t: 'fuse', id: c.id });
  }
  return r;
};
const _isFill43 = isFill;
isFill = c => c.t === 'fuse' || _isFill43(c);
const _cardInfo43 = cardInfo;
cardInfo = function (c) {
  if (c.t !== 'fuse') return _cardInfo43(c);
  const j = G.p.job, d = WEAPONS[c.id], b = baseW();
  return { id: c.id, k: 'k-fuse', col: JOB_COL[j], ic: d.ic, nm: fuseName(j, c.id), tag: `연성 · ${d.name} + ${WEAPONS[b.id].name}`, ds: `${JOB43[j].nm} · ${JOB43[j].ds}\n분기·각성 계승`, job: j };
};
const _cardScore43 = cardScore;
cardScore = c => c.t === 'fuse' ? 7.5 + rand(0, 1) : _cardScore43(c);
const _applyCard43 = applyCard;
applyCard = function (c) { if (c.t !== 'fuse') return _applyCard43(c); if (G.sel && G.sel.kind === 'chest') (G.stats.chestPicks = G.stats.chestPicks || []).push('fuse:' + c.id); else G.stats.picks.push(G.p.level - G.pendingLv + ':fuse:' + c.id); applyFuse(c.id); };
const _choiceType43 = choiceType;
choiceType = (c, f) => f.k === 'k-fuse' ? '연성' : _choiceType43(c, f);
function applyFuse(id) {
  const p = G.p, w = slotWs().find(x => x.id === id && !x.fu); if (!w || !p.job) return;
  const j = p.job; w.fu = { job: j, nm: fuseName(j, id) }; w.t = 0.3;
  (G.stats.fuses = G.stats.fuses || []).push(`${id}:${j}:${Math.round(G.time)}`);
  if (fusedWs().length === 1) F43().kills0 = G.kills;
  banner('연성 · ' + w.fu.nm, `${JOB43[j].nm} · ${WEAPONS[id].name} + ${WEAPONS[baseW().id].name}`, JOB_COL[j], 2.4);
  toast(fusedWs().length >= slotCount() ? '모든 칸 연성 완료 · 기본 무기 계속 발동' : `연성 ${fusedWs().length}/${slotCount()}`, JOB_COL[j]);
  fuseMoment(j, w); sfx('ult'); shake(3, 0.3); recalc();
}
/* 직업별 연성 순간 연출. 아트 로딩 실패 시 기존 연출 사용. */
function fuseMoment(j, w) {
  if (startFuseArt(j, w)) {
    if (j === 'warrior') shake(6, 0.4);
    return;
  }
  const p = G.p, col = JOB_COL[j], R = (r0, r1, d, o = {}) => fx(Object.assign({ kind: 'ring', x: p.x, y: p.y, r0, r1, dur: d, color: col, follow: true }, o));
  if (j === 'warrior') { R(10, 200, 0.7, { fill: true }); shake(6, 0.4); }
  else if (j === 'rogue') for (let i = 0; i < 6; i++) fx({ kind: 'pop', x: p.x + Math.cos(i) * 40, y: p.y + Math.sin(i) * 40, r: 14, color: '#203040', dur: 0.4 });
  else if (j === 'sovereign') for (let i = -1; i <= 1; i++) fx({ kind: 'pop', x: p.x + i * 34, y: p.y - 40, r: 12, color: col, dur: 0.6 });
  else if (j === 'archer') for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; fx({ kind: 'zap', x: p.x, y: p.y, x2: p.x + Math.cos(a) * 140, y2: p.y + Math.sin(a) * 140, dur: 0.3 }); }
  else if (j === 'engineer') { R(60, 10, 0.5); R(10, 120, 0.6); }
  else if (j === 'chrono') { R(160, 10, 0.8); G.later.push({ t: 0.5, f: () => R(10, 160, 0.6) }); }
  else if (j === 'mage') for (let i = 0; i < 6; i++) G.later.push({ t: i * 0.06, f: () => fx({ kind: 'pop', x: p.x + Math.cos(i * 1.05) * 50, y: p.y + Math.sin(i * 1.05) * 50, r: 12, color: ['#ff9a4a', '#bfe8ff', '#fff27a'][i % 3], dur: 0.4 }) });
  else if (j === 'summoner') for (let i = 0; i < 4; i++) fx({ kind: 'pop', x: p.x + rand(-60, 60), y: p.y + rand(-60, 60), r: 16, color: col, dur: 0.7 });
  else if (j === 'priest') { fx({ kind: 'pop', x: p.x, y: p.y - 46, r: 22, color: col, dur: 0.8 }); R(10, 130, 0.6, { fill: true }); }
  else if (j === 'druid') { R(10, 110, 0.5); for (const m of G.pets || []) fx({ kind: 'ring', x: m.x, y: m.y, r0: 6, r1: 50, dur: 0.5, color: col }); }
}

/* ---------- 연성 무기 발동: 직업 뼈대 × 짝 무기 ---------- */
const fireAs = (w, S, k, x, y, ex) => { const S2 = Object.assign({}, S, { dmg: S.dmg * k }); if (ex) ex(S2); return x == null ? WEAPON_FIRE[w.id](w, S2) : atPos(x, y, () => WEAPON_FIRE[w.id](w, S2)); };
function fuseFire43(w, S) {
  const p = G.p, j = w.fu.job, col = JOB_COL[j], f = F43(); f.fires[j] = (f.fires[j] || 0) + 1; G.stats.fuseFires = (G.stats.fuseFires || 0) + 1;
  if (j === 'warrior') {
    const k = 1.8 + 0.4 * (p.fury || 0) / 100;
    fx({ kind: 'ring', x: p.x, y: p.y, r0: 20, r1: 70 * k, dur: 0.3, color: col, follow: true });
    return fireAs(w, S, 1.5, null, null, s => { s.area *= k; });
  }
  if (j === 'rogue') {
    const t = f.trail, a = t[Math.min(t.length - 1, 5)] || p, b = t[Math.min(t.length - 1, 12)] || p, B = baseW();
    fx({ kind: 'pop', x: a.x, y: a.y, r: 13, color: '#203040', dur: 0.22 }); fx({ kind: 'pop', x: b.x, y: b.y, r: 13, color: '#203040', dur: 0.22 });
    const r = fireAs(w, S, 1.45, a.x, a.y);
    if (B) G.later.push({ t: 0.1, f: () => { if (!G.result && p.weapons.includes(w)) fireAs(B, wStats(B), 0.9, b.x, b.y); } });
    return r;
  }
  if (j === 'sovereign') {
    const J = J41(), pts = G.banner && J.gd.length ? J.gd.map(g => ({ x: g.x, y: g.y })) : formation(), k = 1.6 / pts.length;
    let r = false; for (const q of pts) { fx({ kind: 'pop', x: q.x, y: q.y, r: 10, color: col, dur: 0.25 }); if (fireAs(w, S, k, q.x, q.y) !== false) r = true; }
    return r;
  }
  if (j === 'archer') {
    let prev = p, ts = []; const seen = new Set();
    for (let i = 0; i < 3; i++) { let e = null, bs = 1e18; gridQuery(prev.x, prev.y, i ? 260 : 460, q => { if (q.dead || seen.has(q)) return; const s = dist2(prev.x, prev.y, q.x, q.y) / (1 + (q.mk || 0)); if (s < bs) { bs = s; e = q; } }); if (!e) break; seen.add(e); ts.push(e); prev = e; }
    if (!ts.length) return false;
    let px = p.x, py = p.y;
    ts.forEach((e, i) => { const x0 = px, y0 = py; px = e.x; py = e.y; G.later.push({ t: i * 0.07, f: () => { if (G.result || !p.weapons.includes(w)) return; fx({ kind: 'zap', x: x0, y: y0, x2: e.x, y2: e.y, dur: 0.18 }); fireAs(w, S, 0.5, e.x, e.y); if (!e.dead) e.mk = (e.mk || 0) + 1; } }); });
    return true;
  }
  if (j === 'engineer') {
    let bt = f.bat; if (!bt || dist2(bt.x, bt.y, p.x, p.y) > 300 * 300) { bt = f.bat = { x: p.x + p.face.x * 40, y: p.y + p.face.y * 40, n: 0 }; fx({ kind: 'ring', x: bt.x, y: bt.y, r0: 30, r1: 6, dur: 0.4, color: col }); }
    const r = fireAs(w, S, 1.25, bt.x, bt.y); if (r !== false) { bt.n++; bt.k = 0.25; if (bt.n % 6 === 0) missileVolley(bt, 3); }
    return r;
  }
  if (j === 'chrono') {
    const x = p.x, y = p.y, r = fireAs(w, S, 1.2);
    if (r !== false) G.later.push({ t: 1.0, f: () => { if (G.result || !p.weapons.includes(w)) return; f.echoes++; fx({ kind: 'ring', x, y, r0: 50, r1: 8, dur: 0.35, color: col }); G.echo43 = true; try { fireAs(w, S, 0.85, x, y); } finally { G.echo43 = false; } } });
    return r;
  }
  if (j === 'summoner') {
    let r = false; for (const m of f.wr) { if (fireAs(w, S, 0.6 / V41.sum.self, m.x, m.y) !== false) { r = true; fx({ kind: 'pop', x: m.x, y: m.y, r: 10, color: col, dur: 0.2 }); } }
    return r;
  }
  if (j === 'priest') { const q = relicPos(); fx({ kind: 'pop', x: q.x, y: q.y, r: 12, color: col, dur: 0.25 }); return fireAs(w, S, 1.45, q.x, q.y); }
  if (j === 'druid') {
    const pets = G.pets || [], bear = pets.find(m => m.kind === 'bear'), wolves = pets.filter(m => m.kind === 'wolf');
    if (!bear && !wolves.length) return fireAs(w, S, 1.4);
    let r = false;
    if (bear) { fx({ kind: 'ring', x: bear.x, y: bear.y, r0: 8, r1: 60, dur: 0.3, color: col }); if (fireAs(w, S, 1.05, bear.x, bear.y) !== false) r = true; }
    for (const m of wolves.slice(0, 2)) { const e = nearestEnemy(m.x, m.y, 260); if (!e) continue; fx({ kind: 'zap', x: m.x, y: m.y, x2: e.x, y2: e.y, dur: 0.2 }); m.x += (e.x - m.x) * 0.7; m.y += (e.y - m.y) * 0.7; if (fireAs(w, S, 0.6, m.x, m.y) !== false) r = true; }
    return r;
  }
  return fireAs(w, S, 1);   // 마법사는 동시 시전에서 처리
}
function formation() { const p = G.p, fx0 = p.face.x || 1, fy0 = p.face.y || 0; return [[50, 0], [30, 36], [30, -36]].map(([a, b]) => ({ x: p.x + fx0 * a - fy0 * b, y: p.y + fy0 * a + fx0 * b })); }
function relicPos() { const p = G.p; return { x: p.x, y: p.y - 46 + Math.sin(G.time * 3) * 4 }; }

/* ---------- 무기 발동 갱신 (v41 기반 + 연성·기본 무기) ---------- */
updateWeapons = function (dt) {
  const p = G.p, J = p.job && J41(), mage = p.job === 'mage', eng = p.job === 'engineer' ? engSlots() : null, ret = baseRetired();
  let ti = 0;
  for (const w of p.weapons) {
    const S = wStats(w);
    if (w.id === 'spin') { updateSpin(w, S, dt); continue; }
    if (mage) continue;
    if (w.base && ret) continue;
    w.t -= dt * ultCdMul();
    if (w.t <= 0) {
      let r;
      if (w.fu) r = fuseFire43(w, S);
      else if (eng && eng.includes(w) && G.turrets.length) { const t = G.turrets[ti++ % G.turrets.length]; r = atPos(t.x, t.y, () => WEAPON_FIRE[w.id](w, scaleS(S, V41.eng.slotDmg))); if (r !== false) fx({ kind: 'ring', x: t.x, y: t.y, r0: 4, r1: 20, dur: 0.2, color: '#ffd890' }); }
      else r = WEAPON_FIRE[w.id](w, S);
      w.t = r === false ? 0.25 : S.cd * (w.fu && JOB43[w.fu.job].cd || 1); if (r !== false) rcFire(w);
      if (r !== false && p.job === 'rogue' && !DUR41[w.id] && !w.fu) rogueEcho(w, S);
      if (r !== false && pBr('haste') === 'echo' && Math.random() < 0.12) w.t = 0.05;
    }
  }
  if (mage) mageVolley(dt, J);
  updateTraps(dt); updateArsenal(dt); fuseTick(dt);
  for (const L of G.later) { L.t -= dt; if (L.t <= 0) { L.done = true; L.f(); } }
  if (G.later.length) G.later = G.later.filter(L => !L.done);
};
mageVolley = function (dt, J) {
  const C = V41.mag, p = G.p;
  J.vol -= dt * ultCdMul(); if (J.vol > 0) return;
  J.vol = J.volP = (p.job2 === 'archmage' ? C.cdB : C.cd) * Math.max(C.cdMin, p.mod.cd); J.volN++;
  const ret = baseRetired(), list = p.weapons.filter(w => w.id !== 'spin' && !(w.base && ret));
  list.forEach((w, i) => G.later.push({ t: i * C.gap, f: () => {
    if (G.result || !p.weapons.includes(w)) return;
    const S = wStats(w), k = Math.max(C.dmg, J.volP / S.cd * C.fair);
    if (w.fu) { const f = F43(); f.fires.mage = (f.fires.mage || 0) + 1; G.stats.fuseFires = (G.stats.fuseFires || 0) + 1; for (let n = 0; n < 6; n++) G.later.push({ t: 0.12 + n * 0.09, f: () => { if (G.result || !p.weapons.includes(w)) return; const a = G.time * 4 + n * Math.PI / 3, x = p.x + Math.cos(a) * 46, y = p.y + Math.sin(a) * 46; J.volN++; fx({ kind: 'pop', x, y, r: 9, color: ['#ff9a4a', '#bfe8ff', '#fff27a'][n % 3], dur: 0.2 }); fireAs(w, S, k * 0.3, x, y); } }); rcFire(w); return; }
    const r = WEAPON_FIRE[w.id](w, scaleS(S, k)); if (r !== false) rcFire(w);
  } }));
  if (list.length) { fx({ kind: 'ring', x: p.x, y: p.y, r0: 8, r1: 70, dur: 0.3, color: '#e8b0ff', follow: true }); G.stats.volleys = (G.stats.volleys || 0) + 1; }
};
/* 뼈대 보조 개체 갱신: 도적 궤적 · 소환사 망령 무장 · 기술자 포대 */
function fuseTick(dt) {
  const p = G.p, f = G.f43; if (!f || !p.job) return;
  f.trail.unshift({ x: p.x, y: p.y }); if (f.trail.length > 16) f.trail.length = 16;
  if (f.bat && f.bat.k > 0) f.bat.k -= dt;
  if (p.job === 'summoner' && fusedWs().length) {
    const n = Math.min(4, 2 + Math.floor((G.kills - f.kills0) / 60));
    while (f.wr.length < n) { f.wr.push({ x: p.x, y: p.y, a: f.wr.length * 1.6 }); if (f.wr.length > 2) toast('망령 무장 증원', JOB_COL.summoner); }
    f.wr.forEach((m, i) => { m.a += dt * 1.7; const e = nearestEnemy(p.x, p.y, 260), tx = e ? e.x + Math.cos(m.a + i) * 40 : p.x + Math.cos(m.a + i * 1.57) * 70, ty = e ? e.y + Math.sin(m.a + i) * 40 : p.y + Math.sin(m.a + i * 1.57) * 70; m.x += (tx - m.x) * Math.min(1, dt * 3); m.y += (ty - m.y) * Math.min(1, dt * 3); });
  }
}
/* 시간 메아리: 정지한 적에게 반복 피해 2배 */
const _damageEnemy43 = damageEnemy;
damageEnemy = function (e, dmg, o = {}) { if (G.echo43 && e && e.frz > 0) dmg *= 2; return _damageEnemy43(e, dmg, o); };
/* 성물: 회복마다 추가 발동 */
const _heal43 = heal;
heal = function (v, src) {
  const r = _heal43(v, src), p = G.p, f = G.f43;
  if (p && p.job === 'priest' && f && v > 0.3 && G.time >= f.relicT && !G.result) {
    const w = fusedWs()[0];
    if (w) { f.relicT = G.time + 0.8; const q = relicPos(); fx({ kind: 'pop', x: q.x, y: q.y, r: 14, color: '#fff2a8', dur: 0.3 }); fireAs(w, wStats(w), 0.5, q.x, q.y); G.stats.relicHeal = (G.stats.relicHeal || 0) + 1; }
  }
  return r;
};
/* 임시 도형 그리기 (최종본 아님): 분신 · 포대 · 망령 무장 · 성물 */
const _drawJobAura43 = drawJobAura;
drawJobAura = function (c) {
  _drawJobAura43(c);
  const p = G.p, f = G.f43; if (!f || !p.job || !fusedWs().length) return;
  const col = JOB_COL[p.job]; c.save();
  if (p.job === 'rogue') { c.globalAlpha = 0.35; c.fillStyle = '#203040'; for (const k of [5, 12]) { const q = f.trail[Math.min(f.trail.length - 1, k)]; if (q) { c.beginPath(); c.arc(q.x, q.y, p.r * 0.9, 0, 7); c.fill(); } } }
  if (p.job === 'engineer' && f.bat) { const b = f.bat, s = 13 + (b.k > 0 ? 2 : 0); c.fillStyle = '#5a4630'; c.strokeStyle = col; c.lineWidth = 3; c.fillRect(b.x - s, b.y - s, s * 2, s * 2); c.strokeRect(b.x - s, b.y - s, s * 2, s * 2); c.fillStyle = col; c.fillRect(b.x - 3, b.y - s - 8, 6, 10); }
  if (p.job === 'summoner' && !summonerUsesArmedGhost()) for (const m of f.wr) { c.globalAlpha = 0.6; c.fillStyle = col; c.beginPath(); c.moveTo(m.x, m.y - 10); c.lineTo(m.x + 8, m.y + 8); c.lineTo(m.x - 8, m.y + 8); c.closePath(); c.fill(); c.globalAlpha = 1; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(m.x, m.y); c.lineTo(m.x + 11, m.y - 6); c.stroke(); }
  if (p.job === 'priest' && !priestArtReady('orb')) { const q = relicPos(); c.fillStyle = col; c.strokeStyle = '#8a7020'; c.lineWidth = 2; c.beginPath(); c.moveTo(q.x, q.y - 9); c.lineTo(q.x + 7, q.y); c.lineTo(q.x, q.y + 9); c.lineTo(q.x - 7, q.y); c.closePath(); c.fill(); c.stroke(); }
  if (p.job === 'sovereign' && !(G.banner && J41().gd.length)) { c.globalAlpha = 0.3; c.fillStyle = col; for (const q of formation()) c.fillRect(q.x - 4, q.y - 4, 8, 8); }
  c.restore();
};
/* 무기 이름: 연성 무기는 연성 이름 */
const _wName43 = wName;
wName = function (id) { const w = G && G.p && G.p.weapons.find(x => x.id === id); return w && w.fu ? w.fu.nm : _wName43(id); };

/* ---------- 직업 시련 → 2차 전직 조건 ---------- */
v42Update = function (dt) {
  const p = G.p; if (!p.job || !FZ_TRIAL[p.job]) return;
  const f = F42();
  if (!f.base) { f.base = { kills: G.kills, elite: G.stats.eliteKills || 0, ult: G.stats.ults || 0 }; f.px = p.x; f.py = p.y; f.hp = p.hp; }
  const mv = Math.hypot(p.x - f.px, p.y - f.py); f.px = p.x; f.py = p.y;
  f.dist += mv; f.time += dt; if (mv < 0.3) f.still += dt; if (p.hp > p.maxHp * 0.9) f.hi += dt;
  if (p.hp < f.hp) f.hurt += f.hp - p.hp; f.hp = p.hp;
  if (!f.done && fzProg() >= FZ_TRIAL[p.job].n) {
    f.done = 1; G.stats.trialAt = Math.round(G.time);
    toast('시련 완수 · 2차 전직 개방', JOB_COL[p.job]); banner(FZ_TRIAL[p.job].nm, '2차 전직 조건 달성', JOB_COL[p.job], 2.2);
    if (!p.job2) G.job2Ready = true;
  }
};
const _altarCheck43 = altarCheck;
altarCheck = function () {
  const was = G.job2Ready; _altarCheck43();
  const p = G.p; if (p.job && !p.job2 && !F42().done && G.ph.i < p.jobAt + 3) G.job2Ready = was;   // 시련 미완수: 전직 후 3페이즈 돌파 시 대체 개방
};
const trialTxt = () => { const p = G.p, T = FZ_TRIAL[p.job], f = F42(), k = T.k === 'hurt' ? 100 : 1; return f.done ? '완수 · 2차 전직 개방' : `${T.ds} · 진행 ${Math.min(Math.round(fzProg() * k), Math.round(T.n * k))}/${Math.round(T.n * k)}${T.k === 'hurt' ? '%' : ''}`; };

/* ---------- 도감 연성 탭 ---------- */
cxFuse = function () {
  const jobs = JOB_ORDER.map(id => { const X = JOB43[id], W = WEAPONS[FZ_SYMBOL[id]], T = FZ_TRIAL[id];
    return cxCard({ job: id, col: JOB_COL[id], ic: JOBS[id].ic, nm: JOBS[id].name + ' · ' + X.nm, tag: '기본 무기 ' + W.name, lines: [`<b>${esc(X.ds)}</b>`, cxChips([['이름', esc(X.pre + ' + 무기 이름')], ['2차 전직 시련', esc(T.nm)]]), `<details class="acc"><summary>시련 조건</summary><div class="cxg"><div><b>${esc(T.nm)}</b><span>${esc(T.ds)} · 미달 시 전직 후 3페이즈 돌파로 개방</span></div></div></details>`] }); }).join('');
  return '<p class="hint">전직 시 상징 무기가 기본 무기 칸으로 이동 · 무기 칸 무기와 기본 무기가 모두 Lv 5(각성 완료)면 레벨업에 연성 카드 등장 · 선택한 칸이 직업 특화 연성 무기로 변신 (분기·각성 계승) · 모든 칸 연성 후에도 기본 무기 계속 발동</p>' + jobs;
};
