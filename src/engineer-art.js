/* G44-5. All animation timing comes from the simulation or its visual effects. */
const ENGINEER_IMAGES = Object.create(null);
const ENGINEER_TURRETS = new WeakMap();
const ENGINEER_TRAP_ART = {
  fu_engineer_cleave: 'rotary-blades',
  fu_engineer_shield: 'repulsion-plate',
  fu_engineer_slam: 'crush-mine',
  fu_engineer_arrow: 'crossbow-turret',
  fu_engineer_shuriken: 'ricochet-saw',
  fu_engineer_fireball: 'incendiary-mine',
  fu_engineer_icering: 'cooling-trap',
  fu_engineer_orb: 'tracking-drone',
};
const ENGINEER_IMPACT_ART = {
  fu_engineer_shield: 'repulsion-plate',
  fu_engineer_slam: 'crush-mine',
  fu_engineer_fireball: 'incendiary-mine',
  fu_engineer_icering: 'cooling-trap',
};
for (const [id, data] of Object.entries(ENGINEER_ART_DATA)) {
  const image = new Image();
  image.onload = () => { ENGINEER_IMAGES[id] = image; };
  image.src = data;
}
function engineerArtReady(id) { return !!ENGINEER_IMAGES[id]?.naturalWidth; }
function engineerProjectileArt(pr) {
  if (pr.src === 'fu_engineer_shuriken') return 'ricochet-saw';
  if (pr.src === 'fu_engineer_orb') return 'tracking-drone';
}
function engineerUsesProjectileArt(pr) { return engineerArtReady(engineerProjectileArt(pr)); }
function engineerUsesTrapArt(trap) { return engineerArtReady(ENGINEER_TRAP_ART[trap.tag]); }
function engineerUsesNodeArt(node) { return node.src === 'fu_engineer_beam' && engineerArtReady('laser-pylon'); }
function engineerNodeLength(a, b) { return Math.sqrt(dist2(a.x, a.y, b.x, b.y)); }
function engineerNodesConnect(length) { return length > 4 && length < 240; }

function engineerStamp(c, id, x, y, size, alpha, angle = 0, squash = 1, anchor = .5) {
  const image = ENGINEER_IMAGES[id];
  if (!image || alpha <= 0) return;
  const scale = size / Math.max(image.naturalWidth, image.naturalHeight);
  const w = image.naturalWidth * scale, h = image.naturalHeight * scale * Math.abs(squash);
  c.save(); c.translate(x, y); c.rotate(angle); c.globalAlpha = alpha;
  if (squash < 0) c.scale(1, -1);
  c.drawImage(image, -w / 2, -h * anchor, w, h); c.restore();
}

function engineerTrapTrigger(trap) {
  const id = ENGINEER_TRAP_ART[trap.tag];
  if (!engineerArtReady(id)) return;
  const dur = id === 'rotary-blades' ? 1.5 : id === 'ricochet-saw' || id === 'tracking-drone' ? .22 : 0;
  if (dur) fx({ kind: 'engineer', engineerArt: id, x: trap.x, y: trap.y, dur });
}

function engineerSawBounce(pr, angle) {
  if (pr.dead || !engineerArtReady('ricochet-saw')) return;
  fx({ kind: 'engineer', engineerArt: 'ricochet-saw', x: pr.x, y: pr.y, dur: .15, angle, next: Math.atan2(pr.vy, pr.vx) });
}

function drawEngineerTrap(c, trap, reduced, base = false) {
  const id = base ? 'base-trap' : ENGINEER_TRAP_ART[trap.tag];
  const arm = reduced ? 1 : clamp(base ? 1 - trap.arm / .4 : trap.t / trap.arm, 0, 1);
  const shot = ENGINEER_TURRETS.get(trap), aim = shot?.angle || 0;
  const age = shot ? G.time - shot.time : Infinity;
  const recoil = reduced ? 0 : Math.max(0, 1 - age / .15);
  const x = trap.x - Math.cos(aim) * recoil * 4, y = trap.y - Math.sin(aim) * recoil * 4;
  const end = base ? 1 : clamp((trap.life - trap.t) / .35, 0, 1);
  const size = base ? trap.r * 2.45 : trap.every ? 34 : trap.r * 2.2;
  engineerStamp(c, id, x, y - (1 - arm) * 7, size, (.5 + .47 * arm) * end, aim, (.7 + .3 * arm) * (Math.cos(aim) < 0 ? -1 : 1));
  if (!reduced && recoil > 0) {
    const reach = 17 + (1 - recoil) * 9;
    vfxLine(c, [[trap.x + 11 * Math.cos(aim), trap.y + 11 * Math.sin(aim)], [trap.x + reach * Math.cos(aim), trap.y + reach * Math.sin(aim)]], 2, '#ffe7a2', recoil);
  }
}

