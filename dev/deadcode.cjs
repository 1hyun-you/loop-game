// 죽은 코드 판독 (0.61 정리 묶음): 결합본 index.html 주 스크립트를 문장 단위로 분석
// 판정: 최상위 실행문·문자열 속 이름·개발 도구가 부르는 이름에서 출발해 도달 가능한 정의만 살아 있음
//   - 함수 선언은 끌어올림(마지막 선언이 시작 값), 최상위 `이름 = 함수`는 그 시점부터 값 교체
//   - `const _a = 이름`은 그 시점의 정의를 붙잡음(감싸기 덧씌우기) → _a를 쓰는 살아 있는 코드가 있으면 붙잡힌 정의도 살아 있음
//   - 함수 본문 안의 이름 = 최종 값(실행 시점 기준), 최상위 실행문 안의 이름 = 그 시점 값 + 최종 값
//   - `X.속성 = 값` 형태 최상위 문장은 X에 딸린 문장(X가 살아 있을 때만 살아 있음)
// 사용: node dev/deadcode.cjs [--cov /tmp/cov/c1.json,...] [--out 목록.json] [--apply] (--apply: 원본 src 파일에서 해당 문장 삭제, 바로 붙은 // 설명 줄 포함)
const fs = require('fs'), path = require('path');
const ts = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'typescript'));
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const s0 = html.indexOf('<script>', html.indexOf('<script>') + 1) + 8, s1 = html.lastIndexOf('</script>');
const SRC = html.slice(s0, s1);
// 원본 파일 위치 대응: build.sh의 cat 순서대로 결합본 안에서 찾음
const order = [...fs.readFileSync(path.join(ROOT, 'build.sh'), 'utf8').matchAll(/src\/([\w.-]+\.js)/g)].map(m => m[1]);
const fmap = []; let cur = 0;
for (const f of order) {
  const t = fs.readFileSync(path.join(ROOT, 'src', f), 'utf8'), i = SRC.indexOf(t, cur);
  if (i < 0) { console.error('위치 못 찾음', f); continue; }
  fmap.push({ f, a: i, b: i + t.length }); cur = i + t.length;
}
const fileAt = pos => { for (const m of fmap) if (pos >= m.a && pos < m.b) return m; return null; };
const sf = ts.createSourceFile('main.js', SRC, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);

// 이름 수집 (속성 이름·객체 키 제외, 지역 변수 가림은 무시 = 보수적으로 살림)
function refs(node, out = new Set(), strs = true) {
  const walk = n => {
    if (ts.isIdentifier(n)) {
      const p = n.parent;
      const skip = (ts.isPropertyAccessExpression(p) && p.name === n) || (ts.isPropertyAssignment(p) && p.name === n) || (ts.isMethodDeclaration(p) && p.name === n)
        || ((ts.isGetAccessor(p) || ts.isSetAccessor(p)) && p.name === n) || (ts.isPropertyDeclaration && ts.isPropertyDeclaration(p) && p.name === n);
      if (!skip) out.add(n.text);
    } else if (strs && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n))) {
      for (const m of n.text.matchAll(/[A-Za-z_$][\w$]*/g)) out.add(m[0]);
    }
    ts.forEachChild(n, walk);
  };
  walk(node); return out;
}
const memberRoot = e => { while (ts.isPropertyAccessExpression(e) || ts.isElementAccessExpression(e)) e = e.expression; return ts.isIdentifier(e) ? e.text : null; };
const isFn = e => e && (ts.isFunctionExpression(e) || ts.isArrowFunction(e));
const pure = e => { let ok = true; const w = n => { if (!ok) return; if (isFn(n) || ts.isClassExpression(n)) return; if (ts.isCallExpression(n) || ts.isNewExpression(n) || ts.isTaggedTemplateExpression(n)) { ok = false; return; } ts.forEachChild(n, w); }; w(e); return ok; };

