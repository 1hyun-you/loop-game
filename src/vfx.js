/* 0.40-vfx1 — canvas-only visual layer. No hit tests, damage or timers here.
   Palette: parchment/gold physical, amber fire, blue frost, lavender arcane.
   Cached glow stamps: <=16. Projectile accents: <=48/96 per frame.
   Reduced motion suppresses accents; existing danger geometry is untouched. */
const VFX = { cache: new Map(), reduced: matchMedia('(prefers-reduced-motion: reduce)') };
function vfxState() { return G.vfx || (G.vfx = { seed: 0x71a3c95, hits: new WeakMap(), healAt: -1 }); }
function vfxRand(lo = 1, hi) {
  const v = vfxState(); let x = v.seed; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; v.seed = x >>> 0;
  const q = v.seed / 4294967296; return hi === undefined ? q * lo : lo + q * (hi - lo);
}
function vfxLite() { return VFX.reduced.matches || STATE.fps < 42; }
function vfxGlow(c, x, y, r, color, alpha) {
  if (!(r > 0 && alpha > 0)) return;
  let cv = VFX.cache.get(color);
  if (!cv) {
    cv = document.createElement('canvas'); cv.width = cv.height = 48;
    const g = cv.getContext('2d'), grad = g.createRadialGradient(24, 24, 0, 24, 24, 24);
    grad.addColorStop(0, color); grad.addColorStop(0.22, color); grad.addColorStop(1, 'transparent');
    g.fillStyle = grad; g.fillRect(0, 0, 48, 48);
    if (VFX.cache.size >= 16) VFX.cache.delete(VFX.cache.keys().next().value);
    VFX.cache.set(color, cv);
  }
  c.globalAlpha = alpha; c.drawImage(cv, x - r, y - r, r * 2, r * 2);
}
function vfxLine(c, pts, width, color, alpha) {
  c.globalAlpha = alpha; c.strokeStyle = color; c.lineWidth = width;
  c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
}
function vfxHit(e, crit, source = {}) {
  if (VFX.reduced.matches || G.fx.length >= (vfxLite() ? 60 : 120)) return;
  const v = vfxState(), last = v.hits.get(e);
  if (last !== undefined && G.time - last < 0.10) return;
  v.hits.set(e, G.time);
  const a=Math.atan2(e.y-(source.fy??G.p.y),e.x-(source.fx??G.p.x)),contact=Math.min(e.r*.4,5);
  fx({ kind: 'glint', x: e.x-Math.cos(a)*contact, y: e.y-Math.sin(a)*contact, r: Math.min(12, e.r * 0.6), a, crit:!!crit, color: crit ? '#f2d48a' : '#e9ddbd', dur: crit ? 0.19 : 0.12 });
}
function vfxHeal() {
  if (VFX.reduced.matches) return;
  const v = vfxState(); if (G.time - v.healAt < 0.8) return;
  v.healAt = G.time;
  sparkUp(G.p.x, G.p.y, 4, ['#b8dca1', '#e5efc4'], 12);
  fx({kind:'ring',art:'heal',x:G.p.x,y:G.p.y,r0:12,r1:26,dur:.45,follow:true,color:'#b8dca1'});
}
/* Short analytic streaks; no history allocation, no mutation during rendering.
   culling/budget before drawing, no world-wide additive bloom. */
