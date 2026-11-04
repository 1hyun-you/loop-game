/* ============================================================
   반응 체계 (0.28) — 행동 규모에 비례하는 4등급 반응 + 조작 반응 + 회복 고기 + 경험치 게이지
   1등급(일반 처치·치명타): 기존 파편·링 유지(가볍게)
   2등급(엘리트 처치): 짧은 정지 + 금색 파편·링 + 약한 흔들림
   3등급(전직·궁극기): 색 섬광 + 링 + 흔들림
   4등급(수문장·마왕 처치): 슬로모션 + 흰 섬광 + 큰 링·파편 + 강한 흔들림
   조작 반응: 공격 순간 몸체 눌림·반동·섬광, 이동 먼지, 피격 가장자리 붉은 테두리
   ============================================================ */
const RC_CFG = {
  hitstop: { k: 0.06, t: 0.05 },        // 엘리트 처치 정지 (배율, 실시간 초)
  slow: { k: 0.25, t: 1.1 },            // 보스 처치 슬로모션
  dust: 0.15,                           // 이동 먼지 간격 (초)
  dustMax: 28, mfMax: 8,
  meat: { perSec: 0.004, lowMul: 4, gap: 15, maxOn: 2, heal: 0.2, life: 20, blink: 5, elite: 1, sureBelow: 0.8, sureGap: 8, eatBelow: 0.95, r: 14 },   // 엘리트·상자 확정 드롭은 체력 80% 미만·6초 간격 조건부 (0.28 시험: 무조건 확정 시 첫 5분 11개)
};
function RC() {
  return G.rc || (G.rc = { slow: 0, slowK: 1, flash: 0, flashT: 0.4, flashCol: '#ffffff', flashA: 0.5, sq: 0, dustT: 0, dust: [], mf: [], mfT: 0, meat: [], meatAt: -99, meatN: 0, meatEat: 0, meatTimes: [], lvT: 0, xpShow: 0, kr: 0 });
}

/* 시간 배율: 정지·슬로모션 (자동 시험·배속 중에는 시간 배율 미적용 — 시험 결과 왜곡 방지) */
function rcScale(raw) {
  const r = G && G.rc; if (!r || r.slow <= 0) return 1;
  r.slow -= raw;
  return STATE.dev.speed > 1 || STATE.dev.auto ? 1 : r.slowK;
}
function rcSlow(k, t) { const r = RC(); if (t > r.slow || k < r.slowK) { r.slowK = k; r.slow = Math.max(r.slow, t); } }
function rcFlash(col, a, t) { const r = RC(); if (a >= r.flashA * Math.max(0, 1 - r.flash / r.flashT) || r.flash <= 0) { r.flashCol = col; r.flashA = a; r.flashT = t; r.flash = t; } }

/* 2~4등급 처치 반응 + 회복 고기 (juice.js jKill 끝에서 호출) */
function rcKill(e) {
  if (e.gk && !e.clone) {                                   // 4등급
    rcSlow(RC_CFG.slow.k, RC_CFG.slow.t); rcFlash('#ffffff', 0.55, 0.7); shake(8, 0.9);
    fx({ kind: 'ring', x: e.x, y: e.y, r0: e.r, r1: e.r + 260, dur: 0.9, color: '#ffffff' });
    fx({ kind: 'ring', x: e.x, y: e.y, r0: e.r * 0.5, r1: e.r + 170, dur: 0.7, color: '#ffd24a', fill: true });
    burst(e.x, e.y, 30, '#fff2c8', 260, 1.0, 4);
  } else if (e.elite && !e.clone) {                         // 2등급
    rcSlow(RC_CFG.hitstop.k, RC_CFG.hitstop.t); shake(2.5, 0.2);
    fx({ kind: 'ring', x: e.x, y: e.y, r0: e.r * 0.7, r1: e.r + 46, dur: 0.35, color: '#ffd24a' });
    burst(e.x, e.y, 10, '#ffe08a', 190, 0.6, 3);
  }
  meatTry(e);
}
/* 3등급: 전직·궁극기 */
function rcBig(col, a = 0.3) { rcFlash(col, a, 0.4); }
function rcLevel() { RC().lvT = 0.6; }

