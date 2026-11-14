/* ===== 0.41 직업 정체성 =====
   회차 44 확정 초안(2026-11-07) 기준 — 직업마다 게임 규칙 1개를 바꾸는 핵심 규칙 + 2차 전직 변화
   — 기존 계열 변환 규칙 10종 폐지 (jobplus.js wxOn 비활성), 직업 색 발광은 유지
   — 연성은 0.42 (본 파일은 핵심 규칙·2차 전직만)
   — 그래픽: 기존 효과(fx ring·pop·zap·slash)·기존 포탑/망령 그리기 재사용, 신규 원화는 GPT 요청 목록으로 이관 */
const V41 = {
  war: { store: 0.5, storeK: 4, storeKLv: 0.25, storeR: 72, storeCap: 2.5, rage: 8, rageB: 12, rageArea: 1.5, berMax: 0.6, guardK: 0.5, guardR: 96 },
  rog: { slots: 3, echo: 0.6, echoT: 0.22, durDmg: 1.6, clone: 0.4, cloneT: 0.42, tp: 2, tpR: 220 },
  sov: { cards: 1, xp: 1.3, guards: 2, guardsB: 4, gR: 62, gAtk: 0.7, gDmg: 12, gDmgLv: 1 },
  arc: { step: 0.5, max: 5, crit: 0.06, dmg: 0.04, snipeCd: 2.5, snipe: 60, snipeLv: 5, hawkCd: 1.6, hawk: 18, hawkLv: 1.5 },
  eng: { slots: 2, slotDmg: 1.15, every: 5, n: 3, mDmg: 1.6, mR: 48, mRA: 2, walk: 150 },
  chr: { R: 150, slow: 0.7, eb: 0.7, stack: 0.25, rewind: 3, rwMin: 0.3, rwInv: 1.5 },
  mag: { cd: 4, cdB: 3, dmg: 2.2, fair: 1.1, gap: 0.06, cdMin: 0.6 },
  sum: { self: 0.6, mDmg: 0.5, mCd: 2.6, start: 2, gDmg: 1.2, gCd: 0.9, gR: 16 },
  pri: { need: 0.05, R: 100, d: 18, dLv: 1.8, k: 4, saintHeal: 1.3, saintSh: 0.15, saintCd: 12 },
  dru: { xp: 1.5 },
};
const DUR41 = { spin: 1, flail: 1, beam: 1 };          // 지속형 무기: 재발동 대신 피해 배율로 처리

