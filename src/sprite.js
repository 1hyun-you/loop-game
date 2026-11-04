/* ============================================================
   도트 그래픽 기반 (0.19, 표현·보강 단계)
   — 공통 색상표 · 문자 격자 그림 정의 · 사전 그림 저장(오프스크린 캔버스) · 정수 배율 출력
   — 화풍: 밝은 판타지 레트로, 외곽선 진보라(k), 1텍셀 = 월드 2 단위 기본
   ============================================================ */
const DOT_PAL = {
  k: '#1b1626', K: '#3a2e4a', w: '#ffffff', W: '#dfe6ee',
  s: '#f6cfa0', S: '#cf8f66',
  y: '#ffd24a', Y: '#c8902a',
  r: '#e8503c', R: '#9a2a2c', o: '#ee8a3e', O: '#a85a2c',
  g: '#6ad05a', G: '#3a8c40', v: '#b6f07e',
  u: '#a07ee6', U: '#5e44a0',
  n: '#8a5a3a', N: '#583824',
  e: '#ece4cc', E: '#a49a80',
  m: '#6c7890', M: '#b4c2d4', c: '#7fdcf6',
};
/* 그림 정의: 프레임별 문자 격자, P/p = 주인공 색상 변형(밝음/어두움), px = 텍셀당 월드 단위 */
const SPR = {
  hero: { px: 2, frames: [[
    '................',
    '.....kkkkk......',
    '....kyyyyyk.....',
    '...kyyyyyyyk....',
    '...kyyssssyk....',
    '...kysskskSk....',
    '...kSsssssSk....',
    '....kkSSSkk.....',
    '...kPPPPPPPk....',
    '..ksPPPPPPPsk...',
    '..kSpPPPPPpSk...',
    '...knnnynnnk....',
    '...kpPPkPPpk....',
    '...knnk.knnk....',
    '...kNNk.kNNk....',
    '....kk...kk.....',
  ], [
    '................',
    '.....kkkkk......',
    '....kyyyyyk.....',
    '...kyyyyyyyk....',
    '...kyyssssyk....',
    '...kysskskSk....',
    '...kSsssssSk....',
    '....kkSSSkk.....',
    '...kPPPPPPPk....',
    '..ksPPPPPPPsk...',
    '..kSpPPPPPpSk...',
    '...knnnynnnk....',
    '...kpPPkPPpk....',
    '..knnk...knnk...',
    '..kNNk...kkk....',
    '...kk...........',
  ]] },
  slime: { px: 2, frames: [[
    '....kkkk....',
    '..kkvvggkk..',
    '.kvvgggggGk.',
    'kvgggggggggk',
    'kgwkgggwkggk',
    'kggggggggGGk',
    'kgggggggGGGk',
    '.kGGGGGGGGk.',
    '..kkkkkkkk..',
  ], [
    '............',
    '............',
    '...kkkkkk...',
    '.kkvvgggggk.',
    'kvgggggggGGk',
    'kgwkgggwkgGk',
    'kggggggggGGk',
    '.kGGGGGGGGk.',
    '..kkkkkkkk..',
  ]] },
  bat: { px: 2, frames: [[
    'k..........k',
    'kk........kk',
    'kuk.kkkk.kuk',
    'kuukuuuukuuk',
    '.kuuwuuwuuk.',
    '..kuuuuuuk..',
    '...kUUUUk...',
    '....k..k....',
  ], [
    '............',
    '............',
    '....kkkk....',
    '..kkuuuukk..',
    '.kuuwuuwuuk.',
    'kuuuUuuUuuuk',
    'kuk.kUUk.kuk',
    'kk........kk',
  ]] },
  skel: { px: 2, frames: [[
    '...kkkkkk...',
    '..keeeeeek..',
    '.keeeeeeeek.',
    '.kekkeekkek.',
    '.kekkeekkek.',
    '.keeeeeeeek.',
    '..keekkeek..',
    '...keeeek...',
    '..kkEkkEkk..',
    '.keEeeeeEek.',
    '.kkkEeeEkkk.',
    '...keEEek...',
    '...kek.kek..',
    '...kek.kek..',
    '..kkk...kkk.',
  ], [
    '...kkkkkk...',
    '..keeeeeek..',
    '.keeeeeeeek.',
    '.kekkeekkek.',
    '.kekkeekkek.',
    '.keeeeeeeek.',
    '..keekkeek..',
    '...keeeek...',
    '..kkEkkEkk..',
    '.keEeeeeEek.',
    '.kkkEeeEkkk.',
    '...keEEek...',
    '..kek...kek.',
    '..kek...kek.',
    '.kkk.....kk.',
  ]] },
  brute: { px: 2, frames: [[
    '......kkkkkkkk......',
    '....kkooooooookk....',
    '...koooooooooooOk...',
    '..kooookkookkoooOk..',
    '..koooorkoorkoooOk..',
    '..kooooooooooooOOk..',
    '..koooowkkkkwooOOk..',
    '..kOooookwwkoooOOk..',
    '...kOOooooooooOOk...',
    '.kkkkOOOOOOOOOOkkkk.',
    'kooookNNNNNNNNkooook',
    'kooOkNnnnnnnnnNkOook',
    'kOOk.kNnnnnnnNk.kOOk',
    '.kk..kNNNNNNNNk..kk.',
    '.....kooook.kook....',
    '.....kOOOk..kOOk....',
    '.....kkkk...kkkk....',
  ], [
    '......kkkkkkkk......',
    '....kkooooooookk....',
    '...koooooooooooOk...',
    '..kooookkookkoooOk..',
    '..koooorkoorkoooOk..',
    '..kooooooooooooOOk..',
    '..koooowkkkkwooOOk..',
    '..kOooookwwkoooOOk..',
    '...kOOooooooooOOk...',
    '.kkkkOOOOOOOOOOkkkk.',
    'kooookNNNNNNNNkooook',
    'kooOkNnnnnnnnnNkOook',
    'kOOk.kNnnnnnnNk.kOOk',
    '.kk..kNNNNNNNNk..kk.',
    '....kook.kooook.....',
    '....kOOk..kOOOk.....',
    '....kkkk..kkkkk.....',
  ]] },
  bargan: { px: 2.5, frames: [[
    '....k..............k....',
    '...kMk............kMk...',
    '...kMMk..........kMMk...',
    '....kMMk.kkkkkk.kMMk....',
    '.....kMMkmmmmmmkMMk.....',
    '......kkmmmmmmmmkk......',
    '.....kmmmmmmmmmmmmk.....',
    '.....kmkkkmmmmkkkmk.....',
    '.....kmkrrkmmkrrkmk.....',
    '.....kmmkkmmmmkkmmk.....',
    '......kmmmmkkmmmmk......',
    '...kkkkkmmmmmmmmkkkkk...',
    '..kRRrrkkkkkkkkkkrrRRk..',
    '.kRrrrrkRrrrrrrRkrrrrRk.',
    '.kRrrrkRrryyyyrrRkrrrRk.',
    '.kRRrkRrrrykkyrrrRkrRRk.',
    '..kkkkRrrryyyyrrrRkkkk..',
    '......kRrrrrrrrrRk......',
    '......kkRRRRRRRRkk......',
    '......kmmk....kmmk......',
    '.....kmMMk....kMMmk.....',
    '.....kmmmk....kmmmk.....',
    '.....kkkkk....kkkkk.....',
  ], [
    '....k..............k....',
    '...kMk............kMk...',
    '...kMMk..........kMMk...',
    '....kMMk.kkkkkk.kMMk....',
    '.....kMMkmmmmmmkMMk.....',
    '......kkmmmmmmmmkk......',
    '.....kmmmmmmmmmmmmk.....',
    '.....kmkkkmmmmkkkmk.....',
    '.....kmkrrkmmkrrkmk.....',
    '.....kmmkkmmmmkkmmk.....',
    '......kmmmmkkmmmmk......',
    '...kkkkkmmmmmmmmkkkkk...',
    '..kRRrrkkkkkkkkkkrrRRk..',
    '.kRrrrrkRrrrrrrRkrrrrRk.',
    '.kRrrrkRrryyyyrrRkrrrRk.',
    '.kRRrkRrrrykkyrrrRkrRRk.',
    '..kkkkRrrryyyyrrrRkkkk..',
    '......kRrrrrrrrrRk......',
    '......kkRRRRRRRRkk......',
    '.....kmmk......kmmk.....',
    '....kmMMk......kMMmk....',
    '....kmmmk......kmmmk....',
    '....kkkkk......kkkkk....',
  ]] },
};
/* 지형 타일 (16×16, 밝은 풀밭) — 변형 4종을 좌표 해시로 배치 */
const TILE_PAL = { a: '#62b04c', b: '#59a545', c: '#79c65a', d: '#4b923e', f: '#fff3b0', h: '#ffffff', i: '#f39ab0' };
const TILES = [
  ['aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa'],
  ['aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaacaaaaaaaaaaaa', 'aacdcaaaaaaaaaaa', 'aaadaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaacaaaaa', 'aaaaaaaaacacaaaa',
    'aaaaaaaaadadaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaacaaaaaaaaa', 'aaaaacdcaaaaaaaa', 'aaaaaadaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa'],
  ['aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaacaaaa', 'aaaaaaaaaacdcaaa', 'aaaaaaaaaaadaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa', 'aaacaaaaaaaaaaaa', 'aacdcaaaaaaaaaaa', 'aaadaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa'],
  ['aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaafaaaaaaaaa', 'aaaaafyfaaaaaaaa', 'aaaaaafaaaaaaaaa', 'aaaaaadaaaaahaaa', 'aaaaaaaaaaahihaa',
    'aaaaaaaaaaaahaaa', 'aaaaaaaaaaaadaaa', 'aaaaaaaaaaaaaaaa', 'aaacaaaaaaaaaaaa', 'aacdcaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa'],
];
const GROUND_BASE = TILE_PAL.a;

