/* ============================================================
   0.56 전면 점검 패치 4차 — 연출·몰입 (회차 62)
   • 사망 클로즈업: 느려짐 → 주인공 쪽 확대·색 빠짐 → 쓰러짐 + 한마디 말풍선 → 결과 화면 (화면 누르면 넘김)
   • 마왕 처치 클로즈업: 마왕 쪽 확대 → 그림자 붕괴(임시 도형, 최종본 아님) + 마왕 한마디 → 주인공 한마디 → 결과
   • 무기 발동 인지: 새로 얻거나 모습이 바뀐(분기·각성·연성·직업형) 무기는 처음 3번 발동할 때 머리 위 이름표 + 무기 칸 강조,
     무기 칸은 발동 순간 짧게 밝아짐 (0.5초보다 빠른 연속 발동은 제외)
   • 결과 화면 정리: 한 줄 요약 · 핵심 수치 4칸 · 피해 비중 상위 4 · 빌드 아이콘(누르면 내 능력) · 버튼
   • 첫 판 안내 보강: 정예·분기/각성·전직 후·연성·수문장 안내 추가, 상자 문구 현행화, 첫 선택 화면 도움말
   ============================================================ */
const V56 = {
  dead: { dur: 2.3, zoom: 1.32, slowK: 0.25, slowT: 0.7 },
  demon: { dur: 3.2, zoom: 1.45, pop: 1.5, pan: 1.9 },
  tagN: 3, tagDur: 1.1, pulse: 0.16, pulseGap: 0.5, skipAt: 0.5,
};
const S56 = () => G.stats.v56 || (G.stats.v56 = { cu: {}, tag: 0, skip: 0 });
const ease56 = t => { t = clamp(t, 0, 1); return 1 - (1 - t) ** 3; };

/* ---------- 한마디 ---------- */
const SAY56 = {
  early: ['너무 서둘렀어.', '방심했다.'],
  field: ['…다시.', '한 번 더. 처음부터.', '기억해 둔다. 이 자리를.', '아직, 끝이 아니야.'],
  gate: { bargan: '이 문, 다음엔 넘는다.', igna: '불길 너머가 보였는데…', morden: '망자들 사이에, 익숙한 얼굴이…', seren: '거울 속의 내가, 웃고 있었어.' },
  demon: ['왕좌가, 눈앞이었는데…', '다음엔 계단 끝까지.'],
  post: ['기억 속에서도 쓰러지는구나.', '내가 고른 싸움이야. 다시.'],
  dmFall: ['이 그림자는… 지지 않는다…', '몇 번이고… 다시 일어선다…'],
  dmFree: ['그림자가… 흩어진다…'],
  heroWin: ['…쓰러뜨렸다.', '해냈어. 이번에는.'],
  heroFree: ['이번엔, 정말로.'],
};
function deadLine56() {
  const ph = G.ph || {};
  if (ph.id === 'demon') return pick(SAY56.demon);
  if (ph.id === 'gate' && SAY56.gate[G.gk]) return SAY56.gate[G.gk];
  let s = {}; try { s = loadSave(); } catch (e) { }
  if (s.trueEnd) return pick(SAY56.post);
  return pick(G.time < 120 ? SAY56.early : SAY56.field);
}

