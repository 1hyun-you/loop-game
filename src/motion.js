/* 0.40-motion1: visual poses only. Simulation hooks observe completed movement,
   weapon fire and confirmed hits. No game timers, hitboxes or RNG are changed.
   State lives outside G and is replaced for every run; drawing is read-only. */
const MOTION = { owner: null, actors: new WeakMap(), attack: null };
function motionState() {
  if (MOTION.owner !== G) { MOTION.owner = G; MOTION.actors = new WeakMap(); MOTION.attack = null; }
  return MOTION;
}
function motionActor(e) {
  const m = motionState(); let s = m.actors.get(e);
  if (!s) { s = { x:e.x, y:e.y, phase:(e.id || 0)*2.399, moving:false, flip:false, hit:null }; m.actors.set(e,s); }
  return s;
}
function motionSample(e, dt) {
  const s = motionActor(e), dx=e.x-s.x, dy=e.y-s.y, d=Math.hypot(dx,dy);
  // Teleports / offscreen recycling never become giant walking strides.
  s.moving = dt>0 && d>.03 && d<Math.max(16,dt*700);
  if (s.moving) s.phase=(s.phase+d/(e===G.p?5.5:e.gk?11:6.5))%(Math.PI*2);
  if (e===G.p) { if(e.face.x<-.05)s.flip=true;else if(e.face.x>.05)s.flip=false; }
  else s.flip=G.p.x<e.x;
  s.x=e.x;s.y=e.y;
}
const motionUpdatePlayer = updatePlayer;
updatePlayer = function(dt) { motionActor(G.p); const v=motionUpdatePlayer(dt);motionSample(G.p,dt);return v; };
const motionUpdateEnemies = updateEnemies;
updateEnemies = function(dt) {
  for(const e of G.enemies)if(!e.dead)motionActor(e);
  const v=motionUpdateEnemies(dt);
  for(const e of G.enemies)if(!e.dead)motionSample(e,dt);
  return v;
};
const motionFire = rcFire;
rcFire = function(w) {
  const v=motionFire(w),m=motionState();
  if(!VFX.reduced.matches && (!m.attack || G.time-m.attack.at>=.095)) {
    const cat=WEAPONS[w.id]?.cat,kind=cat==='melee'?'swing':cat==='magic'?'cast':'shot';
    const shot=G.proj.findLast(pr=>pr.src===w.id&&pr.t===0),arc=w.id==='cleave'?G.fx.findLast(f=>f.kind==='arc'&&f.t===0):null;
    m.attack={at:G.time,kind,a:arc?arc.a:shot?Math.atan2(shot.vy,shot.vx):aimAng()};
  }
  return v;
};
const motionHit = jHit;
jHit = function(e,dmg,o) {
  const v=motionHit(e,dmg,o);
  if(!VFX.reduced.matches && dmg>0) {
    const s=motionActor(e),old=s.hit;
    if(!old || G.time-old.at>=.085) {
      const dx=e.x-(o.fx??G.p.x),dy=e.y-(o.fy??G.p.y),d=Math.hypot(dx,dy)||1;
      s.hit={at:G.time,x:dx/d,y:dy/d,crit:!!o.crit};
    }
  }
  return v;
};
function motionPose(e,hero=false) {
  const s=MOTION.owner===G?MOTION.actors.get(e):null;
  const pose={x:0,y:0,sx:1,sy:1,a:0,frame:0,flip:s?s.flip:(hero?e.face.x<0:G.p.x<e.x)};
  if(VFX.reduced.matches)return pose;
  const stopped=e.frz>0||e.sleep||e.fixed||e.stunT>0;
  const moving=!stopped&&(s?s.moving:hero&&e.moving),phase=s?s.phase:0;
  const wave=Math.sin(phase),step=Math.abs(wave),air=e.type==='bat'||e.type==='wisp';
  pose.frame=moving?(wave<0?1:0):0;
  if(!stopped) {
    if(air) {pose.y=-.8-Math.sin(G.time*5+(e.id||0))*.65;pose.a=Math.sin(phase)*.025;pose.frame=Math.floor(G.time*8+(e.id||0))&1;}
    else if(moving) {
      const jelly=e.type==='slime'||e.type==='jelly',weight=e.gk?.45:e.type==='brute'||e.type==='knight'?.65:1;
      pose.sx=1+(jelly?.07:.018)*wave;pose.sy=1-(jelly?.065:.018)*wave;
      pose.y=-step*(jelly?1.35:1.1)*weight;pose.a=wave*.028*weight;
    } else if(hero) {pose.sy=1+Math.sin(G.time*2.8)*.007;}
  }
  // Existing telegraphs stay in world space. Only the body braces at its feet.
  if(!hero&&!stopped&&(e.tl>0||e.tele>0||e.ai?.act==='tele')) {pose.sy*=.95;pose.sx*=1.025;pose.a=0;}
  if(!hero&&!stopped&&(e.dsh>0||e.ai?.dash>0)) {pose.a=(pose.flip?1:-1)*.07;pose.sy*=.97;}
  const attack=hero&&MOTION.owner===G?MOTION.attack:null;
  if(attack) {
    const t=(G.time-attack.at)/.23;
    if(t>=0&&t<1) {
      // Sharp release at the real firing moment, then a soft settling motion.
      const q=(1-t)**2,settle=Math.sin(t*Math.PI*2)*(1-t)*.28;
      const swing=attack.kind==='swing',cast=attack.kind==='cast';
      pose.x+=Math.cos(attack.a)*(swing?1.3:-1.5)*q;
      pose.y+=Math.sin(attack.a)*(swing?.6:-.7)*q;
      pose.a+=(pose.flip?-1:1)*(swing?-.105:cast?.035:.055)*(q-settle);
      pose.sx*=1+(cast?.025:.055)*q;pose.sy*=1-(cast?.035:.04)*q;
    }
  }
  if(s?.hit) {
    const t=(G.time-s.hit.at)/.18;
    if(t>=0&&t<1) {
      const q=Math.sin(Math.min(1,t/.18)*Math.PI/2)*(1-t)**2,k=e.gk?.35:1;
      pose.x+=s.hit.x*q*(s.hit.crit?2.1:1.5)*k;pose.y+=s.hit.y*q*.65*k;
      pose.a+=s.hit.x*.065*q*k;pose.sx*=1+.05*q*k;pose.sy*=1-.05*q*k;
    }
  }
  return pose;
}
function motionTransform(c,x,by,p) {
  c.translate(x+p.x,by+p.y);c.rotate(p.a);c.scale(p.sx,p.sy);c.translate(-x,-by);
}
// Called after image layers, before main.js starts the frame loop.
drawHeroReact = function(c,fr,flip,tint) {
  const p=G.p,pose=motionPose(p,true),by=p.y+p.r*1.1;
  c.save();motionTransform(c,p.x,by,pose);
  drawSprite(c,'hero',pose.frame,p.x,by,{flip:pose.flip,tint,mode:p.flash>.12?'white':'n'});
  c.restore();
};