/* ---------- 설명 문구 교체 ---------- */
const JOB41 = {
  warrior: { tag: '맞을수록 강해지는 자', craft: '거신화', rule: '받은 피해 50% 저장 → 다음 근접 명중 시 주변 폭발로 되돌림, 투지 최대 시 8초 격노(근접 범위 1.5배)', cds: 'A 형태를 B 전달로 내보내되 크기 2배, 투지 비례 추가 확대' },
  rogue: { tag: '하나를 두 번 쓰는 자', craft: '그림자 분담', rule: '무기 칸 5 → 3, 모든 무기가 그림자 재현으로 2회 발동(2번째 60%), 이동 치명·근접 통과 무적 유지', cds: '분신 2체가 A·B를 나눠 맡아 플레이어 궤적을 따라 공격' },
  sovereign: { tag: '고를 수 있는 자', craft: '왕의 병기', rule: '레벨업 선택지 3 → 4장, 군기 안 경험치 1.3배·피해 +25%·받는 피해 -15%, 근위병 2기가 군기 수호', cds: '근위병이 연성 무기를 들고 전방 진형으로 동시 공격' },
  archer: { tag: '멈춰서 쏘는 자', craft: '사냥 화살', rule: '정지 시 0.5초마다 집중 누적(최대 5, 치명 +6%·피해 +4%씩), 이동 시 해제, 모든 조준이 표식 적 우선', cds: 'A 형태를 화살촉으로 장착, 고속 직선 사출 후 다음 적으로 꺾여 연속 명중' },
  engineer: { tag: '무기를 설치하는 자', craft: '병기 포대', rule: '무기 칸 2개가 포탑 칸, 포탑 칸 무기는 포탑 위치에서 발동(피해 +15%), 포탑 5발마다 범위 미사일 3발', cds: '연성 무기를 탑재한 대형 포대 설치, 6발마다 미사일 3연발' },
  chrono: { tag: '시간을 다루는 자', craft: '시간 메아리', rule: '주변 반경 안 적·적 탄환 30% 상시 감속, 반경 안 명중 5중첩 시 1.5초 정지', cds: '연성 무기 공격이 1초 뒤 같은 자리에서 반복, 정지 적에게 반복 피해 2배' },
  mage: { tag: '몰아서 터뜨리는 자', craft: '원소 연성', rule: '무기 개별 발동 폐지, 4초마다 모든 무기 동시 시전(피해 2.2배), 무기마다 속성 순환·원소 반응 유지', cds: '연성 무기가 6개로 분열해 공전 후 차례로 사출, 사출마다 속성 순환' },
  summoner: { tag: '남에게 싸우게 하는 자', craft: '망령 무장', rule: '직접 공격 피해 -40%, 망령이 보유 무기를 무작위로 들고 공격, 처치 시 망령 소환 유지', cds: '연성 무기를 든 망령 2체가 자율 비행, 처치 시 증원(최대 4)' },
  priest: { tag: '회복이 공격이 되는 자', craft: '성물', rule: '체력 가득 상태의 초과 회복량이 주변 신성 폭발로 전환, 처치 40회 정화 유지', cds: '연성 무기가 머리 위 성물로 떠서 공격, 회복마다 추가 발동' },
  druid: { tag: '함께 자라는 자', craft: '야수 무장', rule: '늑대·곰 동료 독립 성장, 레벨업 선택지 1장은 항상 동료 강화, 동료 처치 경험치 1.5배', cds: '곰은 A 형태로 강타, 늑대는 B 전달 방식으로 돌진' },
};
const JOB2_41 = {
  berserk: '체력이 낮을수록 피해 증가(최대 +60%), 격노 12초', guard: '저장 피해를 즉시 주변 방벽 반사로 전환, 투지 최대 시 보호막',
  assassin: '치명타 피해 3배, 처치 시 다음 적 앞으로 순간 이동(2초 재사용)', dancer: '분신 1체 상시 동행, 분신 위치에서 같은 공격 1회 더(40%)',
  conqueror: '군기를 들고 이동(이동 진지), 군기 안 적 지속 피해', benevolent: '군기 안 초당 체력 2% 회복, 근위병 4기',
  sniper: '집중 최대 시 2.5초마다 화면 관통 일발, 표식 3개 폭발', hunter: '매가 표식 적을 자동 사냥(표식 +2)',
  artillery: '포탑 최대 4, 미사일 범위 2배·포탄 착탄 폭발', mechanic: '포탑이 보행 기계로 바뀌어 플레이어를 따라 이동, 발사 속도 1.5배',
  accel: '이동 속도 +15%, 무기 재사용 -12%', rewind: '판당 1회 치명 피해 시 3초 전 체력으로 되감기, 정지 적 피해 +50%',
  elemental: '원소 반응 피해 1.7배·범위 1.4배', archmage: '동시 시전 주기 4 → 3초',
  necro: '소환 확률 2배, 망령 최대 10', lord: '망령이 거대 망령 1체로 통합(피해 2.4배·1초마다 무기 사용)',
  judge: '전환 폭발 피해 2배, 정화 폭발 강화', saint: '회복량 +30%, 초과분 누적 시 보호막(12초 재사용)',
};
for (const j in JOB41) {
  const N = JOB41[j]; JOBS[j].rule = N.rule;
  Object.assign(JOB_WX[j], { pre: N.craft, tag: N.tag, ds: N.cds });
}
for (const j in JOB2) for (const o of JOB2[j]) if (JOB2_41[o.k]) { const i = o.ds.indexOf(' · 궁극기:'); o.ds = JOB2_41[o.k] + (i >= 0 ? o.ds.slice(i) : ''); }
JOBS.engineer.name = '기술자';

/* ---------- 공통 상태 ---------- */
const J41 = () => G.j41 || (G.j41 = { store: 0, focus: 0, focT: 0, ovh: 0, hist: [], rw: false, vol: 0, volN: 0, tpT: 0, clone: null, gd: [], hawkT: 0, snipeT: 0, shT: 0 });
const inChrono = e => G.p.job === 'chrono' && dist2(e.x, e.y, G.p.x, G.p.y) < V41.chr.R * V41.chr.R;
function chronoSlow(e) { return inChrono(e) && !e.gk ? V41.chr.slow : 1; }
function chronoBullet(b) { return G.p.job === 'chrono' && dist2(b.x, b.y, G.p.x, G.p.y) < V41.chr.R * V41.chr.R ? V41.chr.eb : 1; }
const engSlots = () => G.p.weapons.filter(w => !DUR41[w.id]).slice(0, V41.eng.slots);
function atPos(x, y, f) { const p = G.p, ox = p.x, oy = p.y; p.x = x; p.y = y; try { return f(); } finally { p.x = ox; p.y = oy; } }
function scaleS(S, k) { return Object.assign({}, S, { dmg: S.dmg * k }); }

/* ---------- 무기 수치 ---------- */
const _wStats41 = wStats;
wStats = function (w) {
  const S = _wStats41(w), p = G.p; if (!p || !p.job) return S;
  const D = WEAPONS[w.id];
  if (p.job === 'warrior' && G.tm.rage > 0 && D.cat === 'melee') S.area *= V41.war.rageArea;
  if (p.job === 'rogue' && DUR41[w.id]) S.dmg *= V41.rog.durDmg;
  if (p.job === 'summoner') S.dmg *= V41.sum.self;
  return S;
};

