/* ============================================================
   0.51 범위 표현 재정리 · 대지 강타 멈칫 · 안전 시 경험치 수집 (회차 55)
   • 0.50 가장자리 장식·바닥 원판 폐지: 순간형은 발동 장면만 짧게, 지속형은 일렁이는 질감만
     - 얼음: 캐릭터에서 얼음 띠가 바깥으로 빠르게 퍼지며 사라짐 (그림을 퍼지는 띠 모양으로만 표시)
     - 대지: 위에서 내리찍는 그림자 수축 → 쿵 눌림(중심 어두운 함몰) → 먼지 고리·파편 튐
     - 방패: 투명한 충격파 한 겹이 옆으로 퍼지고 사라짐 (밝은 띠 + 일그러진 잔영)
     - 그 외 무기 고리(화염 폭발 등): 그림만 짧게, 테두리·장식 없음
     - 지속형 장판(화염·균열·덩굴·회복): 그림 32% 안팎으로 일렁임, 등장 순간만 진하게, 테두리 없음
   • 대지 강타: 밀쳐내는 힘 ×0.4(150 → 60), 0.15초 멈칫 → 0.4초 동안 속도 40%에서 원래로 서서히 회복
     정예는 시간 절반, 수문장·마왕·대장 제외
   • 자동 플레이: 안전할 때(예고 없음·주변 위험 낮음·체력 50% 이상) 보석 수집 우선 — 군기·동료·포탑 근처 규칙 일시 해제,
     보석 끌림 2배, 위험 계산 0.8배 (v50.js autoVec 안 safe 조건)
   • 시험 집계: G.stats.v51 { stag, stagE, ringI, ringE, ringS }
   ============================================================ */
const V51 = { kb: 0.4, stun: 0.15, rec: 0.4, recMin: 0.4, eliteK: 0.5 };
const S51 = () => G.stats.v51 || (G.stats.v51 = { stag: 0, stagE: 0, ringI: 0, ringE: 0, ringS: 0 });

/* ---------- 대지 강타: 멈칫 + 서서히 회복 ---------- */
const _slamWave51 = slamWave;
slamWave = function (x, y, R, dmg, kb) {
  _slamWave51(x, y, R, dmg, (kb || 0) * V51.kb);
  const S = S51();
  gridQuery(x, y, R, e => {
    if (e.dead || e.boss || e.gk || e.cmd) return;
    const k = e.elite ? V51.eliteK : 1;
    e.stg51 = G.time + V51.stun * k; e.rec51 = V51.rec * k;
    if (e.elite) S.stagE++; else S.stag++;
  });
};
const _chronoSlow51 = chronoSlow;
chronoSlow = function (e) {
  let m = _chronoSlow51(e);
  if (e.stg51) {
    const dt = G.time - e.stg51;
    if (dt < 0) m = 0;                                                 // 멈칫
    else if (dt < e.rec51) m *= V51.recMin + (1 - V51.recMin) * (dt / e.rec51) ** 1.5;   // 서서히 회복
    else e.stg51 = 0;
  }
  return m;
};

