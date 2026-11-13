/* ============================================================
   0.47 몰입·체감 묶음 (회차 53, 표현·보강 단계)
   • 프레임 설정: 기본 60 (main.js frame 앞단 판정), 설정 120 = 화면 주사율 그대로
   • 타격 성격 5종: 묵직(대검 베기·방패 충격·대지 강타)·연타(수리검·마력 구체)·관통(화살·빛줄기)·폭발(화염구·화염 덫)·지속(얼음 고리)
     - 성격별 타격 표시·타격음, 전체 세기 중간
     - 연성 무기: 상징 무기 성격 계승(소리·멈춤·주 표시) + 짝 무기 성격 보조 표시(작게) 혼합
   • 타격 멈춤: 묵직형 큰 한 방(치명·정예·보스·한 번에 4체 이상) + 정예·보스 타격(플레이어 무기 한정), 최소 0.5초 간격, 설정 끄기 가능
   • 직업별 결정적 순간 진동 1개씩, 최소 1초 간격 (강: 전사·군주·드루이드 묵직형 큰 한 방 / 약: 도적 통과 무적·궁수 표식 폭발·
     엔지니어 포탑 설치·마법사 원소 반응·소환사 망령 소환·시간술사 정지·프리스트 정화), 기존 진동 시점 유지
   • 성장 순간 연출 등급제: 각성 0.4초 / 전직·연성 0.8초 / 2차 전직 1초 정지·확대
     - 연출 중 적·투사체 정지·피격 없음, 종료 시 주변 밀쳐내기, 각성·연성 후 첫 발동 크게
   • 무기 외형 변화: Lv 3 분기·Lv 5 각성 두 시점만, 분기별 형태 차별 (임시 도형, 최종본 아님 → GPT 요청 G47 대상)
   • 시험 집계: G.stats.v47 { hs 멈춤 횟수, vib 직업 진동 횟수(자동 시험은 횟수만 집계), cine 연출 횟수, big 첫 발동 강조 }
   ============================================================ */
const V47 = {
  stopGap: 0.5, stopHeavy: { k: 0.08, t: 0.06 }, stopBig: { k: 0.1, t: 0.035 }, bigN: 4,
  vibGap: 1000, vibStrong: 40, vibWeak: 16,
  cine: { awaken: 0.4, job: 0.8, fuse: 0.8, job2: 1.0 }, push: { R: 150, kb: 340 }, zoom2: 1.18,
  hitMax: 90, formMax: 36,
};
const S47 = () => G.stats.v47 || (G.stats.v47 = { hs: 0, vib: {}, cine: {}, big: 0, forms: 0 });

/* ---------- 프레임 제한 (main.js frame에서 호출) ---------- */
const FPS47 = { last: 0 };
function fpsSkip(now) {
  if (SETTINGS.fps === 120) { FPS47.last = now; return false; }
  const iv = 1000 / 60;
  if (now - FPS47.last < iv - 1.5) return true;
  FPS47.last = now - FPS47.last > iv * 2 ? now : FPS47.last + iv;   // 120Hz: 정확히 2프레임에 1번, 90Hz 등은 평균 60
  return false;
}

/* ---------- 타격 성격 ---------- */
const HIT_KIND = { cleave: 'heavy', shield: 'heavy', slam: 'heavy', shuriken: 'multi', orb: 'multi', arrow: 'pierce', beam: 'pierce', fireball: 'blast', trap: 'blast', icering: 'dot',
  shatter: 'dot', fireball_pool: 'blast', fissure: 'heavy', split: 'pierce' };