function drawEngineerImpact(c, f, reduced) {
  const id = f.engineerArt, k = f.t / f.dur, fade = 1 - k;
  if (k >= 1) return;
  if (f.next !== undefined) {
    if (reduced) return;
    const point = (a, r) => [f.x + Math.cos(a) * r, f.y + Math.sin(a) * r];
    const path = [point(f.angle, -15), [f.x, f.y], point(f.next, 13)];
    vfxLine(c, path, 3.5, '#422738', .75 * fade);
    vfxLine(c, path, 1.3, '#ffdd8e', fade);
    return;
  }
  if (id === 'rotary-blades') {
    const speed = reduced ? 0 : (k * 15 - k ** 4 * 4) * Math.PI;
    engineerStamp(c, id, f.x, f.y, 38 + (reduced ? 0 : 9 * Math.sin(k * Math.PI)), Math.min(1, fade * 5), speed);
    return;
  }
  if (id === 'laser-pylon') {
    c.globalAlpha = fade * .55; c.strokeStyle = '#ffd482'; c.lineWidth = 1.5;
    c.beginPath(); c.ellipse(f.x, f.y, 4 + 16 * k, 3 + 7 * k, 0, 0, Math.PI * 2); c.stroke();
    return;
  }
  if (f.engineerPress) {
    engineerStamp(c, id, f.x, f.y - (reduced ? 0 : 23 * (1 - k ** 2)), 42, .95, 0, 1, .67);
    return;
  }
  const R = f.r1 || 0;
  const squash = reduced ? 1 : id === 'repulsion-plate' ? .68 + .47 * Math.sin(Math.PI * k) : 1 - .28 * k;
  const lift = !reduced && id === 'repulsion-plate' ? 10 * Math.sin(k * Math.PI) : 0;
  engineerStamp(c, id, f.x, f.y - lift, R ? 38 : 28, fade * .93, 0, squash);
  if (!R) return;
  const cold = id === 'cooling-trap', hot = id === 'incendiary-mine';
  const color = cold ? '#c3f3ff' : hot ? '#ffab60' : '#ffe3a1';
  const r = R * (reduced ? .91 : .3 + .7 * (1 - fade ** 2));
  const count = cold ? 8 : 6;
  c.strokeStyle = color; c.lineWidth = cold ? 2 : 1.5; c.globalAlpha = fade * .85;
  for (let i = 0; i < count; i++) {
    const a = (i + .35) * Math.PI * 2 / count;
    c.beginPath(); c.arc(f.x, f.y, r, a - .18, a + .18); c.stroke();
    const edge = Math.min(R, r + 6), inner = r * .81;
    c.beginPath(); c.moveTo(f.x + Math.cos(a - .06) * inner, f.y + Math.sin(a - .06) * inner);
    c.lineTo(f.x + Math.cos(a) * edge, f.y + Math.sin(a) * edge); c.stroke();
  }
}

function drawEngineerPool(c, pool, reduced) {
  const fade = clamp(1 - pool.t / pool.dur, 0, 1);
  c.save();
  c.beginPath(); c.arc(pool.x, pool.y, pool.r, 0, Math.PI * 2); c.clip();
  const glow = c.createRadialGradient(pool.x, pool.y, 0, pool.x, pool.y, pool.r);
  glow.addColorStop(0, '#f18c4a88'); glow.addColorStop(.7, '#8e4c2b66'); glow.addColorStop(1, '#47243c22');
  c.fillStyle = glow; c.globalAlpha = fade; c.fill();
  for (let i = 0; i < 6; i++) {
    const a = i * 2.4, r = pool.r * (.28 + .11 * i);
    const ember = reduced ? .64 : .55 + .35 * Math.cos(pool.t * 10 + i * 2.7);
    const x = pool.x + Math.cos(a) * r, y = pool.y + Math.sin(a) * r;
    vfxLine(c, [[x - 2, y + 2], [x, y - 3 * ember], [x + 2, y + 1]], 1.4, '#ffbc71', fade * ember);
  }
  c.restore();
}