/* 색 보조 */
function shadeHex(hex, k) {
  const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k)));
  return '#' + ((f(n >> 16 & 255) << 16) | (f(n >> 8 & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0');
}
/* 사전 그림 저장: 이름·프레임·변형·텍셀 배율·좌우 반전·색상 변형 단위 캐시 */
const SPR_CACHE = new Map();
function bakeGrid(rows, pal, t, flip, mode, outline) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length)), pad = outline ? 1 : 0;
  const cv = document.createElement('canvas'); cv.width = (w + pad * 2) * t; cv.height = (h + pad * 2) * t;
  const c = cv.getContext('2d');
  const at = (x, y) => { const r = rows[y]; if (!r) return '.'; const ch = r[flip ? w - 1 - x : x]; return ch === undefined ? '.' : ch; };
  if (outline) {
    c.fillStyle = outline;
    for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
      if (x >= 0 && y >= 0 && x < w && y < h && at(x, y) !== '.') continue;
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h && at(xx, yy) !== '.') { near = true; break; } }
      if (near) c.fillRect((x + pad) * t, (y + pad) * t, t, t);
    }
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = at(x, y); if (ch === '.') continue;
    c.fillStyle = mode === 'white' ? (ch === 'k' ? '#ffe8e8' : '#ffffff') : (pal[ch] || '#ff00ff');
    c.fillRect((x + pad) * t, (y + pad) * t, t, t);
  }
  return { cv, w, h, pad };
}
/* 텍셀 하나의 실제 화면 픽셀 수 (정수 배율) */
function texelPx(px) { return Math.max(1, Math.round(px * VIEW.zoom * VIEW.dpr)); }
function getSprite(name, frame, opt) {
  const D = SPR[name], o = opt || {}, mul = o.mul || 1, t = texelPx(D.px * mul), flip = !!o.flip, mode = o.mode || 'n', tint = o.tint || '';
  const key = name + '|' + frame + '|' + t + '|' + (flip ? 1 : 0) + '|' + mode + '|' + tint;
  let s = SPR_CACHE.get(key);
  if (!s) {
    const pal = tint ? Object.assign({}, DOT_PAL, { P: tint, p: shadeHex(tint, 0.68) }) : DOT_PAL;
    s = bakeGrid(D.frames[frame % D.frames.length], pal, t, flip, mode === 'white' ? 'white' : 'n', mode === 'gold' ? '#ffd24a' : mode === 'rage' ? '#ff5a3a' : mode === 'danger' ? '#ff2a55' : null);
    s.t = t; SPR_CACHE.set(key, s);
    if (SPR_CACHE.size > 600) SPR_CACHE.delete(SPR_CACHE.keys().next().value);
  }
  return s;
}
/* 월드 좌표 출력: 발밑(by) 기준 하단 정렬·가로 중앙, 텍셀 경계 정렬 */
function drawSprite(c, name, frame, x, by, opt) {
  const s = getSprite(name, frame, opt), k = 1 / (VIEW.zoom * VIEW.dpr);
  const W = s.cv.width * k, H = s.cv.height * k;
  const dx = Math.round((x - W / 2) / k) * k, dy = Math.round((by - H + s.pad * s.t * k) / k) * k;
  c.drawImage(s.cv, dx, dy, W, H);
}
function spriteFor(e) {
  if (e.gk) return SPR[e.gk] ? e.gk : null;
  if (e.shape === 'rune') return 'rune';
  return SPR[e.type] ? e.type : null;
}
/* 큰 개체(거대 몹 등)는 텍셀 배율 정수 확대 */
function spriteMul(e) { const base = ENEMIES[e.type]; if (e.gk || !base || e.shape === 'rune') return 1; return Math.max(1, Math.round(e.r / base.r - 0.25)); }

