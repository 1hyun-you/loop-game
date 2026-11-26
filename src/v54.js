/* ============================================================
   0.54 전면 점검 패치 2차 — 밸런스 (회차 60)
   • 마왕 회전 광선: 예고 1.1 → 1.3초, 발사 직후 0.8초에 걸쳐 회전 가속(처음엔 느림),
     예고 중 회전 방향 표시(휩쓸 쪽 옅은 부채꼴) — 피해·두께·길이는 그대로
   • 자동 플레이: 광선이 곧 지나갈 쪽(회전 앞쪽)을 위험으로 인식, 멀수록 위험 가중(안쪽으로 붙어 회전 방향으로 회피)
   • 연성 배율표 M44 재산정 (dev/vfuse54.js 측정: 짝 무기 단독 대비 연성 후 배율)
   • 초반·직업 보정은 아래 항목별 주석
   • 시험 집계: G.stats.v54 { beamHit, beamN }
   ============================================================ */
const V54 = { bmWarn: 1.3, bmRamp: 0.8, bmRamp0: 0.15, bmLead: 0.9 };
const S54 = () => G.stats.v54 || (G.stats.v54 = { beamHit: 0, beamN: 0 });

/* ---------- 마왕 회전 광선 ---------- */
DM_CFG.bmWarn = V54.bmWarn;
const _dmBeams54 = dmBeams;
dmBeams = function (e) {
  const n0 = G.hz.length; _dmBeams54(e);
  for (let i = n0; i < G.hz.length; i++) { const h = G.hz[i]; if (h.k === 'beam') h.rot0 = h.rot; }
  S54().beamN++;
};
const _dmFx54 = dmFx;
dmFx = function (dt) {
  for (const h of G.hz) if (h.k === 'beam' && h.rot0) h.rot = h.rot0 * clamp((h.t - h.warn) / V54.bmRamp, V54.bmRamp0, 1);
  return _dmFx54(dt);
};
const _hurtPlayer54 = hurtPlayer;
hurtPlayer = function (dmg, src) { if (src === '마왕 광선') S54().beamHit++; return _hurtPlayer54(dmg, src); };
/* 예고 중 회전 방향 표시: 광선이 휩쓸 쪽으로 옅은 부채꼴 + 끝의 화살 표시 */
const _drawDemonGround54 = drawDemonGround;
drawDemonGround = function (c) {
  _drawDemonGround54(c);
  for (const h of G.hz) if (h.k === 'beam' && h.t <= h.warn) {
    const s = Math.sign(h.rot0 || h.rot) || 1, a = Math.min(1, h.t / h.warn), sw = 0.42, a1 = h.a + s * sw;
    const g = c.createRadialGradient(h.x, h.y, h.len * 0.2, h.x, h.y, h.len);
    g.addColorStop(0, 'rgba(190,120,255,0)'); g.addColorStop(1, `rgba(190,120,255,${0.05 + 0.1 * a})`);
    c.fillStyle = g; c.beginPath(); c.moveTo(h.x, h.y); c.arc(h.x, h.y, h.len, Math.min(h.a, a1), Math.max(h.a, a1)); c.closePath(); c.fill();
    for (const k of [0.45, 0.8]) {                                           // 회전 방향 화살 (광선 위 두 지점)
      const R = h.len * k, am = h.a + s * (0.1 + 0.12 * a), x = h.x + Math.cos(am) * R, y = h.y + Math.sin(am) * R, ta = am + s * Math.PI / 2;
      c.save(); c.translate(x, y); c.rotate(ta); c.fillStyle = `rgba(225,190,255,${0.35 + 0.45 * a})`;
      c.beginPath(); c.moveTo(9, 0); c.lineTo(-5, -6); c.lineTo(-1, 0); c.lineTo(-5, 6); c.closePath(); c.fill(); c.restore();
    }
  }
};

/* ---------- 자동 플레이: 광선 회전 앞쪽 회피 ---------- */
/* 광선이 q 지점에 닿기까지 남은 시간(회전 앞쪽 lead초 이내만), 아니면 -1 */
function beamAhead54(h, qx, qy) {
  if (h.k !== 'beam' || h.t < h.warn - 0.6) return -1;
  const rx = qx - h.x, ry = qy - h.y, d = Math.hypot(rx, ry); if (d > h.len + 12 || d < 8) return -1;
  const w = Math.abs(h.rot0 || h.rot) || 0.5, s = Math.sign(h.rot0 || h.rot) || 1;
  let da = (Math.atan2(ry, rx) - h.a) * s; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283;
  const pad = Math.asin(Math.min(1, (h.w / 2 + G.p.r + 14) / d));
  if (da < -pad * 0.5 || da > w * V54.bmLead + pad) return -1;
  return Math.max(0, da - pad) / w + Math.max(0, h.warn - h.t);
}
const _autoDanger54 = autoDanger;
autoDanger = function (qx, qy) {
  let d = _autoDanger54(qx, qy);
  if (G.hz) for (const h of G.hz) if (h.k === 'beam') { const t = beamAhead54(h, qx, qy); if (t >= 0) d += (14 + 22 * Math.min(1, Math.hypot(qx - h.x, qy - h.y) / h.len)) * (1 - t / (V54.bmLead + 1.4)); }
  return d;
};
const _hazT5054 = hazT50;
hazT50 = function (qx, qy) {
  let t = _hazT5054(qx, qy);
  if (G.hz) for (const h of G.hz) if (h.k === 'beam') { const a = beamAhead54(h, qx, qy); if (a >= 0 && a < 0.6) t = Math.min(t, a); }
  return t;
};

