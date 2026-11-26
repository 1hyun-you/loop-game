/* 0.40-fx2: supplied painted effects; presentation only, bounded alpha and radius.
   Exact danger/range outlines remain readable. No gameplay RNG or render-time spawning. */
const EFFECT_ART={image:null,failed:false,count:0};
{const im=new Image();im.onload=()=>{EFFECT_ART.image=im;};im.onerror=()=>{EFFECT_ART.failed=true;};im.src=EFFECT_DATA.url;}
function effectKey(color,filled=false){
 const s=String(color||'').replace('#','');if(!/^[0-9a-f]{6}$/i.test(s))return filled?'arcane':'blessing';
 const r=parseInt(s.slice(0,2),16),g=parseInt(s.slice(2,4),16),b=parseInt(s.slice(4,6),16);
 if(b>r+20&&b>g+12)return 'arcane';
 if(b>r+15)return filled?'shatter':'frost';
 if(g>r+15&&g>b)return 'heal';
 if(r>g+35)return filled?'explosion':'fire';
 return filled?'dust':'blessing';
}
function paintedEffect(c,key,x,y,r,alpha=.6,angle=0,sy=1){
 const im=EFFECT_ART.image,i=EFFECT_DATA.names.indexOf(key);
 if(!im||i<0||!Number.isFinite(x+y+r+alpha+angle+sy)||r<=0)return false;
 // Once budget is spent, skip decorative stamps (the caller still draws range outlines).
 if(Math.abs(x-G.p.x)>VIEW.cameraW/2+r+60||Math.abs(y-G.p.y)>VIEW.cameraH/2+r+60)return true;
 if(EFFECT_ART.count++>=(vfxLite()?48:96))return true;
 c.save();c.imageSmoothingEnabled=true;c.globalAlpha*=clamp(alpha,0,.95);
 c.translate(x,y);c.rotate(VFX.reduced.matches?0:angle);c.scale(1,sy);
 c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.clip();
 const cell=EFFECT_DATA.cell;c.drawImage(im,i%4*cell,Math.floor(i/4)*cell,cell,cell,-r,-r,r*2,r*2);c.restore();return true;
}
function paintedAura(c,key,x,y,r,alpha=.5){
 if(!paintedEffect(c,key,x,y,r,alpha,Math.sin(G.time*.5)*.06))effectBoundary(c,x,y,r,'#c3d4e5',alpha);
}
function paintedBeam(c,x,y,a,L,w,alpha,key='holy'){
 const im=EFFECT_ART.image;if(!im)return false;
 c.save();c.translate(x,y);c.rotate(a);c.globalAlpha*=alpha;
 // Shared existing painted beam sprite, stretched only along its logical ray.
 const sp=getSprite('dbeam',0);if(!sp){c.restore();return false;}
 c.imageSmoothingEnabled=true;c.drawImage(sp.cv,0,-w/2,L,w);c.restore();return true;
}

/* 0.51-art1: common silhouettes for the equipment UI and base attacks. */
const BASIC_WEAPON_IMAGES = Object.create(null);
for (const [id, source] of Object.entries(BASIC_WEAPON_ART_DATA)) {
  art2Image(source, image => {
    BASIC_WEAPON_IMAGES[id] = image;
    if (!basicWeaponIcon(id)) return;
    ART2.iconCache.delete(id);
    for (const key of ART2.iconCanvasCache.keys()) {
      if (key.startsWith(id + '|')) ART2.iconCanvasCache.delete(key);
    }
    for (const el of document.querySelectorAll('[data-art-icon="' + id + '"]')) el.src = iconURL(id);
  });
}

function basicWeaponImage(id) {
  return BASIC_WEAPON_IMAGES[id];
}

function branchWeaponArt(id, branch) {
  const key = id + '_' + branch;
  return Object.hasOwn(BASIC_WEAPON_ART_DATA, key) ? key : id;
}

function branchWeaponBase(id) {
  const base = id && id.split('_', 1)[0];
  return base && base !== id && Object.hasOwn(BASIC_WEAPON_ART_DATA, id) ? base : null;
}

function basicAttackImage(f) {
  return basicWeaponImage(f.branchArt) || basicWeaponImage(f.basicArt);
}

function basicWeaponIcon(id) {
  return id === 'arrow' || id === 'shuriken' ? null : basicWeaponImage(id);
}

function drawBasicWeaponIcon(c, id, image, size) {
  const base = branchWeaponBase(id);
  const sword = id === 'cleave' || base === 'cleave';
  const ratio = image.naturalWidth / image.naturalHeight;
  const maxSize = size * (sword ? 1.04 : .89);
  const w = maxSize * (!sword && base ? Math.min(1, ratio) : 1);
  const h = id === 'beam' ? size * .20 : w / ratio;
  c.save();
  c.imageSmoothingEnabled = true;
  c.translate(size / 2, size / 2);
  if (sword || id === 'beam' || base === 'arrow') c.rotate(-Math.PI / 4);
  c.drawImage(image, -w / 2, -h / 2, w, h);
  c.restore();
}

// Keep the display identity after the first hit consumes split or scatter.
const BASIC_PROJECTILE_BRANCH = new WeakMap();

function shootBasicBranch(w, spec) {
  const pr = shoot(spec);
  const id = branchWeaponArt(w.id, w.br);
  if (id !== w.id) BASIC_PROJECTILE_BRANCH.set(pr, id);
  return pr;
}