/* ---------- 클로즈업 시작·진행 ---------- */
function cuStart56(kind, o) { G.cu56 = Object.assign({ kind, t: 0 }, o); const S = S56().cu; S[kind] = (S[kind] || 0) + 1; }
const _hurtPlayer56 = hurtPlayer;
hurtPlayer = function () {
  const had = G.result, r = _hurtPlayer56.apply(this, arguments);
  if (!had && G.result === 'dead') { const D = V56.dead; G.endT = D.dur; rcSlow(D.slowK, D.slowT); cuStart56('dead', { dur: D.dur, line: deadLine56(), ext: 1 }); }
  return r;
};
const _dmKilled56 = dmKilled;
dmKilled = function (e) {
  const r = _dmKilled56.apply(this, arguments), free = !!(G.story && G.story.freed);
  cuStart56('demon', { dur: V56.demon.dur, x: e.x, y: e.y, r: e.r || 34, line: pick(free ? SAY56.dmFree : SAY56.dmFall), line2: pick(free ? SAY56.heroFree : SAY56.heroWin), acc: 0 });
  return r;
};
function cuUpd56(C, dt) {
  if (C.kind === 'dead' && !G.result) { G.cu56 = null; return; }                 // 시간술사 되감기 등으로 되살아남
  C.t += dt;
  if (C.kind === 'demon') {
    if (G.result === 'clear' && !C.ext) { C.ext = 1; G.endT = Math.max(G.endT, C.dur - C.t); }
    const D = V56.demon;
    if (C.t < D.pop) { C.acc += dt; while (C.acc > 0.11) { C.acc -= 0.11; sparkUp(C.x + rand(-C.r, C.r), C.y + rand(-C.r * 0.6, C.r * 0.6), 2, ['#b48cff', '#e8d8ff', '#7a4ad0'], 18); } }
    else if (!C.pop) { C.pop = 1; burst(C.x, C.y, 26, '#e8d8ff', 240, 0.9, 3); fx({ kind: 'ring', x: C.x, y: C.y, r0: 8, r1: 210, dur: 0.7, color: '#fff6c8' }); shake(6, 0.5); rcFlash('#ffffff', 0.4, 0.5); }
  }
  if (C.t > C.dur + 0.6 && !G.result) G.cu56 = null;       // 판이 끝나지 않는 예외 상황 방어
}
const _step56 = step;
step = function (dt) { _step56(dt); const C = G && G.cu56; if (C && !G.finished) cuUpd56(C, dt); };
function cuSkip56() {
  const C = G && G.cu56; if (!C || STATE.mode !== 'play' || !G.result || G.finished || C.t < V56.skipAt) return;
  C.ext = 1; G.endT = Math.min(G.endT, 0.05); S56().skip++;
}
if (typeof cv !== 'undefined' && cv && cv.addEventListener) cv.addEventListener('pointerdown', cuSkip56);
const cuOn56 = () => { const C = G && G.cu56; return C && !G.finished && STATE.mode === 'play' ? C : null; };

/* ---------- 확대: 월드 그리기 직후 화면 일부를 전체로 늘려 복사 ---------- */
function cuView56(C) {
  const cvs = ctx.canvas, W = cvs.width, H = cvs.height, K = VIEW.dpr * VIEW.zoom, p = G.p, V = V56[C.kind];
  const out = ease56((C.dur - C.t) / 0.35), inn = ease56(C.t / (C.kind === 'dead' ? 0.2 : 0.3));
  const z = VFX.reduced.matches ? 1 : 1 + (V.zoom - 1) * Math.min(inn, out);
  let fx0 = W / 2, fy0 = H / 2;
  if (C.kind === 'demon') {
    const dx = clamp(W / 2 + (C.x - p.x) * K, W * 0.12, W * 0.88), dy = clamp(H / 2 + (C.y - p.y) * K, H * 0.14, H * 0.86), k = ease56((C.t - V.pan) / 0.5);
    fx0 = dx + (W / 2 - dx) * k; fy0 = dy + (H / 2 - dy) * k;
  }
  const sw = W / z, sh = H / z, sx = clamp(fx0 - sw / 2, 0, W - sw), sy = clamp(fy0 - sh / 2, 0, H - sh);
  return { z, sx, sy, sw, sh, W, H, K };
}
const cuPt56 = (v, wx, wy) => ({ x: ((v.W / 2 + (wx - G.p.x) * v.K - v.sx) * v.z) / VIEW.dpr, y: ((v.H / 2 + (wy - G.p.y) * v.K - v.sy) * v.z) / VIEW.dpr });
const _drawPhaseFog56 = drawPhaseFog;
drawPhaseFog = function (c) {
  const C = cuOn56();
  if (C) {
    const v = C.v = cuView56(C);
    if (v.z > 1.004) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false; c.drawImage(c.canvas, v.sx, v.sy, v.sw, v.sh, 0, 0, v.W, v.H); c.restore(); }
  }
  return _drawPhaseFog56.apply(this, arguments);
};

