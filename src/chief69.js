/* ============================================================
   0.69 우두머리 페이즈 (회차 102, 대규모 밸런스 구조 추가) — 기준: docs/BALANCE_TODO.md 진행 방식(회차 99 사용자 결정)
   • 판마다 중반에 '우두머리' 페이즈 1회: 정예보다 크고 세고 체력 많음, 몬스터마다 고유 패턴 기술 1개
   • 처치 보상 = 보물 상자 3개 (레벨업 카드 3회), 120초 안에 못 잡으면 우두머리 퇴각·보상 없음
   • 판 길이 유지: 일반 페이즈를 1개 적게 뽑고(일반 판 7~8 → 6~7, 유형별 2종 보장 유지) 우두머리 1 추가, 재도전 판 제외
   • 유형 '보스' → 돌발 사건·고비 사건 없음, 정예 일정 없음, 시간 정지 중 패턴 멈춤
   • 고정 위치: 페이즈 순서의 가운데, 강함 판정에 따른 순서 바꾸기 대상에서 제외
   • 기존 정예·오우거 전열·수문장과 겹치지 않게 패턴 선택 (돌진 = 수문장 바르간, 대장 추적 = 오우거 전열)
   • 그림: 잡몹 그림 확대 + 금빛 왕관 고리 (임시 도형, 최종본 아님 — GPT 요청 대상)
   ============================================================ */
const CH69 = {
  fail: 120, hp: 2500, rK: 2.5, dmgK: 1.4, spK: 0.85, xp: 60, chests: 3, cd: [5.2, 6.8], first: 2.5,
  jelly: { nm: '젤리 여왕', pat: '분출', tele: 0.8, n: 10, sp: 150, k: 0.6, kids: 4 },                   // 흔들림 예고 → 사방 젤리 탄 10발 + 작은 슬라임 4마리
  gob: { nm: '고블린 두목', pat: '일제 사격', tele: 0.9, n: 5, fan: 0.2, sp: 280, k: 0.7, keep: [170, 240] },   // 예고선 5줄 → 부채꼴 5발, 거리 유지
  knight: { nm: '방패 대장', pat: '도약 내려찍기', tele: 1.1, R: 95, k: 2.2, near: 260 },               // 캐릭터 자리에 예고 원 → 뛰어올라 내려찍기
  mush: { nm: '버섯 군주', pat: '포자 폭발', tele: 1.3, n: 4, R: 58, k: 1.6, ring: [60, 150] },          // 캐릭터 주변 예고 원 4개 → 폭발
  types: ['jelly', 'gob', 'knight', 'mush'],
};
PHASES.chief = { name: '우두머리 출현', type: '보스', goal: 'kill', fail: CH69.fail, spawnMul: 0.5, tint: [215, 170, 70],
  hint: '우두머리 처치 (보물 상자 3개)' };
const chiefOf69 = () => G.ph && G.ph.id === 'chief' && G.ph.cmd && G.ph.cmd.chief ? G.ph.cmd : null;

/* ---------- 페이즈 순서: 가운데 고정 ---------- */
const _pickPhaseOrder69 = pickPhaseOrder;
pickPhaseOrder = function (retry) {
  if (retry) return _pickPhaseOrder69(retry);
  const pr = PH_CFG.perRun; PH_CFG.perRun = pr.map(n => n - 1);   // 일반 페이즈 1개 적게 뽑기 (유형별 2종 보장 유지, 교차 검토 반영)
  let o; try { o = _pickPhaseOrder69(retry); } finally { PH_CFG.perRun = pr; }
  o.splice(Math.ceil(o.length / 2), 0, 'chief');
  return o;
};
const _phaseChooseNext69 = phaseChooseNext;
phaseChooseNext = function () {
  const ph = G.ph, ci = ph.order.indexOf('chief');
  if (ci < 0 || ci <= ph.i) return _phaseChooseNext69();
  if (ci === ph.i + 1) { ph.nextAmbush = false; ph.str = strength(); return; }      // 다음이 우두머리면 순서 그대로
  ph.order.splice(ci, 1); _phaseChooseNext69(); ph.order.splice(ci, 0, 'chief');
};

