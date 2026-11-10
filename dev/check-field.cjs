const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http'),sharp=require('sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dev/field1'),report={checks:[],errors:[]};fs.mkdirSync(out,{recursive:true});
function ok(v,n){if(!v)throw Error(n);report.checks.push(n);}
(async()=>{
 const alpha=await sharp(path.join(root,'assets/field1/props.webp')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const data=alpha.data;let transparent=0;for(let i=3;i<data.length;i+=4)if(data[i]===0)transparent++;
 ok(transparent/(data.length/4)>.55,'optimized props retain real transparent margins');
 const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname,f=name==='/baseline'?process.env.FIELD_BASELINE_HTML:path.join(root,name==='/'?'index.html':name);if(!f||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.statusCode=404;return res.end();}res.setHeader('Content-Type',f.endsWith('.woff2')?'font/woff2':'text/html');res.end(fs.readFileSync(f));}).listen(8794,'127.0.0.1');
 const browser=await chromium.launch({executablePath:process.env.ART2_CHROMIUM_PATH,headless:true});
 try{
  const p=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto('http://127.0.0.1:8794/');await p.waitForFunction(()=>typeof FIELD_ENV!=='undefined'&&FIELD_ENV.loaded===2&&ART3.loaded===4&&FIELD_ART.ready.hero);
  ok(await p.locator('.ver').innerText()==='v'+await p.evaluate(()=>CFG.VERSION),'field version and both embedded assets loaded');
  const seams=await p.evaluate(()=>{const cv=document.createElement('canvas');cv.width=cv.height=512;const c=cv.getContext('2d',{willReadFrequently:true});c.fillStyle=groundPattern(c,'field');c.fillRect(0,0,512,512);const d=c.getImageData(0,0,512,512).data;let max=0;for(let i=0;i<512;i++)for(let k=0;k<3;k++)max=Math.max(max,Math.abs(d[(i*512)*4+k]-d[(i*512+511)*4+k]),Math.abs(d[i*4+k]-d[(511*512+i)*4+k]));return max;});ok(seams===0,'opposing terrain edge pixels match after cached seam blend');
  const fixture=()=>{newRun();G.pendingStart=false;G.storyOn=true;hideUI();STATE.mode='pause';STATE.dev.speed=0;STATE.dev.fps=false;STATE.dev.god=true;GD.cur=null;G.jc=null;G.p.x=G.p.y=0;G.p.face={x:1,y:0};G.p.weapons=[];addWeapon('cleave');recalc();G.p.hp=100;G.time=15;G.enemies=[];for(const [type,x,y]of [['slime',-55,85],['bat',80,65],['skel',-80,-60],['brute',80,-100]])G.enemies.push(makeEnemy(type,x,y));G.pools=[];G.fx=[];G.ph.id='field';G.ph.inGap=false;G.ph.order=['field'];TER.cur='field';TER.prev=null;TER.k=1;};
  await p.evaluate(fixture);await p.screenshot({path:path.join(out,'after-390.png')});
  if(process.env.FIELD_BASELINE_HTML){const b=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});await b.goto('http://127.0.0.1:8794/baseline');await b.waitForFunction(()=>ART3.loaded===4&&FIELD_ART.ready.hero);await b.evaluate(fixture);await b.screenshot({path:path.join(out,'before-390.png')});await b.close();}
  report.render=await p.evaluate(()=>{
   const cv=document.createElement('canvas');cv.width=500;cv.height=500;const c=cv.getContext('2d',{willReadFrequently:true}),before=JSON.stringify(G);let randoms=0;const random=Math.random;Math.random=()=>{randoms++;return .5};
   c.globalAlpha=.73;c.lineWidth=7;drawFieldScenery(c,-200,-200);fieldContactShadow(c,100,100,12);const state=c.globalAlpha>.72&&c.globalAlpha<.74&&c.lineWidth===7;
   c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.clearRect(0,0,500,500);drawFieldScenery(c,0,0);const a=c.getImageData(0,0,500,500).data.slice();c.clearRect(0,0,500,500);drawFieldScenery(c,0,0);const b=c.getImageData(0,0,500,500).data;let equal=true;for(let i=0;i<a.length;i++)if(a[i]!==b[i]){equal=false;break;}
   Math.random=random;
   const order=[],old=drawFieldScenery,hazard=drawBossGround,actor=drawPlayer;drawFieldScenery=(...args)=>{order.push('scenery');return old(...args);};drawBossGround=(...args)=>{order.push('danger');return hazard(...args);};drawPlayer=(...args)=>{order.push('player');return actor(...args);};render();drawFieldScenery=old;drawBossGround=hazard;drawPlayer=actor;
   return {randoms,state,deterministic:equal,readOnly:before===JSON.stringify(G),order,props:FIELD_ENV.stats.props,patchCache:FIELD_ENV.patches.size};
  });
  ok(report.render.randoms===0&&report.render.deterministic,'static decoration is deterministic and consumes no gameplay random numbers '+JSON.stringify(report.render));
  // The existing player renderer writes its animation trackers; inspect the new helpers alone below.
  ok(await p.evaluate(()=>{const before=JSON.stringify(G),c=document.createElement('canvas').getContext('2d');drawFieldScenery(c,-200,-200);fieldContactShadow(c,20,20,10);return before===JSON.stringify(G);}), 'scenery and shadows do not mutate gameplay state');
  ok(report.render.state&&report.render.props<=36&&report.render.patchCache<=4,'canvas state and decoration cache/budget bounded');
  ok(report.render.order.join(',')==='scenery,danger,player','all scenery rendered underneath danger areas and characters');
  report.terrains=[];
  for(const tid of ['field','calm','fog','camp','surge','warband','hunt','siege','seal','escort','ritual','collapse','gate','demon']){
   const v=await p.evaluate(tid=>{TER.cur=tid;TER.prev='field';TER.k=.5;const before=JSON.stringify(G);render();return {tid,props:FIELD_ENV.stats.props,cache:ART2.groundCache.size,valid:!window.__errShown};},tid);report.terrains.push(v);
  }ok(report.terrains.every(v=>v.valid&&v.props<=36&&v.cache<=16),'all fourteen terrain colors and crossfades render');
  await p.evaluate(()=>{TER.cur='field';TER.prev=null;TER.k=1;});
  for(const [width,height]of [[320,568],[390,844],[690,829],[390,844]]){
   await p.setViewportSize({width,height});await p.waitForTimeout(1300);await p.evaluate(()=>render());await p.screenshot({path:path.join(out,'field-'+width+'.png')});
  }
  report.sprites=await p.evaluate(()=>{const names=['hero','slime','bat','brute','bargan','demon','wolf','bear'],out=[];for(const name of names)for(const mode of ['n','white','gold'])for(const flip of [false,true])for(const fr of [0,1]){const s=getSprite(name,fr,{mode,flip});const c=s.cv.getContext('2d'),d=c.getImageData(0,0,s.cv.width,s.cv.height).data;let border=false;for(let x=0;x<s.cv.width;x++)if(d[x*4+3]||d[((s.cv.height-1)*s.cv.width+x)*4+3])border=true;out.push({name,mode,fr,flip,clearTopBottom:!border});}return out;});
  ok(report.sprites.filter(s=>s.mode==='n').every(s=>s.clearTopBottom),'normal character outlines have transparent top/bottom safety margins');
  await p.evaluate(()=>{const g=FIELD_ENV.ground,pr=FIELD_ENV.props;FIELD_ENV.ground=FIELD_ENV.props=null;ART2.groundCache.clear();render();FIELD_ENV.ground=g;FIELD_ENV.props=pr;ART2.groundCache.clear();});ok(await p.evaluate(()=>!window.__errShown),'missing field image falls back to prior ground and skips props');
  await p.evaluate(()=>{newRun();G.pendingStart=false;G.storyOn=true;hideUI();STATE.mode='play';STATE.dev.speed=1;STATE.dev.god=true;G.p.weapons=[];for(const id of ['cleave','fireball','lightning','icering'])addWeapon(id);recalc();});await p.waitForTimeout(4500);
  ok(await p.evaluate(()=>G.time>2&&!window.__errShown),'live mixed combat on new field');await p.locator('#pausebtn').click();ok(await p.evaluate(()=>STATE.mode==='pause'),'pause works');
  await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>render());ok(report.errors.length===0,'reduced motion and no runtime errors');
  fs.writeFileSync(path.join(root,'dev/field-validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks,errors:report.errors,render:report.render}));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
