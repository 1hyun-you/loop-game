/* ============================================================
   0.48 체감 수정 묶음 (회차 54, 표현·보강 단계)
   • 진동: 고비 순간만 — 성장(전직·2차 전직·각성·연성) "탁탁", 궁극기 "우웅", 정예 처치 "탁", 수문장·마왕 처치 "쿵-탁"
     최소 간격 없음(같은 상황 = 항상 같은 반응), 직업별 진동 폐지, 보스 등장 진동 폐지, 피격 진동은 기존 유지
   • 타격 멈춤: 일반 타격 멈춤 폐지, 정예 처치(짧은 정지)·수문장·마왕 처치(슬로모션)만 유지, 설정 끄기는 정예 처치 정지에 적용
   • 효과 그림: 무기 발동 효과 노출 1.45배, 등장·절정 유지·소멸 시간 배분, 무기 성격별 움직임
       묵직 = 위에서 내려찍고 눌림 / 관통 = 뒤에서 쭉 뻗어 나감 / 폭발 = 작게 시작해 부풀며 터짐 / 연타 = 빠르게 돌며 등장 / 지속 = 맥동 후 위로 흩어짐
     잔상·파편 입자(발동 시점에 생성, 그리기 중 생성 없음)
   • 범위 표시: 테두리 선 제거 → 가장자리가 진한 그라데이션 원판 + 무기 성격별 질감(균열·불씨·서리·잔상), 적 공격 예고 표시는 유지
   • 군주 근위병 플레이어 1.2배 + 방패·창 외곽 강조 (v41.js 그리기 수정)
   • 얼음 고리 파동: 중심이 플레이어를 따라 이동 (판정은 기존에도 플레이어 위치 기준)
   • 회전 공격: 회전검 칼날·사슬 철퇴 머리마다 개별 피해 (weapons.js·arsenal.js 수정)
   • 전부 임시 표현, 최종본 아님 → 무기별 장면 그림 GPT_REQUESTS G48 대상
   • 시험 집계: G.stats.v48 { vib 종류별, stop 정예 정지, slow 보스 슬로모션, tag 효과 연장 수, deb 파편 수 }
   ============================================================ */
const V48 = {
  durMul: 1.45, fxCap: 260, dMax: 170,
  vib: { grow: [35, 60, 35], ult: [170], elite: [30], boss: [90, 70, 35] },
  env: { a: 0.18, h: 0.62 },
};
const S48 = () => G.stats.v48 || (G.stats.v48 = { vib: {}, stop: 0, slow: 0, tag: 0, deb: 0 });

/* ---------- 진동: 고비 순간만 ---------- */
function vib48(k) {
  const V = S48().vib; V[k] = (V[k] || 0) + 1;
  if (!SETTINGS.vibe || STATE.dev.auto || !navigator.vibrate) return;
  try { navigator.vibrate(V48.vib[k]); } catch (err) { }
}
jobVib47 = function (j) { const V = S47().vib; V[j] = (V[j] || 0); };          // 직업별 진동 폐지 (호출부 유지, 무동작)
const _cine48 = cine47;
cine47 = function (kind, col, w) { _cine48(kind, col, w); if (V47.cine[kind]) vib48('grow'); };
const _useUlt48 = useUlt;
useUlt = function () { const r = _useUlt48.apply(this, arguments); vib48('ult'); return r; };
const _rcKill48 = rcKill;
rcKill = function (e) {
  const boss = e && e.gk && !e.clone, elite = e && !boss && e.elite && !e.clone;
  const H0 = RC_CFG.hitstop;
  if (elite && SETTINGS.hitstop === false) RC_CFG.hitstop = { k: 1, t: 0 };
  try { _rcKill48(e); } finally { RC_CFG.hitstop = H0; }
  if (boss) { vib48('boss'); S48().slow++; } else if (elite) { vib48('elite'); S48().stop++; }
};

