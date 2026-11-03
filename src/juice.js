/* ============================================================
   타격 연출 (0.22) — 피격 반짝임·밀림 강화, 처치 파편, 치명타 강조,
   레벨업·상자 개봉·보스 등장·페이즈 전환 연출, 피해 숫자(설정, 기본 꺼짐)
   ============================================================ */
const JUICE = {
  kbMul: 1.3,            // 밀림 강화 배율
  flash: 0.1,            // 피격 반짝임 시간 (기존 0.08)
  ptMax: 260,            // 파편 동시 상한
  dnMax: 60,             // 피해 숫자 동시 상한
  dnMerge: 0.12,         // 같은 적 연속 피해 합산 시간
  shard: { n: 3, elite: 7, boss: 18 },
};
function JC() { return G.jc || (G.jc = { pt: [], dn: [], bn: null, sk: 0, ska: 0 }); }

/* 화면 흔들림 (설정 '화면 흔들림' 따름) */
function shake(a, dur) { const j = JC(); if (a >= j.ska || j.sk <= 0) { j.ska = a; j.sk = dur; } }
function shakeAmt() { const j = G.jc; return j && j.sk > 0 ? j.ska * Math.min(1, j.sk * 4) : 0; }

/* 파편 */
/* 0.25 폭발 불티 — 폭발형 원 효과마다 1회, 동시 개수는 burst 상한 적용 */
function sparkBurst(x, y, R, col) { burst(x, y, Math.min(10, 3 + Math.round(R / 14)), col, R * 2.6, 0.35, 2.5); }
function burst(x, y, n, col, sp = 120, life = 0.45, sz = 3) {
  const j = JC(); n = Math.min(n, JUICE.ptMax - j.pt.length); if (n <= 0) return;
  for (let i = 0; i < n; i++) {
    const a = rand(Math.PI * 2), v = sp * rand(0.45, 1);
    j.pt.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.25, t: 0, dur: life * rand(0.7, 1.15), c: col, s: sz * rand(0.8, 1.3), g: 260 });
  }
}
function sparkUp(x, y, n, cols, spread = 26) {
  const j = JC(); n = Math.min(n, JUICE.ptMax - j.pt.length);
  for (let i = 0; i < n; i++) j.pt.push({ x: x + rand(-spread, spread), y: y + rand(-6, 10), vx: rand(-12, 12), vy: -rand(70, 150), t: 0, dur: rand(0.5, 0.9), c: cols[i % cols.length], s: rand(2, 3.5), g: -40 });
}

/* 적 피격·처치 연계 (game.js damageEnemy·killEnemy에서 호출) */
function jHit(e, dmg, o) {
  e.flash = o.crit ? 0.14 : JUICE.flash;
  if (o.crit) fx({ kind: 'ring', x: e.x, y: e.y, r0: e.r * 0.6, r1: e.r + 14, dur: 0.18, color: '#ffe08a' });
  if (SETTINGS.dmgNum) dmgNum(e, dmg, o.crit);
}
function jKill(e) {
  const S = JUICE.shard, n = e.gk && !e.clone ? S.boss : e.elite ? S.elite : S.n;
  burst(e.x, e.y, n, e.color || '#ddd', e.gk ? 200 : 120, e.gk ? 0.8 : 0.45, e.gk ? 4 : 3);
  if (e.elite) burst(e.x, e.y, 4, '#ffd24a', 150, 0.5, 3);
  if (e.gk && !e.clone) { shake(6, 0.6); vibe(60); fx({ kind: 'ring', x: e.x, y: e.y, r0: e.r, r1: e.r + 140, dur: 0.7, color: '#fff2c8' }); }
}

/* 피해 숫자 — 같은 적 연속 피해는 짧은 시간 합산, 상한 초과 시 치명타 외 생략 */
function dmgNum(e, v, crit) {
  const j = JC(), m = e._dn;
  if (m && !m.done && m.t < JUICE.dnMerge && !crit && !m.crit) { m.v += v; m.x = e.x; return; }
  if (j.dn.length >= JUICE.dnMax) { if (!crit) return; j.dn.shift(); }
  const d = { x: e.x + rand(-4, 4), y: e.y - e.r - 2, v, crit: !!crit, t: 0, dur: crit ? 0.8 : 0.6 };
  j.dn.push(d); e._dn = d;
}

