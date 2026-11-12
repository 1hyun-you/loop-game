/* Warrior weapon artwork. Read existing effect clocks and collision geometry;
   the only extra clock is the shield pose, which belongs to the renderer. */
const WARRIOR_ART = { images: {}, shield: new WeakMap() };
for (const [id, source] of Object.entries(WARRIOR_ART_DATA)) {
  const image = new Image();
  image.onload = () => { WARRIOR_ART.images[id] = image; };
  image.onerror = () => { delete WARRIOR_ART.images[id]; };
  image.src = source;
}

function warriorArtReady(id) {
  const image = WARRIOR_ART.images[id];
  return !!(image && image.complete && image.naturalWidth);
}
function warriorProjectileArt(pr) {
  switch (pr.src) {
    case 'fu_warrior_arrow': return 'arrow';
    case 'fu_warrior_shuriken': return 'shuriken';
    case 'fu_warrior_orb': return 'orb';
  }
}
function startWarriorShieldArt(a) {
  WARRIOR_ART.shield.set(G, { a, time: G.time });
}

function warriorStamp(c, id, x, y, a, width, alpha, ox = -.5, sy = 1) {
  const img = WARRIOR_ART.images[id], height = width * img.naturalHeight / img.naturalWidth * sy;
  c.save();
  c.translate(x, y);
  c.rotate(a);
  c.globalAlpha = alpha;
  c.drawImage(img, width * ox, -height / 2, width, height);
  c.restore();
}
function warriorDrawShield(c, pose, reduced) {
  const t = G.time - pose.time;
  if (t < 0 || t >= .48) return;
  const p = G.p, hit = t >= .16, drive = clamp((t - .03) / .12, 0, 1), end = clamp((t - .22) / .26, 0, 1);
  const r = p.r * (reduced ? 1.55 : 1 + .95 * drive - .65 * end);
  const a = pose.a, x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
  const tilt = Math.cos(a) * (reduced ? .1 : -.22 + .48 * drive - .18 * end);
  if (!reduced && !hit && drive > .15) {
    const ux = Math.cos(a), uy = Math.sin(a);
    for (const side of [-1, 1]) {
      const px = x - uy * side * 8, py = y + ux * side * 8;
      vfxLine(c, [[px - ux * 32, py - uy * 32], [px - ux * 8, py - uy * 8]], 2, '#e2ad73', .42 * drive);
    }
  }
  warriorStamp(c, 'shield', x, y - 5, tilt, p.r * 1.85, .96 - end * .85);
}

function warriorDrawSweep(c, f, k, reduced) {
  const a0 = f.a - f.arc / 2, a = a0 + f.arc * (reduced ? .58 : clamp((k - .10) * 1.7, 0, 1));
  const reach = f.r, length = Math.min(48, reach * .68);
  const x = f.x, y = f.y, fade = 1 - k;
  if (!reduced && a > a0) {
    const tail = Math.max(a0, a - f.arc * .73);
    c.globalAlpha = .31 * fade;
    c.fillStyle = '#e6a36c';
    c.beginPath();
    c.arc(x, y, reach, tail, a);
    c.arc(x, y, reach * .77, a, tail, true);
    c.closePath();
    c.fill();
    c.globalAlpha = .75 * fade;
    c.strokeStyle = '#fff0d0';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(x, y, reach - 1, tail, a);
    c.stroke();
  }
  const tip = reach * (reduced ? .84 : .65 + .34 * Math.min(1, k * 3.6));
  warriorStamp(c, f.warArt, x + Math.cos(a) * tip, y + Math.sin(a) * tip, a, length, .95 * fade, -1);
}

