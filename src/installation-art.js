/* G42-4: presentation uses the existing arming, firing and impact events. */
const INSTALLATION_FRAMES = { trap: 3, mine: 1, turret: 2, missile: 2 };
const INSTALLATION_IMAGES = Object.fromEntries(Object.entries(INSTALLATION_DATA).map(([name, url]) => {
  const image = new Image();
  image.src = url;
  return [name, image];
}));
const INSTALLATION_SHOTS = new WeakMap();
const INSTALLATION_FLIGHTS = new WeakMap();

function installationArtReady(name) {
  const image = INSTALLATION_IMAGES[name];
  return !!image && image.complete && image.naturalWidth === INSTALLATION_FRAMES[name] * 96 && image.naturalHeight === 96;
}

function markInstallationShot(turret, angle) {
  INSTALLATION_SHOTS.set(turret, { angle, time: G.time });
}

function installationSprite(c, name, frame, x, y, size, angle = 0, alpha = 1, anchor = 0.5) {
  c.save();
  c.translate(x, y);
  if (angle) c.rotate(angle);
  c.globalAlpha = alpha;
  c.imageSmoothingEnabled = true;
  c.drawImage(INSTALLATION_IMAGES[name], frame * 96, 0, 96, 96, -size * anchor, -size / 2, size, size);
  c.restore();
}

function basicTrapImage(t) {
  const branch = t.snare ? 'snare' : t.cluster ? 'cluster' : null;
  return basicWeaponImage(branchWeaponArt('trap', branch)) || basicWeaponImage('trap');
}

function drawInstallationTrap(c, t, reduced) {
  const arming = t.arm > 0;
  const k = clamp(1 - t.arm / (t.mini ? 0.5 : 0.4), 0, 1);
  const lift = reduced || !arming ? 0 : 5 * (1 - k) ** 2;
  const y = t.y - lift - 2 * t.r / 12;
  const size = t.r * 2 * 96 / 92;
  const image = basicTrapImage(t);
  if (!image) {
    installationSprite(c, 'trap', arming ? 0 : 1, t.x, y, size);
    return;
  }
  const width = t.r * (image === basicWeaponImage('trap') ? 2 : 2.45);
  const h = width * image.naturalHeight / image.naturalWidth;
  c.save();
  c.imageSmoothingEnabled = true;
  c.globalAlpha *= arming ? .68 + .32 * k : 1;
  c.drawImage(image, t.x - width / 2, y - h / 2, width, h);
  c.restore();
}

function drawInstallationMine(c, m, reduced) {
  const size = m.r * 2 * 96 / 92;
  installationSprite(c, 'mine', 0, m.x, m.y, size);
  if (reduced || m.arm > 0) return;
  const pulse = 0.5 + 0.5 * Math.cos(G.time * Math.PI * 2 * 1.7 + m.x * 0.15);
  c.save();
  c.fillStyle = '#fff0aa';
  c.globalAlpha = 0.66 * pulse ** 3;
  c.beginPath();
  c.ellipse(m.x + m.r * 0.04, m.y - m.r * 0.26, m.r * 0.15, m.r * 0.10, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function installationWalker(t) {
  return G.p.job === 'engineer' && G.p.job2 === 'mechanic' && !t.temp && summonUnitReady('walker');
}

function drawInstallationTurret(c, t, reduced) {
  const shot = INSTALLATION_SHOTS.get(t);
  const age = shot ? G.time - shot.time : Infinity;
  const recoil = reduced ? 0 : 1 - clamp(age / 0.16, 0, 1);
  const a = shot && age < 0.16 ? shot.angle : t.a || 0;
  const rest = t.a || 0;
  const turn = Math.atan2(Math.sin(rest - a), Math.cos(rest - a));
  const facing = reduced || !shot ? a : a + turn * clamp((age - 0.09) / 0.07, 0, 1);
  const back = 4 * recoil ** 2, x = t.x + 1, y = t.y - 6;
  installationSprite(c, 'turret', 0, t.x, t.y, 25);
  installationSprite(c, 'turret', 1, x - Math.cos(a) * back, y - Math.sin(a) * back, 26, facing, 1, 0.40);
  if (recoil > 0.68 && installationArtReady('missile')) {
    installationSprite(c, 'missile', 1, x + Math.cos(a) * (15 - back), y + Math.sin(a) * (15 - back), 8, a, recoil * 0.7);
  }
}

function drawInstallationFlight(c, f, k, inView, reduced) {
  const x = lerp(f.x, f.x2, k), y = lerp(f.y, f.y2, k);
  const a = Math.atan2(f.y2 - f.y, f.x2 - f.x);
  const lift = reduced ? 0 : 10 * Math.sin(Math.PI * k);
  if (!inView(x, y - lift, 20)) return;
  if (!reduced && k > 0) {
    const trail = Math.min(14, Math.hypot(x - f.x, y - f.y));
    c.save();
    c.lineCap = 'round';
    vfxLine(c, [[x - Math.cos(a) * (trail + 7), y - lift - Math.sin(a) * (trail + 7)], [x, y - lift]], 2, '#eec68b', 0.38);
    c.restore();
  }
  installationSprite(c, 'missile', 0, x, y - lift, reduced ? 13 : 18, a, 0.95, 0.96);
}

function drawInstallationImpact(c, f, reduced) {
  const k = clamp(f.t / f.dur, 0, 1), fade = 1 - k;
  const size = 2 * f.r1 * (reduced ? 0.58 : lerp(0.32, 0.95, 1 - (1 - k) ** 2));
  c.save();
  c.beginPath();
  c.arc(f.x, f.y, f.r1, 0, Math.PI * 2);
  c.clip();
  installationSprite(c, f.installationArt, f.installationArt === 'trap' ? 2 : 1, f.x, f.y, size, 0, fade * 0.88);
  c.restore();
  effectBoundary(c, f.x, f.y, f.r1, f.color, fade * 0.33);
}

function drawInstallationWorld(c, inView) {
  const reduced = VFX.reduced.matches;
  const trap = installationArtReady('trap'), mine = installationArtReady('mine');
  const turret = installationArtReady('turret'), missile = installationArtReady('missile');
  for (const t of G.traps) if (!t.dead && (trap || basicTrapImage(t)) && inView(t.x, t.y, t.r + 9)) drawInstallationTrap(c, t, reduced);
  if (mine) for (const m of G.mines) if (!m.dead && inView(m.x, m.y, m.r)) drawInstallationMine(c, m, reduced);
  if (turret) for (const t of G.turrets) if (!installationWalker(t) && inView(t.x, t.y, 22)) drawInstallationTurret(c, t, reduced);
  if (missile) for (const delay of G.later) {
    const flight = INSTALLATION_FLIGHTS.get(delay);
    if (flight && !delay.done) drawInstallationFlight(c, flight, clamp(1 - delay.t / flight.duration, 0, 1), inView, reduced);
  }
  for (const f of G.fx) {
    if (f.r1 > 0 && f.t < f.dur && installationArtReady(f.installationArt) && inView(f.x, f.y, f.r1)) drawInstallationImpact(c, f, reduced);
  }
}
