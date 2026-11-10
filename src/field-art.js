/* 0.40-field1: static world decoration and contact shadows, no gameplay state/RNG. */
const FIELD_ENV={ground:null,props:null,loaded:0,patches:new Map(),stats:{patches:0,props:0},shadow:null};
for(const key of ['meadow','props']){const im=new Image();im.onload=()=>{FIELD_ENV[key==='meadow'?'ground':'props']=im;FIELD_ENV.loaded++;if(key==='meadow')ART2.groundCache.clear();};im.onerror=()=>console.warn('Field art unavailable; prior ground retained:',key);im.src=FIELD_DATA.images[key];}
function fieldHash(x,y,s=0){return hash2(x+s*71,y-s*43);}
function fieldPatch(kind,dark){
 const key=kind+'|'+dark;if(FIELD_ENV.patches.has(key))return FIELD_ENV.patches.get(key);
 const cv=document.createElement('canvas');cv.width=256;cv.height=160;const c=cv.getContext('2d');
 const g=c.createRadialGradient(128,80,8,128,80,124),col=kind?dark?'39,31,49':'28,58,39':dark?'139,124,147':'197,179,125';
 g.addColorStop(0,`rgba(${col},${kind?.16:.20})`);g.addColorStop(.55,`rgba(${col},${kind?.09:.12})`);g.addColorStop(1,`rgba(${col},0)`);
 c.filter='blur(11px)';c.fillStyle=g;c.beginPath();c.moveTo(22,83);c.bezierCurveTo(25,35,71,49,98,28);c.bezierCurveTo(133,10,171,34,204,39);c.bezierCurveTo(237,36,245,86,222,104);c.bezierCurveTo(196,133,167,114,137,136);c.bezierCurveTo(98,144,77,114,47,119);c.bezierCurveTo(28,122,20,100,22,83);c.fill();
 FIELD_ENV.patches.set(key,cv);return cv;
}
function fieldScenery(c,camX,camY,tid,alpha=1){
 if(alpha<=0)return;const dark=tid==='demon'||tid==='gate'||tid==='ritual',step=220;
 const x0=Math.floor((camX-230)/step),x1=Math.floor((camX+VIEW.cameraW+230)/step),y0=Math.floor((camY-230)/step),y1=Math.floor((camY+VIEW.cameraH+230)/step);
 c.save();c.imageSmoothingEnabled=true;c.globalAlpha*=alpha;
 for(let gy=y0;gy<=y1;gy++)for(let gx=x0;gx<=x1;gx++){
  const x=gx*step+(fieldHash(gx,gy,1)-.5)*80,y=gy*step+(fieldHash(gx,gy,2)-.5)*80,w=210+fieldHash(gx,gy,3)*150,h=100+fieldHash(gx,gy,4)*85;
  const radius=Math.hypot(w,h)/2;
  if(x+radius<camX||x-radius>camX+VIEW.cameraW||y+radius<camY||y-radius>camY+VIEW.cameraH)continue;
  c.save();c.translate(x,y);c.rotate((fieldHash(gx,gy,6)-.5)*1.3);c.drawImage(fieldPatch(fieldHash(gx,gy,5)>.55?1:0,dark),-w/2,-h/2,w,h);c.restore();FIELD_ENV.stats.patches++;
 }
 // Tiny flat decorations are drawn below every gameplay warning and entity.
 if(FIELD_ENV.props){const s=150;
  for(let gy=Math.floor((camY-45)/s);gy<=Math.floor((camY+VIEW.cameraH+45)/s);gy++)for(let gx=Math.floor((camX-45)/s);gx<=Math.floor((camX+VIEW.cameraW+45)/s);gx++){
   if(FIELD_ENV.stats.props>=36)break;const q=fieldHash(gx,gy,9);if(q>.60)continue;
   const x=gx*s+25+fieldHash(gx,gy,10)*100,y=gy*s+25+fieldHash(gx,gy,11)*100;
   const index=dark?1:q<.24?0:q<.39?2:q<.51?1:3,r=FIELD_DATA.meta.frames[index],w=index===1?25+fieldHash(gx,gy,13)*8:17+fieldHash(gx,gy,13)*9,h=w*r.h/r.w;
   if(x+w/2<camX||x-w/2>camX+VIEW.cameraW||y<camY||y-h>camY+VIEW.cameraH)continue;
   c.save();c.globalAlpha*=dark?.52:.82;c.drawImage(FIELD_ENV.props,r.x,r.y,r.w,r.h,x-w/2,y-h,w,h);c.restore();FIELD_ENV.stats.props++;
  }
 }
 c.restore();
}
function drawFieldScenery(c,camX,camY){
 FIELD_ENV.stats.patches=FIELD_ENV.stats.props=0;
 if(TER.k<1&&TER.prev)fieldScenery(c,camX,camY,TER.prev,1-TER.k);
 fieldScenery(c,camX,camY,TER.cur,TER.k);
}
function fieldContactShadow(c,x,footY,r,hover=false){
 if(!FIELD_ENV.shadow){const cv=document.createElement('canvas');cv.width=96;cv.height=48;const q=cv.getContext('2d');q.scale(2,1);const g=q.createRadialGradient(24,24,0,24,24,24);g.addColorStop(0,'rgba(29,24,35,.32)');g.addColorStop(.4,'rgba(29,24,35,.22)');g.addColorStop(1,'rgba(29,24,35,0)');q.fillStyle=g;q.fillRect(0,0,48,48);FIELD_ENV.shadow=cv;}
 c.save();c.globalAlpha*=hover?.55:1;c.drawImage(FIELD_ENV.shadow,x-r*1.3+1.5,footY-r*.5+1,r*2.6,r);
 if(!hover){c.fillStyle='rgba(26,23,32,.22)';c.beginPath();c.ellipse(x,footY,r*.65,r*.15,0,0,Math.PI*2);c.fill();}c.restore();
}
