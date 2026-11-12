/* G44-10. All positions, extents and phase times come from the original attacks. */
const DRUID_IMAGES = {};
for (const [id, src] of Object.entries(DRUID_ART_DATA)) {
  const image = new Image();
  image.onload = () => { DRUID_IMAGES[id] = image; };
  image.src = src;
}

const DRUID_IMPACT_ART = {
  fu_druid_cleave: 'slam', fu_druid_shield: 'shell', fu_druid_arrow: 'slam',
  fu_druid_trap: 'slam', fu_druid_shuriken: 'slam', fu_druid_fireball: 'slam',
  fu_druid_icering: 'frost', fu_druid_orb: 'slam', fu_druid_beam: 'slam',
};
const DRUID_PROJECTILE_ART = { fu_druid_arrow: 'thorn', fu_druid_orb: 'spirit' };
const druidArtReady = id => !!DRUID_IMAGES[id]?.naturalWidth;
const druidUsesProjectileArt = pr => druidArtReady(DRUID_PROJECTILE_ART[pr.src]);
const druidUsesTrapArt = trap => trap.tag === 'fu_druid_trap' && druidArtReady('snare');
const druidUsesLineArt = line => line.src === 'fu_druid_beam' && druidArtReady('rift');
const druidClamp = t => clamp(t, 0, 1);

function druidImpactArt(f) {
  if (f.druidArt) return f.druidArt;
  // Earth Slam and its existing follow-up waves already share this ring format.
  if (G.p.job === 'druid' && f.kind === 'ring' && f.r0 === 12 && f.dur === .35) {
    if (f.element === 'earth') return 'slam';
    if (f.element === 'ice') return 'frost';
  }
}

function druidStamp(c, id, x, y, angle, width, height, alpha, anchor = .5, flip = false) {
  const image = DRUID_IMAGES[id];
  if (!image || alpha <= 0) return;
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  if (flip) c.scale(-1, 1);
  c.globalAlpha = druidClamp(alpha);
  c.drawImage(image, -width * anchor, -height * .5, width, height);
  c.restore();
}

const druidFlights = new WeakMap();
function druidLavaFlight(x, y, x2, y2, dur, i) {
  const flights = (druidFlights.get(G) || []).filter(f => G.time < f.at + f.dur);
  flights.push({ x, y, x2, y2, at: G.time, dur, delay: i * .065 });
  druidFlights.set(G, flights.slice(-24));
}

function drawDruidFlight(c, f, reduced) {
  const age = G.time - f.at;
  if (age < f.delay || age >= f.dur) return;
  const t = (age - f.delay) / (f.dur - f.delay);
  const hop = Math.sin(Math.PI * t);
  const x = lerp(f.x, f.x2, t), y = lerp(f.y, f.y2, t) - hop * (reduced ? 18 : 64);
  const w = 11 + 10 * hop;
  druidStamp(c, 'lava', x, y, reduced ? 0 : 2.3 * t, w, w, .65 + .35 * hop);
}

function drawDruidPaw(c, f, t, reduced) {
  const arc = f.druidArc;
  const side = f.druidReverse ? -1 : 1;
  const progress = reduced ? .5 : druidClamp((t - .08) / .66);
  const a = f.druidAngle + side * (progress - .5) * arc;
  const w = f.r1 * (.60 + .32 * progress);
  const d = f.r1 * (.3 + .18 * progress);
  c.save();
  c.beginPath();
  c.moveTo(f.x, f.y);
  c.arc(f.x, f.y, f.r1, f.druidAngle - arc / 2, f.druidAngle + arc / 2);
  c.closePath();
  c.clip();
  if (!reduced && progress > .2) {
    const tail = a - side * Math.min(.62, progress * arc);
    c.globalAlpha = (1 - t) * .78;
    c.lineCap = 'round';
    c.lineWidth = 1.35;
    c.strokeStyle = '#f5d797';
    for (const scale of [.59, .73, .87]) {
      c.beginPath();
      c.arc(f.x, f.y, f.r1 * scale, tail, a, side < 0);
      c.stroke();
    }
    const b = a - side * .27;
    druidStamp(c, 'paw', f.x + Math.cos(b) * d, f.y + Math.sin(b) * d,
      b - .35, w * .94, w * .58, (1 - t) * .27);
  }
  druidStamp(c, 'paw', f.x + Math.cos(a) * d, f.y + Math.sin(a) * d,
    a - .35, w, w * .65, (1 - t ** 2) * .98);
  c.restore();
}

function drawDruidLeap(c, f, t, reduced) {
  const dx = f.x2 - f.x, dy = f.y2 - f.y;
  const p = reduced ? .89 : druidClamp(t / .7);
  const w = f.druidSize;
  const x = lerp(f.x, f.x2, p), y = lerp(f.y, f.y2, p) - Math.sin(Math.PI * p) * (reduced ? 3 : 16);
  const flip = dx < 0, a = Math.atan2(dy, dx) - (flip ? Math.PI : 0);
  if (!reduced && p > .24) {
    druidStamp(c, 'wolf', lerp(f.x, f.x2, p - .24), lerp(f.y, f.y2, p - .24) - 7,
      a, w, w * .5, (1 - t) * .32, .5, flip);
  }
  druidStamp(c, 'wolf', x, y, a, w, w * .5, (1 - t) * .94, .5, flip);
  if (p >= .95) druidStamp(c, 'paw', f.x2, f.y2, a, w * .7, w * .45, (1 - t) * .78, .5, flip);
}

