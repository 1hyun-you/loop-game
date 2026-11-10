const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dev/art42'),report={checks:[],errors:[]};fs.mkdirSync(out,{recursive:true});
const ok=(v,n)=>{if(!v)throw Error(n);report.checks.push(n)};
function prepare(id){newRun();G.pendingStart=false;G.storyOn=true;STATE.dev.speed=0;STATE.dev.auto=false;STATE.mode='play';G.p.job=id;G.p.weapons=[];v42Update(0);JC()}
function trials(){
 const old=Math.random;Math.random=()=>.5;
 try{return JOB_ORDER.map(id=>{
 prepare(id);const f=F42(),T=FZ_TRIAL[id],points=[];
 const set=v=>{if(T.k==='hurt')f.hurt=v*G.p.maxHp;else if(T.k==='kills')G.kills=f.base.kills+v;else if(T.k==='elite')G.stats.eliteKills=f.base.elite+v;else if(T.k==='ult')G.stats.ults=f.base.ult+v;else f[T.k]=v;v42Update(0);points.push({done:f.done,used:f.used,progress:fzProg(),target:fzTarget(),banner:G.jc.bn,toasts:G.toasts.map(t=>({...t}))})};
 set(T.n-.001);set(T.n);set(T.n*2-.001);set(T.n*2);set(T.n*4);
 addWeapon('cleave');addWeapon('arrow');G.p.weapons.forEach(w=>w.lvl=CFG.weaponMax);v42Update(0);
 return {id,points,eligible:fzEligible().map(w=>w.id),mode:STATE.mode,sel:G.sel,trial:FZ_TRIAL[id]};
 })}finally{Math.random=old}
}
(async()=>{
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost').pathname,f=u==='/baseline'?process.env.CHOICE_BASELINE_HTML:path.join(root,u==='/'?'index.html':u);if(!f||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.statusCode=404;return res.end()}res.end(fs.readFileSync(f))}).listen(8797,'127.0.0.1');
 const browser=await chromium.launch({headless:true,executablePath:process.env.ART2_CHROMIUM_PATH});
 try{
 const p=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});p.on('pageerror',e=>report.errors.push(e.message));await p.goto('http://127.0.0.1:8797/');await p.waitForFunction(()=>JOB_ORDER.every(id=>UI_ART.images['trial_'+id]&&UI_ART.images['crest_'+id]));
 const b=await browser.newPage();await b.goto('http://127.0.0.1:8797/baseline');
 // Functions passed through evaluate cannot close over Node bindings.
 for(const page of [p,b])await page.evaluate('globalThis.prepare='+prepare.toString());
 const actual=await p.evaluate(trials),baseline=await b.evaluate(trials);
 ok(JSON.stringify(actual)===JSON.stringify(baseline),'all ten trial thresholds, progress, messages, two-opportunity cap and fusion eligibility equal art2');
 ok(actual.every(r=>r.points.map(x=>x.done).join(',')==='0,1,1,2,2'&&r.mode==='select'&&r.sel.kind==='fuse'),'all ten trials complete only at original thresholds and open fusion with two max-level weapons');
 ok(await p.evaluate(()=>Object.keys(UI_TRIAL_CREST).length===10&&new Set(Object.values(UI_TRIAL_CREST)).size===10&&JOB_ORDER.every(id=>decodeURIComponent(uiIcon('trial_'+id)).includes(JOB_COL[id]))),'ten unique trial symbols retain existing job colors');
 ok(await p.evaluate(()=>{prepare('warrior');const before=JSON.stringify(G),save=localStorage.getItem(CFG.SAVE_KEY),old=Math.random;let calls=0;Math.random=()=>{calls++;return .5};try{for(const id of JOB_ORDER)uiTrialCrest(id);abilityHTML();cxFuse();const can=document.createElement('canvas'),c=can.getContext('2d');for(let i=0;i<100;i++)drawBanner(c);return before===JSON.stringify(G)&&save===localStorage.getItem(CFG.SAVE_KEY)&&calls===0}finally{Math.random=old}}),'trial UI and repeated paused drawing preserve state, saves and gameplay RNG');
 // Isolate and inspect the added draw without altering banner creation/timing.
 for(const id of await p.evaluate(()=>JOB_ORDER)){
 const result=await p.evaluate(id=>{prepare(id);banner(FZ_TRIAL[id].nm,'연성 기회 1/2 · Lv 6 무기 2종을 합침',JOB_COL[id],2.2);const c=document.createElement('canvas').getContext('2d'),draw=c.drawImage.bind(c),calls=[];c.drawImage=(im,...args)=>{calls.push({parent:im===UI_ART.images['crest_'+id],args,alpha:c.globalAlpha});return draw(im,...args)};const before=JSON.stringify(G);for(const t of [0,.1,.2,1.1,2,2.2]){G.jc.bn.t=t;drawBanner(c)}const times=calls.map(x=>x.alpha);const prior=UI_ART.images['crest_'+id];delete UI_ART.images['crest_'+id];const missing=uiTrialBanner(c,G.jc.bn,1)===false;UI_ART.images['crest_'+id]=prior;const unrelated=uiTrialBanner(c,{text:'보스',sub:'위험'},1)===false;return {valid:calls.length===6&&calls.every(x=>x.parent&&x.args[2]===36&&x.args[3]===36),times,missing,unrelated,duration:G.jc.bn.dur}},id);
 ok(result.valid&&result.times[0]===0&&result.times[2]===1&&Math.abs(result.times[5])<.0001&&result.duration===2.2&&result.missing&&result.unrelated,'completion parent crest follows existing fade, duration and missing-image path '+id);
 }
 await p.setViewportSize({width:900,height:400});await p.evaluate(()=>{const d=document.createElement('div');d.id='trial-sheet';d.style='position:fixed;inset:0;background:#202c36;z-index:999;padding:20px;display:grid;grid-template-columns:repeat(5,1fr);gap:10px;align-content:start;color:#f3e5c6';d.innerHTML=JOB_ORDER.map(id=>`<div style="text-align:center"><img width="48" height="48" src="${uiIcon('trial_'+id)}"><p style="margin:4px">${FZ_TRIAL[id].nm}</p><img width="24" height="24" src="${uiIcon('trial_'+id)}"><img width="38" height="38" src="${uiIcon('trial_'+id)}"></div>`).join('');document.body.appendChild(d)});await p.locator('#trial-sheet img').evaluateAll(imgs=>Promise.all(imgs.map(im=>im.decode())));await p.screenshot({path:path.join(out,'trial-crests-10.png')});await p.evaluate(()=>document.getElementById('trial-sheet').remove());
 for(const width of [320,390,690]){
 await p.setViewportSize({width,height:width===690?829:844});await p.evaluate(()=>showCodex('x',()=>{}));await p.waitForTimeout(80);
 ok(await p.locator('[data-trial-crest]').evaluateAll(imgs=>imgs.length===10&&imgs.every(im=>im.complete&&im.naturalWidth===48&&getComputedStyle(im.previousElementSibling).display==='none')),'all trial symbols decode in fusion codex '+width);
 ok(await p.evaluate(()=>UI.scrollWidth<=innerWidth+1),'fusion codex has no horizontal overflow '+width);await p.screenshot({path:path.join(out,'trial-codex-'+width+'.png')});
 for(const id of await p.evaluate(()=>JOB_ORDER)){
 await p.evaluate(id=>{prepare(id);STATE.mode='select';G.sel={kind:'level',abil:true,cards:[]};renderSelect()},id);await p.waitForTimeout(30);
 ok(await p.locator('[data-trial-crest]').evaluateAll(imgs=>imgs.length===1&&imgs.every(im=>im.complete&&im.naturalWidth===48&&getComputedStyle(im.previousElementSibling).display==='none')),'ability trial icon decodes '+width+'/'+id);
 ok(await p.evaluate(()=>UI.scrollWidth<=innerWidth+1&&UI.innerText.includes(FZ_TRIAL[G.p.job].nm)),'ability text and width preserved '+width+'/'+id);
 if(id==='warrior')await p.screenshot({path:path.join(out,'trial-ability-'+width+'.png')});
 }
 await p.evaluate(()=>{hideUI();prepare('warrior');banner(FZ_TRIAL.warrior.nm,'연성 기회 1/2 · Lv 6 무기 2종을 합침',JOB_COL.warrior,2.2);G.jc.bn.t=.8;render()});await p.screenshot({path:path.join(out,'trial-banner-'+width+'.png')});
 }
 await p.evaluate(()=>showCodex('x',()=>{}));await p.locator('[data-trial-crest]').evaluateAll(imgs=>imgs.forEach(im=>im.src='data:image/svg+xml,broken'));await p.waitForFunction(()=>[...document.querySelectorAll('[data-trial-crest]')].every(im=>im.hidden&&!im.previousElementSibling.hidden&&getComputedStyle(im.previousElementSibling).display!=='none'));ok(true,'all ten image failures restore trial letter');
 await p.emulateMedia({reducedMotion:'reduce'});ok(await p.evaluate(()=>{prepare('warrior');return uiTrialCrest('warrior').includes('data-trial-crest')&&uiTrialBanner(document.createElement('canvas').getContext('2d'),{text:FZ_TRIAL.warrior.nm,sub:'연성 기회 1/2'},1)}),'reduced-motion mode keeps static trial and completion crest');
 ok(report.errors.length===0,'no browser runtime errors');await b.close();
 }finally{await browser.close();server.close();fs.writeFileSync(path.join(root,'dev/trial-crests-validation.json'),JSON.stringify(report,null,2))}
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e.stack);process.exit(1)});