function drawEngineerNodes(c, nodes, inView, reduced) {
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    if (!engineerUsesNodeArt(a)) continue;
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j], length = engineerNodeLength(a, b);
      if (!engineerUsesNodeArt(b) || !engineerNodesConnect(length) || !inView((a.x + b.x) / 2, (a.y + b.y) / 2, length / 2 + 14)) continue;
      const fade = clamp(Math.min(a.life - a.t, b.life - b.t) / .45, 0, 1);
      const pulse = reduced ? .74 : .69 + .18 * Math.cos(G.time * 24);
      const points = [[a.x, a.y], [b.x, b.y]];
      c.lineCap = 'butt';
      vfxLine(c, points, 12, '#723c4f', .30 * fade);
      vfxLine(c, points, 4, '#ffb04b', fade * pulse);
      vfxLine(c, points, 1.4, '#fff1bb', fade);
    }
  }
  for (const node of nodes) {
    if (!engineerUsesNodeArt(node) || !inView(node.x, node.y, 32)) continue;
    const fade = clamp((node.life - node.t) / .45, 0, 1);
    const install = reduced ? 1 : clamp(node.t / .22, 0, 1);
    engineerStamp(c, 'laser-pylon', node.x, node.y - (1 - install) * 7, 29, fade * (.65 + .35 * install), 0, .75 + .25 * install, .77);
  }
}

function drawEngineerArtWorld(c, inView) {
  const reduced = VFX.reduced.matches;
  c.save(); c.imageSmoothingEnabled = true; c.lineCap = 'round';
  for (const pool of G.pools) {
    if (pool.src === 'fu_engineer_fireball' && engineerArtReady('incendiary-mine') && inView(pool.x, pool.y, pool.r)) drawEngineerPool(c, pool, reduced);
  }
  drawEngineerNodes(c, G.f44?.nodes || [], inView, reduced);
  for (const trap of G.f44?.traps || []) {
    if (!trap.dead && engineerUsesTrapArt(trap) && inView(trap.x, trap.y, 36)) drawEngineerTrap(c, trap, reduced);
  }
  if (!installationArtReady('trap') && engineerArtReady('base-trap')) {
    for (const trap of G.traps) {
      if (!trap.dead && trap.engineerBase && !basicTrapImage(trap) && inView(trap.x, trap.y, 34)) drawEngineerTrap(c, trap, reduced, true);
    }
  }
  for (const f of G.fx) {
    if (!installationArtReady(f.installationArt) && engineerArtReady(f.engineerArt) && inView(f.x, f.y, Math.max(f.r1 || 0, 48))) drawEngineerImpact(c, f, reduced);
  }
  for (const pr of G.proj) {
    if (pr.dead || !inView(pr.x, pr.y, pr.r + 26)) continue;
    const id = engineerProjectileArt(pr);
    if (!engineerArtReady(id)) continue;
    const saw = id === 'ricochet-saw', heading = Math.atan2(pr.vy, pr.vx);
    const angle = saw ? (reduced ? 0 : pr.t * 31) : heading + Math.PI;
    const rotor = !saw && !reduced ? .9 + .1 * Math.cos(pr.t * 40) : 1;
    const facing = !saw && Math.cos(heading) > 0 ? -1 : 1;
    const size = pr.r * (saw ? 2.8 : 3.8);
    const fade = clamp(pr.life / .12, 0, 1);
    if (!reduced) {
      const trail = Math.min(15, Math.hypot(pr.vx, pr.vy) * pr.t);
      vfxLine(c, [[pr.x - Math.cos(heading) * trail, pr.y - Math.sin(heading) * trail], [pr.x, pr.y]], 1.5, saw ? '#ffe0a3' : '#91e5c4', fade * .55);
    }
    engineerStamp(c, id, pr.x, pr.y, size, fade, angle, rotor * facing);
  }
  c.restore();
}