const HIT_COL = { heavy: '#ffcf8a', multi: '#d8f4ff', pierce: '#e6ffd0', blast: '#ffa860', dot: '#bfe8ff' };
const HIT_NM = { heavy: '묵직', multi: '연타', pierce: '관통', blast: '폭발', dot: '지속' };
/* src → { k: 주 성격, k2: 보조 성격(연성 짝 무기), col, job, wid } */
const HIT47_CACHE = new Map();
function hitInfo47(src) {
  if (!src) return null;
  if (HIT47_CACHE.has(src)) return HIT47_CACHE.get(src);
  let r = null;
  if (HIT_KIND[src]) r = { k: HIT_KIND[src], wid: src };
  else if (src.startsWith('fu_')) {
    const [, j, id] = src.split('_'), sym = FZ_SYMBOL[j];
    if (sym && HIT_KIND[sym]) r = { k: HIT_KIND[sym], k2: HIT_KIND[id] && HIT_KIND[id] !== HIT_KIND[sym] ? HIT_KIND[id] : null, col: JOB_COL[j], job: j, wid: sym, fu: true };
  }
  HIT47_CACHE.set(src, r); return r;
}
const H47 = () => G.h47 || (G.h47 = { marks: [], forms: [], stopAt: -9, frame: { t: -1, n: {} }, cine: null, vibAt: -1e9 });

/* 타격음: damageEnemy 안의 sfx('hit')를 성격별 소리로 교체 */
Object.assign(SFX, {
  hit_heavy: { gap: 0.06, f: (d, t) => { noiseHit(d, t, 0.09, 0.26, 600); tone(d, 'square', 190, t, 0.09, 0.12, 62); } },
  hit_multi: { gap: 0.035, f: (d, t) => { tone(d, 'square', 900, t, 0.025, 0.05, 700); noiseHit(d, t, 0.02, 0.08, 4000); } },
  hit_pierce: { gap: 0.05, f: (d, t) => { noiseHit(d, t, 0.04, 0.14, 4200); tone(d, 'triangle', 1250, t, 0.05, 0.06, 480); } },
  hit_blast: { gap: 0.06, f: (d, t) => { noiseHit(d, t, 0.08, 0.2, 1100); tone(d, 'sawtooth', 240, t, 0.07, 0.07, 110); } },
  hit_dot: { gap: 0.08, f: (d, t) => { tone(d, 'sine', 1500, t, 0.05, 0.05, 1900); } },
});
const SND47 = { k: null };
const _sfx47 = sfx;
sfx = function (k) { if (k === 'hit' && SND47.k) return _sfx47('hit_' + SND47.k); return _sfx47(k); };

/* ---------- 피해 감싸기: 성격 표시·멈춤·직업 진동 ---------- */
const _damageEnemy47 = damageEnemy;
damageEnemy = function (e, dmg, o = {}) {
  if (!e || e.dead || !G.p) return _damageEnemy47(e, dmg, o);
  const I = hitInfo47(o.src), hp0 = e.hp;
  SND47.k = I ? I.k : null;
  try { _damageEnemy47(e, dmg, o); } finally { SND47.k = null; }
  if (e.hp >= hp0 && !e.dead) return;                       // 막힘·보호막·보류
  hitAfter47(e, o, I);
};
function hitAfter47(e, o, I) {
  const H = H47(), p = G.p, F = H.frame;
  if (F.t !== G.time) { F.t = G.time; F.n = {}; }
  const big = e.elite || e.gk || e.boss;
  let heavyBig = false;
  if (I) {
    const n = F.n[o.src] = (F.n[o.src] || 0) + 1;
    if (I.k === 'heavy' && (o.crit || big || n === V47.bigN)) heavyBig = !(n > V47.bigN);
    if (n <= (I.k === 'multi' ? 4 : 8)) mark47(e, I, o, heavyBig);
  }
  if (heavyBig) hitStop47(V47.stopHeavy, e);
  else if (big && !e.clone && I) hitStop47(V47.stopBig, e);   // 정예·보스 멈춤은 플레이어 무기 타격만 (동료·궁극기 제외)
  /* 직업 결정적 순간 */
  const j = p.job; if (!j) return;
  if (heavyBig && (j === 'warrior' || j === 'sovereign' || j === 'druid')) jobVib47(j, true);
  else if (o.src === 'mark' && j === 'archer') jobVib47(j);
  else if (o.src === 'react' && j === 'mage') jobVib47(j);
}
function hitStop47(S, e) {
  const H = H47(); if (G.time - H.stopAt < V47.stopGap) return;
  H.stopAt = G.time; S47().hs++;
  if (SETTINGS.hitstop === false) return;
  rcSlow(S.k, S.t);
  if (S === V47.stopHeavy) shake(2.2, 0.12);
}
function jobVib47(j, strong) {
  const H = H47(), t = performance.now(); if (t - H.vibAt < V47.vibGap) return;
  H.vibAt = t; const V = S47().vib; V[j] = (V[j] || 0) + 1;
  if (!SETTINGS.vibe || STATE.dev.auto || !navigator.vibrate) return;
  try { navigator.vibrate(strong ? V47.vibStrong : V47.vibWeak); } catch (err) { }
}