/* 공격 순간 반응 (updateWeapons에서 무기 발동 시 호출) */
function rcFire(w) {
  const r = RC(), p = G.p; r.sq = 1;
  if (r.mf.length < RC_CFG.mfMax && G.time - r.mfT > 0.05) { r.mfT = G.time; r.mf.push({ x: p.x + p.face.x * 15, y: p.y + p.face.y * 15 - 2, t: 0, a: Math.atan2(p.face.y, p.face.x) }); }
}

/* 회복 고기 */
function meatTry(e) {
  const M = RC_CFG.meat, r = RC(), p = G.p;
  r.kr += 1;                                                // 최근 처치 속도(초당) 추정용 누적
  if (hasCond('noheal') || G.result) return;
  if (r.meat.length >= M.maxOn) return;
  const sure = e.elite && !e.clone && !e.gk && M.elite && p.hp < p.maxHp * M.sureBelow && G.time - r.meatAt >= M.sureGap;
  if (e.elite && !e.clone && !e.gk && !sure) return;        // 엘리트는 확정 조건 미충족 시 일반 확률 없음
  if (!sure) {
    if (G.time - r.meatAt < M.gap) return;
    const lowK = 1 + (M.lowMul - 1) * clamp(1 - p.hp / p.maxHp, 0, 1), rate = r.kr / 10;   // 처치 속도가 빨라도 초당 기대 드롭 수가 일정하도록 처치당 확률 보정
    if (Math.random() > M.perSec / Math.max(1.5, rate) * lowK) return;
  }
  meatDrop(e.x, e.y);
}
function meatDrop(x, y) {
  const r = RC(); if (r.meat.length >= RC_CFG.meat.maxOn + 1) return;
  r.meat.push({ x, y, t: 0 }); r.meatAt = G.time; r.meatN++; if (r.meatTimes.length < 40) r.meatTimes.push(Math.round(G.time));
}
function rcChest(c) { const M = RC_CFG.meat, r = RC(), p = G.p; if (!hasCond('noheal') && p.hp < p.maxHp * M.sureBelow && G.time - r.meatAt >= M.sureGap) meatDrop(c.x + 16, c.y + 8); }   // 보물 상자: 조건부 확정

function updateReact(dt) {
  const r = G.rc, p = G.p; if (!r) { if (!G.p) return; RC(); return; }
  if (r.flash > 0) r.flash -= dt;
  if (r.lvT > 0) r.lvT -= dt;
  r.kr -= r.kr * Math.min(1, dt / 10);
  r.sq = Math.max(0, r.sq - dt * 7);
  for (const m of r.mf) m.t += dt; if (r.mf.length) r.mf = r.mf.filter(m => m.t < 0.08);
  /* 이동 먼지 */
  if (p.moving && !G.result) {
    r.dustT -= dt;
    if (r.dustT <= 0 && r.dust.length < RC_CFG.dustMax) { r.dustT = RC_CFG.dust; r.dust.push({ x: p.x - p.face.x * 5 + rand(-3, 3), y: p.y + p.r * 0.9, vx: -p.face.x * 8, vy: -rand(6, 14), t: 0, dur: rand(0.3, 0.45), s: rand(2, 3.4) }); }
  }
  if (r.dust.length) { for (const d of r.dust) { d.t += dt; d.x += d.vx * dt; d.y += d.vy * dt; } r.dust = r.dust.filter(d => d.t < d.dur); }
  /* 경험치 게이지 보간 */
  const tg = p.need > 0 ? clamp(p.xp / p.need, 0, 1) : 0;
  if (tg < r.xpShow - 0.5) r.xpShow = 0; else r.xpShow += (tg - r.xpShow) * Math.min(1, dt * 10);
  /* 고기: 수명·먹기 */
  const M = RC_CFG.meat;
  for (const m of r.meat) {
    m.t += dt;
    if (m.t >= M.life) { m.dead = true; burst(m.x, m.y, 4, '#c8b8a0', 50, 0.4, 2); continue; }
    if (!G.result && p.hp < p.maxHp * M.eatBelow && dist2(m.x, m.y, p.x, p.y) < (p.r + M.r) ** 2) {
      m.dead = true; r.meatEat++;
      const before = p.hp; heal(p.maxHp * M.heal); const got = Math.round(p.hp - before);
      sparkUp(p.x, p.y, 8, ['#8cff9a', '#fff6c8', '#b8ffc0']); fx({ kind: 'ring', x: p.x, y: p.y, r0: 6, r1: 34, dur: 0.3, color: '#8cff9a', follow: true });
      sfx('pick'); toast(`고기 +${got}`, '#8cff9a');
    }
  }
  if (r.meat.length) r.meat = r.meat.filter(m => !m.dead);
}

