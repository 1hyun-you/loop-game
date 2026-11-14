/* G44-3: read the existing attack and entity clocks. Draw beneath danger warnings. */
const SOVEREIGN_IMAGES = Object.create(null);
for (const [id, data] of Object.entries(SOVEREIGN_ART_DATA)) {
  const image = new Image();
  image.onload = () => { SOVEREIGN_IMAGES[id] = image; };
  image.src = data;
}

const SOVEREIGN_PROJECTILES = {
  fu_sovereign_arrow: 'archer-volley',
  fu_sovereign_shuriken: 'shield-throw',
  fu_sovereign_orb: 'messenger-falcon',
};
function sovereignArtReady(id) { return !!SOVEREIGN_IMAGES[id]?.naturalWidth; }
function sovereignUsesProjectileArt(pr) { return sovereignArtReady(SOVEREIGN_PROJECTILES[pr.src]); }
function sovereignUsesLineArt(line) { return line.src === 'fu_sovereign_beam' && sovereignArtReady('banner-radiance'); }
function sovereignUsesTrapArt(trap) { return trap.tag === 'fu_sovereign_trap' && sovereignArtReady('royal-barricade'); }

function sovereignStamp(c, id, x, y, size, alpha, angle = 0, scaleY = 1, anchor = .5) {
  const image = SOVEREIGN_IMAGES[id];
  if (!image || alpha <= 0) return;
  const scale = size / Math.max(image.naturalWidth, image.naturalHeight);
  const w = image.naturalWidth * scale, h = image.naturalHeight * scale * scaleY;
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.globalAlpha = alpha;
  c.drawImage(image, -w * anchor, -h / 2, w, h);
  c.restore();
}

function drawSovereignImpact(c, f, k, reduced) {
  const id = f.sovereignArt, fade = 1 - k;
  const radius = f.r1 || f.r || 0, angle = f.sovereignAngle || 0;
  const x = f.x, y = f.y;
  if (f.sovereignStage === 'fall') {
    const progress = reduced ? 1 : clamp((f.t - .08) / (f.dur - .08), 0, 1);
    const height = 58 * (1 - progress * progress);
    c.globalAlpha = .35 + .45 * progress;
    c.strokeStyle = '#ffe5a1'; c.lineWidth = 1.5;
    c.beginPath(); c.ellipse(x, y, 12 - 5 * progress, 5 - 2 * progress, 0, 0, Math.PI * 2); c.stroke();
    sovereignStamp(c, id, x, y - height, 29, .48 + .52 * progress);
    return;
  }
  if (id === 'guard-cleave') {
    const sweep = angle + (reduced ? 0 : (k - .42) * f.sovereignArc);
    c.save(); c.translate(x, y);
    c.strokeStyle = '#4d3147'; c.lineWidth = 5; c.globalAlpha = .68 * fade;
    c.beginPath(); c.arc(0, 0, radius * .76, angle - f.sovereignArc / 2, Math.max(angle - f.sovereignArc / 2 + .02, sweep)); c.stroke();
    c.strokeStyle = '#ffecac'; c.lineWidth = 2; c.stroke(); c.restore();
    sovereignStamp(c, id, x + Math.cos(sweep) * radius * .28, y + Math.sin(sweep) * radius * .28 - 5, 31, fade, (sweep - angle) * .45);
    return;
  }
  if (f.sovereignStage === 'raise') {
    const lift = reduced ? 0 : 13 * Math.sin(Math.PI * k);
    sovereignStamp(c, id, x, y - 8 - lift, 29, Math.min(1, fade * 3), -.22 * (1 - k));
    return;
  }
  const r = lerp(f.r0 || 0, radius, reduced ? 1 : 1 - fade ** 2);
  const ice = id === 'ice-wall', advance = id === 'royal-advance';
  const count = ice ? 8 : advance ? 7 : 5;
  c.save(); c.translate(x, y);
  for (let i = 0; i < count; i++) {
    const a = i * Math.PI * 2 / count + angle;
    c.strokeStyle = ice ? '#cdf6ff' : '#ffe1a1'; c.lineWidth = 1.7;
    c.globalAlpha = fade * .72;
    c.beginPath(); c.arc(0, 0, Math.max(1, r - 2), a - .15, a + .15); c.stroke();
    if (ice || advance || id === 'royal-bombardment') {
      sovereignStamp(c, id, Math.cos(a) * r * .83, Math.sin(a) * r * .83,
        Math.min(ice ? 24 : 17, radius * .28), fade * (ice ? .88 : .64),
        ice ? a + Math.PI / 2 : a + Math.PI, advance ? .8 : 1);
    }
  }
  c.restore();
  if (id === 'base-shield' || id === 'royal-barricade') {
    const push = reduced ? 0 : 11 * Math.sin(Math.PI * k);
    sovereignStamp(c, id, x + Math.cos(angle) * push, y + Math.sin(angle) * push - 10,
      id === 'base-shield' ? 28 : 31, fade, .18 * Math.sin(angle));
  }
}

