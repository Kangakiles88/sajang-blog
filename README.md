# 사장님노트

소상공인 지원금·정책자금·세금 정보 블로그와 계산기. Astro로 만든 정적 사이트이고, GitHub Actions가 빌드해서 Cloudflare(Workers 정적 사이트)에 무료로 올립니다. 주소: https://sajang-note.com

```
글감 대기열 ──(예약 작업: Claude가 조사·초안 작성)──> content/drafts/
                                                         │ 사람이 원문과 대조해 검토
                                                         ▼
                         npm run publish-draft -- <파일이름>
                                                         │ 검사 → 검증표 확인(y/N) → 이동 → 빌드 확인 → commit → push
                                                         ▼
               GitHub ──(GitHub Actions: 빌드 → wrangler deploy)──> Cloudflare ──> 사이트 반영
```

## 매일 하는 일 (5~15분)

1. 이 폴더에서 터미널(PowerShell)을 엽니다.
2. `npm run drafts` — 새 초안과 고칠 점을 봅니다.
3. 초안 파일(`content/drafts/*.md`)을 열어 검토합니다.
   - 맨 위 `factCheck`(검증표)에 본문 숫자마다 원문 위치가 적혀 있습니다. 링크를 열어 숫자가 맞는지 대조하세요.
   - `reviewNotes`에 Claude가 남긴 메모를 읽습니다. 공식 사이트를 브라우저로 열어도 확인하지 못해 본문에서 "뺀 내용"이 있으면 여기 적혀 있습니다. 필요하면 직접 확인해서 본문과 검증표에 추가하세요.
   - `[확인 필요: ...]` 표시는 원칙적으로 없습니다. 빼면 글이 성립하지 않을 때만 남아 있으니, 원문을 열어 확인하고 고친 뒤 표시를 지우고 검증표 항목을 `일치`로 바꿉니다. 표시가 남아 있으면 발행 스크립트가 거부합니다.
4. `npm run publish-draft -- <파일이름>` — 검증표를 한 번 보여주고 "원문을 확인했나요? (y/N)"를 묻습니다. `y`를 누르면 발행되고 1~2분 뒤 사이트에 올라갑니다.
   - 검증표는 사이트에 보이지 않고 `content/factcheck/`에 보관됩니다.
   - 날짜를 정해 공개: `npm run publish-draft -- <파일이름> --date 2026-11-10` (그날 아침 6시 7분 자동 배포 때 나타납니다)

초안은 Claude 데스크톱 앱의 예약 작업("사장님노트 초안 작성", 매일 저녁 7시 48분)이 씁니다. 지시문 사본은 `docs/SCHEDULED_TASK.md`에 있습니다.

초안이 마음에 안 들면 파일을 지우고 `keywords/queue.md`에서 그 줄을 `[ ]`로 되돌리세요. 다음 실행 때 다시 씁니다.

## 계산기

글에 맞는 계산기가 없으면 예약 작업이 초안과 함께 **계산기 명세**(`content/drafts/tools/<id>.json`)를 만듭니다. 코드가 아니라 입력칸·기준값·수식을 적은 설정 파일이라, 사이트가 알아서 글 안 계산기와 단독 페이지(`/tools/<id>/`)를 그려 줍니다.

- 법정 금액·비율 같은 기준값마다 원문 근거가 붙어 있고, 손계산 예시 3개 이상과 결과가 1원이라도 다르면 발행이 막힙니다.
- 발행할 때 기준값과 예시를 화면에 보여주니, 검증표와 함께 원문을 대조하세요.
- 발행되면 `src/data/tools/`로 옮겨지고, 다음 글에서도 같은 계산기를 다시 씁니다.
- 직접 만든 계산기(부가세, 간이 vs 일반, 정책자금 상환, 대환대출)는 `src/components/`에 있습니다.

## 글감 관리

`keywords/queue.md`가 글감 목록입니다. 위에서부터 `[ ]` 줄을 하나씩 씁니다. 순서를 바꾸거나 새 줄을 추가하면 됩니다. 초안 규칙은 `docs/WRITING_GUIDE.md`에 있습니다.

## 처음 한 번 하는 설정

### 1. 내 컴퓨터 준비

