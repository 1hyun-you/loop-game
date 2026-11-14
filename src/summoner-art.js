/* G44-8. Sprite timing and positions follow the existing attacks. */
const SUMMONER_IMAGES = {};
for (const [id, src] of Object.entries(SUMMONER_ART_DATA)) {
  const img = new Image();
  img.onload = () => { SUMMONER_IMAGES[id] = img; };
  img.src = src;
}

const SUMMONER_IMPACT_ART = {
  fu_summoner_shield: 'ward', fu_summoner_slam: 'descent',
  fu_summoner_trap: 'grave', fu_summoner_fireball: 'will-o-wisp',
  fu_summoner_icering: 'frost',
};
const SUMMONER_PROJECTILE_ART = {
  fu_summoner_arrow: 'arrow', fu_summoner_shuriken: 'ricochet',
};
const SUMMONER_LINE_SOURCES = new Set([
  'fu_summoner_shield', 'fu_summoner_slam', 'fu_summoner_trap',
  'fu_summoner_shuriken', 'fu_summoner_fireball', 'fu_summoner_orb',
]);
const summonerArtReady = id => !!SUMMONER_IMAGES[id]?.naturalWidth;
const summonerUsesLineArt = line => line.L > 0 && SUMMONER_LINE_SOURCES.has(line.src) && summonerArtReady('base-beam');
// drawArsenal's legacy beam guard. Player beams are painted below enemy warnings.
const summonerUsesBaseArt = w => Boolean(w.bm);
const summonerUsesTrapArt = trap => trap.tag === 'fu_summoner_trap' && summonerArtReady('grave');
const summonerUsesProjectileArt = pr => summonerArtReady(SUMMONER_PROJECTILE_ART[pr.src]);
const summonerUsesArmedGhost = () => !!FIELD_ART.ready.ghost;

const summonerDescents = new WeakMap();
const summonerBounces = new WeakMap();
const summonerPoses = new WeakMap();
function summonerAim(ghost, angle, duration) {
  summonerPoses.set(ghost, { angle, end: G.time + duration });
}
function summonerDescent(x, y, r) {
  const active = (summonerDescents.get(G) || []).filter(d => G.time - d.start < .35);
  active.push({ x, y, r, start: G.time });
  summonerDescents.set(G, active.slice(-16));
}
function summonerBounceArt(pr, angle) {
  const points = summonerBounces.get(pr) || [];
  points.push({ x: pr.x, y: pr.y, angle, start: G.time });
  summonerBounces.set(pr, points.slice(-4));
}

