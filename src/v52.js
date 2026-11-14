/* ============================================================
   0.52 휘두름 정리 · 방패 충격/얼음 고리 발동 장면 · 멈춤 차단 해제 · 보석 음계 (회차 57)
   • 휘두름(부채꼴) 전체: 0.48 등장·절정·소멸 시간 배분(remap48)과 묵직형 낙하·눌림(env48) 적용 해제
     - 대검 베기 기본 그림: 단일 곡선(느린 출발 → 빠른 중간 → 부드러운 감속)으로 끝까지 진행, 끝난 뒤 궤적 꼬리가 칼 쪽으로 빨려 들며 사라짐
     - 플레이어가 낸 휘두름은 회전 중심이 캐릭터를 따라감 (근위병 등 다른 주체의 휘두름은 제외)
   • 방패 충격: 방패 그림 낙하·충격파 폐지 → 반투명 방패 6~8장이 둥글게 솟음 → 바깥으로 힘 있게 밀려남 → 흩어짐 (임시 도형, 최종본 아님)
   • 얼음 고리: 결정 고리 그림 확대 표시 폐지 → 냉기 물결이 캐릭터에서 퍼지고, 지나간 바닥에 서리가 잠깐 남았다 녹음 (임시 도형, 최종본 아님)
   • 정지·슬로모션: 자동 플레이·배속 중에도 적용, 가상 시험(브라우저 자동화)만 차단
   • 보석 획득음: 5음계 8단계 상승, 0.5초 끊기면 처음 높이, 맨 위 다음은 처음으로 순환
   • 판정·피해·수치 변경 없음
   • 시험 집계: G.stats.v52 { arc, arcFol, shd, ice, frost }
   ============================================================ */
const V52 = { sweepEnd: 0.68, frostLife: 0.9, frostCap: 160, gemReset: 0.5 };
const S52 = () => G.stats.v52 || (G.stats.v52 = { arc: 0, arcFol: 0, shd: 0, ice: 0, frost: 0 });
const ease52 = t => 1 - (1 - t) ** 3;
const swing52 = t => 0.25 * (1 - Math.cos(Math.PI * t)) + 0.5 * (1 - (1 - t) ** 2);   // 느린 출발·빠른 중간·부드러운 감속

/* ---------- 발동 정보 표시: 휘두름 추종 · 방패 충격 표시 교체 ---------- */
const _fx52 = fx;
fx = function (o) {
  const p = G && G.p;
  if (o && p) {
    if (o.kind === 'arc') {
      const ox = o.artX ?? o.x;
      if (ox === undefined || (Math.abs(ox - p.x) < 4 && Math.abs((o.artY ?? o.y) - p.y) < 4)) o.fol52 = true;
    }
    if (o.kind === 'ring' && o.basicArt === 'shield') {
      o.shd52 = o.sovereignArt ? 'sovereign' : 'basic';
      delete o.basicArt; delete o.sovereignArt; delete o.sovereignAngle;
      o.fol52 = true;
    }
  }
  const n = G && G.fx ? G.fx.length : 0;
  const v = _fx52(o);
  if (G && G.fx && G.fx.length > n && o) { const S = S52(); if (o.kind === 'arc') { S.arc++; if (o.fol52) S.arcFol++; } if (o.shd52) S.shd++; }
  return v;
};
function follow52() {
  const p = G && G.p; if (!p || !G.fx) return;
  for (const f of G.fx) if (f.fol52) { if (f.artX !== undefined) { f.artX = p.x; f.artY = p.y; } f.x = p.x; f.y = p.y; }
}

/* ---------- 휘두름: 시간 배분·낙하 눌림 해제 ---------- */
const _remap52 = remap48;
remap48 = function (f, k) { return f && (f.kind === 'arc' || f.shd52) ? k : _remap52(f, k); };
const _env52 = env48;
env48 = function (c, f, k) { if (f && (f.kind === 'arc' || f.shd52)) return; return _env52(c, f, k); };

drawBasicCleave = function (c, f, image, k, reduced) {
  const x = f.artX, y = f.artY, E = V52.sweepEnd, start = f.a - f.arc / 2;
  const s = reduced ? 1 : swing52(Math.min(1, k / E));
  const shrink = k > E ? (k - E) / (1 - E) : 0;
  const angle = start + f.arc * (s + (reduced ? 0 : 0.07 * ease52(shrink)));   // 끝난 뒤에도 살짝 밀려가며 사라짐 (정지 구간 없음)
  const trail = f.arc * (image === BASIC_WEAPON_IMAGES.cleave_wide ? .85 : .65);
  const tail = reduced ? start : Math.max(start, angle - trail * Math.min(1, s * 1.6) * (1 - ease52(shrink)));
  const opacity = (1 - shrink) ** 1.6;
  const length = f.r * .77, thickness = length * image.naturalHeight / image.naturalWidth;
  if (angle - tail > 0.02) {
    c.globalAlpha = .37 * opacity;
    c.fillStyle = '#d5cec2';
    c.beginPath();
    c.arc(x, y, f.r, tail, angle);
    c.arc(x, y, f.r * .79, angle, tail, true);
    c.fill();
  }
  c.translate(x, y);
  c.rotate(angle);
  c.globalAlpha = opacity;
  c.drawImage(image, f.r * .22, -thickness / 2, length, thickness);
};

