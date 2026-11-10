const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'..'),report={checks:[],errors:[]};function ok(v,n){if(!v)throw Error(n);report.checks.push(n);}
(async()=>{
 const server=http.createServer((req,res)=>{let f=path.join(root,new URL(req.url,'http://localhost').pathname);if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!f.startsWith(root)||!fs.existsSync(f)){res.statusCode=204;return res.end();}res.setHeader('Content-Type',f.endsWith('.woff2')?'font/woff2':'text/html');res.end(fs.readFileSync(f));}).listen(8791,'127.0.0.1');
 const browser=await chromium.launch({executablePath:process.env.ART2_CHROMIUM_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 try{
 const p=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});p.on('pageerror',e=>report.errors.push(e.message));await p.goto('http://127.0.0.1:8791/');await p.waitForFunction(()=>typeof UI_ART!=='undefined'&&UI_ART.loaded===9&&ART3.loaded===4);
 ok(await p.locator('.ver').innerText()==='v0.40-fx2','new version');
 ok(await p.locator('.icb img').evaluateAll(es=>es.every(e=>e.complete&&e.naturalWidth===48)),'title vector icons loaded at native 48px');
 ok(await p.locator('#pausebtn').getAttribute('aria-label')==='일시정지','pause accessible name preserved');
 await p.screenshot({path:root+'/dev/ui-title-390.png'});
 await p.locator('#settings').click();ok(await p.locator('.pgt img').evaluateAll(es=>es.every(e=>e.complete&&e.naturalWidth===48)),'settings back icon loaded');await p.screenshot({path:root+'/dev/ui-settings-390.png'});
 await p.evaluate(()=>{newRun();STATE.mode='pause';hideUI();G.pendingStart=false;G.storyOn=true;G.p.job='engineer';G.p.job2='mechanic';G.p.exw1={id:'engineer',t:.4};G.p.exw={id:'engineer',t:1.1};G.p.ult=50;G.p.weapons=[];for(const id of ['cleave','fireball','lightning','icering','orb'])addWeapon(id);G.p.passives=['vit','magnet','haste','might','regen'].map(id=>({id,lvl:3}));recalc();G.p.hp=23;G.kills=12345;G.time=725;G.p.level=38;RC().xpShow=.72;STATE.dev.fps=false;GD.cur=null;});
 const rects=await p.evaluate(()=>{
  const out=[];for(const w of [280,320,360,390,768,1366])for(const safe of [0,28]){
   const L=hudLayout(w,safe),overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
   const tiles=[];for(let i=0;i<5;i++)tiles.push(L.tile(i,0),L.tile(i,1));for(let i=0;i<2;i++)tiles.push(L.tile(i,0,true,2));for(let i=0;i<3;i++)tiles.push(L.tile(i,1,true,3));
   out.push({w,safe,bounded:tiles.every(r=>r.x>=L.x&&r.x+r.w<=L.x+L.w&&r.y>=L.y&&r.y+r.h<=L.y+L.h),overlaps:tiles.some((a,i)=>tiles.some((b,j)=>j>i&&overlap(a,b)))});
  }return out;
 });report.layout=rects;ok(rects.every(x=>x.bounded&&!x.overlaps),'all loadout tiles fit without overlap at 280–1366px and safe-area offsets');
 const jobs=await p.evaluate(()=>{const c=document.createElement('canvas').getContext('2d');c.canvas.width=390;c.canvas.height=844;const out=[];for(const job of Object.keys(JOBS)){G.p.job=job;G.p.job2=null;G.p.exw1={id:job,t:.2};G.p.exw={id:job,t:.5};drawHUD(c);out.push({job,first:!!uiAbilityArt(job,true),second:!!uiAbilityArt(job,false)});}G.p.job='engineer';G.p.job2='mechanic';G.p.exw1={id:'engineer',t:.4};G.p.exw={id:'engineer',t:1.1};const before=JSON.stringify(G);drawHUD(c);return{out,readOnly:before===JSON.stringify(G)};});report.jobs=jobs;ok(jobs.out.length===10&&jobs.out.every(j=>j.first&&j.second),'all ten jobs and both dedicated tiers render');ok(jobs.readOnly,'HUD render does not mutate game state');
 for(const [w,h]of [[390,844],[320,568],[844,390]]){
  await p.setViewportSize({width:w,height:h});await p.waitForTimeout(1350);await p.evaluate(()=>{render();});
  await p.screenshot({path:root+`/dev/ui-hud-${w}.png`});
  const geom=await p.locator('#pausebtn').evaluate(e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,width:r.width,height:r.height};});
  // Button is hidden during pause; its geometry is inspected during live UI below.
  report['viewport'+w]={width:w,height:h,hud:await p.evaluate(()=>hudLayout())};
 }
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(1350);
 await p.evaluate(()=>{
  G.p.job=null;G.p.job2=null;G.p.exw1=G.p.exw=null;G.p.hp=G.p.maxHp;G.gkMob={gk:'demon',hp:640,maxHp:1000,st:1,dead:false};G.ph.id='demon';
 });
 // Force only the presentation phase predicate for a static boss-bar fixture.
 await p.evaluate(()=>{const c=document.getElementById('c').getContext('2d');c.setTransform(VIEW.dpr,0,0,VIEW.dpr,0,0);drawHUD(c);});
 await p.screenshot({path:root+'/dev/ui-boss-390.png'});
 await p.evaluate(()=>{G.gkMob=null;newRun();G.pendingStart=false;G.storyOn=true;G.p.job='engineer';G.p.weapons=[];addWeapon('fireball');recalc();STATE.dev.god=true;STATE.mode='play';hideUI();});await p.waitForTimeout(4500);
 const play=await p.evaluate(()=>({time:G.time,error:!!window.__errShown}));report.play=play;ok(play.time>2&&!play.error,'live engineer/fireball simulation');
 const pause=await p.locator('#pausebtn').evaluate(e=>{const r=e.getBoundingClientRect();return{w:r.width,h:r.height,x:r.x,right:r.right};});ok(pause.w>=44&&pause.h>=44&&pause.x>=0&&pause.right<=391,'44px pause target within screen');
 await p.locator('#pausebtn').click();ok(await p.evaluate(()=>STATE.mode==='pause'),'new pause icon opens pause screen');
 await p.evaluate(()=>{STATE.mode='play';GD.cur={tx:'적이 남긴 보석을 모으면 레벨 업 · 카드 1장 선택'};GD.t=1;});
 await p.setViewportSize({width:320,height:568});await p.waitForTimeout(1350);
 const guide=await p.evaluate(()=>{const c=document.createElement('canvas').getContext('2d');c.canvas.width=320;c.canvas.height=568;drawGuide(c);return Number.isFinite(VIEW.sab)&&!window.__errShown;});ok(guide,'wrapped guide rendering at 320px');
 ok(report.errors.length===0,'no runtime errors');fs.writeFileSync(root+'/dev/ui-validation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
