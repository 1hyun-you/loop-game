const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dev/fx2'),report={checks:[],errors:[]};
fs.mkdirSync(out,{recursive:true});function ok(v,n){if(!v)throw Error(n);report.checks.push(n);}
(async()=>{
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');const f=path.join(root,url.pathname==='/'?'index.html':url.pathname);if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.statusCode=404;return res.end();}res.setHeader('Content-Type',f.endsWith('.woff2')?'font/woff2':f.endsWith('.png')?'image/png':f.endsWith('.webp')?'image/webp':'text/html');res.end(fs.readFileSync(f));}).listen(8792,'127.0.0.1');
 const browser=await chromium.launch({executablePath:process.env.ART2_CHROMIUM_PATH,headless:true});
 try{
 const p=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});p.on('pageerror',e=>report.errors.push(e.message));
 await p.goto('http://127.0.0.1:8792/');await p.waitForFunction(()=>typeof EFFECT_ART!=='undefined'&&EFFECT_ART.image&&ART3.loaded===4);
 ok(await p.locator('.ver').innerText()==='v0.40-fx2','version and embedded atlas loaded');
 await p.evaluate(()=>{newRun();STATE.mode='pause';hideUI();G.pendingStart=false;G.storyOn=true;G.p.job='engineer';G.p.job2='mechanic';G.p.exw1={id:'engineer',t:.4};G.p.exw={id:'engineer',t:1.1};G.p.weapons=[];for(const id of ['cleave','fireball','lightning','icering','orb'])addWeapon(id);G.p.passives=['vit','magnet','haste','might','regen'].map(id=>({id,lvl:3}));recalc();G.kills=12345;G.time=725;G.p.level=38;STATE.dev.fps=false;GD.cur=null;});
 report.layout=await p.evaluate(()=>{const rows=[];for(const width of [280,320,360,390,412,690,768,844,1366])for(const sat of [0,28]){
  const L=hudLayout(width,sat),tiles=[];for(let i=0;i<5;i++)tiles.push(L.tile(i,0),L.tile(i,1));for(let i=0;i<2;i++)tiles.push(L.tile(i,0,true,2));for(let i=0;i<3;i++)tiles.push(L.tile(i,1,true,3));const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  rows.push({width,sat,height:L.h,gap:L.pause.x-(L.kills.x+L.kills.w),bounded:tiles.every(t=>t.x>=L.x&&t.x+t.w<=L.x+L.contentW&&t.y+t.h<=L.y+L.h),overlap:tiles.some((a,i)=>tiles.some((b,j)=>j>i&&overlaps(a,b)))});
 }return rows;});ok(report.layout.every(x=>x.height===68&&x.gap>=8&&x.bounded&&!x.overlap),'compact layout, 8px pause separation and no slot collisions at 280–1366px');
 for(const [width,height]of [[320,568],[390,844],[412,915],[690,829],[844,390]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(1400);
  await p.evaluate(()=>{STATE.dev.speed=0;STATE.mode='play';syncPauseBtn();render();});
  const geom=await p.locator('#pausebtn').evaluate(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};});const L=await p.evaluate(()=>hudLayout());
  ok(Math.abs(geom.x-L.pause.x)<1&&Math.abs(geom.y-L.pause.y)<1&&geom.w>=44&&geom.h>=44,'actual pause coordinates '+width+'x'+height);
  await p.screenshot({path:path.join(out,'hud-'+width+'.png')});
 }
 await p.setViewportSize({width:690,height:829});await p.waitForTimeout(1400);
 report.effects=await p.evaluate(()=>{
  const cv=document.createElement('canvas');cv.width=cv.height=640;const c=cv.getContext('2d');c.fillStyle='#25392d';c.fillRect(0,0,640,640);
  const px=G.p.x,py=G.p.y;EFFECT_ART.count=0;for(let i=0;i<16;i++){const x=80+i%4*160,y=80+Math.floor(i/4)*160;c.save();c.translate(x-px,y-py);paintedEffect(c,EFFECT_DATA.names[i],px,py,65,.78);c.restore();c.fillStyle='#fff';c.font='12px sans-serif';c.fillText(EFFECT_DATA.names[i],x-40,y+76);}
  const before=JSON.stringify(G);c.globalAlpha=.73;c.lineWidth=7;let calls=0;const random=Math.random;Math.random=()=>{calls++;return .5};
  G.fx=[{kind:'ring',x:px,y:py,r0:4,r1:80,dur:1,t:.3,color:'#ff784a',fill:true}];const state=JSON.stringify(G);drawFx(c);const unchanged=state===JSON.stringify(G);G.fx=JSON.parse(before).fx;Math.random=random;
  const bounded=c.globalAlpha>.72&&c.globalAlpha<.74&&c.lineWidth===7;
  const im=EFFECT_ART.image;EFFECT_ART.image=null;EFFECT_ART.count=0;drawFx(c);paintedAura(c,'shield',px,py,20,.5);EFFECT_ART.image=im;
  return {sheet:cv.toDataURL('image/png'),readOnly:unchanged,randomCalls:calls,canvasState:bounded,names:EFFECT_DATA.names};
 });fs.writeFileSync(path.join(out,'effects.png'),Buffer.from(report.effects.sheet.split(',')[1],'base64'));delete report.effects.sheet;
 ok(report.effects.readOnly&&report.effects.randomCalls===0&&report.effects.canvasState,'effects preserve gameplay state, RNG and canvas state; missing-image fallback draws');
 report.jobs=await p.evaluate(()=>{const c=document.createElement('canvas').getContext('2d'),out=[];c.canvas.width=690;c.canvas.height=829;for(const job of Object.keys(JOBS))for(const variant of [null,...JOB2[job].map(j=>j.k)]){newRun();STATE.mode='pause';G.pendingStart=false;G.storyOn=true;G.p.job=job;G.p.job2=variant;G.p.exw1={id:job,t:.2};G.p.exw={id:job,t:.5};G.p.ult=JOB_CFG.ultNeed;recalc();useUlt();updateUltFx(.5);EFFECT_ART.count=0;drawHUD(c);drawUlt(c);out.push({job,variant});}return out;});ok(report.jobs.length===30,'all ten jobs, twenty advanced variants, dedicated weapons and ultimates render');
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(1400);
 await p.evaluate(()=>{newRun();G.pendingStart=false;G.storyOn=true;hideUI();STATE.mode='play';STATE.dev.speed=0;STATE.dev.fps=false;G.p.job='mage';G.p.shield=true;G.p.weapons=[{id:'icering',lvl:3,R:70},{id:'beam',lvl:2,bm:{a:-.6,L:130,wd:12,t:.3,dur:1}}];recalc();G.pools=[{x:-65,y:65,r:42,t:1,dur:5,kind:'fire'},{x:60,y:60,r:37,t:1,dur:5,kind:'vine'},{x:55,y:-80,r:30,t:1,dur:5,kind:'crack'}];G.vortex=[{x:-65,y:-65,R:40,t:.5,dur:3,spin:1}];G.fx=[{kind:'ring',art:'explosion',x:70,y:10,r0:10,r1:40,dur:1,t:.3,color:'#ff8844',fill:true}];syncPauseBtn();render();});await p.screenshot({path:path.join(out,'combat-390.png')});
 await p.evaluate(()=>{newRun();G.pendingStart=false;G.storyOn=true;G.p.job='mage';G.p.weapons=[];for(const id of ['fireball','icering','vortex','beam'])if(WEAPONS[id])addWeapon(id);recalc();STATE.dev.speed=1;STATE.dev.god=true;STATE.mode='play';hideUI();});await p.waitForTimeout(4500);
 ok(await p.evaluate(()=>G.time>2&&!window.__errShown),'live mixed spell combat');await p.locator('#pausebtn').click();ok(await p.evaluate(()=>STATE.mode==='pause'),'pause button opens pause');
 await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>{EFFECT_ART.count=0;render();});ok(report.errors.length===0,'reduced motion and no browser errors');
 fs.writeFileSync(path.join(root,'dev/fx2-validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
