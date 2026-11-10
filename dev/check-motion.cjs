const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dev/motion1'),report={checks:[],errors:[]};fs.mkdirSync(out,{recursive:true});
function ok(v,n){if(!v)throw Error(n);report.checks.push(n);}
(async()=>{
 const server=http.createServer((req,res)=>{const n=new URL(req.url,'http://localhost').pathname,f=n==='/baseline'?process.env.MOTION_BASELINE_HTML:path.join(root,n==='/'?'index.html':n);if(!f||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.statusCode=404;return res.end();}res.setHeader('Content-Type',f.endsWith('.woff2')?'font/woff2':'text/html');res.end(fs.readFileSync(f));}).listen(8795,'127.0.0.1');
 const browser=await chromium.launch({executablePath:process.env.ART2_CHROMIUM_PATH,headless:true});
 try{
  const p=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto('http://127.0.0.1:8795/');await p.waitForFunction(()=>ART3.loaded===4&&FIELD_ENV.loaded===2&&FIELD_ART.ready.hero);
  const setup=()=>{newRun();G.pendingStart=false;G.storyOn=true;hideUI();STATE.mode='pause';STATE.dev.speed=0;STATE.dev.fps=false;STATE.dev.god=true;G.p.x=G.p.y=0;G.p.face={x:1,y:0};G.p.weapons=[];addWeapon('cleave');recalc();G.time=15;G.enemies=[];for(const [type,x,y]of [['slime',-55,85],['bat',80,65],['skel',-80,-60],['brute',80,-100]])G.enemies.push(makeEnemy(type,x,y));G.pools=[];G.fx=[];G.ph.id='field';G.ph.inGap=false;G.ph.order=['field'];TER.cur='field';TER.prev=null;TER.k=1;};
  await p.evaluate(setup);
  report.poses=await p.evaluate(()=>{
   const p=G.p,c=document.createElement('canvas').getContext('2d');c.canvas.width=c.canvas.height=400;
   motionActor(p);p.x+=5;motionSample(p,1/30);const walk=motionPose(p,true);motionSample(p,1/30);const idle=motionPose(p,true);
   const attacks=[];for(const id of ['cleave','arrow','fireball']){MOTION.attack=null;rcFire({id,lvl:1});attacks.push({...motionPose(p,true)});}
   const e=G.enemies[0];jHit(e,1,{fx:e.x-10,fy:e.y});G.time+=.03;const hitRight=motionPose(e);G.time+=.2;jHit(e,1,{fx:e.x+10,fy:e.y,crit:true});G.time+=.03;const hitLeft=motionPose(e);
   const before=JSON.stringify(G),external=JSON.stringify({attack:MOTION.attack,hero:MOTION.actors.get(p),enemy:MOTION.actors.get(e)}),random=Math.random;let calls=0;Math.random=()=>{calls++;return .5;};c.globalAlpha=.73;c.lineWidth=7;
   for(let i=0;i<30;i++){drawHeroReact(c,0,false,heroTint());drawEnemySprites(c,G.enemies);}
   Math.random=random;
   const readOnly=before===JSON.stringify(G)&&external===JSON.stringify({attack:MOTION.attack,hero:MOTION.actors.get(p),enemy:MOTION.actors.get(e)}),restored=Math.abs(c.globalAlpha-.73)<.01&&c.lineWidth===7;
   const held=JSON.stringify(motionPose(e));for(let i=0;i<20;i++)drawEnemySprites(c,[e]);const pauseStable=held===JSON.stringify(motionPose(e));
   e.frz=1;const frozen=motionPose(e);e.frz=0;p.x+=1000;motionSample(p,1/60);const teleport=motionPose(p,true);
   const old=MOTION.actors;newRun();motionActor(G.p);const reset=MOTION.owner===G&&old!==MOTION.actors&&!MOTION.attack;
   return {walk,idle,attacks,hitRight,hitLeft,readOnly,restored,calls,pauseStable,frozen,teleport,reset};
  });const r=report.poses;
  ok(r.walk.y<0&&r.idle.y===0,'distance-driven walking stops without repaint-dependent stepping');
  ok(new Set(r.attacks.map(a=>a.a)).size===3,'melee ranged and magic use distinct release/recovery poses');
  ok(r.hitRight.x>0&&r.hitLeft.x<0,'confirmed-hit recoil follows incoming direction');
  ok(r.readOnly&&r.calls===0&&r.restored&&r.pauseStable,'repainting preserves game/animation state, random stream and canvas state');
  ok(r.frozen.frame===0&&r.teleport.y===0&&r.reset,'frozen bodies, teleports and new-run reset');
  report.bosses=await p.evaluate(()=>{
   const c=document.createElement('canvas').getContext('2d'),rows=[];c.canvas.width=c.canvas.height=500;
   for(const name of ['bargan','igna','morden','seren','demon'])for(const act of ['walk','tele','dash','hit']){
    const e=makeEnemy('brute',40,40);e.gk=name;e.r=30;e.ai={act:act==='tele'?'tele':null,dash:act==='dash'?.3:0};motionActor(e);e.x+=3;motionSample(e,.05);if(act==='hit'){jHit(e,2,{crit:true});G.time+=.03;}
    const before=JSON.stringify(G.hz),pose=motionPose(e);drawEnemySprites(c,[e]);rows.push({name,act,bounded:Math.abs(pose.x)<1&&Math.abs(pose.a)<.1&&pose.sx<1.15&&pose.sy>.85,hazards:before===JSON.stringify(G.hz)});
   }return rows;
  });ok(report.bosses.every(e=>e.bounded&&e.hazards),'five bosses: restrained walk/brace/dash/hit poses preserve danger geometry');
  await p.evaluate(setup);
  const sheet=await p.evaluate(()=>{
   const cv=document.createElement('canvas');cv.width=1000;cv.height=630;const c=cv.getContext('2d');c.fillStyle='#304032';c.fillRect(0,0,1000,630);c.font='16px sans-serif';c.fillStyle='#fff0ce';
   const names=['hero','slime','skel','brute','bargan'];
   for(let row=0;row<names.length;row++)for(let col=0;col<6;col++){
    const hero=names[row]==='hero',e=hero?G.p:makeEnemy(names[row]==='bargan'?'brute':names[row],0,0);if(names[row]==='bargan'){e.gk='bargan';e.r=26;}
    e.x=0;e.y=0;motionActor(e);const s=MOTION.actors.get(e);s.phase=col*Math.PI/3;s.moving=true;s.flip=false;
    c.save();c.translate(85+col*164,114+row*122);c.scale(2,2);fieldContactShadow(c,0,0,e.r);if(hero)drawHeroReact(c,0,false,heroTint());else drawEnemySprites(c,[e]);c.restore();
    if(col===0)c.fillText(names[row],8,24+row*122);
   }return cv.toDataURL('image/png');
  });fs.writeFileSync(path.join(out,'motion-poses.png'),Buffer.from(sheet.split(',')[1],'base64'));
  await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(setup);
  ok(await p.evaluate(()=>{const e=G.enemies[0];motionActor(e);e.x+=2;motionSample(e,.02);jHit(e,2,{crit:true});const q=motionPose(e);return q.x===0&&q.y===0&&q.a===0&&q.sx===1&&q.sy===1&&q.frame===0;}),'reduced motion disables added poses and impact accents');await p.emulateMedia({reducedMotion:'no-preference'});
  // Full deterministic simulation comparison, including weapon timers and RNG state.
  const replay=()=>{
   let seed=12345,calls=0;const random=Math.random;Math.random=()=>{calls++;seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   newRun();G.pendingStart=false;G.storyOn=true;hideUI();STATE.mode='pause';STATE.dev.god=true;STATE.dev.speed=1;G.p.weapons=[];for(const id of ['cleave','arrow','fireball','lightning','slam','icering'])addWeapon(id);recalc();
   let mv={x:1,y:0,m:1};const oldMove=moveVec;moveVec=()=>mv;
   for(let i=0;i<360;i++){if(i===180)mv={x:-1,y:.3,m:1};step(1/60);}
   moveVec=oldMove;Math.random=random;
   return {calls,seed,time:G.time,p:{x:G.p.x,y:G.p.y,hp:G.p.hp,xp:G.p.xp,inv:G.p.invT},weapons:G.p.weapons,stats:G.stats,enemies:G.enemies.map(e=>({id:e.id,x:e.x,y:e.y,hp:e.hp,kbx:e.kbx,kby:e.kby,dead:e.dead,ai:e.ai})),shots:G.proj.map(e=>({id:e.id,x:e.x,y:e.y,t:e.t,src:e.src})),save:CFG.SAVE_KEY};
  };
  const actual=await p.evaluate(replay);report.replay={calls:actual.calls,time:actual.time,enemies:actual.enemies.length};
  if(!process.env.MOTION_BASELINE_HTML)throw Error('MOTION_BASELINE_HTML is required for gameplay parity');
  const b=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});await b.goto('http://127.0.0.1:8795/baseline');await b.waitForFunction(()=>ART3.loaded===4);const expected=await b.evaluate(replay);fs.writeFileSync(path.join(out,'replay-actual.json'),JSON.stringify(actual));fs.writeFileSync(path.join(out,'replay-baseline.json'),JSON.stringify(expected));ok(JSON.stringify(actual)===JSON.stringify(expected),'360-tick baseline parity: positions, damage, weapon cooldowns, AI, projectiles, stats, save key and gameplay RNG');await b.close();
  for(const [width,height]of [[320,568],[390,844],[690,829]]){await p.setViewportSize({width,height});await p.evaluate(setup);await p.evaluate(()=>{motionActor(G.p);G.p.x+=4;motionSample(G.p,1/30);rcFire(G.p.weapons[0]);G.time+=.04;for(const e of G.enemies){motionActor(e);e.x+=3;motionSample(e,1/30);}render();});await p.screenshot({path:path.join(out,'combat-'+width+'.png')});}
  await p.setViewportSize({width:390,height:844});await p.evaluate(()=>{newRun();G.pendingStart=false;G.storyOn=true;hideUI();STATE.mode='play';STATE.dev.speed=1;STATE.dev.god=true;G.p.weapons=[];for(const id of ['cleave','arrow','fireball','lightning'])addWeapon(id);recalc();});await p.waitForTimeout(4000);ok(await p.evaluate(()=>G.time>2&&!window.__errShown),'live mixed combat');await p.locator('#pausebtn').click();ok(await p.evaluate(()=>STATE.mode==='pause'),'pause remains available');
  ok(report.errors.length===0,'no runtime errors');fs.writeFileSync(path.join(root,'dev/motion-validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks,errors:report.errors,replay:report.replay}));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