/* 가운데 알림판: 페이즈 전환·보스 등장 */
function banner(text, sub, color = '#ffe08a', dur = 1.8) { JC().bn = { text, sub, color, t: 0, dur }; }

/* 레벨업·상자 개봉·보스 등장 */
function jLevel() { const p = G.p; sparkUp(p.x, p.y, 14, ['#7fe0ff', '#fff6c8', '#b8f0ff']); fx({ kind: 'ring', x: p.x, y: p.y, r0: 6, r1: 40, dur: 0.3, color: '#fff6c8', follow: true }); }
function jChest() { const p = G.p; burst(p.x, p.y, 18, '#ffd24a', 170, 0.6, 3); sparkUp(p.x, p.y, 8, ['#fff2a0', '#ffd24a']); shake(2, 0.2); }
function jBoss(name, sub) { banner(name, sub, '#ff8a6a', 2.2); shake(5, 0.7); vibe(80); }

function updateJuice(dt) {
  const j = G.jc; if (!j) return;
  if (j.sk > 0) j.sk -= dt;
  if (j.pt.length) { for (const q of j.pt) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; q.vx *= 1 - dt * 3; } j.pt = j.pt.filter(q => q.t < q.dur); }
  if (j.dn.length) { for (const d of j.dn) { d.t += dt; d.y -= (d.crit ? 34 : 26) * dt; if (d.t >= JUICE.dnMerge) d.done = true; } j.dn = j.dn.filter(d => d.t < d.dur); }
  if (j.bn) { j.bn.t += dt; if (j.bn.t >= j.bn.dur) j.bn = null; }
}
/* 월드 좌표 그리기 (drawFx 다음) */
function drawJuice(c) {
  const j = G.jc; if (!j) return;
  for (const q of j.pt) { c.globalAlpha = Math.max(0, 1 - q.t / q.dur); c.fillStyle = q.c; const s = q.s; c.fillRect(Math.round(q.x - s / 2), Math.round(q.y - s / 2), s, s); }
  c.globalAlpha = 1;
  if (!j.dn.length) return;
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  for (const d of j.dn) {
    const k = d.t / d.dur, pop = d.crit && d.t < 0.1 ? 1.35 : 1;
    c.globalAlpha = k > 0.6 ? (1 - k) / 0.4 : 1;
    c.font = `bold ${Math.round((d.crit ? 13 : 10) * pop)}px Galmuri11, system-ui`;
    const s = String(Math.max(1, Math.round(d.v)));
    c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.75)'; c.strokeText(s, d.x, d.y);
    c.fillStyle = d.crit ? '#ffd24a' : '#ffffff'; c.fillText(s, d.x, d.y);
  }
  c.globalAlpha = 1;
}
/* 화면 좌표 그리기 (HUD 다음) */
function drawBanner(c) {
  const j = G.jc, b = j && j.bn; if (!b) return;
  const W = VIEW.cw, y = VIEW.ch * 0.4, k = b.t / b.dur;
  const a = b.t < 0.2 ? b.t / 0.2 : k > 0.75 ? (1 - k) / 0.25 : 1, sx = b.t < 0.2 ? 0.7 + 0.3 * b.t / 0.2 : 1;
  c.globalAlpha = a * 0.55; c.fillStyle = '#000'; c.fillRect(0, y - 30, W, b.sub ? 62 : 46);
  c.globalAlpha = a; c.fillStyle = b.color; c.fillRect(0, y - 30, W * sx, 2); c.fillRect(W * (1 - sx), y + (b.sub ? 30 : 14), W * sx, 2);
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,0.7)';
  c.font = 'bold 22px Galmuri11, system-ui'; c.strokeText(b.text, W / 2, y - 6); c.fillStyle = b.color; c.fillText(b.text, W / 2, y - 6);
  if (b.sub) { c.font = 'bold 13px Galmuri11, system-ui'; c.strokeText(b.sub, W / 2, y + 17); c.fillStyle = '#fff'; c.fillText(b.sub, W / 2, y + 17); }
  c.globalAlpha = 1;
}
