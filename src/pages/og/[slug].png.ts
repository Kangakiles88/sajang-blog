import type { APIContext } from 'astro';
import { getPublishedPosts } from '../../lib/posts';
import { renderOg } from '../../lib/og';
import { SITE } from '../../site.config';

export async function getStaticPaths() {
  const posts = await getPublishedPosts();
  return [
    ...posts.map((p) => ({ params: { slug: p.id }, props: { title: p.data.title, category: p.data.category } })),
    { params: { slug: 'default' }, props: { title: SITE.tagline, kicker: '소상공인 지원금·세금 정보' } },
    { params: { slug: 'tool-vat' }, props: { title: '부가세 예상 납부액 계산기', category: 'tax', kicker: '사장님 계산기' } },
    { params: { slug: 'tool-loan' }, props: { title: '정책자금 월 상환액 계산기', category: 'loan', kicker: '사장님 계산기' } },
  ];
}

export async function GET({ props }: APIContext) {
  const png = await renderOg(props as { title: string; category?: string; kicker?: string });
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
}
