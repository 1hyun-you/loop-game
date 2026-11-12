/* G44-7 — Render-only artwork, below enemy warnings and actors. */
const MAGE_IMAGES = Object.create(null);
const MAGE_PROJECTILES = {
  fu_mage_cleave: 'base-fireball', fu_mage_trap: 'base-fireball', fu_mage_icering: 'base-fireball',
  fu_mage_arrow: 'flame-spear', fu_mage_shuriken: 'ricochet-fireball', fu_mage_orb: 'elemental-spirit',
};
for (const [id, data] of Object.entries(MAGE_ART_DATA)) {
  const image = new Image();
  image.onload = () => { MAGE_IMAGES[id] = image; };
  image.src = data;
}
function mageArtReady(id) { return !!MAGE_IMAGES[id]?.naturalWidth; }
function mageProjectileArt(pr) {
  return pr.mageBaseFireball ? 'base-fireball' : MAGE_PROJECTILES[pr.src];
}
function mageUsesProjectileArt(pr) { return mageArtReady(mageProjectileArt(pr)); }
function mageUsesTrapArt(trap) { return trap.tag === 'fu_mage_trap' && mageArtReady('fire-rune'); }
function mageUsesLineArt(line) { return line.src === 'fu_mage_beam' && mageArtReady('flame-beam'); }
function mageUsesPoolArt(pool) {
  return (pool.src === 'fu_mage_slam' || pool.src === 'fu_mage_beam') && mageArtReady('base-fireball');
}

function mageSprite(c, id, x, y, w, h, alpha, a = 0, ax = .5, ay = .5, filter = 'none') {
  const image = MAGE_IMAGES[id];
  c.save(); c.translate(x, y); c.rotate(a); c.globalAlpha = alpha; c.filter = filter;
  c.drawImage(image, -w * ax, -h * ay, w, h);
  c.restore();
}

function mageArc(c, x, y, r, a0, a1, color, alpha, width = 1.5) {
  c.save(); c.strokeStyle = color; c.globalAlpha = alpha; c.lineWidth = width;
  c.beginPath(); c.arc(x, y, r, a0, a1); c.stroke(); c.restore();
}

function drawMageEffect(c, f, reduced) {
  const { x, y, mageArt: id, mageKind: kind, color } = f;
  const k = clamp(f.t / f.dur, 0, 1), fade = 1 - k, open = 1 - fade ** 3;
  const full = Math.PI * 2;
  if (kind === 'whip') {
    const start = f.mageAngle - f.mageArc / 2, span = f.mageArc;
    const progress = Math.min(1, k * 2.2);
    const tip = start + span * progress, r = f.r1;
    c.save();
    c.beginPath(); c.moveTo(x, y); c.arc(x, y, r, start, start + span); c.closePath(); c.clip();
    mageArc(c, x, y, r - 2, start, tip, '#ffc174', fade * .75, 2.5);
    if (!reduced) mageArc(c, x, y, r * .86, start, tip, '#ff8e53', fade * .48, 2);
    const angle = start + span * (.18 + progress * .58);
    const reach = r * (.56 + .22 * open);
    mageSprite(c, id, x + Math.cos(angle) * reach, y + Math.sin(angle) * reach,
      r * (.38 + .20 * open), r * (.23 + .13 * open), .95 * fade, angle + Math.PI / 2);
    c.restore();
    return;
  }
  if (kind === 'meteor-drop') {
    const ground = lerp(f.r0, f.r1, k);
    mageArc(c, x, y, ground, 0, full, color, .43, 1);
    const drop = reduced ? 0 : 88 * (1 - k ** 2);
    mageSprite(c, id, x, y - drop, 25, 51, .58 + .36 * k, 0, .5, .94);
    return;
  }
  const radius = lerp(f.r0, f.r1, open);
  const opacity = (kind === 'steam' ? .70 : .84) * fade;
  mageArc(c, x, y, radius, 0, full, color, .68 * fade);
  if (kind === 'ward') {
    const tilt = color === '#bfe8ff' ? -Math.PI / 2 : color === '#fff27a' ? -Math.PI : Math.PI / 3;
    const size = radius * 2;
    mageSprite(c, id, x, y, size, size, .52 * fade, tilt + (reduced ? 0 : k * .3));
    mageArc(c, x, y, Math.max(1, radius - 3), -2.35, -.8, color, .84 * fade, 2.5);
  } else if (kind === 'meteor-hit') {
    const size = Math.min(radius, 24 + open * 24);
    mageSprite(c, id, x, y, size * .52, size, opacity, reduced ? 0 : k * .4, .5, .76);
    if (!reduced) {
      for (let i = 0; i < 5; i++) {
        const a = i * full / 5 + .42;
        mageSprite(c, id, x + Math.cos(a) * radius * .68, y + Math.sin(a) * radius * .68,
          5 + fade * 4, 11 + fade * 5, opacity * .72, a - Math.PI / 2);
      }
    }
  } else if (kind === 'steam' || kind === 'chill') {
    const size = radius * (kind === 'steam' ? 1.50 : .95);
    mageSprite(c, id, x, y, size, size * .91, opacity, reduced ? 0 : -.18 * k);
    if (!reduced && kind === 'steam') {
      mageSprite(c, id, x, y - radius * .15, size * .66, size * .65, opacity * .30, .2);
    }
  } else {
    const size = Math.min(radius * 1.35, 22 + 22 * open);
    const filter = kind === 'spirit' ? mageSpiritFilter(color) : 'none';
    const angle = f.mageAngle ?? 0;
    mageSprite(c, id, x, y, size, size * (kind === 'fireball' ? .6 : .9), opacity,
      angle + (reduced ? 0 : k * (kind === 'bounce' ? 3 : .3)), .5, .5, filter);
    if (!reduced && kind === 'bounce') {
      const tail = radius * .65;
      vfxLine(c, [[x - Math.cos(angle) * tail, y - Math.sin(angle) * tail], [x, y]],
        2.5, '#ffd286', fade * .65);
    }
  }
}

