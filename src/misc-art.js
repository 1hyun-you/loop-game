/* G42-3b / G42-7 — embedded card and field art. */
function miscIcon(id, fallback) {
  const url = Object.hasOwn(MISC_ART_DATA, id) && MISC_ART_DATA[id];
  if (!url) return fallback;
  return `<span class="ic px misc-icon" aria-hidden="true"><span hidden>${fallback}</span><img src="${url}" alt="" data-misc-art="${id}" onerror="this.hidden=true;this.previousElementSibling.hidden=false"></span>`;
}

const MISC_FIELD_ART = Object.fromEntries(['charge', 'altar'].map(id => {
  const image = new Image();
  image.src = MISC_ART_DATA[id];
  return [id, image];
}));

function miscFieldArtReady(image) {
  return image.complete && image.naturalWidth > 0;
}

function drawEliteChargeArt(c, e, target) {
  const image = MISC_FIELD_ART.charge;
  if (!miscFieldArtReady(image)) return;
  const dx = target.x - e.x, dy = target.y - e.y;
  const length = Math.hypot(dx, dy);
  const start = e.r + 2, end = length - target.r - 2;
  if (end <= start) return;

  c.save();
  c.translate(e.x, e.y);
  c.rotate(Math.atan2(dy, dx));
  c.imageSmoothingEnabled = true;
  const size = Math.min(22, end - start);
  const count = Math.min(5, Math.max(1, Math.floor((end - start) / 25)));
  for (let i = 0; i < count; i++) {
    const offset = (i + .5) / count;
    const x = start + (end - start) * offset;
    const wave = VFX.reduced.matches ? 1 : .5 + .5 * Math.cos((e.tele * 2 + offset) * Math.PI * 2);
    c.globalAlpha = .62 + .34 * wave;
    c.drawImage(image, x - size / 2, -size / 4, size, size / 2);
  }
  c.restore();
}

function drawAltarProgressArt(c, altar) {
  const image = MISC_FIELD_ART.altar;
  if (!miscFieldArtReady(image)) return false;
  const progress = clamp(altar.stay / JOB_CFG.altarStay, 0, 1);
  const radius = altar.r + 6, size = radius * 2;
  c.save();
  c.translate(altar.x, altar.y);
  c.imageSmoothingEnabled = true;
  c.globalAlpha = .45;
  c.drawImage(image, -radius, -radius, size, size);
  if (progress > 0) {
    c.beginPath();
    c.moveTo(0, 0);
    c.arc(0, 0, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    c.closePath();
    c.clip();
    c.globalAlpha = 1;
    c.drawImage(image, -radius, -radius, size, size);
  }
  c.restore();
  return true;
}