/* 그리기 — 지면(경험치 보석 다음): 고기 */
function drawReactGround(c, inView) {
  const r = G.rc; if (!r || !r.meat.length) return;
  for (const m of r.meat) {
    if (!inView(m.x, m.y, 14)) continue;
    const left = RC_CFG.meat.life - m.t; if (left < RC_CFG.meat.blink && Math.floor(G.time * 6) % 2) continue;   // 소멸 직전 깜빡임
    const bob = Math.round(Math.sin(G.time * 4 + m.x) * 1.5);
    c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(m.x, m.y + 8, 8, 3, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,170,130,' + (0.14 + 0.07 * Math.sin(G.time * 5)) + ')'; c.beginPath(); c.arc(m.x, m.y, 14, 0, 7); c.fill();
    drawSpriteC(c, 'meat', 0, m.x, m.y + bob);
  }
}
/* 월드 상단: 이동 먼지·공격 섬광 */
function drawReactTop(c) {
  const r = G.rc; if (!r) return;
  if (r.dust.length) { for (const d of r.dust) { c.globalAlpha = 0.5 * (1 - d.t / d.dur); c.fillStyle = '#d8c8a0'; const s = d.s * (1 + d.t); c.fillRect(Math.round(d.x - s / 2), Math.round(d.y - s / 2), s, s); } c.globalAlpha = 1; }
  for (const m of r.mf) {
    const k = m.t / 0.08, L = 7 * (1 - k) + 3; c.globalAlpha = 1 - k; c.fillStyle = '#fffbe8';
    c.fillRect(Math.round(m.x - 1.5), Math.round(m.y - 1.5), 3, 3);
    c.fillRect(Math.round(m.x + Math.cos(m.a) * L - 1), Math.round(m.y + Math.sin(m.a) * L - 1), 2, 2);
    c.fillRect(Math.round(m.x + Math.cos(m.a + 0.7) * L * 0.7 - 1), Math.round(m.y + Math.sin(m.a + 0.7) * L * 0.7 - 1), 2, 2);
    c.fillRect(Math.round(m.x + Math.cos(m.a - 0.7) * L * 0.7 - 1), Math.round(m.y + Math.sin(m.a - 0.7) * L * 0.7 - 1), 2, 2);
  }
  c.globalAlpha = 1;
}
/* 주인공: 공격 순간 눌림·반동, 피격 시 흰색 */
function drawHeroReact(c, fr, flip, tint) {
  const p = G.p, r = G.rc, q = r ? r.sq : 0, by = p.y + p.r * 1.1;
  const opt = { flip, tint, mode: p.flash > 0.12 ? 'white' : 'n' };
  if (q <= 0.02) { drawSprite(c, 'hero', fr, p.x, by, opt); return; }
  const rx = -p.face.x * 2.2 * q, ry = -p.face.y * 1.2 * q;
  c.save(); c.translate(p.x + rx, by + ry); c.scale(1 + 0.12 * q, 1 - 0.12 * q); c.translate(-p.x - rx, -by - ry);
  drawSprite(c, 'hero', fr, p.x + rx, by + ry, opt);
  c.restore();
}
/* 화면 좌표: 피격 가장자리 붉은 테두리·체력 위험 맥동·색 섬광 */
function drawReactScreen(c) {
  const p = G.p, r = G.rc, W = VIEW.cw, H = VIEW.ch;
  let a = Math.min(0.5, Math.max(0, p.flash) * 2.4);
  if (STATE.mode === 'play' && !G.result && p.hp / p.maxHp < 0.25) a = Math.max(a, 0.1 + 0.06 * Math.sin(G.time * 6));
  if (a > 0.01) {
    const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.72);
    g.addColorStop(0, 'rgba(255,40,40,0)'); g.addColorStop(1, `rgba(255,40,40,${a})`);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  if (r && r.flash > 0) { c.globalAlpha = r.flashA * (r.flash / r.flashT); c.fillStyle = r.flashCol; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
}

/* 경험치 게이지 — 도트 틀(진보라 외곽·칸 눈금·위 밝은 줄), 보간 차오름, 가득 차기 직전 맥동, 레벨업 빛 흐름, 레벨 배지 */
function drawXpGauge(c, top) {
  const p = G.p, r = RC(), W = VIEW.cw, y0 = top - 6, H = 12, k = clamp(r.xpShow, 0, 1);
  c.fillStyle = '#1b1626'; c.fillRect(0, y0, W, H);
  c.fillStyle = '#2e2444'; c.fillRect(2, y0 + 2, W - 4, H - 4);
  const fw = Math.round((W - 4) * k);
  if (fw > 0) {
    c.fillStyle = '#3aa0cc'; c.fillRect(2, y0 + 2, fw, H - 4);
    c.fillStyle = '#6fd6f6'; c.fillRect(2, y0 + 2, fw, 4);
    c.fillStyle = '#c4f2ff'; c.fillRect(2, y0 + 2, fw, 2);
    c.fillStyle = 'rgba(27,22,38,0.35)'; for (let x = 18; x < fw + 2; x += 16) c.fillRect(x, y0 + 2, 1, H - 4);   // 칸 눈금
    if (fw > 3) { c.fillStyle = '#ffffff'; c.fillRect(2 + fw - 2, y0 + 2, 2, H - 4); }                           // 끝 반짝임
  }
  if (k >= 0.9 && r.lvT <= 0) { c.globalAlpha = 0.12 + 0.14 * (0.5 + 0.5 * Math.sin(G.time * 12)); c.fillStyle = '#ffffff'; c.fillRect(2, y0 + 2, W - 4, H - 4); c.globalAlpha = 1; }   // 직전 맥동
  if (r.lvT > 0) {                                                                                          // 레벨업 빛 흐름
    const t = 1 - r.lvT / 0.6, sx = Math.round(-30 + (W + 60) * t);
    c.save(); c.beginPath(); c.rect(2, y0 + 2, W - 4, H - 4); c.clip();
    c.fillStyle = '#ffffff'; c.globalAlpha = 0.85; c.fillRect(sx, y0, 18, H); c.globalAlpha = 0.4; c.fillRect(sx - 14, y0, 14, H);
    c.restore(); c.globalAlpha = 1;
  }
  c.fillStyle = r.lvT > 0 ? '#ffd24a' : '#5e44a0'; c.fillRect(0, y0, W, 1); c.fillRect(0, y0 + H - 1, W, 1);   // 외곽 위·아래 줄
  /* 레벨 배지 */
  const bx = 6, by = top + 8, bw = 48, bh = 22, pop = r.lvT > 0 ? Math.round(3 * Math.sin(Math.PI * (1 - r.lvT / 0.6))) : 0;
  c.fillStyle = '#1b1626'; c.fillRect(bx - pop, by - pop, bw + pop * 2, bh + pop * 2);
  c.fillStyle = r.lvT > 0 ? '#ffd24a' : '#8a6a2a'; c.fillRect(bx + 2 - pop, by + 2 - pop, bw - 4 + pop * 2, bh - 4 + pop * 2);
  c.fillStyle = '#3a2e4a'; c.fillRect(bx + 4 - pop, by + 4 - pop, bw - 8 + pop * 2, bh - 8 + pop * 2);
  c.fillStyle = '#1b1626'; c.fillRect(bx, by, 2, 2); c.fillRect(bx + bw - 2, by, 2, 2); c.fillRect(bx, by + bh - 2, 2, 2); c.fillRect(bx + bw - 2, by + bh - 2, 2, 2);   // 모서리 깎기
  c.font = 'bold 13px Galmuri11, system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.6)';
  const s = 'Lv ' + p.level; c.strokeText(s, bx + bw / 2, by + bh / 2 + 1); c.fillStyle = '#fff'; c.fillText(s, bx + bw / 2, by + bh / 2 + 1);
}

/* 회복 고기 그림 (도트) */
SPR.meat = { px: 2, frames: [[
  '..kkkkkk........',
  '.kyyooook.......',
  'kyoooooook......',
  'koooooooook.....',
  'kooooooooOk.....',
  'koooooooOOk.....',
  '.kOooOOOOk......',
  '..kkOOOkEk......',
  '....kkkEEEk.....',
  '......kEEEEk....',
  '......kEEkkEk...',
  '.......kk..kk...',
]] };