const sumClamp = value => Math.max(0, Math.min(1, value));
function summonerStamp(c, id, x, y, angle, width, height, alpha, anchorX = .5, anchorY = .5) {
  if (!summonerArtReady(id) || width <= 0 || height <= 0 || alpha <= 0) return;
  c.save();
  c.translate(x, y); c.rotate(angle); c.globalAlpha = sumClamp(alpha);
  c.drawImage(SUMMONER_IMAGES[id], -width * anchorX, -height * anchorY, width, height);
  c.restore();
}
function summonerBeam(c, x, y, angle, length, width, progress, alpha) {
  if (length <= 0 || alpha <= 0) return;
  c.save();
  c.translate(x, y); c.rotate(angle); c.globalAlpha = sumClamp(alpha);
  const reach = length * progress;
  c.beginPath(); c.rect(0, -width, reach, width * 2); c.clip();
  c.drawImage(SUMMONER_IMAGES['base-beam'], 0, -width, length, width * 2);
  c.restore();
}
function summonerArc(c, x, y, radius, a0, a1, color, width, alpha) {
  c.globalAlpha = sumClamp(alpha);
  c.strokeStyle = color; c.lineWidth = width;
  c.beginPath(); c.arc(x, y, radius, a0, a1); c.stroke();
}
function drawSummonerImpact(c, f, reduced) {
  const t = sumClamp(f.t / f.dur), r = f.r1, a = f.summonerAngle || 0;
  const fade = 1 - t, out = 1 - fade * fade;
  if (f.summonerArt === 'scythe') {
    const progress = reduced ? .65 : sumClamp((t - .12) / .64);
    const start = a - f.summonerArc / 2;
    const swing = start + f.summonerArc * progress;
    const size = Math.min(47, r * .73);
    const grip = Math.min(9, r * .14);
    summonerStamp(c, 'scythe', f.x + Math.cos(swing) * grip, f.y + Math.sin(swing) * grip,
      swing + .75, size, size * .97, .92 * fade + .06, .13, .92);
    if (!reduced && progress > 0) {
      summonerArc(c, f.x, f.y, r * .86, Math.max(start, swing - .72), swing, '#b89cff', 5, .42 * fade);
      summonerArc(c, f.x, f.y, r * .87, Math.max(start, swing - .6), swing, '#f3e7ff', 1.5, .83 * fade);
    }
    return;
  }
  if (f.summonerArt === 'ward') {
    const spread = reduced ? .75 : .52 + out * .48;
    const width = Math.min(94, r * 1.6) * spread;
    summonerStamp(c, 'ward', f.x, f.y, 0, width, width * .7, .92 * fade);
    summonerArc(c, f.x, f.y, r * (.36 + .63 * out), a - 1.05, a + 1.05, '#d7c3ff', 2.5, .67 * fade);
    return;
  }
  if (f.summonerArt === 'grave') {
    const size = Math.min(37, r * 1.25);
    summonerStamp(c, 'grave', f.x, f.y - out * 11, 0, size, size, .8 * fade);
    for (let i = 0; i < 3; i++) {
      const a0 = i * Math.PI * 2 / 3 + t;
      summonerArc(c, f.x, f.y, r * (.3 + .7 * out), a0, a0 + .72, '#dcc7ff', 2.3, .63 * fade);
    }
    return;
  }
  const radius = r * (.32 + .67 * out);
  if (f.summonerArt === 'frost') {
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2 + .21;
      const size = Math.min(44, radius * .82);
      summonerStamp(c, 'frost', f.x + Math.cos(angle) * radius * .82, f.y + Math.sin(angle) * radius * .82,
        angle + Math.PI / 2, size, size * .39, .92 * fade);
    }
  } else {
    const isDrop = f.summonerArt === 'descent';
    const size = isDrop ? Math.min(55, r * .75) : Math.min(2 * r, 88) * (.47 + .53 * out);
    summonerStamp(c, f.summonerArt, f.x, f.y, isDrop || reduced ? 0 : t * .65,
      size * (isDrop ? .37 : 1), size, .95 * fade, .5, isDrop ? .85 : .5);
  }
  summonerArc(c, f.x, f.y, radius, 0, Math.PI * 2, f.color, 2.2, .57 * fade);
}

