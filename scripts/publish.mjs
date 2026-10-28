// 사용법:
//   npm run publish-draft -- <slug>                 오늘 날짜로 발행
//   npm run publish-draft -- <slug> --date 2026-11-05   그 날짜에 공개(예약 발행)
//   npm run publish-draft -- <slug> --no-push       커밋만 하고 GitHub에 올리지 않음
//
// 하는 일: 검사 → 검증표 보여주고 사람 확인 → 발행일 기록 → src/content/posts로 이동 → 빌드 확인 → commit → push
// push가 되면 GitHub Actions가 사이트를 빌드해 Cloudflare에 배포합니다.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import readline from 'node:readline/promises';
import { stringify } from 'yaml';
import { DRAFTS, POSTS, ROOT, validate, writeDoc, todayKST, setQueueStatus } from './lib.mjs';

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith('--'))?.replace(/\.md$/, '');
const dateIdx = args.indexOf('--date');
const date = dateIdx >= 0 ? args[dateIdx + 1] : todayKST();
const push = !args.includes('--no-push');

const run = (cmd) => execSync(cmd, { cwd: ROOT, stdio: 'inherit' });

if (!slug) {
  console.error('사용법: npm run publish-draft -- <초안 파일 이름> [--date YYYY-MM-DD] [--no-push]');
  process.exit(1);
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error('--date는 2026-11-05 같은 형식이어야 합니다.');
  process.exit(1);
}

const src = path.join(DRAFTS, `${slug}.md`);
if (!fs.existsSync(src)) {
  console.error(`content/drafts/${slug}.md 파일이 없습니다. npm run drafts 로 목록을 확인하세요.`);
  process.exit(1);
}

const { errors, warnings, doc } = validate(src);
warnings.forEach((w) => console.log(`△ ${w}`));
if (errors.length) {
  errors.forEach((e) => console.log(`✗ ${e}`));
  console.log('\n위 문제를 고친 뒤 다시 실행하세요. 발행하지 않았습니다.');
  process.exit(1);
}

// 사람이 원문을 직접 대조했는지 마지막으로 확인합니다
console.log(`\n검증표 (2차 검증일 ${doc.data.factCheck.checkedAt})`);
doc.data.factCheck.items.forEach((it, i) => {
  console.log(`  ${i + 1}. ${it.claim}: ${it.value}`);
  console.log(`     근거: ${it.evidence}`);
  console.log(`     원문: ${it.source}`);
});
if (!args.includes('--yes')) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ans = (await rl.question('\n원문 링크를 직접 열어 위 숫자를 확인했나요? (y/N) ')).trim().toLowerCase();
  rl.close();
  if (ans !== 'y') {
    console.log('발행하지 않았습니다. 확인 후 다시 실행하세요.');
    process.exit(0);
  }
}

const raw = fs.readFileSync(src, 'utf8');
const data = { ...doc.data, pubDate: date };
delete data.reviewNotes;
delete data.factCheck; // 검증표는 사이트에 올리지 않고 content/factcheck/에 따로 보관합니다
const fcFile = path.join(ROOT, 'content', 'factcheck', `${slug}.yml`);
fs.mkdirSync(path.dirname(fcFile), { recursive: true });
fs.writeFileSync(fcFile, stringify({ slug, title: data.title, publishedOn: date, ...doc.data.factCheck }, { lineWidth: 0 }), 'utf8');
const dest = path.join(POSTS, `${slug}.md`);
writeDoc(dest, data, doc.body);
fs.unlinkSync(src);
setQueueStatus(slug, 'x');
console.log(`✓ src/content/posts/${slug}.md 로 옮겼습니다 (공개일 ${date}).`);

try {
  console.log('\n사이트 빌드로 오류가 없는지 확인합니다...');
  execSync('npm run build', { cwd: ROOT, stdio: 'pipe' });
  console.log('✓ 빌드 성공');
} catch (e) {
  // 빌드가 깨지면 초안을 원래 내용 그대로 되돌립니다
  fs.writeFileSync(src, raw, 'utf8');
  fs.unlinkSync(dest);
  fs.rmSync(fcFile, { force: true });
  setQueueStatus(slug, 'd');
  console.error(e.stdout?.toString().slice(-2000) ?? e.message);
  console.error('\n✗ 빌드가 실패해서 초안을 원래 자리로 되돌렸습니다. 위 오류를 확인하세요.');
  process.exit(1);
}

try {
  run(`git add -A "src/content/posts/${slug}.md" "content/drafts" "content/factcheck" "keywords/queue.md"`);
  run(`git commit -m "글 발행: ${data.title.replace(/"/g, "'")}"`);
  if (push) {
    run('git push');
    console.log(`\n✓ GitHub에 올렸습니다. 1~2분 뒤 사이트에 반영됩니다.`);
    if (date > todayKST()) console.log(`  공개일이 ${date}이므로 그날 아침 자동 배포 때 나타납니다.`);
  } else {
    console.log('\n✓ 커밋했습니다. 올리려면 git push 를 실행하세요.');
  }
} catch {
  console.error('\n✗ git 커밋/푸시에 실패했습니다. 파일은 발행 위치로 옮겨졌으니 git 상태를 확인한 뒤 직접 commit/push 하세요.');
  process.exit(1);
}