/* ---------- 무기 발동: 도적 재현 · 기술자 포탑 칸 · 마법사 동시 시전 · 소환사 망령 ---------- */
updateWeapons = function (dt) {
  const p = G.p, J = p.job && J41(), mage = p.job === 'mage', eng = p.job === 'engineer' ? engSlots() : null;
  let ti = 0;
  for (const w of p.weapons) {
    const S = wStats(w);
    if (w.id === 'spin') { updateSpin(w, S, dt); continue; }
    if (mage) continue;
    w.t -= dt * ultCdMul();
    if (w.t <= 0) {
      let r;
      if (eng && eng.includes(w) && G.turrets.length) { const t = G.turrets[ti++ % G.turrets.length]; r = atPos(t.x, t.y, () => WEAPON_FIRE[w.id](w, scaleS(S, V41.eng.slotDmg))); if (r !== false) fx({ kind: 'ring', x: t.x, y: t.y, r0: 4, r1: 20, dur: 0.2, color: '#ffd890' }); }
      else r = WEAPON_FIRE[w.id](w, S);
      w.t = r === false ? 0.25 : S.cd; if (r !== false) rcFire(w);
      if (r !== false && p.job === 'rogue' && !DUR41[w.id]) rogueEcho(w, S);
      if (r !== false && pBr('haste') === 'echo' && Math.random() < 0.12) w.t = 0.05;
    }
  }
  if (mage) mageVolley(dt, J);
  updateTraps(dt); updateArsenal(dt);
  for (const L of G.later) { L.t -= dt; if (L.t <= 0) { L.done = true; L.f(); } }
  if (G.later.length) G.later = G.later.filter(L => !L.done);
};
function rogueEcho(w, S) {
  const C = V41.rog, p = G.p;
  G.later.push({ t: C.echoT, f: () => { if (G.result || !p.weapons.includes(w)) return; fx({ kind: 'pop', x: p.x, y: p.y, r: 14, color: '#203040', dur: 0.2 }); WEAPON_FIRE[w.id](w, scaleS(S, C.echo)); } });
  if (p.job2 === 'dancer') G.later.push({ t: C.cloneT, f: () => { const c = J41().clone; if (G.result || !c || !p.weapons.includes(w)) return; atPos(c.x, c.y, () => WEAPON_FIRE[w.id](w, scaleS(S, C.clone))); markSummonAttack(c, Math.atan2(p.face.y, p.face.x)); fx({ kind: 'pop', x: c.x, y: c.y, r: 12, color: '#7fe0c0', dur: 0.2 }); } });
}
function mageVolley(dt, J) {
  const C = V41.mag, p = G.p;
  J.vol -= dt * ultCdMul(); if (J.vol > 0) return;
  J.vol = J.volP = (p.job2 === 'archmage' ? C.cdB : C.cd) * Math.max(C.cdMin, p.mod.cd); J.volN++;
  const list = p.weapons.filter(w => w.id !== 'spin');
  list.forEach((w, i) => G.later.push({ t: i * C.gap, f: () => { if (G.result || !p.weapons.includes(w)) return; const S = wStats(w), r = WEAPON_FIRE[w.id](w, scaleS(S, Math.max(C.dmg, J.volP / S.cd * C.fair))); /* 재사용이 짧은 무기는 주기 손실분 보전 */ if (r !== false) rcFire(w); } }));
  if (list.length) { fx({ kind: 'ring', x: p.x, y: p.y, r0: 8, r1: 70, dur: 0.3, color: '#e8b0ff', follow: true }); G.stats.volleys = (G.stats.volleys || 0) + 1; }
}
/* 마법사 속성: 무기(피해원)마다 다른 속성, 동시 시전마다 순환 → 동시 명중 시 원소 반응 */
const SRC41 = Object.keys(SRC_CAT);
const _onEnemyHit41 = onEnemyHit;
onEnemyHit = function (e, o) {
  const p = G.p, src = o.src;
  if (p.job === 'mage' && SRC_CAT[src]) { const had = src in ELEM, old = ELEM[src]; ELEM[src] = ['fire', 'ice', 'bolt'][(SRC41.indexOf(src) + J41().volN) % 3]; try { _onEnemyHit41(e, o); } finally { if (had) ELEM[src] = old; else delete ELEM[src]; } }
  else _onEnemyHit41(e, o);
  if (e.dead || !p.job) return;
  if (p.job === 'warrior') { warStoreHit(e, o); if (SRC_CAT[src] === 'melee' && !(G.tm.rage > 0)) { p.fury = Math.min(100, p.fury + 1); G.tm.furyHold = Math.max(G.tm.furyHold || 0, 1); } }   // 근접 명중 투지 +1 (기존 변환 규칙 흡수)
  if (p.job === 'chrono' && inChrono(e) && !e.boss && !RANGED_SRC[src] && !(e.tw41 > G.time)) { e.tw41 = G.time + V41.chr.stack; e.tw = (e.tw || 0) + 1; e.slowT = Math.max(e.slowT || 0, 1); if (e.tw >= 5 && !e.cmd) { e.tw = 0; e.frz = 1.5; } }
};

