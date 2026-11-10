/* 0.40-choice2 — equipment-card presentation, using existing embedded artwork.
   No candidate generation, ordering, effects, RNG or confirmation rules here. */
const CHOICE_SCENE = {
  start:'들판으로 향하는 길',level:'한 걸음 더 강하게',chest:'들판에서 얻은 보물',
  branch:'나만의 전투 방식',job:'새로운 길을 새기다',job2:'더 깊어진 길',
  camp:'잠시 머무는 자리',door:'문 너머의 대가',bond:'함께 자라는 힘'
};
function choiceHeading(kind) {
  return `<div class="choice-kicker" aria-hidden="true"><span></span>${esc(CHOICE_SCENE[kind]||'여정의 갈림길')}<span></span></div>`;
}
// The options themselves fit the available screen. Decorative space never
// takes priority over seeing all candidates and the action buttons together.
const choiceStyle=document.createElement('style');choiceStyle.textContent=`
#ui>.layer.sel{padding:calc(var(--sat) + 12px) 14px calc(var(--sab) + 12px);gap:10px;overflow:hidden;background:linear-gradient(155deg,#1c2a2d,#181e2b);justify-content:center}
#ui>.layer.sel.choice-overflow{overflow-y:auto;justify-content:flex-start}.sel.choice-overflow .cards,.sel.choice-overflow .card{flex-shrink:0}
.sel .sel-head,.sel .cards,.sel .sel-actions,.sel .abil{width:100%;max-width:620px}
.sel .sel-head{margin:0;flex-shrink:0}.choice-kicker,.choice-number,.choice-type,.choice-foot{display:none}
.sel .sel-head h2{font:700 23px/1.2 var(--f-body);margin:0 0 5px;color:#efdfbb;letter-spacing:-.5px}
.sel .sel-head .sub{font-size:13px;line-height:1.35;margin:0;min-height:18px;color:#bfcbd0}.sel .sel-head .sub.armtip{color:#f7dfa4;animation:none}
.sel .sel-tools{gap:8px;margin-top:7px}.sel .sel-tools button{padding:7px 14px;min-height:36px;font-size:12px;border:1px solid #6a756f;background:#28343d;color:#e0d9c4}
.sel .cards{display:flex;flex-direction:column;gap:8px;flex:0 1 auto;min-height:0;max-height:100%}
.sel .card{display:grid;grid-template-columns:50px minmax(0,1fr);gap:10px;padding:11px 12px;min-height:0;flex:0 1 auto;width:100%;border:1px solid #65736b;border-left:3px solid var(--choice-color,#c3ad7e);border-radius:10px;background:linear-gradient(120deg,#303c46,#242e3d);box-shadow:inset 0 1px #ffffff0b;animation:none!important;transform:none}
.choice-art{display:flex;align-items:center;justify-content:center;min-height:0;align-self:center}
.sel .card .ic{width:48px;min-width:48px;height:48px;flex-basis:48px;border:0!important;background:transparent!important;box-shadow:none;filter:none}
.sel .card .ic.px img,.sel .card .choice-symbol img{width:46px;height:46px;max-width:100%;object-fit:contain;image-rendering:auto}
.sel .card .tx,.choice-copy-head{display:flex;flex-direction:column;min-width:0;gap:3px}
.sel .card .nm{display:block;font-size:17px;line-height:1.25;color:#f2e9d5;overflow-wrap:anywhere;letter-spacing:-.3px}
.sel .card .tag{font-size:11px;line-height:1.3;align-self:flex-start;max-width:100%;padding:0;border:0;background:transparent;color:#c5c7bd;white-space:normal;overflow-wrap:anywhere;animation:none!important}
.sel .card .ds{font-size:var(--choice-body,14px);line-height:1.4;white-space:pre-line;overflow-wrap:anywhere;color:#d0d8dc;margin:1px 0 0}
.sel .card.choice-detailed .tx{display:contents}.sel .card.choice-detailed .choice-art{grid-column:1;grid-row:1}.sel .card.choice-detailed .choice-copy-head{grid-column:2;grid-row:1;align-self:center}.sel .card.choice-detailed .ds{grid-column:1/-1}.sel .card.choice-detailed{row-gap:6px}
.sel .card.armed{outline:2px solid #ecd69a;outline-offset:1px;border-color:#d2bb82;background:linear-gradient(120deg,#44483f,#2d3540);animation:none}
.sel .card.banish{border-style:dashed;background:#372e3b}.sel .card:disabled{opacity:.42}.sel .card:focus-visible{outline:2px solid #f4df9e;outline-offset:2px}
.sel .sel-actions{display:flex;flex-shrink:0;gap:8px;padding:0}.sel .sel-actions button{min-height:40px;padding:8px;font-size:13px;background:#2c3740;border:1px solid #767765}.sel .sel-actions button.on{background:#68424a;border-color:#c7958e}
.sel .abil{min-height:0;max-height:none;flex:1;overflow-y:auto}.sel .abil .ab{background:#28313e}
@media(min-width:600px){#ui>.layer.sel{gap:12px;padding-left:24px;padding-right:24px}.sel .card{grid-template-columns:54px minmax(0,1fr);padding:12px 14px;gap:11px}.sel .card .nm{font-size:18px}.sel .card .ds{font-size:var(--choice-body,14px)}.sel .card.choice-detailed{row-gap:6px}.sel .sel-head h2{font-size:25px}}
@media(max-height:650px){#ui>.layer.sel{gap:7px;padding-top:calc(var(--sat) + 8px);padding-bottom:calc(var(--sab) + 8px)}.sel .card{padding:8px 10px;gap:7px}.sel .cards{gap:6px}.sel .card .ic{width:40px;min-width:40px;height:40px}.sel .card .ic.px img,.sel .card .choice-symbol img{width:38px;height:38px}.sel .sel-head h2{font-size:20px}.sel .card .nm{font-size:16px}.sel .sel-tools{margin-top:5px}.sel .sel-tools button{min-height:32px;padding:5px 12px}}
@media(prefers-reduced-motion:reduce){.sel *{animation:none!important;transition:none!important}}
`;document.head.appendChild(choiceStyle);
function fitChoices(){
 const layer=UI.querySelector('.sel'),cards=layer?.querySelector('.cards');if(!cards)return;
 const scroll=layer.scrollTop;layer.classList.remove('choice-overflow');layer.style.removeProperty('--choice-body');let fits=false;
 // Prefer spacing and usable text over oversized illustrations. Only the
 // densest short-screen cases need a small text adjustment (14 -> 12px).
 for(let size=14;size>=12;size-=.5){
  layer.style.setProperty('--choice-body',size+'px');
  const content=[...layer.children].reduce((sum,e)=>sum+e.getBoundingClientRect().height,0),style=getComputedStyle(layer),gap=parseFloat(style.rowGap)||0,available=layer.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
  if(content+gap*(layer.children.length-1)<=available+1&&[...cards.children].every(c=>c.scrollHeight<=c.clientHeight+1)){fits=true;break;}
 }
 layer.classList.toggle('choice-overflow',!fits);
 layer.scrollTop=scroll;
}
new MutationObserver(()=>requestAnimationFrame(fitChoices)).observe(document.getElementById('ui'),{childList:true});
window.addEventListener('resize',()=>requestAnimationFrame(fitChoices));
function choiceType(c,f) {
  if(c.t==='branch')return c.aw?'무기 각성':'성장 분기';
  if(c.t==='bond')return '동료 유대';
  if(c.t==='job'||c.t==='job2')return '직업';
  if(c.t==='relic')return '유물';
  if(c.t==='trait')return '숙련 특성';
  return {'k-melee':'근접 무기','k-ranged':'원거리 무기','k-magic':'마법 무기','k-passive':'보조 효과'}[f.k]||'여정의 선택';
}
function choiceIcon(c,f) {
  if(f.id)return icBox(f.col,f.ic,f.id);
  if(c.t==='job'&&UI_JOB_CREST[c.id])return uiJobCrest(c.id);
  if(c.t==='job2'&&UI_JOB2_CREST[c.k]&&UI_JOB2_CREST[c.k].job===c.id)return uiJob2Crest(c.id,c.k);
  // Category symbols rather than pretending a shared weapon is unique job art.
  const key=c.t==='job'||c.t==='job2'?'crest':c.t==='doorYes'?'skull':c.t==='doorNo'?'back':c.t==='heal'||c.t==='campRest'?'heart':c.t==='campSupply'?'book':c.t==='bond'?'crest':'spark';
  return `<span class="ic choice-symbol" aria-hidden="true"><img src="${uiIcon(key)}" alt=""></span>`;
}
function choiceCard(c,f,i,{off=false,banish=false,offer=false}={}) {
  const action=off?'제외 불가':offer?'봉헌':banish?'제외':'선택';
  const detailed=f.k==='k-job'||f.k==='k-branch'||f.ds.length>90;
  return `<button class="card ${f.k}${detailed?' choice-detailed':''}${banish?' banish':''}" ${offer?`data-w="${esc(c.id)}"`:`data-i="${i}"`} style="--choice-color:${esc(f.col)};--i:${i}" ${f.full?`data-full="${esc(f.full)}"`:''} ${off?'disabled':''}>
    <span class="choice-art"><span class="choice-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span>${choiceIcon(c,f)}</span>
    <span class="tx"><span class="choice-copy-head"><span class="choice-type">${choiceType(c,f)}</span><span class="nm">${esc(f.nm)}</span><span class="tag">${esc(f.tag)}</span></span><span class="ds">${esc(f.ds)}</span><span class="choice-foot" aria-hidden="true"><span class="choice-cta" data-action="${action}"></span><span class="choice-arrow">↗</span></span></span>
  </button>`;
}
