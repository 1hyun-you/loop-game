/* G44-9. Sprites follow the original centers, distances and lifetimes. */
const PRIEST_IMAGES = {};
for (const [id, src] of Object.entries(PRIEST_ART_DATA)) {
  const image = new Image();
  image.onload = () => { PRIEST_IMAGES[id] = image; };
  image.src = src;
}

const PRIEST_IMPACT_ART = {
  fu_priest_shield: 'ward', fu_priest_slam: 'fall', fu_priest_trap: 'sign',
  fu_priest_fireball: 'fire', fu_priest_icering: 'halo',
};
const PRIEST_PROJECTILE_ART = {
  fu_priest_arrow: 'arrow', fu_priest_shield: 'ward', fu_priest_trap: 'sign',
  fu_priest_shuriken: 'pilgrim', fu_priest_fireball: 'fire',
};
const priestArtReady = id => !!PRIEST_IMAGES[id]?.naturalWidth;
const priestProjectileArt = pr => pr.priestBase ? 'orb' : PRIEST_PROJECTILE_ART[pr.src];
const priestUsesProjectileArt = pr => priestArtReady(priestProjectileArt(pr));
const priestUsesLineArt = line => line.src === 'fu_priest_beam' && line.L > 0 && priestArtReady('beam');
const priestUsesTrapArt = trap => trap.tag === 'fu_priest_trap' && priestArtReady('sign');
const priestProjectileEchoes = new WeakMap();
function priestProjectileEcho(pr, id) {
  if (!priestArtReady(id)) return;
  const points = (priestProjectileEchoes.get(G) || []).filter(p => G.time - p.at < p.duration);
  points.push({
    id, x: pr.x, y: pr.y, angle: Math.atan2(pr.vy, pr.vx), at: G.time,
    duration: id === 'arrow' ? .14 : .24,
  });
  priestProjectileEchoes.set(G, points.slice(-24));
}