/* ---------- 전사: 피해 저장·격노 ---------- */
function warStoreHit(e, o) {
  const J = J41(), C = V41.war, p = G.p;
  if (p.job2 === 'guard' || J.store <= 0 || SRC_CAT[o.src] !== 'melee') return;
  const d = J.store * (C.storeK + C.storeKLv * p.level) * p.mod.dmg, x = e.x, y = e.y; J.store = 0;
  G.later.push({ t: 0, f: () => { fx({ kind: 'ring', x, y, r0: 8, r1: C.storeR, dur: 0.3, color: '#ff8a5a', fill: true }); gridQuery(x, y, C.storeR, t => damageEnemy(t, d, { src: 'w_store', kb: 140, fx: x, fy: y })); } });
}
function warHurt(lost) {
  const J = J41(), C = V41.war, p = G.p;
  if (p.job2 === 'guard') { const d = lost * C.storeK * C.guardK * (1 + 0.06 * p.level) * p.mod.dmg; fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: C.guardR, dur: 0.3, color: '#8fd0ff', follow: true }); gridQuery(p.x, p.y, C.guardR, t => damageEnemy(t, d, { src: 'w_store', kb: 160, fx: p.x, fy: p.y })); return; }
  J.store = Math.min(p.maxHp * C.storeCap, J.store + lost * C.store);
}
function warTick(dt) {
  const p = G.p, T = G.tm, C = V41.war;
  if (T.rage > 0) { T.rage -= dt; p.fury = 100; T.furyHold = 1; if (T.rage <= 0) { p.fury = 0; } }
  else if (p.fury >= 100) { T.rage = p.job2 === 'berserk' ? C.rageB : C.rage; toast('격노', '#ff6a3a'); fx({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: 110, dur: 0.4, color: '#ff6a3a', follow: true }); G.stats.rages = (G.stats.rages || 0) + 1; }
}

/* ---------- 피해 배율 ---------- */
const _jobDmgMul41 = jobDmgMul;
jobDmgMul = function (e, o) {
  let m = _jobDmgMul41(e, o); const p = G.p, J = G.j41;
  if (p.job === 'warrior' && p.job2 === 'berserk') m *= 1 + V41.war.berMax * (1 - p.hp / p.maxHp);
  if (p.job === 'archer' && J && J.focus) { m *= 1 + V41.arc.dmg * J.focus; if (!o.crit && Math.random() < V41.arc.crit * J.focus) { m *= 2; o.crit = true; } }
  if (p.job === 'chrono' && p.job2 === 'rewind' && e.frz > 0) m *= 1;   // 기존 1.5배 유지 (job.js)
  return m;
};

/* ---------- 피격: 전사 저장 · 시간술사 되감기 ---------- */
const _hurtPlayer41 = hurtPlayer;
hurtPlayer = function (dmg, src, e) {
  const p = G.p, h0 = p.hp; _hurtPlayer41(dmg, src, e);
  const lost = h0 - p.hp; if (lost <= 0 || !p.job) return;
  if (p.job === 'warrior') warHurt(lost);
  const J = J41();
  if (G.result === 'dead' && p.job === 'chrono' && p.job2 === 'rewind' && !J.rw) {
    J.rw = true; G.result = null; G.endT = 0;
    const old = J.hist.length ? J.hist[0].hp : 0; p.hp = Math.max(old, p.maxHp * V41.chr.rwMin); p.invT = V41.chr.rwInv;
    fx({ kind: 'ring', x: p.x, y: p.y, r0: 200, r1: 10, dur: 0.6, color: '#c8c0ff', follow: true }); toast('되감기', '#c8c0ff'); G.stats.rewound = 1;
  }
};

/* ---------- 회복: 사제 초과 회복 폭발 ---------- */
const _heal41 = heal;
heal = function (v, src) {
  const p = G.p; if (p.job !== 'priest' || hasCond('noheal')) return _heal41(v, src);
  if (p.job2 === 'saint') v *= V41.pri.saintHeal;
  const want = v * (hasCurse('blight') ? 0.6 : 1), h0 = p.hp; _heal41(v, src);
  const J = J41(), ex = want - (p.hp - h0); if (ex <= 0) return;
  J.ovh += ex; J.ovS = (J.ovS || 0) + ex;
  const C = V41.pri;
  if (p.job2 === 'saint' && J.ovS >= p.maxHp * C.saintSh && G.time >= J.shT && !p.shield) { J.ovS = 0; J.shT = G.time + C.saintCd; p.shield = true; toast('성자의 가호', '#fff2a8'); }
  if (J.ovh >= p.maxHp * C.need) {
    const k = J.ovh / p.maxHp; J.ovh = 0; const d = (C.d + C.dLv * p.level) * p.mod.dmg * (1 + k * C.k) * (p.job2 === 'judge' ? 2 : 1), x = p.x, y = p.y;
    G.later.push({ t: 0, f: () => { fx({ kind: 'ring', x, y, r0: 10, r1: C.R, dur: 0.35, color: '#fff2a8', fill: true }); gridQuery(x, y, C.R, t => damageEnemy(t, d, { src: 'overheal', kb: 120, fx: x, fy: y })); } });
    G.stats.overheal = (G.stats.overheal || 0) + 1;
  }
};

