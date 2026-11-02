/* ============================================================
   그리기 — 도형 임시 그래픽 (도트 교체는 3단계)
   ============================================================ */
const PAL = ['#3c6a3a', '#467a42', '#5a8c50'];   // 들판 바탕·격자·장식
function render() {
  const c = ctx, dpr = VIEW.dpr, Z = VIEW.zoom, p = G.p;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = PAL[0]; c.fillRect(0, 0, VIEW.cw, VIEW.ch);
  const sh = p.flash > 0 ? 3 : 0;
  const camX = p.x - VIEW.w / 2 + rand(-sh, sh), camY = p.y - VIEW.h / 2 + rand(-sh, sh);
  c.setTransform(dpr * Z, 0, 0, dpr * Z, -camX * dpr * Z, -camY * dpr * Z);
  const vx0 = camX - 40, vy0 = camY - 40, vx1 = camX + VIEW.w + 40, vy1 = camY + VIEW.h + 40;
  const inView = (x, y, r) => x + r > vx0 && x - r < vx1 && y + r > vy0 && y - r < vy1;
  drawGround(c, camX, camY);
  drawPhaseGround(c);
  drawGems(c, inView);
  drawEnemies(c, inView);
  drawPlayer(c);
  drawWeapons(c, inView);
  drawFx(c);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
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
  for (const a of byColor.values()) for (const e of a) { const ex = G.p.x > e.x ? 1.5 : -1.5; c.rect(e.x - e.r * 0.4 + ex, e.y - e.r * 0.15, 2, 2.5); c.rect(e.x + e.r * 0.25 + ex, e.y - e.r * 0.15, 2, 2.5); }
  c.fill();
  if (flash.length) { c.fillStyle = '#fff'; c.beginPath(); for (const e of flash) enemyPath(c, e); c.fill(); }
}
function drawPlayer(c) {
  const p = G.p;
  if (p.invT > 0 && Math.floor(G.time * 14) % 2) return;
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(p.x, p.y + p.r * 0.85, p.r, p.r * 0.35, 0, 0, 7); c.fill();
  c.fillStyle = '#7fb4ff'; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill();
  c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.stroke();
  const fa = Math.atan2(p.face.y, p.face.x);
  c.fillStyle = '#fff'; c.beginPath();
  c.moveTo(p.x + Math.cos(fa) * (p.r + 7), p.y + Math.sin(fa) * (p.r + 7));
  c.lineTo(p.x + Math.cos(fa + 0.5) * (p.r + 1), p.y + Math.sin(fa + 0.5) * (p.r + 1));
  c.lineTo(p.x + Math.cos(fa - 0.5) * (p.r + 1), p.y + Math.sin(fa - 0.5) * (p.r + 1)); c.closePath(); c.fill();
  const w = 30, h = 4, x = p.x - w / 2, y = p.y - p.r - 12;
  c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x - 1, y - 1, w + 2, h + 2);
  c.fillStyle = p.hp / p.maxHp > 0.3 ? '#5fe07a' : '#ff5a5a'; c.fillRect(x, y, w * Math.max(0, p.hp / p.maxHp), h);
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
      const a = w.a + i * Math.PI * 2 / w.n, bx = p.x + Math.cos(a) * w.R, by = p.y + Math.sin(a) * w.R, t = a + Math.PI / 2, L = w.br * 1.3, H = w.br * 0.45;
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
    } else if (pr.kind === 'fire') {
      c.fillStyle = 'rgba(255,170,60,0.35)'; c.beginPath(); c.arc(pr.x - Math.cos(a) * 6, pr.y - Math.sin(a) * 6, pr.r * 1.3, 0, 7); c.fill();
      c.fillStyle = pr.color; c.beginPath(); c.arc(pr.x, pr.y, pr.r, 0, 7); c.fill();
      c.fillStyle = '#fff2c0'; c.beginPath(); c.arc(pr.x + Math.cos(a) * 2, pr.y + Math.sin(a) * 2, pr.r * 0.45, 0, 7); c.fill();
    }
  }
}
function drawJoy(c) {
  if (!INPUT.active) return;
  const R = CFG.joyR;
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
  c.font = 'bold 18px system-ui'; txt(fmtTime(G.time), W / 2, top + 20, 'center');
  const P = curPhase(), ph = G.ph;                          // 페이즈 이름·진행도 (0.3)
  c.font = 'bold 12px system-ui'; c.fillStyle = '#ffe08a';
  txt(P ? `${ph.i + 1}/${ph.order.length} ${P.name}` : (G.result === 'clear' ? '돌파' : '이동 중'), W / 2, top + 38, 'center');
  if (P) { const bw = 120; c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(W / 2 - bw / 2, top + 47, bw, 4); c.fillStyle = '#ffe08a'; c.fillRect(W / 2 - bw / 2, top + 47, bw * clamp(phaseProgress(), 0, 1), 4); }
  c.fillStyle = '#fff';
  c.font = 'bold 14px system-ui'; txt('처치 ' + G.kills, W - 56, top + 20, 'right');
  if (STATE.dev.fps) { c.font = '12px ui-monospace,monospace'; txt(Math.round(STATE.fps) + ' FPS · 적 ' + aliveCount(), W - 12, top + 96, 'right'); }
  drawSlots(c, top + 58);
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
  row(p.weapons, CFG.slots.weapon, 12, w => CFG.colors[WEAPONS[w.id].cat], w => WEAPONS[w.id].ic);
  row(p.passives, CFG.slots.passive, W - 12 - rowW, () => CFG.colors.passive, ps => PASSIVES[ps.id].ic);
}