/* ---------- 이그나: 물러나는 속도 감소 (근접 구성도 따라붙을 수 있게) · 조준 부채꼴은 예고선 0.45초 뒤 발사(boss.js) ---------- */
const _gkKeep54 = gkKeep;
gkKeep = function (e, d, want, lo, hi) { const r = _gkKeep54(e, d, want, lo, hi); return e.gk === 'igna' && e.strafe && e.strafe.k === -1 ? r * GK_CFG.igBack : r; };

/* ---------- 직업 보정 (0.53 직업 균등 90판: 마법사 2/8 · 궁수 3/9 · 소환사 4/9 / 프리스트 8/9 최고 피해 전부 심판의 빛) ---------- */
Object.assign(V54, { focDecay: 0.5, waveR: 95, waveKb: 230, waveD: 6, waveLv: 0.5, sumSelf: 0.7, priK: 0.5 });
/* 궁수: 이동 시 집중 즉시 해제 → 0.5초마다 1씩 감소 (피하느라 잠깐 움직여도 전부 잃지 않음) */
/* 마법사: 동시 시전 순간 원소 파동 — 주변 적을 밀쳐내 다음 시전까지 숨 돌릴 틈 */
SRC44.mwave54 = '원소 파동'; SRC_CAT.mwave54 = 'magic';
/* 소환사: 직접 공격 피해 -40% → -30% / 프리스트: 심판의 빛 배율 0.55 → 0.5 */
V41.sum.self = V54.sumSelf; V53.priK = V54.priK;
/* 설명 문구 */
JOBS.archer.rule = JOBS.archer.rule.replace('이동 시 해제', '이동 중에는 0.5초마다 1씩 감소');
JOBS.mage.rule += ', 시전 순간 원소 파동으로 주변 적 밀쳐냄';
JOBS.summoner.rule = JOBS.summoner.rule.replace('직접 공격 피해 -40%', '직접 공격 피해 -30%');

/* ---------- 연성 배율표 재산정 ----------
   측정(dev/vfuse54.js, 기록 dev/sim_log/fusek_0.53.json): 조합별 '짝 무기 연성 전' 대비 '연성 후' 피해 배율 r
   기준: r이 1.25 미만(밀침·감속·회복 등 부가 효과가 있는 조합은 1.0 미만)이면 올리고, 2.6 초과면 내림.
         직업 안에서 한 조합이 중앙값의 2.2배를 넘으면 추가로 내림. 한 번에 바꾸는 폭은 0.75~1.35배로 제한(밀집 상황 측정의 치우침 완화).
   피해만 보고 맞추지 않도록 부가 효과 조합은 하한을 낮게 둠. 아래는 0.44 값에서 바뀐 조합만. */
const M54 = {
  warrior: {slam: 0.75, trap: 3.38, fireball: 0.63, icering: 1.16, orb: 3.98, beam: 1.77},
  rogue: {shield: 2.85, trap: 3.85, fireball: 1.61, icering: 4.19},
  sovereign: {shuriken: 2.08, fireball: 0.93, orb: 2.8},
  archer: {shield: 2.03, slam: 1.76, fireball: 2.19},
  engineer: {cleave: 1.9, slam: 1.16, arrow: 5.4, shuriken: 4.9, fireball: 1.59, icering: 2.01, orb: 5.4, beam: 0.73},
  chrono: {slam: 0.59, arrow: 2, trap: 2.78, shuriken: 3.3, fireball: 0.59, beam: 2.34},
  mage: {shield: 1.27, slam: 0.83, trap: 2.97, shuriken: 1.61, icering: 4.81, orb: 2.08},
  summoner: {cleave: 1.45, slam: 0.65, arrow: 3.27, trap: 2.31, fireball: 2.23, orb: 1.81},
  priest: {shield: 2.35, icering: 2.85},
  druid: {shield: 0.78, shuriken: 1.34, fireball: 0.62, orb: 1.01}
};
for (const j in M54) Object.assign(M44[j], M54[j]);

/* ---------- 마법사: 동시 시전 주기 4 → 3.2초 (대마법사 3 → 2.5초) ----------
   피해 배율은 주기에 맞춰 자동 환산(mageVolley의 fair 식)이라 총 화력은 비슷하고, 시전 사이 빈틈만 줄어듦 */
V41.mag.cd = 3.2; V41.mag.cdB = 2.5;
JOBS.mage.rule = JOBS.mage.rule.replace('4초마다', '3.2초마다');
JOB_SHORT.mage = JOB_SHORT.mage.replace('4초마다', '3.2초마다');
{ const o = JOB2.mage.find(x => x.k === 'archmage'); if (o) o.ds = o.ds.replace('동시 시전 주기 4 → 3초', '동시 시전 주기 3.2 → 2.5초'); }
/* ---------- 자동 플레이: 궁수 정지 사격 기준 강화 (집중이 서서히 줄어들므로 위험하면 먼저 피함) ---------- */
V54.arcStop = 1.6;
