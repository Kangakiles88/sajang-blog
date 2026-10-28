// 사용법: npm run check-draft -- <slug>
// 초안 하나를 검사합니다. 문제가 있으면 종료 코드 1.
import path from 'node:path';
import fs from 'node:fs';
import { DRAFTS, validate } from './lib.mjs';

const slug = process.argv[2]?.replace(/\.md$/, '');
if (!slug) {
  console.error('사용법: npm run check-draft -- <초안 파일 이름>');
  process.exit(1);
}
const file = path.join(DRAFTS, `${slug}.md`);
if (!fs.existsSync(file)) {
  console.error(`content/drafts/${slug}.md 파일이 없습니다.`);
  process.exit(1);
}
const { errors, warnings } = validate(file);
errors.forEach((e) => console.log(`✗ ${e}`));
warnings.forEach((w) => console.log(`△ ${w}`));
if (errors.length) process.exit(1);
console.log(`✓ ${slug}: 발행 가능`);
