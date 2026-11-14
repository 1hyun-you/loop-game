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
function effectBoundary(c,x,y,r,color,alpha=.35){
 c.save();c.globalAlpha=alpha;c.strokeStyle=color;c.lineWidth=1;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();c.restore();
}
function paintedRing(c,f,k,x,y){
 if(f.kind!=='ring')return false;
 const r=Math.max(1,lerp(f.r0,f.r1,1-(1-k)**2));
 const key=f.art||(f.element==='ice'?(f.fill?'shatter':'frost'):f.element==='earth'?'earth':effectKey(f.color,f.fill));
 if(!paintedEffect(c,key,x,y,r,(1-k)**1.5*.75,k*.2))return false;
 effectBoundary(c,x,y,r,f.color||'#dfcfaa',.42*(1-k));return true;
}
function paintedPool(c,z){
 const key={trail:'heal',vine:'vine',crack:'earth',fire:'fire'}[z.kind]||'fire',fade=clamp((z.dur-z.t)*3,0,1);
 if(!paintedEffect(c,key,z.x,z.y,z.r,.55*fade))return false;
 effectBoundary(c,z.x,z.y,z.r,z.kind==='fire'||!z.kind?'#ffcc8a':'#c0d5ad',.22*fade);return true;
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

function basicWeaponIcon(id) {
  return id === 'cleave' || id === 'shield' ? basicWeaponImage(id) : null;
}

function drawBasicWeaponIcon(c, id, image, size) {
  const w = size * (id === 'cleave' ? 1.04 : .89);
  const h = w * image.naturalHeight / image.naturalWidth;
  c.save();
  c.imageSmoothingEnabled = true;
  c.translate(size / 2, size / 2);
  if (id === 'cleave') c.rotate(-Math.PI / 4);
  c.drawImage(image, -w / 2, -h / 2, w, h);
  c.restore();
}

function basicWeaponProjectile(pr) {
  if (pr.kind === 'arrow' && (pr.src === 'arrow' || pr.src === 'split')) return basicWeaponImage('arrow');
  if (pr.kind === 'star' && pr.src === 'shuriken') return basicWeaponImage('shuriken');
  return null;
}

function drawBasicCleave(c, f, image, k, reduced) {
  const { artX: x, artY: y } = f;
  const start = f.a - f.arc / 2, end = f.a + f.arc / 2;
  const sweep = reduced ? 1 : clamp(k / .42, 0, 1);
  const angle = lerp(start, end, .08 + .84 * sweep);
  const tail = reduced ? start : Math.max(start, angle - f.arc * .7);
  const opacity = Math.min(1, (1 - k) / .48);
  const length = f.r * .77, thickness = length * image.naturalHeight / image.naturalWidth;
  c.globalAlpha = .37 * opacity;
  c.fillStyle = '#d5cec2';
  c.beginPath();
  c.arc(x, y, f.r, tail, angle);
  c.arc(x, y, f.r * .79, angle, tail, true);
  c.fill();
  c.translate(x, y);
  c.rotate(angle);
  c.globalAlpha = opacity;
  c.drawImage(image, f.r * .22, -thickness / 2, length, thickness);
}

function drawBasicWeaponWorld(c, inView) {
  const reduced = VFX.reduced.matches;
  c.save();
  c.imageSmoothingEnabled = true;
  for (const f of G.fx) {
    const image = basicWeaponImage(f.basicArt);
    if (!image || f.t >= f.dur || !inView(f.artX ?? f.x, f.artY ?? f.y, f.r || f.r1)) continue;
    const k = remap48(f, f.t / f.dur);
    c.save();
    if (f.basicArt === 'cleave') drawBasicCleave(c, f, image, k, reduced);
    else {
      const drop = reduced ? 1 : clamp(k / .29, 0, 1);
      const size = Math.min(33, f.r1 * .62);
      c.translate(f.x, f.y - 7 - (1 - drop) ** 2 * 23);
      c.scale(1, .76 + .22 * drop);
      c.globalAlpha = Math.min(1, (1 - k) / .58);
      c.drawImage(image, -size / 2, -size, size, size);
    }
    c.restore();
  }
  for (const pr of G.proj) {
    const image = basicWeaponProjectile(pr);
    if (!image || pr.dead || !inView(pr.x, pr.y, pr.r + 20)) continue;
    const arrow = pr.kind === 'arrow';
    const angle = arrow ? Math.atan2(pr.vy, pr.vx) : reduced ? 0 : pr.t * 16;
    const w = pr.r * (arrow ? 4.8 : 2);
    const h = w * image.naturalHeight / image.naturalWidth;
    c.save();
    c.translate(pr.x, pr.y);
    c.rotate(angle);
    c.drawImage(image, -w * (arrow ? .77 : .5), -h / 2, w, h);
    c.restore();
  }
  c.restore();
}