// 정의(D)와 문장(S) 목록
const defs = []; const stmts = [];
const cur0 = {};   // 이름 → 끌어올림 시작 정의
for (const st of sf.statements) {
  const rec = { node: st, a: st.getFullStart(), b: st.end, kind: 'exec', file: fileAt(st.getStart()) };
  if (ts.isFunctionDeclaration(st) && st.name) { rec.kind = 'fdecl'; rec.name = st.name.text; }
  else if (ts.isVariableStatement(st) && st.declarationList.declarations.length === 1 && ts.isIdentifier(st.declarationList.declarations[0].name)) {
    const d = st.declarationList.declarations[0]; rec.name = d.name.text; rec.init = d.initializer;
    if (d.initializer && ts.isIdentifier(d.initializer)) { rec.kind = 'alias'; rec.of = d.initializer.text; }
    else rec.kind = d.initializer && !pure(d.initializer) ? 'varx' : 'var';
  } else if (ts.isExpressionStatement(st) && ts.isBinaryExpression(st.expression) && st.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    const L = st.expression.left, R = st.expression.right;
    if (ts.isIdentifier(L) && (isFn(R) || ts.isIdentifier(R))) { rec.kind = 'fassign'; rec.name = L.text; rec.init = R; if (ts.isIdentifier(R)) rec.of = R.text; }
    else if ((ts.isPropertyAccessExpression(L) || ts.isElementAccessExpression(L)) && memberRoot(L) && pure(R)) { rec.kind = 'member'; rec.name = memberRoot(L); }
  }
  stmts.push(rec);
}
// 시간 흐름 모의: 각 문장 시점의 이름별 정의
const last = Object.create(null); for (const r of stmts) if (r.kind === 'fdecl') last[r.name] = r;
const now = Object.assign(Object.create(null), last), final = Object.create(null), tl = Object.create(null);   // tl: 이름 → [[문장 번호, 정의]] (시점 값 조회)
stmts.forEach((r, i) => {
  r.i = i; if (r.kind === 'fdecl') return;
  const set = d => { now[r.name] = d; (tl[r.name] || (tl[r.name] = [])).push([i, d]); };
  if (r.kind === 'alias') { r.cap = now[r.of] || null; set(r); }
  else if (r.kind === 'fassign') { r.cap = r.of ? (now[r.of] || null) : null; set(r); }
  else if (r.kind === 'var' || r.kind === 'varx') set(r);
});
Object.assign(final, now);
const atOf = (n, i) => { let d = last[n] || null; for (const [j, x] of tl[n] || []) { if (j < i) d = x; else break; } return d; };
const isGlobal = n => n in final;
// 뿌리: 최상위 실행문·부수 효과 있는 초기값·개발 도구·문서 머리 스크립트가 쓰는 이름
const live = new Set(), queue = [];
const mark = d => { if (d && !live.has(d)) { live.add(d); queue.push(d); } };
const useName = (n, at) => { if (!isGlobal(n)) return; mark(final[n]); if (at != null) mark(atOf(n, at)); };
for (const r of stmts) if (r.kind === 'exec' || r.kind === 'varx') { mark(r); }
const devNames = new Set();
for (const f of fs.readdirSync(path.join(ROOT, 'dev'))) if (/\.(c?js)$/.test(f) && f !== 'deadcode.cjs') for (const m of fs.readFileSync(path.join(ROOT, 'dev', f), 'utf8').matchAll(/[A-Za-z_$][\w$]*/g)) devNames.add(m[0]);
for (const m of html.slice(0, s0).matchAll(/[A-Za-z_$][\w$]*/g)) devNames.add(m[0]);
for (const n of devNames) if (isGlobal(n)) mark(final[n]);
// 딸린 문장: 주인이 살아 있으면 살림
const members = Object.create(null); for (const r of stmts) if (r.kind === 'member') (members[r.name] || (members[r.name] = [])).push(r);
while (queue.length) {
  const d = queue.shift();
  if (d.kind === 'member') { for (const n of refs(d.node)) useName(n, d.i); continue; }
  if (d.name && members[d.name]) for (const m of members[d.name]) mark(m);
  // 같은 이름의 앞선 정의가 이 정의 실행 전에 불렸을 수 있음 → 최상위 실행문 쪽에서 at으로 처리
  if (d.kind === 'alias' || (d.kind === 'fassign' && d.of)) { mark(d.cap); continue; }
  const top = d.kind === 'exec' || d.kind === 'varx';
  for (const n of refs(d.node)) useName(n, top ? d.i : null);
  // 함수 본문 안에서 쓰는 감싸기 이름(_x)은 그 const 문장 → 붙잡은 정의로 이어짐 (alias 처리)
}
// 결과
const dead = stmts.filter(r => !live.has(r) && r.kind !== 'exec' && r.file);
// 실행 기록 대조: 죽었다고 판정했는데 실행된 함수가 있으면 판정 오류 → 살림
const covFiles = (opt('cov', '') || '').split(',').filter(Boolean);
const executed = [];
if (covFiles.length) {
  const hit = [];
  for (const cf of covFiles) for (const e of JSON.parse(fs.readFileSync(cf, 'utf8'))) {
    // 결합본 전체 문서 기준 위치 → 주 스크립트 기준
    const base = e.len === SRC.length ? 0 : -1; if (base < 0) continue;
    for (const fn of e.functions) for (const rg of fn.ranges) if (rg.count > 0 && fn.functionName) hit.push([rg.startOffset, rg.endOffset]);
  }
  for (const r of dead) { const fnNodes = []; const w = n => { if (ts.isFunctionDeclaration(n) || isFn(n) || ts.isMethodDeclaration(n)) fnNodes.push(n); ts.forEachChild(n, w); }; w(r.node);
    if (fnNodes.some(fnN => hit.some(([a, b]) => a === fnN.getStart() && b === fnN.end))) executed.push(r); }
}
const exSet = new Set(executed);
// 엄격 모드 선언 유지: 죽은 함수 선언을 지우면 뒤쪽 `이름 = function` 대입이 선언 없는 대입(오류)이 됨
//   → 남는 첫 대입이 function 식이면 그 문장을 함수 선언으로 바꿈, 화살표 함수면 빈 선언을 남김
const fix = [];
for (const r of dead) {
  if (r.kind !== 'fdecl' || exSet.has(r)) continue;
  const n = r.name;
  if (stmts.some(x => x !== r && live.has(x) && (x.kind === 'fdecl' || x.kind === 'var' || x.kind === 'varx' || x.kind === 'alias') && x.name === n)) continue;
  const fa = stmts.find(x => live.has(x) && x.kind === 'fassign' && x.name === n);
  if (!fa) continue;
  if (ts.isFunctionExpression(fa.init) && fa.file) fix.push({ file: fa.file.f, kind: 'decl', name: n, s: fa.node.getStart() - fa.file.a, rs: fa.init.getStart() - fa.file.a, e: fa.node.end - fa.file.a, fnKw: fa.init.getChildAt(0).getEnd() - fa.file.a });
  else r.stub = true;
}

