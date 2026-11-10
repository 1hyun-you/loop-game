const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dev/scale'),report={checks:[],errors:[],viewports:[]};
fs.mkdirSync(out,{recursive:true});
function ok(v,n){if(!v)throw Error(n);report.checks.push(n);}
(async()=>{
 const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname;
  const f=name==='/baseline'?process.env.SCALE_BASELINE_HTML:path.join(root,name==='/'?'index.html':name);
  if(!f||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.statusCode=404;return res.end();}
  res.setHeader('Content-Type',f.endsWith('.woff2')?'font/woff2':'text/html');res.end(fs.readFileSync(f));
 }).listen(8793,'127.0.0.1');
 const browser=await chromium.launch({executablePath:process.env.ART2_CHROMIUM_PATH,headless:true});
 try{
  const p=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  p.on('pageerror',e=>report.errors.push(e.message));await p.goto('http://127.0.0.1:8793/');
  await p.waitForFunction(()=>typeof EFFECT_ART!=='undefined'&&EFFECT_ART.image&&ART3.loaded===4&&FIELD_ART.ready.hero);
  ok(await p.locator('.ver').innerText()==='v0.40-scale1','scale version and embedded art loaded');
  const baseline=process.env.SCALE_BASELINE_HTML?await browser.newPage():null;
  if(baseline){await baseline.goto('http://127.0.0.1:8793/baseline');await baseline.evaluate(()=>{STATE.mode='pause';});}
  await p.evaluate(()=>{newRun();G.pendingStart=false;G.storyOn=true;STATE.mode='pause';hideUI();STATE.dev.speed=0;STATE.dev.fps=false;STATE.dev.god=true;GD.cur=null;G.jc=null;G.p.weapons=[];for(const id of ['cleave','fireball','lightning','icering','orb'])addWeapon(id);G.p.passives=['vit','magnet','haste','might','regen'].map(id=>({id,lvl:3}));G.p.job='engineer';G.p.job2='mechanic';G.p.exw1={id:'engineer',t:.2};G.p.exw={id:'engineer',t:.5};recalc();G.p.x=G.p.y=0;G.p.hp=73;G.time=725;G.kills=12345;G.p.level=38;G.enemies=[];
   for(const [type,x,y]of [['slime',-65,95],['bat',80,45],['skel',-80,-65],['brute',80,-100]])G.enemies.push(makeEnemy(type,x,y));
   G.pools=[{x:-70,y:10,r:35,t:1,dur:5,kind:'fire'}];G.fx=[{kind:'arc',x:0,y:0,a:-.6,arc:1.9,r:86,t:.12,dur:.4,color:'#ffe1a1'}];
  });
  for(const [width,height]of [[280,653],[320,568],[390,844],[412,915],[690,829],[768,900],[844,390],[1366,768],[1366,300],[390,844]]){
   await p.setViewportSize({width,height});await p.waitForTimeout(1300);
   await p.evaluate(()=>{STATE.mode='play';syncPauseBtn();render();});
   const v=await p.evaluate(()=>{
    const L=hudLayout(),tiles=[];for(let i=0;i<5;i++)tiles.push(L.tile(i,0),L.tile(i,1));for(let i=0;i<2;i++)tiles.push(L.tile(i,0,true,2));for(let i=0;i<3;i++)tiles.push(L.tile(i,1,true,3));
    const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
    const before=JSON.stringify(G);drawHUD(ctx);const readOnly=before===JSON.stringify(G),r=PBTN.getBoundingClientRect();
    return {width:VIEW.cw,height:VIEW.ch,rotationNotice:getComputedStyle(document.querySelector('.rot')).display!=='none',zoom:VIEW.zoom,w:VIEW.w,h:VIEW.h,cameraW:VIEW.cameraW,cameraH:VIEW.cameraH,S:L.S,hudHeight:L.h,pause:{x:r.x,y:r.y,w:r.width,h:r.height},gap:L.pause.x-(L.kills.x+L.kills.w),bounded:tiles.every(t=>t.x>=L.x&&t.x+t.w<=L.x+L.contentW&&t.y+t.h<=L.y+L.h),overlap:tiles.some((a,i)=>tiles.some((b,j)=>j>i&&hit(a,b))),center:{x:VIEW.cameraW*VIEW.zoom/2,y:VIEW.cameraH*VIEW.zoom/2},readOnly,saveKey:CFG.SAVE_KEY};
   });report.viewports.push(v);
   ok(v.width===width&&v.height===height&&v.bounded&&!v.overlap&&v.S>=22&&v.gap>=8,'readable non-overlapping HUD '+width+'x'+height);
   ok(v.pause.w>=48&&v.pause.h>=48&&v.pause.x+v.pause.w<=width&&v.pause.y>=0&&v.readOnly,'pause target and read-only HUD '+width+'x'+height);
   ok(Math.abs(v.center.x-width/2)<.01&&Math.abs(v.center.y-height/2)<.01,'camera stays centered '+width+'x'+height);
   ok(v.rotationNotice===(width>height),'portrait play / existing landscape rotation notice '+width+'x'+height);
   if(baseline){await baseline.setViewportSize({width,height});await baseline.waitForTimeout(1300);
    const fixture=()=>{STATE.mode='pause';G.p.x=G.p.y=0;const random=Math.random;Math.random=()=>.25;const pos=ringPos();Math.random=random;return {w:VIEW.w,h:VIEW.h,spawn:pos,ultRadius:viewR(),saveKey:CFG.SAVE_KEY};};
    const a=await p.evaluate(fixture),b=await baseline.evaluate(fixture);ok(JSON.stringify(a)===JSON.stringify(b),'baseline spawn/ultimate viewport and save key '+width+'x'+height);
   }
   if([320,390,690,844].includes(width)){await p.evaluate(()=>{STATE.mode='play';syncPauseBtn();render();});await p.screenshot({path:path.join(out,'combat-'+width+'.png')});}
  }
  const safe=await p.evaluate(()=>[0,28].map(sat=>{const L=hudLayout(390,sat);return L.y===sat+6&&L.pause.y>=sat;}));ok(safe.every(Boolean),'safe area offsets');
  await p.evaluate(()=>{G.gkMob={gk:'demon',hp:640,maxHp:1000,st:1,dead:false,x:70,y:-70,r:30,flash:0};G.ph.id='demon';render();});await p.screenshot({path:path.join(out,'boss-390.png')});
  await p.evaluate(()=>{showTitle();openStart();});
  for(const [width,height]of [[320,568],[390,844],[690,829],[844,390]]){
   await p.setViewportSize({width,height});await p.waitForTimeout(1300);
   const card=await p.locator('.card').first().evaluate(e=>{const s=getComputedStyle(e.querySelector('.ds')),i=e.querySelector('.ic img').getBoundingClientRect();return {font:parseFloat(s.fontSize),icon:i.width,scroll:e.scrollWidth,client:e.clientWidth};});
   ok(card.font>=15&&card.icon>=44&&card.scroll<=card.client+1,'larger readable cards without horizontal overflow '+width);
   await p.screenshot({path:path.join(out,'cards-'+width+'.png')});
  }
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(1300);
  await p.evaluate(()=>{newRun();G.pendingStart=false;G.storyOn=true;hideUI();G.p.weapons=[];for(const id of ['cleave','fireball','icering','vortex'])addWeapon(id);recalc();STATE.dev.speed=1;STATE.dev.god=true;STATE.mode='play';});
  await p.waitForTimeout(4500);ok(await p.evaluate(()=>G.time>2&&!window.__errShown),'live mixed weapon combat');
  await p.locator('#pausebtn').click();ok(await p.evaluate(()=>STATE.mode==='pause'),'pause opens');await p.locator('#resume').click();ok(await p.evaluate(()=>STATE.mode==='play'),'resume works');
  await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>render());ok(report.errors.length===0,'no runtime errors, including reduced motion');
  if(baseline)await baseline.close();
  fs.writeFileSync(path.join(root,'dev/scale-validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