/* 타격 표시 (임시 도형) */
function mark47(e, I, o, heavyBig) {
  const H = H47(); if (H.marks.length >= V47.hitMax) return;
  const p = G.p, a = Math.atan2(e.y - p.y, e.x - p.x);
  const durK = { heavy: 0.22, multi: 0.12, pierce: 0.16, blast: 0.3, dot: 0.25 };
  H.marks.push({ x: e.x, y: e.y, r: e.r || 8, a, k: I.k, k2: I.k2, col: I.col || HIT_COL[I.k], t: 0, dur: heavyBig ? 0.32 : durK[I.k], big: heavyBig, crit: !!o.crit });
}
function drawMark47(c, m, k, kind, s, col) {
  const q = 1 - k, x = m.x, y = m.y, r = m.r;
  c.strokeStyle = col; c.fillStyle = col;
  if (kind === 'heavy') {
    c.globalAlpha = 0.9 * q; c.lineWidth = 3 * s;
    for (let i = 0; i < 4; i++) { const b = m.a + Math.PI / 4 + i * Math.PI / 2, r0 = r * 0.4 + 6 * k, r1 = r0 + (9 + 6 * k) * s; c.beginPath(); c.moveTo(x + Math.cos(b) * r0, y + Math.sin(b) * r0); c.lineTo(x + Math.cos(b) * r1, y + Math.sin(b) * r1); c.stroke(); }
    if (m.big) { c.globalAlpha = 0.75 * q; c.lineWidth = 3.5 * q + 1; c.beginPath(); c.arc(x, y, r + 8 + 34 * (1 - q * q), 0, 7); c.stroke(); c.fillStyle = '#fff4dc'; c.globalAlpha = 0.5 * q * q; c.beginPath(); c.arc(x, y, r * 0.9, 0, 7); c.fill(); }
  } else if (kind === 'multi') {
    const L = 5 * s * (0.6 + k); c.globalAlpha = q; c.lineWidth = 1.6 * s;
    c.beginPath(); c.moveTo(x - L, y); c.lineTo(x + L, y); c.moveTo(x, y - L); c.lineTo(x, y + L); c.stroke();
  } else if (kind === 'pierce') {
    const L = (16 + 22 * k) * s, ca = Math.cos(m.a), sa = Math.sin(m.a); c.globalAlpha = 0.85 * q; c.lineWidth = 1.6 * s;
    c.beginPath(); c.moveTo(x - ca * L * 0.6, y - sa * L * 0.6); c.lineTo(x + ca * L, y + sa * L); c.stroke();
    c.globalAlpha = 0.5 * q; c.beginPath(); c.arc(x + ca * L, y + sa * L, 1.8 * s, 0, 7); c.fill();
  } else if (kind === 'blast') {
    c.globalAlpha = 0.85 * q;
    for (let i = 0; i < 3; i++) { const b = m.a * 3 + i * 2.1, d = (4 + 12 * k) * s; c.beginPath(); c.arc(x + Math.cos(b) * d, y + Math.sin(b) * d - 14 * k * s, 2.2 * s * q + 0.6, 0, 7); c.fill(); }
  } else if (kind === 'dot') {
    const d = (4 + 2 * Math.sin(k * 18)) * s; c.globalAlpha = 0.8 * q; c.lineWidth = 1.3 * s;
    c.beginPath(); c.moveTo(x, y - d - r * 0.5); c.lineTo(x + d * 0.7, y - r * 0.5); c.lineTo(x, y + d - r * 0.5); c.lineTo(x - d * 0.7, y - r * 0.5); c.closePath(); c.stroke();
  }
}