/* ---------- 범위 표현: 순간형은 발동 장면만 ---------- */
const ease51 = t => 1 - (1 - t) ** 3;
function ringIce51(c, f, k, x, y) {
  const t = ease51(Math.min(1, k / 0.8)), r = Math.max(4, lerp(f.r0, f.r1, t)), w = Math.max(10, f.r1 * 0.28);
  const A = k < 0.7 ? 0.8 : 0.8 * (1 - (k - 0.7) / 0.3);
  c.save(); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.arc(x, y, Math.max(0, r - w), 0, Math.PI * 2, true); c.clip('evenodd');
  const ok = paintedEffect(c, f.art || (f.fill ? 'shatter' : 'frost'), x, y, r, A, k * 0.3);
  c.restore();
  if (ok && A > 0.05) {                                                 // 퍼지는 앞머리의 서리 반짝임
    const n = clamp(Math.round(r / 9), 6, 18), sd = seed50(f);
    c.save(); c.globalAlpha = A * 0.7; c.fillStyle = '#f2fbff';
    for (let i = 0; i < n; i++) { const b = i / n * Math.PI * 2 + hash2(sd, i) * 0.6, q = 1.2 + 1.6 * hash2(sd, i + 9), rr = r - w * 0.15 * hash2(sd, i + 5); c.fillRect(x + Math.cos(b) * rr - q / 2, y + Math.sin(b) * rr - q / 2, q, q); }
    c.restore();
  }
  S51().ringI++; return ok;
}
function ringEarth51(c, f, k, x, y) {
  const R = f.r1, S = S51(); S.ringE++;
  c.save();
  if (k < 0.12) {                                                       // 내리찍기 전: 위에서 떨어지는 그림자 수축
    const q = k / 0.12, rr = R * (1 - 0.6 * q);
    c.globalAlpha = 0.18 + 0.3 * q; c.fillStyle = '#2a1a0c'; c.beginPath(); c.ellipse(x, y, rr * 0.5, rr * 0.38, 0, 0, Math.PI * 2); c.fill();
    c.restore(); return true;
  }
  const q = (k - 0.12) / 0.88, A = q < 0.25 ? 1 : 1 - (q - 0.25) / 0.75;
  // 쿵 눌림: 중심 어두운 함몰 (가장자리로 갈수록 투명)
  const g = c.createRadialGradient(x, y, 0, x, y, R * (0.9 + 0.1 * q));
  g.addColorStop(0, `rgba(40,24,10,${0.5 * A})`); g.addColorStop(0.55, `rgba(70,46,22,${0.28 * A})`); g.addColorStop(1, 'rgba(70,46,22,0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); c.fill();
  if (q < 0.3) { c.globalAlpha = (1 - q / 0.3) * 0.55; paintedEffect(c, 'earth', x, y, R * 0.75, 1, 0); c.globalAlpha = 1; }
  // 먼지 고리: 바깥으로 살짝 번지는 뭉게 덩어리
  const sd = seed50(f), n = clamp(Math.round(R / 14), 8, 16), dr = R * (0.75 + 0.35 * ease51(q));
  for (let i = 0; i < n; i++) {
    const b = i / n * Math.PI * 2 + hash2(sd, i) * 0.5, s = R * (0.07 + 0.05 * hash2(sd, i + 3)) * (1 + q * 0.8);
    c.globalAlpha = A * 0.45; c.fillStyle = '#c9ad84'; c.beginPath(); c.arc(x + Math.cos(b) * dr, y + Math.sin(b) * dr * 0.85, s, 0, Math.PI * 2); c.fill();
  }
  // 파편: 튀어 올랐다 떨어짐
  if (q < 0.7) {
    const m = 7, h = Math.sin(Math.PI * q / 0.7) * R * 0.22;
    c.globalAlpha = Math.min(1, A * 1.2); c.fillStyle = '#7a5532';
    for (let i = 0; i < m; i++) { const b = i / m * Math.PI * 2 + hash2(sd, i + 21), d = R * (0.3 + 0.55 * q) * (0.7 + 0.5 * hash2(sd, i + 31)), s = 2 + 2.5 * hash2(sd, i + 41); c.fillRect(x + Math.cos(b) * d - s / 2, y + Math.sin(b) * d - h * (0.6 + 0.6 * hash2(sd, i + 51)) - s / 2, s, s); }
  }
  c.restore(); return true;
}
function ringShock51(c, f, k, x, y) {
  const t = ease51(k), r = Math.max(6, lerp(f.r0, f.r1, t)), w = Math.max(6, f.r1 * 0.2), A = (1 - k) ** 1.2;
  S51().ringS++;
  c.save();
  const g = c.createRadialGradient(x, y, Math.max(0, r - w), x, y, r);
  g.addColorStop(0, 'rgba(220,232,255,0)'); g.addColorStop(0.7, `rgba(225,236,255,${0.42 * A})`); g.addColorStop(1, 'rgba(225,236,255,0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  // 일그러진 잔영: 살짝 어긋난 옅은 띠 2겹
  for (let j = 1; j <= 2; j++) {
    const rr = r * (1 - 0.09 * j), ox = Math.sin(G.time * 30 + j) * 1.5, g2 = c.createRadialGradient(x + ox, y, Math.max(0, rr - w * 0.6), x + ox, y, rr);
    g2.addColorStop(0, 'rgba(200,215,255,0)'); g2.addColorStop(0.8, `rgba(200,215,255,${0.16 * A / j})`); g2.addColorStop(1, 'rgba(200,215,255,0)');
    c.fillStyle = g2; c.beginPath(); c.arc(x + ox, y, rr, 0, Math.PI * 2); c.fill();
  }
  c.restore(); return true;
}
paintedRing = function (c, f, k, x, y) {
  if (f.kind !== 'ring') return false;
  const fam = fam50(f); if (!fam) return _paintedRing50(c, f, k, x, y);   // 무기 외 고리: 0.49 방식
  if (fam === 'ice') return ringIce51(c, f, k, x, y);
  if (fam === 'earth') return ringEarth51(c, f, k, x, y);
  if (fam === 'shock') return ringShock51(c, f, k, x, y);
  const r = Math.max(1, lerp(f.r0, f.r1, 1 - (1 - k) ** 2));
  const key = f.art || effectKey(f.color, f.fill);
  return paintedEffect(c, key, x, y, r, 0.75 * fade49(k), k * .2);
};
paintedPool = function (c, z) {
  const key = { trail: 'heal', vine: 'vine', crack: 'earth', fire: 'fire' }[z.kind] || 'fire';
  const fade = clamp((z.dur - z.t) * 3, 0, 1), fl = z.t < 0.25 ? 1 - z.t / 0.25 : 0, wob = 0.06 * Math.sin(G.time * 5 + (z.x + z.y) * 0.01);
  return paintedEffect(c, key, z.x, z.y, z.r * (1 + 0.02 * Math.sin(G.time * 3.3 + z.x)), (0.32 + wob + 0.3 * fl) * fade, G.time * 0.15);
};
