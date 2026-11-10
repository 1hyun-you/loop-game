const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'..'),report={checks:[],errors:[]};
function ok(v,n){if(!v)throw Error(n);report.checks.push(n);}
(async()=>{
 const server=http.createServer((req,res)=>{let file=new URL(req.url,'http://localhost').pathname==='/baseline' ? process.env.VFX_BASELINE_HTML : path.join(root,new URL(req.url,'http://localhost').pathname);if(file===root+'/')file+='index.html';if(!file||!fs.existsSync(file)){res.statusCode=204;return res.end();}res.setHeader('Content-Type',file.endsWith('.woff2')?'font/woff2':'text/html');res.end(fs.readFileSync(file));}).listen(8790,'127.0.0.1');
 const browser=await chromium.launch({executablePath:process.env.ART2_CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 try{
  const p=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto('http://127.0.0.1:8790/');await p.waitForFunction(()=>typeof VFX!=='undefined'&&ART3.loaded===4);
  const setup=()=>{newRun();G.pendingStart=false;G.storyOn=true;STATE.mode='pause';hideUI();G.enemies=[];G.fx=[];G.jc=null;G.p.job=null;G.p.invT=999;};
  await p.evaluate(setup);
  const checks=await p.evaluate(()=>{
   const c=document.createElement('canvas').getContext('2d');c.canvas.width=400;c.canvas.height=400;
   let calls=0;const random=Math.random;Math.random=()=>{calls++;return .5};
   for(let i=0;i<800;i++){burst(0,0,6,'#e2b16c');fx({kind:'ring',x:0,y:0,r0:5,r1:45,dur:.3,color:'#e2b16c',fill:true});}
   Math.random=random;
   const caps={particles:JC().pt.length,effects:G.fx.length,randomCalls:calls};
   const before=JSON.stringify(G);c.globalAlpha=.73;c.globalCompositeOperation='source-over';c.lineWidth=7;
   for(let i=0;i<10;i++){drawFx(c);drawJuice(c);drawVfxTrails(c,()=>true);drawReactTop(c);}
   const readOnly=before===JSON.stringify(G),stateOK=c.globalCompositeOperation==='source-over'&&c.lineWidth===7&&Math.abs(c.globalAlpha-.73)<.01;
   for(let i=0;i<50;i++)vfxGlow(c,0,0,2,`hsl(${i*7},50%,50%)`,.3);
   const cache=VFX.cache.size;
   for(let i=0;i<120;i++)updateMisc(1/60);
   const expired=!G.fx.length&&!JC().pt.length;
   const old=G.vfx;newRun();const reset=!G.vfx;vfxState();
   return {caps,readOnly,stateOK,cache,expired,reset,differentState:G.vfx!==old};
  });report.lifecycle=checks;
  ok(checks.caps.particles===180&&checks.caps.effects===220,'particle and effect caps under 800 bursts');
  ok(checks.caps.randomCalls===0,'visual particles do not consume gameplay Math.random');
  ok(checks.readOnly,'repainting paused effects leaves game state unchanged');ok(checks.stateOK,'canvas stroke/composite state restored');ok(checks.cache===16,'glow cache capped at 16');ok(checks.expired,'particles/effects expire through simulation updates');ok(checks.reset&&checks.differentState,'new run resets visual state');
  const mechanics=()=>{
   newRun();STATE.mode='pause';hideUI();G.p.job=null;G.p.weapons=[];G.p.passives=[];G.p.relics=[];recalc();G.enemies=[];G.fx=[];G.pendingStart=false;
   const mk=(id,x,y)=>({id,x,y,r:8,hp:1000,mhp:1000,maxHp:1000,type:'slime',color:'#a1bd8b',xp:0,kbx:0,kby:0,flash:0});
   const a=mk(1,20,0),b=mk(2,90,0),d=mk(3,-20,0);G.enemies=[a,b,d];gridBuild(G.enemies);
   explode(0,0,45,25,'bomb');slash(0,Math.PI/2,60,10,30);
   const snapshot=G.enemies.map(e=>({hp:e.hp,kbx:e.kbx,kby:e.kby}));
   G.p.hp=G.p.maxHp-30;heal(15,'test');const healed=G.p.hp;
   const rings=G.fx.filter(f=>f.kind==='ring'||f.kind==='arc').map(f=>({kind:f.kind,r:f.r,r0:f.r0,r1:f.r1,arc:f.arc,dur:f.dur}));
   return {snapshot,healed,damage:G.stats.dmg,rings,saveKey:CFG.SAVE_KEY};
  };
  const actual=await p.evaluate(mechanics);report.mechanics=actual;
  if(process.env.VFX_BASELINE_HTML){const b=await browser.newPage();await b.goto('http://127.0.0.1:8790/baseline');const expected=await b.evaluate(mechanics);ok(JSON.stringify(actual)===JSON.stringify(expected),'baseline parity: explosion/sector hits, knockback, damage, healing, ranges, durations and save key');await b.close();}
  else ok(actual.snapshot[0].hp===965&&actual.snapshot[1].hp===1000&&actual.snapshot[2].hp===975,'explosion and sector boundary fixture');
  await p.evaluate(setup);
  // Full effect contact sheet: same times/geometry, repeated paints must be stable.
  await p.setViewportSize({width:1000,height:660});
  await p.evaluate(()=>{
   const cv=document.createElement('canvas');cv.id='vfx-sheet';cv.width=2000;cv.height=1320;cv.style='position:fixed;inset:0;width:1000px;height:660px;z-index:100';document.body.appendChild(cv);const c=cv.getContext('2d');c.scale(2,2);c.fillStyle='#3d5445';c.fillRect(0,0,1000,660);
   const kinds=['arc','ring','bolt','zap','slash','glint','ice'];
   for(let row=0;row<3;row++)for(let i=0;i<7;i++){
    const x=i*140+80,y=row*210+180,k=[.08,.4,.8][row];G.p.x=x;G.p.y=y;
    const f={kind:kinds[i]==='ice'?'ring':kinds[i],x,y,x2:x+38,y2:y-60,a:-Math.PI/2,arc:Math.PI,r:46,r0:8,r1:48,dur:1,t:k,color:i===1?'#e9a25f':'#bcd9e7',fill:i===1,element:i===6?'ice':null};G.fx=[f];drawSpriteC(c,'slime',0,x,y);drawFx(c);
    c.globalAlpha=1;c.fillStyle='#eee3c5';c.font='12px sans-serif';c.textAlign='center';c.fillText(kinds[i]+' '+k,x,y+22);
   }
  });await p.screenshot({path:root+'/dev/vfx-contact.png'});
  await p.evaluate(()=>document.getElementById('vfx-sheet').remove());await p.setViewportSize({width:390,height:844});
  await p.evaluate(()=>{newRun();G.pendingStart=false;G.storyOn=true;G.p.invT=0;STATE.dev.god=true;G.p.weapons=[];for(const id of ['cleave','fireball','lightning','icering','orb'])addWeapon(id);recalc();STATE.mode='play';hideUI();});
  await p.waitForTimeout(6000);const play=await p.evaluate(()=>({time:G.time,error:!!window.__errShown,particles:JC().pt.length}));report.play=play;ok(play.time>3&&!play.error,'live mixed melee/fire/lightning/ice gameplay');
  await p.screenshot({path:root+'/dev/vfx-game-390.png'});await p.evaluate(()=>{STATE.mode='pause'});
  await p.emulateMedia({reducedMotion:'reduce'});ok(await p.evaluate(()=>VFX.reduced.matches&&vfxLite()),'reduced-motion changes detected without reload');
  await p.evaluate(()=>{G.fx=[];G.proj=[{x:0,y:0,vx:100,vy:0,t:1,r:3}];const cv=document.createElement('canvas');cv.width=100;cv.height=100;const c=cv.getContext('2d');c.translate(50,50);drawVfxTrails(c,()=>true);window.__trailAlpha=c.getImageData(0,0,100,100).data.some((n,i)=>i%4===3&&n>0);});ok(!await p.evaluate(()=>window.__trailAlpha),'reduced-motion suppresses projectile accents');
  await p.emulateMedia({reducedMotion:'no-preference'});
  // CPU render microbenchmark, not a phone FPS claim. 400 projectiles + 120 FX + 180 particles.
  report.renderBenchmark=await p.evaluate(()=>{
   STATE.mode='pause';G.p.x=G.p.y=0;STATE.fps=60;G.proj=[];G.fx=[];JC().pt=[];
   for(let i=0;i<400;i++)G.proj.push({x:(i%20)*15-150,y:Math.floor(i/20)*22-220,r:4,t:.5,vx:180,vy:-40,color:'#d3b68a',kind:'fire'});
   for(let i=0;i<120;i++)G.fx.push({kind:['ring','bolt','arc','zap'][i%4],x:(i%12)*24-144,y:Math.floor(i/12)*30-150,x2:60,y2:0,r0:4,r1:25,r:45,a:0,arc:2,dur:1,t:.4,color:'#abc4d0',fill:i%4===0});
   burst(0,0,180,'#c9ad7c');const c=document.createElement('canvas').getContext('2d');c.canvas.width=390;c.canvas.height=844;c.translate(195,422);
   const times=[];for(let i=0;i<140;i++){const t=performance.now();c.clearRect(-195,-422,390,844);drawVfxTrails(c,()=>true);drawFx(c);drawJuice(c);if(i>19)times.push(performance.now()-t);}
   times.sort((a,b)=>a-b);return {fixture:{projectiles:400,effects:120,particles:180},meanMs:times.reduce((s,n)=>s+n,0)/times.length,p95Ms:times[Math.floor(times.length*.95)],samples:times.length};
  });ok(report.renderBenchmark.meanMs<16.7,'stress VFX render CPU mean below 16.7ms on QA Chromium');
  await p.setViewportSize({width:320,height:568});await p.evaluate(()=>showTitle());ok(await p.locator('.ver').innerText()==='v'+await p.evaluate(()=>CFG.VERSION),'320px title version');ok(report.errors.length===0,'no JavaScript runtime errors');
  fs.writeFileSync(root+'/dev/vfx-validation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
