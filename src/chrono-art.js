/* G44-6 — Draw at existing world coordinates before enemy warnings and units. */
const CHRONO_IMAGES = Object.create(null);
const CHRONO_CUES = new WeakMap();
const CHRONO_BASE_FIRES = new WeakMap();
const CHRONO_PROJECTILES = {
  fu_chrono_arrow: 'stasis-arrow',
  fu_chrono_shuriken: 'rewind-star',
  fu_chrono_orb: 'pendulum-orb',
};
for (const [id, data] of Object.entries(CHRONO_ART_DATA)) {
  const image = new Image();
  image.onload = () => { CHRONO_IMAGES[id] = image; };
  image.src = data;
}
function chronoArtReady(id) { return !!CHRONO_IMAGES[id]?.naturalWidth; }
function chronoUsesProjectileArt(pr) { return chronoArtReady(CHRONO_PROJECTILES[pr.src]); }
function chronoUsesTrapArt(trap) { return trap.tag === 'fu_chrono_trap' && chronoArtReady('time-rift'); }
function chronoUsesLineArt(line) { return line.src === 'fu_chrono_beam' && chronoArtReady('time-needle'); }

function chronoCue(id, kind, dur, x, y, r, a = 0) {
  if (!chronoArtReady(id)) return;
  const cues = (CHRONO_CUES.get(G) || []).filter(cue => cue.end > G.time);
  if (cues.length < 48) cues.push({ id, kind, dur, end: G.time + dur, x, y, r, a });
  CHRONO_CUES.set(G, cues);
}

function chronoSprite(c, id, x, y, size, alpha, angle = 0, anchor = .5, height) {
  if (alpha <= 0 || size <= 0) return;
  const image = CHRONO_IMAGES[id];
  const scale = size / Math.max(image.naturalWidth, image.naturalHeight);
  const w = image.naturalWidth * scale, h = height ?? image.naturalHeight * scale;
  c.save(); c.translate(x, y); c.rotate(angle); c.globalAlpha = alpha;
  c.drawImage(image, -w * anchor, -h / 2, w, h);
  c.restore();
}

function chronoArc(c, x, y, radius, a, span, width, color, alpha) {
  if (radius <= 0 || span <= 0 || alpha <= 0) return;
  c.save(); c.globalAlpha = alpha; c.strokeStyle = color; c.lineWidth = width;
  c.lineCap = 'round'; c.beginPath(); c.arc(x, y, radius, a, a + span); c.stroke(); c.restore();
}

function chronoIceRing(c, x, y, r, alpha, a = 0) {
  // Expand the transparent drawing in world space. The thin rim indicates the exact radius.
  chronoSprite(c, 'base-ice-ring', x, y, r * 2, alpha, a, .5, r * 2);
  effectBoundary(c, x, y, r, '#d4eaff', alpha * .8);
}

function drawChronoCues(c, inView, reduced) {
  for (const cue of CHRONO_CUES.get(G) || []) {
    if (cue.end <= G.time || !chronoArtReady(cue.id)) continue;
    const blade = cue.kind === 'blade';
    const { x, y } = blade ? G.p : cue;
    const { r, a } = cue;
    if (!inView(x, y, r + 30)) continue;
    const k = clamp(1 - (cue.end - G.time) / cue.dur, 0, 1);
    if (blade) {
      const edge = angTo(x, y, r + 20) - .80;
      chronoSprite(c, cue.id, x + Math.cos(edge) * r * .80, y + Math.sin(edge) * r * .80,
        Math.min(47, r * .38), .44 + .32 * k, edge + Math.PI / 2);
    } else if (cue.kind === 'collapse') {
      const drop = reduced ? 0 : 20 * (1 - k ** 6);
      chronoArc(c, x, y, 12, -Math.PI / 2, Math.PI * 2 * k, 1.5, '#b9a4ec', .48);
      chronoSprite(c, cue.id, x, y - 10 - drop, 18 + 7 * k, .50 + .28 * k);
    } else if (!reduced) {
      const size = 11 + 13 * k;
      chronoSprite(c, cue.id, x, y, size, .6 * (1 - k), a + k * 2);
    }
  }
}

