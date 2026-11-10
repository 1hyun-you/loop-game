/* 0.40-scale1 — readable parchment/bronze interface; presentation only.
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
// 0.42-art1: UI-native crests. Distinct silhouettes, existing job palette,
// upper-left highlights and the shared plum outline; no gameplay state writes.
const UI_JOB_CREST = {
  warrior: '<path d="m23 4 6 5-3 21h-7L18 9Z" fill="url(#steel)"/><path d="m16 27 16 0 1 6-7-1v10h-6V32l-6 1Z" fill="@"/><path d="m8 23-4-5m36 5 4-5M10 35l-5 3m33-3 5 3" fill="none" stroke="@" stroke-width="3"/><path d="m21 10 2 15" fill="none" stroke="#fff0d5"/>',
  rogue: '<path d="M23 4 28 17 43 13 32 25 39 39 25 32 12 44 16 28 3 22 18 18Z" fill="@"/><path d="m23 12 2 9 10-3-7 8 4 8-8-5-7 7 2-10-8-3 10-2Z" fill="#30424a"/><circle cx="24" cy="25" r="4" fill="url(#steel)"/><path d="m23 9 3 10" stroke="#e3fff3" fill="none"/>',
  sovereign: '<path d="m9 18-3-12 10 6 8-8 8 8 10-6-3 12Z" fill="@"/><path d="M10 22h28v10Q33 40 24 44 15 40 10 32Z" fill="@"/><path d="M15 25h18v6q-3 6-9 9-6-3-9-9Z" fill="#4d4352"/><path d="m24 25 5 6-5 7-5-7Z" fill="url(#page)"/><path d="M11 15h25" stroke="#fff2bf" fill="none"/>',
  archer: '<path d="M12 5Q43 23 12 43l7-19Z" fill="@"/><path d="m13 8 6 16-6 16" fill="none" stroke="url(#page)" stroke-width="2"/><path d="M4 24h35" stroke="url(#steel)" stroke-width="3"/><path d="m34 17 10 7-10 7 2-7Z" fill="@"/><path d="m5 18 6 6-6 6" fill="none" stroke="@" stroke-width="3"/>',
  engineer: '<path d="m19 4 10 0 1 6 5 2 5-2 5 9-5 4v5l4 4-5 9-6-2-5 4H18l-3-5-6 1-5-9 4-5v-5l-4-4 5-8 6 2 4-2Z" fill="@"/><circle cx="24" cy="25" r="13" fill="#4b424a"/><path d="m14 22 6 4 4-10 4 10 6-4-4 13H18Z" fill="url(#steel)"/><circle cx="24" cy="29" r="3" fill="@"/><path d="m19 8 9 0" stroke="#fff0d5" fill="none"/>',
  chrono: '<circle cx="24" cy="24" r="19" fill="#494158" stroke="@" stroke-width="3"/><path d="M16 11h16v5l-6 8 6 8v5H16v-5l6-8-6-8Z" fill="url(#steel)"/><path d="m19 15 5 6 5-6m-5 12-6 7h12Z" fill="@"/><path d="M24 5v4m0 30v4M5 24h4m30 0h4" stroke="@" stroke-width="3"/><path d="M10 16q3-7 9-7" stroke="#f0eaff" fill="none"/>',
  mage: '<path d="M25 3q8 10 4 17l9-9q8 14 4 23-4 10-18 10C8 44 2 34 7 23l7 5q-2-12 11-25Z" fill="@"/><path d="M24 16q5 9 2 13l7-6q5 12-9 17-13-3-10-13l4 3q0-7 6-14Z" fill="#864e8c"/><circle cx="24" cy="33" r="7" fill="url(#page)"/><path d="m35 5 2 3 4 1-4 2-2 3-1-4-3-1 3-1Z" fill="@"/>',
  summoner: '<path d="M8 32V19Q8 4 23 5q15 1 15 16v10l-6-3-2 11-8-5-6 10-4-12Z" fill="@"/><path d="m14 18 7 2-2 5h-5Zm12 2 7-2-1 7h-5Z" fill="#352c46"/><path d="m20 29 4-2 4 2-4 3Z" fill="#352c46"/><path d="m34 20 9-2 1 7-4 3v14h-4V28l-4-3Z" fill="url(#steel)"/><path d="M13 14q2-5 8-5" stroke="#eee3ff" fill="none"/>',
  priest: '<ellipse cx="24" cy="11" rx="15" ry="6" fill="#504957" stroke="@" stroke-width="3"/><path d="m4 25 9 3 5 12-11-5Zm40 0-9 3-5 12 11-5Z" fill="@"/><circle cx="24" cy="28" r="11" fill="@"/><path d="M24 19v18m-7-9h14" stroke="#fffdf0" stroke-width="3" fill="none"/><path d="M16 23q2-3 5-3" stroke="#fffdf0" fill="none"/>',
  druid: '<path d="M24 28C7 29 3 17 6 5c13 0 21 7 18 23Z" fill="@"/><path d="M25 30C22 14 33 8 43 10c1 12-5 22-18 20Z" fill="@"/><path d="m11 11 13 18 13-13M24 29v11m0-4-11 6m11-2 10 4m-10-9 14 1" fill="none" stroke="#b8e6a1" stroke-width="3"/><path d="m21 38-3 6m9-5 2 6" stroke="@" stroke-width="3" fill="none"/>'
};
for (const id of Object.keys(UI_JOB_CREST)) UI_PATH['crest_'+id] = UI_JOB_CREST[id].replace(/@/g, JOB_COL[id]);
function uiJobCrest(id, cls = '') {
  if (!UI_JOB_CREST[id]) return icBox('#8a86a0', '?');
  // Keep the former codex letter beneath the image for decoding failures.
  return `<span class="ic px job-crest ${cls}" style="position:relative;background:${shadeHex(JOB_COL[id],.42)};border-color:${JOB_COL[id]}" aria-hidden="true"><span hidden>${esc(JOBS[id].ic)}</span><img src="${uiIcon('crest_'+id)}" alt="" data-job-crest="${id}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain" onerror="this.hidden=true;this.previousElementSibling.hidden=false"></span>`;
}
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
  const w=Math.min(600,width-16),x=(width-w)/2,y=sat+6,S=clamp(Math.floor((width-280)/28)+22,22,30),gap=3,contentW=w-56;
  const tile=(i,row,right=false,n=1)=>({x:right?x+contentW-n*S-(n-1)*gap+i*(S+gap):x+4+i*(S+gap),y:y+48+row*(S+gap),w:S,h:S});
  return {x,y,w,h:48+2*S+gap,S,gap,contentW,tile,pause:{x:x+w-48,y,w:48,h:48},kills:{x:x+contentW-76,y:y+4,w:76,h:18}};
}
function uiBar(c,x,y,w,h,k,col,bg='#111b27') {
  uiRound(c,x,y,w,h,h/2);c.fillStyle=bg;c.fill();
  const fill=w*clamp(k,0,1);if(fill>0){c.save();c.clip();c.fillStyle=col;c.fillRect(x,y,fill,h);c.fillStyle='rgba(255,255,255,.22)';c.fillRect(x,y,fill,Math.max(1,h*.25));c.restore();}
}
function drawXpGauge(c,top) {
 const L=hudLayout(),p=G.p,k=clamp(G.rc?G.rc.xpShow:p.xp/Math.max(1,p.need),0,1);
 uiBar(c,L.x+4,L.y,L.contentW-4,3,k,'#91bfcb');
 uiText(c,'Lv '+p.level,L.x+4,L.y+14,13,'#f0dfb4','left',58,650);
}
function uiTile(c,r,art,color,level,progress,mark) {
  uiPanel(c,r.x,r.y,r.w,r.h,'#182330',art?color:'#414c58',5);
  if(art)c.drawImage(art,r.x+1,r.y+1,r.w-2,r.h-2);
  else {c.strokeStyle='#3a4653';c.lineWidth=1;c.beginPath();c.moveTo(r.x+r.w/2-2,r.y+r.h/2);c.lineTo(r.x+r.w/2+2,r.y+r.h/2);c.stroke();}
  if(mark){c.strokeStyle=mark;c.lineWidth=2;uiRound(c,r.x+1,r.y+1,r.w-2,r.h-2,4);c.stroke();}
  if(progress!==undefined&&progress<1){
    c.save();uiRound(c,r.x+1,r.y+1,r.w-2,r.h-2,4);c.clip();c.globalAlpha=.58;c.fillStyle='#0e1725';c.beginPath();c.moveTo(r.x+r.w/2,r.y+r.h/2);c.arc(r.x+r.w/2,r.y+r.h/2,r.w,-Math.PI/2+Math.PI*2*clamp(progress,0,1),Math.PI*1.5);c.closePath();c.fill();c.restore();
  }
  if(level!=null){uiPanel(c,r.x+r.w-11,r.y+r.h-11,12,12,'#1a2330','#7f806d',3);uiText(c,level,r.x+r.w-5,r.y+r.h-5,10,'#fff4db','center',11,700);}
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
  uiPanel(c,L.x,y-2,L.w,43,'rgba(31,25,36,.88)','#946d69',8);
  const name=e.gk==='demon'?`${D.name} · ${['그림자 군주','암흑 결계','종언'][e.st]} (${e.st+1}/3)`:`${D.name} · ${D.gate}`;
  uiText(c,name,L.x+L.w/2,y+10,13,'#eed6c4','center',bw-12,600);
  uiBar(c,bx,y+23,bw,8,e.hp/e.maxHp,e.rage||e.st===2?'#d68c72':'#ba8188');
  if(e.gk==='demon'){c.fillStyle='#f4debe';for(const k of DM_CFG.stages)c.fillRect(bx+bw*k,y+23,1,6);}
}
function drawHUD(c) {
 const L=hudLayout(),p=G.p,ph=G.ph,P=curPhase();c.save();c.imageSmoothingEnabled=true;
 // Text-sized backplates; no full-width opaque panel and no empty inventory tiles.
 uiPanel(c,L.x,L.y+3,L.contentW+2,40,'rgba(22,31,43,.60)','#6b6c6044',5);
 drawXpGauge(c,L.y);
 uiText(c,fmtTime(G.time),L.x+L.contentW*.48,L.y+14,15,'#f0e9d9','center',58,650);
 const kills=G.kills>=10000?(G.kills/10000).toFixed(1)+'만':G.kills;
 uiText(c,'처치 '+kills,L.x+L.contentW-2,L.y+14,12,'#d9cbb3','right',76,600);
 const hp=clamp(p.hp/p.maxHp,0,1);uiBar(c,L.x+4,L.y+31,52,5,hp,hp>.3?'#9fc19d':'#d58c86');
 uiText(c,Math.ceil(p.hp),L.x+61,L.y+33,12,'#d7e1d8','left',30);
 const status=p.job==='druid'?(G.tm.wrath>0?' 분노':' 동료'+G.pets.length):p.job==='priest'?' 정화'+p.holy:'';
 const phase=P?((ph.i+1)+'/'+ph.order.length+' '+curPhaseName()):G.result==='clear'?'돌파':'이동 중';
 uiText(c,(status?status.trim()+' · ':'')+phase,L.x+L.contentW-2,L.y+32,12,ph.ambush?'#e6a58d':'#dfcb98','right',L.contentW-100,600);
 if(P)uiBar(c,L.x+100,L.y+41,L.contentW-102,2,phaseProgress(),ph.accT>0?'#f1e6bc':'#cdb57c');
 drawSlots(c,L.y+48);drawBossBar(c,L.y+L.h+6);
 const hasBoss=!!(G.gkMob&&!G.gkMob.dead&&isBossPhase()),below=L.y+L.h+(hasBoss?54:4);
 if(STATE.dev.fps&&STATE.mode!=='result')uiText(c,Math.round(STATE.fps)+' FPS · 적 '+aliveCount(),L.x+L.w-2,below+10,10,'#d1d8d9','right',L.w-8);
 let ty=Math.max(VIEW.ch*.3,below+30);for(const t of G.toasts){c.globalAlpha=Math.min(1,(t.dur-t.t)*3);uiText(c,t.text,VIEW.cw/2,ty,14,t.color,'center',VIEW.cw-30,600);ty+=24;}c.globalAlpha=1;
 drawGuide(c);c.restore();
}
function drawGuide(c) {
  const g=GD.cur;if(!g||STATE.mode!=='play')return;const tx=typeof g.tx==='function'?g.tx():g.tx,W=VIEW.cw,w=Math.min(400,W-32);
  c.save();c.globalAlpha=clamp(Math.min(GD.t*4,(GD.dur-GD.t)*3),0,1);c.font=`500 14px ${UI_ART.font}`;
  const lines=[];let line='';for(const ch of tx){if(c.measureText(line+ch).width>w-30&&line){lines.push(line);line=ch;}else line+=ch;}if(line)lines.push(line);
  const h=lines.length*21+18,x=(W-w)/2,y=Math.min(VIEW.ch*.72,VIEW.ch-VIEW.sab-h-20);
  uiPanel(c,x,y,w,h,'rgba(24,33,45,.95)','#a28b62',9);lines.forEach((s,i)=>uiText(c,s,W/2,y+19+i*21,14,'#eadfc3','center',w-26));c.restore();
}
const uiArtStyle=document.createElement('style');uiArtStyle.textContent=`
.hlogo h1{font-family:Georgia,"Noto Serif KR","Batang",Galmuri11,serif}
:root{--f-body:system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",Galmuri11,sans-serif}
.icb,.pausebtn{border:1px solid #9b8c6b;border-radius:12px;background:linear-gradient(145deg,rgba(59,67,80,.95),rgba(29,39,54,.96));box-shadow:inset 0 1px 0 #ddd1a322,0 3px 10px #11182255}
.icb img{image-rendering:auto;width:28px;height:28px}.pgt .icb{border:1px solid #706c5b;background:#293446}
.pausebtn{width:44px;height:44px;min-height:44px;right:auto}.pausebtn img{width:25px;height:25px;vertical-align:middle}
.pausebtn img{width:28px;height:28px}
.cards,.sel-head,.sel-actions{max-width:520px}
.card{padding:15px;gap:14px;flex-shrink:0}.card .ic{flex-basis:58px;height:58px}.card .ic.px img{width:52px;height:52px}
.card .nm{font-size:18px}.card .ds{font-size:15px;line-height:1.55;overflow-wrap:anywhere}.card .tag{font-size:12px}
.dlg{max-width:520px}.dlg .nm{font-size:16px}.dlg .tx{font-size:17px}.dlg .pt{flex-basis:72px;height:72px}
.ab{grid-template-columns:32px minmax(0,1fr);padding:10px}.ab .ic{width:32px;height:32px}.ab .ic.px img{width:28px;height:28px}.ab b{font-size:16px}.ab p{font-size:14px}
@media(max-width:359px){.card{padding:12px;gap:10px}.card .ic{flex-basis:50px;height:50px}.card .ic.px img{width:44px;height:44px}.card .nm{font-size:17px}.dlg{gap:10px}.dlg .pt{flex-basis:60px;height:60px}}
@media(min-width:600px){.cards,.sel-head,.sel-actions{max-width:580px}.card .ic{flex-basis:68px;height:68px}.card .ic.px img{width:60px;height:60px}.card .nm{font-size:20px}.card .ds{font-size:16px}.card .tag{font-size:13px}.dlg .tx{font-size:18px}}
.pgh{background:linear-gradient(135deg,#202c3e,#1c2534);border-bottom:1px solid #706c5b}.pgt h2{color:#e9d8af}.ptabs button{font-size:12px;min-height:44px}.ptabs button.on{color:#f0dfb4}.ptabs .bar{background:#c6af7c}
button:focus-visible{outline:2px solid #e4c993;outline-offset:3px}.row,.cx,.ab{box-shadow:inset 0 1px 0 #e8d9b008}.stats{font-variant-numeric:tabular-nums}.ver{font-family:var(--f-body)}
@media(prefers-reduced-motion:reduce){.icb,.pausebtn{transition:none}}
`;document.head.appendChild(uiArtStyle);
