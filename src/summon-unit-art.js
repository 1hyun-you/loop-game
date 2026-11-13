/* G42-5: sprite poses are presentation state and never advance the simulation. */
const SUMMON_UNIT_IMAGES = Object.fromEntries(Object.entries(SUMMON_UNIT_DATA).map(([kind, url]) => {
  const image = new Image();
  image.src = url;
  return [kind, image];
}));
const SUMMON_UNIT_ATTACKS = new WeakMap();
const SUMMON_HAWK_DIVES = new WeakMap();

function summonUnitReady(kind) {
  const image = SUMMON_UNIT_IMAGES[kind];
  return !!image && image.complete && image.naturalWidth === 384 && image.naturalHeight === 96;
}

function markSummonAttack(unit, angle) {
  SUMMON_UNIT_ATTACKS.set(unit, { time: G.time, flip: Math.cos(angle) < 0 });
}

function markHawkDive(p, target) {
  const dx = target.x - p.x, dy = target.y - p.y;
  const length = Math.hypot(dx, dy);
  SUMMON_HAWK_DIVES.set(G, {
    x: target.x, y: target.y, dx: length ? dx / length : (p.face.x < 0 ? -1 : 1),
    dy: length ? dy / length : 0, time: G.time
  });
}

function summonSprite(c, kind, frame, x, y, radius, flip, alpha, lift = 0, tilt = 0) {
  c.save();
  c.translate(x, y + radius - lift);
  if (flip) c.scale(-1, 1);
  if (tilt) c.rotate(tilt);
  c.globalAlpha = alpha;
  c.imageSmoothingEnabled = true;
  c.drawImage(SUMMON_UNIT_IMAGES[kind], frame * 96, 0, 96, 96,
    -radius, -2 * radius, 2 * radius, 2 * radius);
  c.restore();
}

function drawSummonUnit(c, inView, kind, unit, radius, flip, alpha, phase = 0) {
  if (!summonUnitReady(kind) || !inView(unit.x, unit.y, radius + 2)) return;
  const reduced = VFX.reduced.matches;
  const attack = SUMMON_UNIT_ATTACKS.get(unit);
  const age = attack ? G.time - attack.time : Infinity;
  const active = age >= 0 && age < 0.24;
  const step = G.time * (kind === 'walker' ? 7 : 6) + phase;
  const frame = active ? (reduced || age >= 0.055 ? 3 : 2) : reduced ? 0 : Math.floor(step) & 1;
  const motion = reduced ? 0 : active ? Math.sin(age / 0.24 * Math.PI) : Math.sin(step * Math.PI);
  summonSprite(c, kind, frame, unit.x, unit.y, radius, active ? attack.flip : flip,
    alpha, active ? 0 : Math.max(0, motion) * Math.min(1, radius * 0.09),
    motion * (active ? 0.12 : 0.045));
}

function drawSummonHawk(c, inView, p) {
  if (!summonUnitReady('hawk')) return;
  const dive = SUMMON_HAWK_DIVES.get(G);
  const age = dive ? G.time - dive.time : Infinity;
  const reduced = VFX.reduced.matches;
  const radius = 13;
  if (age >= 0 && age < 0.25) {
    const k = age / 0.25, flip = dive.dx < 0;
    if (reduced) {
      if (inView(dive.x, dive.y, radius)) summonSprite(c, 'hawk', 3, dive.x, dive.y, radius, flip, 0.84);
      return;
    }
    const distance = k < 0.22 ? lerp(-19, 0, 1 - (1 - k / 0.22) ** 2) : 24 * ((k - 0.22) / 0.78);
    const x = dive.x + dive.dx * distance, y = dive.y + dive.dy * distance;
    if (!inView(x, y, radius + 10)) return;
    if (k > 0.10 && k < 0.66) {
      summonSprite(c, 'hawk', 2, x - dive.dx * 9, y - dive.dy * 9, radius, flip, 0.20 * (1 - k), 2);
    }
    summonSprite(c, 'hawk', k < 0.22 ? 2 : 3, x, y, radius, flip,
      0.94 * (1 - Math.max(0, k - 0.72) / 0.28), Math.abs(k - 0.22) * 11, k < 0.22 ? 0.20 : -0.10);
    return;
  }
  const angle = reduced ? -Math.PI / 4 : G.time * 1.65;
  const x = p.x + Math.cos(angle) * 31, y = p.y + Math.sin(angle) * 26;
  if (inView(x, y, radius + 12)) {
    summonSprite(c, 'hawk', reduced ? 0 : Math.floor(G.time * 9) & 1, x, y, radius,
      Math.sin(angle) > 0, age < 0.34 ? 0.72 * (age - 0.25) / 0.09 : 0.72, 11);
  }
}
