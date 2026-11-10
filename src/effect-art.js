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
 if(Math.abs(x-G.p.x)>VIEW.w/2+r+60||Math.abs(y-G.p.y)>VIEW.h/2+r+60)return true;
 if(EFFECT_ART.count++>=(vfxLite()?48:96))return true;
 c.save();c.imageSmoothingEnabled=true;c.globalAlpha*=clamp(alpha,0,.78);
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