/* ---------- 무기 외형 변화 (Lv 3 분기·Lv 5 각성, 임시 도형) ---------- */
/* 분기 키 → 형태. 같은 무기의 두 분기는 서로 다른 형태 */
const FORM47 = {
  cleave: { wide: 'sweep', double: 'cross' }, shield: { wall: 'wall', twin: 'twinring' }, slam: { after: 'ripple', fissure: 'crack' },
  arrow: { pierce: 'lance', split: 'fork' }, shuriken: { ricochet: 'zigzag', scatter: 'stars' }, trap: { snare: 'net', cluster: 'tri' },
  fireball: { big: 'flare', pool: 'puddle' }, icering: { freeze: 'spikes', shatter: 'shards' }, orb: { swarm: 'swarm', nova: 'nova' }, beam: { prism: 'prism', track: 'curve' },
};
const _rcFire47 = rcFire;
rcFire = function (w) {
  const r = _rcFire47.apply(this, arguments);
  try { if (w && G.p && !w.fu) form47(w); else if (w && w.big47) bigFire47(w); } catch (err) { if (STATE.dev.auto) throw err; }
  return r;
};
function form47(w) {
  const F = FORM47[w.id], shp = F && w.br && F[w.br];
  if (w.big47) bigFire47(w);
  if (!shp) return;
  const H = H47(); if (H.forms.length >= V47.formMax) H.forms.shift();
  const p = G.p, awI = w.aw && AWAKEN[w.id] ? Math.max(0, AWAKEN[w.id].findIndex(o => o.k === w.aw)) : -1;
  H.forms.push({ shp, aw: awI, t: 0, dur: awI >= 0 ? 0.55 : 0.42, a: Math.atan2(p.face.y, p.face.x), col: CFG.colors[WEAPONS[w.id].cat], s: (awI >= 0 ? 1.35 : 1) * (w.bigS47 || 1) });
  w.bigS47 = 0; S47().forms++;
}
/* 각성·연성 후 첫 발동: 크게 */
function bigFire47(w) {
  w.big47 = false; S47().big++;
  const p = G.p, col = w.fu ? JOB_COL[w.fu.job] : CFG.colors[WEAPONS[w.id].cat];
  fx({ kind: 'ring', x: p.x, y: p.y, r0: 16, r1: 190, dur: 0.55, color: col, fill: true, follow: true });
  fx({ kind: 'ring', x: p.x, y: p.y, r0: 30, r1: 250, dur: 0.7, color: '#ffffff', follow: true });
  sparkBurst(p.x, p.y, 90, col); shake(3, 0.25); w.bigS47 = 1.8;
}
function drawForm47(c, f) {
  const k = clamp(f.t / f.dur, 0, 1), q = 1 - k, p = G.p, x = p.x, y = p.y, s = f.s, a = f.a, ca = Math.cos(a), sa = Math.sin(a), tau = Math.PI * 2;
  const P = (d, b = 0) => [x + Math.cos(a + b) * d, y + Math.sin(a + b) * d];
  c.strokeStyle = f.col; c.fillStyle = f.col; c.globalAlpha = 0.75 * q; c.lineWidth = 2 * s;
  const R = (22 + 26 * k) * s;
  switch (f.shp) {
    case 'sweep': c.lineWidth = 4 * q * s + 1; c.beginPath(); c.arc(x, y, R * 1.5, a - 1.5, a + 1.5); c.stroke(); break;
    case 'cross': for (const d of [-0.6, 0.6]) { const [x1, y1] = P(R * 1.2, d - 0.5), [x2, y2] = P(R * 1.2, d + 0.5); c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(...P(R * 1.6, d), x2, y2); c.stroke(); } break;
    case 'wall': { const [cx, cy] = P(R * 1.1); c.save(); c.translate(cx, cy); c.rotate(a); c.fillRect(-3 * s, -R * 0.9, 6 * s, R * 1.8); c.restore(); break; }
    case 'twinring': for (const m of [0.7, 1.15]) { c.beginPath(); c.arc(x, y, R * m * 1.3, 0, tau); c.stroke(); } break;
    case 'ripple': for (let i = 0; i < 3; i++) { const kk = clamp(k * 1.6 - i * 0.25, 0, 1); if (kk <= 0 || kk >= 1) continue; c.globalAlpha = 0.6 * (1 - kk); c.beginPath(); c.ellipse(x, y + 6, (18 + 70 * kk) * s, (8 + 30 * kk) * s, 0, 0, tau); c.stroke(); } break;
    case 'crack': for (let i = 0; i < 4; i++) { const b = i * Math.PI / 2 + Math.PI / 4; c.beginPath(); c.moveTo(x, y); for (let n = 1; n <= 4; n++) { const d = R * 1.6 * n / 4, z = (n % 2 ? 5 : -5) * s; c.lineTo(x + Math.cos(b) * d - Math.sin(b) * z, y + Math.sin(b) * d + Math.cos(b) * z); } c.stroke(); } break;
    case 'lance': { const [x1, y1] = P(14 * s), [x2, y2] = P(R * 2.6); c.lineWidth = 3 * s * q + 0.5; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); break; }
    case 'fork': for (const d of [-0.32, 0, 0.32]) { const [x1, y1] = P(R * 1.1, d * 0.3), [x2, y2] = P(R * 2.1, d); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); } break;
    case 'zigzag': { c.beginPath(); c.moveTo(x, y); for (let n = 1; n <= 5; n++) { const d = R * 2.2 * n / 5, z = (n % 2 ? 10 : -10) * s; c.lineTo(x + ca * d - sa * z, y + sa * d + ca * z); } c.stroke(); break; }
    case 'stars': for (let i = 0; i < 3; i++) { const [sx, sy] = P(R * (1 + i * 0.35), (i - 1) * 0.45); star47(c, sx, sy, 4 * s, 4, k * 6); } break;
    case 'net': { const [cx, cy] = P(R * 1.3); for (let i = 0; i < 6; i++) { const b = i * Math.PI / 3, b2 = b + Math.PI / 3, rr = 14 * s; c.beginPath(); c.moveTo(cx + Math.cos(b) * rr, cy + Math.sin(b) * rr); c.lineTo(cx + Math.cos(b2) * rr, cy + Math.sin(b2) * rr); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(b) * rr, cy + Math.sin(b) * rr); c.stroke(); } break; }
    case 'tri': for (let i = 0; i < 3; i++) { const [cx, cy] = P(R * 1.3 + (i ? 10 * s : 0), (i - 1) * 0.5); c.beginPath(); c.arc(cx, cy, 4 * s, 0, tau); c.fill(); } break;
    case 'flare': c.lineWidth = 3 * s * q + 0.5; c.beginPath(); c.arc(x, y, R * 1.25, 0, tau); c.stroke(); for (let i = 0; i < 8; i++) { const b = i * Math.PI / 4 + k; c.beginPath(); c.moveTo(x + Math.cos(b) * R * 1.25, y + Math.sin(b) * R * 1.25); c.lineTo(x + Math.cos(b) * R * 1.6, y + Math.sin(b) * R * 1.6); c.stroke(); } break;
    case 'puddle': { const [cx, cy] = P(R * 0.9); c.globalAlpha = 0.35 * q; c.beginPath(); c.ellipse(cx, cy + 6, R * 0.9, R * 0.4, 0, 0, tau); c.fill(); break; }
    case 'spikes': for (let i = 0; i < 6; i++) { const b = i * Math.PI / 3, r0 = R * 0.8, r1 = R * 1.5; c.beginPath(); c.moveTo(x + Math.cos(b - 0.12) * r0, y + Math.sin(b - 0.12) * r0); c.lineTo(x + Math.cos(b) * r1, y + Math.sin(b) * r1); c.lineTo(x + Math.cos(b + 0.12) * r0, y + Math.sin(b + 0.12) * r0); c.stroke(); } break;
    case 'shards': for (let i = 0; i < 7; i++) { const b = i * 0.9 + 0.3, d = R * (0.9 + 0.6 * k); c.save(); c.translate(x + Math.cos(b) * d, y + Math.sin(b) * d); c.rotate(b + k * 4); c.fillRect(-1.5 * s, -4 * s, 3 * s, 8 * s); c.restore(); } break;
    case 'swarm': for (let i = 0; i < 5; i++) { const b = i * tau / 5 + k * 6; c.beginPath(); c.arc(x + Math.cos(b) * R * 0.9, y + Math.sin(b) * R * 0.9, 2.6 * s, 0, tau); c.fill(); } break;
    case 'nova': star47(c, x, y, R * 1.2, 8, 0, true); break;
    case 'prism': { const [cx, cy] = P(R * 0.9); c.beginPath(); for (let i = 0; i < 3; i++) { const b = a + i * tau / 3; i ? c.lineTo(cx + Math.cos(b) * 8 * s, cy + Math.sin(b) * 8 * s) : c.moveTo(cx + Math.cos(b) * 8 * s, cy + Math.sin(b) * 8 * s); } c.closePath(); c.stroke(); for (const d of [-0.3, 0, 0.3]) { c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a + d) * R * 1.4, cy + Math.sin(a + d) * R * 1.4); c.stroke(); } break; }
    case 'curve': { c.beginPath(); c.moveTo(...P(12 * s)); c.quadraticCurveTo(...P(R * 1.6, 0.6), ...P(R * 2.4, -0.15)); c.stroke(); break; }
  }
  /* Lv 5 각성 표지: 각성 선택지별 2형 (0 = 회전 문양 고리, 1 = 잔상 겹침) */
  if (f.aw === 0) { c.globalAlpha = 0.6 * q; c.lineWidth = 1.4; c.beginPath(); c.arc(x, y, (30 + 12 * k) * s, 0, tau); c.stroke(); for (let i = 0; i < 6; i++) { const b = i * tau / 6 + k * 3; c.fillRect(x + Math.cos(b) * (30 + 12 * k) * s - 2, y + Math.sin(b) * (30 + 12 * k) * s - 2, 4, 4); } }
  else if (f.aw === 1) { c.globalAlpha = 0.45 * q; c.fillStyle = '#ffffff'; for (let i = 1; i <= 3; i++) { const [gx, gy] = P(-6 * i * s); c.beginPath(); c.arc(gx, gy, 3.5 * s * (1 - i * 0.2), 0, tau); c.fill(); } }
}
function star47(c, x, y, r, n, rot, burst) {
  c.beginPath();
  for (let i = 0; i < n * 2; i++) { const b = rot + i * Math.PI / n, rr = i % 2 ? r * (burst ? 0.35 : 0.45) : r; i ? c.lineTo(x + Math.cos(b) * rr, y + Math.sin(b) * rr) : c.moveTo(x + Math.cos(b) * rr, y + Math.sin(b) * rr); }
  c.closePath(); burst ? c.stroke() : c.fill();
}

