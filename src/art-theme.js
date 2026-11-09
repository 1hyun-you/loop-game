/* 0.40-art2: shared painted art direction. Gameplay and save data remain in their original modules. */
const ART2 = {
  version: '0.40-art2', ground: null, title: null, groundCache: new Map(), icons: null,
  iconCache: new Map(), iconCanvasCache: new Map(),
  iconOrder: ['cleave','spin','arrow','boomerang','fireball','lightning','shield','slam','knife','trap','icering','orb','lance','flail','shuriken','bomb','beam','vortex','vit','might','swift','haste','area','multi','magnet','regen']
};
const ART2_PALETTE = {
  field:'#597849',calm:'#6e8959',fog:'#6a8179',camp:'#7b8052',surge:'#89734d',
  warband:'#99824e',hunt:'#aa9256',siege:'#64705b',seal:'#587d94',escort:'#92795b',
  ritual:'#6b5a81',collapse:'#7d7264',gate:'#785449',demon:'#40354f'
};
for (const name of Object.keys(ART2_DATA)) {
  if (name === 'ground' || name === 'title' || name === 'icons') continue;
  FIELD_ART.sources[name] = ART2_DATA[name]; loadFieldArt(name, ART2_DATA[name]);
}
function art2Image(src, done) {
  const img=new Image(); img.onload=()=>{try{done(img);}catch(err){console.warn('ART2 fallback:',err.message);}};
  img.onerror=()=>console.warn('ART2 image unavailable; original rendering retained'); img.src=src;
}
art2Image(ART2_DATA.ground,img=>{ART2.ground=img;ART2.groundCache.clear();});
art2Image(ART2_DATA.title,img=>{
  ART2.title=img;document.documentElement.classList.add('art2-title-ready');
  if(HERO.timer){clearInterval(HERO.timer);HERO.timer=0;}
});
function heroMount(cv) {
  if(!ART2.title){pixelHeroMount(cv);return;}
  HERO.cv=cv;if(HERO.timer){clearInterval(HERO.timer);HERO.timer=0;}
}
art2Image(ART2_DATA.icons,img=>{
  ART2.icons=img; ART2.iconCache.clear(); ART2.iconCanvasCache.clear(); ICON_URL.clear(); ICON_CV.clear();
  for(const el of document.querySelectorAll('[data-art-icon]')) {const url=iconURL(el.dataset.artIcon);if(url)el.src=url;}
  art2Projectiles();
});
function art2IconCell(id) {
  const i=ART2.iconOrder.indexOf(id);if(i<0||!ART2.icons)return null;
  return {x:(i%5)*64,y:Math.floor(i/5)*64};
}
function iconURL(id) {
  const cell=art2IconCell(id);if(!cell)return pixelIconURL(id);
  if(!ART2.iconCache.has(id)){
    const cv=document.createElement('canvas');cv.width=cv.height=64;
    cv.getContext('2d').drawImage(ART2.icons,cell.x,cell.y,64,64,0,0,64,64);
    ART2.iconCache.set(id,cv.toDataURL('image/png'));
  }
  return ART2.iconCache.get(id);
}
function iconCanvas(id,t) {
  const cell=art2IconCell(id);if(!cell)return pixelIconCanvas(id,t);
  const key=id+'|'+t;if(!ART2.iconCanvasCache.has(key)){
    const cv=document.createElement('canvas');cv.width=cv.height=14*t;
    const c=cv.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    c.drawImage(ART2.icons,cell.x,cell.y,64,64,0,0,cv.width,cv.height);
    ART2.iconCanvasCache.set(key,cv);
    if(ART2.iconCanvasCache.size>160)ART2.iconCanvasCache.delete(ART2.iconCanvasCache.keys().next().value);
  }
  return ART2.iconCanvasCache.get(key);
}
function art2Projectiles() {
  // The source arrows and blades face right; icon artwork points northeast.
  const aliases={blade:['cleave',Math.PI/4],arrow:['arrow',Math.PI/4],knife:['knife',Math.PI/4],axe:['boomerang',0],fire:['fireball',0],orbp:['orb',0],flail:['flail',0],bomb:['bomb',0],spear:['lance',Math.PI/4],eb_fire:['fireball',0],eb_arrow:['arrow',Math.PI/4],pj_dagger:['knife',Math.PI/4],pj_arcane:['orb',0],pj_gear:['spin',0]};
  for(const [name,[id,angle]]of Object.entries(aliases)){
    if(!SPR[name])continue; const p=art2IconCell(id);if(!p)continue;
    const cv=document.createElement('canvas');cv.width=cv.height=96;const c=cv.getContext('2d');
    c.translate(48,48);c.rotate(angle);c.drawImage(ART2.icons,p.x,p.y,64,64,-32,-32,64,64);
    const pixels=c.getImageData(0,0,96,96).data;let l=96,r=0,top=96,b=0;
    for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(pixels[(y*96+x)*4+3]>16){l=Math.min(l,x);r=Math.max(r,x);top=Math.min(top,y);b=Math.max(b,y);}
    const rect={x:l,y:top,w:r-l+1,h:b-top+1};
    FIELD_ART.ready[name]={img:cv,frames:[rect,rect],maxW:rect.w,maxH:rect.h};
  }
  FIELD_ART.cache.clear();
}
function groundPattern(c,tid) {
  if(!ART2.ground)return pixelGroundPattern(c,tid);
  const ratio=VIEW.zoom*VIEW.dpr,size=Math.max(128,Math.round(256*ratio)),key=tid+'|'+size;
  let pat=ART2.groundCache.get(key);
  if(!pat){
    const cv=document.createElement('canvas');cv.width=cv.height=size;const g=cv.getContext('2d');
    g.drawImage(ART2.ground,0,0,size,size);g.globalCompositeOperation='color';
    g.fillStyle=ART2_PALETTE[tid]||ART2_PALETTE.field;g.fillRect(0,0,size,size);g.globalCompositeOperation='source-over';
    if(tid==='demon'||tid==='gate'){g.fillStyle=tid==='demon'?'rgba(18,10,35,.3)':'rgba(48,18,12,.12)';g.fillRect(0,0,size,size);}
    pat=c.createPattern(cv,'repeat');if(pat&&pat.setTransform)pat.setTransform(new DOMMatrix([1/ratio,0,0,1/ratio,0,0]));
    ART2.groundCache.set(key,pat);if(ART2.groundCache.size>16)ART2.groundCache.delete(ART2.groundCache.keys().next().value);
  }
  return pat;
}
const art2Style=document.createElement('style');
art2Style.textContent=`
:root{--bg:#171a26;--panel:#202737;--panel2:#2b3447;--line:#48526b;--fg:#f5f0e5;--muted:#bac3d1;--accent:#90b9d7;--f-body:system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif}
html,body{background:var(--bg)}
#ui>.layer{background:rgba(13,18,29,.91)}
#ui>.layer.sel,#ui>.layer.scroll{background:linear-gradient(160deg,rgba(20,28,42,.98),rgba(19,22,35,.97))}
.layer h2{letter-spacing:-.5px;font-weight:750;color:#f2dfac}.layer .sub,.card .ds{line-height:1.5}
button{border-color:#59637b;background:linear-gradient(160deg,#35425a,#263246);box-shadow:inset 0 1px 0 rgba(255,255,255,.07)}
button.pri{background:linear-gradient(155deg,#576b91,#394866);border-color:#bdc6dd}
.card{border-radius:15px;background:linear-gradient(130deg,#2c3547,#202939);box-shadow:0 5px 14px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.07);gap:12px;padding:13px}
.card .nm{font-size:16px;line-height:1.3}.card .ds{font-size:13px;color:#c9d0da}.card .tag{font-size:11px;background:#1b2535;color:#d1dae5}
.card .ic{flex-basis:46px;height:46px;border-radius:11px;background:#172234}
.ic.px{border-width:1px;box-shadow:inset 0 0 12px rgba(0,0,0,.2)}.ic.px img,.dlg .pt{image-rendering:auto}
.ic.px img{object-fit:contain}.card .ic.px img{width:40px;height:40px}.ab .ic.px img{width:24px;height:24px}
.sel-head{margin-top:clamp(18px,6vh,48px)}.sel-actions button{min-height:44px}.card:active{filter:brightness(1.13)}
.row,.cx,.ab{background:#232d3e;border-color:#46536a;border-radius:12px}.tabs button.on{border-color:#d7c18b;color:#f5e4b9}
.dlg{background:linear-gradient(135deg,rgba(23,32,46,.98),rgba(21,25,37,.98));border-color:#9e8c62;box-shadow:0 9px 30px rgba(0,0,0,.3)}
.dlg .nm{color:#ecd3a0}.dlg .tx{font-size:15px;line-height:1.6}
.art2-title-ready #ui>.layer.title.hero{background:#252138 url('${ART2_DATA.title}') right center/cover no-repeat}
.art2-title-ready .layer.title.hero .herobg{display:none}.layer.title.hero .heroshade{background:linear-gradient(180deg,rgba(14,15,29,.12),transparent 42%,rgba(12,17,25,.12) 62%,rgba(12,17,25,.74))}
.hlogo{top:calc(var(--sat) + 12vh)}.hlogo h1{font-family:Georgia,"Noto Serif KR","Batang",serif;font-size:clamp(34px,10vw,46px);font-weight:800;letter-spacing:1px;color:#fff0cd;text-shadow:0 2px 4px #20172d,0 0 24px rgba(255,205,126,.18)}
.hlogo::after{content:'한 번의 선택, 다시 시작되는 모험';display:block;margin-top:12px;font-size:12px;letter-spacing:1px;color:#dfd4df;text-shadow:0 1px 4px #171724}
.hmenu{gap:10px;bottom:calc(var(--sab) + 8vh)}button.txb{min-width:210px;border:1px solid rgba(237,219,172,.54);background:rgba(31,36,46,.72);border-radius:12px;padding:12px 28px;font-size:16px;color:#f3e6cb;letter-spacing:.5px;text-shadow:0 1px 2px #161c28;box-shadow:0 4px 16px rgba(0,0,0,.22);backdrop-filter:blur(5px)}
button.txb.main{min-height:54px;font-size:21px;letter-spacing:2px;background:linear-gradient(145deg,#b49a60,#88703f);border-color:#e9d4a3;color:#fff9eb;animation:none}
button.txb::before{display:none}.hmenu .hint{font-size:11px;color:#d8d2c3}.layer.hero .ver{color:#e5dfd3;font-size:11px}
.icbtn{border-radius:11px;background:rgba(22,29,42,.72);border-color:rgba(224,209,176,.5)}
@media(max-height:650px){.hlogo{top:calc(var(--sat) + 9vh)}.hmenu{bottom:calc(var(--sab) + 5vh);gap:6px}.hlogo::after{margin-top:7px}.sel-head{margin-top:10px}.card{padding:9px}.card .ds{font-size:12px}}
@media(prefers-reduced-motion:reduce){.card,.layer>*{animation:none!important;transition:none!important}}
`;
document.head.appendChild(art2Style);