/* ---------- 경험치: 군주 군기 · 드루이드 동료 처치 ---------- */
const _addXp41 = addXp;
addXp = function (v) { if (G.p.job === 'sovereign' && inBanner()) v *= V41.sov.xp; return _addXp41(v); };
const _killEnemy41 = killEnemy;
killEnemy = function (e) {
  const p = G.p; G._xk41 = p.job === 'druid' && (e.ls === 'pet' || /^pet|bleed/.test(e.ls || '') || e.lpk) ? V41.dru.xp : 1;
  try { _killEnemy41(e); } finally { G._xk41 = 1; }
  if (p.job === 'rogue' && p.job2 === 'assassin' && !G.result) rogueTp();
};
function rogueTp() {
  const J = J41(), p = G.p, C = V41.rog; if (G.time < J.tpT) return;
  const t = _nearestEnemy(p.x, p.y, C.tpR); if (!t) return;
  J.tpT = G.time + C.tp; const a = Math.atan2(p.y - t.y, p.x - t.x);
  fx({ kind: 'pop', x: p.x, y: p.y, r: 14, color: '#203040', dur: 0.25 });
  p.x = t.x + Math.cos(a) * (t.r + 18); p.y = t.y + Math.sin(a) * (t.r + 18); p.invT = Math.max(p.invT, 0.3);
  fx({ kind: 'pop', x: p.x, y: p.y, r: 14, color: '#7fe0c0', dur: 0.25 }); G.stats.tps = (G.stats.tps || 0) + 1;
}

/* ---------- 궁수: 표식 적 우선 조준 ---------- */
const _nearestEnemy41 = nearestEnemy;
nearestEnemy = function (x, y, maxR = 600) {
  if (G.p.job !== 'archer' || G.aimHi) return _nearestEnemy41(x, y, maxR);
  let best = null, bs = 1e18;
  gridQuery(x, y, maxR, e => { if (e.dead || !(e.mk > 0)) return; const s = dist2(x, y, e.x, e.y) / (1 + e.mk); if (s < bs) { bs = s; best = e; } });
  return best || _nearestEnemy41(x, y, maxR);
};

/* ---------- 레벨업 카드: 군주 4장 · 드루이드 동료 강화 ---------- */
const _drawCards41 = drawCards;
drawCards = function (n, ex = []) {
  const p = G.p, lv = n === selN();
  if (p.job === 'sovereign' && lv) n += V41.sov.cards;
  const r = _drawCards41(n, ex);
  if (p.job === 'druid' && lv && G.pets && G.pets.length && !r.some(c => c.t === 'pet')) {
    const k = ['wolf', 'bear'].filter(q => G.pets.some(m => m.kind === q) && bondOf(q).lv < BOND_CFG.maxLv).sort((a, b) => bondOf(a).lv - bondOf(b).lv)[0];
    if (k) { const c = { t: 'pet', id: k }; if (r.length >= n) r[r.length - 1] = c; else r.push(c); }
  }
  return r;
};
const _cardInfo41 = cardInfo;
cardInfo = function (c) {
  if (c.t !== 'pet') return _cardInfo41(c);
  const B = bondOf(c.id);
  return { k: 'k-relic', col: '#7fd07a', ic: PET[c.id].ic, nm: PET[c.id].name + ' 강화', tag: `동료 · 유대 Lv ${B.lv} → ${B.lv + 1}`, ds: `${PET[c.id].name} 유대 1레벨 즉시 상승 (피해·공격 속도·범위 증가, 5·10·15레벨 전용 능력)` };
};
const _applyCard41 = applyCard;
applyCard = function (c) {
  if (c.t !== 'pet') return _applyCard41(c);
  const B = bondOf(c.id); G.stats.picks.push(G.p.level - G.pendingLv + ':pet:' + c.id);
  bondXp(c.id, bondNeed(B.lv) - B.xp + 0.001); recalc();
};
const _cardScore41 = cardScore;
cardScore = function (c) { return c.t === 'pet' ? 4.6 : _cardScore41(c); };