- [Node.js LTS](https://nodejs.org/ko)와 [Git](https://git-scm.com/download/win) 설치
- 이 폴더에서 `npm install`
- 미리보기: `npm run dev` 후 브라우저에서 http://localhost:4321

### 2. 배포 (GitHub Actions → Cloudflare) — 설정 완료

`.github/workflows/deploy.yml`이 main에 push할 때마다, 그리고 매일 아침 6시 7분(한국 시간)에 사이트를 빌드해서 `wrangler deploy`로 Cloudflare에 올립니다. Cloudflare 쪽 설정은 `wrangler.jsonc`(dist 폴더를 그대로 올림)에 있습니다.

- 필요한 비밀값: GitHub 저장소 → Settings → Secrets and variables → Actions → **Secrets** 탭
  - `CLOUDFLARE_API_TOKEN`: Cloudflare API 토큰 (Workers 편집 권한)
  - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare 계정 ID (32자리)
- 배포 결과는 GitHub 저장소 → Actions 탭에서 봅니다. 실패하면 빨간 표시와 함께 원인이 한 줄로 나옵니다.
- 손으로 다시 배포: Actions → 배포 → Run workflow
- `.github/workflows/daily-rebuild.yml`은 예전 방식(배포 후크)이라 쓰지 않습니다. 지워도 됩니다.

### 3. 도메인 — 설정 완료

`sajang-note.com`이 연결되어 있고, 코드의 기본 주소도 이 도메인입니다(`astro.config.mjs`, `src/site.config.ts`).

### 4. 문의 메일 — 설정 완료

Cloudflare Email Routing으로 `contact@sajang-note.com`에 온 메일이 지메일로 전달됩니다(Cloudflare 대시보드 → Email Service → Email Routing). 받기 전용이라 답장은 지메일 주소로 나갑니다. 사이트에 보이는 주소는 `src/site.config.ts`의 `email`입니다.

### 5. 검색 등록·분석 — 설정 완료

- 구글 서치 콘솔·네이버 서치어드바이저 소유 확인 값과 GA4 측정 ID(`G-1QF10LH23H`)는 `src/layouts/Base.astro`에 기본값으로 들어 있습니다.
- 사이트맵: `https://sajang-note.com/sitemap-index.xml`, RSS: `https://sajang-note.com/rss.xml`

### 6. 애드센스

1. 글이 **최소 20~30개** 쌓이고, 소개·개인정보처리방침·문의 페이지가 있는 상태에서 신청하세요(이미 만들어져 있습니다).
2. 승인되면 GitHub 저장소 → Settings → Secrets and variables → Actions → **Variables** 탭에 아래 두 값을 넣고, Actions → 배포 → Run workflow로 다시 배포하세요. 광고와 `ads.txt`가 자동으로 켜집니다.
   - `PUBLIC_ADSENSE_CLIENT`: `ca-pub-`로 시작하는 값
   - `PUBLIC_ADSENSE_SLOT`: 디스플레이 광고 단위의 슬롯 ID(숫자)
   - 사이트는 GitHub Actions에서 빌드되므로 Cloudflare 환경 변수에 넣으면 적용되지 않습니다.

## 자주 바꾸는 곳

| 바꿀 것 | 파일 |
|---|---|
| 사이트 이름, 설명, 문의 메일, 카테고리(색·아이콘) | `src/site.config.ts` |
| 홈의 "다가오는 마감" 일정 | `src/data/deadlines.json` |
| 포인트 색(파랑), 글꼴 | `src/styles/global.css` (`--accent` 등) |
| 공유 썸네일 모양 | `src/lib/og.ts` |
| 배포 방식 | `.github/workflows/deploy.yml`, `wrangler.jsonc` |
| 글감 목록 | `keywords/queue.md` |
| 초안 작성 규칙 | `docs/WRITING_GUIDE.md` |
| 예약 작업에게 주는 지시 | `docs/SCHEDULED_TASK.md` |

## 계산기 기준

- 부가세: 일반과세자(10/110 방식), 간이과세자(업종별 부가가치율 15~40% × 10%, 매입 0.5% 공제, 연 4,800만 원 미만 납부면제), 카드매출 세액공제(2026년 공급분까지 1.3%·연 1,000만 원 / 2027년 정부안 1.2%·연 500만 원). **세법이 확정되면 `src/components/VatCalculator.astro` 숫자를 확인하세요.**
- 정책자금: 월 단위 단순 계산(연 금리 ÷ 12), 거치기간 이자만 납부 후 원금균등/원리금균등.