function drawVfxTrails(c, inView) {
  if (VFX.reduced.matches) return;
  let count = 0, cap = vfxLite() ? 48 : 96;
  c.save(); c.lineCap = 'round'; c.imageSmoothingEnabled = true;
  for (const p of G.proj) {
    if (count >= cap) break;
    if (p.dead || warriorArtReady(warriorProjectileArt(p)) || !inView(p.x, p.y, p.r + 26)) continue;
    const speed = Math.hypot(p.vx, p.vy); if (speed < 20) continue;
    count++;
    const L = Math.min(24, speed * 0.045, speed * Math.max(0, p.t || 0)), ux = p.vx / speed, uy = p.vy / speed;
    const fire = p.kind === 'fire' || /flame|fire/.test(p.src), col = fire ? '#edaa64' : p.jt || p.color || '#c7d9de';
    const w = Math.min(6, Math.max(1.2, p.r * 0.55));
    for (let i = 2; i >= 0; i--) {
      const a = L * (i + 1) / 3, b = L * i / 3;
      vfxLine(c, [[p.x - ux * a, p.y - uy * a], [p.x - ux * b, p.y - uy * b]], w * (1 - i * 0.25), col, 0.28 - i * 0.075);
    }
    if (fire && !vfxLite()) vfxGlow(c, p.x, p.y, p.r + 5, '#e9a264', 0.20);
  }
  c.restore();
}
/* Replacement for legacy circles, hard white sweeps and crossed straight slashes.
   All expansion/sector limits come from the original f.r/f.r1/f.arc/f.dur. */