/* ---------- 방패 충격: 둥글게 솟음 → 바깥으로 밀어냄 → 흩어짐 ---------- */
function shieldShape52(c, h, col, hi) {
  const w = h * 0.72;
  c.beginPath();
  c.moveTo(-w / 2, -h / 2);
  c.lineTo(w / 2, -h / 2);
  c.lineTo(w / 2, h * 0.08);
  c.quadraticCurveTo(w / 2, h * 0.36, 0, h / 2);
  c.quadraticCurveTo(-w / 2, h * 0.36, -w / 2, h * 0.08);
  c.closePath();
  c.fillStyle = col; c.fill();
  c.beginPath();                                                         // 위쪽 반사광 (선 대신 밝은 면)
  c.moveTo(-w * 0.36, -h * 0.4); c.lineTo(w * 0.36, -h * 0.4); c.lineTo(w * 0.3, -h * 0.18); c.lineTo(-w * 0.3, -h * 0.18); c.closePath();
  c.fillStyle = hi; c.fill();
}
function drawShield52(c, f, k, x, y) {
  const R = f.r1, sov = f.shd52 === 'sovereign', reduced = VFX.reduced.matches;
  const n = clamp(Math.round(Math.PI * 2 * R / 44), 6, 8), h = clamp(R * 0.3, 15, 26);
  let r, a, sc;
  if (reduced) { r = R * 0.8; a = 0.6 * (1 - k); sc = 1; }
  else if (k < 0.3) { const q = k / 0.3; r = R * 0.42; a = 0.75 * ease52(q); sc = 0.4 + 0.6 * (1 + 2.2 * (q - 1) ** 3 + 1.2 * (q - 1) ** 2); }   // 솟음 (살짝 튀어 오르는 등장)
  else if (k < 0.72) { const q = (k - 0.3) / 0.42; r = R * (0.42 + 0.6 * ease52(q)); a = 0.8; sc = 1 + 0.08 * Math.sin(Math.PI * q); }                // 힘 있게 밀어냄
  else { const q = (k - 0.72) / 0.28; r = R * (1.02 + 0.1 * q); a = 0.8 * (1 - q) ** 1.4; sc = 1 - 0.15 * q; }                                         // 흩어짐
  const col = sov ? 'rgba(255,222,150,0.55)' : 'rgba(200,220,255,0.5)', hi = sov ? 'rgba(255,246,214,0.6)' : 'rgba(240,248,255,0.55)';
  c.save();
  if (!reduced && k >= 0.3 && k < 0.85) {                               // 밀려나는 공기 (방패 뒤 옅은 띠, 테두리 선 없음)
    const q = Math.min(1, (k - 0.3) / 0.42), g = c.createRadialGradient(x, y, Math.max(0, r - h * 1.2), x, y, r);
    const A = 0.22 * (1 - Math.max(0, (k - 0.72) / 0.13));
    g.addColorStop(0, sov ? 'rgba(255,230,170,0)' : 'rgba(210,225,255,0)');
    g.addColorStop(1, sov ? `rgba(255,230,170,${A * (0.4 + 0.6 * q)})` : `rgba(210,225,255,${A * (0.4 + 0.6 * q)})`);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.arc(x, y, Math.max(0, r - h * 1.2), 0, Math.PI * 2, true); c.fill('evenodd');
  }
  const spin = (f.ang48 || 0) + 0.15;
  for (let i = 0; i < n; i++) {
    const b = spin + i / n * Math.PI * 2, scat = k > 0.72 && !reduced ? (hash2(seed50(f), i) - 0.5) * 0.25 * (k - 0.72) / 0.28 : 0;
    c.save();
    c.translate(x + Math.cos(b + scat) * r, y + Math.sin(b + scat) * r);
    c.rotate(b + Math.PI / 2);                                            // 방패 앞면이 바깥을 향함
    c.scale(sc, sc);
    c.globalAlpha = a;
    shieldShape52(c, h, col, hi);
    c.restore();
  }
  c.restore();
  return true;
}

