/* Fusion selection animation. Visual state lives outside the game and save data. */
const FUSE_ART = { duration: 0.9, runs: new WeakMap(), images: {} };
for (const [job, source] of Object.entries(FUSE_ART_DATA)) {
  const image = new Image();
  image.onload = () => { FUSE_ART.images[job] = image; };
  image.onerror = () => { delete FUSE_ART.images[job]; };
  image.src = source;
}

function startFuseArt(job, weapon) {
  const image = FUSE_ART.images[job];
  if (!weapon || !image || !image.complete || !image.naturalWidth) return false;
  let run = FUSE_ART.runs.get(G);
  if (!run) {
    run = { slots: new WeakMap(), latest: null };
    FUSE_ART.runs.set(G, run);
  }
  const moment = { job, weapon, image, time: G.time };
  if (job === 'summoner') {
    // Reuse the legacy four spirits' scatter so selection consumes the same random draws.
    moment.spirits = Array.from({ length: 4 }, () => [rand(-60, 60), rand(-60, 60)]);
  }
  run.latest = moment;
  run.slots.set(weapon, moment);
  return true;
}

function fuseArtProgress(moment) {
  return moment ? (G.time - moment.time) / FUSE_ART.duration : 1;
}
function fuseArtForSlot(weapon) {
  return FUSE_ART.runs.get(G)?.slots.get(weapon);
}
function fuseArtEase(t, start, end) {
  const k = clamp((t - start) / (end - start), 0, 1);
  return k * k * (3 - 2 * k);
}
function fuseArtImage(c, image, x, y, size, angle = 0, opacity = 1, cell = -1, sx = 1, sy = 1) {
  if (opacity <= 0 || size <= 0) return;
  c.save();
  c.translate(x, y); c.rotate(angle); c.scale(sx, sy);
  c.globalAlpha *= opacity;
  const half = size / 2;
  if (cell < 0) c.drawImage(image, -half, -half, size, size);
  else c.drawImage(image, (cell % 2) * 128, (cell >> 1) * 128, 128, 128, -half, -half, size, size);
  c.restore();
}
function fuseArtGlint(c, x, y, size, color, opacity) {
  if (opacity <= 0) return;
  c.save(); c.translate(x, y); c.globalAlpha *= opacity;
  c.fillStyle = color; c.beginPath();
  c.moveTo(0, -size); c.lineTo(size * .22, -size * .22); c.lineTo(size * .72, 0);
  c.lineTo(size * .22, size * .22); c.lineTo(0, size); c.lineTo(-size * .22, size * .22);
  c.lineTo(-size * .72, 0); c.lineTo(-size * .22, -size * .22); c.closePath(); c.fill(); c.restore();
}
function fuseArtFlag(c, image, t, rise) {
  const width = 80, bands = 8, step = width / bands;
  for (let i = 0; i < bands; i++) {
    const x = i * step, swing = Math.sin(t * 30 - i * .72) * Math.max(0, i - 1) * .94;
    c.drawImage(image, i * 16, 0, 16, 128, x - width / 2, -41 + swing - 25 * (1 - rise), step, width);
  }
}
function drawFuseArtMotif(c, moment, t, slot) {
  const { job, image, weapon } = moment;
  const prep = fuseArtEase(t, 0, .28), lock = fuseArtEase(t, .3, .6), fade = 1 - fuseArtEase(t, .69, 1);
  const flash = fuseArtEase(t, .42, .55) * (1 - fuseArtEase(t, .56, .77));
  const sprite = (x, y, s, a, alpha, cell, sx, sy) => fuseArtImage(c, image, x, y, s, a, alpha, cell, sx, sy);
  c.globalAlpha *= fuseArtEase(t, 0, .11) * fade;
  if (job === 'warrior') {
    const drop = fuseArtEase(t, .28, .46), y = -9 - 23 * prep + 51 * drop;
    sprite(0, y, 75, -.37 * prep * (1 - drop), .78 + .22 * drop);
    const scatter = fuseArtEase(t, .44, .86);
    for (const x of [-1, 1]) for (const i of [0, 1, 2]) {
      fuseArtGlint(c, x * (9 + (14 + i * 7) * scatter), 44 - (10 + i * 8) * scatter,
        3 + i * .7, i === 1 ? '#fff1ac' : '#ff983f', drop * (1 - scatter));
    }
  } else if (job === 'rogue') {
    const spread = 32 * prep * (1 - lock);
    sprite(-spread, -spread * .22, 62 - prep * 15, -spread * .013, .78);
    sprite(spread, spread * .14, 62 - prep * 15, spread * .013, .72 * prep * (1 - lock), -1, -1);
    fuseArtGlint(c, 2, -2, 12, '#83ead5', flash);
  } else if (job === 'sovereign') {
    fuseArtFlag(c, image, t, prep);
    const seal = UI_ART.images.crest_sovereign, stamp = fuseArtEase(t, .49, .63);
    if (seal) fuseArtImage(c, seal, 4, 8, 47 - 19 * stamp, 0, stamp);
  } else if (job === 'archer') {
    const release = fuseArtEase(t, .3, .67), travel = 36 * release - 15 * prep;
    sprite(travel, -travel * .52, 73, -.22 * (1 - prep), .95);
    if (!slot) sprite(travel - 12, -travel * .52 + 7, 70, 0, .28 * release * (1 - lock));
    fuseArtGlint(c, travel + 23, -travel * .52 - 22, 11, '#faffb5', flash);
  } else if (job === 'engineer') {
    const spread = 35 - 19 * lock, rotation = (prep + lock) * .86;
    sprite(-spread, -4, 49, rotation);
    sprite(spread, 4, 39, -rotation - .18);
    fuseArtGlint(c, 2, 0, 9, '#ffe2a4', flash);
  } else if (job === 'chrono') {
    const settle = fuseArtEase(t, .17, .61), open = .12 + .88 * prep;
    c.save(); c.scale(1, open);
    sprite(0, 0, 80, -.35 * (1 - prep));
    c.save(); c.translate(1, -1); c.rotate(-2.8 + settle * Math.PI * 2);
    c.strokeStyle = '#e2d6ff'; c.lineWidth = 1.9; c.beginPath(); c.moveTo(-5, 0); c.lineTo(22, 0); c.stroke(); c.restore();
    c.restore();
    fuseArtGlint(c, 1, -1, 11, '#e8dcff', flash);
  } else if (job === 'mage' || job === 'summoner') {
    const spectral = job === 'summoner', radius = (spectral ? 34 : 29) * (1 - lock);
    for (let i = 0; i < 4; i++) {
      const scatter = spectral ? moment.spirits[i] : [0, 0];
      const a = i * Math.PI / 2 + t * (spectral ? 10 : 8) + scatter[0] * .006;
      const x = Math.cos(a) * radius, y = Math.sin(a) * radius * .68 + scatter[1] * .07 * (1 - lock);
      sprite(x, y, (spectral ? 43 : 34) * (1 - lock * .7), spectral ? a + Math.PI / 2 : a * .12,
        1 - lock, spectral ? -1 : i);
    }
    const icon = iconCanvas(weapon.id, 2);
    if (icon) fuseArtImage(c, icon, 0, 0, 48, 0, lock * (slot ? .65 : 1));
    fuseArtGlint(c, 0, 0, 17, spectral ? '#e4d0ff' : '#fff1dc', flash);
  } else if (job === 'priest') {
    const descend = fuseArtEase(t, .04, .42), narrow = 1 - fuseArtEase(t, .42, .66);
    if (!slot && narrow > 0) {
      c.save(); c.globalAlpha *= .62 * narrow; c.fillStyle = '#ffefbd';
      c.beginPath(); c.moveTo(-14, -64); c.lineTo(11, -64);
      c.lineTo(4, -64 + descend * 85); c.lineTo(-5, -64 + descend * 85); c.closePath(); c.fill(); c.restore();
    }
    sprite(0, 10 - 14 * lock, 72, 0, descend);
    fuseArtGlint(c, 1, -18, 12, '#fff5d0', flash);
  } else if (job === 'druid') {
    const grow = fuseArtEase(t, .03, .51), icon = iconCanvas(weapon.id, 2);
    if (icon) fuseArtImage(c, icon, 0, 0, 43, 0, .85 * lock);
    c.save(); c.beginPath(); c.rect(-55, 36 - grow * 82, 110, grow * 82); c.clip();
    sprite(0, 0, 84, Math.sin(t * 16) * .08, .97, -1, 1 - lock * .17); c.restore();
    for (const x of [-1, 1]) fuseArtGlint(c, x * (23 + 14 * lock), -16 - lock * 17, 6, '#c7f48e', flash);
  }
}
function drawFuseArtWorld(c) {
  const moment = FUSE_ART.runs.get(G)?.latest, t = fuseArtProgress(moment);
  if (t < 0 || t >= 1 || VFX.reduced.matches || STATE.mode === 'title') return;
  const p = G.p, scale = Math.min(.73, .96 / VIEW.zoom);
  const beside = moment.job === 'warrior' || moment.job === 'sovereign';
  c.save(); c.imageSmoothingEnabled = true;
  c.translate(p.x + (beside ? 27 : 0), p.y - 37);
  c.scale(scale, scale); c.globalAlpha *= .86;
  drawFuseArtMotif(c, moment, t, false);
  c.restore();
}
function drawFuseArtSlot(c, r, moment, t) {
  if (!moment || t < 0 || t >= 1) return;
  const reduced = VFX.reduced.matches;
  c.save(); uiRound(c, r.x + 1, r.y + 1, r.w - 2, r.h - 2, 4); c.clip();
  // Keep the level badge legible throughout the transition.
  c.beginPath(); c.moveTo(r.x, r.y); c.lineTo(r.x + r.w, r.y);
  c.lineTo(r.x + r.w, r.y + r.h - 11); c.lineTo(r.x + r.w - 11, r.y + r.h - 11);
  c.lineTo(r.x + r.w - 11, r.y + r.h); c.lineTo(r.x, r.y + r.h); c.closePath(); c.clip();
  c.save(); c.fillStyle = JOB_COL[moment.job];
  c.globalAlpha *= reduced ? .16 : .28 * (1 - fuseArtEase(t, .6, 1));
  c.fillRect(r.x, r.y, r.w, r.h);
  c.restore();
  if (!reduced) {
    c.translate(r.x + (r.w - 3) / 2, r.y + (r.h - 5) / 2);
    c.scale(r.w / 100, r.w / 100);
    drawFuseArtMotif(c, moment, t, true);
  }
  c.restore();
}