function warriorDrawRing(c, f, k, reduced) {
  const id = f.warArt, R = f.r1, fade = 1 - k;
  const spread = reduced ? .91 : lerp(f.r0 / R, 1, 1 - (1 - k) ** 2);
  const radius = R * spread;
  c.save();
  c.beginPath(); c.arc(f.x, f.y, R, 0, Math.PI * 2); c.clip();
  if (id === 'slam') {
    // The point anchors the planted blade; cracks travel out from the impact.
    warriorStamp(c, id, f.x, f.y, reduced ? 1.22 : lerp(.82, 1.48, Math.min(1, k * 5)), Math.min(R * .65, 61), .92 * fade, -1);
    for (let i = 0; i < 7; i++) {
      const a = i * Math.PI * 2 / 7 + .16, dx = Math.cos(a), dy = Math.sin(a);
      const r = radius * (.83 + hash2(17, i) * .17);
      const pts = [[f.x + dx * 7, f.y + dy * 7], [f.x + dx * r * .44 - dy * 4, f.y + dy * r * .44 + dx * 4], [f.x + dx * r * .71 + dy * 3, f.y + dy * r * .71 - dx * 3], [f.x + dx * r, f.y + dy * r]];
      vfxLine(c, pts, 3.6, '#41283a', .79 * fade);
      vfxLine(c, pts, 1.6, '#ffc782', .91 * fade);
    }
  } else if (id === 'fireball' || id === 'icering') {
    const ice = id === 'icering', count = vfxLite() ? 7 : 11;
    const len = Math.min(ice ? 21 : 32, R * (ice ? .22 : .36));
    for (let i = 0; i < count; i++) {
      const a = i * 2 * Math.PI / count + (ice ? .13 : .17 * k);
      const r = ice ? radius : radius * (.68 + hash2(31, i) * .32);
      warriorStamp(c, id, f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, a, len, (ice ? .82 : .9) * fade, -1);
    }
  } else if (id === 'trap') {
    warriorStamp(c, id, f.x, f.y, 0, Math.min(R * .75, 35), .9 * fade);
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3, dx = Math.cos(a), dy = Math.sin(a);
      vfxLine(c, [[f.x + dx * radius * .38, f.y + dy * radius * .38], [f.x + dx * radius * .74 - dy * 4, f.y + dy * radius * .74 + dx * 4], [f.x + dx * radius, f.y + dy * radius]], 2.4, '#ffc08a', .8 * fade);
    }
  } else {
    const a = f.warAngle, ux = Math.cos(a), uy = Math.sin(a);
    for (const side of [-1, 0, 1]) {
      const d = side * .38, ex = Math.cos(a + d), ey = Math.sin(a + d);
      vfxLine(c, [[f.x + ux * radius * .20 - uy * side * 9, f.y + uy * radius * .20 + ux * side * 9], [f.x + ex * radius, f.y + ey * radius]], 3 - Math.abs(side), '#ffd298', .75 * fade);
    }
  }
  c.globalAlpha = (id === 'icering' ? .72 : .39) * fade;
  c.strokeStyle = f.color;
  c.lineWidth = 1.4;
  c.beginPath(); c.arc(f.x, f.y, radius, 0, Math.PI * 2); c.stroke();
  c.restore();
}

function warriorDrawBeam(c, L, reduced) {
  const k = clamp(L.t / L.dur, 0, 1), fade = Math.min(1, (1 - k) * 2.4);
  const reach = L.L, w = L.wd;
  c.save(); c.translate(L.x, L.y); c.rotate(L.a);
  c.globalAlpha = .66 * fade;
  c.fillStyle = '#e8a66e';
  c.beginPath(); c.moveTo(0, -w * .45); c.lineTo(reach * .23, -w); c.lineTo(reach * .83, -w * .55);
  c.lineTo(reach, 0); c.lineTo(reach * .81, w * .49); c.lineTo(reach * .16, w * .70); c.lineTo(0, w * .4);
  c.closePath(); c.fill();
  c.globalAlpha = .88 * fade;
  c.fillStyle = '#fff2d4';
  const edge = reduced ? .78 : .66 + .25 * Math.sin(Math.PI * k);
  c.beginPath(); c.moveTo(0, -2); c.lineTo(reach * .38, -w * .35); c.lineTo(reach, 0);
  c.lineTo(reach * edge, w * .25); c.lineTo(0, 2); c.closePath(); c.fill();
  const thrust = reduced ? .88 : .70 + .30 * Math.min(1, k * 7);
  warriorStamp(c, 'beam', 0, 0, 0, Math.min(58, reach) * thrust, fade, -.12);
  c.restore();
}

