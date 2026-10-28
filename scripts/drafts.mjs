// 사용법: npm run drafts
// content/drafts 안의 초안 목록과 발행 가능 여부를 보여줍니다.
import path from 'node:path';
import { listDrafts, validate } from './lib.mjs';

const files = listDrafts();
if (files.length === 0) {
  console.log('\n검토할 초안이 없습니다. 예약 작업이 다음 초안을 만들면 content/drafts에 나타납니다.\n');
  process.exit(0);
}

console.log(`\n초안 ${files.length}개\n`);
for (const f of files) {
  const slug = path.basename(f, '.md');
  const { errors, warnings, doc } = validate(f);
  const status = errors.length ? '고칠 것 있음' : '발행 가능';
  console.log(`● ${slug}  [${status}]`);
  if (doc?.data?.title) console.log(`  ${doc.data.title}`);
  errors.forEach((e) => console.log(`  ✗ ${e}`));
  warnings.forEach((w) => console.log(`  △ ${w}`));
  if (!errors.length) console.log(`  → 발행: npm run publish-draft -- ${slug}`);
  console.log('');
}
