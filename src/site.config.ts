// 사이트 기본 설정: 이름·설명·카테고리는 여기 한 곳만 고치면 됩니다.

export const SITE = {
  name: '사장님노트',
  tagline: '사장님이 받을 돈, 낼 세금, 놓치면 안 되는 날',
  description:
    '소상공인 정책자금, 지원사업 공고, 부가세·종소세 신고, 폐업 지원까지. 공고 원문을 확인해 쉽게 정리하고 계산기로 바로 따져볼 수 있게 만듭니다.',
  // 배포 주소. 빌드 환경변수 SITE_URL로 덮어씁니다 (도메인 연결 후 설정).
  url: import.meta.env.SITE_URL ?? 'https://sajang-note.com',
  // 사이트에 공개되는 문의 메일. 애드센스 신청 전 실제 주소로 바꾸세요.
  email: 'contact@example.com',
  locale: 'ko_KR',
};

// color: 밝은 화면용, dark: 어두운 화면용. 썸네일 이미지 색도 여기서 가져갑니다.
// icon: 24x24 선 아이콘 path
export const CATEGORIES = [
  {
    slug: 'loan',
    name: '정책자금·대출',
    blurb: '정책자금 종류, 자격, 거절 사유, 대환대출까지',
    color: '#17705a',
    dark: '#5fcfac',
    icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM7.5 8.5l1.8 7 2.7-5.5 2.7 5.5 1.8-7M7 11.5h10',
  },
  {
    slug: 'support',
    name: '지원사업 공고',
    blurb: '중기부·지자체 지원사업과 신청 서류',
    color: '#2457a6',
    dark: '#8db4f2',
    icon: 'M6.5 3h7.5l4 4v14h-11.5zM14 3v4h4M9.5 13.5l2 2 3.5-4',
  },
  {
    slug: 'tax',
    name: '세금·신고',
    blurb: '부가세, 종합소득세, 간이·일반과세 정리',
    color: '#8a5300',
    dark: '#e8b45a',
    icon: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3',
  },
  {
    slug: 'closing',
    name: '폐업·재기',
    blurb: '폐업 절차, 철거비 지원, 재창업 자금',
    color: '#6a4a96',
    dark: '#c3a5ee',
    icon: 'M4 10l2-6h12l2 6zM5 10v10h14V10M9 14h6M9 17h6',
  },
  {
    slug: 'marketing',
    name: '가게 홍보',
    blurb: '인스타, 네이버 플레이스, 온라인 판로 지원',
    color: '#b0304f',
    dark: '#f28aa3',
    icon: 'M4 10v4h3l7 4V6l-7 4zM17.5 9a4 4 0 0 1 0 6M20 6.5a7.5 7.5 0 0 1 0 11',
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export const getCategory = (slug: string) => CATEGORIES.find((c) => c.slug === slug) ?? CATEGORIES[0];

export const categoryName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;

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