/* ---------- 타격 멈춤: 일반 타격 폐지 (성격 표시는 유지) ---------- */
hitAfter47 = function (e, o, I) {
  const H = H47(), F = H.frame;
  if (F.t !== G.time) { F.t = G.time; F.n = {}; }
  if (!I) return;
  const n = F.n[o.src] = (F.n[o.src] || 0) + 1, big = e.elite || e.gk || e.boss;
  const heavyBig = I.k === 'heavy' && (o.crit || big || n === V47.bigN) && n <= V47.bigN;
  if (n <= (I.k === 'multi' ? 4 : 8)) mark47(e, I, o, heavyBig);
};

/* ---------- 무기 발동 효과 표시: 발동 중 생성된 효과에 성격 표지 ---------- */
let CUR48 = null, DMG48 = 0;
function kind48(w) {
  if (!w) return null;
  if (w.fu) { const sym = FZ_SYMBOL[w.fu.job]; return sym && HIT_KIND[sym] ? { k: HIT_KIND[sym], id: sym } : null; }
  return HIT_KIND[w.id] ? { k: HIT_KIND[w.id], id: w.id, branchArt: branchWeaponArt(w.id, w.br) } : null;
}
/* 발동 함수 실행 중 표지 유지 + 그 사이 예약된 지연 동작(G.later)에도 표지 승계 */
function run48(K, fn, self, args) {
  const pk = CUR48; CUR48 = K;
  const L = G.later, n0 = L ? L.length : 0;
  try { return fn.apply(self, args); }
  finally {
    CUR48 = pk;
    if (K && L && G.later === L) for (let i = n0; i < L.length; i++) {
      const it = L[i]; if (!it || it.k48) continue;
      const f0 = it.f; it.k48 = K;
      it.f = function () { return run48(K, f0, this, arguments); };
    }
  }
}
for (const id of Object.keys(WEAPON_FIRE)) {
  const f0 = WEAPON_FIRE[id];
  if (typeof f0 !== 'function') continue;
  WEAPON_FIRE[id] = function (w) { return run48(kind48(w) || (HIT_KIND[id] ? { k: HIT_KIND[id], id } : null), f0, this, arguments); };
}
const _fuseFire44_48 = fuseFire44;
fuseFire44 = function (w) { return run48(kind48(w), _fuseFire44_48, this, arguments); };
const _fuseFire43_48 = fuseFire43;
fuseFire43 = function (w) { return run48(kind48(w), _fuseFire43_48, this, arguments); };
const _damageEnemy48 = damageEnemy;
damageEnemy = function () { DMG48++; try { return _damageEnemy48.apply(this, arguments); } finally { DMG48--; } };   // 피격·처치 반응 효과는 표지 제외

const NOTAG48 = { glint: 1, txt: 1 };
fx = function (o) {
  const tag = CUR48 && !DMG48 && o && !NOTAG48[o.kind];
  if (G.fx.length >= (tag ? V48.fxCap : 220)) return;
  if (tag) {
    o.k48 = CUR48.k; o.w48 = CUR48.id;
    if (o.basicArt && o.basicArt === CUR48.id && CUR48.branchArt !== CUR48.id) o.branchArt = CUR48.branchArt;
    if (CUR48.id === 'slam' && CUR48.branchArt && CUR48.branchArt !== 'slam' && o.kind === 'ring' &&
        o.r0 === 12 && (o.element === 'earth' || o.element === 'ice')) {
      o.basicArt = 'slam';
      o.branchArt = CUR48.branchArt;
    }
    if (o.dur > 0) o.dur *= V48.durMul;
    const p = G.p;
    o.ang48 = Number.isFinite(o.a) ? o.a : Number.isFinite(o.warAngle) ? o.warAngle : Number.isFinite(o.sovereignAngle) ? o.sovereignAngle : Number.isFinite(o.rogueAngle) ? o.rogueAngle : Math.atan2(p.face.y, p.face.x);
    if (CUR48.id === 'icering' && o.kind === 'ring' && Math.abs((o.x || 0) - p.x) < 6 && Math.abs((o.y || 0) - p.y) < 6) { o.trk48 = true; o.follow = true; }   // 얼음 고리: 플레이어 추종
    S48().tag++;
  }
  G.fx.push(Object.assign({ t: 0 }, o));
  if (o.kind === 'ring' && o.fill && o.r1 >= 30) sparkBurst(o.follow ? G.p.x : o.x, o.follow ? G.p.y : o.y, o.r1, o.color);
  if (tag) debris48(o);
};

