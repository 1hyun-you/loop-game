const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'..'),dir=root,report={checks:[],errors:[],screens:[]};
const mime={'.html':'text/html','.js':'text/javascript','.webp':'image/webp','.woff2':'font/woff2'};
function ok(v,name){if(!v)throw Error(name);report.checks.push(name);}
(async()=>{
  const server=http.createServer((req,res)=>{let p=path.join(dir,new URL(req.url,'http://localhost').pathname);if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');if(!p.startsWith(dir)||!fs.existsSync(p)){res.statusCode=204;return res.end();}res.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p));}).listen(8788,'127.0.0.1');
  const browser=await chromium.launch({executablePath:process.env.ART2_CHROMIUM_PATH || undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    page.on('pageerror',e=>report.errors.push(e.message));
    await page.goto('http://127.0.0.1:8788/');
    await page.waitForFunction(()=>typeof ART2!=='undefined'&&ART2.ground&&ART2.title&&ART2.icons&&['bat','skel','brute','gob','jelly','mush','boar','knight','wisp','bargan','igna','morden','seren','demon'].every(n=>FIELD_ART.ready[n]));
    ok(await page.locator('.ver').innerText()==='v'+await page.evaluate(()=>CFG.VERSION),'version');
    // QA host lacks Korean system fonts. The existing bundled font supplies glyphs only for local snapshots.
    await page.addStyleTag({content:'body{font-family:Galmuri11,system-ui,sans-serif}.hlogo h1{font-family:Galmuri11,serif}'});
    await page.screenshot({path:root+'/dev/art2-title-390.png'});report.screens.push('art2-title-390.png');
    const render=await page.evaluate(()=>{
      const errors=[],names=['hero','slime','bat','skel','brute','gob','jelly','mush','boar','knight','wisp','bargan','igna','morden','seren','demon'];let count=0;
      const nonempty=s=>{const d=s.cv.getContext('2d').getImageData(0,0,s.cv.width,s.cv.height).data;for(let i=3;i<d.length;i+=4)if(d[i]>180)return true;return false;};
      for(const name of names)for(const fr of [0,1])for(const mode of ['n','white','gold','rage','danger'])for(const flip of [false,true]){
        const s=getSprite(name,fr,{mode,flip,tint:'#5fd0c0'});if(!nonempty(s))errors.push([name,fr,mode,flip].join('/'));count++;
      }
      for(const id of ART2.iconOrder)if(!iconURL(id)||!iconCanvas(id,2))errors.push('icon '+id);
      for(const tid of Object.keys(TERRAIN))if(!groundPattern(ctx,tid))errors.push('terrain '+tid);
      const art=FIELD_ART.ready.bat;delete FIELD_ART.ready.bat;const fallback=getSprite('bat',0,{});FIELD_ART.ready.bat=art;
      if(!nonempty(fallback))errors.push('fallback');
      if(FIELD_ART.cache.size>128)errors.push('unbounded sprite cache');
      return {count,errors,spriteCache:FIELD_ART.cache.size,terrainCache:ART2.groundCache.size};
    });report.render=render;ok(render.errors.length===0,'all sprite frames, tint, hit flash, outlines, flip, icons, terrain, fallback');
    await page.evaluate(()=>openStart());await page.waitForTimeout(250);
    ok(await page.locator('.card').count()===3,'three starter choices');
    const cards=await page.locator('.card').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,bottom:r.bottom};}));
    ok(cards.every(c=>c.x>=0&&c.right<=391),'390px cards fit horizontally');
    ok(await page.locator('[data-art-icon]').evaluateAll(es=>es.every(e=>e.complete&&e.naturalWidth>0)),'choice icons loaded');
    await page.screenshot({path:root+'/dev/art2-choice-390.png'});report.screens.push('art2-choice-390.png');
    await page.setViewportSize({width:320,height:568});await page.waitForTimeout(1350);
    const small=await page.locator('.card').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().right<=321));ok(small,'320px choices fit');
    await page.screenshot({path:root+'/dev/art2-choice-320.png'});report.screens.push('art2-choice-320.png');
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);
    await page.evaluate(()=>{
      newRun();G.pendingStart=false;G.storyOn=true;G.story={freed:false,newFrags:[]};G.p.invT=9999;addWeapon('cleave');recalc();
      const names=['slime','bat','skel','brute','gob','jelly','mush','boar','knight','wisp'];
      names.forEach((name,i)=>makeEnemy(name,-125+(i%3)*125,-220+Math.floor(i/3)*105));
      STATE.mode='pause';hideUI();render();
    });
    await page.screenshot({path:root+'/dev/art2-field-390.png'});report.screens.push('art2-field-390.png');
    await page.evaluate(()=>{G.enemies=[];STATE.mode='play';});await page.waitForTimeout(4500);
    const play=await page.evaluate(()=>({time:G.time,mode:STATE.mode,enemies:G.enemies.length,canvasError:!!window.__errShown,cache:FIELD_ART.cache.size}));report.play=play;
    ok(play.time>2&&!play.canvasError,'actual gameplay ticks and rendering');
    await page.evaluate(()=>{pauseGame();});ok(await page.locator('#ui').innerText().then(t=>t.length>0),'pause screen');
    await page.evaluate(()=>showCodex('w',showTitle));await page.waitForTimeout(100);
    ok(await page.locator('img[data-art-icon]').count()>10,'codex artwork');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
    ok(report.errors.length===0,'no JavaScript runtime errors');
    fs.writeFileSync(root+'/dev/art2-validation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
