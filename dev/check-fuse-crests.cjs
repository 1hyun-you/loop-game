const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dev/art42'),report={checks:[],errors:[]};fs.mkdirSync(out,{recursive:true});
const ok=(v,n)=>{if(!v)throw Error(n);report.checks.push(n)};
function prepare(id){newRun();G.pendingStart=false;G.storyOn=true;STATE.dev.speed=0;STATE.dev.auto=false;STATE.mode='play';G.p.job=id;G.p.weapons=[];v42Update(0)}
function combinations(){
 const old=Math.random;let seed=7,calls=0;Math.random=()=>{calls++;seed=(seed*16807)%2147483647;return seed/2147483647};
 try{return JOB_ORDER.map(job=>{const ids=Object.keys(WEAPONS),rows=[];for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
 prepare(job);addWeapon(ids[i]);addWeapon(ids[j]);G.p.weapons.forEach(w=>w.lvl=CFG.weaponMax);fzApply(ids[i],ids[j]);
 const strip=h=>{const d=document.createElement('div');d.innerHTML=h;d.querySelectorAll('.ic').forEach(n=>n.remove());return d.textContent};
 rows.push({weapons:G.p.weapons,trial:F42(),stats:G.stats,banner:G.jc.bn,fx:G.fx,ability:strip(abilityHTML()),codex:strip(cxFuse()),save:localStorage.getItem(CFG.SAVE_KEY),calls});
 }return {job,rows}})}finally{Math.random=old}
}
(async()=>{
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost').pathname,f=u==='/baseline'?process.env.CHOICE_BASELINE_HTML:path.join(root,u==='/'?'index.html':u);if(!f||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.statusCode=404;return res.end()}res.end(fs.readFileSync(f))}).listen(8796,'127.0.0.1');
 const browser=await chromium.launch({headless:true,executablePath:process.env.ART2_CHROMIUM_PATH});
 try{
 const p=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});p.on('pageerror',e=>report.errors.push(e.message));await p.goto('http://127.0.0.1:8796/');await p.waitForFunction(()=>['trans','stack','merge'].every(k=>UI_ART.images['fuse_'+k]));
 const b=await browser.newPage();await b.goto('http://127.0.0.1:8796/baseline');for(const page of [p,b])await page.evaluate('globalThis.prepare='+prepare.toString());
 const a=await p.evaluate(combinations),before=await b.evaluate(combinations);
 ok(JSON.stringify(a)===JSON.stringify(before),'all weapon pairs across ten jobs preserve fusion metadata, component flags, stats, trial use, banner, effects, text, save and RNG versus art3');report.combinations=a.reduce((n,r)=>n+r.rows.length,0);
 ok(await p.evaluate(()=>Object.keys(UI_FUSE_CREST).length===3&&new Set(Object.values(UI_FUSE_CREST)).size===3&&Object.values(FZ_TYPES).every(T=>uiFuseCrest(T[1]).includes('data-fuse-crest="'+T[1]+'"'))),'three distinct silhouettes use exact existing FZ_TYPES IDs');
 ok(await p.evaluate(()=>{prepare('warrior');const before=JSON.stringify(G),save=localStorage.getItem(CFG.SAVE_KEY),old=Math.random;let calls=0;Math.random=()=>{calls++;return .5};try{for(let i=0;i<100;i++){Object.keys(UI_FUSE_CREST).forEach(k=>uiFuseCrest(k));abilityHTML();cxFuse()}return before===JSON.stringify(G)&&save===localStorage.getItem(CFG.SAVE_KEY)&&calls===0}finally{Math.random=old}}),'repeated UI rendering preserves state, saves and gameplay RNG');
 await p.setViewportSize({width:720,height:300});await p.evaluate(()=>{const d=document.createElement('div');d.id='fuse-sheet';d.style='position:fixed;inset:0;background:#202c36;z-index:999;padding:24px;display:grid;grid-template-columns:repeat(3,1fr);color:#f3e5c6';d.innerHTML=Object.values(FZ_TYPES).map(T=>`<div style="text-align:center"><img width="48" height="48" src="${uiIcon('fuse_'+T[1])}"><p>${T[0]}</p><img width="24" height="24" src="${uiIcon('fuse_'+T[1])}"><img width="38" height="38" src="${uiIcon('fuse_'+T[1])}"></div>`).join('');document.body.appendChild(d)});await p.locator('#fuse-sheet img').evaluateAll(imgs=>Promise.all(imgs.map(im=>im.decode())));await p.screenshot({path:path.join(out,'fuse-crests-3.png')});await p.evaluate(()=>document.getElementById('fuse-sheet').remove());
 for(const width of [320,390,690]){
 await p.setViewportSize({width,height:width===690?829:844});await p.evaluate(()=>showCodex('x',()=>{}));await p.waitForTimeout(80);
 ok(await p.locator('[data-fuse-crest]').evaluateAll(imgs=>imgs.length===3&&imgs.every(im=>im.complete&&im.naturalWidth===48&&getComputedStyle(im.previousElementSibling).display==='none')),'codex three crests decode with hidden fallback '+width);
 ok(await p.evaluate(()=>UI.scrollWidth<=innerWidth+1),'codex no horizontal overflow '+width);await p.screenshot({path:path.join(out,'fuse-codex-'+width+'.png')});
 for(const [ia,ib,type] of [['cleave','fireball','trans'],['fireball','bomb','stack'],['cleave','arrow','merge']]){
 await p.evaluate(([ia,ib])=>{prepare('warrior');addWeapon(ia);addWeapon(ib);G.p.weapons.forEach(w=>w.lvl=CFG.weaponMax);fzApply(ia,ib);STATE.mode='select';G.sel={kind:'level',abil:true,cards:[]};renderSelect()},[ia,ib]);await p.waitForTimeout(50);
 ok(await p.locator('[data-fuse-crest]').evaluateAll((imgs,type)=>imgs.length===1&&imgs[0].dataset.fuseCrest===type&&imgs[0].complete&&imgs[0].naturalWidth===48&&getComputedStyle(imgs[0].previousElementSibling).display==='none',type),'ability actual fusion maps to '+type+' '+width);
 ok(await p.evaluate(()=>UI.scrollWidth<=innerWidth+1),'ability no horizontal overflow '+type+' '+width);if(type==='trans')await p.screenshot({path:path.join(out,'fuse-ability-'+width+'.png')});
 }
 }
 await p.evaluate(()=>showCodex('x',()=>{}));await p.locator('[data-fuse-crest]').evaluateAll(imgs=>imgs.forEach(im=>im.src='data:image/svg+xml,broken'));await p.waitForFunction(()=>[...document.querySelectorAll('[data-fuse-crest]')].every(im=>im.hidden&&!im.previousElementSibling.hidden&&getComputedStyle(im.previousElementSibling).display!=='none'));ok(true,'all three decoding failures restore type initial');
 ok(await p.evaluate(()=>!uiFuseCrest('unknown').includes('data-fuse-crest')),'unknown saved type keeps generic fusion letter');
 await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>showCodex('x',()=>{}));ok(await p.locator('[data-fuse-crest]').count()===3,'reduced motion keeps static crests');ok(report.errors.length===0,'no browser runtime errors');await b.close();
 }finally{await browser.close();server.close();fs.writeFileSync(path.join(root,'dev/fuse-crests-validation.json'),JSON.stringify(report,null,2))}
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e.stack);process.exit(1)});