/* ---------- 등장·절정·소멸 시간 배분 + 성격별 움직임 (그리기 전용) ---------- */
const ease48 = { out: t => 1 - (1 - t) ** 3, back: t => { const s = 1.7; t -= 1; return 1 + t * t * ((s + 1) * t + s); } };
function remap48(f, k) {
  if (f.kind === 'ring') return k < 0.5 ? k * 1.3 : 0.65 + (k - 0.5) * 0.7;            // 범위 확장 속도는 판정과 맞춤, 끝부분만 길게
  const E = V48.env;
  if (k < E.a) return k / E.a * 0.22;                                                   // 등장
  if (k < E.h) return 0.22 + (k - E.a) / (E.h - E.a) * 0.16;                            // 절정 유지
  return 0.38 + (k - E.h) / (1 - E.h) * 0.62;                                           // 소멸
}
function env48(c, f, k) {
  const p = G.p, x = f.follow ? p.x : f.x, y = f.follow ? p.y : f.y;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  const E = V48.env, ka = k < E.a ? k / E.a : 1, kv = k > E.h ? (k - E.h) / (1 - E.h) : 0, a = f.ang48 || 0;
  let along = 1, perp = 1, dx = 0, dy = 0, rot = 0;
  if (f.kind === 'ring') {
    if (f.k48 === 'blast') { const s = 0.85 + 0.15 * ease48.out(ka); along = perp = s; }
    else return;
  } else switch (f.k48) {
    case 'heavy': {
      dy = -22 * (1 - ease48.out(ka));
      const land = k >= E.a && k < E.a + 0.1 ? Math.sin((k - E.a) / 0.1 * Math.PI) : 0;
      along = 1 + 0.12 * land + 0.1 * kv; perp = 1 - 0.12 * land - 0.35 * kv; dy += 4 * kv;
      c.translate(x, y + dy); c.scale(along, perp); c.translate(-x, -y); return;
    }
    case 'pierce': {
      const d = -18 * (1 - ease48.out(ka)) + 14 * kv; dx = Math.cos(a) * d; dy = Math.sin(a) * d;
      along = 1.35 - 0.35 * ease48.out(ka) + 0.4 * kv; perp = 1 - 0.3 * kv; break;
    }
    case 'blast': { const s = 0.45 + 0.55 * ease48.back(ka); along = perp = Math.max(0.3, s) * (1 + 0.2 * kv); break; }
    case 'multi': rot = -0.8 * (1 - ease48.out(ka)) + 0.6 * kv; along = perp = (0.7 + 0.3 * ease48.out(ka)) * (1 - 0.25 * kv); break;
    case 'dot': along = perp = 0.85 + 0.15 * ka + 0.04 * Math.sin(k * 14); dy = -6 * kv; break;
    default: return;
  }
  c.translate(x + dx, y + dy); c.rotate(a + rot); c.scale(along, perp); c.rotate(-a); c.translate(-x, -y);
}
/* G.fx를 그리기 동안만 감싸 항목마다 변환 적용 (각 직업 그림 함수 공통) */
function fxProxy48(c, arr) {
  const reduced = VFX.reduced.matches;
  return {
    get length() { return arr.length; },
    some: (fn) => arr.some(fn), filter: (fn) => arr.filter(fn), indexOf: (v) => arr.indexOf(v), push: (...v) => arr.push(...v), find: (fn) => arr.find(fn),
    [Symbol.iterator]() {
      let i = 0, open = null;
      const close = () => { if (open) { open.f.t = open.t; c.restore(); open = null; } };
      return {
        next() {
          close();
          if (i >= arr.length) return { value: undefined, done: true };
          const f = arr[i++];
          if (f && f.k48 && f.dur > 0) {
            const k = clamp(f.t / f.dur, 0, 0.9999);
            c.save(); open = { f, t: f.t };
            if (!reduced) env48(c, f, k);
            f.t = remap48(f, k) * f.dur;
          }
          return { value: f, done: false };
        },
        return() { close(); return { value: undefined, done: true }; },
      };
    },
  };
}
function withFx48(c, fn) {
  const arr = G.fx; if (!arr || !arr.length) return fn();
  G.fx = fxProxy48(c, arr);
  try { return fn(); } finally { G.fx = arr; }
}
for (const nm of ['drawWarriorArtWorld', 'drawRogueArtWorld', 'drawArcherArtWorld', 'drawSovereignArtWorld', 'drawEngineerArtWorld', 'drawChronoArtWorld', 'drawMageArtWorld', 'drawSummonerArtWorld', 'drawPriestArtWorld', 'drawDruidArtWorld', 'drawInstallationWorld']) {
  const f0 = globalThis[nm]; if (typeof f0 !== 'function') continue;
  globalThis[nm] = function (c) { const a = arguments; return withFx48(c, () => f0.apply(this, a)); };
}
const _drawFx48 = drawFx;
drawFx = function (c) { withFx48(c, () => _drawFx48(c)); drawDebris48(c); };