function drawChronoEffect(c, f, reduced) {
  const { chronoArt: id, chronoKind: kind } = f;
  const x = f.chronoTarget?.x ?? f.x, y = f.chronoTarget?.y ?? f.y;
  const k = clamp(f.t / f.dur, 0, 1), fade = 1 - k;
  if (kind === 'arrow') {
    chronoSprite(c, id, x, y, 29, Math.min(1, .65 + k), f.chronoAngle);
  } else if (kind === 'timer') {
    chronoSprite(c, id, x, y - 16, 22 + 3 * k, .88, reduced ? 0 : Math.sin(k * 16) * k * .18);
    chronoArc(c, x, y - 16, 13, -Math.PI / 2, Math.PI * 2 * fade, 1.5, '#ffd18f', .72);
  } else if (kind === 'cleave') {
    const start = f.chronoAngle - f.chronoArc / 2;
    const tip = f.chronoArc * Math.min(1, k * 2.3);
    const a = start + tip;
    const r = f.r1;
    chronoArc(c, x, y, r - 2, start, tip, 2, '#cbdcff', .85 * fade);
    if (!reduced) chronoArc(c, x, y, r * .85, start, tip, 3, '#bca1ed', .55 * fade);
    chronoSprite(c, id, x + Math.cos(a) * r * .80, y + Math.sin(a) * r * .80,
      Math.min(53, r * .45), .98 * fade, a + Math.PI / 2);
  } else if (kind === 'backflow') {
    const radius = lerp(f.r0, f.r1, 1 - fade ** 3);
    chronoArc(c, x, y, radius, 0, Math.PI * 2, 1.9, '#cab4ff', .72 * fade);
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + i * Math.PI / 2;
      const rr = Math.max(0, radius - 12);
      chronoSprite(c, id, x + Math.cos(a) * rr, y + Math.sin(a) * rr, 26,
        .90 * fade, a - Math.PI / 2 - (reduced ? 0 : k * 1.3));
    }
  } else if (kind === 'ice') {
    chronoIceRing(c, x, y, lerp(f.r0, f.r1, 1 - fade ** 2), .46 * fade, reduced ? 0 : k * .20);
  } else {
    const radius = lerp(f.r0, f.r1, 1 - fade ** 2);
    chronoArc(c, x, y, radius, 0, Math.PI * 2, 1.6, f.color, .74 * fade);
    if (!reduced) chronoArc(c, x, y, radius * .78, .4, 4.2, 2, '#d4c0ff', .42 * fade);
    chronoSprite(c, id, x, y, 31 - k * 14, .85 * fade, kind === 'burst' && !reduced ? k * 2 : 0);
  }
}

function drawChronoProjectiles(c, inView, reduced) {
  for (const pr of G.proj) {
    if (pr.dead || !chronoUsesProjectileArt(pr) || !inView(pr.x, pr.y, pr.r + 28)) continue;
    const id = CHRONO_PROJECTILES[pr.src], a = Math.atan2(pr.vy, pr.vx);
    const star = id === 'rewind-star', orb = id === 'pendulum-orb';
    const rewind = star && !pr.bounce;
    const angle = star ? (reduced ? a : a + pr.t * (rewind ? -19 : 19)) :
      orb ? (reduced ? 0 : Math.sin(pr.t * 11 + pr.ang) * .30) : a;
    // The arrow shaft trails its collision circle. Round sprites fit within their collision diameter.
    const size = star || orb ? pr.r * 2 : pr.r * 4.8;
    const anchor = star || orb ? .5 : .80;
    if (!reduced) {
      const trail = Math.min(21, pr.t * Math.hypot(pr.vx, pr.vy));
      const tx = pr.x - Math.cos(a) * trail, ty = pr.y - Math.sin(a) * trail;
      if (trail > 0) vfxLine(c, [[tx, ty], [pr.x, pr.y]], 2, rewind ? '#a88aef' : '#c4defc', .48);
      if (rewind) chronoSprite(c, id, tx, ty, size * .69, .35, angle + .8);
    }
    chronoSprite(c, id, pr.x, pr.y, size, 1, angle, anchor);
  }
}

function drawChronoArtWorld(c, inView) {
  const reduced = VFX.reduced.matches;
  c.save(); c.imageSmoothingEnabled = true;
  drawChronoCues(c, inView, reduced);
  for (const f of G.fx) {
    if (!chronoArtReady(f.chronoArt) || f.t >= f.dur) continue;
    const x = f.chronoTarget?.x ?? f.x, y = f.chronoTarget?.y ?? f.y;
    if (inView(x, y, (f.r1 || f.r || 0) + 30)) drawChronoEffect(c, f, reduced);
  }
  for (const trap of G.f44?.traps || []) {
    if (trap.dead || !chronoUsesTrapArt(trap) || !inView(trap.x, trap.y, trap.R)) continue;
    const armed = clamp(trap.t / trap.arm, 0, 1);
    chronoSprite(c, 'time-rift', trap.x, trap.y, trap.r * (1 + armed), .45 + .45 * armed);
  }
  for (const line of G.f44?.lines || []) {
    if (!chronoUsesLineArt(line) || !inView(line.x, line.y, line.L)) continue;
    const alpha = Math.min(.90, (1 - line.t / line.dur) * 3);
    c.save(); c.translate(line.x, line.y); c.rotate(line.a);
    c.globalAlpha = alpha;
    c.drawImage(CHRONO_IMAGES['time-needle'], -line.wd, -line.wd, line.L + line.wd, line.wd * 2);
    c.restore();
    if (!reduced) chronoArc(c, line.x, line.y, line.L - 1, line.a - .34, .34, 1.3, '#c8b0ff', .44 * alpha);
  }
  drawChronoProjectiles(c, inView, reduced);
  c.restore();
}