/* ---------- 포탑: 미사일 일제 · 보행 기계 ---------- */
function missileVolley(t, n) {
  const p = G.p, C = V41.eng, R = C.mR * (p.job2 === 'artillery' ? C.mRA : 1), d = turretDmg() * C.mDmg;
  const ts = shuffle(enemiesInRange(t.x, t.y, 380)).slice(0, n);
  if (ts.length) markInstallationShot(t, Math.atan2(ts[0].y - t.y, ts[0].x - t.x));
  for (const e of ts) {
    const x = e.x, y = e.y, duration = 0.3;
    fx({ kind: 'zap', x: t.x, y: t.y, x2: x, y2: y, dur: 0.2, installationArt: 'missile' });
    const delay = { t: duration, f: () => { if (!G.result) explode(x, y, R, d, 'missile', '#ffb060'); } };
    INSTALLATION_FLIGHTS.set(delay, { x: t.x, y: t.y, x2: x, y2: y, duration });
    G.later.push(delay);
  }
  if (ts.length) G.stats.missiles = (G.stats.missiles || 0) + ts.length;
}
const _updateTurrets41 = updateTurrets;
updateTurrets = function (dt) {
  const p = G.p, C = V41.eng;
  const n0 = G.proj.length;
  _updateTurrets41(dt);
  if (p.job !== 'engineer') return;
  for (let i = n0; i < G.proj.length; i++) { const pr = G.proj[i]; if (pr.src !== 'turret') continue; const t = G.turrets.find(q => Math.abs(q.x - pr.x) < 1 && Math.abs(q.y - pr.y) < 1); if (t) { if (p.job2 === 'mechanic' && !t.temp) markSummonAttack(t, pr.ang); t.n = (t.n || 0) + 1; if (t.n >= C.every) { t.n = 0; missileVolley(t, C.n); } } }   // 포탑 발사 집계 → 5발마다 미사일
  for (const t of G.turrets) {
    if (p.job2 === 'mechanic' && !t.temp) {
      const i = G.turrets.indexOf(t), a = i * 2.1 + G.time * 0.3, tx = p.x + Math.cos(a) * 70, ty = p.y + Math.sin(a) * 70, dx = tx - t.x, dy = ty - t.y, d = Math.hypot(dx, dy) || 1;
      if (d > 6) { const s = Math.min(d, C.walk * dt); t.x += dx / d * s; t.y += dy / d * s; }
    }
  }
};
const _useUlt41 = useUlt;
useUlt = function () { const r = _useUlt41.apply(this, arguments); if (G.p.job === 'engineer') for (const t of G.turrets) missileVolley(t, V41.eng.n); return r; };

/* ---------- 소환사: 망령 무기 사용 · 거대 망령 ---------- */
function minionWeapons(dt) {
  const p = G.p, C = V41.sum, ws = p.weapons.filter(w => !DUR41[w.id]); if (!ws.length) return;
  const lord = p.job2 === 'lord';
  if (lord) {
    if (G.minions.length > 1 || (G.minions[0] && !G.minions[0].giant)) G.minions = G.minions.filter(m => m.giant).slice(0, 1);
    if (!G.minions.length) G.minions.push({ id: ++G.pid, x: p.x, y: p.y, r: C.gR, life: 1e9, hitT: 0, giant: true });
  }
  for (const m of G.minions) {
    m.wt = (m.wt == null ? rand(0.3, C.mCd) : m.wt) - dt; if (m.wt > 0) continue;
    m.wt = lord ? C.gCd : C.mCd;
    const w = pick(ws), S = _wStats41(w), k = lord ? C.gDmg : C.mDmg;
    atPos(m.x, m.y, () => WEAPON_FIRE[w.id](w, scaleS(S, k)));
    if (m.giant) markSummonAttack(m, (m.vx || 0) < 0 ? Math.PI : 0);
    fx({ kind: 'pop', x: m.x, y: m.y, r: m.r + 4, color: '#b89cff', dur: 0.2 });
  }
}

/* ---------- 군주: 근위병 · 이동 진지 ---------- */
function sovTick(dt) {
  const p = G.p, C = V41.sov, J = J41(), b = G.banner;
  if (b && p.job2 === 'conqueror') { b.x = p.x; b.y = p.y; }
  const n = b ? (p.job2 === 'benevolent' ? C.guardsB : C.guards) : 0;
  while (J.gd.length < n) J.gd.push({ x: p.x, y: p.y, t: 0, a: 0 });
  J.gd.length = n;
  J.gd.forEach((g, i) => {
    const a = i * Math.PI * 2 / n + G.time * 0.6, tx = b.x + Math.cos(a) * b.r * 0.55, ty = b.y + Math.sin(a) * b.r * 0.55;
    g.x += (tx - g.x) * Math.min(1, dt * 6); g.y += (ty - g.y) * Math.min(1, dt * 6);
    g.t -= dt; if (g.t > 0) return;
    const e = _nearestEnemy41(g.x, g.y, C.gR); if (!e) return;
    g.t = C.gAtk; g.a = Math.atan2(e.y - g.y, e.x - g.x);
    markSummonAttack(g, g.a);
    fx({ kind: 'slash', x: e.x, y: e.y, a: g.a, dur: 0.2, color: '#ffd24a' });
    damageEnemy(e, (C.gDmg + C.gDmgLv * p.level) * p.mod.dmg, { src: 'guardian', kb: 90, fx: g.x, fy: g.y });
  });
}