/* ---------- 잔상·파편 입자 (생성은 발동 시점만) ---------- */
const D48 = () => G.d48 || (G.d48 = []);
function debris48(o) {
  if (VFX.reduced.matches) return;
  const D = D48(); if (D.length >= V48.dMax) return;
  const p = G.p, x = o.follow ? p.x : o.x, y = o.follow ? p.y : o.y; if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  const kind = o.k48, a = o.ang48 || 0, R = Math.min(140, o.r1 || o.r || 24), ring = o.kind === 'ring';
  const col = typeof o.color === 'string' && o.color[0] === '#' ? o.color : HIT_COL[kind];
  const lite = vfxLite(), base = { heavy: 6, blast: 7, pierce: 3, multi: 4, dot: 5 }[kind] || 0, n = Math.min(V48.dMax - D.length, lite ? base >> 1 : base);
  const delay = (o.dur || 0.3) * (ring ? 0.05 : V48.env.a);
  for (let i = 0; i < n; i++) {
    const b = vfxRand(Math.PI * 2), q = { x, y, vx: 0, vy: 0, g: 0, t: -delay, dur: 0.5, s: vfxRand(2, 3.5), col, sh: kind, a };
    if (kind === 'heavy') { const r0 = ring ? R * 0.6 : vfxRand(4, 14), sp = vfxRand(60, 130); q.x += Math.cos(b) * r0; q.y += Math.sin(b) * r0 * 0.6; q.vx = Math.cos(b) * sp; q.vy = -vfxRand(60, 130); q.g = 420; q.col = '#cbb595'; q.dur = vfxRand(0.45, 0.65); }
    else if (kind === 'blast') { const r0 = ring ? R * 0.5 : 6, sp = vfxRand(90, 190); q.x += Math.cos(b) * r0; q.y += Math.sin(b) * r0; q.vx = Math.cos(b) * sp; q.vy = Math.sin(b) * sp - 30; q.g = -40; q.dur = vfxRand(0.45, 0.75); q.col = i % 2 ? '#ffc070' : col; }
    else if (kind === 'pierce') { const d = -i * 12 - 6; q.x += Math.cos(a) * d; q.y += Math.sin(a) * d; q.vx = Math.cos(a) * 170; q.vy = Math.sin(a) * 170; q.dur = 0.28 + i * 0.05; q.s = 14 - i * 3; q.t = -delay * 0.5; }
    else if (kind === 'multi') { const sp = vfxRand(90, 160); q.vx = Math.cos(b) * sp; q.vy = Math.sin(b) * sp; q.dur = vfxRand(0.18, 0.3); q.x += Math.cos(a) * 10; q.y += Math.sin(a) * 10; }
    else if (kind === 'dot') { const r0 = ring ? R * vfxRand(0.5, 0.95) : vfxRand(6, 18); q.x += Math.cos(b) * r0; q.y += Math.sin(b) * r0; q.vx = vfxRand(-10, 10); q.vy = -vfxRand(16, 34); q.dur = vfxRand(0.7, 1.0); q.t = -delay - vfxRand(0.25); }
    D.push(q);
  }
  S48().deb += n;
}
function upd48(dt) {
  const D = G.d48;
  if (D && D.length) {
    for (const q of D) { q.t += dt; if (q.t < 0) continue; q.vx *= 1 - Math.min(1, dt * 2.2); q.vy = q.vy * (1 - Math.min(1, dt * 2.2)) + q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
    G.d48 = D.filter(q => q.t < q.dur);
  }
  if (G.fx && G.p) for (const f of G.fx) if (f.trk48) { f.x = G.p.x; f.y = G.p.y; }
}
const _updateJuice48 = updateJuice;
updateJuice = function (dt) { _updateJuice48(dt); upd48(dt); };
function drawDebris48(c) {
  const D = G.d48; if (!D || !D.length) return;
  c.save(); c.lineCap = 'round';
  for (const q of D) {
    if (q.t < 0) continue;
    const k = clamp(q.t / q.dur, 0, 1), A = 1 - k;
    if (Math.abs(q.x - G.p.x) > VIEW.cameraW / 2 + 40 || Math.abs(q.y - G.p.y) > VIEW.cameraH / 2 + 40) continue;
    c.globalAlpha = 0.85 * A; c.fillStyle = q.col; c.strokeStyle = q.col;
    if (q.sh === 'heavy') { c.save(); c.translate(q.x, q.y); c.rotate(q.t * 9 + q.a); c.fillRect(-q.s / 2, -q.s / 2, q.s, q.s); c.restore(); }
    else if (q.sh === 'blast') { vfxGlow(c, q.x, q.y, q.s * 2.2, q.col, 0.5 * A); c.globalAlpha = A; c.beginPath(); c.arc(q.x, q.y, q.s * 0.55 * (1 - 0.5 * k), 0, 7); c.fill(); }
    else if (q.sh === 'pierce') { const L = q.s * (1 - 0.4 * k), ca = Math.cos(q.a), sa = Math.sin(q.a); c.globalAlpha = 0.5 * A; c.lineWidth = 2.2 * A + 0.6; c.beginPath(); c.moveTo(q.x - ca * L, q.y - sa * L); c.lineTo(q.x, q.y); c.stroke(); }
    else if (q.sh === 'multi') { const L = 3 * A + 1; c.lineWidth = 1.2; c.beginPath(); c.moveTo(q.x - L, q.y); c.lineTo(q.x + L, q.y); c.moveTo(q.x, q.y - L); c.lineTo(q.x, q.y + L); c.stroke(); }
    else if (q.sh === 'dot') { const d = 2.6 * (1 - 0.4 * k); c.globalAlpha = 0.7 * A; c.beginPath(); c.moveTo(q.x, q.y - d * 1.4); c.lineTo(q.x + d, q.y); c.lineTo(q.x, q.y + d * 1.4); c.lineTo(q.x - d, q.y); c.closePath(); c.fill(); }
  }
  c.restore(); c.globalAlpha = 1;
}

/* ---------- 범위 표시: 선 없는 가장자리 그라데이션 + 성격별 질감 ---------- */
const BAND48 = new Map();
function rgb48(col) {
  const s = String(col || '').trim();
  let m = /^#([0-9a-f]{6})$/i.exec(s); if (m) { const v = parseInt(m[1], 16); return [v >> 16, (v >> 8) & 255, v & 255]; }
  m = /^#([0-9a-f]{3})$/i.exec(s); if (m) { const h = m[1]; return [0, 1, 2].map(i => parseInt(h[i] + h[i], 16)); }
  m = /rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/i.exec(s); if (m) return [+m[1], +m[2], +m[3]];
  return [232, 216, 175];
}
function bandStamp48(col) {
  let cv = BAND48.get(col); if (cv) return cv;
  const [r, g, b] = rgb48(col), S = 128;
  cv = document.createElement('canvas'); cv.width = cv.height = S;
  const x = cv.getContext('2d'), gr = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, `rgba(${r},${g},${b},0)`); gr.addColorStop(0.5, `rgba(${r},${g},${b},0.06)`);
  gr.addColorStop(0.8, `rgba(${r},${g},${b},0.32)`); gr.addColorStop(0.93, `rgba(${r},${g},${b},0.7)`);
  gr.addColorStop(0.985, `rgba(${r},${g},${b},0.38)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = gr; x.fillRect(0, 0, S, S);
  if (BAND48.size >= 28) BAND48.delete(BAND48.keys().next().value);
  BAND48.set(col, cv); return cv;
}
function rangeEdge48(c, x, y, r, col, alpha, kind, obj) {
  if (!(r > 2 && alpha > 0.005) || !Number.isFinite(x + y)) return;
  c.save(); c.globalAlpha = clamp(alpha, 0, 1); c.imageSmoothingEnabled = true;
  c.drawImage(bandStamp48(col || '#e8d8af'), x - r, y - r, r * 2, r * 2);
  if (kind && r > 14 && !vfxLite()) {
    const sd = obj ? (obj.seed48 || (obj.seed48 = 1 + Math.floor(hash2(Math.round(obj.x || x), Math.round(obj.y || y) + 7) * 1e6))) : 1;
    const n = r > 70 ? 8 : 5, tau = Math.PI * 2;
    c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const h = hash2(sd, i), b = i * tau / n + h * 0.9, er = r * (0.86 + 0.08 * hash2(sd, i + 50)), px = x + Math.cos(b) * er, py = y + Math.sin(b) * er;
      if (kind === 'heavy') { c.globalAlpha = 0.55 * alpha; c.lineWidth = 1.4; c.beginPath(); c.moveTo(px, py); const l = r * 0.16; c.lineTo(px - Math.cos(b) * l * 0.5 + Math.sin(b) * 3, py - Math.sin(b) * l * 0.5 - Math.cos(b) * 3); c.lineTo(px - Math.cos(b) * l, py - Math.sin(b) * l); c.stroke(); }
      else if (kind === 'blast') { const fl = 0.6 + 0.4 * Math.sin(G.time * 9 + i * 1.7); vfxGlow(c, px, py - 2 * fl, 4 + 2 * fl, '#ffb468', 0.45 * alpha * fl); }
      else if (kind === 'dot') { const d = 3.2; c.globalAlpha = 0.6 * alpha; c.save(); c.translate(px, py); c.rotate(b); c.beginPath(); c.moveTo(0, -d * 1.3); c.lineTo(d * 0.6, 0); c.lineTo(0, d * 1.3); c.lineTo(-d * 0.6, 0); c.closePath(); c.fill(); c.restore(); }
      else { c.globalAlpha = 0.4 * alpha; c.lineWidth = 1.6; c.beginPath(); c.arc(x, y, er, b, b + 0.22); c.stroke(); }   // 관통·연타: 짧은 잔상 호
    }
  }
  c.restore();
}
/* 기존 경계선 함수 교체: 선 대신 가장자리 그라데이션 */
effectBoundary = function (c, x, y, r, color, alpha = .35) { rangeEdge48(c, x, y, r, color, Math.min(1, alpha * 1.25), null, null); };
paintedRing = function (c, f, k, x, y) {
  if (f.kind !== 'ring') return false;
  const r = Math.max(1, lerp(f.r0, f.r1, 1 - (1 - k) ** 2));
  const key = f.art || (f.element === 'ice' ? (f.fill ? 'shatter' : 'frost') : f.element === 'earth' ? 'earth' : effectKey(f.color, f.fill));
  if (!paintedEffect(c, key, x, y, r, (1 - k) ** 1.5 * .75, k * .2)) return false;
  rangeEdge48(c, x, y, r, f.color || '#dfcfaa', .55 * (1 - k), f.k48 || (f.element === 'ice' ? 'dot' : null), f); return true;
};
const POOLK48 = { fire: 'blast', crack: 'heavy', vine: 'dot' };
paintedPool = function (c, z) {
  const key = { trail: 'heal', vine: 'vine', crack: 'earth', fire: 'fire' }[z.kind] || 'fire', fade = clamp((z.dur - z.t) * 3, 0, 1);
  if (!paintedEffect(c, key, z.x, z.y, z.r, .55 * fade)) return false;
  rangeEdge48(c, z.x, z.y, z.r, z.kind === 'fire' || !z.kind ? '#ffcc8a' : '#c0d5ad', .34 * fade, z.kind ? POOLK48[z.kind] : 'blast', z); return true;
};