function basicWeaponProjectile(pr) {
  const variant = basicWeaponImage(BASIC_PROJECTILE_BRANCH.get(pr));
  if (variant) return variant;
  if (pr.kind === 'arrow' && (pr.src === 'arrow' || pr.src === 'split')) return basicWeaponImage('arrow');
  if (pr.kind === 'star' && pr.src === 'shuriken') return basicWeaponImage('shuriken');
  if (pr.kind === 'fire' && pr.src === 'fireball') return basicWeaponImage('fireball');
  if (pr.kind === 'orb' && pr.src === 'mbolt') return basicWeaponImage('orb');
  return null;
}


function drawBasicSlam(c, f, image, k, reduced) {
  const after = f.branchArt === 'slam_after';
  const drop = reduced ? 1 : clamp(k / .18, 0, 1);
  const settle = reduced ? 0 : clamp((k - .18) / .24, 0, 1);
  const height = Math.min(65, f.r1 * .54);
  const width = height * image.naturalWidth / image.naturalHeight;
  const headX = width * (after ? .66 : .77);
  const headY = height * (after ? .31 : .27);
  const impactX = f.x + Math.min(23, f.r1 * .18);
  const impactY = f.y - 10;
  const recoil = Math.sin(settle * Math.PI);

  c.beginPath();
  c.arc(f.x, f.y, f.r1, 0, Math.PI * 2);
  c.clip();
  c.translate(impactX, impactY - (1 - drop) ** 2 * 25 - 6 * recoil);
  c.rotate((1 - drop) * (after ? -.56 : .32) + recoil * (after ? .22 : -.12));
  c.scale(1, 1 - .13 * recoil);
  c.globalAlpha = Math.min(1, (1 - k) / .58);
  c.drawImage(image, -headX, -headY, width, height);
}

function drawBasicWeaponWorld(c, inView) {
  const reduced = VFX.reduced.matches;
  c.save();
  c.imageSmoothingEnabled = true;
  drawBasicIce(c);
  drawBasicBeams(c, reduced);
  for (const f of G.fx) {
    const image = basicAttackImage(f);
    if (!image || f.t >= f.dur || !inView(f.artX ?? f.x, f.artY ?? f.y, f.r || f.r1)) continue;
    const k = remap48(f, f.t / f.dur);
    c.save();
    if (f.basicArt === 'cleave') drawBasicCleave(c, f, image, k, reduced);
    else if (f.basicArt === 'slam') drawBasicSlam(c, f, image, k, reduced);
    else {
      const drop = reduced ? 1 : clamp(k / .29, 0, 1);
      const size = Math.min(33, f.r1 * .62);
      const variant = image !== basicWeaponImage('shield');
      const height = variant ? Math.min(f.r1 * .62, image === BASIC_WEAPON_IMAGES.shield_wall ? 46 : 39) : size;
      const width = variant ? height * image.naturalWidth / image.naturalHeight : size;
      const strike = !reduced && image === BASIC_WEAPON_IMAGES.shield_twin ? -5 * (1 - drop) : 0;
      c.translate(f.x + strike, f.y - 7 - (1 - drop) ** 2 * 23);
      c.scale(1, .76 + .22 * drop);
      c.globalAlpha = Math.min(1, (1 - k) / .58);
      c.drawImage(image, -width / 2, -height, width, height);
    }
    c.restore();
  }
  for (const pr of G.proj) {
    const image = basicWeaponProjectile(pr);
    if (!image || pr.dead || !inView(pr.x, pr.y, pr.r + 20)) continue;
    const arrow = pr.kind === 'arrow', fire = pr.kind === 'fire';
    const angle = arrow || fire ? Math.atan2(pr.vy, pr.vx) : pr.kind === 'star' && !reduced ? pr.t * 16 : 0;
    const ratio = image.naturalWidth / image.naturalHeight;
    const variant = image === basicWeaponImage(BASIC_PROJECTILE_BRANCH.get(pr));
    const fireHeight = image === basicWeaponImage('fireball_big') ? 2.3 : 2;
    const w = pr.r * (arrow ? variant ? 7.2 : 4.8 : fire ? fireHeight * ratio : variant ? 3.3 : 2);
    const h = w / ratio;
    const anchor = arrow ? variant ? .87 : .77 : fire ? (variant ? .79 : .65) : .5;
    c.save();
    c.translate(pr.x, pr.y);
    c.rotate(angle);
    c.drawImage(image, -w * anchor, -h / 2, w, h);
    c.restore();
  }
  c.restore();
}



function drawBasicBeams(c, reduced) {
  const p = G.p, image = basicWeaponImage('beam');
  for (const w of p.weapons) {
    const b = w.bm;
    if (!b) continue;
    const summoner = w.base && p.job === 'summoner';
    const fade = clamp(Math.min((b.dur - b.t) * 6, summoner ? b.t * 18 + .15 : b.t * 12), 0, 1);
    const reach = summoner && !reduced ? clamp(.14 + b.t * 19, 0, 1) : 1;
    const angles = w.br === 'prism' ? [b.a - .3, b.a, b.a + .3] : [b.a];
    if (b.chain53) { for (const angle of angles) drawChain53(c, p, b, angle, fade); continue; }   // 0.53 소환사 영혼 사슬 (임시 도형)
    for (const angle of angles) {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(angle);
      if (image) {
        c.globalAlpha *= fade;
        if (reach < 1) {
          c.beginPath();
          c.rect(0, -b.wd, b.L * reach, b.wd * 2);
          c.clip();
        }
        c.drawImage(image, 0, -b.wd, b.L, b.wd * 2);
      } else {
        c.globalAlpha = .55 * fade;
        c.fillStyle = '#fff0a8';
        c.fillRect(0, -b.wd, b.L * reach, b.wd * 2);
        c.globalAlpha = fade;
        c.fillStyle = '#fff';
        c.fillRect(0, -b.wd * .25, b.L * reach, b.wd * .5);
      }
      c.restore();
    }
  }
}