function drawSummonerArtWorld(c, inView) {
  if (G.p.job !== 'summoner') return;
  const reduced = VFX.reduced.matches;
  c.save(); c.imageSmoothingEnabled = true;
  for (const line of G.f44?.lines || []) {
    if (!SUMMONER_LINE_SOURCES.has(line.src) || !inView(line.x, line.y, line.L)) continue;
    const t = sumClamp(line.t / line.dur);
    const reach = reduced ? 1 : sumClamp(.22 + t * 4);
    if (summonerUsesLineArt(line)) summonerBeam(c, line.x, line.y, line.a, line.L, line.wd, reach, .9 * (1 - t * .75));
    if (line.src === 'fu_summoner_orb') {
      const width = Math.min(24, line.wd * 3.4) * (reduced ? 1 : .93 + .07 * Math.sin(line.t * 45));
      summonerStamp(c, 'tracking', line.x + Math.cos(line.a) * 16, line.y + Math.sin(line.a) * 16,
        line.a, width, width, .97 * (1 - t * .5));
    }
    if (line.t < .3 && (line.src === 'fu_summoner_fireball' || line.src === 'fu_summoner_shield')) {
      const x = G.p.x + Math.cos(line.a) * line.L, y = G.p.y + Math.sin(line.a) * line.L;
      const charge = sumClamp((line.t - .08) / .22);
      if (line.src === 'fu_summoner_shield') {
        const width = 18 + charge * 20;
        summonerStamp(c, 'ward', x, y, 0, width, width * .7, charge * .64);
      } else {
        const size = 13 + charge * 13;
        summonerStamp(c, 'will-o-wisp', x, y, 0, size * .77, size, reach * .68);
      }
    }
  }
  for (const d of summonerDescents.get(G) || []) {
    const t = (G.time - d.start) / .35;
    if (t < 0 || t >= 1 || !inView(d.x, d.y, d.r)) continue;
    const fall = reduced ? .6 : t * t;
    const height = Math.min(d.r, 96);
    summonerStamp(c, 'descent', d.x, d.y - height * (1 - fall), 0, 23, 63, .55 + .35 * t, .5, 1);
    if (summonerArtReady('descent'))
      summonerArc(c, d.x, d.y, d.r * (.34 - .21 * t), 0, Math.PI * 2, '#d9c5ff', 1.5, .28);
  }
  for (const trap of G.f44?.traps || []) {
    if (trap.dead || !summonerUsesTrapArt(trap) || !inView(trap.x, trap.y, trap.R)) continue;
    const progress = reduced ? 1 : sumClamp(trap.t / trap.arm);
    const size = 2 * trap.r;
    const image = SUMMONER_IMAGES.grave;
    c.save();
    c.beginPath(); c.rect(trap.x - size, trap.y - size, size * 2, size + trap.r); c.clip();
    summonerStamp(c, 'grave', trap.x, trap.y + trap.r + size * (1 - progress), 0,
      size * image.naturalWidth / image.naturalHeight, size, .82, .5, 1);
    c.restore();
  }
  for (const f of G.fx) {
    if (summonerArtReady(f.summonerArt) && inView(f.x, f.y, f.r1))
      drawSummonerImpact(c, f, reduced);
  }
  for (const pr of G.proj) {
    if (pr.dead || !summonerUsesProjectileArt(pr) || !inView(pr.x, pr.y, pr.r + 27)) continue;
    const angle = Math.atan2(pr.vy, pr.vx);
    if (pr.src === 'fu_summoner_arrow') {
      if (summonerArtReady('base-beam') && !reduced) {
        const tail = Math.min(Math.hypot(pr.vx, pr.vy) * pr.t, pr.r * 5);
        summonerBeam(c, pr.x - Math.cos(angle) * tail, pr.y - Math.sin(angle) * tail, angle, tail, pr.r * .7, 1, .7);
      }
      summonerStamp(c, 'arrow', pr.x, pr.y, angle, pr.r * 5.6, pr.r * 1.45, .96, .78);
    } else {
      if (!reduced) for (const b of summonerBounces.get(pr) || []) {
        const fade = 1 - (G.time - b.start) * 6;
        summonerStamp(c, 'ricochet', b.x, b.y, b.angle, pr.r * 2.6, pr.r * 3.1, .55 * fade);
      }
      summonerStamp(c, 'ricochet', pr.x, pr.y, reduced ? 0 : pr.t * 15, pr.r * 2.8, pr.r * 3.45, .96);
    }
  }
  c.restore();
}

function drawSummonerArmedGhosts(c, inView) {
  if (G.p.job !== 'summoner' || !fusedWs().length || !summonerUsesArmedGhost()) return;
  c.save(); c.globalAlpha = .8;
  for (const [i, ghost] of (G.f43?.wr || []).entries()) {
    const radius = ghost.r || 8;
    if (!inView(ghost.x, ghost.y, radius)) continue;
    const pose = summonerPoses.get(ghost);
    const attacking = pose && G.time < pose.end;
    const flip = attacking ? Math.cos(pose.angle) < 0 : (ghost.vx || 0) < 0;
    drawSprite(c, 'ghost', attacking ? 1 : (Math.floor(G.time * 6) + i) & 1, ghost.x, ghost.y + radius, { flip });
  }
  c.restore();
}