/* 지형 타일 */
const TILE_CACHE = new Map();
function getTile(i) {
  const t = texelPx(2), key = i + '|' + t;
  let s = TILE_CACHE.get(key);
  if (!s) { s = bakeGrid(TILES[i], Object.assign({}, TILE_PAL, { y: DOT_PAL.y }), t, false, 'n', null); TILE_CACHE.set(key, s); }
  return s;
}

/* ============================================================
   0.20 도트 전량 — 수문장 3인·마왕·특수 개체·보석·지면 물체·무기·투사체
   ============================================================ */
Object.assign(SPR, {
  igna: { px: 2.5, frames: [[
    '.........y..y...........',
    '......y..yo.oy..y.......',
    '.....yo.yoooooy.oy......',
    '.....yooooorooooooy.....',
    '......oorrrrrrrroo......',
    '......krrrrrrrrrrk......',
    '.....kRrkkssssskkrRk....',
    '.....kRksssssssskRk.....',
    '.....kRksykssyksskRk....',
    '......kRssssssssRk......',
    '.......kkSSSSSSkk.......',
    '.....kkrrrkyykrrrkk.....',
    '....krrorrrkkrrrorrk....',
    '...krroorrrrrrrrroorrk..',
    '...krookrrrryyrrrkoork..',
    '...kok.krrrryyrrrk.kok..',
    '...kyk.kRrrrrrrrRk.kyk..',
    '....k..kRRrrrrrRRk..k...',
    '.......kRRRrrrRRRk......',
    '......kRRRRRRRRRRRk.....',
    '......kkkkkkkkkkkkk.....',
  ], [
    '...........y..y.........',
    '.......y..oy.yo..y......',
    '......yo.yoooooy.oy.....',
    '.....yooooorooooooy.....',
    '......oorrrrrrrroo......',
    '......krrrrrrrrrrk......',
    '.....kRrkkssssskkrRk....',
    '.....kRksssssssskRk.....',
    '.....kRksykssyksskRk....',
    '......kRssssssssRk......',
    '.......kkSSSSSSkk.......',
    '.....kkrrrkyykrrrkk.....',
    '....krrorrrkkrrrorrk....',
    '...krroorrrrrrrrroorrk..',
    '..kyrookrrrryyrrrkoorky.',
    '..kyk..krrrryyrrrk..kyk.',
    '...k...kRrrrrrrrRk...k..',
    '.......kRRrrrrrRRk......',
    '.......kRRRrrrRRRk......',
    '......kRRRRRRRRRRRk.....',
    '......kkkkkkkkkkkkk.....',
  ]] },
  morden: { px: 2.5, frames: [[
    '........kkkkkkk.........',
    '.......kGGGGGGGk........',
    '......kGGGGGGGGGk.......',
    '.....kGGkkkkkkkGGk......',
    '.....kGkeeeeeeekGk...ke.',
    '.....kGkekkekkekGk..keek',
    '.....kGkeeeeeeekGk..kekk',
    '.....kGGkekekekGGk...kk.',
    '......kGGkkkkkGGk....kn.',
    '.....kGGGGGGGGGGGk...kn.',
    '....kGgGGGGGGGGGgGk.kkn.',
    '...kGggGGGcGGGGGggGkeen.',
    '...kGgkGGGGcGGGGkgGkkkn.',
    '...kGk.kGGGGGGGk.kGk.kn.',
    '....k..kGGGGGGGGk.k..kn.',
    '.......kGGgGGgGGk....kn.',
    '......kGGGgGGgGGGk...kn.',
    '......kGGgGGGGgGGk...kn.',
    '.....kGGgGGGGGGgGGk..kk.',
    '.....kkkkkkkkkkkkkk.....',
  ], [
    '........kkkkkkk.........',
    '.......kGGGGGGGk........',
    '......kGGGGGGGGGk.......',
    '.....kGGkkkkkkkGGk......',
    '.....kGkeeeeeeekGk......',
    '.....kGkekkekkekGk...ke.',
    '.....kGkeeeeeeekGk..keek',
    '.....kGGkekekekGGk..kekk',
    '......kGGkkkkkGGk....kk.',
    '.....kGGGGGGGGGGGk...kn.',
    '....kGgGGGGGGGGGgGk.kkn.',
    '...kGggGGGcGGGGGggGkeen.',
    '...kGgkGGGGcGGGGkgGkkkn.',
    '...kGk.kGGGGGGGk.kGk.kn.',
    '....k..kGGGGGGGGk.k..kn.',
    '.......kGGgGGgGGk....kn.',
    '......kGGGgGGgGGGk...kn.',
    '......kGGgGGGGgGGk...kn.',
    '.....kGGgGGGGGGgGGk..kk.',
    '.....kkkkkkkkkkkkkk.....',
  ]] },
  seren: { px: 2.5, frames: [[
    '.........kkkkk.........',
    '.......kkWWWWWkk.......',
    '......kWWWWWWWWWk......',
    '.....kWWkkssskkWWk.....',
    '.....kWksssssssskWk....',
    '.....kWksckssckskWk....',
    '.....kWksssssssskWk....',
    '.....kWWkSsssSSkWWk....',
    '.....kWWWkkkkkkWWWk....',
    '....kWkcckMMMMkcckWk...',
    '...kckccMMMMMMMMcckck..',
    '...kMk.kMMcMMcMMk.kMk..',
    '...kck.kMMMMMMMMk.kck..',
    '....k..kcMMMMMMck..k...',
    '.......kMMMMMMMMk......',
    '......kMMcMMMMcMMk.....',
    '......kMMMMMMMMMMk.....',
    '.....kMMMcMMMMcMMMk....',
    '.....kkkkkkkkkkkkkk....',
  ], [
    '.........kkkkk.........',
    '.......kkWWWWWkk.......',
    '......kWWWWWWWWWk......',
    '.....kWWkkssskkWWk.....',
    '.....kWksssssssskWk....',
    '.....kWksckssckskWk....',
    '.....kWksssssssskWk....',
    '.....kWWkSsssSSkWWk....',
    '.....kWWWkkkkkkWWWk....',
    '....kWkcckMMMMkcckWk...',
    '...kckccMMMMMMMMcckck..',
    '...kMk.kMMcMMcMMk.kMk..',
    '...kck.kMMMMMMMMk.kck..',
    '....k..kcMMMMMMck..k...',
    '.......kMMMMMMMMk......',
    '......kMMMMcMMcMMk.....',
    '......kMMMMMMMMMMk.....',
    '.....kMMcMMMMMMcMMk....',
    '.....kkkkkkkkkkkkkk....',
  ]] },
  demon: { px: 2.5, frames: [[
    '..kk......................kk..',
    '..kYk....................kYk..',
    '...kYk..................kYk...',
    '...kYYk....kkkkkkkk....kYYk...',
    '....kYYkkkkUUUUUUUUkkkkYYk....',
    '.....kkUUUUUUUUUUUUUUUUkk.....',
    '......kUUUUUUUUUUUUUUUUk......',
    '......kUUkkkUUUUUUkkkUUk......',
    '......kUUkyykUUUUkyykUUk......',
    '......kUUUkkUUUUUUkkUUUk......',
    '.......kUUUUUkkkkUUUUUk.......',
    '.......kUUUUkwwwwkUUUUk.......',
    '........kkUUUkkkkUUUkk........',
    '...kkkkkkUkkUUUUUUkkUkkkkkk...',
    '..kRRRRkkuuuuuuuuuuuukkRRRRk..',
    '.kRRRRkuuuUuuuyuuuUuuukRRRRRk.',
    '.kRRRkuuUUuuuyyyuuuUUuukRRRRk.',
    'kRRRRkuuUkuuuuyuuuukUuukRRRRRk',
    'kRRRk.kuuk.kuuuuuuk.kuuk.kRRRk',
    'kRRRk.kUUk.kuuUUuuk.kUUk.kRRRk',
    'kRRk...kk..kuuuuuuk..kk...kRRk',
    'kRRk......kUuuuuuuUk......kRRk',
    'kRk......kUUuuuuuuUUk......kRk',
    'kk......kUUUUuuuuUUUUk......kk',
    '.......kUUUUUUUUUUUUUUk.......',
    '.......kkkkkkkkkkkkkkkk.......',
  ], [
    '..kk......................kk..',
    '..kYk....................kYk..',
    '...kYk..................kYk...',
    '...kYYk....kkkkkkkk....kYYk...',
    '....kYYkkkkUUUUUUUUkkkkYYk....',
    '.....kkUUUUUUUUUUUUUUUUkk.....',
    '......kUUUUUUUUUUUUUUUUk......',
    '......kUUkkkUUUUUUkkkUUk......',
    '......kUUkrrkUUUUkrrkUUk......',
    '......kUUUkkUUUUUUkkUUUk......',
    '.......kUUUUUkkkkUUUUUk.......',
    '.......kUUUUkwwwwkUUUUk.......',
    '........kkUUUkkkkUUUkk........',
    '...kkkkkkUkkUUUUUUkkUkkkkkk...',
    '..kRRRRkkuuuuuuuuuuuukkRRRRk..',
    '.kRRRRkuuuUuuuyuuuUuuukRRRRRk.',
    'kRRRRkuuUUuuuyyyuuuUUuukRRRRRk',
    'kRRRk.kuuUkuuuyuuuukUuuk.kRRRk',
    'kRRk..kuuk.kuuuuuuk.kuuk..kRRk',
    'kRRk..kUUk.kuuUUuuk.kUUk..kRRk',
    'kRk....kk..kuuuuuuk..kk....kRk',
    'kRk.......kUuuuuuuUk.......kRk',
    'kk.......kUUuuuuuuUUk.......kk',
    '........kUUUUuuuuUUUUk........',
    '.......kUUUUUUUUUUUUUUk.......',
    '.......kkkkkkkkkkkkkkkk.......',
  ]] },
  rune: { px: 2, frames: [[
    '....kk....',
    '...kuuk...',
    '..kuwuuk..',
    '..kuwuuk..',
    '.kuuuuuUk.',
    '.kuwuuuUk.',
    '.kuuuuUUk.',
    '.kuuuuUUk.',
    '..kuuUUk..',
    '..kuuUUk..',
    '.kKKKKKKk.',
    'kKmmmmmmKk',
    'kkkkkkkkkk',
  ], [
    '....kk....',
    '...kuuk...',
    '..kuuwuk..',
    '..kuuwuk..',
    '.kuuuuwUk.',
    '.kuuuuuUk.',
    '.kuuuuUUk.',
    '.kuuwuUUk.',
    '..kuuUUk..',
    '..kuuUUk..',
    '.kKKKKKKk.',
    'kKmmmmmmKk',
    'kkkkkkkkkk',
  ]] },
  ghost: { px: 2, frames: [[
    '..kkkk..',
    '.kWWWWk.',
    'kWkWWkWk',
    'kWkWWkWk',
    'kWWWWWWk',
    'kWWWWWWk',
    'kWkWWkWk',
    '.k.kk.k.',
  ], [
    '..kkkk..',
    '.kWWWWk.',
    'kWkWWkWk',
    'kWkWWkWk',
    'kWWWWWWk',
    'kWWWWWWk',
    '.kWkkWk.',
    '..k..k..',
  ]] },
  gem1: { px: 2, frames: [['.k.', 'kck', 'kwk', 'kck', '.k.']] },
  gem2: { px: 2, frames: [['..k..', '.kwk.', 'kwcck', 'kccbk', '.kbk.', '..k..']] },
  gem3: { px: 2, frames: [['..kkk..', '.kwwck.', 'kwccccK', 'kccccbk', '.kcbbk.', '..kbk..', '...k...']] },
  chest: { px: 2, frames: [[
    '.kkkkkkkkkk.',
    'knnnnnnnnnnk',
    'knNNNNNNNNnk',
    'kkkkkyykkkkk',
    'kyyyykYyyyyk',
    'knnnnkykknnk',
    'knnnnnnnnnnk',
    'knNNNNNNNNnk',
    'kkkkkkkkkkkk',
  ]] },
  altar: { px: 2, frames: [[
    '.....kk.....',
    '....kuwk....',
    '...kuwuuk...',
    '...kuuuUk...',
    '....kuUk....',
    '.....kk.....',
    '..kkkkkkkk..',
    '.kMMMMMMMMk.',
    '..kmmmmmmk..',
    '..kmMmmMmk..',
    '..kmmmmmmk..',
    '..kmMmmMmk..',
    '.kMMMMMMMMk.',
    'kmmmmmmmmmmk',
    'kkkkkkkkkkkk',
  ], [
    '.....kk.....',
    '....kwuk....',
    '...kuuwuk...',
    '...kuuuUk...',
    '....kuUk....',
    '.....kk.....',
    '..kkkkkkkk..',
    '.kMMMMMMMMk.',
    '..kmmmmmmk..',
    '..kmMmmMmk..',
    '..kmmmmmmk..',
    '..kmMmmMmk..',
    '.kMMMMMMMMk.',
    'kmmmmmmmmmmk',
    'kkkkkkkkkkkk',
  ]] },
  turret: { px: 2, frames: [[
    '..kkkkkk..',
    '.kMMMMMMk.',
    'kMmmmmmmMk',
    'kmkkkkkkmk',
    'kmkyyyykmk',
    'kmkyyyykmk',
    'kmkkkkkkmk',
    'kMmmmmmmMk',
    'knnnnnnnnk',
    'kkkkkkkkkk',
  ]] },
  cart: { px: 2, frames: [[
    '..kkkkkkkkkkkk..',
    '.knnnnnnnnnnnnk.',
    '.knyyyyyyyyyynk.',
    '.knnnnnnnnnnnnk.',
    '.kNnNnNnNnNnNnk.',
    '.kNNNNNNNNNNNNk.',
    'kkkkkkkkkkkkkkkk',
    '.kmmk......kmmk.',
    'kmMMmk....kmMMmk',
    'kmMMmk....kmMMmk',
    '.kmmk......kmmk.',
  ]] },
  /* 무기·투사체 (오른쪽 방향 기준, 회전 출력) */
  blade: { px: 2, frames: [['..kk......', '.kWMkkkkk.', 'kyWMMMMMWk', '.kWMkkkkk.', '..kk......']] },
  arrow: { px: 2, frames: [['kk.......kk.', 'kWkkkkkkkMMk', 'kk.......kk.']] },
  knife: { px: 2, frames: [['kk.kkk.', 'nkkMWWk', 'kk.kkk.']] },
  axe: { px: 2, frames: [['..kkk..', '.kMMMk.', 'kMWMnMk', '.kknkk.', '..knk..', '..knk..', '..kkk..']] },
  fire: { px: 2, frames: [['..kkk..', '.kyyok.', 'kywyyok', 'kyyyook', '.koook.', '..kkk..']] },
  orbp: { px: 2, frames: [['.kkk.', 'kwcck', 'kccbk', 'kcbbk', '.kkk.']] },
  ball: { px: 2, frames: [['.kkk.', 'kwPPk', 'kPPpk', 'kPppk', '.kkk.']] },
});
DOT_PAL.b = '#3a8ac8';
const GEM_SPR = v => v < 12 ? 'gem2' : 'gem3';   // 소형 보석 가독성 (gem1 미사용)