/* ---------- 등장 ---------- */
const _phaseStart69 = phaseStart;
phaseStart = function () {
  _phaseStart69.apply(this, arguments);
  const ph = G.ph; if (ph.id !== 'chief') return;
  const t = pick(CH69.types), C = CH69[t], q = ringAt(VIEW.w * 0.45, VIEW.w * 0.55), e = makeEnemy(t, q.x, q.y), min = G.time / 60;
  e.hp = e.maxHp = CH69.hp * (1 + CFG.scale.hpPerMin * min) * (1 + tierK());
  e.r = ENEMIES[t].r * CH69.rK; e.dmg *= CH69.dmgK; e.speed *= CH69.spK; e.xp = CH69.xp; e.mb = 'chief'; e.cmd = true; e.chief = t;
  e.ai69 = { cd: CH69.first, st: null, t: 0 };
  ph.cmd = e; ph.elites = [];                                   // 정예 일정 없음 (돌발·고비 사건은 '보스' 유형으로 제외)
  const S = S60(); S.chief = S.chief || []; S.chief.push([t, Math.round(G.time), null, 0]);
  banner(C.nm, `${ph.i + 1}/${ph.order.length} · 우두머리 · ${C.pat}`, '#ffd24a', 2.4); shake(4, 0.5); sfx('preview');
};

/* ---------- 패턴 ---------- */
function chiefUpdate69(dt) {
  const e = chiefOf69(); if (!e || e.dead || G.result) return;
  const A = e.ai69, C = CH69[e.chief], p = G.p, dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
  if (eventPaused() || (G.tm && G.tm.alpha > 0)) return;          // 시간 정지 중 패턴 멈춤
  if (A.st) {
    A.t += dt; e.flash = Math.floor(A.t * 14) & 1 ? 0.08 : 0;
    if (A.t >= C.tele) { chiefFire69(e, A, C); A.st = null; A.cd = rand(CH69.cd[0], CH69.cd[1]); }
    return;
  }
  A.cd -= dt;
  if (e.chief === 'gob') { e.hold69 = d < C.keep[0] ? -0.8 : d < C.keep[1] ? 0 : 1; }
  if (A.cd > 0 || d > VIEW.w * 0.75) return;
  if (e.chief === 'knight' && d > C.near) return;
  A.st = e.chief; A.t = 0; A.ang = Math.atan2(dy, dx);
  if (e.chief === 'gob') for (let i = 0; i < C.n; i++) { const a = A.ang + (i - (C.n - 1) / 2) * C.fan; G.hz.push({ k: 'line', x: e.x, y: e.y, dx: Math.cos(a), dy: Math.sin(a), len: 320, w: 10, warn: C.tele, t: 0, dmg: 0, follow: e, src: C.nm }); }
  if (e.chief === 'knight') { A.tx = p.x; A.ty = p.y; gkCircle(A.tx, A.ty, C.R, C.tele, e.dmg * C.k, C.nm); }
  if (e.chief === 'mush') for (let i = 0; i < C.n; i++) { const q = i === 0 ? { x: p.x, y: p.y } : ringAt(C.ring[0], C.ring[1]); gkCircle(q.x, q.y, C.R, C.tele, e.dmg * C.k, C.nm); }
  if (e.chief === 'jelly') fx({ kind: 'ring', x: e.x, y: e.y, r0: e.r, r1: e.r * 1.6, dur: C.tele, color: '#6ad8f0' });
}
function chiefFire69(e, A, C) {
  const st = S60().chief; if (st && st.length) st[st.length - 1][3]++;
  if (e.chief === 'jelly') {
    const a0 = rand(Math.PI * 2);
    for (let i = 0; i < C.n; i++) { const a = a0 + i * Math.PI * 2 / C.n; gkShot(e.x, e.y, Math.cos(a) * C.sp, Math.sin(a) * C.sp, e.dmg * C.k, C.nm, '#8fe8ff'); }
    for (let i = 0; i < C.kids; i++) { if (aliveCount() >= CFG.spawn.max) break; const a = rand(Math.PI * 2), k = makeEnemy('slime', e.x + Math.cos(a) * e.r, e.y + Math.sin(a) * e.r); k.kbx = Math.cos(a) * 160; k.kby = Math.sin(a) * 160; k.xp = 1; }
    shake(2, 0.25);
  }
  if (e.chief === 'gob') for (let i = 0; i < C.n; i++) { const a = A.ang + (i - (C.n - 1) / 2) * C.fan; gkShot(e.x, e.y, Math.cos(a) * C.sp, Math.sin(a) * C.sp, e.dmg * C.k, C.nm, '#c8ff7a'); }
  if (e.chief === 'knight') { e.x = A.tx; e.y = A.ty; e.kbx = e.kby = 0; shake(5, 0.35); burst(e.x, e.y, 14, '#c8d2e0', 200, 0.5, 3); }
  if (e.chief === 'mush') shake(2, 0.25);
}
const _updatePhaseGimmick69 = updatePhaseGimmick;
updatePhaseGimmick = function (P, dt) { _updatePhaseGimmick69(P, dt); chiefUpdate69(dt); };
/* 이동: 예고 중 정지, 고블린 두목 거리 유지 (e.mb = 'chief' → 잡몹 행동 대신 이 규칙) */
const _mobMove69 = mobMove;
mobMove = function (e, dt, sp, d, dx, dy) {
  if (e.chief) { if (e.ai69 && e.ai69.st) return 0; if (e.chief === 'gob') return sp * (e.hold69 == null ? 1 : e.hold69); return sp; }
  return _mobMove69(e, dt, sp, d, dx, dy);
};

