const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
(async()=>{const browser=await chromium.launch({executablePath:process.env.ART2_CHROMIUM_PATH,headless:true});const result={checks:[],errors:[]},out=path.resolve(__dirname,'motion1');try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});page.on('pageerror',e=>result.errors.push(e.message));
 await page.goto('https://1hyun-you.github.io/field/?motion1='+Date.now());await page.waitForFunction(()=>typeof CFG!=='undefined'&&ART3.loaded===4&&FIELD_ENV.loaded===2);
 result.version=await page.locator('.ver').innerText();if(result.version!=='v0.40-motion1')throw Error('Waiting for new Pages version: '+result.version);result.checks.push('actual service version and embedded art');
 await page.screenshot({path:path.join(out,'live-title-390.png')});await page.locator('#start').click();
 for(let i=0;i<45;i++){const mode=await page.evaluate(()=>STATE.mode);if(mode==='select')break;if(await page.locator('#dlg').count())await page.locator('#dlg').click();await page.waitForTimeout(60);}
 await page.locator('.card').first().waitFor();await page.screenshot({path:path.join(out,'live-choice-390.png')});await page.locator('.card').first().click();await page.waitForTimeout(800);
 for(let i=0;i<30;i++){if(await page.locator('#dlg').count())await page.locator('#dlg').click();else if(await page.evaluate(()=>STATE.mode==='play'))break;await page.waitForTimeout(60);}
 if(!await page.evaluate(()=>STATE.mode==='play'))throw Error('did not enter combat');result.checks.push('start dialogue and weapon choice');
 const start=await page.evaluate(()=>({x:G.p.x,y:G.p.y}));
 await page.mouse.move(190,620);await page.mouse.down();await page.mouse.move(265,620);await page.waitForTimeout(1300);await page.mouse.up();
 result.movement=await page.evaluate(()=>({x:G.p.x,y:G.p.y,time:G.time,tracked:MOTION.owner===G&&!!MOTION.actors.get(G.p),error:!!window.__errShown}));
 if(result.movement.x===start.x||!result.movement.tracked||result.movement.error)throw Error('movement or animation state unavailable');result.checks.push('real pointer input advances walking and animation tracking');
 await page.screenshot({path:path.join(out,'live-combat-390.png')});await page.locator('#pausebtn').click();if(!await page.evaluate(()=>STATE.mode==='pause'))throw Error('pause');await page.locator('#resume').click();if(!await page.evaluate(()=>STATE.mode==='play'))throw Error('resume');result.checks.push('pause and resume');
 for(const width of [690,390]){await page.setViewportSize({width,height:844});await page.waitForTimeout(150);await page.screenshot({path:path.join(out,'live-combat-'+width+'.png')});if(!await page.evaluate(()=>VIEW.cw===innerWidth&&!window.__errShown))throw Error('resize');}result.checks.push('390 to 690 to 390 width changes');
 await page.emulateMedia({reducedMotion:'reduce'});if(!await page.evaluate(()=>{const q=motionPose(G.p,true);return q.sx===1&&q.sy===1&&q.x===0&&q.y===0&&q.a===0;}))throw Error('reduced motion');result.checks.push('reduced motion');if(result.errors.length)throw Error(result.errors.join(';'));
 fs.writeFileSync(path.join(out,'live-validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exit(1)});
