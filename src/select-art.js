/* 0.40-choice1 — equipment-card presentation, using existing embedded artwork.
   No candidate generation, ordering, effects, RNG or confirmation rules here. */
const CHOICE_SCENE = {
  start:'들판으로 향하는 길',level:'한 걸음 더 강하게',chest:'들판에서 얻은 보물',
  branch:'나만의 전투 방식',job:'새로운 길을 새기다',job2:'더 깊어진 길',
  camp:'잠시 머무는 자리',door:'문 너머의 대가',bond:'함께 자라는 힘'
};
function choiceHeading(kind) {
  return `<div class="choice-kicker" aria-hidden="true"><span></span>${esc(CHOICE_SCENE[kind]||'여정의 갈림길')}<span></span></div>`;
}
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
  // Category symbols rather than pretending a shared weapon is unique job art.
  const key=c.t==='job'||c.t==='job2'?'crest':c.t==='doorYes'?'skull':c.t==='doorNo'?'back':c.t==='heal'||c.t==='campRest'?'heart':c.t==='campSupply'?'book':c.t==='bond'?'crest':'spark';
  return `<span class="ic choice-symbol" aria-hidden="true"><img src="${uiIcon(key)}" alt=""></span>`;
}
function choiceCard(c,f,i,{off=false,banish=false,offer=false}={}) {
  const action=off?'제외 불가':offer?'봉헌':banish?'제외':'선택';
  const detailed=f.k==='k-job'||f.k==='k-branch'||f.ds.length>90;
  return `<button class="card ${f.k}${detailed?' choice-detailed':''}${banish?' banish':''}" ${offer?`data-w="${esc(c.id)}"`:`data-i="${i}"`} style="--choice-color:${esc(f.col)};--i:${i}" ${off?'disabled':''}>
    <span class="choice-art"><span class="choice-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span>${choiceIcon(c,f)}</span>
    <span class="tx"><span class="choice-copy-head"><span class="choice-type">${choiceType(c,f)}</span><span class="nm">${esc(f.nm)}</span><span class="tag">${esc(f.tag)}</span></span><span class="ds">${esc(f.ds)}</span><span class="choice-foot" aria-hidden="true"><span class="choice-cta" data-action="${action}"></span><span class="choice-arrow">↗</span></span></span>
  </button>`;
}
const choiceStyle=document.createElement('style');choiceStyle.textContent=`
#ui>.layer.sel{background:radial-gradient(ellipse at 50% 0%,#3c4249a6,transparent 62%),linear-gradient(160deg,#172a2a,#161c2b 65%,#211e2d);padding:calc(var(--sat) + 24px) 18px calc(var(--sab) + 26px);gap:20px;scrollbar-gutter:stable;scroll-padding-block:20px}
.sel .sel-head,.sel .cards,.sel .sel-actions,.sel .abil{width:100%;max-width:560px;flex-shrink:0}
.sel .sel-head{margin-top:clamp(4px,3vh,26px)}
.choice-kicker{display:flex;align-items:center;justify-content:center;gap:12px;color:#c2ad7e;font-size:12px;letter-spacing:1.4px;margin-bottom:12px}
.choice-kicker>span{height:1px;width:30px;background:linear-gradient(90deg,transparent,#b49c64)}.choice-kicker>span:last-child{transform:rotate(180deg)}
.sel .sel-head h2{font-family:Georgia,'Noto Serif KR','Batang',Galmuri11,serif;font-size:29px;line-height:1.3;letter-spacing:-.8px;color:#f3e3bd;margin:0 0 8px}
.sel .sel-head .sub{font-size:14px;line-height:1.6;color:#b9c4c5;margin:0;min-height:23px;overflow-wrap:anywhere}.sel .sel-head .sub.armtip{color:#ffe2a3}
.sel .sel-tools{gap:8px;margin-top:14px}.sel .sel-tools button{background:#26343bbf;border:1px solid #75807777;color:#d9d8c8;padding:9px 16px;font-size:13px;min-height:44px}.sel .sel-tools button.on{background:#786841;color:#fff3ca;border-color:#d0b474}
.sel .cards{gap:13px}
.sel .card{position:relative;display:grid;grid-template-columns:98px minmax(0,1fr);align-items:stretch;gap:16px;padding:16px;border:1px solid #77857c66;border-left:3px solid var(--choice-color,#c4a874);border-radius:15px;background:linear-gradient(120deg,#344049f2,#222d3bf5 76%);box-shadow:inset 0 1px #f5e4b51a,0 7px 20px #080e162e;isolation:isolate;overflow:visible;flex-shrink:0}
.sel .card::before{content:'';position:absolute;left:13px;right:13px;top:0;height:1px;background:linear-gradient(90deg,transparent,#e5dab63d,transparent);pointer-events:none}
.choice-art{position:relative;display:flex;align-items:center;justify-content:center;align-self:center;min-height:106px;border-radius:50%;background:radial-gradient(ellipse,#b7a66b25,transparent 69%)}
.choice-art::after{content:'';position:absolute;width:78px;height:78px;border:1px solid #dfd2a51c;border-radius:50%;transform:rotate(-12deg) scaleY(.9);pointer-events:none}
.choice-number{position:absolute;left:0;top:-2px;color:#b2b9af8c;font:11px ui-monospace,monospace;letter-spacing:1px}
.sel .card .ic{position:relative;z-index:1;width:92px;min-width:92px;height:92px;flex-basis:92px;background:transparent!important;border:0!important;border-radius:0;box-shadow:none;filter:drop-shadow(0 6px 4px #080e1655)}
.sel .card .ic.px img,.sel .card .choice-symbol img{width:82px;height:82px;max-width:100%;image-rendering:auto;object-fit:contain}.sel .card .choice-symbol img{width:66px;height:66px}
.sel .card .tx{min-width:0;gap:5px;align-self:center}
.choice-copy-head{display:flex;flex-direction:column;align-items:flex-start;gap:5px;min-width:0}
.sel .card.choice-detailed .tx{display:contents}.sel .card.choice-detailed .choice-art{grid-column:1;grid-row:1}.sel .card.choice-detailed .choice-copy-head{grid-column:2;grid-row:1;align-self:center}.sel .card.choice-detailed .ds,.sel .card.choice-detailed .choice-foot{grid-column:1/-1;margin-top:0}.sel .card.choice-detailed{row-gap:11px}
.choice-type{font-size:11px;font-weight:650;letter-spacing:.5px;color:#e4dcc4;color:color-mix(in srgb,var(--choice-color,#d2bc85) 65%,#fff2dc);line-height:1.5}
.sel .card .nm{display:block;color:#f4ecd8;font-size:20px;font-weight:750;line-height:1.32;letter-spacing:-.5px;overflow-wrap:anywhere}
.sel .card .tag{align-self:flex-start;max-width:100%;font-size:11px;line-height:1.5;font-weight:550;border:0;border-radius:4px;padding:2px 6px;background:#0f192c70;color:#d2d4c5;overflow-wrap:anywhere}
.sel .card .ds{font-size:15px;line-height:1.6;color:#cbd3d6;white-space:pre-line;overflow-wrap:anywhere;margin-top:3px}
.choice-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid #d3c5971c;margin-top:6px;padding-top:8px;font-size:11px;color:#b7bba9;line-height:1.5}
.choice-cta::after{content:attr(data-action)}.choice-arrow{font-size:18px;color:#d5c391}
.sel .card.armed{outline:2px solid #f3dfaa;outline-offset:3px;border-color:#e2c685;background:linear-gradient(120deg,#495047,#2c3540);box-shadow:0 0 0 5px #c7ab6522,0 8px 24px #080e1644;animation:none}
.sel .card.armed .choice-cta::after{content:'한 번 더 눌러 확정';color:#ffe6ab}.sel .card.armed .choice-arrow{color:#ffe6ab}
.sel .card.banish{border-style:dashed;background:linear-gradient(120deg,#44333f,#292d3d)}.sel .card.banish .choice-cta::after{color:#efb5b4}
.sel .card:disabled{opacity:.42}.sel .card:focus-visible{outline:3px solid #e9d49b;outline-offset:3px}
.sel .sel-actions{display:flex;gap:10px;padding-top:3px}.sel .sel-actions button{min-height:46px;border:1px solid #9c9a7c77;background:#2a353b;color:#ded9c2;font-size:14px;border-radius:9px}.sel .sel-actions button.on{background:#653f47;border-color:#cf9e94;color:#ffe1d5}
.sel .abil{max-height:none;overflow:visible}.sel .abil .ab{background:#273440cc;border:1px solid #70776a66}
@media(max-width:359px){#ui>.layer.sel{padding-left:12px;padding-right:12px;gap:16px}.sel .card{grid-template-columns:74px minmax(0,1fr);gap:11px;padding:13px 12px}.choice-art{min-height:86px}.choice-art::after{width:64px;height:64px}.sel .card .ic{width:74px;min-width:74px;height:74px;flex-basis:74px}.sel .card .ic.px img{width:68px;height:68px}.sel .card .choice-symbol img{width:54px;height:54px}.sel .card .nm{font-size:18px}.sel .card .ds{font-size:15px}.sel .sel-head h2{font-size:26px}.choice-kicker{font-size:11px;letter-spacing:.7px;gap:8px}}
@media(min-width:600px){#ui>.layer.sel{gap:23px}.sel .sel-head,.sel .cards,.sel .sel-actions,.sel .abil{max-width:640px}.sel .card{grid-template-columns:132px minmax(0,1fr);padding:21px;gap:24px}.choice-art{min-height:126px}.choice-art::after{width:108px;height:108px}.sel .card .ic{width:120px;min-width:120px;height:120px;flex-basis:120px}.sel .card .ic.px img{width:104px;height:104px}.sel .card .choice-symbol img{width:84px;height:84px}.sel .card .nm{font-size:23px}.sel .card .ds{font-size:16px}.choice-type,.sel .card .tag,.choice-foot{font-size:12px}.sel .sel-head h2{font-size:34px}}
@media(max-height:650px){#ui>.layer.sel{padding-top:calc(var(--sat) + 15px);gap:15px}.sel .sel-head{margin-top:0}.choice-kicker{margin-bottom:8px}.sel .card{padding-top:12px;padding-bottom:12px}}
@media(hover:hover){.sel .card:not(:disabled):hover{border-color:#d3bf88;filter:brightness(1.05)}}
@media(prefers-reduced-motion:reduce){.sel .card,.sel .card *,.sel .sub{animation:none!important;transition:none!important}}
`;document.head.appendChild(choiceStyle);