function drawDruidImpact(c, f, id, reduced) {
  const t = druidClamp(f.t / f.dur), fade = 1 - t;
  const { x, y } = f;
  if (id === 'paw') return drawDruidPaw(c, f, t, reduced);
  if (id === 'wolf') return drawDruidLeap(c, f, t, reduced);
  if (f.druidHold) {
    const size = f.r * 2 * (1 - .32 * druidClamp(t * 5));
    druidStamp(c, 'snare', x, y, 0, size, size * .65, .86 * Math.min(1, fade * 5));
    return;
  }

  const radius = lerp(f.r0, f.r1, 1 - fade ** 2);
  c.save();
  c.beginPath();
  c.arc(x, y, f.r1, 0, Math.PI * 2);
  c.clip();
  if (id === 'frost') {
    const n = f.fill ? 6 : 8;
    const size = Math.min(26, radius * .35);
    for (let i = 0; i < n; i++) {
      const a = (i + (f.fill ? 0 : .5)) * Math.PI * 2 / n;
      const d = radius - size * .48;
      druidStamp(c, id, x + Math.cos(a) * d, y + Math.sin(a) * d,
        reduced ? 0 : a + Math.PI / 2, size, size * .74, fade * .9);
    }
  } else {
    const size = radius * (id === 'shell' ? .96 : id === 'lava' ? .78 : 1.14);
    const rise = id === 'shell' && !reduced ? Math.sin(Math.PI * Math.min(1, t * 1.3)) * 12 : 0;
    druidStamp(c, id, x, y - rise, 0, size, size * (id === 'shell' ? .70 : .9), fade * .92);
    if (id === 'lava' && !reduced && t < .65) {
      c.globalAlpha = .83 * (1 - t / .65);
      c.lineWidth = 2;
      c.strokeStyle = '#ffd18a';
      for (let i = 0; i < 7; i++) {
        const a = i * Math.PI * 2 / 7;
        c.beginPath();
        c.moveTo(x + Math.cos(a) * radius * .3, y + Math.sin(a) * radius * .3);
        c.lineTo(x + Math.cos(a) * radius * .73, y + Math.sin(a) * radius * .73);
        c.stroke();
      }
    }
    if (!reduced && t > .1) {
      for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 2 / 5;
        const d = radius * .86;
        druidStamp(c, id, x + Math.cos(a) * d, y + Math.sin(a) * d,
          a + t, size * .18, size * .14, fade * .73);
      }
    }
  }
  c.globalAlpha = fade * .54;
  c.lineWidth = id === 'frost' ? 1.5 : 1;
  c.strokeStyle = f.color;
  c.beginPath();
  c.arc(x, y, radius * .97, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}

function drawDruidArtWorld(c, inView) {
  const reduced = VFX.reduced.matches;
  c.save();
  c.imageSmoothingEnabled = true;
  for (const f of G.fx) {
    const id = druidImpactArt(f);
    if (!f.druidLaunch && druidArtReady(id) && inView(f.x, f.y, f.r1 || (f.x2 !== undefined ? Math.hypot(f.x2 - f.x, f.y2 - f.y) : f.r))) {
      drawDruidImpact(c, f, id, reduced);
    }
  }
  if (druidArtReady('lava')) {
    for (const f of druidFlights.get(G) || []) {
      if (inView(f.x, f.y, Math.hypot(f.x2 - f.x, f.y2 - f.y) + 64)) drawDruidFlight(c, f, reduced);
    }
  }
  for (const trap of G.f44?.traps || []) {
    if (!druidUsesTrapArt(trap) || !inView(trap.x, trap.y, trap.r)) continue;
    const k = druidClamp(trap.t / trap.arm);
    const size = trap.r * 2 * (reduced ? 1 : .38 + .62 * k);
    const angle = reduced ? 0 : -.6 * (1 - k);
    druidStamp(c, 'snare', trap.x, trap.y, angle, size, size * .72, .45 + .49 * k);
  }
  for (const line of G.f44?.lines || []) {
    if (!druidUsesLineArt(line) || !inView(line.x, line.y, line.L)) continue;
    const t = druidClamp(line.t / line.dur);
    const reveal = reduced ? 1 : .22 + .78 * druidClamp(t * 6);
    c.save();
    c.translate(line.x, line.y);
    c.rotate(line.a);
    c.beginPath();
    c.rect(0, -line.wd, line.L * reveal, line.wd * 2);
    c.clip();
    druidStamp(c, 'rift', 0, 0, 0, line.L, line.wd * (1.24 + .5 * Math.sin(Math.PI * t)), .95 * (1 - t * .78), 0);
    c.restore();
  }
  for (const pr of G.proj) {
    if (!druidUsesProjectileArt(pr) || pr.dead || !inView(pr.x, pr.y, pr.r + 14)) continue;
    const a = Math.atan2(pr.vy, pr.vx), r = pr.r;
    if (DRUID_PROJECTILE_ART[pr.src] === 'thorn') {
      const grown = reduced ? 1 : .42 + .58 * druidClamp(pr.t * 14);
      druidStamp(c, 'thorn', pr.x, pr.y, a, r * 5.4 * grown, r * 1.8, .92, .86);
    } else {
      const lift = reduced ? 0 : Math.sin(pr.t * 20 + pr.id) * 2 - 4 * druidClamp(pr.t * 9);
      if (!reduced) {
        const back = Math.min(r, pr.t * Math.hypot(pr.vx, pr.vy));
        druidStamp(c, 'spirit', pr.x - Math.cos(a) * back, pr.y - Math.sin(a) * back, 0, r * 1.25, r, .28);
      }
      const flap = reduced ? 1 : .8 + .2 * Math.cos(pr.t * 30);
      druidStamp(c, 'spirit', pr.x, pr.y + lift, Math.cos(a) * .26, r * 2 * flap, r * 1.8, .97);
    }
  }
  c.restore();
}