function warriorDrawProjectile(c, pr, id, reduced) {
  const a = Math.atan2(pr.vy, pr.vx), fade = Math.min(1, pr.life * 10);
  const launch = reduced ? 1 : clamp(pr.t * 20, 0, 1);
  if (!reduced) {
    const ux = Math.cos(a), uy = Math.sin(a), r = pr.r;
    const tail = (id === 'arrow' ? 4.3 : id === 'orb' ? 3 : 2.2) * r * launch;
    vfxLine(c, [[pr.x - ux * tail, pr.y - uy * tail], [pr.x - ux * r, pr.y - uy * r]], id === 'orb' ? 4.3 : 2, id === 'orb' ? '#93c3ed' : '#eac28c', .52 * fade);
  }
  if (id === 'arrow') {
    // The spearhead crosses the projectile center; the shaft trails it.
    warriorStamp(c, id, pr.x, pr.y, a, pr.r * (4.4 + .9 * launch), fade, -.86);
  } else if (id === 'shuriken') {
    warriorStamp(c, id, pr.x, pr.y, a + (reduced ? 0 : pr.t * 21), pr.r * 2.4, fade);
  } else {
    const rise = reduced ? 0 : Math.sin(Math.PI * Math.min(1, pr.t * 7)) * pr.r * .55;
    warriorStamp(c, id, pr.x, pr.y - rise, a, pr.r * 2.25, fade * (.67 + .27 * launch));
  }
}

function drawWarriorArtWorld(c, inView) {
  const reduced = VFX.reduced.matches, state = G.f44;
  c.save();
  c.imageSmoothingEnabled = true;
  c.lineCap = 'round';
  for (const f of G.fx) {
    const id = f.warArt, k = f.t / f.dur;
    if (!id || k >= 1 || !warriorArtReady(id) || !inView(f.x, f.y, f.r1 || f.r)) continue;
    if (f.kind === 'arc') warriorDrawSweep(c, f, k, reduced);
    else if (f.kind === 'ring' && !f.warSweep) warriorDrawRing(c, f, k, reduced);
    else if (f.warSweep) continue;
    else warriorStamp(c, id, f.x, f.y, f.warAngle, f.r * (1.4 + .6 * k), .85 * (1 - k), -.6);
  }
  for (const f of G.afx || []) {
    if (f.warArt && warriorArtReady(f.warArt) && inView(f.x, f.y, f.r)) {
      warriorDrawSweep(c, f, f.t / f.dur, reduced);
    }
  }
  if (state && warriorArtReady('trap')) for (const T of state.traps) {
    if (T.tag !== 'fu_warrior_trap' || T.dead || !inView(T.x, T.y, T.r)) continue;
    const arming = reduced ? 1 : Math.min(1, T.t / T.arm);
    warriorStamp(c, 'trap', T.x, T.y, 0, 2 * T.r * (.68 + .32 * arming), .42 + .49 * arming);
  }
  if (state && warriorArtReady('beam')) for (const L of state.lines) {
    if (L.src === 'fu_warrior_beam' && inView(L.x, L.y, L.L)) warriorDrawBeam(c, L, reduced);
  }
  const shield = WARRIOR_ART.shield.get(G);
  if (shield && warriorArtReady('shield')) warriorDrawShield(c, shield, reduced);
  for (const pr of G.proj) {
    const id = warriorProjectileArt(pr);
    if (!pr.dead && id && warriorArtReady(id) && inView(pr.x, pr.y, pr.r + 48)) warriorDrawProjectile(c, pr, id, reduced);
  }
  c.restore();
}
