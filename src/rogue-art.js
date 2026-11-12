/* G44-2: render using the original attack clocks and world coordinates. */
const ROGUE_ART_IMAGES = {};
const ROGUE_SLAMS = new WeakMap();
const ROGUE_PROJECTILES = {
  fu_rogue_slam: 'slam',
  fu_rogue_arrow: 'arrow',
  fu_rogue_trap: 'trap',
  fu_rogue_fireball: 'fireball',
  fu_rogue_orb: 'orb',
  fu_rogue_beam: 'beam',
};
const ROGUE_RINGS = {
  fu_rogue_shield: 'shield',
  fu_rogue_slam: 'slam',
  fu_rogue_trap: 'trap',
  fu_rogue_fireball: 'fireball',
  fu_rogue_icering: 'icering',
};

for (const [id, source] of Object.entries(ROGUE_ART_DATA)) {
  const image = new Image();
  image.onload = () => { ROGUE_ART_IMAGES[id] = image; };
  image.src = source;
}

function rogueArtReady(id) {
  return !!ROGUE_ART_IMAGES[id]?.naturalWidth;
}

function rogueProjectileArt(pr) {
  if (pr.kind === 'star' && pr.src === 'shuriken' && G.p.job === 'rogue') return 'base';
  return ROGUE_PROJECTILES[pr.src];
}

function startRogueSlamArt(pr) {
  const now = G.time;
  const pending = (ROGUE_SLAMS.get(G) || []).filter(s => s.impact > now);
  pending.push({ pr, impact: now + .7 });
  ROGUE_SLAMS.set(G, pending);
}

function rogueStamp(c, id, x, y, w, alpha, angle = 0, height, flip = false) {
  const img = ROGUE_ART_IMAGES[id];
  if (!img || alpha <= 0) return;
  const h = height ?? w * img.naturalHeight / img.naturalWidth;
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  if (flip) c.scale(-1, 1);
  c.globalAlpha = alpha;
  c.drawImage(img, -w / 2, -h / 2, w, h);
  c.restore();
}

function rogueDrawSlash(c, f, k, reduced) {
  const wind = clamp(k * 4, 0, 1);
  const sweep = reduced ? .78 : clamp((k - .10) * 2.1, 0, 1);
  const flip = Math.cos(f.a) < 0, side = f.rogueCut || 1;
  const start = f.a - side * f.arc * .5, end = start + side * f.arc * sweep;
  const pose = reduced ? .4 : wind * (1 - k * .55);
  const fade = Math.min(1, (1 - k) * 2.8);
  const x = f.x + Math.cos(f.a) * 13 * pose, y = f.y + Math.sin(f.a) * 13 * pose;
  if (!reduced && k < .5) rogueStamp(c, 'cleave', f.x, f.y - 8, 36, .28 * fade, 0, undefined, flip);
  rogueStamp(c, 'cleave', x, y - 9, 44, .94 * fade, flip ? -.09 * pose : .09 * pose, undefined, flip);
  if (sweep <= 0) return;
  for (const [radius, width, color] of [[.89, 4.4, '#302537'], [.89, 1.8, '#c5f5e4'], [.72, 1.7, '#71aeaf']]) {
    c.globalAlpha = .85 * fade;
    c.strokeStyle = color;
    c.lineWidth = width;
    c.beginPath();
    c.arc(f.x, f.y, f.r * radius, end - side * f.arc * Math.min(sweep, .63), end, side < 0);
    c.stroke();
  }
  c.globalAlpha = 1;
}

