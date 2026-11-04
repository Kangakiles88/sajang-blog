// 초안 검증·발행 스크립트 공용 함수
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';
import { parse as parseExpr, variables, runSpec, FUNCTION_NAMES } from '../src/lib/expr.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DRAFTS = path.join(ROOT, 'content', 'drafts');
export const POSTS = path.join(ROOT, 'src', 'content', 'posts');
export const QUEUE = path.join(ROOT, 'keywords', 'queue.md');

const CATS = ['loan', 'support', 'tax', 'closing'];
// 계산기 id와 주로 쓰는 카테고리 (src/site.config.ts의 TOOLS와 맞춰 주세요)
export const TOOL_CATEGORY = { vat: 'tax', 'tax-type': 'tax', loan: 'loan', refinance: 'loan' };
export const TOOL_IDS = Object.keys(TOOL_CATEGORY);
// 명세로 만드는 계산기: 초안은 content/drafts/tools/<id>.json, 발행 후 src/data/tools/<id>.json
export const DRAFT_TOOLS = path.join(ROOT, 'content', 'drafts', 'tools');
export const SPEC_TOOLS = path.join(ROOT, 'src', 'data', 'tools');
export const findToolSpec = (id) => {
  for (const dir of [DRAFT_TOOLS, SPEC_TOOLS]) {
    const f = path.join(dir, `${id}.json`);
    if (fs.existsSync(f)) return { file: f, isDraft: dir === DRAFT_TOOLS };
  }
  return null;
};

export function readDoc(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error('파일 맨 위에 --- 로 감싼 frontmatter가 없습니다.');
  return { data: parse(m[1]) ?? {}, body: m[2] };
}

export function writeDoc(file, data, body) {
  const fm = stringify(data, { lineWidth: 0 }).trimEnd();
  fs.writeFileSync(file, `---\n${fm}\n---\n\n${body.trimStart()}`, 'utf8');
}

export function listDrafts() {
  if (!fs.existsSync(DRAFTS)) return [];
  return fs
    .readdirSync(DRAFTS)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_') && f.toLowerCase() !== 'readme.md')
    .map((f) => path.join(DRAFTS, f));
}

export function todayKST() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
}

