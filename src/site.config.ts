// 사이트 기본 설정: 이름·설명·카테고리는 여기 한 곳만 고치면 됩니다.

export const SITE = {
  name: '사장님노트',
  tagline: '지원금, 세금, 마감일을 사장님 언어로 정리합니다',
  description:
    '소상공인 정책자금, 지원사업 공고, 부가세·종소세 신고, 폐업 지원까지. 공고 원문을 확인해 쉽게 정리하고 계산기로 바로 따져볼 수 있게 만듭니다.',
  // 배포 주소. Cloudflare Pages 환경변수 SITE_URL로 덮어쓸 수 있습니다.
  url: import.meta.env.SITE_URL ?? 'https://sajang-note.pages.dev',
  // 사이트에 공개되는 문의 메일. 애드센스 신청 전 실제 주소로 바꾸세요.
  email: 'contact@example.com',
  locale: 'ko_KR',
};

export const CATEGORIES = [
  {
    slug: 'loan',
    name: '정책자금·대출',
    blurb: '정책자금 종류, 자격, 거절 사유, 대환대출까지',
  },
  {
    slug: 'support',
    name: '지원사업 공고',
    blurb: '중기부·지자체 지원사업과 신청 서류',
  },
  {
    slug: 'tax',
    name: '세금·신고',
    blurb: '부가세, 종합소득세, 간이·일반과세 정리',
  },
  {
    slug: 'closing',
    name: '폐업·재기',
    blurb: '폐업 절차, 철거비 지원, 재창업 자금',
  },
  {
    slug: 'marketing',
    name: '가게 홍보',
    blurb: '인스타, 네이버 플레이스, 온라인 판로 지원',
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export const categoryName = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;

export const TOOLS = [
  {
    href: '/tools/vat/',
    name: '부가세 예상 납부액 계산기',
    blurb: '일반과세자·간이과세자 모두, 카드매출 세액공제 반영',
  },
  {
    href: '/tools/loan/',
    name: '정책자금 월 상환액 계산기',
    blurb: '거치기간, 원금균등·원리금균등 상환표까지',
  },
];