function rogueDrawRing(c, f, k, reduced) {
  const id = f.rogueArt, r = f.r1, fade = 1 - k;
  const reach = r * (reduced ? .92 : lerp(f.r0 / r, 1, 1 - (1 - k) ** 2));
  c.save();
  c.beginPath(); c.arc(f.x, f.y, r, 0, Math.PI * 2); c.clip();
  if (id === 'shield') {
    rogueStamp(c, id, f.x, f.y, reach * 1.98, .81 * fade, reduced ? 0 : k * .25);
  } else if (id === 'icering') {
    rogueStamp(c, id, f.x, f.y, reach * 1.98, .94 * fade, reduced ? 0 : k * -.17, reach * 1.98);
  } else {
    const slam = id === 'slam', trap = id === 'trap';
    const ink = slam ? '#b3dfcf' : trap ? '#d686a5' : '#ffd89b';
    if (slam || trap) rogueStamp(c, id, f.x, f.y, slam ? 27 : 22, fade, slam ? .18 : k * .8);
    for (let i = 0, n = vfxLite() ? 5 : 8; i < n; i++) {
      const a = i * Math.PI * 2 / n + hash2(i, 11) * .35;
      const dx = Math.cos(a), dy = Math.sin(a);
      const d = reach * (.58 + .40 * hash2(i, 29));
      const pts = [[f.x + dx * d * .37, f.y + dy * d * .37],
        [f.x + dx * d * .71 + dy * 4, f.y + dy * d * .71 - dx * 4],
        [f.x + dx * d, f.y + dy * d]];
      vfxLine(c, pts, slam ? 4 : 3, trap ? '#542335' : '#39283a', .8 * fade);
      vfxLine(c, pts, slam ? 1.6 : 1.2, ink, .86 * fade);
      if (!trap && !slam && !reduced) {
        rogueStamp(c, 'shield', f.x + dx * d * .67, f.y + dy * d * .67, 14 + k * 13, .48 * fade, a);
      }
    }
    if (slam) {
      c.globalAlpha = .58 * fade; c.strokeStyle = ink; c.lineWidth = 1.5;
      c.beginPath(); c.arc(f.x, f.y, reach, 0, Math.PI * 2); c.stroke();
    }
  }
  c.restore();
}

function rogueDrawProjectile(c, pr, id, reduced) {
  const a = Math.atan2(pr.vy, pr.vx), r = pr.r, fade = Math.min(1, pr.life * 12);
  const launch = reduced ? 1 : clamp(pr.t * 24, .25, 1);
  if (id === 'arrow') {
    const ux = Math.cos(a), uy = Math.sin(a);
    const tail = (reduced ? 0 : Math.min(4 * r, Math.hypot(pr.vx, pr.vy) * pr.t));
    const alpha = pr.color === '#506078' ? .72 : 1;
    if (tail > r) vfxLine(c, [[pr.x - ux * tail, pr.y - uy * tail], [pr.x, pr.y]], 1.5, '#abeddf', .52 * fade * alpha);
    rogueStamp(c, id, pr.x - ux * r * .66, pr.y - uy * r * .66, r * (2.6 + launch), fade * alpha, a);
  } else if (id === 'fireball') {
    const lift = reduced ? 0 : Math.sin(Math.PI * Math.min(1, pr.t / .24)) * r * 1.1;
    if (lift > 1) rogueStamp(c, id, pr.x, pr.y, r * 1.65, .25 * fade, a);
    rogueStamp(c, id, pr.x, pr.y - lift, r * 1.8, fade, reduced ? 0 : a * .35 + pr.t * 6);
  } else {
    if (id === 'beam' && !reduced) {
      const tail = Math.min(r * 4, Math.hypot(pr.vx, pr.vy) * pr.t);
      if (tail > 0) rogueStamp(c, id, pr.x - Math.cos(a) * tail / 2, pr.y - Math.sin(a) * tail / 2, tail, .78 * fade, a, r * 1.1);
    }
    const blade = id === 'beam' ? 'base' : id;
    const size = r * (1.85 + launch * .35);
    if (id === 'orb' && !reduced && launch > .5) {
      const ux = Math.cos(a), uy = Math.sin(a);
      rogueStamp(c, id, pr.x - ux * r * 1.8, pr.y - uy * r * 1.8, size * .68, .38 * fade, a + pr.t * 19 - .7);
    }
    if (rogueArtReady(blade)) rogueStamp(c, blade, pr.x, pr.y, size, fade, a + (reduced ? 0 : pr.t * (id === 'orb' ? 19 : 24)));
  }
}

