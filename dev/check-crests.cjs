// Verify the actual selection/codex integration and its decoding-failure path.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dev/art42'),report={checks:[],errors:[]};
fs.mkdirSync(out,{recursive:true});
const ok=(v,n)=>{if(!v)throw Error(n);report.checks.push(n)};
(async()=>{
 const server=http.createServer((req,res)=>{const f=path.join(root,new URL(req.url,'http://localhost').pathname==='/'?'index.html':new URL(req.url,'http://localhost').pathname);if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.statusCode=404;return res.end()}res.end(fs.readFileSync(f))}).listen(8799,'127.0.0.1');
 const browser=await chromium.launch({headless:true,executablePath:process.env.ART2_CHROMIUM_PATH});
 try{
  const p=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
  p.on('pageerror',e=>report.errors.push(e.message));await p.goto('http://127.0.0.1:8799/');
  await p.waitForFunction(()=>JOB_ORDER.every(id=>UI_ART.images['crest_'+id]));
  const meta=await p.evaluate(()=>({count:Object.keys(UI_JOB_CREST).length,unique:new Set(JOB_ORDER.map(id=>UI_JOB_CREST[id])).size,colors:JOB_ORDER.every(id=>decodeURIComponent(uiIcon('crest_'+id)).includes(JOB_COL[id])),game:JSON.stringify(G),save:localStorage.getItem(CFG.SAVE_KEY)}));
  ok(meta.count===10&&meta.unique===10&&meta.colors,'ten distinct silhouettes using the existing ten job colors');
  ok(await p.evaluate(()=>{newRun();G.storyOn=true;G.pendingStart=false;STATE.dev.speed=0;STATE.mode='select';const before=JSON.stringify(G),save=localStorage.getItem(CFG.SAVE_KEY);let calls=0;const old=Math.random;Math.random=()=>{calls++;return .5};try{for(const id of JOB_ORDER){choiceIcon({t:'job',id},cardInfo({t:'job',id}));cxJob(id,true)}return before===JSON.stringify(G)&&save===localStorage.getItem(CFG.SAVE_KEY)&&calls===0}finally{Math.random=old}}),'crest rendering preserves game state, save data and RNG');
  // Contact sheet at production icon sizes; independent of gameplay UI layout.
  await p.evaluate(()=>{const d=document.createElement('div');d.id='crest-sheet';d.style='position:fixed;inset:0;background:#202c36;z-index:999;padding:24px;display:grid;grid-template-columns:repeat(5,1fr);gap:12px;align-content:start;color:#f3e5c6';d.innerHTML=JOB_ORDER.map(id=>`<div style="text-align:center;padding:12px 0"><img width="48" height="48" src="${uiIcon('crest_'+id)}"><p>${JOBS[id].name}</p><img width="24" height="24" src="${uiIcon('crest_'+id)}"><img width="36" height="36" src="${uiIcon('crest_'+id)}"></div>`).join('');document.body.appendChild(d)});
  await p.setViewportSize({width:800,height:420});await p.locator('#crest-sheet img').evaluateAll(imgs=>Promise.all(imgs.map(im=>im.decode())));await p.screenshot({path:path.join(out,'crests-10.png')});await p.evaluate(()=>document.getElementById('crest-sheet').remove());
  for(const width of [320,390,690]){
   await p.setViewportSize({width,height:width===690?829:844});
   for(let i=0;i<10;i+=3){await p.evaluate(i=>{G.sel={kind:'job',cards:JOB_ORDER.slice(i,i+3).map(id=>({t:'job',id}))};renderSelect()},i);await p.waitForTimeout(80);ok(await p.locator('[data-job-crest]').evaluateAll(imgs=>imgs.length>0&&imgs.every(im=>im.complete&&im.naturalWidth===48&&im.getBoundingClientRect().width>=36)),'all first-job crests decode in selection '+width+'/'+i)}
   await p.evaluate(()=>{G.sel={kind:'job',cards:['warrior','rogue','sovereign'].map(id=>({t:'job',id}))};renderSelect()});await p.waitForTimeout(80);await p.screenshot({path:path.join(out,'selection-'+width+'.png')});
   await p.evaluate(()=>showCodex('j',()=>{}));await p.waitForTimeout(80);
   ok(await p.locator('[data-job-crest]').evaluateAll(imgs=>new Set(imgs.map(im=>im.dataset.jobCrest)).size===10&&imgs.every(im=>im.complete&&im.naturalWidth===48)),'all ten crests in codex '+width);
   ok(await p.evaluate(()=>UI.scrollWidth<=innerWidth+1),'codex has no horizontal overflow '+width);await p.screenshot({path:path.join(out,'codex-'+width+'.png')});
  }
  await p.evaluate(()=>{const im=document.querySelector('[data-job-crest]');im.src='data:image/svg+xml,broken'});
  await p.waitForFunction(()=>{const im=document.querySelector('[data-job-crest]');return im.hidden&&!im.previousElementSibling.hidden});
  ok(true,'image decoding failure restores the former letter icon');
  ok(await p.evaluate(()=>{G.p.job='warrior';const c={t:'job2',id:'warrior',k:JOB2.warrior[0].k};return !choiceIcon(c,cardInfo(c)).includes('data-job-crest')}),'second-job crests remain explicitly deferred');
  ok(report.errors.length===0,'no browser runtime errors');
 }finally{await browser.close();server.close();fs.writeFileSync(path.join(root,'dev/crests-validation.json'),JSON.stringify(report,null,2))}
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e.stack);process.exit(1)});
