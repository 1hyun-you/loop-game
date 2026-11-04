/* ============================================================
   그리기 — 0.19 도트 적용 시작(주인공·잡몹 4종·바르간·지형), 나머지 도형은 0.20 교체
   ============================================================ */
const PAL = [GROUND_BASE];   // 들판 바탕 (0.19 도트 타일)
/* 페이즈별 지형 전환 (0.20): 예고 구간부터 다음 페이즈 지형으로 2초 교차 전환 */
const TER = { cur: 'field', prev: null, k: 1 };
function terrainTarget() {
  const ph = G.ph; if (!ph) return 'field';
  const id = ph.inGap ? ph.order[ph.i + 1] || ph.id : ph.id;
  return id && TERRAIN[id] ? id : 'field';
}
function updateTerrain(dt) { const t = terrainTarget(); if (t !== TER.cur) { TER.prev = TER.cur; TER.cur = t; TER.k = 0; } if (TER.k < 1) TER.k = Math.min(1, TER.k + dt / 2); }
let terLast = 0;
function render() {
  const c = ctx, dpr = VIEW.dpr, Z = VIEW.zoom, p = G.p;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const tn = G.time; updateTerrain(Math.max(0, Math.min(0.1, tn - terLast))); terLast = tn;
  c.fillStyle = TERRAIN[TER.cur].a; c.fillRect(0, 0, VIEW.cw, VIEW.ch);
  const sh = SETTINGS.shake ? Math.max(p.flash > 0 ? 3 : 0, shakeAmt()) : 0;   // 화면 흔들림 설정 (0.14), 연출 흔들림 (0.22)
  const camX = p.x - VIEW.w / 2 + rand(-sh, sh), camY = p.y - VIEW.h / 2 + rand(-sh, sh);
  c.setTransform(dpr * Z, 0, 0, dpr * Z, Math.round(-camX * dpr * Z), Math.round(-camY * dpr * Z));   // 화면 픽셀 정렬 (0.19)
  c.imageSmoothingEnabled = false;
  const vx0 = camX - 40, vy0 = camY - 40, vx1 = camX + VIEW.w + 40, vy1 = camY + VIEW.h + 40;
  const inView = (x, y, r) => x + r > vx0 && x - r < vx1 && y + r > vy0 && y - r < vy1;
  drawGround(c, camX, camY);
  drawPhaseGround(c);
  drawBossGround(c);
  drawEventGround(c); drawCrisisGround(c);
  drawGrowthGround(c, inView);
  drawGems(c, inView);
  drawReactGround(c, inView);
  drawEnemies(c, inView);
  drawBossTop(c, inView);
  drawJobUnits(c, inView);
  drawPlayer(c);
  drawWeapons(c, inView);
  drawFx(c);
  drawJuice(c);
  drawReactTop(c);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawPhaseFog(c);
  drawPhaseTint(c);
  drawReactScreen(c);                                       // 피격 가장자리·색 섬광 (0.28)
  drawTopBand(c);                                           // 0.30 상태 표시줄 이어지는 상단 띠
  drawJoy(c);
  if (STATE.mode === 'title') return;          // 시작 화면에서는 상단 정보 숨김
  drawHUD(c);
  drawPhasePointer(c, camX, camY);
  drawUltScreen(c); drawBanner(c);
}
/* 지형: 16×16 타일 묶음(월드 512 단위)을 사전 저장해 반복 무늬로 1회 채움 (0.20 부하 절감) */
const GROUND_PAT = new Map();
function groundPattern(c, tid) {
  const t = texelPx(2), key = tid + '|' + t;
  let P = GROUND_PAT.get(key);
  if (!P) {
    const N = 16, S = 16 * t, cv = document.createElement('canvas'); cv.width = cv.height = N * S;
    const g = cv.getContext('2d'); g.fillStyle = TERRAIN[tid].a; g.fillRect(0, 0, cv.width, cv.height);
    for (let tx = 0; tx < N; tx++) for (let ty = 0; ty < N; ty++) { const hv = hash2(tx, ty), i = hv < 0.55 ? 0 : hv < 0.78 ? 1 : hv < 0.94 ? 2 : 3; if (i) g.drawImage(getTileT(i, tid).cv, tx * S, ty * S); }
    P = { pat: c.createPattern(cv, 'repeat'), k: 1 / (VIEW.zoom * VIEW.dpr) };
    if (P.pat.setTransform) P.pat.setTransform(new DOMMatrix([P.k, 0, 0, P.k, 0, 0]));
    GROUND_PAT.set(key, P);
  }
  return P.pat;
}
function drawGround(c, camX, camY) {
  const x = camX - 64, y = camY - 64, w = VIEW.w + 128, h = VIEW.h + 128;
  if (TER.k < 1 && TER.prev) { c.fillStyle = groundPattern(c, TER.prev); c.fillRect(x, y, w, h); c.globalAlpha = TER.k; }
  c.fillStyle = groundPattern(c, TER.cur); c.fillRect(x, y, w, h); c.globalAlpha = 1;
}
function drawGems(c, inView) {
  const bob = Math.floor(G.time * 3) & 1;
  for (const g of G.gems) { if (!inView(g.x, g.y, 8)) continue; drawSpriteC(c, GEM_SPR(g.v), 0, g.x, g.y - bob); }
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
  const byColor = new Map(), flash = [], sprites = [];
  for (const e of G.enemies) {
    if (e.dead || !inView(e.x, e.y, e.r)) continue;
    if (spriteFor(e)) { sprites.push(e); continue; }        // 도트 그림 대상 (0.19)
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
  drawEnemySprites(c, sprites);
  // 대장·마법진·거대 몹 체력 막대 (0.10)
  for (const e of G.enemies) {
    if (e.dead || !e.cmd || e.gk || !inView(e.x, e.y, e.r)) continue;
    const w = e.r * 2.2, y = e.y - e.r - 10; c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(e.x - w / 2, y, w, 5); c.fillStyle = e.rit ? '#c8a0ff' : '#ff8a5a'; c.fillRect(e.x - w / 2, y, w * Math.max(0, e.hp / e.maxHp), 5);
  }
  // 엘리트: 금색 테두리(도트는 외곽선 변형) · 보호막 · 돌진 예고 · 체력 막대
  for (const e of G.enemies) {
    if (e.dead || !e.elite || !inView(e.x, e.y, e.r)) continue;
    if (!spriteFor(e)) { c.strokeStyle = '#ffd24a'; c.lineWidth = 3; c.beginPath(); enemyPath(c, e); c.stroke(); }
    if (e.sh > 0) { c.strokeStyle = 'rgba(140,200,255,0.85)'; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y, e.r + 6, 0, 7); c.stroke(); }
    if (e.tele > 0) { c.strokeStyle = 'rgba(255,80,60,0.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(G.p.x, G.p.y); c.stroke(); }
    const w = e.r * 2, y = e.y - e.r - 9; c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(e.x - w / 2, y, w, 4); c.fillStyle = '#ffd24a'; c.fillRect(e.x - w / 2, y, w * Math.max(0, e.hp / e.maxHp), 4);
  }
  c.strokeStyle = 'rgba(190,235,255,0.9)'; c.lineWidth = 2; c.beginPath();
  for (const e of G.enemies) if (!e.dead && e.frz > 0 && inView(e.x, e.y, e.r)) { c.moveTo(e.x + e.r + 3, e.y); c.arc(e.x, e.y, e.r + 3, 0, 7); }
  c.stroke();
  if (G.p.job === 'archer') { c.fillStyle = '#b8ff9a'; for (const e of G.enemies) if (!e.dead && e.mk && inView(e.x, e.y, e.r)) for (let i = 0; i < e.mk; i++) c.fillRect(e.x - 8 + i * 4, e.y - e.r - 6, 3, 3); }
}
/* 도트 적 그리기: 그림자 → (엘리트 금색 외곽선) → 본체/피격 반짝임, 플레이어 방향으로 좌우 반전 */
function drawEnemySprites(c, list) {
  if (!list.length) return;
  c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath();
  for (const e of list) { c.moveTo(e.x + e.r, e.y + e.r * 0.8); c.ellipse(e.x, e.y + e.r * 0.8, e.r, e.r * 0.32, 0, 0, 7); }
  c.fill();
  for (const e of list) {
    const nm = spriteFor(e), fr = Math.floor(G.time * (e.type === 'bat' ? 8 : 4) + e.id * 0.37) & 1, flip = G.p.x < e.x, mul = spriteMul(e), by = e.y + e.r * 0.95;
    if (e.elite || e.rage || e.thief) drawSprite(c, nm, fr, e.x, by, { flip, mul, mode: e.rage ? 'rage' : 'gold' });
    drawSprite(c, nm, fr, e.x, by, { flip, mul, mode: e.flash > 0 ? 'white' : 'n' });
  }
}
/* 지면: 장판·잔상·보물 상자·전직 제단·지뢰 */
function drawGrowthGround(c, inView) {
  for (const z of G.pools) {
    if (!inView(z.x, z.y, z.r)) continue;
    const k = 1 - z.t / z.dur;
    c.fillStyle = z.kind === 'trail' ? `rgba(200,255,220,${0.25 * k})` : z.kind === 'vine' ? `rgba(90,190,90,${0.32 * k})` : z.kind === 'crack' ? `rgba(150,110,70,${0.4 * k})` : `rgba(255,120,40,${0.28 * k})`;
    c.beginPath(); c.arc(z.x, z.y, z.r, 0, 7); c.fill();
    if (z.kind === 'fire' || !z.kind) { c.strokeStyle = `rgba(255,220,140,${0.55 * k})`; c.lineWidth = 1.5; c.stroke(); }   // 0.25 아군 장판 금색 테두리
  }
  const p = G.p;
  if (p.exw && p.exw.id === 'mage') { c.strokeStyle = 'rgba(170,220,255,0.35)'; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, EXW.mage.R, 0, 7); c.stroke(); }
  if (G.banner) { const b = G.banner; c.fillStyle = 'rgba(255,210,74,0.08)'; c.beginPath(); c.arc(b.x, b.y, b.r * ultBannerR(), 0, 7); c.fill(); c.strokeStyle = 'rgba(255,210,74,0.5)'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#8a6a2a'; c.fillRect(b.x - 1.5, b.y - 26, 3, 26); c.fillStyle = '#ffd24a'; c.fillRect(b.x + 1.5, b.y - 26, 14, 9); }
  if (G.sanct) { const S = G.sanct; c.fillStyle = 'rgba(255,242,168,0.12)'; c.beginPath(); c.arc(S.x, S.y, S.r, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,242,168,0.6)'; c.lineWidth = 2; c.stroke(); }
  const ice = p.weapons.find(w => w.id === 'icering');
  if (ice && ice.R) { c.fillStyle = 'rgba(170,220,255,0.10)'; c.beginPath(); c.arc(p.x, p.y, ice.R, 0, 7); c.fill(); c.strokeStyle = 'rgba(190,230,255,0.45)'; c.lineWidth = 2; c.stroke(); }
  for (const t of G.traps) { if (!inView(t.x, t.y, 14)) continue; c.fillStyle = t.arm > 0 ? '#6a5a3a' : '#c8a050'; c.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, r = i % 2 ? t.r * 0.5 : t.r; c.lineTo(t.x + Math.cos(a) * r, t.y + Math.sin(a) * r); } c.closePath(); c.fill(); c.strokeStyle = '#3a2a10'; c.lineWidth = 1.5; c.stroke(); }
  for (const m of G.mines) { c.fillStyle = m.arm > 0 ? '#8a7040' : '#ffcf70'; c.beginPath(); c.arc(m.x, m.y, 5, 0, 7); c.fill(); }
  for (const ch of G.chests) {
    const b = Math.round(Math.sin(G.time * 5) * 1.5);
    c.fillStyle = 'rgba(255,220,90,' + (0.16 + 0.08 * Math.sin(G.time * 5)) + ')'; c.beginPath(); c.arc(ch.x, ch.y, 20, 0, 7); c.fill();
    drawSpriteC(c, 'chest', 0, ch.x, ch.y + b);
  }
  const a = G.altar;
  if (a) {
    const pulse = 0.5 + 0.5 * Math.sin(G.time * 3);
    c.fillStyle = `rgba(200,150,255,${0.15 + pulse * 0.1})`; c.beginPath(); c.arc(a.x, a.y, a.r + 14, 0, 7); c.fill();
    drawSprite(c, 'altar', Math.floor(G.time * 3) & 1, a.x, a.y + 14);
    if (a.stay > 0) { c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.arc(a.x, a.y, a.r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * a.stay / JOB_CFG.altarStay); c.stroke(); }
  }
}
/* 포탑·망령 */
function drawJobUnits(c, inView) {
  for (const t of G.turrets) {
    if (!inView(t.x, t.y, 12)) continue;
    drawSpriteC(c, 'turret', 0, t.x, t.y);
    c.strokeStyle = '#1b1626'; c.lineWidth = 5; c.beginPath(); c.moveTo(t.x, t.y - 2); c.lineTo(t.x + Math.cos(t.a || 0) * 13, t.y - 2 + Math.sin(t.a || 0) * 13); c.stroke();
    c.strokeStyle = t.temp ? '#ffd24a' : '#b4c2d4'; c.lineWidth = 2.5; c.stroke();
  }
  drawPets(c, inView); drawRewind(c); drawUlt(c);                      // 0.26 야수 동료·과거의 나
  c.globalAlpha = 0.9;
  for (const m of G.minions) { if (!inView(m.x, m.y, m.r)) continue; drawSprite(c, 'ghost', (Math.floor(G.time * 5) + (m.id || 0)) & 1, m.x, m.y + m.r, { flip: (m.vx || 0) < 0 }); }
  c.globalAlpha = 1;
}
function drawPlayer(c) {
  const p = G.p;
  if (p.invT > 0 && Math.floor(G.time * 14) % 2) return;
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(p.x, p.y + p.r * 0.85, p.r, p.r * 0.35, 0, 0, 7); c.fill();
  drawJobAura(c);                                           // 0.26 직업 문양
  const mv = Math.hypot(p.x - (p._lx ?? p.x), p.y - (p._ly ?? p.y)) > 0.05; p._lx = p.x; p._ly = p.y;   // 이동 중 걷기 동작 (0.19)
  if (p.face.x < -0.05) p._fl = true; else if (p.face.x > 0.05) p._fl = false;
  drawHeroReact(c, mv ? Math.floor(G.time * 8) & 1 : 0, !!p._fl, heroTint());   // 0.26 직업 색 옷   // 색상 변형 (0.15)
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
      const x = f.follow ? G.p.x : f.x, y = f.follow ? G.p.y : f.y, r = Math.max(1, lerp(f.r0, f.r1, 1 - (1 - k) * (1 - k)));   // 0.25 감속 확산
      if (f.fill) {                                                       // 폭발형: 백열 중심 → 색 확산 → 테두리 2겹
        c.globalAlpha = 0.5 * (1 - k); c.fillStyle = f.color; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
        if (k < 0.45) { c.globalAlpha = 1 - k / 0.45; c.fillStyle = '#fffbe8'; c.beginPath(); c.arc(x, y, r * 0.45 * (1 - k), 0, 7); c.fill(); }
        c.globalAlpha = 0.6 * (1 - k); c.strokeStyle = '#fff6d8'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, r * 0.75, 0, 7); c.stroke();
      }
      c.globalAlpha = 1 - k; c.strokeStyle = f.color; c.lineWidth = f.fill ? 4 * (1 - k) + 1 : 3; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke();
      if (!f.fx0 && f.fill && f.r1 >= 30) { f.fx0 = true; sparkBurst(x, y, f.r1, f.color); }
    }
    else if (f.kind === 'bolt') {                                         // 0.25 번개: 꺾임 8회 + 갈래 2개 + 발광 2겹 + 착지 섬광
      const seed = Math.floor(f.x * 7 + f.y * 3), pts = [[f.x + (hash2(seed, 0) - 0.5) * 30, f.y - 170]];
      for (let i = 1; i <= 8; i++) pts.push([f.x + (i < 8 ? (hash2(seed, i) - 0.5) * 34 * (1 - i / 10) : 0), f.y - 170 + i * 170 / 8]);
      const line = (w, col, al) => { c.globalAlpha = al; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const q of pts) c.lineTo(q[0], q[1]); c.stroke(); };
      line(9, '#5f8fe8', 0.35 * (1 - k)); line(4, '#bfe4ff', 0.9 * (1 - k)); line(1.5, '#ffffff', 1 - k);
      c.globalAlpha = 0.8 * (1 - k); c.strokeStyle = '#bfe4ff'; c.lineWidth = 1.5;
      for (const b of [3, 5]) { const q = pts[b], dir = hash2(seed, b + 20) > 0.5 ? 1 : -1; c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[0] + dir * 16, q[1] + 10); c.lineTo(q[0] + dir * 22, q[1] + 26); c.stroke(); }
      c.globalAlpha = 1 - k; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(f.x, f.y, 6 * (1 - k) + 2, 0, 7); c.fill();
      c.strokeStyle = '#9fd0ff'; c.lineWidth = 2; c.beginPath(); c.ellipse(f.x, f.y + 2, 8 + 22 * k, (8 + 22 * k) * 0.4, 0, 0, 7); c.stroke();
    }
    else if (f.kind === 'arc') {                                          // 0.25 베기: 휘두르는 궤적 초승달 + 칼끝 섬광
      const sw = Math.min(1, k * 3), a0 = f.a - f.arc / 2, a1 = a0 + f.arc * sw, px = G.p.x, py = G.p.y, fade = 1 - Math.max(0, (k - 0.35) / 0.65);
      c.globalAlpha = 0.28 * fade; c.fillStyle = f.color; c.beginPath(); c.arc(px, py, f.r, a0, a1); c.arc(px, py, f.r * 0.45, a1, a0, true); c.closePath(); c.fill();
      c.globalAlpha = 0.85 * fade; c.strokeStyle = '#fff6e8'; c.lineWidth = 5 * fade + 1; c.beginPath(); c.arc(px, py, f.r * 0.92, Math.max(a0, a1 - 0.9), a1); c.stroke();
      c.globalAlpha = 0.5 * fade; c.strokeStyle = '#ffd890'; c.lineWidth = 2; c.beginPath(); c.arc(px, py, f.r * 0.72, a0, a1); c.stroke();
      if (sw < 1) { c.globalAlpha = 1; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(px + Math.cos(a1) * f.r * 0.92, py + Math.sin(a1) * f.r * 0.92, 3.5, 0, 7); c.fill(); }
    }
    else if (f.kind === 'zap') {                                          // 0.25 연쇄 번개: 꺾임 4회 발광선
      const s = Math.floor(f.x + f.y2), n = 5, nx = -(f.y2 - f.y), ny = f.x2 - f.x, L = Math.hypot(nx, ny) || 1;
      const pt = i => { const t = i / n, o = i && i < n ? (hash2(s, i) - 0.5) * 22 : 0; return [f.x + (f.x2 - f.x) * t + nx / L * o, f.y + (f.y2 - f.y) * t + ny / L * o]; };
      for (const [w, col, al] of [[6, '#5f8fe8', 0.35], [2, '#e6f4ff', 1]]) { c.globalAlpha = al * (1 - k); c.strokeStyle = col; c.lineWidth = w; c.beginPath(); for (let i = 0; i <= n; i++) { const q = pt(i); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.stroke(); }
    }
    else if (f.kind === 'slash') {                                        // 0.26a 도적 궁극기 그림자 베기: 대상 위 교차 칼자국
      const L = 26 * (0.6 + Math.min(1, k * 4) * 0.4); c.globalAlpha = 1 - k; c.lineCap = 'round';
      for (const [da, w, col] of [[0.5, 6, f.color], [0.5, 2, '#ffffff'], [-0.5, 6, f.color], [-0.5, 2, '#ffffff']]) { const a = f.a + da; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(f.x - Math.cos(a) * L, f.y - Math.sin(a) * L); c.lineTo(f.x + Math.cos(a) * L, f.y + Math.sin(a) * L); c.stroke(); }
      c.lineCap = 'butt';
    }
    else if (f.kind === 'pop') { c.globalAlpha = 1 - k; c.fillStyle = f.color; c.beginPath(); c.arc(f.x, f.y, f.r * (1 + k), 0, 7); c.fill(); }
    c.globalAlpha = 1;
  }
}
/* 무기 표시: 회전검 칼날, 투사체 */
function drawWeapons(c, inView) {
  const p = G.p;
  drawArsenal(c, inView);                                   // 0.27 신규 무기 그리기
  for (const w of p.weapons) {
    if (w.id !== 'spin' || !w.n) continue;
    const mul = w.bs > 15 ? 2 : 1;
    const jt = jobTint('melee'); if (jt) { c.globalAlpha = 0.3; c.fillStyle = jt; c.beginPath(); for (let i = 0; i < w.n; i++) { const a = w.a + i * Math.PI * 2 / w.n, bx = p.x + Math.cos(a) * w.R, by = p.y + Math.sin(a) * w.R; c.moveTo(bx + w.bs, by); c.arc(bx, by, w.bs, 0, 7); } c.fill(); c.globalAlpha = 1; }
    for (let i = 0; i < w.n; i++) { const a = w.a + i * Math.PI * 2 / w.n; drawSpriteRot(c, 'blade', 0, p.x + Math.cos(a) * w.R, p.y + Math.sin(a) * w.R, a + Math.PI / 2, { mul }); }
  }
  for (const pr of G.proj) {
    if (!inView(pr.x, pr.y, pr.r + 10)) continue;
    const a = Math.atan2(pr.vy, pr.vx);
    if (pr.jt) { c.globalAlpha = 0.35; c.fillStyle = pr.jt; c.beginPath(); c.arc(pr.x, pr.y, pr.r + 5, 0, 7); c.fill(); c.globalAlpha = 1; }   // 직업 변환 발광 (0.26)
    const ps = pjSprite(pr);                                  // 0.29 전용 무기·신규 투사체 도트
    if (ps) { const fr = SPR[ps].frames.length > 1 ? Math.floor(G.time * 10 + pr.id) & 1 : 0; if (ps === 'pj_gear') drawSpriteRot(c, ps, 0, pr.x, pr.y, pr.t * 6); else if (ps === 'pj_soul') drawSpriteC(c, ps, fr, pr.x, pr.y, { flip: pr.vx < 0 }); else drawSpriteRot(c, ps, fr, pr.x, pr.y, a); continue; }
    if (pr.kind === 'star') drawSpriteRot(c, 'star', 0, pr.x, pr.y, pr.t * 16);
    else if (pr.kind === 'arrow') drawSpriteRot(c, pr.src === 'knife' ? 'knife' : 'arrow', 0, pr.x, pr.y, a);
    else if (pr.kind === 'boom') drawSpriteRot(c, 'axe', 0, pr.x, pr.y, pr.spin, { mul: pr.r > 15 ? 2 : 1 });
    else if (pr.kind === 'orb') drawSpriteC(c, 'orbp', 0, pr.x, pr.y, { mul: pr.r > 9 ? 2 : 1 });
    else if (pr.kind === 'shell') drawSpriteC(c, 'ball', 0, pr.x, pr.y, { tint: '#ffd890' });
    else if (pr.kind === 'fire') {
      c.fillStyle = 'rgba(255,170,60,0.35)'; c.beginPath(); c.arc(pr.x - Math.cos(a) * 6, pr.y - Math.sin(a) * 6, pr.r * 1.2, 0, 7); c.fill();
      drawSpriteC(c, 'fire', Math.floor(G.time * 10) & 1, pr.x, pr.y, { mul: pr.r > 10 ? 2 : 1 });
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
  drawXpGauge(c, top);                                      // 도트 틀 경험치 게이지·레벨 배지 (0.28)
  c.font = 'bold 14px Galmuri11, system-ui'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.fillStyle = '#fff';
  const txt = (s, x, y, al) => { c.textAlign = al; c.strokeText(s, x, y); c.fillText(s, x, y); };
  if (p.job) { c.font = 'bold 12px Galmuri11, system-ui'; c.fillStyle = '#d9a8ff'; txt(JOBS[p.job].name + (p.job2 ? ' · ' + JOB2[p.job].concat(JOB2_STAT).find(o => o.k === p.job2).nm : '') + (p.job === 'druid' ? (G.tm.wrath > 0 ? ' · 분노' : ' · 동료 ' + G.pets.length) : p.job === 'priest' ? ' · 정화 ' + p.holy : ''), 12, top + 38, 'left'); c.fillStyle = '#fff'; c.font = 'bold 14px Galmuri11, system-ui'; }
  c.font = 'bold 18px Galmuri11, system-ui'; txt(fmtTime(G.time), W / 2, top + 20, 'center');
  const P = curPhase(), ph = G.ph;                          // 페이즈 이름·진행도 (0.3)
  c.font = 'bold 12px Galmuri11, system-ui'; c.fillStyle = '#ffe08a';
  if (ph.ambush) c.fillStyle = '#ff9a7a';
  txt(P ? `${ph.i + 1}/${ph.order.length} ${curPhaseName()}` : (G.result === 'clear' ? '돌파' : '이동 중'), W / 2, top + 38, 'center');
  if (P) { const bw = 120, acc = ph.accT > 0; c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(W / 2 - bw / 2, top + 47, bw, 4); c.fillStyle = acc ? '#ffffff' : '#ffe08a'; c.fillRect(W / 2 - bw / 2, top + 47, bw * clamp(phaseProgress(), 0, 1), 4);
    if (acc) { c.font = 'bold 10px Galmuri11, system-ui'; c.fillStyle = '#fff6c8'; txt('▶▶', W / 2 + bw / 2 + 12, top + 49, 'center'); } }   // 처치 가속 표시 (0.24)
  c.fillStyle = '#fff';
  c.font = 'bold 14px Galmuri11, system-ui'; txt('처치 ' + G.kills, W - 56, top + 20, 'right');
  if (STATE.dev.fps && STATE.mode !== 'result') { c.font = '12px ui-monospace,monospace'; txt(Math.round(STATE.fps) + ' FPS · 적 ' + aliveCount() + (() => { const P = perfStat(); return P ? ` · 평균 ${P.avg} · 하위1% ${P.low1}` : ''; })(), W - 12, isBossPhase() ? top + 128 : top + 96, 'right'); }
  drawSlots(c, top + 58);
  drawBossBar(c, top + 92, txt);                            // 수문장 체력 (0.11)
  let ty = VIEW.ch * 0.3;
  for (const t of G.toasts) { c.globalAlpha = Math.min(1, (t.dur - t.t) * 3); c.font = 'bold 16px Galmuri11, system-ui'; c.fillStyle = t.color; txt(t.text, W / 2, ty, 'center'); ty += 26; c.fillStyle = '#fff'; }
  c.globalAlpha = 1;
  drawGuide(c);                                             // 첫 판 안내 (0.31)
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
      c.fillStyle = '#14121c'; c.font = 'bold 13px Galmuri11, system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(icOf(it), x + S / 2, y + S / 2 - 1);
      c.font = 'bold 9px Galmuri11, system-ui'; c.textAlign = 'right'; c.textBaseline = 'alphabetic'; c.lineWidth = 2.5; c.strokeStyle = 'rgba(0,0,0,0.8)';
      const lv = String(it.lvl); c.strokeText(lv, x + S - 1, y + S - 1); c.fillStyle = '#fff'; c.fillText(lv, x + S - 1, y + S - 1);
    }
  };
  const rowW = 5 * S + 4 * gap, px0 = W - 12 - rowW;
  row(p.weapons, slotW(), 12, w => CFG.colors[WEAPONS[w.id].cat], w => WEAPONS[w.id].ic);
  p.weapons.forEach((w, i) => { const jt = jobTint(WEAPONS[w.id].cat); if (!jt) return; const x = 12 + i * (S + gap); c.strokeStyle = jt; c.lineWidth = 2.5; c.strokeRect(x + 1.25, y + 1.25, S - 2.5, S - 2.5); c.fillStyle = jt; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 8, y); c.lineTo(x, y + 8); c.closePath(); c.fill(); });   // 직업 변환 무기 표시 (0.26)
  row(p.passives, CFG.slots.passive, px0, () => CFG.colors.passive, ps => PASSIVES[ps.id].ic);
  // 0.25 주기형 효과 재사용 표시: 시계 방향으로 채워지는 원형 (숫자 없음)
  const T = G.tm, pie = (x, y, r, k) => { c.fillStyle = 'rgba(10,8,16,0.55)'; c.beginPath(); c.moveTo(x, y); c.arc(x, y, r, -Math.PI / 2 + Math.PI * 2 * clamp(k, 0, 1), Math.PI * 1.5); c.closePath(); c.fill(); c.strokeStyle = k >= 1 ? '#fff6c8' : 'rgba(255,255,255,0.75)'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(k, 0, 1)); c.stroke(); };
  const pcd = { magnet: ['vacuum', () => 1 - (T.vac == null ? 30 : T.vac) / 30], vit: ['shield', () => p.shield ? 1 : 1 - T.shield / 12], haste: ['charge', () => 1 - T.charge / 8] };
  p.passives.forEach((ps, i) => { const q = pcd[ps.id]; if (q && ps.br === q[0]) pie(px0 + i * (S + gap) + S / 2, y + S / 2, S / 2 - 2, q[1]()); });
  let dx0 = 12 + slotW() * (S + gap) + 6;
  for (const [st, TB, fc] of [[p.exw1, EXW1, '#ffe8a0'], [p.exw, EXW, '#ffd24a']]) {   // 0.26 전용 무기 칸: 금색 마름모 틀 + 재사용 원형 (0.27 1차·2차 2칸)
    if (!st) continue;
    const X = TB[st.id], cx = dx0 + S / 2, cy = y + S / 2, h = S / 2 + 1;
    c.fillStyle = fc; c.beginPath(); c.moveTo(cx, cy - h); c.lineTo(cx + h, cy); c.lineTo(cx, cy + h); c.lineTo(cx - h, cy); c.closePath(); c.fill();
    c.strokeStyle = '#7a5a10'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#14121c'; c.font = 'bold 11px Galmuri11, system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(X.ic, cx, cy);
    if (X.cd > 0.6) pie(cx, cy, S / 2 - 5, 1 - Math.max(0, st.t) / X.cd);
    dx0 += S + gap + 2;
  }
  const dials = jobDials();
  dials.forEach((d, i) => { const x = dx0 + i * (S + gap) + S / 2, yy = y + S / 2; if (x + S / 2 > px0 - 4) return;
    c.fillStyle = d.col; c.beginPath(); c.arc(x, yy, S / 2 - 1, 0, 7); c.fill(); c.fillStyle = '#14121c'; c.font = 'bold 12px Galmuri11, system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(d.ic, x, yy);
    pie(x, yy, S / 2 - 1, d.k); });
}
/* 직업 주기 효과 목록 (궁극기 충전·군기·포탑·형태 교대) */
function jobDials() {
  const p = G.p, T = G.tm, out = []; if (!p.job) return out;
  out.push({ ic: '궁', col: '#ffe08a', k: p.ult / JOB_CFG.ultNeed });
  if (p.job === 'sovereign') out.push({ ic: '기', col: '#ffd24a', k: 1 - (T.banner == null ? 0 : T.banner) / 10 });
  if (p.job === 'engineer') out.push({ ic: '탑', col: '#b4c2d4', k: 1 - T.turret / 10 });
  if (p.job === 'druid') { const b = G.pets.find(m => m.kind === 'bear'); if (b) out.push({ ic: '곰', col: '#c89060', k: 1 - b.sk / petStat('bear').sk }); }
  return out;
}
