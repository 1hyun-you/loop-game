const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'..'),out={checks:[],errors:[]};
function ok(v,name){if(!v)throw Error(name);out.checks.push(name);}
(async()=>{
 const server=http.createServer((req,res)=>{let file=path.join(root,new URL(req.url,'http://localhost').pathname);if(file===root+'/')file+='index.html';if(!file.startsWith(root)||!fs.existsSync(file)){res.statusCode=204;return res.end();}res.setHeader('Content-Type',file.endsWith('.woff2')?'font/woff2':file.endsWith('.webp')?'image/webp':'text/html');res.end(fs.readFileSync(file));}).listen(8789,'127.0.0.1');
 const browser=await chromium.launch({executablePath:process.env.ART2_CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});page.on('pageerror',e=>out.errors.push(e.message));
  await page.goto('http://127.0.0.1:8789/');await page.waitForFunction(()=>typeof ART3!=='undefined'&&ART3.loaded===4&&ART2.icons&&FIELD_ART.ready.arrow);
  ok(await page.locator('.ver').innerText()==='v'+await page.evaluate(()=>CFG.VERSION),'version');
  const results=await page.evaluate(async()=>{
   const names=Object.keys(ART3_DATA.meta.sprites).concat(Object.keys(ART3_DATA.meta.aliases)),errors=[];let count=0;
   const alpha=s=>{let n=0;const p=s.cv.getContext('2d').getImageData(0,0,s.cv.width,s.cv.height).data;for(let i=3;i<p.length;i+=4)if(p[i]>160)n++;return n;};
   for(const name of names)for(const frame of [0,1])for(const mode of ['n','white','gold','rage','danger'])for(const flip of [false,true]){count++;const s=getSprite(name,frame,{mode,flip,tint:'#ff5a5a'});if(alpha(s)<2)errors.push(name+'/'+frame+'/'+mode+'/'+flip);}
   const sum=tint=>{const s=getSprite('ball',0,{tint}),p=s.cv.getContext('2d').getImageData(0,0,s.cv.width,s.cv.height).data,a=[0,0,0];for(let i=0;i<p.length;i+=4)if(p[i+3]>200)for(let j=0;j<3;j++)a[j]+=p[i+j];return a;};
   const red=sum('#ff5a5a'),blue=sum('#7fdcf6');if(!(red[0]>red[2]&&blue[2]>blue[0]))errors.push('projectile tint');
   const wolf=FIELD_ART.ready.wolf;delete FIELD_ART.ready.wolf;if(alpha(getSprite('wolf',0,{}))<2)errors.push('pixel fallback');FIELD_ART.ready.wolf=wolf;
   const before=Object.assign({},PT_URL);buildPortraits();if(Object.keys(before).some(k=>before[k]!==PT_URL[k]))errors.push('portrait rebuild');
   const portraits={};for(const key of ['hero','aide','demon']){const im=new Image();await new Promise((res,rej)=>{im.onload=res;im.onerror=rej;im.src=PT_URL[key]});portraits[key]=[im.width,im.height];if(im.width!==160)errors.push('portrait '+key);}
   for(const [name,axis]of [['dbeam','height'],['pj_wind','width']]){const s=getSprite(name,0,{}),p=s.cv.getContext('2d').getImageData(0,0,s.cv.width,s.cv.height).data;let min=99999,max=-1;for(let y=0;y<s.cv.height;y++)for(let x=0;x<s.cv.width;x++)if(p[(y*s.cv.width+x)*4+3]>160){const q=axis==='height'?y:x;min=Math.min(min,q);max=Math.max(max,q);}if((max-min+1)/s.cv[axis]<.7)errors.push('visible footprint '+name);}
   const missing=Object.keys(SPR).filter(k=>!FIELD_ART.ready[k]);
   return {count,errors,missingPaintedSprites:missing,portraits,atlasCount:Object.keys(ART3.atlases).length};
  });out.render=results;ok(!results.errors.length,'820 frame/effect/flip combinations, tint and fallback');ok(results.atlasCount===4,'four shared image atlases');ok(results.missingPaintedSprites.length===0,'all registered game sprites covered');
  await page.addStyleTag({content:'body{font-family:Galmuri11,system-ui,sans-serif}'});
  await page.evaluate(()=>{showDialog([{name:'에다',color:'#7a6ab8',pt:'aide',text:'들판의 시간이 다시 흐르고 있어. 준비가 되면 앞으로 나아가.'}]);dlgFull();});
  const checkDialog=()=>page.locator('#dlg').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;});
  ok(await checkDialog(),'390px dialogue fits');await page.screenshot({path:root+'/dev/art3-dialogue-390.png'});
  await page.setViewportSize({width:320,height:568});await page.waitForTimeout(1300);ok(await checkDialog(),'320px dialogue fits');await page.screenshot({path:root+'/dev/art3-dialogue-320.png'});
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);
  await page.evaluate(()=>{clearInterval(DLG.timer);newRun();G.pendingStart=false;G.storyOn=true;G.story={freed:false,newFrags:[]};G.p.job='druid';G.p.invT=9999;petsInit();addWeapon('cleave');recalc();STATE.mode='play';hideUI();});
  await page.waitForTimeout(4500);const play=await page.evaluate(()=>({time:G.time,pets:G.pets.length,error:!!window.__errShown}));out.play=play;ok(play.time>2&&play.pets===2&&!play.error,'live druid pet simulation');
  await page.evaluate(()=>{STATE.mode='pause';hideUI();});
  await page.setViewportSize({width:900,height:850});await page.waitForTimeout(150);
  await page.evaluate(()=>{
   const cv=document.createElement('canvas');cv.id='art3-gallery';cv.width=1800;cv.height=1700;cv.style='position:fixed;inset:0;width:900px;height:850px;z-index:100;background:#526b47';document.body.appendChild(cv);const c=cv.getContext('2d');c.scale(2,2);c.fillStyle='#526b47';c.fillRect(0,0,900,850);c.font='12px sans-serif';c.textAlign='center';
   Object.keys(ART3_DATA.meta.sprites).forEach((name,i)=>{const col=i%7,row=Math.floor(i/7),s=getSprite(name,0,{}),scale=Math.min(94/s.cv.width,94/s.cv.height),w=s.cv.width*scale,h=s.cv.height*scale,x=col*128+64,y=row*145+108;c.drawImage(s.cv,x-w/2,y-h,w,h);c.fillStyle='#f5e7c2';c.fillText(name,x,y+20);});
  });await page.screenshot({path:root+'/dev/art3-gallery.png'});
  ok(out.errors.length===0,'no JavaScript runtime errors');fs.writeFileSync(root+'/dev/art3-validation.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
