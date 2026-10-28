# 사장님노트

소상공인 지원금·정책자금·세금 정보 블로그와 계산기. Astro로 만든 정적 사이트이고 Cloudflare Pages에 무료로 올립니다.

```
글감 대기열 ──(예약 작업: Claude가 조사·초안 작성)──> content/drafts/
                                                         │ 사람이 원문과 대조해 검토
                                                         ▼
                         npm run publish-draft -- <파일이름>
                                                         │ 검사 → 이동 → 빌드 확인 → commit → push
                                                         ▼
                              GitHub ──(자동)──> Cloudflare Pages ──> 사이트 반영
```

## 매일 하는 일 (5~15분)

1. 이 폴더에서 터미널(PowerShell)을 엽니다.
2. `npm run drafts` — 새 초안과 고칠 점을 봅니다.
3. 초안 파일(`content/drafts/*.md`)을 열어 검토합니다.
   - `reviewNotes`에 Claude가 남긴 메모를 읽습니다.
   - `[확인 필요: ...]` 표시가 있는 숫자는 원문을 열어 확인하고 고친 뒤 표시를 지웁니다.
   - `sources` 링크를 1~2개라도 직접 열어 금액·기한이 맞는지 봅니다.
4. `npm run publish-draft -- <파일이름>` — 끝. 1~2분 뒤 사이트에 올라갑니다.
   - 날짜를 정해 공개: `npm run publish-draft -- <파일이름> --date 2026-11-10`

초안이 마음에 안 들면 파일을 지우고 `keywords/queue.md`에서 그 줄을 `[ ]`로 되돌리세요. 다음 실행 때 다시 씁니다.

## 글감 관리

`keywords/queue.md`가 글감 목록입니다. 위에서부터 `[ ]` 줄을 하나씩 씁니다. 순서를 바꾸거나 새 줄을 추가하면 됩니다. 초안 규칙은 `docs/WRITING_GUIDE.md`에 있습니다.

## 처음 한 번 하는 설정

### 1. 내 컴퓨터 준비

- [Node.js LTS](https://nodejs.org/ko)와 [Git](https://git-scm.com/download/win) 설치
- 이 폴더에서 `npm install`
- 미리보기: `npm run dev` 후 브라우저에서 http://localhost:4321

### 2. Cloudflare Pages 연결

1. [Cloudflare](https://dash.cloudflare.com) 가입 → Workers & Pages → 만들기 → Pages → Git에 연결
2. 이 GitHub 저장소 선택
3. 빌드 설정
   - 프레임워크 사전 설정: Astro
   - 빌드 명령: `npm run build`
   - 빌드 출력 디렉터리: `dist`
   - 환경 변수: `NODE_VERSION` = `22`, `SITE_URL` = 배포 주소
4. 저장하면 첫 배포가 시작됩니다. 주소는 `프로젝트이름.pages.dev`.

### 3. 예약 발행용 매일 재빌드 (선택)

미래 날짜로 발행한 글이 그날 나타나게 하려면:
1. Cloudflare Pages 프로젝트 → 설정 → 빌드 → 배포 후크 추가 → URL 복사
2. GitHub 저장소 → Settings → Secrets and variables → Actions → `CF_DEPLOY_HOOK` 이름으로 저장

### 4. 도메인 (애드센스 신청 전 권장)

`.pages.dev` 주소로도 사이트는 돌아가지만, 애드센스는 직접 소유한 도메인이 유리합니다. 도메인을 사서 Cloudflare Pages → 사용자 지정 도메인에 연결하고 `SITE_URL`을 바꾸세요.

### 5. 검색 등록

- [구글 서치 콘솔](https://search.google.com/search-console): 속성 추가 → HTML 태그 값을 `PUBLIC_GOOGLE_VERIFY` 환경 변수에 → `sitemap-index.xml` 제출
- [네이버 서치어드바이저](https://searchadvisor.naver.com): 사이트 등록 → HTML 태그 값을 `PUBLIC_NAVER_VERIFY`에 → 사이트맵·RSS 제출

### 6. 애드센스

1. 글이 **최소 20~30개** 쌓이고, 소개·개인정보처리방침·문의 페이지가 있는 상태에서 신청하세요(이미 만들어져 있습니다).
2. `src/site.config.ts`의 `email`을 실제 문의 메일로 바꾸세요.
3. 승인되면 Cloudflare 환경 변수에 `PUBLIC_ADSENSE_CLIENT`(ca-pub-...)와 `PUBLIC_ADSENSE_SLOT`을 넣고 재배포 → 광고와 `ads.txt`가 자동으로 켜집니다.

## 자주 바꾸는 곳

| 바꿀 것 | 파일 |
|---|---|
| 사이트 이름, 설명, 문의 메일, 카테고리 | `src/site.config.ts` |
| 홈의 "다가오는 마감" 일정 | `src/data/deadlines.json` |
| 색상, 글꼴 | `src/styles/global.css` |
| 글감 목록 | `keywords/queue.md` |
| 초안 작성 규칙 | `docs/WRITING_GUIDE.md` |
| 예약 작업에게 주는 지시 | `docs/SCHEDULED_TASK.md` |

## 계산기 기준

- 부가세: 일반과세자(10/110 방식), 간이과세자(업종별 부가가치율 15~40% × 10%, 매입 0.5% 공제, 연 4,800만 원 미만 납부면제), 카드매출 세액공제(2026년 공급분까지 1.3%·연 1,000만 원 / 2027년 정부안 1.2%·연 500만 원). **세법이 확정되면 `src/components/VatCalculator.astro` 숫자를 확인하세요.**
- 정책자금: 월 단위 단순 계산(연 금리 ÷ 12), 거치기간 이자만 납부 후 원금균등/원리금균등.
