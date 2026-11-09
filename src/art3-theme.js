/* 0.40-art3: shared companion, object, effect and dialogue portrait atlases. */
const ART3={atlases:{},portraits:{},loaded:0};
function art3LinkAliases(){
  for(const [name,target]of Object.entries(ART3_DATA.meta.aliases))if(SPR[name]&&FIELD_ART.ready[target])FIELD_ART.ready[name]=FIELD_ART.ready[target];
}
function art3ApplyPortrait(key,img,rect){
  const cv=document.createElement('canvas');cv.width=cv.height=160;const c=cv.getContext('2d');
  const scale=Math.min(152/rect.w,152/rect.h),w=rect.w*scale,h=rect.h*scale;
  c.drawImage(img,rect.x,rect.y,rect.w,rect.h,(160-w)/2,(160-h)/2,w,h);
  ART3.portraits[key]=cv.toDataURL('image/png');PT_URL[key]=ART3.portraits[key];
  const pt=document.getElementById('dpt');
  if(pt&&typeof DLG!=='undefined'&&DLG.lines&&DLG.lines[DLG.i]?.pt===key){
    const line=DLG.lines[DLG.i];pt.style.background=`${line.color||'#222'} url(${PT_URL[key]}) center/100% 100% no-repeat`;pt.textContent='';
  }
}
function buildPortraits(){
  buildPixelPortraits();for(const [key,url]of Object.entries(ART3.portraits))PT_URL[key]=url;
}
for(const [name,src]of Object.entries(ART3_DATA.images))art2Image(src,img=>{
  ART3.atlases[name]=img;ART3.loaded++;
  for(const [sprite,item]of Object.entries(ART3_DATA.meta.sprites)){
    if(item.atlas!==name||!SPR[sprite])continue;
    FIELD_ART.ready[sprite]={img,frames:item.frames,maxW:item.maxW,maxH:item.maxH};
  }
  for(const [key,item]of Object.entries(ART3_DATA.meta.portraits))if(item.atlas===name)art3ApplyPortrait(key,img,item.frame);
  art3LinkAliases();FIELD_ART.cache.clear();
});
