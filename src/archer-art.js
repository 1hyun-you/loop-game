/* G44-4. The renderer reads projectile, hit, trap and beam clocks from combat. */
const ARCHER_IMAGES = Object.create(null);
const ARCHER_BOUNCES = new WeakMap();
const ARCHER_PROJECTILES = {
  fu_archer_cleave: ['split-arrow', 31, '#e3f5a8'],
  fu_archer_shield: ['impact-arrow', 33, '#d9cf8a'],
  fu_archer_slam: ['base-arrow', 29, '#eee5be'],
  fu_archer_trap: ['base-arrow', 28, '#bce283'],
  fu_archer_shuriken: ['ricochet-arrow', 31, '#e3f2d4'],
  fu_archer_fireball: ['fire-arrow', 32, '#ffc276'],
  fu_archer_icering: ['frost-arrow', 32, '#c9effe'],
  fu_archer_orb: ['hunting-hawk', 24, '#eacb92'],
  fu_archer_beam: ['base-arrow', 29, '#bce283'],
};
const ARCHER_BASE_PROJECTILE = ['base-arrow', 27, '#bce283'];
const ARCHER_RINGS = {
  fu_archer_shield: 'impact-arrow',
  fu_archer_slam: 'falling-arrow',
  fu_archer_trap: 'hunting-trap',
  fu_archer_fireball: 'fire-arrow',
  fu_archer_icering: 'frost-arrow',
  fu_archer_orb: 'hunting-hawk',
};
for (const [id, data] of Object.entries(ARCHER_ART_DATA)) {
  const image = new Image();
  image.onload = () => { ARCHER_IMAGES[id] = image; };
  image.src = data;
}

function archerArtReady(id) { return !!ARCHER_IMAGES[id]?.naturalWidth; }
function archerProjectileArt(pr) {
  if (basicWeaponProjectile(pr)) return null;
  if (G.p.job === 'archer' && pr.kind === 'arrow' && (pr.src === 'arrow' || pr.src === 'split')) return ARCHER_BASE_PROJECTILE;
  return ARCHER_PROJECTILES[pr.src];
}
function archerUsesProjectileArt(pr) { return archerArtReady(archerProjectileArt(pr)?.[0]); }
function archerUsesLineArt(line) { return line.src === 'fu_archer_beam' && archerArtReady('charged-arrow'); }
function archerUsesTrapArt(trap) { return trap.tag === 'fu_archer_trap' && archerArtReady('hunting-trap'); }

function archerStamp(c, id, x, y, length, alpha, angle = 0, heightScale = 1, anchor = .5) {
  const img = ARCHER_IMAGES[id];
  if (!img || alpha <= 0) return;
  const height = length * img.naturalHeight / img.naturalWidth * heightScale;
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.globalAlpha = alpha;
  c.drawImage(img, -length * anchor, -height / 2, length, height);
  c.restore();
}

function archerBounceArt(pr, angle) {
  const next = Math.atan2(pr.vy, pr.vx);
  if (pr.dead || !archerArtReady('ricochet-arrow')) return;
  const marks = (ARCHER_BOUNCES.get(G) || []).filter(mark => G.time - mark.time < .16).slice(-31);
  marks.push({ x: pr.x, y: pr.y, angle, next, time: G.time });
  ARCHER_BOUNCES.set(G, marks);
}

function drawArcherProjectile(c, pr, art, reduced) {
  const [id, length, color] = art;
  const angle = Math.atan2(pr.vy, pr.vx), ux = Math.cos(angle), uy = Math.sin(angle);
  if (id === 'hunting-hawk') {
    const rise = clamp(pr.t / .16, 0, 1);
    const dive = clamp((uy + .15) * .9, 0, 1);
    const height = reduced ? 0 : 10 * rise * (1 - dive);
    c.globalAlpha = .21;
    c.fillStyle = '#352438';
    c.beginPath(); c.ellipse(pr.x, pr.y, pr.r, pr.r * .42, 0, 0, Math.PI * 2); c.fill();
    const wings = reduced ? .87 : (.79 + .2 * Math.cos(pr.t * 28)) * (1 - .4 * dive);
    archerStamp(c, id, pr.x, pr.y - height, length, .96, angle, wings, .67);
    return;
  }
  const flight = reduced ? 1 : clamp(pr.t / .07, 0, 1);
  const back = length * (.48 + flight * .34);
  const trail = Math.min(16, Math.hypot(pr.vx, pr.vy) * pr.t * .55) * flight;
  if (!reduced && trail > 0) {
    vfxLine(c, [[pr.x - ux * (back + trail), pr.y - uy * (back + trail)], [pr.x - ux * (back - 4), pr.y - uy * (back - 4)]], 1.6, color, .52);
  }
  archerStamp(c, id, pr.x, pr.y, length * (.78 + .22 * flight), .97, angle, 1, .81);
}

function drawArcherTrap(c, x, y, progress, alpha, closing = false) {
  const open = closing ? 1 - .76 * progress : .58 + .42 * progress;
  archerStamp(c, 'hunting-trap', x, y - (closing ? 2 * Math.sin(Math.PI * progress) : 7 * (1 - progress)),
    26, alpha, 0, Math.max(.22, open));
}