/* ---------- 월드: 쓰러지는 주인공 · 마왕 그림자 붕괴(임시 도형) ---------- */
const _drawPlayer56 = drawPlayer;
drawPlayer = function (c) {
  const C = cuOn56();
  if (!C || C.kind !== 'dead') return _drawPlayer56.apply(this, arguments);
  const p = G.p, k = ease56(C.t / 0.3), by = p.y + p.r * 1.1, dir = p.face && p.face.x < 0 ? 1 : -1;
  fieldContactShadow(c, p.x, by, p.r * (1 + 0.5 * k));
  c.save(); c.translate(p.x, by); c.rotate(dir * 1.4 * k); c.translate(-p.x, -by); c.globalAlpha = 1 - 0.25 * k;
  drawHeroReact(c, 0, false, heroTint());
  c.restore();
};
function drawDemonFall56(c, C) {
  const D = V56.demon; if (C.t >= D.pop) return;
  const k = C.t / D.pop, R = C.r * (1.15 - 0.55 * k), jx = rand(-1, 1) * 2.5 * k, jy = rand(-1, 1) * 2.5 * k, tau = Math.PI * 2;
  c.save(); c.translate(C.x + jx, C.y + jy);
  c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  const n = 3 + Math.floor(k * 7);
  for (let i = 0; i < n; i++) {                                // 몸에서 새어 나오는 빛줄기
    const a = i * 2.399 + C.t * 0.5, L = R * (1.6 + 1.9 * k) * (0.7 + 0.3 * Math.sin(C.t * 9 + i));
    const g = c.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L); g.addColorStop(0, `rgba(255,246,200,${0.5 * k + 0.15})`); g.addColorStop(1, 'rgba(255,246,200,0)');
    c.strokeStyle = g; c.lineWidth = 2 + 3 * k; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * L, Math.sin(a) * L); c.stroke();
  }
  c.globalCompositeOperation = 'source-over';
  const g2 = c.createRadialGradient(0, 0, R * 0.2, 0, 0, R); g2.addColorStop(0, '#1a0e24'); g2.addColorStop(0.75, '#3a1c5c'); g2.addColorStop(1, 'rgba(122,74,208,0)');
  c.fillStyle = g2; c.beginPath(); c.arc(0, 0, R, 0, tau); c.fill();
  c.fillStyle = `rgba(255,246,200,${0.35 + 0.6 * k})`; c.beginPath(); c.arc(0, 0, R * (0.12 + 0.3 * k * k), 0, tau); c.fill();   // 안쪽에서 번지는 빛
  c.restore();
}

