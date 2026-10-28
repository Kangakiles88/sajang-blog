// 초안 검증·발행 스크립트 공용 함수
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DRAFTS = path.join(ROOT, 'content', 'drafts');
export const POSTS = path.join(ROOT, 'src', 'content', 'posts');
export const QUEUE = path.join(ROOT, 'keywords', 'queue.md');

const CATS = ['loan', 'support', 'tax', 'closing'];

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
  if (d.tool && !['vat', 'loan'].includes(d.tool)) errors.push('tool은 vat 또는 loan만 쓸 수 있습니다.');
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

  return { errors, warnings, doc };
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