function drawArcherImpact(c, f, k, reduced) {
  const id = f.archerArt;
  if (f.archerAim) {
    const r = Math.min(f.archerRadius, lerp(f.r0, f.r1, k));
    for (let i = 0; i < 4; i++) {
      const a = Math.PI * (.25 + i * .5);
      c.globalAlpha = .58;
      c.strokeStyle = '#dcefb2'; c.lineWidth = 2;
      c.beginPath(); c.arc(f.x, f.y, r, a - .22, a + .22); c.stroke();
    }
    if (!reduced && k > .40) {
      const fall = clamp((k - .40) / .60, 0, 1);
      archerStamp(c, id, f.x, f.y - (1 - fall * fall) * 68, 39, .92, Math.PI / 2, 1, .88);
    }
    return;
  }

  const R = f.r1, fade = 1 - k;
  if (R <= 0) return;
  const reach = reduced ? .86 : .22 + .76 * (1 - fade ** 2);
  const r = R * reach;
  c.save();
  c.beginPath(); c.arc(f.x, f.y, R, 0, Math.PI * 2); c.clip();
  if (id === 'hunting-trap') {
    drawArcherTrap(c, f.x, f.y, reduced ? 1 : Math.min(1, k * 4), .94 * fade, true);
  } else if (id === 'falling-arrow') {
    archerStamp(c, id, f.x, f.y, 39, .85 * fade, Math.PI / 2, 1, .88);
  } else if (id === 'hunting-hawk') {
    archerStamp(c, id, f.x, f.y, 24, .85 * fade, .32, .68, .73);
  }

  const [count, ink, core, shape] = id === 'fire-arrow' ? [8, '#a9653b', '#ffe39a', 'ember']
    : id === 'frost-arrow' ? [10, '#508393', '#daf8ff', 'frost']
    : id === 'falling-arrow' ? [7, '#796348', '#eed19b', 'crack']
    : id === 'hunting-trap' ? [4, '#625137', '#e4efab', 'jaw']
    : id === 'hunting-hawk' ? [5, '#765235', '#f1d599', 'feather']
    : [5, '#69633d', '#f4edb5', 'wave'];
  for (let i = 0; i < count; i++) {
    const a = i * Math.PI * 2 / count + .19;
    c.save(); c.translate(f.x, f.y); c.rotate(a);
    if (shape === 'wave' || shape === 'frost') {
      for (const [stroke, width, opacity] of [[ink, 3.5, .62], [core, 1.5, .91]]) {
        c.globalAlpha = fade * opacity;
        c.strokeStyle = stroke; c.lineWidth = width;
        c.beginPath(); c.arc(0, 0, r, -.19, .19); c.stroke();
      }
    }
    const d = shape === 'crack' ? r * .47 : shape === 'ember' ? r * (.64 + (i % 3) * .12) : r * .89;
    const size = Math.min(11, R * .28) * (.55 + .45 * fade);
    const kink = shape === 'crack' ? 3 : shape === 'jaw' ? 5 : 0;
    c.globalAlpha = fade * .85;
    c.fillStyle = core; c.strokeStyle = ink; c.lineWidth = 1.25;
    c.beginPath();
    c.moveTo(d + size, 0); c.lineTo(d - kink, size * .38);
    c.lineTo(d - size * (shape === 'crack' ? 1 : .55), -kink);
    c.lineTo(d + kink, -size * .27); c.closePath();
    c.fill(); c.stroke(); c.restore();
  }
  c.restore();
}

function drawArcherBeam(c, line, reduced) {
  const k = clamp(line.t / line.dur, 0, 1);
  const x = Math.cos(line.a) * line.L, y = Math.sin(line.a) * line.L;
  const lead = reduced ? 1 : clamp((k * 2.3) ** 3, 0, 1);
  const fade = 1 - k;
  c.save(); c.translate(line.x, line.y); c.lineCap = 'butt';
  vfxLine(c, [[0, 0], [x, y]], line.wd, '#4b633c', .49 * fade);
  vfxLine(c, [[0, 0], [x * lead, y * lead]], line.wd * .47, '#e0f4ad', .89 * fade);
  vfxLine(c, [[0, 0], [x * lead, y * lead]], 1.7, '#fff9dc', .95 * fade);
  archerStamp(c, 'charged-arrow', x * lead, y * lead, 47, Math.min(1, fade * 2.4), line.a, 1, .96);
  c.restore();
}

function drawArcherArtWorld(c, inView) {
  const reduced = VFX.reduced.matches;
  c.save(); c.imageSmoothingEnabled = true; c.lineCap = 'round';
  for (const f of G.fx) {
    if (!archerArtReady(f.archerArt) || !inView(f.x, f.y, (f.r1 || 0) + 75)) continue;
    const k = f.t / f.dur;
    if (k < 1) drawArcherImpact(c, f, k, reduced);
  }
  for (const line of G.f44?.lines || []) {
    if (archerUsesLineArt(line)) drawArcherBeam(c, line, reduced);
  }
  for (const trap of G.f44?.traps || []) {
    if (trap.dead || !inView(trap.x, trap.y, 20) || !archerUsesTrapArt(trap)) continue;
    const arm = reduced ? 1 : clamp(trap.t / trap.arm, 0, 1);
    drawArcherTrap(c, trap.x, trap.y, arm, .58 + .38 * arm);
  }
  if (!reduced && archerArtReady('ricochet-arrow')) {
    for (const mark of ARCHER_BOUNCES.get(G) || []) {
      const fade = 1 - (G.time - mark.time) / .16;
      if (fade <= 0 || !inView(mark.x, mark.y, 20)) continue;
      const pt = (a, d) => [mark.x + Math.cos(a) * d, mark.y + Math.sin(a) * d];
      const points = [pt(mark.angle, -14), [mark.x, mark.y], pt(mark.next, 13)];
      vfxLine(c, points, 3.3, '#514456', .67 * fade);
      vfxLine(c, points, 1.35, '#edf4cd', .88 * fade);
    }
  }
  for (const pr of G.proj) {
    if (pr.dead || !inView(pr.x, pr.y, pr.r + 40)) continue;
    const art = archerProjectileArt(pr);
    if (art && archerArtReady(art[0])) drawArcherProjectile(c, pr, art, reduced);
  }
  c.restore();
}
