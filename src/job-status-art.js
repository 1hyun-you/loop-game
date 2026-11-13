const JOB_STATUS_IMAGES = Object.fromEntries(Object.entries(JOB_STATUS_DATA).map(([name, src]) => {
  const image = new Image();
  image.src = src;
  return [name, image];
}));
// Cell order in the 5 × 4 ground crest atlas.
const JOB_STATUS_CRESTS = [
  'berserk', 'guard', 'assassin', 'dancer', 'conqueror',
  'benevolent', 'sniper', 'hunter', 'artillery', 'mechanic',
  'accel', 'rewind', 'elemental', 'archmage', 'necro',
  'lord', 'judge', 'saint', 'ursa', 'pack',
];
const JOB_STORE_POSES = new WeakMap();

function jobStatusReady(name) {
  return JOB_STATUS_IMAGES[name].complete && JOB_STATUS_IMAGES[name].naturalWidth > 0;
}

function drawStoredPlates(c, p, charge) {
  if (!jobStatusReady('plate')) return false;
  let pose = JOB_STORE_POSES.get(p);
  if (!pose && charge === 0) return true;
  if (!pose) {
    pose = { charge: 0, from: 0, at: G.time };
    JOB_STORE_POSES.set(p, pose);
  }
  const progress = clamp((G.time - pose.at) / 0.22, 0, 1);
  let shown = lerp(pose.from, pose.charge, 1 - (1 - progress) ** 3);
  if (charge !== pose.charge) {
    pose.from = shown;
    pose.charge = charge;
    pose.at = G.time;
  }
  if (VFX.reduced.matches) shown = charge;
  if (shown === 0 && charge === 0) {
    JOB_STORE_POSES.delete(p);
    return true;
  }
  const image = JOB_STATUS_IMAGES.plate;
  for (let i = 0; i < 5; i++) {
    const part = clamp(shown * 5 - i, 0, 1);
    if (!part) break;
    const angle = (i - 2) * 0.47;
    c.globalAlpha = (charge > 0 ? 0.46 : 0.29) * Math.min(1, part * 3);
    c.drawImage(image, p.x + Math.sin(angle) * 23 - 5, p.y + 15 + Math.cos(angle) * 5, 10, 5 + part * 4);
  }
  c.globalAlpha = 1;
  return true;
}

function drawRageFlames(c, p, remaining) {
  if (!jobStatusReady('flame')) return false;
  const reduced = VFX.reduced.matches;
  const total = p.job2 === 'berserk' ? V41.war.rageB : V41.war.rage;
  const intensity = reduced ? 0.7 : Math.min(1, 0.22 + (total - remaining) / 0.25, remaining / 0.38);
  for (const side of [-1, 1]) {
    const wave = reduced ? 0 : Math.sin(G.time * 10 + side * 1.2);
    c.save();
    c.translate(p.x + side * (p.r + 4), p.y + p.r);
    c.scale(side, 1);
    c.rotate(0.13 + wave * 0.10);
    c.globalAlpha = 0.48 * intensity;
    const height = (24 + wave * 4) * (0.5 + 0.5 * intensity);
    c.drawImage(JOB_STATUS_IMAGES.flame, -6, -height, 14, height);
    c.restore();
  }
  return true;
}

function drawFocusArrows(c, p, J) {
  if (!jobStatusReady('focus')) return false;
  const reduced = VFX.reduced.matches;
  const phase = clamp(J.focT / 0.19, 0, 1);
  const angleStep = 0.22;
  const full = J.focus === V41.arc.max;
  for (let i = 0; i < J.focus; i++) {
    const slot = i - (J.focus - 1) / 2;
    const entering = !reduced && !full && i === J.focus - 1 ? (1 - phase) ** 2 : 0;
    c.save();
    c.translate(p.x + slot * 9 + entering * 4, p.y - p.r - 25 + Math.abs(slot) * 2 - entering * 5);
    c.rotate(-0.70 + slot * angleStep);
    c.globalAlpha = 0.92 - entering * 0.25;
    const size = full && slot === 0 ? 14 : 11;
    c.drawImage(JOB_STATUS_IMAGES.focus, -size / 2, -size / 2, size, size);
    c.restore();
  }
  return true;
}

function drawArcherMarks(c, inView) {
  if (G.p.job !== 'archer') return;
  const ready = jobStatusReady('mark');
  c.save();
  c.imageSmoothingEnabled = true;
  c.fillStyle = '#b8ff9a';
  for (const e of G.enemies) {
    if (e.dead || !e.mk || !inView(e.x, e.y, e.r)) continue;
    for (let i = 0; i < e.mk; i++) {
      if (ready) {
        const x = e.x + (i - (e.mk - 1) / 2) * 6;
        const y = e.y - e.r - ((e.elite || e.cmd) ? 20 : 11);
        c.drawImage(JOB_STATUS_IMAGES.mark, x - 3, y - 5, 6, 10);
      } else {
        c.fillRect(e.x - 8 + i * 4, e.y - e.r - 6, 3, 3);
      }
    }
  }
  c.restore();
}

function drawChronoDial(c, p) {
  if (!jobStatusReady('dial') || !jobStatusReady('hand')) return false;
  const radius = V41.chr.R;
  const reduced = VFX.reduced.matches;
  const angle = reduced ? -Math.PI / 2 : G.time * Math.PI / 3 - Math.PI / 2;
  c.globalAlpha = 0.33;
  c.drawImage(JOB_STATUS_IMAGES.dial, p.x - radius, p.y - radius, radius * 2, radius * 2);
  c.save();
  c.translate(p.x, p.y);
  for (const offset of reduced ? [0] : [-0.13, 0]) {
    c.save();
    c.rotate(angle + offset);
    c.globalAlpha = offset ? 0.12 : 0.36;
    c.drawImage(JOB_STATUS_IMAGES.hand, -9, -6, radius * 0.72, 12);
    c.restore();
  }
  c.restore();
  c.globalAlpha = 1;
  return true;
}

function drawJobFootCrest(c, p) {
  const index = JOB_STATUS_CRESTS.indexOf(p.job2);
  if (index < 0 || !jobStatusReady('crests')) return false;
  const diameter = (p.r + 12) * 2;
  c.save();
  c.imageSmoothingEnabled = true;
  c.globalAlpha = 0.61;
  c.drawImage(JOB_STATUS_IMAGES.crests, (index % 5) * 64, Math.floor(index / 5) * 64, 64, 64,
    p.x - diameter / 2, p.y + p.r * 0.94 - diameter / 2, diameter, diameter);
  c.restore();
  return true;
}