/* ---------- 궁수: 집중 · 저격 · 매 ---------- */
function arcTick(dt) {
  const p = G.p, C = V41.arc, J = J41();
  if (p.moving) { J.focus = 0; J.focT = 0; }
  else { J.focT += dt; while (J.focT >= C.step) { J.focT -= C.step; if (J.focus < C.max) { J.focus++; if (J.focus === C.max) fx({ kind: 'ring', x: p.x, y: p.y, r0: 6, r1: 40, dur: 0.3, color: '#b8ff9a', follow: true }); } } }
  G.stats.focusMax = Math.max(G.stats.focusMax || 0, J.focus);
  if (p.job2 === 'sniper' && J.focus >= C.max) {
    J.snipeT -= dt;
    if (J.snipeT <= 0) { J.snipeT = C.snipeCd; const d = (C.snipe + C.snipeLv * p.level) * p.mod.dmg; shoot({ kind: 'arrow', x: p.x, y: p.y, ang: aimAng(900), sp: 1300, r: 8, dmg: d, pierce: 99, life: 0.9, color: '#fff6a0', src: 'snipe' }); fx({ kind: 'ring', x: p.x, y: p.y, r0: 4, r1: 30, dur: 0.2, color: '#fff6a0', follow: true }); }
  }
  if (p.job2 === 'hunter') {
    J.hawkT -= dt;
    if (J.hawkT <= 0) { J.hawkT = C.hawkCd; const e = nearestEnemy(p.x, p.y, 340); if (e) { markHawkDive(p, e); fx({ kind: 'slash', x: e.x, y: e.y, a: rand(Math.PI * 2), dur: 0.25, color: '#e0c890' }); damageEnemy(e, (C.hawk + C.hawkLv * p.level) * p.mod.dmg, { src: 'hawk' }); if (!e.dead) e.mk = (e.mk || 0) + 2; } }
  }
}

/* ---------- 직업 갱신 ---------- */
const _updateJob41 = updateJob;
updateJob = function (dt) {
  _updateJob41(dt);
  const p = G.p; if (!p.job || G.result) return;
  const J = J41();
  J.hist.push({ t: G.time, hp: p.hp }); while (J.hist.length > 2 && G.time - J.hist[0].t > V41.chr.rewind) J.hist.shift();
  if (p.job === 'warrior') warTick(dt);
  if (p.job === 'sovereign') sovTick(dt);
  if (p.job === 'archer') arcTick(dt);
  if (p.job === 'summoner') minionWeapons(dt);
  if (p.job === 'rogue' && p.job2 === 'dancer') { const c = J.clone || (J.clone = { x: p.x, y: p.y }); c.x += (p.x - p.face.x * 34 - c.x) * Math.min(1, dt * 4); c.y += (p.y - p.face.y * 34 - c.y) * Math.min(1, dt * 4); }
};

/* ---------- 전직 적용 ---------- */
const _applyJob41 = applyJob;
applyJob = function (id) {
  G.j41 = null; _applyJob41(id); const p = G.p;
  if (id === 'rogue' && p.weapons.length > V41.rog.slots) {
    const keep = p.weapons.slice().sort((a, b) => b.lvl - a.lvl).slice(0, V41.rog.slots), gone = p.weapons.filter(w => !keep.includes(w));
    p.weapons = p.weapons.filter(w => keep.includes(w)); recalc();
    toast(`그림자 정리 · ${gone.map(w => WEAPONS[w.id].name).join('·')} 해제`, '#7fe0c0');
  }
  if (id === 'summoner') for (let i = 0; i < V41.sum.start; i++) addMinion(p.x + rand(-30, 30), p.y + rand(-30, 30));
  if (id === 'mage') J41().vol = 1;
  toast(JOB41[id].tag + ' · ' + JOBS[id].rule.split(',')[0], JOB_COL[id]);
  G.stats.jobRule = 41;
};
const _applyJob2_41 = applyJob2;
applyJob2 = function (k) { _applyJob2_41(k); if (k === 'lord') G.minions = []; };