const priestClamp = t => Math.max(0, Math.min(1, t));
function priestStamp(c, id, x, y, angle, w, h, alpha, anchorX = .5, anchorY = .5) {
  if (!priestArtReady(id) || alpha <= 0) return;
  c.save();
  c.translate(x, y); c.rotate(angle); c.globalAlpha = priestClamp(alpha);
  c.drawImage(PRIEST_IMAGES[id], -w * anchorX, -h * anchorY, w, h);
  c.restore();
}
function priestArc(c, x, y, radius, a0, a1, color, width, alpha) {
  c.save();
  c.strokeStyle = color; c.lineWidth = width; c.globalAlpha = priestClamp(alpha);
  c.beginPath(); c.arc(x, y, radius, a0, a1); c.stroke();
  c.restore();
}
function drawPriestImpact(c, f, reduced) {
  const id = f.priestArt, { x, y } = f;
  const t = priestClamp(f.t / f.dur), fade = 1 - t;
  if (id === 'sword') {
    const a = f.priestAngle, arc = f.priestArc;
    const start = a - arc / 2;
    const swing = reduced ? a : start + arc * priestClamp((t - .12) / .58);
    const drawLength = f.r1 * (.48 + .52 * priestClamp(t / .34));
    const anchor = .33;
    const grip = drawLength * anchor;
    if (!reduced && swing > start) {
      priestArc(c, x, y, f.r1 * .91, Math.max(start, swing - .8), swing, '#fff3ac', 5, .62 * fade);
      priestArc(c, x, y, f.r1 * .91, Math.max(start, swing - .58), swing, '#fffdf3', 1.5, .86 * fade);
    }
    priestStamp(c, id, x + Math.cos(swing) * grip, y + Math.sin(swing) * grip,
      swing, drawLength, drawLength * .34, .2 + .8 * fade, anchor);
    return;
  }
  if (f.priestDescent) {
    const descend = reduced ? .85 : priestClamp((t - .18) / .82);
    const height = Math.min(96, f.r0 * 1.15) * (1 - descend ** 2);
    const size = 32 + 14 * descend;
    priestArc(c, x, y, f.r1 + (f.r0 - f.r1) * fade, 0, Math.PI * 2, '#f9d983', 1.4, .38 + .34 * descend);
    priestStamp(c, id, x, y - height, 0, size * .52, size, .65 + .35 * descend, .5, .97);
    return;
  }

  if (f.priestBlessing) {
    const size = f.r * (1.3 + .7 * t);
    priestStamp(c, id, x, y, 0, size, size, .9 * fade);
    return;
  }
  const radius = f.r0 + (f.r1 - f.r0) * (1 - fade ** 2);
  if (id === 'halo') {
    c.save();
    c.beginPath(); c.arc(x, y, radius, 0, Math.PI * 2); c.clip();
    priestStamp(c, id, x, y, reduced ? 0 : t * .58, radius * 2, radius * 2, .72 * fade + .14);
    c.restore();
    return;
  }
  if (id === 'ward') {
    for (let i = 0; i < 4; i++) {
      const a = Math.PI * .25 + i * Math.PI / 2;
      const size = Math.min(27, radius * .62);
      const travel = radius - size * .72;
      priestStamp(c, id, x + Math.cos(a) * travel, y + Math.sin(a) * travel,
        a + Math.PI / 2, size * .83, size, .97 * fade);
    }
  } else {
    const size = (id === 'fire' ? 1.72 : 1.25) * radius;
    const squash = id === 'fall' ? 1 - .28 * t : 1;
    priestStamp(c, id, x, y, id === 'fire' && !reduced ? .55 * t : 0,
      size * (id === 'fall' ? .52 : 1), size * squash, .8 * fade);
  }
  priestArc(c, x, y, radius * .97, 0, Math.PI * 2, '#f9d983', 1.5, .54 * fade);
}
function drawPriestProjectile(c, pr, reduced) {
  const id = priestProjectileArt(pr), r = pr.r, t = pr.t;
  const a = Math.atan2(pr.vy, pr.vx);
  const alpha = Math.min(1, .66 + t * 11);
  if (id === 'arrow') {
    const w = 4.7 * r, back = Math.min(28, t * Math.hypot(pr.vx, pr.vy));
    if (!reduced && back > 4) {
      priestStamp(c, id, pr.x - Math.cos(a) * back, pr.y - Math.sin(a) * back,
        a, w, r * 1.25, .24, .78);
    }
    priestStamp(c, id, pr.x, pr.y, a, w, r * 1.65, alpha, .76);
    return;
  }
  const size = r * 2;
  const spin = reduced ? 0 : t * 11;
  const angle = id === 'pilgrim' ? spin : id === 'fire' ? a - Math.PI * .72 : id === 'sign' ? spin * .48 : 0;
  if (id === 'fire' && !reduced) {
    const back = Math.min(r * 1.25, t * Math.hypot(pr.vx, pr.vy));
    priestStamp(c, id, pr.x - Math.cos(a) * back, pr.y - Math.sin(a) * back, angle, size, size, .32);
  }
  priestStamp(c, id, pr.x, pr.y, angle, id === 'ward' ? size * .84 : size, size, alpha);
}
function drawPriestBeam(c, line, reduced) {
  const t = priestClamp(line.t / line.dur);
  const reach = reduced ? line.L : line.L * priestClamp(.18 + t * 10);
  const width = line.wd * (.32 + .60 * priestClamp(t * 12)) * (1 - .62 * priestClamp((t - .70) / .30));
  c.save();
  c.translate(line.x, line.y); c.rotate(line.a);
  c.globalAlpha = .85 - .48 * t;
  if (reach < line.L) {
    c.fillStyle = '#fff5bd'; c.fillRect(0, -.75, line.L, 1.5);
  }
  c.beginPath(); c.rect(0, -width, reach, 2 * width); c.clip();
  c.drawImage(PRIEST_IMAGES.beam, 0, -width, line.L, 2 * width);
  c.restore();
  priestStamp(c, 'orb', line.x, line.y, 0, width * 2.6, width * 2.6, .72 * (1 - t));
}
function drawPriestArtWorld(c, inView) {
  const state = G.f44;
  if (G.p.job !== 'priest' && !state) return;
  const reduced = VFX.reduced.matches;
  c.save(); c.imageSmoothingEnabled = true;
  for (const trap of state?.traps || []) {
    if (trap.dead || !priestUsesTrapArt(trap) || !inView(trap.x, trap.y, 24)) continue;
    const ready = priestClamp(trap.t / trap.arm);
    const pulse = reduced ? 1 : .94 + .06 * Math.sin(trap.t * 7);
    const size = trap.r * 2 * (.5 + .5 * ready) * pulse;
    priestStamp(c, 'sign', trap.x, trap.y, (1 - ready) * .5, size, size, .55 + .35 * ready);
  }
  for (const f of G.fx) {
    if (priestArtReady(f.priestArt) && inView(f.x, f.y, (f.r1 || f.r) + 96)) drawPriestImpact(c, f, reduced);
  }
  for (const line of state?.lines || []) if (priestUsesLineArt(line)) drawPriestBeam(c, line, reduced);
  for (const point of priestProjectileEchoes.get(G) || []) {
    const t = (G.time - point.at) / point.duration;
    if (t >= 1 || !inView(point.x, point.y, 20)) continue;
    const fade = .74 * (1 - t);
    const size = 11 + 10 * t;
    if (point.id === 'arrow') {
      priestStamp(c, 'arrow', point.x, point.y, point.angle, 25, 7 * (1 - t * .65), fade, .83);
    } else {
      priestStamp(c, point.id, point.x, point.y, point.angle + (reduced ? 0 : t * 1.8), size, size, fade);
    }
  }
  for (const pr of G.proj) {
    if (!pr.dead && !basicWeaponProjectile(pr) && priestUsesProjectileArt(pr) && inView(pr.x, pr.y, pr.r + 30)) drawPriestProjectile(c, pr, reduced);
  }
  if (G.p.job === 'priest' && G.f43 && fusedWs().length && priestArtReady('orb') &&
      !G.fx.some(f => f.priestArt === 'sword' && f.t < .12 && priestArtReady('sword'))) {
    const q = relicPos();
    priestStamp(c, 'orb', q.x, q.y, 0, 17, 18, .97);
  }
  c.restore();
}
