/* ============================================================
   0.36 도트 아이콘: 무기 18종 · 보조 효과 8종 (12×12 문자 격자, 외곽선 자동)
   — 화면 하단 보유 칸(캔버스) · 선택 카드 · 내 능력 · 도감(HTML) 공용
   — 배경: 계열 색 어둡게 + 계열 색 테두리 (아이콘 대비 확보)
   ============================================================ */
const ICON12 = {
  cleave: [
    '..........MW', '.........MWM', '........MWM.', '.......MWM..', '......MWM...', '.....MWM....',
    '..y.MWM.....', '...yWM......', '...nyy......', '..nN.y......', '.nN.........', 'nN..........'],
  spin: [
    '....MW......', '...MWW......', '...MW.......', '.....yy..MWM', '....yYYy.WW.', '..WMyYYy....',
    '....yYYyMW..', '.WW.yYYy....', 'MWM..yy.....', '.......WM...', '......WWM...', '......WM....'],
  arrow: [
    '.......MMMW.', '........MWW.', '.......n.MW.', '......n...M.', '.....n......', '....n.......',
    '...n........', '..n.........', 'een.........', '.ee.........', 'e.e.........', '............'],
  boomerang: [
    '..MMMM......', '.MWWWWM.....', 'MWWWWWWn....', 'MWWWWWnN....', '.MWWWnN.....', '..MMnN......',
    '....nN......', '...nN.......', '..nN........', '.nN.........', 'nN..........', '............'],
  fireball: [
    '......r.....', '....r.ro....', '...roooor...', '..rooyyyor..', '.rooyyyyyor.', '.royywwyyor.',
    '.royywwyyo..', '.rooyyyyor..', '..rooyyoor..', '...rrooorr..', '.....rrr....', '............'],
  lightning: [
    '......yyyy..', '.....yyyy...', '....yyyy....', '...yyyy.....', '..yyyyyyyy..', '......yyy...',
    '.....yyy....', '....yyy.....', '...yyw......', '...yw.......', '..yw........', '..w.........'],
  shield: [
    '.mmmmmmmmmm.', '.mWWWWWWWWm.', '.mWWyyyyWWm.', '.mWWyYYyWWm.', '.mWWyYYyWWm.', '.mWWWyyWWWm.',
    '..mWWWWWWm..', '..mWWWWWWm..', '...mWWWWm...', '....mWWm....', '.....mm.....', '............'],
  slam: [
    '..mmmmmmmm..', '..mMMMMMMm..', '..mMMMMMMm..', '..mmmmmmmm..', '.....nn.....', '.....nn.....',
    '.....nn.....', '.....nn.....', '.o...nn...o.', '..o..nn..o..', 'nnoonnnnoonn', 'NNNNNNNNNNNN'],
  knife: [
    '.....W....W.', '....WM...WM.', '...WM...WM..', '..WM...WM...', '.yM...yM....', '..y....y....',
    '.n.y..n.y...', 'n.....n.....', '............', '..........W.', '.........WM.', '........WM..'],
  trap: [
    '............', '............', '.M.M.MM.M.M.', '.MWMWMMWMWM.', '.mMMMMMMMMm.', '.m...rr...m.',
    '.m...rr...m.', '.mMMMMMMMMm.', '.MWMWMMWMWM.', '.M.M.MM.M.M.', '............', '............'],
  icering: [
    '....cccc....', '..ccWWWWcc..', '.cWW....WWc.', '.cW..w...Wc.', 'cW..w.w...Wc', 'cW...w....Wc',
    'cW...w.w..Wc', 'cW....w...Wc', '.cW......Wc.', '.cWW....WWc.', '..ccWWWWcc..', '....cccc....'],
  orb: [
    '....cccc....', '..cccccccc..', '.ccwwcccccc.', '.cwwccccccc.', 'ccwcccccccuc', 'cccccccccuuc',
    'ccccccccuuuc', 'cccccccuuuuc', '.cccccuuuuc.', '.ccccuuuuuc.', '..ccuuuuuc..', '....uuuu....'],
  lance: [
    '.........WWW', '........WWWM', '.........WM.', '.......rM...', '......nr....', '.....n......',
    '....n.......', '...n........', '..n.........', '.n..........', 'n...........', '............'],
  flail: [
    '.......M.M..', '......MMMMM.', '.....MMWMMMM', '......MMMMM.', '.....MMMMMMM', '....m.MMMMM.',
    '...m...M.M..', '..m.........', '.n..........', 'nN..........', 'N...........', '............'],
  shuriken: [
    '....MM......', '....MWM.....', '.....MW.....', '.....MWMMMM.', '.MMMMWKWWWM.', '.MWWWKWMMMM.',
    '.MMMMWM.....', '......WM....', '......MWM...', '.......MM...', '............', '............'],
  bomb: [
    '.........y..', '........yoy.', '.......n.y..', '......n.....', '....KKKK....', '...KkkkkK...',
    '..KkWkkkkK..', '..KkWkkkkK..', '..KkkkkkkK..', '..KkkkkkkK..', '...KkkkkK...', '....KKKK....'],
  beam: [
    '............', '.yy.........', 'yyyy.y.y.y.y', 'yywwyyyyyyyy', 'ywwwwwwwwwww', 'ywwwwwwwwwww',
    'yywwyyyyyyyy', 'yyyy.y.y.y.y', '.yy.........', '............', '............', '............'],
  vortex: [
    '.WWWWWWWWWW.', '..cccccccc..', '..WWWWWWWW..', '...cccccc...', '...WWWWWW...', '....cccc....',
    '....WWWW....', '.....ccc....', '.....WW.....', '....W.......', '............', '............'],
  vit: [
    '............', '..rr....rr..', '.rwrr..rrrr.', '.rwrrrrrrrr.', '.rrrrrrrrrr.', '.rrrrrrrrRr.',
    '..rrrrrrRr..', '...rrrrRr...', '....rrRr....', '.....rr.....', '............', '............'],
  might: [
    '............', '..ssssssss..', '.sSsSsSsSs..', '.ssssssssss.', '.ssssssssss.', '.Sssssssss..',
    '..ssssssss..', '...SSSSSS...', '...mmmmmm...', '...mMMMMm...', '...mmmmmm...', '............'],
  swift: [
    '............', '.....nnn....', '.....nnn.ww.', 'w....nnnwWw.', '.....nnnww..', 'ww...nnn....',
    '....nnnn....', 'w.nnnnnn....', '.nnnnnnn....', '.NNNNNNN....', '............', '............'],
  haste: [
    '.nnnnnnnnnn.', '..eeeeeeee..', '..eyyyyyye..', '...eyyyye...', '....eyye....', '.....ee.....',
    '....e..e....', '...e.yy.e...', '..e.yyyy.e..', '..eyyyyyye..', '.nnnnnnnnnn.', '............'],
  area: [
    '....oooo....', '..oo....oo..', '.o..yyyy..o.', '.o.y....y.o.', 'o.y..rr..y.o', 'o.y.rrrr.y.o',
    'o.y.rrrr.y.o', 'o.y..rr..y.o', '.o.y....y.o.', '.o..yyyy..o.', '..oo....oo..', '....oooo....'],
  multi: [
    '.W...W...W..', 'WWW.WWW.WWW.', '.n...n...n..', '.n...n...n..', '.n...n...n..', '.n...n...n..',
    '.n...n...n..', 'eee.eee.eee.', 'e.e.e.e.e.e.', '............', '............', '............'],
  magnet: [
    '..WW....WW..', '..WW....WW..', '..rr....rr..', '..rr....rr..', '..rr....rr..', '..rr....rr..',
    '..rrr..rrr..', '...rrrrrr...', '....rrrr....', '............', '.c..c..c..c.', '............'],
  regen: [
    '....gggg....', '....gvvg....', '....gvvg....', 'gggggvvggggg', 'gvvvvvvvvvvg', 'gvvvvvvvvvvg',
    'gggggvvggggg', '....gvvg....', '....gvvg....', '....gggg....', '............', '............'],
};
const ICON_URL = new Map();
/* 아이콘 이미지 주소 (1텍셀 = 4픽셀 고정 생성, 화면에서 정수 비율 축소·확대) */
function pixelIconURL(id) {
  if (!ICON12[id]) return null;
  let u = ICON_URL.get(id);
  if (!u) { const g = bakeGrid(ICON12[id].map(r => r.padEnd(12, '.')), DOT_PAL, 4, false, 'n', '#1b1626'); u = g.cv.toDataURL(); ICON_URL.set(id, u); }
  return u;
}
/* 캔버스용 아이콘 (보유 칸) */
const ICON_CV = new Map();
function pixelIconCanvas(id, t) {
  if (!ICON12[id]) return null;
  const key = id + '|' + t; let s = ICON_CV.get(key);
  if (!s) { s = bakeGrid(ICON12[id].map(r => r.padEnd(12, '.')), DOT_PAL, t, false, 'n', '#1b1626').cv; ICON_CV.set(key, s); }
  return s;
}
/* HTML 아이콘 칸: 도트 아이콘 보유 시 그림, 없으면 기존 글자 */
function icBox(col, ic, id, cls = '') {
  const u = id && iconURL(id);
  if (!u) return `<span class="ic ${cls}" style="background:${col}">${esc(ic)}</span>`;
  return `<span class="ic px ${cls}" style="background:${shadeHex(col, 0.42)};border-color:${col}"><img src="${u}" alt="${esc(ic)}" data-art-icon="${esc(id)}"></span>`;
}