// 발행을 막는 문제(errors)와 고치면 좋은 점(warnings)을 돌려줍니다.
export function validate(file) {
  const errors = [];
  const warnings = [];
  let doc;
  try {
    doc = readDoc(file);
  } catch (e) {
    return { errors: [e.message], warnings, doc: null };
  }
  const { data: d, body } = doc;
  const slug = path.basename(file, '.md');

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errors.push(`파일 이름(${slug})은 영문 소문자·숫자·하이픈만 쓸 수 있습니다.`);
  if (!d.title) errors.push('title이 없습니다.');
  else if (d.title.length < 10 || d.title.length > 70) errors.push(`title은 10~70자여야 합니다 (현재 ${d.title.length}자).`);
  if (!d.description) errors.push('description이 없습니다.');
  else if (d.description.length < 40 || d.description.length > 160)
    errors.push(`description은 40~160자여야 합니다 (현재 ${d.description.length}자).`);
  if (!CATS.includes(d.category)) errors.push(`category는 ${CATS.join(', ')} 중 하나여야 합니다.`);
  if (!Array.isArray(d.sources) || d.sources.length === 0) errors.push('sources(원문 링크)가 최소 1개 필요합니다.');
  else
    d.sources.forEach((s, i) => {
      if (!s?.title || !/^https?:\/\//.test(s?.url ?? '')) errors.push(`sources ${i + 1}번째 항목에 title과 http(s) url이 필요합니다.`);
    });
  if (d.tool) {
    let toolCat = TOOL_CATEGORY[d.tool];
    if (!toolCat) {
      const found = findToolSpec(d.tool);
      if (!found) {
        errors.push(`계산기 "${d.tool}"가 없습니다. 직접 만든 계산기(${TOOL_IDS.join(', ')})를 쓰거나 content/drafts/tools/${d.tool}.json 명세를 만드세요.`);
      } else {
        let spec;
        try {
          spec = JSON.parse(fs.readFileSync(found.file, 'utf8'));
        } catch (e) {
          errors.push(`계산기 명세 ${path.basename(found.file)}가 올바른 JSON이 아닙니다: ${e.message}`);
        }
        if (spec) {
          const r = validateToolSpec(spec, d.tool, d);
          r.errors.forEach((x) => errors.push(`[계산기 ${d.tool}] ${x}`));
          r.warnings.forEach((x) => warnings.push(`[계산기 ${d.tool}] ${x}`));
          toolCat = spec.category;
        }
      }
    }
    if (toolCat && toolCat !== d.category)
      warnings.push(`계산기(${d.tool})가 이 글의 카테고리(${d.category})와 다릅니다. 독자가 이 글을 읽고 정말 그 계산을 하는지 확인하세요.`);
  }
  if (!d.keyPoints) warnings.push('keyPoints(한눈에 보기)가 없습니다. 2~4줄 넣는 것을 권장합니다.');
  else if (!Array.isArray(d.keyPoints) || d.keyPoints.length < 2 || d.keyPoints.length > 4)
    errors.push('keyPoints는 2~4개여야 합니다.');
  else
    d.keyPoints.forEach((k, i) => {
      if (!k?.label || !k?.value) errors.push(`keyPoints ${i + 1}번째에 label과 value가 필요합니다.`);
      else if (String(k.label).length > 8) errors.push(`keyPoints ${i + 1}번째 label은 8자 이내여야 합니다.`);
      else if (String(k.value).length > 80) errors.push(`keyPoints ${i + 1}번째 value는 80자 이내여야 합니다.`);
    });

  const unresolved = body.match(/\[확인 필요[^\]]*\]/g);
  if (unresolved) errors.push(`[확인 필요] 표시가 ${unresolved.length}곳 남아 있습니다. 원문과 대조해 고친 뒤 표시를 지우세요.`);
  if (/TODO|TBD|lorem ipsum/i.test(body)) errors.push('본문에 TODO/TBD 같은 임시 문구가 남아 있습니다.');

  const chars = body.replace(/\s+/g, '').length;
  if (chars < 1500) errors.push(`본문이 너무 짧습니다 (${chars}자, 최소 1,500자).`);
  else if (chars < 2500) warnings.push(`본문이 다소 짧습니다 (${chars}자). 2,500자 이상을 권장합니다.`);
  if ((body.match(/^## /gm) ?? []).length < 3) warnings.push('## 소제목이 3개 미만입니다.');
  if (/^# /m.test(body)) errors.push('본문에 # 제목(H1)이 있습니다. 제목은 title에만 쓰고 본문은 ## 부터 시작하세요.');

  if (fs.existsSync(path.join(POSTS, `${slug}.md`))) errors.push('같은 이름의 글이 이미 발행되어 있습니다.');

  checkFacts(d, body, errors, warnings);
  checkYears(d, body, warnings);

  return { errors, warnings, doc };
}

// ── 검증표(factCheck) 검사 ─────────────────────────────────────────
// 초안 frontmatter의 factCheck에 본문 숫자마다 "원문 어디에 뭐라고 쓰여 있는지"를 적고,
// 2차 검증에서 원문을 다시 열어 status를 '일치'로 확인해야 발행할 수 있습니다.
const norm = (s) => String(s ?? '').replace(/\s+/g, '').replace(/,/g, '');
const normUrl = (u) => String(u ?? '').trim().replace(/[#?].*$/, '').replace(/\/+$/, '').toLowerCase();

// 본문에서 금액·비율·기간 같은 "사실 숫자"를 뽑습니다 (연도 단독은 제외)
export function numericFacts(body) {
  const text = body.replace(/\[[^\]]*\]\([^)]*\)/g, ' '); // 링크 주소 제외
  const re = /\d[\d,.]*\s*(?:조|억|천만|백만|만|천)?\s*(?:원|%|퍼센트|개월|년\s*이내|일\s*이내|명|인|배|회)/g;
  return [...new Set((text.match(re) ?? []).map((m) => norm(m)))];
}

function checkFacts(d, body, errors, warnings) {
  const fc = d.factCheck;
  const facts = numericFacts(body);
  if (!fc || !Array.isArray(fc.items)) {
    errors.push('factCheck(검증표)가 없습니다. 본문의 금액·비율·기한마다 원문 근거를 적어야 발행할 수 있습니다.');
    return;
  }
  if (!fc.checkedAt) errors.push('factCheck.checkedAt이 없습니다. 출처를 다시 열어 대조하는 2차 검증을 마친 날짜를 적어야 합니다.');

  const need = Math.min(3, facts.length);
  if (fc.items.length < need)
    errors.push(`검증표 항목이 ${fc.items.length}개뿐입니다. 본문에 숫자가 ${facts.length}개 있으니 최소 ${need}개 이상 근거를 적으세요.`);
  else if (facts.length > 0 && fc.items.length < Math.ceil(facts.length / 2))
    warnings.push(`본문 숫자 ${facts.length}개 중 검증표에 있는 것은 ${fc.items.length}개입니다. 핵심 숫자가 빠지지 않았는지 보세요.`);

  const srcUrls = new Set((d.sources ?? []).map((s) => normUrl(s?.url)));
  const bodyN = norm(body);
  fc.items.forEach((it, i) => {
    const n = i + 1;
    for (const k of ['claim', 'value', 'source', 'evidence', 'status'])
      if (!it?.[k]) errors.push(`검증표 ${n}번째 항목에 ${k}가 없습니다.`);
    if (!it) return;
    if (it.source && !srcUrls.has(normUrl(it.source)))
      errors.push(`검증표 ${n}번째(${it.claim ?? ''})의 출처가 sources 목록에 없습니다. 실제로 근거로 쓴 원문을 sources에도 넣으세요.`);
    if (it.status && it.status !== '일치')
      errors.push(`검증표 ${n}번째(${it.claim ?? ''})가 '${it.status}' 상태입니다. 원문과 맞게 고치거나 그 내용을 본문에서 빼고 '일치'로 바꾸세요.`);
    if (it.value && !bodyN.includes(norm(it.value)))
      warnings.push(`검증표 ${n}번째 값 "${it.value}"이(가) 본문에 그대로 없습니다. 본문 숫자와 검증표가 같은지 보세요.`);
  });

  // 한눈에 보기 박스의 숫자는 반드시 검증표에 있어야 합니다
  const fcValues = fc.items.map((it) => norm(it?.value)).join('|');
  (d.keyPoints ?? []).forEach((k) => {
    const nums = String(k?.value ?? '').match(/\d[\d,.]*/g) ?? [];
    nums
      .map((x) => x.replace(/,/g, ''))
      .filter((x) => !/^20\d\d$/.test(x))
      .forEach((x) => {
        if (!fcValues.includes(x)) warnings.push(`한눈에 보기의 숫자 "${x}"가 검증표에 없습니다. 근거를 추가하세요.`);
      });
  });
}

// ── 기준연도 검사 ─────────────────────────────────────────────────
function checkYears(d, body, warnings) {
  const y = Number(todayKST().slice(0, 4));
  const years = (s) => (String(s ?? '').match(/20\d{2}(?=\s*년|\D|$)/g) ?? []).map(Number);
  const inBody = years(body);
  if (!inBody.some((v) => v === y || v === y + 1))
    warnings.push(`본문에 올해(${y}년)나 내년(${y + 1}년) 기준이 없습니다. 예전 공고를 보고 쓴 건 아닌지 확인하세요.`);
  const titleYears = years(d.title);
  if (titleYears.length && titleYears.every((v) => v < y))
    warnings.push(`제목의 연도(${titleYears.join(', ')}년)가 올해보다 이전입니다.`);
  const fcText = (d.factCheck?.items ?? []).map((it) => `${it?.claim ?? ''} ${it?.evidence ?? ''}`).join(' ');
  const fcYears = years(fcText);
  if (fcYears.length && fcYears.every((v) => v < y))
    warnings.push(`검증표 근거가 모두 ${y}년 이전 자료입니다. 최신 공고가 있는지 확인하세요.`);
}

// queue.md에서 slug 줄의 상태 표시를 바꿉니다: ' ' 대기, 'd' 초안, 'x' 발행
export function setQueueStatus(slug, mark) {
  if (!fs.existsSync(QUEUE)) return false;
  const text = fs.readFileSync(QUEUE, 'utf8');
  const re = new RegExp(`^- \\[[ dx]\\] ${slug.replace(/[-]/g, '\\-')}(\\s|\\|)`, 'm');
  if (!re.test(text)) return false;
  fs.writeFileSync(QUEUE, text.replace(re, (m) => m.replace(/\[[ dx]\]/, `[${mark}]`)), 'utf8');
  return true;
}

// ── 계산기 명세 검사 ──────────────────────────────────────────────
// 수식이 안전한 문법인지, 모든 값이 정의돼 있는지, 테스트 예시가 맞는지, 기준값마다 원문 근거가 있는지 봅니다.
const KEY_RE = /^[a-z][a-zA-Z0-9]*$/;
export function validateToolSpec(spec, id, post) {
  const errors = [];
  const warnings = [];
  if (spec.id !== id) errors.push(`명세의 id("${spec.id}")가 파일 이름·글의 tool("${id}")과 다릅니다.`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(spec.id ?? '')) errors.push('id는 영문 소문자·숫자·하이픈만 씁니다.');
  if (TOOL_IDS.includes(spec.id)) errors.push(`"${spec.id}"는 이미 있는 계산기 이름입니다.`);
  for (const k of ['name', 'blurb', 'category', 'headline', 'description', 'fine'])
    if (!spec[k] || typeof spec[k] !== 'string') errors.push(`${k}가 없습니다.`);
  if (spec.name && !/계산기/.test(spec.name)) warnings.push('name에 "계산기"를 넣으면 검색에 유리합니다.');
  if (spec.category && !CATS.includes(spec.category)) errors.push(`category는 ${CATS.join(', ')} 중 하나여야 합니다.`);
  for (const k of ['inputs', 'steps', 'outputs'])
    if (!Array.isArray(spec[k]) || spec[k].length === 0) errors.push(`${k}가 비어 있습니다.`);
  if (errors.length) return { errors, warnings };

  const known = new Set();
  const addKey = (k, where) => {
    if (!KEY_RE.test(k ?? '')) errors.push(`${where}의 key "${k}"는 영문 소문자로 시작하는 영문·숫자여야 합니다.`);
    else if (known.has(k) || FUNCTION_NAMES.includes(k)) errors.push(`key "${k}"가 중복되거나 함수 이름과 같습니다.`);
    known.add(k);
  };
  spec.inputs.forEach((inp, i) => {
    addKey(inp.key, `inputs ${i + 1}번째`);
    if (!inp.label) errors.push(`inputs ${i + 1}번째에 label이 없습니다.`);
    if (!['money', 'percent', 'number', 'select'].includes(inp.type)) errors.push(`inputs "${inp.key}"의 type은 money, percent, number, select 중 하나입니다.`);
    if (inp.type === 'select' && (!Array.isArray(inp.options) || inp.options.length < 2 || inp.options.some((o) => !o.label || typeof o.value !== 'number')))
      errors.push(`inputs "${inp.key}"는 select라서 options(label, 숫자 value)가 2개 이상 필요합니다.`);
  });

  // 기준값(법정 금액·비율 등): 모두 원문 근거 필요
  const postSources = new Set((post?.sources ?? []).map((x) => normUrl(x?.url)));
  (spec.constants ?? []).forEach((c, i) => {
    addKey(c.key, `constants ${i + 1}번째`);
    if (typeof c.value !== 'number') errors.push(`constants "${c.key}"의 value는 숫자여야 합니다.`);
    if (!c.label || !c.evidence) errors.push(`constants "${c.key}"에 label과 evidence(원문 어디에 무엇이라고 쓰여 있는지)가 필요합니다.`);
    if (!/^https?:\/\//.test(c.source ?? '')) errors.push(`constants "${c.key}"에 원문 source URL이 필요합니다.`);
    else if (post && !postSources.has(normUrl(c.source))) errors.push(`constants "${c.key}"의 출처가 글의 sources에 없습니다.`);
  });

  // 수식
  spec.steps.forEach((st, i) => {
    let ast;
    try {
      ast = parseExpr(st.expr);
    } catch (e) {
      errors.push(`steps "${st.key}" 수식 오류: ${e.message}`);
    }
    if (ast) for (const v of variables(ast)) if (!known.has(v)) errors.push(`steps "${st.key}"가 아직 정의되지 않은 값 "${v}"를 씁니다.`);
    addKey(st.key, `steps ${i + 1}번째`);
    // 수식 안의 큰 숫자는 기준값(constants)으로 빼서 근거를 달아야 합니다
    const bigLiterals = String(st.expr).match(/\d[\d_]{4,}/g);
    if (bigLiterals) errors.push(`steps "${st.key}" 수식에 숫자 ${bigLiterals.join(', ')}가 직접 들어 있습니다. constants로 빼고 원문 근거를 다세요.`);
  });
  (spec.notes ?? []).forEach((n, i) => {
    try {
      for (const v of variables(parseExpr(n.when))) if (!known.has(v)) errors.push(`notes ${i + 1}번째 조건이 모르는 값 "${v}"를 씁니다.`);
    } catch (e) {
      errors.push(`notes ${i + 1}번째 조건 오류: ${e.message}`);
    }
    if (!n.text) errors.push(`notes ${i + 1}번째에 text가 없습니다.`);
  });
  spec.outputs.forEach((o) => {
    if (!known.has(o.key)) errors.push(`outputs "${o.key}"가 inputs·steps에 없습니다.`);
    if (!o.label) errors.push(`outputs "${o.key}"에 label이 없습니다.`);
    if (o.format && !['won', 'percent', 'number', 'months'].includes(o.format)) errors.push(`outputs "${o.key}"의 format은 won, percent, number, months 중 하나입니다.`);
  });
  if (spec.outputs.filter((o) => o.primary).length > 1) errors.push('primary 출력은 하나만 둡니다.');
  if (errors.length) return { errors, warnings };

  // 테스트: 손으로 계산한 예시와 결과가 같아야 합니다
  const tests = spec.tests ?? [];
  if (tests.length < 3) errors.push(`tests(손계산 예시)가 ${tests.length}개입니다. 경계값을 포함해 최소 3개를 넣으세요.`);
  tests.forEach((t, i) => {
    let env;
    try {
      env = runSpec(spec, t.inputs ?? {});
    } catch (e) {
      errors.push(`tests ${i + 1}번째 계산 오류: ${e.message}`);
      return;
    }
    for (const [k, want] of Object.entries(t.expect ?? {})) {
      if (!(k in env)) errors.push(`tests ${i + 1}번째의 expect "${k}"가 없는 값입니다.`);
      else if (Math.abs(env[k] - want) > 1) errors.push(`tests ${i + 1}번째: ${k} 예상 ${want}, 계산 결과 ${Math.round(env[k])}. 수식이나 예시를 확인하세요.`);
    }
    if (!t.why) warnings.push(`tests ${i + 1}번째에 why(손계산 과정)가 없습니다.`);
  });
  return { errors, warnings };
}