function drawSovereignProjectile(c, pr, reduced) {
  const id = SOVEREIGN_PROJECTILES[pr.src];
  const a = Math.atan2(pr.vy, pr.vx), age = pr.t || 0;
  const x = pr.x, y = pr.y, ux = Math.cos(a), uy = Math.sin(a);
  if (id === 'messenger-falcon') {
    const lift = reduced ? 0 : 9 * Math.sin(Math.PI * clamp(age / .45, 0, 1));
    const flap = reduced ? .86 : .76 + .23 * Math.cos(age * 32);
    const turn = ux < 0 ? Math.PI - a : a;
    c.save(); c.translate(x, y - lift); c.scale(ux < 0 ? -1 : 1, 1);
    sovereignStamp(c, id, 0, 0, pr.r * 2.8, .98, turn, flap);
    c.restore();
    return;
  }
  const shield = id === 'shield-throw';
  const back = shield ? pr.r : pr.r * 2.8;
  const trail = reduced ? 0 : Math.min(back, Math.hypot(pr.vx, pr.vy) * age);
  if (trail > 0) vfxLine(c, [[x - ux * (back + trail), y - uy * (back + trail)], [x, y]], shield ? 2.7 : 1.2, '#f7d87f', .63);
  sovereignStamp(c, id, x, y, shield ? pr.r * 2 : pr.r * 5, .99,
    a + (shield && !reduced ? age * 25 : 0), 1, shield ? .5 : .79);
}

function drawSovereignArtWorld(c, inView) {
  const reduced = VFX.reduced.matches;
  c.save(); c.imageSmoothingEnabled = true;
  for (const f of G.fx) {
    if (f.t < f.dur && !basicWeaponImage(f.basicArt) && sovereignArtReady(f.sovereignArt) && inView(f.x, f.y, (f.r1 || 0) + 68)) {
      c.save(); drawSovereignImpact(c, f, f.t / f.dur, reduced); c.restore();
    }
  }
  for (const line of G.f44?.lines || []) {
    if (!sovereignUsesLineArt(line)) continue;
    const k = clamp(line.t / line.dur, 0, 1), fade = 1 - k;
    const lead = reduced ? 1 : Math.min(1, k * 8);
    const ux = Math.cos(line.a), uy = Math.sin(line.a);
    const origin = [line.x, line.y], end = [line.x + ux * line.L, line.y + uy * line.L];
    const tip = [line.x + ux * line.L * lead, line.y + uy * line.L * lead];
    vfxLine(c, [origin, end], line.wd * .8, '#aa702d', .55 * fade);
    vfxLine(c, [origin, tip], line.wd * .42, '#ffe39a', .92 * fade);
    vfxLine(c, [origin, tip], 1.4, '#fff7d2', fade);
    sovereignStamp(c, 'banner-radiance', ...tip, Math.min(48, line.L * lead), Math.min(1, fade * 2.6), line.a, 1, .98);
  }
  for (const trap of G.f44?.traps || []) {
    if (trap.dead || !sovereignUsesTrapArt(trap) || !inView(trap.x, trap.y, trap.r + 10)) continue;
    const arm = reduced ? 1 : clamp(trap.t / trap.arm, 0, 1);
    const recoil = reduced ? 0 : Math.max(0, (trap.cdT - G.time - .64) / .16);
    const alpha = clamp((trap.life - trap.t) * 3, 0, 1) * (.54 + .44 * arm);
    sovereignStamp(c, 'royal-barricade', trap.x, trap.y - (1 - arm) * 9 - recoil * 3, trap.r * 2, alpha, trap.sovereignAngle || 0, .63 + .37 * arm);
  }
  for (const pr of G.proj) {
    if (!pr.dead && sovereignUsesProjectileArt(pr) && inView(pr.x, pr.y, pr.r + 26)) drawSovereignProjectile(c, pr, reduced);
  }
  c.restore();
}
