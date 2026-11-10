/* 0.40-fx2 — compact parchment/bronze interface; presentation only.
   Native vector icons keep menu symbols crisp at small sizes. No network assets.
   Canvas text uses the device UI font, with bundled Galmuri as glyph fallback. */
const UI_ART = { images: {}, urls: {}, loaded: 0, font: 'system-ui, Galmuri11, sans-serif' };
const UI_PATH = {
  book: '<path fill="url(#leather)" d="M8 8Q18 5 24 10Q31 5 40 8L39 38Q30 36 24 40Q18 36 8 39Z"/><path fill="url(#page)" d="M11 10Q18 9 23 12V35Q18 32 11 34ZM25 12Q31 8 37 10V34Q31 32 25 35Z"/><path d="M24 12V38M14 16l6 1m-6 5 6 1m8-6 6-1m-6 7 6-1" fill="none" stroke="#84694e" stroke-width="1.4"/><path d="m23 18 3 1-1 9-2-2-2 1Z" fill="#759ca9"/>',
  gear: '<path fill="url(#bronze)" d="m20 5 8 0 1 5 4 2 5-2 4 7-4 4v5l4 4-4 7-5-2-4 2-1 6h-8l-1-6-4-2-5 2-4-7 4-4v-5l-4-4 4-7 5 2 4-2Z"/><circle cx="24" cy="24" r="12" fill="#574c4b"/><circle cx="24" cy="24" r="8" fill="url(#steel)"/><circle cx="24" cy="24" r="4" fill="#26313d"/><path d="M17 17q6-6 13-1" stroke="#f2dfad" fill="none" stroke-width="1.5"/>',
  back: '<path d="M24 10 9 24l15 14v-9h14V19H24Z" fill="url(#bronze)"/><path d="m13 24 9-9m3 7h11" stroke="#f7eac8" stroke-width="2" fill="none"/>',
  pause: '<path fill="url(#bronze)" d="M13 10h8v28h-8ZM28 10h8v28h-8Z"/><path d="M15 13v20m15-20v20" stroke="#f7eac8" stroke-width="1.5"/>',
  heart: '<path d="M24 39 8 24C-2 9 16 3 24 15 32 3 50 9 40 24Z" fill="url(#rose)"/><path d="M11 19q-2-7 6-6" stroke="#f9d4bd" stroke-width="2" fill="none"/>',
  hourglass: '<path d="M13 8h22M13 40h22" stroke="url(#bronze)" stroke-width="5"/><path d="M16 11q0 9 8 13-8 4-8 13h16q0-9-8-13 8-4 8-13Z" fill="url(#steel)"/><path d="m19 15 5 7 5-7m-5 12-6 8h12Z" fill="#e3c58a"/>',
  skull: '<path d="M12 29C0 4 47 2 37 29l-6 4v8H17v-8Z" fill="url(#page)"/><path d="M12 22q6-6 9 1l-1 6h-6Zm16 1q4-7 9-1l-2 7h-6Zm-4 5 3 6h-6Zm-3 10v4m6-4v4" fill="#30303a" stroke="#30303a" stroke-width="1.5"/>',
  crest: '<path d="M24 5 40 11v14Q37 37 24 43 11 37 8 25V11Z" fill="url(#bronze)"/><path d="m24 10 11 5v10q-3 9-11 13-8-4-11-13V15Z" fill="#40556d"/><path d="m24 15 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="url(#page)"/>',
  spark: '<path d="m27 4-16 23h12l-2 17 17-25H25Z" fill="url(#bronze)"/><path d="m26 10-10 15h8" stroke="#fff0bf" fill="none" stroke-width="1.5"/>'
};
function uiIcon(k) {
  if (UI_ART.urls[k]) return UI_ART.urls[k];
  if (!UI_PATH[k]) return pixelUiIcon(k in UI_ICON ? k : 'book');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><defs><linearGradient id="bronze" x2=".3" y2="1"><stop stop-color="#f1db9e"/><stop offset=".48" stop-color="#c6a970"/><stop offset="1" stop-color="#897049"/></linearGradient><linearGradient id="page" x2=".3" y2="1"><stop stop-color="#f3e5c6"/><stop offset="1" stop-color="#bcac8d"/></linearGradient><linearGradient id="steel" x2=".5" y2="1"><stop stop-color="#c2d5db"/><stop offset="1" stop-color="#64808f"/></linearGradient><linearGradient id="leather" x2=".4" y2="1"><stop stop-color="#6b5b79"/><stop offset="1" stop-color="#3f354d"/></linearGradient><linearGradient id="rose" x2=".3" y2="1"><stop stop-color="#d19c8c"/><stop offset="1" stop-color="#9d5d64"/></linearGradient></defs><g stroke="#332c3c" stroke-width="1.4" stroke-linejoin="round">${UI_PATH[k]}</g></svg>`;
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), im = new Image();
  im.onload = () => { UI_ART.images[k] = im; UI_ART.loaded++; }; im.src = url;
  return UI_ART.urls[k] = url;
}
for (const k of Object.keys(UI_PATH)) uiIcon(k);
function uiRound(c, x, y, w, h, r=6) {
  r=Math.min(r,w/2,h/2); c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath();
}
function uiPanel(c,x,y,w,h,fill='#202a39',stroke='#7f775f',r=8) {
  uiRound(c,x,y,w,h,r); c.fillStyle=fill; c.fill(); c.strokeStyle=stroke; c.lineWidth=1; c.stroke();
}
function uiText(c,s,x,y,size=12,color='#efe8d9',align='left',max=Infinity,weight=500) {
  c.font=`${weight} ${size}px ${UI_ART.font}`;c.textBaseline='middle';c.textAlign=align;c.fillStyle=color;
  s=String(s); if(c.measureText(s).width>max){while(s.length&&c.measureText(s+'…').width>max)s=s.slice(0,-1);s+='…';}
  c.fillText(s,x,y);
}
function uiImage(c,key,x,y,s=16) { const im=UI_ART.images[key]; if(im)c.drawImage(im,x,y,s,s); }
function hudLayout(width=VIEW.cw,sat=VIEW.sat) {
  const w=Math.min(560,width-16),x=(width-w)/2,y=sat+6,S=16,gap=2,contentW=w-52;
  const tile=(i,row,right=false,n=1)=>({x:right?x+contentW-n*S-(n-1)*gap+i*(S+gap):x+4+i*(S+gap),y:y+34+row*18,w:S,h:S});
  return {x,y,w,h:68,S,gap,contentW,tile,pause:{x:x+w-44,y,w:44,h:44},kills:{x:x+contentW-64,y:y+4,w:64,h:16}};
}
function uiBar(c,x,y,w,h,k,col,bg='#111b27') {
  uiRound(c,x,y,w,h,h/2);c.fillStyle=bg;c.fill();
  const fill=w*clamp(k,0,1);if(fill>0){c.save();c.clip();c.fillStyle=col;c.fillRect(x,y,fill,h);c.fillStyle='rgba(255,255,255,.22)';c.fillRect(x,y,fill,Math.max(1,h*.25));c.restore();}
}
function drawXpGauge(c,top) {
 const L=hudLayout(),p=G.p,k=clamp(G.rc?G.rc.xpShow:p.xp/Math.max(1,p.need),0,1);
 uiBar(c,L.x+4,L.y,L.contentW-4,2,k,'#91bfcb');
 uiText(c,'Lv '+p.level,L.x+4,L.y+12,10,'#f0dfb4','left',46,650);
}
function uiTile(c,r,art,color,level,progress,mark) {
  uiPanel(c,r.x,r.y,r.w,r.h,'#182330',art?color:'#414c58',5);
  if(art)c.drawImage(art,r.x+1,r.y+1,r.w-2,r.h-2);
  else {c.strokeStyle='#3a4653';c.lineWidth=1;c.beginPath();c.moveTo(r.x+r.w/2-2,r.y+r.h/2);c.lineTo(r.x+r.w/2+2,r.y+r.h/2);c.stroke();}
  if(mark){c.strokeStyle=mark;c.lineWidth=2;uiRound(c,r.x+1,r.y+1,r.w-2,r.h-2,4);c.stroke();}
  if(progress!==undefined&&progress<1){
    c.save();uiRound(c,r.x+1,r.y+1,r.w-2,r.h-2,4);c.clip();c.globalAlpha=.58;c.fillStyle='#0e1725';c.beginPath();c.moveTo(r.x+r.w/2,r.y+r.h/2);c.arc(r.x+r.w/2,r.y+r.h/2,r.w,-Math.PI/2+Math.PI*2*clamp(progress,0,1),Math.PI*1.5);c.closePath();c.fill();c.restore();
  }
  if(level!=null){uiPanel(c,r.x+r.w-8,r.y+r.h-8,9,9,'#1a2330','#7f806d',2);uiText(c,level,r.x+r.w-3.5,r.y+r.h-3.5,7,'#fff4db','center',8,700);}
}
const UI_EXW_ICON={
  first:{warrior:'boomerang',rogue:'knife',archer:'arrow',engineer:'lightning',mage:'fireball',summoner:'orb',sovereign:'shield',chrono:'hourglass',priest:'regen',druid:'trap'},
  second:{warrior:'slam',rogue:'knife',archer:'arrow',engineer:'bomb',mage:'icering',summoner:'orb',sovereign:'cleave',chrono:'hourglass',priest:'beam',druid:'trap'}
};
function uiAbilityArt(id,first){const key=UI_EXW_ICON[first?'first':'second'][id];return UI_ART.images[key]||iconCanvas(key,2)||UI_ART.images.crest;}
function drawSlots(c,unused) {
  const L=hudLayout(),p=G.p,T=G.tm; c.save();c.imageSmoothingEnabled=true;
  for(let i=0;i<slotW();i++){const it=p.weapons[i];if(!it)continue;uiTile(c,L.tile(i,0),it&&iconCanvas(it.id,2),it?CFG.colors[WEAPONS[it.id].cat]:'#414c58',it&&it.lvl,undefined,it&&jobTint(WEAPONS[it.id].cat));}
  const pcd={magnet:['vacuum',()=>1-(T.vac==null?30:T.vac)/30],vit:['shield',()=>p.shield?1:1-T.shield/12],haste:['charge',()=>1-T.charge/8]};
  for(let i=0;i<CFG.slots.passive;i++){const it=p.passives[i],q=it&&pcd[it.id];if(!it)continue;uiTile(c,L.tile(i,1),it&&iconCanvas(it.id,2),CFG.colors.passive,it&&it.lvl,q&&it.br===q[0]?q[1]():undefined);}
  const specials=[[p.exw1,EXW1],[p.exw,EXW]].filter(([s])=>s);
  specials.forEach(([st,table],i)=>{const X=table[st.id],r=L.tile(i,0,true,specials.length);uiTile(c,r,uiAbilityArt(st.id,table===EXW1),'#c3a86d',undefined,X.cd>.6?1-Math.max(0,st.t)/X.cd:undefined);uiText(c,table===EXW1?'Ⅰ':'Ⅱ',r.x+3,r.y+5,7,'#fff0bb','left',10,700);});
  const ds=jobDials();ds.forEach((d,i)=>{const key=d.ic==='궁'?'spark':d.ic==='기'?'crest':d.ic==='탑'?'gear':'crest';uiTile(c,L.tile(i,1,true,ds.length),UI_ART.images[key],d.col,undefined,d.k);});
  c.restore();
}
function drawBossBar(c,y,unused) {
  const e=G.gkMob;if(!e||e.dead||!G.ph||!isBossPhase())return;
  const L=hudLayout(),D=bossDef(e.gk),bx=L.x+10,bw=L.w-20;
  uiPanel(c,L.x,y-2,L.w,43,'rgba(31,25,36,.94)','#946d69',8);
  const name=e.gk==='demon'?`${D.name} · ${['그림자 군주','암흑 결계','종언'][e.st]} (${e.st+1}/3)`:`${D.name} · ${D.gate}`;
  uiText(c,name,L.x+L.w/2,y+10,11,'#eed6c4','center',bw-12,600);
  uiBar(c,bx,y+23,bw,6,e.hp/e.maxHp,e.rage||e.st===2?'#d68c72':'#ba8188');
  if(e.gk==='demon'){c.fillStyle='#f4debe';for(const k of DM_CFG.stages)c.fillRect(bx+bw*k,y+23,1,6);}
}
function drawHUD(c) {
 const L=hudLayout(),p=G.p,ph=G.ph,P=curPhase();c.save();c.imageSmoothingEnabled=true;
 // Text-sized backplates; no full-width opaque panel and no empty inventory tiles.
 uiPanel(c,L.x,L.y+3,L.contentW+2,29,'rgba(22,31,43,.60)','#6b6c6044',5);
 drawXpGauge(c,L.y);
 uiText(c,fmtTime(G.time),L.x+L.contentW*.51,L.y+12,12,'#f0e9d9','center',52,650);
 const kills=G.kills>=10000?(G.kills/10000).toFixed(1)+'만':G.kills;
 uiText(c,'처치 '+kills,L.x+L.contentW-2,L.y+12,10,'#d9cbb3','right',64,600);
 const hp=clamp(p.hp/p.maxHp,0,1);uiBar(c,L.x+4,L.y+23,52,3,hp,hp>.3?'#9fc19d':'#d58c86');
 uiText(c,Math.ceil(p.hp),L.x+60,L.y+24,8,'#d7e1d8','left',24);
 const status=p.job==='druid'?(G.tm.wrath>0?' 분노':' 동료'+G.pets.length):p.job==='priest'?' 정화'+p.holy:'';
 const phase=P?((ph.i+1)+'/'+ph.order.length+' '+curPhaseName()):G.result==='clear'?'돌파':'이동 중';
 uiText(c,(status?status.trim()+' · ':'')+phase,L.x+L.contentW-2,L.y+25,9,ph.ambush?'#e6a58d':'#dfcb98','right',L.contentW-86,600);
 if(P)uiBar(c,L.x+86,L.y+31,L.contentW-88,1,phaseProgress(),ph.accT>0?'#f1e6bc':'#cdb57c');
 drawSlots(c,L.y+34);drawBossBar(c,L.y+76);
 const hasBoss=!!(G.gkMob&&!G.gkMob.dead&&isBossPhase()),below=L.y+(hasBoss?124:72);
 if(STATE.dev.fps&&STATE.mode!=='result')uiText(c,Math.round(STATE.fps)+' FPS · 적 '+aliveCount(),L.x+L.w-2,below+10,10,'#d1d8d9','right',L.w-8);
 let ty=Math.max(VIEW.ch*.3,below+30);for(const t of G.toasts){c.globalAlpha=Math.min(1,(t.dur-t.t)*3);uiText(c,t.text,VIEW.cw/2,ty,14,t.color,'center',VIEW.cw-30,600);ty+=24;}c.globalAlpha=1;
 drawGuide(c);c.restore();
}
function drawGuide(c) {
  const g=GD.cur;if(!g||STATE.mode!=='play')return;const tx=typeof g.tx==='function'?g.tx():g.tx,W=VIEW.cw,w=Math.min(400,W-32);
  c.save();c.globalAlpha=clamp(Math.min(GD.t*4,(GD.dur-GD.t)*3),0,1);c.font=`500 12px ${UI_ART.font}`;
  const lines=[];let line='';for(const ch of tx){if(c.measureText(line+ch).width>w-30&&line){lines.push(line);line=ch;}else line+=ch;}if(line)lines.push(line);
  const h=lines.length*18+18,x=(W-w)/2,y=Math.min(VIEW.ch*.72,VIEW.ch-VIEW.sab-h-20);
  uiPanel(c,x,y,w,h,'rgba(24,33,45,.95)','#a28b62',9);lines.forEach((s,i)=>uiText(c,s,W/2,y+18+i*18,12,'#eadfc3','center',w-26));c.restore();
}
const uiArtStyle=document.createElement('style');uiArtStyle.textContent=`
.hlogo h1{font-family:Georgia,"Noto Serif KR","Batang",Galmuri11,serif}
:root{--f-body:system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",Galmuri11,sans-serif}
.icb,.pausebtn{border:1px solid #9b8c6b;border-radius:12px;background:linear-gradient(145deg,rgba(59,67,80,.95),rgba(29,39,54,.96));box-shadow:inset 0 1px 0 #ddd1a322,0 3px 10px #11182255}
.icb img{image-rendering:auto;width:28px;height:28px}.pgt .icb{border:1px solid #706c5b;background:#293446}
.pausebtn{width:44px;height:44px;min-height:44px;right:auto}.pausebtn img{width:25px;height:25px;vertical-align:middle}
.pgh{background:linear-gradient(135deg,#202c3e,#1c2534);border-bottom:1px solid #706c5b}.pgt h2{color:#e9d8af}.ptabs button{font-size:12px;min-height:44px}.ptabs button.on{color:#f0dfb4}.ptabs .bar{background:#c6af7c}
button:focus-visible{outline:2px solid #e4c993;outline-offset:3px}.row,.cx,.ab{box-shadow:inset 0 1px 0 #e8d9b008}.stats{font-variant-numeric:tabular-nums}.ver{font-family:var(--f-body)}
@media(prefers-reduced-motion:reduce){.icb,.pausebtn{transition:none}}
`;document.head.appendChild(uiArtStyle);