/* 회전 출력 (투사체·회전검): 텍셀 크기 유지, 회전 각도 그대로 */
function drawSpriteRot(c, name, frame, x, y, ang, opt) {
  const s = getSprite(name, frame, opt), k = 1 / (VIEW.zoom * VIEW.dpr), W = s.cv.width * k, H = s.cv.height * k;
  c.save(); c.translate(x, y); c.rotate(ang); c.drawImage(s.cv, -W / 2, -H / 2, W, H); c.restore();
}
function drawSpriteC(c, name, frame, x, y, opt) {
  const s = getSprite(name, frame, opt), k = 1 / (VIEW.zoom * VIEW.dpr), W = s.cv.width * k, H = s.cv.height * k;
  c.drawImage(s.cv, Math.round((x - W / 2) / k) * k, Math.round((y - H / 2) / k) * k, W, H);
}

/* 페이즈별 지형 색 (타일 재채색) — a 바탕, c 밝은 풀, d 어두운 풀, f·h·i 꽃·장식 */
const TERRAIN = {
  field: { a: '#62b04c', c: '#79c65a', d: '#4b923e', f: '#fff3b0', h: '#ffffff', i: '#f39ab0' },
  calm: { a: '#78c462', c: '#96da7a', d: '#5ca84c', f: '#ffffff', h: '#ffe6f0', i: '#f0a0c8' },
  fog: { a: '#7c9a82', c: '#92ae96', d: '#62806a', f: '#c8d4d0', h: '#e0e8e8', i: '#a8b8c0' },
  camp: { a: '#8eaa4c', c: '#a8c462', d: '#6c8a3a', f: '#e0b070', h: '#f0d8a0', i: '#c08040' },
  surge: { a: '#8c9a4a', c: '#a2aa5a', d: '#7a5a3a', f: '#d06050', h: '#f0a080', i: '#a03a30' },
  warband: { a: '#b0a04a', c: '#c8b862', d: '#8a7a38', f: '#e8d890', h: '#fff0c0', i: '#a07a30' },
  hunt: { a: '#c4ae4a', c: '#dcc664', d: '#9a8838', f: '#fff0a0', h: '#ffffff', i: '#e0a030' },
  siege: { a: '#6e7a58', c: '#828e6a', d: '#545e44', f: '#b080a0', h: '#d0b0c8', i: '#804a70' },
  seal: { a: '#6a8aa2', c: '#82a2ba', d: '#546e86', f: '#c0e0ff', h: '#ffffff', i: '#7fdcf6' },
  escort: { a: '#a88a60', c: '#c0a072', d: '#866a48', f: '#6ab050', h: '#8ac860', i: '#4a8a40' },
  ritual: { a: '#6c5c8c', c: '#8272a2', d: '#50446c', f: '#c8a0ff', h: '#e8d8ff', i: '#a07ee6' },
  collapse: { a: '#8a7a64', c: '#a08e76', d: '#6a5a48', f: '#5a4a3a', h: '#b0a088', i: '#3a2e24' },
  gate: { a: '#7a5242', c: '#92624c', d: '#5a3a30', f: '#e8503c', h: '#ffb070', i: '#9a2a2c' },
  demon: { a: '#3e3058', c: '#524070', d: '#2c2240', f: '#a07ee6', h: '#c8b0ff', i: '#5e44a0' },
};
function getTileT(i, tid) {
  const t = texelPx(2), key = i + '|' + t + '|' + tid;
  let s = TILE_CACHE.get(key);
  if (!s) { const T = TERRAIN[tid] || TERRAIN.field; s = bakeGrid(TILES[i], Object.assign({ y: DOT_PAL.y, b: T.a }, T), t, false, 'n', null); TILE_CACHE.set(key, s); }
  return s;
}