/* ---------- 보상·정리 ---------- */
const _phaseEnd69 = phaseEnd;
phaseEnd = function (outcome) {
  const ph = G.ph;
  if (ph.id === 'chief' && ph.cmd && ph.cmd.chief) {
    const e = ph.cmd, st = S60().chief, ok = outcome === 'ok' && e.dead;
    if (st && st.length) st[st.length - 1][2] = ok ? Math.round(ph.t) : -1;
    if (ok) { for (let i = 0; i < CH69.chests; i++) { const a = i * Math.PI * 2 / CH69.chests - Math.PI / 2; G.chests.push({ x: e.x + Math.cos(a) * 28, y: e.y + Math.sin(a) * 28, r: 14 }); } toast(`${CH69[e.chief].nm} 처치 · 보물 상자 ${CH69.chests}개`, '#ffd24a'); }
    else toast(`${CH69[e.chief].nm} 퇴각`, '#ff9a7a');
    const nm = CH69[e.chief].nm; G.hz = G.hz.filter(h => h.src !== nm); G.eb = G.eb.filter(b => b.src !== nm);   // 남은 예고·탄 정리
  }
  return _phaseEnd69.apply(this, arguments);
};

/* ---------- 그림 (임시 도형): 금빛 왕관 고리·이름 ---------- */
const _drawWeapons69 = drawWeapons;
drawWeapons = function (c) {
  _drawWeapons69.apply(this, arguments);
  const e = chiefOf69(); if (!e || e.dead) return;
  const C = CH69[e.chief], y = e.y - e.r - 6, w = e.r * 0.9;
  c.save(); c.fillStyle = '#ffd24a'; c.strokeStyle = '#5a3a10'; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(e.x - w / 2, y); c.lineTo(e.x - w / 2, y - 8); c.lineTo(e.x - w / 4, y - 4); c.lineTo(e.x, y - 10); c.lineTo(e.x + w / 4, y - 4); c.lineTo(e.x + w / 2, y - 8); c.lineTo(e.x + w / 2, y); c.closePath(); c.fill(); c.stroke();
  if (e.ai69 && e.ai69.st) { c.globalAlpha = 0.5 + 0.4 * Math.sin(G.time * 20); c.strokeStyle = '#ffd24a'; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y, e.r + 6, 0, Math.PI * 2); c.stroke(); }
  c.globalAlpha = 1; c.font = 'bold 10px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#ffe9a8'; c.strokeStyle = '#2a1a08'; c.lineWidth = 3; c.strokeText(C.nm, e.x, y - 14); c.fillText(C.nm, e.x, y - 14);
  c.restore();
};
/* 시험 기록: G.stats.h60.chief = [[종류, 등장 시각, 처치 시간(-1 = 퇴각), 패턴 횟수], ...] */
