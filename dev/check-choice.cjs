const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dev/choice2'),report={checks:[],errors:[],screens:[]};fs.mkdirSync(out,{recursive:true});
const ok=(v,n)=>{if(!v)throw Error(n);report.checks.push(n);};
// Same catalogue fixtures are executed in the current build and motion1 baseline.
function fixture(name){
 newRun();G.pendingStart=false;G.storyOn=true;STATE.mode='select';STATE.dev.speed=0;STATE.dev.fps=false;STATE.dev.auto=false;G.p.weapons=[];addWeapon('cleave');addWeapon('arrow');G.p.weapons[0].lvl=3;G.p.passives=[{id:'might',lvl:2}];recalc();
 let kind=name,cards,q;
 if(name==='start')cards=['cleave','fireball','arrow'].map(id=>({t:'wnew',id}));
 if(name==='level')cards=[{t:'wup',id:'cleave'},{t:'pup',id:'might'},{t:'pnew',id:'vit'}];
 if(name==='branch'||name==='awaken'){kind='branch';q={id:'cleave',aw:name==='awaken'};cards=(q.aw?AWAKEN:BRANCHES).cleave.map(o=>({t:'branch',id:'cleave',k:o.k,kind:'w',aw:q.aw}));}
 if(name==='job'||name==='offer'){kind='job';cards=Object.keys(JOBS).slice(0,3).map(id=>({t:'job',id}));}
 if(name==='job2'){G.p.job='warrior';cards=JOB2.warrior.concat(JOB2_STAT).map(o=>({t:'job2',id:'warrior',k:o.k}));}
 if(name==='chest')cards=RELIC_ORDER.slice(0,3).map(id=>({t:'relic',id}));
 if(name==='bond'){q={id:'wolf',ti:0};cards=BOND_PERKS.wolf[0].map(o=>({t:'bond',id:'wolf',k:o.k}));}
 if(name==='camp')cards=CAMP_CARDS.slice();
 if(name==='door')cards=[{t:'doorYes',id:Object.keys(CURSES)[0]},{t:'doorNo',id:'no'}];
 if(name==='fill'){kind='level';cards=[{t:'power',id:'power'},{t:'heal',id:'heal'},{t:'trait',id:Object.keys(TRAITS)[0]}];}
 G.sel={kind,cards,q,offer:name==='offer',banish:false};renderSelect();
 return {cards:G.sel.cards,info:cards.map(cardInfo),weapons:G.p.weapons,rerolls:G.rerolls,banishes:G.banishes};
}
(async()=>{
 const server=http.createServer((req,res)=>{const n=new URL(req.url,'http://localhost').pathname,f=n==='/baseline'?process.env.CHOICE_BASELINE_HTML:path.join(root,n==='/'?'index.html':n);if(!f||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.statusCode=404;return res.end();}res.setHeader('Content-Type',f.endsWith('.woff2')?'font/woff2':'text/html');res.end(fs.readFileSync(f));}).listen(8796,'127.0.0.1');
 const browser=await chromium.launch({executablePath:process.env.ART2_CHROMIUM_PATH,headless:true});
 try{
  const options={viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},p=await browser.newPage(options);p.on('pageerror',e=>report.errors.push(e.message));await p.goto('http://127.0.0.1:8796/');await p.waitForFunction(()=>ART2.icons&&ART3.loaded===4&&UI_ART.loaded>0);
  const b=await browser.newPage(options);await b.goto('http://127.0.0.1:8796/baseline');await b.waitForFunction(()=>ART2.icons&&ART3.loaded===4);
  const variants=['start','level','branch','awaken','job','job2','chest','bond','camp','door','fill','offer'];
  report.catalog=[];
  for(const name of variants){const actual=await p.evaluate(fixture,name),base=await b.evaluate(fixture,name);ok(JSON.stringify(actual)===JSON.stringify(base),'unchanged catalogue and descriptions: '+name);report.catalog.push(name);}
  // Check rendering in every mode with no calls into the game's random stream.
  ok(await p.evaluate(()=>{let calls=0;const old=Math.random;Math.random=()=>{calls++;return .5};const before=JSON.stringify({cards:G.sel.cards,p:G.p,stats:G.stats,rerolls:G.rerolls});renderSelect();Math.random=old;return calls===0&&before===JSON.stringify({cards:G.sel.cards,p:G.p,stats:G.stats,rerolls:G.rerolls});}),'rendering preserves selection data, player stats and gameplay RNG');
  report.layout=[];
  for(const [width,height]of [[280,653],[320,568],[360,740],[390,844],[412,915],[690,829],[768,900],[844,390]]){
   await p.setViewportSize({width,height});
   for(const name of ['start','level','job','job2','door','offer']){
    await p.evaluate(fixture,name);await p.waitForTimeout(450);
    const layout=await p.evaluate(()=>{const layer=UI.querySelector('.sel'),cards=[...UI.querySelectorAll('.card')],box=layer.getBoundingClientRect();return {width:innerWidth,kind:G.sel.kind,count:cards.length,horizontal:layer.scrollWidth<=layer.clientWidth+1,cards:cards.every(e=>{const r=e.getBoundingClientRect(),tx=e.querySelector('.choice-copy-head'),ic=e.querySelector('.ic');return r.width>0&&r.width<=box.width&&r.height>=44&&e.scrollWidth<=e.clientWidth+1&&tx.getBoundingClientRect().left>=ic.getBoundingClientRect().right-1&&parseFloat(getComputedStyle(e.querySelector('.ds')).fontSize)>=12;}),images:cards.every(e=>{const im=e.querySelector('img');return !im||(im.complete&&im.naturalWidth>0);}),allOnScreen:cards.every(e=>{const r=e.getBoundingClientRect();return r.top>=box.top&&r.bottom<=box.bottom-5&&e.scrollHeight<=e.clientHeight+1;}),scroll:layer.scrollHeight>layer.clientHeight};});
    report.layout.push({name,...layout});ok(layout.horizontal&&layout.cards&&layout.images&&((width<360||height<700)||layout.allOnScreen),'readable cards, art and no overflow '+name+' '+width+' '+JSON.stringify(layout));
    if(['start','job','level'].includes(name)&&[320,390,690].includes(width)){const file=name+'-'+width+'.png';await p.screenshot({path:path.join(out,file)});report.screens.push(file);}
   }
  }
  report.foldFit=[];
  for(const [width,height]of [[390,844],[690,829]]){
   await p.setViewportSize({width,height});await p.evaluate(fixture,'job');
   for(const safe of [0,28]){
    const dense=await p.evaluate(safe=>{document.documentElement.style.setProperty('--sat',safe+'px');document.documentElement.style.setProperty('--sab',safe+'px');G.sel.cards=Object.keys(JOBS).map(id=>({t:'job',id})).sort((a,b)=>cardInfo(b).ds.length-cardInfo(a).ds.length).slice(0,3);renderSelect();const l=UI.querySelector('.sel'),rows=[...l.querySelectorAll('.card')],actions=l.querySelector('.sel-actions');return {all:rows.every(c=>{const r=c.getBoundingClientRect();return r.top>=safe&&r.bottom<=innerHeight-safe&&c.scrollHeight<=c.clientHeight+1;}),scroll:l.scrollHeight>l.clientHeight,actions:actions.getBoundingClientRect().bottom<=innerHeight-safe,font:parseFloat(getComputedStyle(rows[0].querySelector('.ds')).fontSize)};},safe);
    report.foldFit.push({width,height,safe,...dense});ok(dense.all&&!dense.scroll&&dense.actions,'longest three job descriptions and actions fit without scrolling '+width+' safe '+safe);
   }await p.screenshot({path:path.join(out,'dense-jobs-'+width+'.png')});
  }
  await p.evaluate(()=>{document.documentElement.style.removeProperty('--sat');document.documentElement.style.removeProperty('--sab');});
  await p.setViewportSize({width:390,height:844});await b.setViewportSize({width:390,height:844});await p.evaluate(fixture,'start');await b.evaluate(fixture,'start');await b.waitForTimeout(400);await b.screenshot({path:path.join(out,'before-start-390.png')});
  // Two-tap choice, switching armed card, disabled banish options and real picks.
  await p.evaluate(()=>{SETTINGS.confirm2=true;});await p.locator('.card').first().click();ok(await p.evaluate(()=>G.sel.armed===0&&G.p.weapons.length===2),'first tap arms without applying choice');await p.locator('.card').nth(1).click();ok(await p.evaluate(()=>G.sel.armed===1&&document.querySelectorAll('.card.armed').length===1),'arming moves to another card');await p.locator('.card').nth(1).click();ok(await p.evaluate(()=>STATE.mode==='play'&&G.p.weapons.some(w=>w.id==='fireball')),'second tap confirms original choice action');
  await p.evaluate(fixture,'job');await p.evaluate(()=>{SETTINGS.confirm2=false;});await p.locator('.card').first().click();ok(await p.evaluate(()=>G.sel.armed===0&&!G.p.job),'jobs still always require two taps');await p.locator('.card').first().click();ok(await p.evaluate(()=>G.p.job==='warrior'),'job confirmation keeps original effect');
  await p.evaluate(fixture,'fill');await p.evaluate(()=>{G.banishes=2;G.sel.banish=true;renderSelect();});ok(await p.locator('.card:disabled').count()===3,'fill and trait options stay disabled in banish mode');
  const actions=()=>{let seed=222,calls=0;const old=Math.random;Math.random=()=>{calls++;seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};G.rerolls=2;G.banishes=2;reroll();const drawn=G.sel.cards.map(c=>({...c}));G.sel.banish=true;pickCard(G.sel.cards.findIndex(c=>!isFill(c)));Math.random=old;return {drawn,next:G.sel.cards,rerolls:G.rerolls,banishes:G.banishes,banished:[...G.banished],calls,seed};};
  await p.evaluate(fixture,'level');await b.evaluate(fixture,'level');ok(JSON.stringify(await p.evaluate(actions))===JSON.stringify(await b.evaluate(actions)),'reroll and banish parity with baseline including candidate order and RNG');
  await p.evaluate(fixture,'job');await p.locator('#abtn').click();ok(await p.locator('.abil').count()===1,'ability list toggles');await p.locator('#abtn').click();ok(await p.locator('.card').count()===3,'return to cards');await p.locator('#cbtn').click();ok(await p.locator('.pgt').count()>0,'codex remains accessible');
  await p.evaluate(fixture,'job');await p.setViewportSize({width:320,height:568});await p.waitForTimeout(500);await p.evaluate(()=>{const l=UI.querySelector('.sel');l.scrollTop=200;});const sc=await p.evaluate(()=>UI.querySelector('.sel').scrollTop);await p.evaluate(()=>renderSelect());const after=await p.evaluate(()=>UI.querySelector('.sel').scrollTop);ok(Math.abs(after-sc)<=1,'rerender preserves scroll position '+JSON.stringify({before:sc,after}));
  await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(fixture,'start');ok(await p.locator('.card').first().evaluate(e=>getComputedStyle(e).animationName==='none'&&getComputedStyle(e).transitionDuration==='0s'),'reduced motion suppresses card animation');
  ok(report.errors.length===0,'no browser runtime errors');await b.close();fs.writeFileSync(path.join(root,'dev/choice-validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks,errors:report.errors,screens:report.screens}));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