function drawRogueArtWorld(c, inView) {
  const reduced = VFX.reduced.matches, state = G.f44;
  c.save();
  c.imageSmoothingEnabled = true;
  for (const f of G.fx) {
    if (!rogueArtReady(f.rogueArt) || !inView(f.x, f.y, f.r1 || f.r)) continue;
    const k = clamp(f.t / f.dur, 0, 1);
    if (f.kind === 'ring' && f.rogueArt !== 'cleave') rogueDrawRing(c, f, k, reduced);
    if (f.kind === 'pop') rogueStamp(c, 'cleave', f.x, f.y - 8, 32 + k * 12, .60 * (1 - k), 0, undefined, Math.cos(f.rogueAngle) < 0);
  }
  if (rogueArtReady('cleave')) for (const f of G.afx || []) {
    if (f.rogueArt === 'cleave' && inView(f.x, f.y, f.r)) rogueDrawSlash(c, f, clamp(f.t / f.dur, 0, 1), reduced);
  }
  if (state && rogueArtReady('trap')) for (const T of state.traps) {
    if (T.tag !== 'fu_rogue_trap' || T.dead || !inView(T.x, T.y, T.r)) continue;
    const k = reduced ? 1 : clamp(T.t / T.arm, 0, 1);
    rogueStamp(c, 'trap', T.x, T.y, T.r * (1.25 + .70 * k), .52 + .40 * k, (1 - k) * .85);
  }
  if (state && rogueArtReady('beam')) for (const L of state.lines) {
    if (L.src !== 'fu_rogue_beam' || !inView(L.x, L.y, L.L)) continue;
    const k = clamp(L.t / L.dur, 0, 1), width = L.wd * (reduced ? 1.45 : 1.16 + .48 * Math.sin(Math.PI * k));
    rogueStamp(c, 'beam', L.x + Math.cos(L.a) * L.L / 2, L.y + Math.sin(L.a) * L.L / 2, L.L, .96 * Math.min(1, (1 - k) * 2.8), L.a, width);
  }
  if (G.tm.smoke44 > 0 && rogueArtReady('shield')) {
    const p = G.p, k = clamp(G.tm.smoke44, 0, 1);
    rogueStamp(c, 'shield', p.x, p.y, p.r * 4.4, .60 * k, reduced ? 0 : (1 - k) * .72);
  }
  const descending = new Set();
  if (!reduced && rogueArtReady('slam')) for (const s of ROGUE_SLAMS.get(G) || []) {
    const t = s.impact - G.time, p = s.pr;
    if (t <= 0 || t > .28 || !inView(p.x, p.y, 75)) continue;
    descending.add(p);
    const k = 1 - t / .28;
    const height = 54 * (k < .52 ? Math.sin(k / .52 * Math.PI / 2) : 1 - ((k - .52) / .48) ** 2);
    rogueStamp(c, 'slam', p.x, p.y, p.r * 2, .29 + .18 * k);
    vfxLine(c, [[p.x, p.y - height - 14], [p.x, p.y - height + 3]], 2, '#b5e9d4', .36);
    rogueStamp(c, 'slam', p.x, p.y - height, p.r * (2.15 + .72 * k), .96, k * 6);
  }
  for (const pr of G.proj) {
    const id = rogueProjectileArt(pr);
    if (!pr.dead && !descending.has(pr) && rogueProjectileReady(id) && inView(pr.x, pr.y, pr.r + 40)) rogueDrawProjectile(c, pr, id, reduced);
  }
  c.restore();
}

function rogueProjectileReady(id) {
  return rogueArtReady(id) && (id !== 'beam' || rogueArtReady('base'));
}