function drawFx(c) {
  const lite = vfxLite(), tau = Math.PI * 2;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.imageSmoothingEnabled = true;
  for (const f of G.fx) {
    const k = clamp(f.t / f.dur, 0, 1), fade = (1 - k) * (1 - k), x = f.follow ? G.p.x : f.x, y = f.follow ? G.p.y : f.y;
    if (k >= 1 || warriorArtReady(f.warArt)) continue;
    if (Number.isFinite(x) && Number.isFinite(y) && (Math.abs(x - G.p.x) > VIEW.cameraW / 2 + (f.r1 || f.r || 0) + 200 || Math.abs(y - G.p.y) > VIEW.cameraH / 2 + (f.r1 || f.r || 0) + 200)) continue;
    if(paintedRing(c,f,k,x,y))continue;
    if (f.kind === 'ring') {
      const r = Math.max(1, lerp(f.r0, f.r1, 1 - (1 - k) ** 2)), col = f.color || '#e8d8af';
      if (f.fill) {
        vfxGlow(c, x, y, r, col, 0.35 * fade);
        if (k < 0.22) vfxGlow(c, x, y, Math.min(r * 0.4, 24), '#fff2d5', 0.75 * (1 - k / 0.22));
      }
      c.globalAlpha = 0.8 * fade; c.strokeStyle = col; c.lineWidth = f.fill ? 1.5 + 2 * fade : 1.6;
      c.beginPath(); c.arc(x, y, r, 0, tau); c.stroke();
      if (!lite) {
        c.globalAlpha = 0.38 * fade; c.strokeStyle = '#fff0cf'; c.lineWidth = 1;
        c.beginPath(); c.arc(x, y, r * 0.82, 0, tau); c.stroke();
        // Frost rings retain original radius, with six small crystalline facets.
        if (f.element === 'ice') for (let i = 0; i < 6; i++) {
          const a = i * tau / 6, px = x + Math.cos(a) * r * 0.9, py = y + Math.sin(a) * r * 0.9;
          c.save(); c.translate(px, py); c.rotate(a); c.fillStyle = col; c.globalAlpha = 0.65 * fade;
          c.beginPath(); c.moveTo(0, -4); c.lineTo(2, 0); c.lineTo(0, 4); c.lineTo(-2, 0); c.closePath(); c.fill(); c.restore();
        }
      }
    } else if (f.kind === 'arc') {
      const sw = Math.min(1, k * 4), a0 = f.a - f.arc / 2, a1 = a0 + f.arc * sw, tail = Math.max(a0, a1 - f.arc * 0.7), px = G.p.x, py = G.p.y;
      c.globalAlpha = 0.17 * (1 - k); c.fillStyle = f.color;
      c.beginPath(); c.arc(px, py, f.r * 0.96, tail, a1); c.arc(px, py, f.r * 0.62, a1, tail, true); c.closePath(); c.fill();
      for (const [rr, w, col, al] of [[0.92, 3, '#f5e8ca', 0.85], [0.79, 1.4, f.color, 0.5]]) {
        c.globalAlpha = al * (1 - k); c.strokeStyle = col; c.lineWidth = w;
        c.beginPath(); c.arc(px, py, f.r * rr, Math.max(tail, a1 - 0.95), a1); c.stroke();
      }
      if (!lite && k < 0.35) vfxGlow(c, px + Math.cos(a1) * f.r * 0.92, py + Math.sin(a1) * f.r * 0.92, 6, '#f8dfad', 0.7 * (1 - k));
    } else if (f.kind === 'bolt' || f.kind === 'zap') {
      const bolt = f.kind === 'bolt', sx = bolt ? x : f.x, sy = bolt ? y - 170 : f.y, ex = bolt ? x : f.x2, ey = bolt ? y : f.y2;
      const n = bolt ? 8 : 5, dx = ex - sx, dy = ey - sy, L = Math.hypot(dx, dy) || 1, seed = Math.floor(ex * 7 + ey * 3), pts = [];
      for (let i = 0; i <= n; i++) { const t = i / n, off = i && i < n ? (hash2(seed, i) - 0.5) * (bolt ? 26 : 17) : 0; pts.push([sx + dx * t - dy / L * off, sy + dy * t + dx / L * off]); }
      if (!lite) vfxLine(c, pts, 7, '#8d9ec7', 0.20 * fade);
      vfxLine(c, pts, 2.7, '#b9d6eb', 0.82 * fade); vfxLine(c, pts, 1, '#f4f0dc', fade);
      if (bolt) { paintedEffect(c,'lightning',ex,ey,17+12*k,.7*fade); }
    } else if (f.kind === 'slash' || f.kind === 'glint') {
      if(f.kind==='glint') {
        // Confirmed contact: a quick directional fan; crits add two short rays.
        const L=f.r*(.45+Math.min(1,k*5)*.8),a=f.a||0;
        for(const da of (f.crit?[-1.15,-.5,0,.5,1.15]:[-.65,0,.65])) {
          const ux=Math.cos(a+da),uy=Math.sin(a+da),inner=L*k*.6;
          vfxLine(c,[[x+ux*inner,y+uy*inner],[x+ux*L,y+uy*L]],da===0?1.8:1.1,f.color,.88*fade);
        }
        if(k<.3&&!lite)vfxGlow(c,x,y,4,'#f8e6ba',.4*(1-k/.3));
        continue;
      }
      const glint = f.kind === 'glint', L = glint ? f.r * (0.5 + k) : 26 * (0.6 + Math.min(1, k * 4) * 0.4);
      for (const da of [0.5, -0.5]) {
        const a = (f.a || 0) + da, ux = Math.cos(a), uy = Math.sin(a);
        if (glint) {
          vfxLine(c, [[x - ux * L, y - uy * L], [x + ux * L, y + uy * L]], 1.5, f.color, 0.7 * fade);
        } else {
          // Curved tapered blade, rather than a constant-width cross.
          c.save(); c.translate(x, y); c.rotate(a); c.globalAlpha = 0.65 * fade; c.fillStyle = f.color;
          c.beginPath(); c.moveTo(-L, 0); c.quadraticCurveTo(0, -5, L, 0); c.quadraticCurveTo(0, 2, -L, 0); c.fill();
          c.globalAlpha = fade; c.strokeStyle = '#f5e8cf'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-L * 0.6, -0.5); c.quadraticCurveTo(0, -2, L * 0.85, 0); c.stroke(); c.restore();
        }
      }
    } else if (f.kind === 'pop') { if(!paintedEffect(c,effectKey(f.color,true),x,y,f.r*(1+k),.7*fade))vfxGlow(c,x,y,f.r*(1+k),f.color,.7*fade); }
  }
  c.restore();
}

function drawVfxIce(c, x, y, r) {
  if (vfxLite()) return;
  c.save(); c.globalAlpha = 0.38; c.strokeStyle = '#b8d5dd'; c.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + G.time * 0.12, px = x + Math.cos(a) * (r - 5), py = y + Math.sin(a) * (r - 5);
    c.beginPath(); c.moveTo(px - 2, py); c.lineTo(px, py - 3); c.lineTo(px + 2, py); c.lineTo(px, py + 3); c.closePath(); c.stroke();
  }
  c.restore();
}
