// 계산기 명세(JSON)용 작은 수식 엔진.
// JavaScript를 실행하지 않고, 아래 문법만 계산합니다. 브라우저와 검사 스크립트가 같이 씁니다.
//   숫자, 변수, + - * / %, 괄호, 비교(< <= > >= == !=), 그리고 && 또는 ||, 부정 !, 조건 a ? b : c
//   함수: min max round floor ceil abs pow clamp
//   round(x) 원 단위 반올림, round(x, -3) 천 원 단위, floor/ceil 도 같은 방식

const FUNCS = {
  min: (...a) => Math.min(...a),
  max: (...a) => Math.max(...a),
  abs: (x) => Math.abs(x),
  pow: (x, y) => Math.pow(x, y),
  clamp: (x, lo, hi) => Math.min(Math.max(x, lo), hi),
  round: (x, d = 0) => roundTo(Math.round, x, d),
  floor: (x, d = 0) => roundTo(Math.floor, x, d),
  ceil: (x, d = 0) => roundTo(Math.ceil, x, d),
};
function roundTo(fn, x, d) {
  const f = Math.pow(10, d);
  return fn(x * f) / f;
}
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
export const FUNCTION_NAMES = Object.keys(FUNCS);

function tokenize(src) {
  const toks = [];
  let i = 0;
  const s = String(src);
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9._]/.test(s[j])) j++;
      const raw = s.slice(i, j).replace(/_/g, '');
      if (!/^\d+(\.\d+)?$|^\.\d+$/.test(raw)) throw new Error(`숫자 형식 오류: ${s.slice(i, j)}`);
      toks.push({ t: 'num', v: Number(raw) });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) j++;
      toks.push({ t: 'id', v: s.slice(i, j) });
      i = j;
      continue;
    }
    const two = s.slice(i, i + 2);
    if (['<=', '>=', '==', '!=', '&&', '||'].includes(two)) { toks.push({ t: 'op', v: two }); i += 2; continue; }
    if ('+-*/%()<>,?:!'.includes(c)) { toks.push({ t: 'op', v: c }); i++; continue; }
    throw new Error(`쓸 수 없는 문자: "${c}"`);
  }
  return toks;
}

const BIN = {
  '||': 1, '&&': 2,
  '==': 3, '!=': 3,
  '<': 4, '<=': 4, '>': 4, '>=': 4,
  '+': 5, '-': 5,
  '*': 6, '/': 6, '%': 6,
};

export function parse(src) {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v) => peek() && peek().t === 'op' && peek().v === v;
  const expect = (v) => {
    if (!isOp(v)) throw new Error(`"${v}"가 필요합니다`);
    p++;
  };

  function primary() {
    const tk = toks[p++];
    if (!tk) throw new Error('수식이 중간에 끝났습니다');
    if (tk.t === 'num') return { k: 'num', v: tk.v };
    if (tk.t === 'id') {
      if (isOp('(')) {
        p++;
        if (!has(FUNCS, tk.v)) throw new Error(`모르는 함수: ${tk.v}`);
        const args = [];
        if (!isOp(')')) {
          args.push(ternary());
          while (isOp(',')) { p++; args.push(ternary()); }
        }
        expect(')');
        return { k: 'call', f: tk.v, args };
      }
      return { k: 'var', v: tk.v };
    }
    if (tk.v === '(') { const e = ternary(); expect(')'); return e; }
    if (tk.v === '-') return { k: 'neg', e: unaryOrPrimary() };
    if (tk.v === '+') return unaryOrPrimary();
    if (tk.v === '!') return { k: 'not', e: unaryOrPrimary() };
    throw new Error(`예상하지 못한 "${tk.v}"`);
  }
  function unaryOrPrimary() { return primary(); }

  function binary(minPrec) {
    let left = primary();
    for (;;) {
      const tk = peek();
      if (!tk || tk.t !== 'op' || !(tk.v in BIN) || BIN[tk.v] < minPrec) return left;
      p++;
      const right = binary(BIN[tk.v] + 1);
      left = { k: 'bin', op: tk.v, a: left, b: right };
    }
  }
  function ternary() {
    const cond = binary(1);
    if (isOp('?')) {
      p++;
      const a = ternary();
      expect(':');
      const b = ternary();
      return { k: 'if', c: cond, a, b };
    }
    return cond;
  }

  const ast = ternary();
  if (p !== toks.length) throw new Error(`수식 끝에 남는 부분이 있습니다: "${toks[p].v}"`);
  return ast;
}

export function variables(ast, out = new Set()) {
  if (!ast) return out;
  if (ast.k === 'var') out.add(ast.v);
  for (const key of ['e', 'a', 'b', 'c']) if (ast[key]) variables(ast[key], out);
  (ast.args ?? []).forEach((x) => variables(x, out));
  return out;
}

export function evaluate(ast, env) {
  switch (ast.k) {
    case 'num': return ast.v;
    case 'var': {
      if (!has(env, ast.v)) throw new Error(`정의되지 않은 값: ${ast.v}`);
      return Number(env[ast.v]) || 0;
    }
    case 'neg': return -evaluate(ast.e, env);
    case 'not': return evaluate(ast.e, env) ? 0 : 1;
    case 'if': return evaluate(ast.c, env) ? evaluate(ast.a, env) : evaluate(ast.b, env);
    case 'call': return FUNCS[ast.f](...ast.args.map((x) => evaluate(x, env)));
    case 'bin': {
      const a = evaluate(ast.a, env);
      if (ast.op === '&&') return a ? (evaluate(ast.b, env) ? 1 : 0) : 0;
      if (ast.op === '||') return a ? 1 : evaluate(ast.b, env) ? 1 : 0;
      const b = evaluate(ast.b, env);
      switch (ast.op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return b === 0 ? 0 : a / b;
        case '%': return b === 0 ? 0 : a % b;
        case '<': return a < b ? 1 : 0;
        case '<=': return a <= b ? 1 : 0;
        case '>': return a > b ? 1 : 0;
        case '>=': return a >= b ? 1 : 0;
        case '==': return a === b ? 1 : 0;
        case '!=': return a !== b ? 1 : 0;
      }
    }
  }
  throw new Error('계산할 수 없는 수식');
}

// 명세 전체를 계산합니다: 입력값 → 상수 → 단계(steps) 순서
export function runSpec(spec, inputValues) {
  const env = {};
  for (const inp of spec.inputs ?? []) env[inp.key] = Number(inputValues?.[inp.key] ?? inp.default ?? 0) || 0;
  for (const c of spec.constants ?? []) env[c.key] = Number(c.value);
  for (const st of spec.steps ?? []) env[st.key] = evaluate(st._ast ?? parse(st.expr), env);
  return env;
}

export function compileSpec(spec) {
  for (const st of spec.steps ?? []) st._ast = parse(st.expr);
  for (const n of spec.notes ?? []) n._ast = parse(n.when);
  return spec;
}

export function formatValue(v, format) {
  if (format === 'percent') return `${(Math.round(v * 100) / 100).toLocaleString('ko-KR')}%`;
  if (format === 'number') return (Math.round(v * 100) / 100).toLocaleString('ko-KR');
  if (format === 'months') return `${Math.round(v).toLocaleString('ko-KR')}개월`;
  const n = Math.round(v);
  return (n < 0 ? '−' : '') + Math.abs(n).toLocaleString('ko-KR') + '원';
}
