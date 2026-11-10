const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dev/art42'),report={checks:[],errors:[]};fs.mkdirSync(out,{recursive:true});
const ok=(v,n)=>{if(!v)throw Error(n);report.checks.push(n)};
(async()=>{
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost').pathname,f=u==='/baseline'?process.env.CHOICE_BASELINE_HTML:path.join(root,u==='/'?'index.html':u);if(!f||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.statusCode=404;return res.end()}res.end(fs.readFileSync(f))}).listen(8798,'127.0.0.1');
 const browser=await chromium.launch({headless:true,executablePath:process.env.ART2_CHROMIUM_PATH});
 try{
 const p=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});p.on('pageerror',e=>report.errors.push(e.message));await p.goto('http://127.0.0.1:8798/');await p.waitForFunction(()=>Object.keys(UI_JOB2_CREST).every(k=>UI_ART.images['crest_'+k]));
 const b=await browser.newPage();await b.goto('http://127.0.0.1:8798/baseline');
 const fixture=()=>{newRun();G.pendingStart=false;G.storyOn=true;STATE.dev.speed=0;STATE.dev.auto=false;STATE.mode='select';return JOB_ORDER.map(id=>{G.p.job=id;return JOB2[id].concat(JOB2_STAT).map(o=>{const c={t:'job2',id,k:o.k};return {c,info:cardInfo(c)}})})};
 ok(JSON.stringify(await p.evaluate(fixture))===JSON.stringify(await b.evaluate(fixture)),'all 30 second-job choices and full descriptions equal art1 baseline');
 ok(await p.evaluate(()=>{const entries=Object.entries(UI_JOB2_CREST);return entries.length===20&&new Set(entries.map(([k])=>UI_PATH['crest_'+k])).size===20&&JOB_ORDER.every(id=>JOB2[id].every(o=>UI_JOB2_CREST[o.k].job===id&&decodeURIComponent(uiIcon('crest_'+o.k)).includes(JOB_COL[id])&&UI_PATH['crest_'+o.k].includes(UI_JOB_CREST[id].replace(/@/g,JOB_COL[id]))))}),'20 unique specializations retain parent motif and JOB_COL');
 ok(await p.evaluate(()=>{const before=JSON.stringify(G),save=localStorage.getItem(CFG.SAVE_KEY),old=Math.random;let calls=0;Math.random=()=>{calls++;return .5};try{for(const id of JOB_ORDER){for(const o of JOB2[id])choiceIcon({t:'job2',id,k:o.k},cardInfo({t:'job2',id,k:o.k}));cxJob(id,true)}return before===JSON.stringify(G)&&save===localStorage.getItem(CFG.SAVE_KEY)&&calls===0}finally{Math.random=old}}),'all specialization rendering preserves game, saves and gameplay RNG');
 await p.setViewportSize({width:1000,height:670});await p.evaluate(()=>{const d=document.createElement('div');d.id='job2-sheet';d.style='position:fixed;inset:0;background:#202c36;z-index:999;padding:20px;display:grid;grid-template-columns:repeat(5,1fr);gap:10px;align-content:start;color:#f3e5c6';d.innerHTML=JOB_ORDER.flatMap(id=>JOB2[id].map(o=>`<div style="text-align:center"><img width="48" height="48" src="${uiIcon('crest_'+o.k)}"><p style="margin:4px">${JOBS[id].name} · ${o.nm}</p><img width="24" height="24" src="${uiIcon('crest_'+o.k)}"><img width="38" height="38" src="${uiIcon('crest_'+o.k)}"></div>`)).join('');document.body.appendChild(d)});await p.locator('#job2-sheet img').evaluateAll(imgs=>Promise.all(imgs.map(im=>im.decode())));await p.screenshot({path:path.join(out,'job2-crests-20.png')});await p.evaluate(()=>document.getElementById('job2-sheet').remove());
 for(const width of [320,390,690]){
 await p.setViewportSize({width,height:width===690?829:844});
 for(const id of await p.evaluate(()=>JOB_ORDER)){
 await p.evaluate(id=>{newRun();G.pendingStart=false;G.storyOn=true;STATE.dev.speed=0;STATE.dev.auto=false;G.p.job=id;STATE.mode='select';G.sel={kind:'job2',cards:JOB2[id].concat(JOB2_STAT).map(o=>({t:'job2',id,k:o.k}))};renderSelect()},id);await p.waitForTimeout(80);
 ok(await p.locator('[data-job2-crest]').evaluateAll(imgs=>imgs.length===2&&imgs.every(im=>im.complete&&im.naturalWidth===48&&im.getBoundingClientRect().width>=36)),'both specializations decode '+width+'/'+id);
 ok(await p.evaluate(()=>UI.scrollWidth<=innerWidth+1&&UI.querySelectorAll('.card').length===3),'three choices retain width '+width+'/'+id);
 if(id==='warrior'||id==='druid')await p.screenshot({path:path.join(out,'job2-'+id+'-'+width+'.png')});
 if(width===390){
 for(const index of [0,1]){
 await p.evaluate(index=>{G.p.job2=null;G.sel.pick=null;renderSelect()},index);
 // Select via the same production click handler, including mandatory confirmation.
 await p.locator('.card').nth(index).click();ok(await p.evaluate(()=>!G.p.job2),'first tap awaits confirmation '+id+'/'+index);
 await p.locator('.card').nth(index).click();ok(await p.evaluate(({id,index})=>G.p.job2===JOB2[id][index].k,{id,index}),'second tap applies existing specialization '+id+'/'+index);
 await p.evaluate(id=>{STATE.mode='select';G.sel={kind:'job2',cards:JOB2[id].concat(JOB2_STAT).map(o=>({t:'job2',id,k:o.k}))};renderSelect()},id);
 }
 }
 }
 await p.evaluate(()=>{showCodex('j',()=>{});UI.querySelectorAll('details').forEach(el=>el.open=true)});await p.waitForTimeout(80);
 ok(await p.locator('[data-job2-crest]').evaluateAll(imgs=>imgs.length===20&&imgs.every(im=>im.complete&&im.naturalWidth===48)),'all 20 crests decode in expanded codex '+width);
 ok(await p.evaluate(()=>UI.scrollWidth<=innerWidth+1),'expanded codex width '+width);await p.screenshot({path:path.join(out,'job2-codex-'+width+'.png')});
 }
 const count=await p.locator('[data-job2-crest]').count();for(let i=0;i<count;i++){await p.locator('[data-job2-crest]').nth(i).evaluate(im=>im.src='data:image/svg+xml,broken');}
 await p.waitForFunction(()=>[...document.querySelectorAll('[data-job2-crest]')].every(im=>im.hidden&&!im.previousElementSibling.hidden));ok(true,'all 20 decoding failures restore parent job letters');
 ok(await p.evaluate(()=>!uiJob2Crest('warrior','veteran').includes('data-job2-crest')&&!uiJob2Crest('rogue','berserk').includes('data-job2-crest')),'common veteran and invalid parent retain generic crest');
 await p.emulateMedia({reducedMotion:'reduce'});ok(await p.evaluate(()=>uiJob2Crest('warrior','guard').includes('data-job2-crest')),'reduced motion retains static specialization icon');
 ok(report.errors.length===0,'no browser runtime errors');await b.close();
 }finally{await browser.close();server.close();fs.writeFileSync(path.join(root,'dev/job2-crests-validation.json'),JSON.stringify(report,null,2))}
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e.stack);process.exit(1)});