function mageSpiritFilter(color) {
  return color === '#bfe8ff' ? 'hue-rotate(155deg)' :
    color === '#ff9a4a' ? 'saturate(1.4) hue-rotate(-18deg)' : 'none';
}

function drawMageProjectiles(c, inView, reduced) {
  for (const pr of G.proj) {
    const id = mageProjectileArt(pr);
    if (pr.dead || !mageArtReady(id) || !inView(pr.x, pr.y, pr.r + 40)) continue;
    const a = Math.atan2(pr.vy, pr.vx), r = pr.r;
    const spin = id === 'ricochet-fireball', spirit = id === 'elemental-spirit';
    const spear = id === 'flame-spear';
    const k = reduced ? 1 : clamp(pr.t / .07, 0, 1);
    const w = r * (spin ? 2 : spirit ? 2.4 : spear ? 6 : 3.7);
    const h = r * (spin ? 2 : spirit ? 1.8 : spear ? 1.3 : 2);
    const anchor = spin ? .5 : spirit ? .64 : spear ? .85 : .73;
    const twist = reduced ? 0 : spin ? pr.t * 20 : spirit ? Math.sin(pr.t * 22 + pr.ang) * .22 : 0;
    const tail = reduced ? 0 : Math.min(23, Math.hypot(pr.vx, pr.vy) * Math.min(pr.t, .05));
    if (tail > 0) vfxLine(c, [[pr.x - Math.cos(a) * tail, pr.y - Math.sin(a) * tail], [pr.x, pr.y]],
      spear ? 1.7 : 2.5, pr.mageElement || '#ffb268', .52);
    mageSprite(c, id, pr.x, pr.y, w * (.78 + .22 * k), h * (.84 + .16 * k),
      .72 + .28 * k, a + twist, anchor, .5, spirit ? mageSpiritFilter(pr.mageElement) : 'none');
  }
}

function drawMageArtWorld(c, inView) {
  const reduced = VFX.reduced.matches;
  c.save(); c.imageSmoothingEnabled = true;
  for (const pool of G.pools) {
    if (!mageUsesPoolArt(pool) || !inView(pool.x, pool.y, pool.r)) continue;
    const fade = clamp(1 - pool.t / pool.dur, 0, 1);
    mageArc(c, pool.x, pool.y, pool.r, 0, Math.PI * 2, '#ffb05d', fade * .55);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5 + .24;
      const pulse = reduced ? .5 : .5 + .5 * Math.sin(pool.t * 12 + i * 2.4);
      const r = pool.r * (.32 + .25 * (i % 2));
      mageSprite(c, 'base-fireball', pool.x + Math.cos(a) * r, pool.y + Math.sin(a) * r,
        13 + pulse * 9, 7 + pulse * 5, fade * (.26 + pulse * .28), a - Math.PI / 2);
    }
  }
  for (const f of G.fx) {
    if (mageArtReady(f.mageArt) && f.t < f.dur && inView(f.x, f.y, Math.max(f.r0, f.r1) + 45)) {
      drawMageEffect(c, f, reduced);
    }
  }
  for (const trap of G.f44?.traps || []) {
    if (trap.dead || !mageUsesTrapArt(trap) || !inView(trap.x, trap.y, trap.r)) continue;
    const armed = clamp(trap.t / trap.arm, 0, 1);
    const size = trap.r * (1.35 + .65 * armed);
    const light = reduced ? 0 : Math.sin(trap.t * 9) * .10 * armed;
    mageSprite(c, 'fire-rune', trap.x, trap.y, size, size * .81, .53 + .35 * armed + light);
    if (armed < 1) mageArc(c, trap.x, trap.y, trap.r - 1, -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * armed, '#ffcf8d', .73);
  }
  for (const line of G.f44?.lines || []) {
    if (!mageUsesLineArt(line) || !inView(line.x, line.y, line.L)) continue;
    const fade = clamp(1 - line.t / line.dur, 0, 1);
    const open = reduced ? 1 : .35 + .65 * Math.min(1, line.t / .07);
    const height = line.wd * 2 * open * (.78 + .22 * fade);
    mageSprite(c, 'flame-beam', line.x, line.y, line.L, height, Math.min(.90, .26 + fade),
      line.a, 0);
    if (mageArtReady('base-fireball')) {
      const x = line.x + Math.cos(line.a) * line.L, y = line.y + Math.sin(line.a) * line.L;
      mageSprite(c, 'base-fireball', x, y, 16 + 11 * open, 10 + 4 * open,
        fade * .87, line.a, .78);
    }
  }
  drawMageProjectiles(c, inView, reduced);
  c.restore();
}