/* 소환물 원화는 위험 예고보다 먼저 그린다. 기존 문양·대체 표시는 원래 순서를 유지한다. */
function drawJob41(c, inView) {
  const p = G.p, J = G.j41; if (!p.job) return;
  if (inView) {
    c.save();
    c.imageSmoothingEnabled = true;
    const charge = Math.min(1, (J?.store || 0) / (p.maxHp * 0.5));
    if (p.job === 'archer' && J?.focus && !drawFocusArrows(c, p, J)) {
      c.fillStyle = '#b8ff9a';
      for (let i = 0; i < J.focus; i++) c.fillRect(p.x - 13 + i * 6, p.y - p.r - 16, 4, 4);
    }
    if (p.job === 'warrior' && !drawStoredPlates(c, p, charge) && charge > 0) {
      c.strokeStyle = '#ff8a5a'; c.lineWidth = 3; c.beginPath();
      c.arc(p.x, p.y, p.r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * charge); c.stroke();
    }
    if (p.job === 'warrior' && G.tm.rage > 0 && !drawRageFlames(c, p, G.tm.rage)) {
      c.globalAlpha = 0.25 + 0.15 * Math.sin(G.time * 12);
      c.strokeStyle = '#ff3a2a'; c.lineWidth = 3; c.beginPath(); c.arc(p.x, p.y, p.r + 11, 0, 7); c.stroke();
    }
    if (p.job === 'chrono' && !drawChronoDial(c, p)) {
      c.globalAlpha = 0.18; c.strokeStyle = '#c8c0ff'; c.lineWidth = 2; c.setLineDash([6, 8]);
      c.beginPath(); c.arc(p.x, p.y, V41.chr.R, 0, 7); c.stroke();
    }
    c.restore();
    drawArcherMarks(c, inView);
    if (J) {
      J.gd.forEach((g, i) => {
        const flip = Math.cos(g.a) < 0;                       // 0.49 바라보는 방향 기준
        const gr = p.r * 1.55;
        const lunge = g.stab > 0 ? Math.sin((1 - g.stab / 0.18) * Math.PI) * 7 : g.bash > 0 ? Math.sin((1 - g.bash / 0.28) * Math.PI) * 10 : 0;   // 0.49 찌르기·밀치기 내딛기
        const ox = g.x, oy = g.y; g.x += Math.cos(g.a) * lunge; g.y += Math.sin(g.a) * lunge;                                 // 0.48 근위병 화면상 플레이어 1.2배(그림 여백 보정) + 외곽 강조
        if (inView(g.x, g.y, gr * 2)) { c.save(); c.globalAlpha = 0.32; c.fillStyle = '#1a1208'; c.beginPath(); c.ellipse(g.x, g.y + gr * 0.85, gr * 0.9, gr * 0.32, 0, 0, 7); c.fill(); vfxGlow(c, g.x, g.y, gr * 1.55, '#ffd24a', 0.3); c.restore(); }
        drawSummonUnit(c, inView, 'guard', g, gr, flip, 1, i * 0.4);
        g.x = ox; g.y = oy;
      });
      if (J.clone) drawSummonUnit(c, inView, 'clone', J.clone, p.r, p.face.x < 0, 0.68);
    }
    if (p.job === 'archer' && p.job2 === 'hunter') drawSummonHawk(c, inView, p);
    if (p.job === 'engineer' && p.job2 === 'mechanic') {
      G.turrets.forEach((t, i) => {
        if (!t.temp) drawSummonUnit(c, inView, 'walker', t, 13, Math.cos(t.a || 0) < 0, 1, i * 0.4);
      });
    }
    for (const m of G.minions) {
      if (m.giant) drawSummonUnit(c, inView, 'wraith', m, m.r, (m.vx || 0) < 0, 0.89);
    }
    const U = G.U;
    if (U) {
      for (const g of U.giants) {
        drawSummonUnit(c, inView, 'wraith', g, g.r, (g.vx || 0) < 0, 0.85 * Math.min(1, g.t));
      }
      if (U.dance > 0) {
        U.clones.forEach((s, i) => drawSummonUnit(c, inView, 'clone', s, p.r, Math.sin(s.a) > 0, 0.55, i));
      }
    }
    return;
  }
  if (!J) return;
  c.save();
  if (!summonUnitReady('guard')) for (const g of J.gd) { const gr = G.p.r * 1.2; vfxGlow(c, g.x, g.y, gr * 1.55, '#ffd24a', 0.3); c.fillStyle = '#ffd24a'; c.strokeStyle = '#5a4210'; c.lineWidth = 2.5; c.beginPath(); c.arc(g.x, g.y, gr, 0, 7); c.fill(); c.stroke(); c.strokeStyle = '#fff6d0'; c.lineWidth = 2; c.beginPath(); c.moveTo(g.x, g.y); c.lineTo(g.x + Math.cos(g.a) * gr * 1.7, g.y + Math.sin(g.a) * gr * 1.7); c.stroke(); }   // 0.48 1.2배·창 표시
  if (J.clone && !summonUnitReady('clone')) { c.globalAlpha = 0.45; c.fillStyle = '#203040'; c.beginPath(); c.arc(J.clone.x, J.clone.y, p.r, 0, 7); c.fill(); c.globalAlpha = 1; }
  if (!summonUnitReady('wraith')) for (const m of G.minions) if (m.giant) { c.globalAlpha = 0.35; c.fillStyle = '#b89cff'; c.beginPath(); c.arc(m.x, m.y, m.r + 4, 0, 7); c.fill(); c.globalAlpha = 1; }
  c.restore();
}
const _drawJobAura41 = drawJobAura;
drawJobAura = function (c) { _drawJobAura41(c); drawJob41(c); };