// let·var 선언을 지웠는데 다른 곳에서 그 이름에 대입하면 선언 없는 대입(엄격 모드 오류) → `let 이름;`만 남김
for (const r of dead) {
  if (r.kind !== 'var' || exSet.has(r) || !(r.node.declarationList.flags & (ts.NodeFlags.Let)) && (r.node.declarationList.flags & ts.NodeFlags.Const)) continue;
  const re = new RegExp('(^|[^\\w$.])' + r.name.replace(/\$/g, '\\$') + '\\s*(=(?!=)|\\+=|-=|\\*=|\\|\\|=|\\?\\?=|\\+\\+|--)', 'g');
  const txt = SRC.slice(0, r.node.getStart()) + SRC.slice(r.node.end);
  if (re.test(txt)) r.stubVar = (r.node.declarationList.flags & ts.NodeFlags.Let) ? 'let' : 'var';
}
const out = dead.filter(r => !exSet.has(r)).map(r => ({ file: r.file.f, kind: r.kind, name: r.name || null, stub: !!r.stub, stubVar: r.stubVar || null, s: r.node.getStart() - r.file.a, a: r.a - r.file.a, b: r.b - r.file.a, bytes: r.b - r.a }));
const byFile = {}; for (const r of out) byFile[r.file] = (byFile[r.file] || 0) + r.bytes;
console.log('문장', stmts.length, '살아 있음', live.size, '죽음', out.length, '바이트', out.reduce((s, r) => s + r.bytes, 0), '실행 기록과 충돌(살림)', executed.length);
for (const r of executed.slice(0, 20)) console.log('  충돌', r.file.f, r.name);
console.log(Object.entries(byFile).sort((a, b) => b[1] - a[1]).map(([f, b]) => f + ' ' + Math.round(b / 1024) + 'KB').join(', '));
if (opt('out', null)) fs.writeFileSync(path.resolve(ROOT, opt('out')), JSON.stringify(out, null, 0));

