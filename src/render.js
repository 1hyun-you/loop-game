/* ============================================================
   그리기 — 도형 임시 그래픽 (도트 교체는 3단계)
   ============================================================ */
const PAL = ['#3c6a3a', '#467a42', '#5a8c50'];   // 들판 바탕·격자·장식
function render() {
  const c = ctx, dpr = VIEW.dpr, Z = VIEW.zoom, p = G.p;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = PAL[0]; c.fillRect(0, 0, VIEW.cw, VIEW.ch);
  const sh = p.flash > 0 && SETTINGS.shake ? 3 : 0;         // 화면 흔들림 설정 (0.14)
  const camX = p.x - VIEW.w / 2 + rand(-sh, sh), camY = p.y - VIEW.h / 2 + rand(-sh, sh);
  c.setTransform(dpr * Z, 0, 0, dpr * Z, -camX * dpr * Z, -camY * dpr * Z);
  const vx0 = camX - 40, vy0 = camY - 40, vx1 = camX + VIEW.w + 40, vy1 = camY + VIEW.h + 40;
  const inView = (x, y, r) => x + r > vx0 && x - r < vx1 && y + r > vy0 && y - r < vy1;
  drawGround(c, camX, camY);
  drawPhaseGround(c);
  drawBossGround(c);
  drawEventGround(c);
  drawGrowthGround(c, inView);
  drawGems(c, inView);
  drawEnemies(c, inView);
  drawBossTop(c, inView);
  drawJobUnits(c, inView);
  drawPlayer(c);
  drawWeapons(c, inView);
  drawFx(c);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawPhaseFog(c);
  drawPhaseTint(c);
  if (p.flash > 0) { c.fillStyle = 'rgba(255,40,40,' + (p.flash * 1.2) + ')'; c.fillRect(0, 0, VIEW.cw, VIEW.ch); }
  drawJoy(c);
  if (STATE.mode === 'title') return;          // 시작 화면에서는 상단 정보 숨김
  drawHUD(c);
  drawPhasePointer(c, camX, camY);
}
function drawGround(c, camX, camY) {
  const T = 96, x0 = Math.floor(camX / T) - 1, y0 = Math.floor(camY / T) - 1, x1 = x0 + Math.ceil(VIEW.w / T) + 3, y1 = y0 + Math.ceil(VIEW.h / T) + 3;
  c.fillStyle = PAL[1];
  for (let tx = x0; tx < x1; tx++) for (let ty = y0; ty < y1; ty++) if ((tx + ty) & 1) c.fillRect(tx * T, ty * T, T, T);
  const t2 = 48, a0 = Math.floor(camX / t2) - 1, b0 = Math.floor(camY / t2) - 1, a1 = a0 + Math.ceil(VIEW.w / t2) + 3, b1 = b0 + Math.ceil(VIEW.h / t2) + 3;
  c.strokeStyle = PAL[2]; c.lineWidth = 2; c.beginPath();
  for (let tx = a0; tx < a1; tx++) for (let ty = b0; ty < b1; ty++) {
    if (hash2(tx, ty) > 0.16) continue;
    const x = tx * t2 + hash2(ty, tx) * 40, y = ty * t2 + hash2(tx + 7, ty) * 40;
    c.moveTo(x, y); c.lineTo(x - 3, y - 7); c.moveTo(x + 3, y); c.lineTo(x + 4, y - 8); c.moveTo(x + 6, y); c.lineTo(x + 9, y - 6);
  }
  c.stroke();
}
function drawGems(c, inView) {
  c.fillStyle = '#59c7f0'; c.beginPath();
  for (const g of G.gems) {
    if (!inView(g.x, g.y, 8)) continue;
    const s = g.v < 3 ? 4 : g.v < 12 ? 5.5 : 7;
    c.moveTo(g.x, g.y - s); c.lineTo(g.x + s * 0.7, g.y); c.lineTo(g.x, g.y + s); c.lineTo(g.x - s * 0.7, g.y); c.closePath();
  }
  c.fill();
}
function enemyPath(c, e) {
  const x = e.x, y = e.y, r = e.r;
  switch (e.shape) {
    case 'tri': c.moveTo(x, y - r); c.lineTo(x + r, y + r * 0.7); c.lineTo(x - r, y + r * 0.7); c.closePath(); break;
    case 'sq': c.rect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7); break;
    case 'hex': for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; i ? c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); break;
    case 'blob': c.moveTo(x + r, y + r * 0.2); c.ellipse(x, y + r * 0.2, r, r * 0.8, 0, 0, 7); break;
    default: c.moveTo(x + r, y); c.arc(x, y, r, 0, 7);
  }
}
function drawEnemies(c, inView) {
  const byColor = new Map(), flash = [];
  for (const e of G.enemies) {
    if (e.dead || !inView(e.x, e.y, e.r)) continue;
    if (e.flash > 0) { flash.push(e); continue; }
    let a = byColor.get(e.color); if (!a) { a = []; byColor.set(e.color, a); } a.push(e);
  }
  c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath();
  for (const a of byColor.values()) for (const e of a) { c.moveTo(e.x + e.r, e.y + e.r * 0.8); c.ellipse(e.x, e.y + e.r * 0.8, e.r, e.r * 0.35, 0, 0, 7); }
  c.fill();
  for (const [col, a] of byColor) { c.fillStyle = col; c.beginPath(); for (const e of a) enemyPath(c, e); c.fill(); }
  c.fillStyle = '#1a1420'; c.beginPath();
  for (const a of byColor.values()) for (const e of a) { if (e.fixed) continue; const ex = G.p.x > e.x ? 1.5 : -1.5; c.rect(e.x - e.r * 0.4 + ex, e.y - e.r * 0.15, 2, 2.5); c.rect(e.x + e.r * 0.25 + ex, e.y - e.r * 0.15, 2, 2.5); }
  c.fill();
  if (flash.length) { c.fillStyle = '#fff'; c.beginPath(); for (const e of flash) enemyPath(c, e); c.fill(); }
  // 대장·마법진·거대 몹 체력 막대 (0.10)
  for (const e of G.enemies) {
    if (e.dead || !e.cmd || e.gk || !inView(e.x, e.y, e.r)) continue;
    const w = e.r * 2.2, y = e.y - e.r - 10; c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(e.x - w / 2, y, w, 5); c.fillStyle = e.rit ? '#c8a0ff' : '#ff8a5a'; c.fillRect(e.x - w / 2, y, w * Math.max(0, e.hp / e.maxHp), 5);
  }
  // 엘리트: 금색 테두리 · 보호막 · 돌진 예고 · 체력 막대
  for (const e of G.enemies) {
    if (e.dead || !e.elite || !inView(e.x, e.y, e.r)) continue;
    c.strokeStyle = '#ffd24a'; c.lineWidth = 3; c.beginPath(); enemyPath(c, e); c.stroke();
    if (e.sh > 0) { c.strokeStyle = 'rgba(140,200,255,0.85)'; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y, e.r + 6, 0, 7); c.stroke(); }
    if (e.tele > 0) { c.strokeStyle = 'rgba(255,80,60,0.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(G.p.x, G.p.y); c.stroke(); }
    const w = e.r * 2, y = e.y - e.r - 9; c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(e.x - w / 2, y, w, 4); c.fillStyle = '#ffd24a'; c.fillRect(e.x - w / 2, y, w * Math.max(0, e.hp / e.maxHp), 4);
  }
  c.strokeStyle = 'rgba(190,235,255,0.9)'; c.lineWidth = 2; c.beginPath();
  for (const e of G.enemies) if (!e.dead && e.frz > 0 && inView(e.x, e.y, e.r)) { c.moveTo(e.x + e.r + 3, e.y); c.arc(e.x, e.y, e.r + 3, 0, 7); }
  c.stroke();
  if (G.p.job === 'archer') { c.fillStyle = '#b8ff9a'; for (const e of G.enemies) if (!e.dead && e.mk && inView(e.x, e.y, e.r)) for (let i = 0; i < e.mk; i++) c.fillRect(e.x - 8 + i * 4, e.y - e.r - 6, 3, 3); }
}
/* 지면: 장판·잔상·보물 상자·전직 제단·지뢰 */
function drawGrowthGround(c, inView) {
  for (const z of G.pools) {
    if (!inView(z.x, z.y, z.r)) continue;
    const k = 1 - z.t / z.dur;
    c.fillStyle = z.kind === 'trail' ? `rgba(200,255,220,${0.25 * k})` : z.kind === 'vine' ? `rgba(90,190,90,${0.32 * k})` : z.kind === 'crack' ? `rgba(150,110,70,${0.4 * k})` : `rgba(255,120,40,${0.28 * k})`;
    c.beginPath(); c.arc(z.x, z.y, z.r, 0, 7); c.fill();
  }
  const p = G.p;
  if (p.exw && p.exw.id === 'mage') { c.strokeStyle = 'rgba(170,220,255,0.35)'; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, EXW.mage.R, 0, 7); c.stroke(); }
  if (G.banner) { const b = G.banner; c.fillStyle = 'rgba(255,210,74,0.08)'; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,210,74,0.5)'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#8a6a2a'; c.fillRect(b.x - 1.5, b.y - 26, 3, 26); c.fillStyle = '#ffd24a'; c.fillRect(b.x + 1.5, b.y - 26, 14, 9); }
  if (G.sanct) { const S = G.sanct; c.fillStyle = 'rgba(255,242,168,0.12)'; c.beginPath(); c.arc(S.x, S.y, S.r, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,242,168,0.6)'; c.lineWidth = 2; c.stroke(); }
  const ice = p.weapons.find(w => w.id === 'icering');
  if (ice && ice.R) { c.fillStyle = 'rgba(170,220,255,0.10)'; c.beginPath(); c.arc(p.x, p.y, ice.R, 0, 7); c.fill(); c.strokeStyle = 'rgba(190,230,255,0.45)'; c.lineWidth = 2; c.stroke(); }
  for (const t of G.traps) { if (!inView(t.x, t.y, 14)) continue; c.fillStyle = t.arm > 0 ? '#6a5a3a' : '#c8a050'; c.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, r = i % 2 ? t.r * 0.5 : t.r; c.lineTo(t.x + Math.cos(a) * r, t.y + Math.sin(a) * r); } c.closePath(); c.fill(); c.strokeStyle = '#3a2a10'; c.lineWidth = 1.5; c.stroke(); }
  for (const m of G.mines) { c.fillStyle = m.arm > 0 ? '#8a7040' : '#ffcf70'; c.beginPath(); c.arc(m.x, m.y, 5, 0, 7); c.fill(); }
  for (const ch of G.chests) {
    const b = Math.sin(G.time * 5) * 2;
    c.fillStyle = '#a8742a'; c.fillRect(ch.x - 11, ch.y - 8 + b, 22, 16); c.fillStyle = '#ffd24a'; c.fillRect(ch.x - 11, ch.y - 2 + b, 22, 3); c.fillRect(ch.x - 2, ch.y - 4 + b, 4, 6);
    c.strokeStyle = '#3a2410'; c.lineWidth = 1.5; c.strokeRect(ch.x - 11, ch.y - 8 + b, 22, 16);
  }
  const a = G.altar;
  if (a) {
    const pulse = 0.5 + 0.5 * Math.sin(G.time * 3);
    c.fillStyle = `rgba(200,150,255,${0.15 + pulse * 0.1})`; c.beginPath(); c.arc(a.x, a.y, a.r + 14, 0, 7); c.fill();
    c.fillStyle = '#4a3a6a'; c.fillRect(a.x - 14, a.y - 10, 28, 20); c.fillStyle = '#d9a8ff'; c.fillRect(a.x - 9, a.y - 22, 18, 12);
    c.strokeStyle = '#efdcff'; c.lineWidth = 2; c.strokeRect(a.x - 14, a.y - 10, 28, 20);
    if (a.stay > 0) { c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.arc(a.x, a.y, a.r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * a.stay / JOB_CFG.altarStay); c.stroke(); }
  }
}
/* 포탑·망령 */
function drawJobUnits(c, inView) {
  for (const t of G.turrets) {
    if (!inView(t.x, t.y, 12)) continue;
    c.fillStyle = t.temp ? '#c89040' : '#8a6a3a'; c.fillRect(t.x - 9, t.y - 9, 18, 18);
    c.strokeStyle = '#ffd890'; c.lineWidth = 4; c.beginPath(); c.moveTo(t.x, t.y); c.lineTo(t.x + Math.cos(t.a || 0) * 13, t.y + Math.sin(t.a || 0) * 13); c.stroke();
  }
  c.fillStyle = 'rgba(200,170,255,0.85)'; c.beginPath();
  for (const m of G.minions) { if (!inView(m.x, m.y, m.r)) continue; c.moveTo(m.x + m.r, m.y); c.arc(m.x, m.y, m.r, 0, 7); }
  c.fill();
}
function drawPlayer(c) {
  const p = G.p;
  if (p.invT > 0 && Math.floor(G.time * 14) % 2) return;
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(p.x, p.y + p.r * 0.85, p.r, p.r * 0.35, 0, 0, 7); c.fill();
  c.fillStyle = playerColor(); c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill();   // 색상 변형 (0.15)
  c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.stroke();
  const fa = Math.atan2(p.face.y, p.face.x);
  c.fillStyle = '#fff'; c.beginPath();
  c.moveTo(p.x + Math.cos(fa) * (p.r + 7), p.y + Math.sin(fa) * (p.r + 7));
  c.lineTo(p.x + Math.cos(fa + 0.5) * (p.r + 1), p.y + Math.sin(fa + 0.5) * (p.r + 1));
  c.lineTo(p.x + Math.cos(fa - 0.5) * (p.r + 1), p.y + Math.sin(fa - 0.5) * (p.r + 1)); c.closePath(); c.fill();
  const w = 30, h = 4, x = p.x - w / 2, y = p.y - p.r - 12;
  c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x - 1, y - 1, w + 2, h + 2);
  c.fillStyle = p.hp / p.maxHp > 0.3 ? '#5fe07a' : '#ff5a5a'; c.fillRect(x, y, w * Math.max(0, p.hp / p.maxHp), h);
  if (p.shield) { c.strokeStyle = 'rgba(140,210,255,0.9)'; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, p.r + 5, 0, 7); c.stroke(); }
  if (G.tm.inv > 0) { c.strokeStyle = 'rgba(255,240,160,0.8)'; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, p.r + 8, 0, 7); c.stroke(); }
  if (p.job) {                                              // 궁극기 게이지 (체력 막대 아래)
    const k = p.ult / JOB_CFG.ultNeed, full = k >= 1;
    c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x - 1, y + h + 1, w + 2, 4);
    c.fillStyle = full ? (Math.floor(G.time * 4) % 2 ? '#ffe08a' : '#fff6c8') : '#c8a040'; c.fillRect(x, y + h + 2, w * k, 2);
    if (full && G.tm.stopT > 0) { c.strokeStyle = '#ffe08a'; c.lineWidth = 3; c.beginPath(); c.arc(p.x, p.y, p.r + 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * G.tm.stopT / JOB_CFG.ultStop); c.stroke(); }
    if (p.job === 'warrior' && p.fury > 0) { c.fillStyle = '#ff7a5a'; c.fillRect(x, y - 4, w * p.fury / 100, 2); }
  }
}
function drawFx(c) {
  for (const f of G.fx) {
    const k = f.t / f.dur;
    if (f.kind === 'ring') {
      const x = f.follow ? G.p.x : f.x, y = f.follow ? G.p.y : f.y, r = Math.max(1, lerp(f.r0, f.r1, k));
      c.globalAlpha = 1 - k; c.strokeStyle = f.color; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r, 0, 7);
      if (f.fill) { c.globalAlpha = 0.35 * (1 - k); c.fillStyle = f.color; c.fill(); c.globalAlpha = 1 - k; }
      c.stroke();
    }
    else if (f.kind === 'bolt') {
      c.globalAlpha = 1 - k; c.strokeStyle = '#e6f4ff'; c.lineWidth = 3; c.beginPath();
      let x = f.x + 6, y = f.y - 150; c.moveTo(x, y);
      for (let i = 1; i <= 5; i++) { x = f.x + (i < 5 ? (hash2(i, Math.floor(f.x)) - 0.5) * 24 : 0); y = f.y - 150 + i * 30; c.lineTo(x, y); }
      c.stroke(); c.fillStyle = '#bfe4ff'; c.beginPath(); c.arc(f.x, f.y, 10 * (1 - k) + 4, 0, 7); c.fill();
    }
    else if (f.kind === 'arc') { c.globalAlpha = 0.45 * (1 - k); c.fillStyle = f.color; c.beginPath(); c.moveTo(G.p.x, G.p.y); c.arc(G.p.x, G.p.y, f.r, f.a - f.arc / 2, f.a + f.arc / 2); c.closePath(); c.fill(); }
    else if (f.kind === 'zap') { c.globalAlpha = 1 - k; c.strokeStyle = '#d8eeff'; c.lineWidth = 2; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo((f.x + f.x2) / 2 + 8, (f.y + f.y2) / 2 - 6); c.lineTo(f.x2, f.y2); c.stroke(); }
    else if (f.kind === 'pop') { c.globalAlpha = 1 - k; c.fillStyle = f.color; c.beginPath(); c.arc(f.x, f.y, f.r * (1 + k), 0, 7); c.fill(); }
    c.globalAlpha = 1;
  }
}
/* 무기 표시: 회전검 칼날, 투사체 */
function drawWeapons(c, inView) {
  const p = G.p;
  for (const w of p.weapons) {
    if (w.id !== 'spin' || !w.n) continue;
    c.fillStyle = '#ffd0c8'; c.strokeStyle = '#7a3a30'; c.lineWidth = 1.5;
    for (let i = 0; i < w.n; i++) {
      const a = w.a + i * Math.PI * 2 / w.n, bx = p.x + Math.cos(a) * w.R, by = p.y + Math.sin(a) * w.R, t = a + Math.PI / 2, L = w.bs * 1.3, H = w.bs * 0.45;
      c.beginPath();
      c.moveTo(bx + Math.cos(t) * L, by + Math.sin(t) * L); c.lineTo(bx + Math.cos(a) * H, by + Math.sin(a) * H);
      c.lineTo(bx - Math.cos(t) * L, by - Math.sin(t) * L); c.lineTo(bx - Math.cos(a) * H, by - Math.sin(a) * H); c.closePath(); c.fill(); c.stroke();
    }
  }
  for (const pr of G.proj) {
    if (!inView(pr.x, pr.y, pr.r + 10)) continue;
    const a = Math.atan2(pr.vy, pr.vx);
    if (pr.kind === 'arrow') {
      c.strokeStyle = pr.color; c.lineWidth = 3; c.beginPath(); c.moveTo(pr.x - Math.cos(a) * 14, pr.y - Math.sin(a) * 14); c.lineTo(pr.x + Math.cos(a) * 4, pr.y + Math.sin(a) * 4); c.stroke();
    } else if (pr.kind === 'boom') {
      c.save(); c.translate(pr.x, pr.y); c.rotate(pr.spin); c.fillStyle = pr.color; c.strokeStyle = '#6a4a20'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(-pr.r, -pr.r * 0.35); c.lineTo(pr.r, -pr.r * 0.35); c.lineTo(pr.r * 0.6, pr.r * 0.6); c.lineTo(-pr.r * 0.6, pr.r * 0.6); c.closePath(); c.fill(); c.stroke();
      c.restore();
    } else if (pr.kind === 'orb' || pr.kind === 'shell') {
      c.fillStyle = pr.color; c.beginPath(); c.arc(pr.x, pr.y, pr.r, 0, 7); c.fill();
    } else if (pr.kind === 'fire') {
      c.fillStyle = 'rgba(255,170,60,0.35)'; c.beginPath(); c.arc(pr.x - Math.cos(a) * 6, pr.y - Math.sin(a) * 6, pr.r * 1.3, 0, 7); c.fill();
      c.fillStyle = pr.color; c.beginPath(); c.arc(pr.x, pr.y, pr.r, 0, 7); c.fill();
      c.fillStyle = '#fff2c0'; c.beginPath(); c.arc(pr.x + Math.cos(a) * 2, pr.y + Math.sin(a) * 2, pr.r * 0.45, 0, 7); c.fill();
    }
  }
}
function drawJoy(c) {
  const R = CFG.joyR;
  if (SETTINGS.joy === 'fixed' && STATE.mode === 'play' && !INPUT.active) { const f = joyFixed(); c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 2; c.beginPath(); c.arc(f.x, f.y, R, 0, 7); c.stroke(); return; }   // 고정형 기준 위치 표시
  if (!INPUT.active) return;
  c.fillStyle = 'rgba(255,255,255,0.10)'; c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2;
  c.beginPath(); c.arc(INPUT.ox, INPUT.oy, R, 0, 7); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.arc(INPUT.ox + INPUT.dx * INPUT.mag * R, INPUT.oy + INPUT.dy * INPUT.mag * R, 22, 0, 7); c.fill();
}
/* 상단 집중형 정보 배치 */
function drawHUD(c) {
  const p = G.p, W = VIEW.cw, top = VIEW.sat + 6;
  c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0, top - 6, W, 10);
  c.fillStyle = '#59c7f0'; c.fillRect(0, top - 6, W * Math.min(1, p.xp / p.need), 10);
  c.font = 'bold 14px system-ui'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.fillStyle = '#fff';
  const txt = (s, x, y, al) => { c.textAlign = al; c.strokeText(s, x, y); c.fillText(s, x, y); };
  txt('Lv ' + p.level, 12, top + 20, 'left');
  if (p.job) { c.font = 'bold 12px system-ui'; c.fillStyle = '#d9a8ff'; txt(JOBS[p.job].name + (p.job2 ? ' · ' + JOB2[p.job].concat(JOB2_STAT).find(o => o.k === p.job2).nm : '') + (p.job === 'druid' ? (G.tm.wrath > 0 ? ' · 분노' : p.form === 'bear' ? ' · 곰' : ' · 정령') : p.job === 'priest' ? ' · 정화 ' + p.holy : ''), 12, top + 38, 'left'); c.fillStyle = '#fff'; c.font = 'bold 14px system-ui'; }
  c.font = 'bold 18px system-ui'; txt(fmtTime(G.time), W / 2, top + 20, 'center');
  const P = curPhase(), ph = G.ph;                          // 페이즈 이름·진행도 (0.3)
  c.font = 'bold 12px system-ui'; c.fillStyle = '#ffe08a';
  txt(P ? `${ph.i + 1}/${ph.order.length} ${P.name}` : (G.result === 'clear' ? '돌파' : '이동 중'), W / 2, top + 38, 'center');
  if (P) { const bw = 120; c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(W / 2 - bw / 2, top + 47, bw, 4); c.fillStyle = '#ffe08a'; c.fillRect(W / 2 - bw / 2, top + 47, bw * clamp(phaseProgress(), 0, 1), 4); }
  c.fillStyle = '#fff';
  c.font = 'bold 14px system-ui'; txt('처치 ' + G.kills, W - 56, top + 20, 'right');
  if (STATE.dev.fps) { c.font = '12px ui-monospace,monospace'; txt(Math.round(STATE.fps) + ' FPS · 적 ' + aliveCount() + (() => { const P = perfStat(); return P ? ` · 평균 ${P.avg} · 하위1% ${P.low1}` : ''; })(), W - 12, isBossPhase() ? top + 128 : top + 96, 'right'); }
  drawSlots(c, top + 58);
  drawBossBar(c, top + 92, txt);                            // 수문장 체력 (0.11)
  let ty = VIEW.ch * 0.3;
  for (const t of G.toasts) { c.globalAlpha = Math.min(1, (t.dur - t.t) * 3); c.font = 'bold 16px system-ui'; c.fillStyle = t.color; txt(t.text, W / 2, ty, 'center'); ty += 26; c.fillStyle = '#fff'; }
  c.globalAlpha = 1;
}