/* ---------- 그리기 (월드 좌표, drawFx 다음) ---------- */
const _drawFx47 = drawFx;
drawFx = function (c) {
  _drawFx47(c);
  const H = G.h47; if (!H || (!H.marks.length && !H.forms.length)) return;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  for (const f of H.forms) drawForm47(c, f);
  for (const m of H.marks) {
    const k = clamp(m.t / m.dur, 0, 1);
    drawMark47(c, m, k, m.k, m.big ? 1.5 : 1, m.col);
    if (m.k2) drawMark47(c, m, k, m.k2, 0.6, HIT_COL[m.k2]);   // 연성: 짝 무기 성격 보조 표시
  }
  c.restore(); c.globalAlpha = 1;
};
function upd47(dt) {
  const H = G.h47; if (!H) return;
  if (H.marks.length) { for (const m of H.marks) m.t += dt; H.marks = H.marks.filter(m => m.t < m.dur); }
  if (H.forms.length) { for (const f of H.forms) f.t += dt; H.forms = H.forms.filter(f => f.t < f.dur); }
}

/* ---------- 성장 순간 연출 등급제 ---------- */
function cine47(kind, col, w) {
  const H = H47(), d = V47.cine[kind]; if (!d) return;
  const C = H.cine;
  if (!C || d >= C.dur - C.t) H.cine = { kind, t: 0, dur: d, col: col || '#ffe08a' };   // 더 긴 연출 우선
  const S = S47().cine; S[kind] = (S[kind] || 0) + 1;
  if (w) w.big47 = true;
}
function cineEnd47(C) {
  const p = G.p, P = V47.push, R2 = P.R * P.R;
  for (const e of G.enemies) {
    if (e.dead || e.cmd) continue;
    const dx = e.x - p.x, dy = e.y - p.y, d2 = dx * dx + dy * dy; if (d2 > R2) continue;
    const d = Math.sqrt(d2) || 1, f = (e.boss || e.gk ? 0.25 : 1) * (1 - d / P.R * 0.5);
    e.kbx = (e.kbx || 0) + dx / d * P.kb * f; e.kby = (e.kby || 0) + dy / d * P.kb * f;
  }
  if (G.eb && G.eb.length) G.eb = G.eb.filter(b => dist2(b.x, b.y, p.x, p.y) > R2 * 0.6);   // 주변 적 탄환 소거
  p.invT = Math.max(p.invT, 0.4);
  fx({ kind: 'ring', x: p.x, y: p.y, r0: 20, r1: P.R, dur: 0.35, color: C.col, fill: true });
}
const _step47 = step;
step = function (dt) {
  const H = G && G.h47;
  if (H && H.cine && !G.result) {
    const C = H.cine; C.t += dt;
    for (const f of G.fx) f.t += dt; G.fx = G.fx.filter(f => f.t < f.dur);   // 연출용 시각 효과만 진행
    for (const t of G.toasts) t.t += dt; G.toasts = G.toasts.filter(t => t.t < t.dur);
    updateJuice(dt); upd47(dt);
    if (C.t >= C.dur) { H.cine = null; cineEnd47(C); }
    return;
  }
  _step47(dt); upd47(dt);
};
/* 화면 확대 (2차 전직): 월드 그리기 직후 화면 중앙 기준 확대 복사 */
const _drawPhaseFog47 = drawPhaseFog;
drawPhaseFog = function (c) {
  const C = G.h47 && G.h47.cine;
  if (C && C.kind === 'job2') {
    const k = C.t / C.dur, z = 1 + (V47.zoom2 - 1) * Math.sin(Math.PI * Math.min(1, k)), cv = c.canvas;
    if (z > 1.005) { const W = cv.width, Hh = cv.height, sw = W / z, sh = Hh / z; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false; c.drawImage(cv, (W - sw) / 2, (Hh - sh) / 2, sw, sh, 0, 0, W, Hh); c.restore(); }
  }
  return _drawPhaseFog47(c);
};
/* 연출 화면층: 둘레 어둡힘 + 직업·무기 색 방사선 */
const _drawReactScreen47 = drawReactScreen;
drawReactScreen = function (c) {
  _drawReactScreen47(c);
  const C = G.h47 && G.h47.cine; if (!C) return;
  const W = VIEW.cw, Hh = VIEW.ch, k = clamp(C.t / C.dur, 0, 1), cx = W / 2, cy = Hh / 2, inA = Math.min(1, k * 5), outA = Math.min(1, (1 - k) * 5), A = inA * outA;
  const lv = C.kind === 'awaken' ? 0.5 : C.kind === 'job2' ? 1 : 0.8;
  const g = c.createRadialGradient(cx, cy, Math.min(W, Hh) * 0.18, cx, cy, Math.max(W, Hh) * 0.7);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(8,6,16,${0.55 * lv * A})`);
  c.fillStyle = g; c.fillRect(0, 0, W, Hh);
  c.save(); c.globalAlpha = 0.5 * A; c.strokeStyle = C.col; c.lineWidth = 2;
  const n = C.kind === 'awaken' ? 8 : C.kind === 'job2' ? 20 : 14, r0 = 40 + 30 * k, r1 = r0 + 60 + 160 * lv * k;
  for (let i = 0; i < n; i++) { const b = i * Math.PI * 2 / n + k * 0.6; c.beginPath(); c.moveTo(cx + Math.cos(b) * r0, cy + Math.sin(b) * r0); c.lineTo(cx + Math.cos(b) * r1, cy + Math.sin(b) * r1); c.stroke(); }
  c.globalAlpha = 0.7 * A; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, 24 + 90 * lv * k, 0, Math.PI * 2); c.stroke();
  c.restore(); c.globalAlpha = 1;
};

/* 성장 지점 연결 */
const _applyBranch47 = applyBranch;
applyBranch = function (c) {
  const r = _applyBranch47.apply(this, arguments);
  if (c && c.aw && c.kind === 'w') { const w = G.p.weapons.find(x => x.id === c.id); cine47('awaken', CFG.colors[WEAPONS[c.id].cat], w); }
  return r;
};
const _applyJob47 = applyJob;
applyJob = function (id) { const r = _applyJob47.apply(this, arguments); cine47('job', JOB_COL[id]); return r; };
const _applyJob2_47 = applyJob2;
applyJob2 = function (k) { const r = _applyJob2_47.apply(this, arguments); cine47('job2', JOB_COL[G.p.job]); jobVib47(G.p.job, true); return r; };
const _applyFuse47 = applyFuse;
applyFuse = function (id) {
  const n0 = fusedWs().length, r = _applyFuse47.apply(this, arguments);
  if (fusedWs().length > n0) { const w = G.p.weapons.find(x => x.id === id && x.fu); cine47('fuse', JOB_COL[G.p.job], w); }
  return r;
};

/* ---------- 직업 결정적 순간 (약 진동) ---------- */
const _addTurret47 = addTurret;
addTurret = function (x, y, temp) { const r = _addTurret47.apply(this, arguments); if (!temp && G.p.job === 'engineer') jobVib47('engineer'); return r; };
const _addMinion47 = addMinion;
addMinion = function () { const r = _addMinion47.apply(this, arguments); if (G.p.job === 'summoner') jobVib47('summoner'); return r; };
const _purify47 = purify;
purify = function () { const r = _purify47.apply(this, arguments); if (G.p.job === 'priest') jobVib47('priest'); return r; };
const _onEnemyHit47 = onEnemyHit;
onEnemyHit = function (e, o) {
  const f0 = e && e.frz || 0, r = _onEnemyHit47.apply(this, arguments);
  if (G.p.job === 'chrono' && e && (e.frz || 0) > f0 + 0.5) jobVib47('chrono');
  return r;
};
const _updateJob47 = updateJob;
updateJob = function (dt) {
  const n0 = G.stats.passes || 0, r = _updateJob47.apply(this, arguments);
  if (G.p.job === 'rogue' && (G.stats.passes || 0) > n0) jobVib47('rogue');
  return r;
};