if (args.includes('--apply')) {
  const per = {}; for (const r of out.concat(fix)) (per[r.file] || (per[r.file] = [])).push(r);
  for (const [f, list] of Object.entries(per)) {
    const fp = path.join(ROOT, 'src', f); let t = fs.readFileSync(fp, 'utf8');
    list.sort((x, y) => y.s - x.s);
    for (const r of list) {
      if (r.kind === 'decl') {   // `이름 = function (...) {...};` → `function 이름(...) {...}`
        let e = r.e; const body = t.slice(r.fnKw, e).replace(/;\s*$/, '');
        t = t.slice(0, r.s) + 'function ' + r.name + body.replace(/^\s*/, '') + t.slice(e); continue;
      }
      let a = r.s, b = r.b;
      while (b < t.length && (t[b] === ' ' || t[b] === '\t')) b++;
      if (t.startsWith('//', b)) { const e = t.indexOf('\n', b); b = e < 0 ? t.length : e; }   // 같은 줄 끝 설명도 함께
      if (t[b] === '\n') b++;
      // 줄 머리까지 공백만 있으면 줄 시작부터 삭제, 바로 위에 붙은 // 설명 줄도 함께
      let ls = a; while (ls > 0 && (t[ls - 1] === ' ' || t[ls - 1] === '\t')) ls--;
      if (ls === 0 || t[ls - 1] === '\n') {
        a = ls;
        for (;;) { const pe = a - 1; if (pe <= 0) break; const ps = t.lastIndexOf('\n', pe - 1) + 1; const line = t.slice(ps, pe); if (/^\s*\/\/(?!\s*=)/.test(line)) a = ps; else break; }
      }
      t = t.slice(0, a) + (r.stub ? `function ${r.name}() { }   // 선언 유지 (본문은 뒤 파일 대입으로 교체)\n` : r.stubVar ? `${r.stubVar} ${r.name};   // 선언 유지 (값은 뒤 파일 대입)\n` : '') + t.slice(b);
    }
    fs.writeFileSync(fp, t);
  }
  console.log('삭제 적용', Object.keys(per).length, '파일, 선언 전환', fix.length, '빈 선언', out.filter(r => r.stub || r.stubVar).length);
}
if (args.includes('--covstat') && covFiles.length) {
  const all = new Map(); for (const cf of covFiles) for (const e of JSON.parse(fs.readFileSync(cf, 'utf8'))) if (e.len === SRC.length) for (const fn of e.functions) { const r = fn.ranges[0]; const k = r.startOffset + ':' + r.endOffset; all.set(k, (all.get(k) || 0) + r.count); }
  let seen = 0, zero = 0, missing = 0;
  for (const r of dead) { if (r.kind !== 'fdecl') continue; const n = r.node, k = n.getStart() + ':' + n.end; if (all.has(k)) { seen++; if (!all.get(k)) zero++; } else missing++; }
  // 살아 있다고 본 함수 중 실행 기록 있는 비율 (참고)
  let liveF = 0, liveHit = 0; for (const r of stmts) if (live.has(r) && r.kind === 'fdecl') { liveF++; const k = r.node.getStart() + ':' + r.node.end; if (all.get(k) > 0) liveHit++; }
  console.log('죽음 판정 함수 선언: 기록 있음', seen, '(0회', zero, ') 기록 없음', missing, '/ 살아 있는 함수 선언', liveF, '중 실행', liveHit);
}