/* ---------- 얼음 고리: 냉기 물결 + 지나간 바닥 서리 ---------- */
basicIceWave = function (f) { return f.kind === 'ring' && f.element === 'ice' && f.trk48 && f.follow && !f.fill; };
const FROST52 = { owner: null, list: [] };
function frostList52() { if (FROST52.owner !== G) { FROST52.owner = G; FROST52.list = []; } return FROST52.list; }
drawBasicIce = function (c) {
  const p = G.p, x = p.x, y = p.y, reduced = VFX.reduced.matches, L = frostList52();
  for (const f of G.fx) {
    if (!basicIceWave(f) || f.t >= f.dur) continue;
    const k = clamp(f.t / f.dur, 0, 1), r = Math.max(4, lerp(f.r0, f.r1, ease52(Math.min(1, k / 0.8))));
    const band = Math.max(12, f.r1 * 0.3), A = 0.42 * Math.min(1, (1 - k) / 0.35) * Math.min(1, k * 10);
    const g = c.createRadialGradient(x, y, Math.max(0, r - band), x, y, r);        // 물결 앞머리 쪽이 가장 진하고 안쪽으로 옅어짐
    g.addColorStop(0, 'rgba(190,232,255,0)');
    g.addColorStop(0.75, `rgba(200,238,255,${A * 0.6})`);
    g.addColorStop(0.94, `rgba(236,250,255,${A})`);
    g.addColorStop(1, 'rgba(236,250,255,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.arc(x, y, Math.max(0, r - band), 0, Math.PI * 2, true); c.fill('evenodd');
    S52().ice++;
    if (reduced) continue;
    const last = f.fr52 || f.r0;                                          // 물결이 지나간 자리에 서리 남기기 (월드 좌표 고정)
    if (r - last >= 24 && k < 0.85) {
      f.fr52 = r; f.fi52 = (f.fi52 || 0) + 1;
      const m = clamp(Math.round(r / 20), 3, 7), sd = seed50(f) + f.fi52 * 31;
      for (let i = 0; i < m && L.length < V52.frostCap; i++) {
        const b = (i + hash2(sd, i)) / m * Math.PI * 2, d = r - band * 0.3 * hash2(sd, i + 7);
        L.push({ x: x + Math.cos(b) * d, y: y + Math.sin(b) * d, t0: G.time, s: 1.8 + 1.8 * hash2(sd, i + 13), a: hash2(sd, i + 19) * Math.PI });
        S52().frost++;
      }
    }
  }
  if (!L.length) return;
  c.save(); c.lineCap = 'round';
  for (let i = L.length - 1; i >= 0; i--) {
    const q = (G.time - L[i].t0) / V52.frostLife;
    if (q >= 1 || q < 0) { L.splice(i, 1); continue; }
    const s = L[i].s * (1 - 0.55 * q * q), A = 0.6 * (q < 0.15 ? q / 0.15 : 1 - (q - 0.15) / 0.85);   // 녹듯 작아지며 사라짐
    c.globalAlpha = A; c.strokeStyle = '#eefaff'; c.lineWidth = 1;
    c.beginPath();
    for (let j = 0; j < 3; j++) { const b = L[i].a + j * Math.PI / 3; c.moveTo(L[i].x - Math.cos(b) * s, L[i].y - Math.sin(b) * s); c.lineTo(L[i].x + Math.cos(b) * s, L[i].y + Math.sin(b) * s); }
    c.stroke();
    c.globalAlpha = A * 0.35; c.fillStyle = '#cdeeff'; c.beginPath(); c.arc(L[i].x, L[i].y, s * 1.3, 0, Math.PI * 2); c.fill();
  }
  c.restore();
};

/* ---------- 그리기 연결 ---------- */
const _paintedRing52 = paintedRing;
paintedRing = function (c, f, k, x, y) {
  if (f.kind === 'ring' && f.shd52) return drawShield52(c, f, clamp(f.t / f.dur, 0, 0.9999), x, y);
  return _paintedRing52(c, f, k, x, y);
};
const _drawBasicWorld52 = drawBasicWeaponWorld;
drawBasicWeaponWorld = function (c, inView) { follow52(); return _drawBasicWorld52(c, inView); };

/* ---------- 정지·슬로모션: 가상 시험만 차단 ---------- */
rcScale = function (raw) {
  const r = G && G.rc; if (!r || r.slow <= 0) return 1;
  r.slow -= raw;
  return BOT49 ? 1 : r.slowK;
};

/* ---------- 보석 획득음: 5음계 8단계 ---------- */
const GEM52 = ['C6', 'D6', 'E6', 'G6', 'A6', 'C7', 'D7', 'E7'].map(nf);
SFX.gem = { gap: 0.06, f: (d, t) => {
  if (t - (AU.gemT52 ?? -9) > V52.gemReset) AU.gemI52 = 0; else AU.gemI52 = ((AU.gemI52 || 0) + 1) % GEM52.length;
  AU.gemT52 = t;
  tone(d, 'square', GEM52[AU.gemI52], t, 0.06, 0.06);
} };