/* ---------- 무기 발동 인지: 이름표 ---------- */
const sig56 = w => [w.id, w.br || '', w.aw || '', w.fu ? 'u' : '', form53(w) ? 'f' : ''].join('|');
const name56 = w => w.fu && w.fu.nm ? w.fu.nm : wName(w.id);
const T56 = () => G.t56 || (G.t56 = []);
function fire56(w) {
  if (!w || !w.id || !WEAPONS[w.id]) return;
  w.pg56 = w.ft56 == null || G.time - w.ft56 >= V56.pulseGap; w.ft56 = G.time;
  const s = sig56(w); if (w.sg56 !== s) { w.sg56 = s; w.tg56 = V56.tagN; }
  if (w.tg56 > 0) {
    w.tg56--; const L = T56(), old = L.find(x => x.w === w);
    if (old) old.t = Math.min(old.t, 0.12); else if (L.length < 4) L.push({ w, nm: name56(w), col: w.fu || w.base ? (JOB_COL[G.p.job] || '#ffe08a') : CFG.colors[WEAPONS[w.id].cat] || '#ffe08a', t: 0, dur: V56.tagDur });
    S56().tag++;
  }
}
const _rcFire56 = rcFire;
rcFire = function (w) { const r = _rcFire56.apply(this, arguments); try { fire56(w); } catch (e) { } return r; };
const _updateJuice56 = updateJuice;
updateJuice = function (dt) { const r = _updateJuice56.apply(this, arguments); const L = G.t56; if (L && L.length) { for (const t of L) t.t += dt; G.t56 = L.filter(t => t.t < t.dur); } return r; };
function drawTags56(c) {
  const L = G.t56; if (!L || !L.length || G.result) return;
  const p = G.p; c.save(); c.imageSmoothingEnabled = true; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 11px ${UI_ART.font}`;
  L.forEach((t, i) => {
    const a = clamp(Math.min(t.t * 8, (t.dur - t.t) * 3.5), 0, 1), up = 6 * ease56(t.t / 0.25), w = Math.min(120, c.measureText(t.nm).width) + 14, x = p.x, y = p.y - p.r - 30 - up - i * 17;
    c.globalAlpha = a * 0.88; c.fillStyle = 'rgba(18,24,34,.86)'; uiRound(c, x - w / 2, y - 8, w, 16, 8); c.fill();
    c.strokeStyle = t.col; c.lineWidth = 1; c.stroke();
    c.globalAlpha = a; c.fillStyle = '#f6efdc'; c.fillText(t.nm, x, y + 0.5, 120);
  });
  c.restore();
}
const _drawJuice56 = drawJuice;
drawJuice = function (c) {
  const r = _drawJuice56.apply(this, arguments);
  try { const C = cuOn56(); if (C && C.kind === 'demon') drawDemonFall56(c, C); drawTags56(c); } catch (e) { }
  return r;
};
/* 무기 칸: 발동 순간 밝아짐 + 이름표가 떠 있는 동안 테두리 강조 */
function slotMark56(c, r, w) {
  if (!w) return;
  const k = w.pg56 && w.ft56 != null ? 1 - (G.time - w.ft56) / V56.pulse : 0, tag = G.t56 && G.t56.find(x => x.w === w);
  if (k > 0) { c.save(); c.globalAlpha = 0.42 * k; c.fillStyle = '#ffffff'; uiRound(c, r.x, r.y, r.w, r.h, 5); c.fill(); c.restore(); }
  if (tag) { c.save(); c.globalAlpha = clamp((tag.dur - tag.t) * 3, 0, 1); c.strokeStyle = tag.col; c.lineWidth = 2; uiRound(c, r.x - 1, r.y - 1, r.w + 2, r.h + 2, 6); c.stroke(); c.restore(); }
}
const _drawSlots56 = drawSlots;
drawSlots = function (c) {
  const r = _drawSlots56.apply(this, arguments);
  try {
    if (G.result) return r;
    const L = hudLayout(), p = G.p;
    slotWs().forEach((w, i) => slotMark56(c, L.tile(i, 0), w));
    const b = p.job && baseW(); if (b) slotMark56(c, { x: L.x + 6, y: L.y + 10, w: 32, h: 32 }, b);
  } catch (e) { }
  return r;
};

/* ---------- 화면: 색 빠짐·어둠·말풍선 ---------- */
function wrap56(c, tx, maxW) {
  const out = []; let line = '';
  for (const ch of tx) { if (c.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; } else line += ch; }
  if (line) out.push(line); return out;
}
function bubble56(c, x, y, who, text, a) {
  if (a <= 0 || !text) return;
  const W = VIEW.cw, maxW = Math.min(250, W - 56);
  c.save(); c.globalAlpha = a; c.textBaseline = 'middle'; c.textAlign = 'left'; c.font = `600 15px ${UI_ART.font}`;
  const full = wrap56(c, who.full, maxW), tw = Math.max(c.measureText(who.name).width * 0.8 + 4, ...full.map(s => c.measureText(s).width)), bw = tw + 26, bh = full.length * 21 + 34;
  const bx = clamp(x - bw / 2, 10, W - bw - 10), by = Math.max(VIEW.sat + 8, y - bh - 12), tx0 = clamp(x, bx + 16, bx + bw - 16);
  c.fillStyle = 'rgba(18,22,32,.94)'; c.strokeStyle = who.color; c.lineWidth = 1.5;
  uiRound(c, bx, by, bw, bh, 10); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(tx0 - 7, by + bh - 0.5); c.lineTo(tx0, by + bh + 9); c.lineTo(tx0 + 7, by + bh - 0.5); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(tx0 - 7, by + bh); c.lineTo(tx0, by + bh + 9); c.lineTo(tx0 + 7, by + bh); c.stroke();
  c.font = `700 12px ${UI_ART.font}`; c.fillStyle = who.tint; c.fillText(who.name, bx + 13, by + 14);
  c.font = `600 15px ${UI_ART.font}`; c.fillStyle = '#f2ecdc';
  let left = text.length; wrap56(c, who.full, maxW).forEach((s, i) => { const t = s.slice(0, Math.max(0, left)); left -= s.length; if (t) c.fillText(t, bx + 13, by + 34 + i * 21); });
  c.restore();
}
const typed56 = (s, t) => s.slice(0, Math.max(0, Math.floor(t * 22)));
function cuDraw56(c, C) {
  const v = C.v || cuView56(C), dpr = VIEW.dpr, W = VIEW.cw, H = VIEW.ch, p = G.p;
  c.save(); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const inn = ease56(C.t / 0.3), out = ease56((C.dur - C.t) / 0.3), k = Math.min(inn, out);
  if (C.kind === 'dead') {
    const pp = cuPt56(v, p.x, p.y);
    c.globalCompositeOperation = 'saturation'; c.globalAlpha = 0.85 * inn; c.fillStyle = '#000'; c.fillRect(0, 0, W, H);   // 색 빠짐 (결과 화면까지 유지)
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    const g = c.createRadialGradient(pp.x, pp.y, 40, pp.x, pp.y, Math.max(W, H) * 0.75); g.addColorStop(0, 'rgba(10,8,16,0)'); g.addColorStop(1, `rgba(10,8,16,${0.72 * inn})`);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const t0 = 0.35; if (C.t > t0) bubble56(c, pp.x, pp.y - (p.r + 22) * VIEW.zoom * v.z, { name: CAST.hero.name, color: '#6a8ad8', tint: '#9db8f0', full: C.line }, typed56(C.line, C.t - t0), Math.min(ease56((C.t - t0) / 0.15), out));
  } else {
    const D = V56.demon, dp = cuPt56(v, C.x, C.y), pp = cuPt56(v, p.x, p.y);
    const g = c.createRadialGradient(dp.x, dp.y, 50, dp.x, dp.y, Math.max(W, H) * 0.8); g.addColorStop(0, 'rgba(10,8,16,0)'); g.addColorStop(1, `rgba(10,8,16,${0.6 * k})`);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const a1 = Math.min(ease56((C.t - 0.25) / 0.15), ease56((D.pan + 0.05 - C.t) / 0.2));
    if (C.t > 0.25 && a1 > 0) bubble56(c, dp.x, dp.y - (C.r + 16) * VIEW.zoom * v.z, { name: CAST.demon.name, color: '#9a6ae0', tint: '#c9a8ff', full: C.line }, typed56(C.line, C.t - 0.25), a1);
    const t2 = D.pan + 0.25; if (C.t > t2) bubble56(c, pp.x, pp.y - (p.r + 22) * VIEW.zoom * v.z, { name: CAST.hero.name, color: '#6a8ad8', tint: '#9db8f0', full: C.line2 }, typed56(C.line2, C.t - t2), Math.min(ease56((C.t - t2) / 0.15), out));
  }
  if (C.t > V56.skipAt + 0.5 && !BOT49) { c.globalAlpha = 0.5 * out; c.font = `500 11px ${UI_ART.font}`; c.textAlign = 'center'; c.fillStyle = '#d9cbb3'; c.fillText('화면을 누르면 넘김', W / 2, H - VIEW.sab - 18); }
  c.restore();
}
const _render56 = render;
render = function () {
  _render56.apply(this, arguments);
  try { const C = cuOn56(); if (C) cuDraw56(ctx, C); } catch (e) { if (window.__onErr) window.__onErr(e); }
};

/* ---------- 결과 화면 정리 ---------- */
function dmgBars56() {
  const agg = {};
  for (const [k, v] of Object.entries(G.stats.dmg)) { let n; try { n = WEAPONS[k] ? wName(k) : srcName(k); } catch (e) { n = srcName(k); } agg[n] = (agg[n] || 0) + v; }
  const tot = Object.values(agg).reduce((a, b) => a + b, 0); if (!(tot > 0)) return '';
  return Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([n, v]) => { const k = Math.round(v / tot * 100); return `<div class="dbar"><span class="dn">${esc(n)}</span><span class="dt"><i style="width:${Math.max(2, k)}%"></i></span><span class="dk">${k}%</span></div>`; }).join('');
}
function buildTiles56() {
  const p = G.p, tile = (h, lv) => `<span class="pz-t">${h}${lv ? `<em>${lv}</em>` : ''}</span>`;
  const ws = p.weapons.slice().sort((a, b) => (b.base ? 1 : 0) - (a.base ? 1 : 0)).map(w => { const d = WEAPONS[w.id]; return tile(icBox(w.fu || w.base ? JOB_COL[p.job] : CFG.colors[d.cat], d.ic, branchWeaponArt(w.id, w.br)), w.lvl); }).join('');
  const ps = p.passives.map(x => tile(icBox(CFG.colors.passive, PASSIVES[x.id].ic, x.id), x.lvl)).join('');
  return ws || ps ? `<div class="pz-build" id="rbuild" role="button" tabindex="0" aria-label="내 능력 보기">${ws ? `<div class="r"><i>무기</i>${ws}</div>` : ''}${ps ? `<div class="r"><i>보조</i>${ps}</div>` : ''}</div>` : '';
}
showResult = function () {
  STATE.mode = 'result'; G.toasts = [];
  const R = G.report, p = G.p, done = G.ph.log.filter(x => x[2] === 'ok').length;
  const D = GATEKEEPERS[G.gk], dm = R.demon, gk = R.gate && R.gate[1] === 'kill';
  const head = dm ? (dm[0] === 'kill' ? '마왕 처치' : R.result === 'retreat' ? '마왕성 소멸' : '쓰러졌다') : R.result === 'clear' ? '들판 돌파' : R.result === 'retreat' ? '수문장 퇴각' : '쓰러졌다';
  const tone = R.result === 'clear' ? 'win' : R.result === 'dead' ? 'dead' : 'etc';
  const job = p.job ? (p.job2 && JOBS[p.job2] ? JOBS[p.job2].name : JOBS[p.job].name) : '인물 선택 전';
  let sub = '';
  if (dm) sub = dm[0] === 'kill' ? `마왕 처치 누적 ${R.demonKills}회` : `마왕 ${dm[3]}/3 페이즈 · 남은 체력 ${dm[2]}%`;
  else if (gk && D) sub = `${D.name} 처치 · ${D.gate} 개방`;
  else if (R.result === 'dead') sub = `마지막 피격 · ${R.lastHit || '-'}`;
  else if (R.result === 'retreat' && D) sub = `${D.name} 남은 체력 ${R.gate ? R.gate[3] : 100}%`;
  if (dm && R.result === 'dead') sub += ` · 마지막 피격 ${R.lastHit || '-'}`;
  const news = [];
  if (R.newBest) news.push('<p class="best">최고 생존 기록 갱신</p>');
  if (R.newBestScore) news.push('<p class="best">최고 점수 갱신</p>');
  if (G.story && G.story.newFrags.length) news.push(`<p class="frag">기록 조각 해금 · ${G.story.newFrags.map(id => esc(FRAGS.find(f => f.id === id).nm)).join(' · ')}</p>`);
  for (const t of R.newTitles || []) news.push(`<p class="best">칭호 해금 · ${esc(t)}</p>`);
  const kpi = (v, l) => `<div><b>${v}</b><i>${l}</i></div>`, bars = dmgBars56();
  const relic = (p.relics || []).map(r => `<span class="chip" style="border-color:#ffd24a">유물 ${esc(RELICS[r].name)}</span>`).join('');
  const prog = [R.gates != null ? `열린 문 ${R.gates}/4` : '', R.frags != null ? `기록 조각 ${R.frags}/${FRAG_N}` : ''].filter(Boolean).join(' · ');
  UI.innerHTML = `<div class="layer fit rs rs-${tone}">
    <div class="rs-head"><h2>${head}</h2>${sub ? `<p class="rs-sub">${esc(sub)}</p>` : ''}</div>
    ${news.length ? `<div class="rs-new">${news.join('')}</div>` : ''}
    <div class="rs-kpi">${kpi(fmtTime(R.time), '생존 시간')}${kpi(`${done}/${G.ph.order.length}`, '돌파 페이즈')}${kpi(R.level, '레벨')}${kpi(R.kills >= 10000 ? (R.kills / 10000).toFixed(1) + '만' : R.kills, '처치')}</div>
    <p class="score">점수 ${R.score || 0}${R.mul > 1 ? ` <small>×${R.mul}</small>` : ''}</p>
    ${prog ? `<p class="rs-prog">${prog}</p>` : ''}
    <div class="rs-box"><h3>${esc(job)} · 이번 판 빌드</h3>${buildTiles56()}${relic ? `<div class="build">${relic}</div>` : ''}${bars ? `<h3>피해 비중</h3>${bars}` : ''}</div>
    <div class="rs-menu"><button class="pri" id="again">다시 시작</button><div class="r2"><button id="rabil">내 능력</button><button id="home">처음 화면</button></div></div></div>`;
  const back = () => showResult();
  on('again', newRun); on('home', showTitle);
  on('rabil', () => showAbil(back)); on('rbuild', () => showAbil(back));
};

/* ---------- 첫 판 안내 보강 ---------- */
(function () {
  const chest = GUIDE.find(g => g.id === 'chest'); if (chest) chest.tx = '보물 상자를 열면 레벨업 선택 1회 추가';
  const add = (after, g) => { const i = GUIDE.findIndex(x => x.id === after); GUIDE.splice(i < 0 ? GUIDE.length : i + 1, 0, g); };
  add('phase', { id: 'elite', tx: '빛나는 큰 적은 정예 · 쓰러뜨리면 보물 상자', when: () => G.enemies.some(e => e.elite && !e.dead && !e.clone) });
  add('chest', { id: 'branch', tx: '무기는 Lv 3에서 분기 선택 · Lv 5에서 각성', when: () => G.p.weapons.some(w => w.lvl >= 2) });
  add('altar', { id: 'job', tx: '인물 선택 완료 · 인물 능력은 오른쪽 위 일시정지 → 내 능력에서 확인', when: () => !!G.p.job });
  add('ult', { id: 'fuse', tx: '무기 칸 무기와 기본 무기가 모두 Lv 5·각성이면 연성 카드 등장', when: () => !!G.p.job && G.p.weapons.some(w => !w.base && !w.fu && w.lvl >= 4) });
  add('warn', { id: 'gate', tx: '수문장 등장 · 제한 시간 안에 쓰러뜨리면 문 개방', when: () => !!(G.gkMob && !G.gkMob.dead && G.ph && G.ph.id === 'gate') });
})();
/* 첫 선택 화면 도움말: 레벨업 선택 화면 처음 2번 */
const _selLevel56 = SEL_HEAD.level;
SEL_HEAD.level = function (s) {
  const r = _selLevel56(s);
  try {
    if (!s.banish) {
      const S = guideSeen();
      if (s.tip56 == null) { s.tip56 = !S.has('card2'); if (s.tip56) guideMark(S.has('card1') ? 'card2' : 'card1'); }
      if (s.tip56) r[1] = '카드 1장을 눌러 선택 · 가진 무기를 다시 고르면 강화';
    }
  } catch (e) { }
  return r;
};

/* ---------- 화면 모양 ---------- */
(function () {
  if (typeof document === 'undefined') return;
  const st = document.createElement('style');
  st.textContent = `#ui>.layer.rs{gap:11px}
.rs-head{display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center}
.rs-head h2{font-size:26px;letter-spacing:1px}.rs-win .rs-head h2{color:#ffe08a}.rs-dead .rs-head h2{color:#f0b0a8}
.rs-sub{margin:0;font-size:14px;color:var(--muted);max-width:340px;text-wrap:balance}
.rs-new{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 14px;border:1px solid #6a5a3a;border-radius:10px;background:rgba(60,48,24,.35);max-width:340px;box-sizing:border-box}
.rs-new p{font-size:13px;text-align:center}
.rs-kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;width:100%;max-width:360px}
.rs-kpi div{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 2px;border:1px solid var(--line);border-radius:10px;background:var(--panel);min-width:0}
.rs-kpi b{font-size:17px;font-variant-numeric:tabular-nums;white-space:nowrap}.rs-kpi i{font-style:normal;font-size:11px;color:var(--muted);white-space:nowrap}
.rs .score{font-size:16px}.rs-prog{margin:-4px 0 0;font-size:12px;color:var(--muted)}
.rs-box{width:100%;max-width:360px;display:flex;flex-direction:column;gap:6px;align-items:stretch}
.rs-box h3{margin:4px 0 0;font-size:12px;color:var(--muted);text-align:center;font-weight:normal;align-self:center}
.rs-box .pz-build{max-width:none}.rs-box .build{align-self:center}
.rs-menu{display:flex;flex-direction:column;gap:8px;width:100%;max-width:300px}.rs-menu button{width:100%;min-height:46px}
.rs-menu .r2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
@media(max-height:640px){#ui>.layer.rs{gap:8px}.rs-head h2{font-size:22px}.rs-kpi div{padding:6px 2px}.rs-menu button{min-height:42px}}`;
  document.head.appendChild(st);
})();

/* ---------- 클로즈업 중 알림 문구 숨김 (해금 내용은 결과 화면에 표기) ---------- */
const _toast56 = toast;
toast = function () { if (G && G.cu56 && !G.finished) return; return _toast56.apply(this, arguments); };
const _cuStart56b = cuStart56;
cuStart56 = function () { const r = _cuStart56b.apply(this, arguments); if (G) G.toasts = []; return r; };