/* 상단 아래 아이콘 줄: 무기 5칸 · 보조 효과 5칸 */
function drawSlots(c, y) {
  const p = G.p, S = 24, gap = 4, W = VIEW.cw;
  const row = (list, n, x0, colorOf, icOf) => {
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (S + gap), it = list[i];
      c.fillStyle = it ? colorOf(it) : 'rgba(0,0,0,0.35)'; c.fillRect(x, y, S, S);
      c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 1.5; c.strokeRect(x + 0.5, y + 0.5, S - 1, S - 1);
      if (!it) continue;
      c.fillStyle = '#14121c'; c.font = 'bold 13px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(icOf(it), x + S / 2, y + S / 2 - 1);
      c.font = 'bold 9px system-ui'; c.textAlign = 'right'; c.textBaseline = 'alphabetic'; c.lineWidth = 2.5; c.strokeStyle = 'rgba(0,0,0,0.8)';
      const lv = String(it.lvl); c.strokeText(lv, x + S - 1, y + S - 1); c.fillStyle = '#fff'; c.fillText(lv, x + S - 1, y + S - 1);
    }
  };
  const rowW = 5 * S + 4 * gap;
  row(p.weapons, slotW(), 12, w => CFG.colors[WEAPONS[w.id].cat], w => WEAPONS[w.id].ic);
  row(p.passives, CFG.slots.passive, W - 12 - rowW, () => CFG.colors.passive, ps => PASSIVES[ps.id].ic);
}
