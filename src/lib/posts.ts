import { getCollection } from 'astro:content';

// 발행일이 미래인 글은 빌드에서 제외 (예약 발행)
export async function getPublishedPosts() {
  const now = Date.now();
  const posts = await getCollection('posts', (p) => p.data.pubDate.getTime() <= now);
  return posts.sort(
    (a, b) =>
      (b.data.updatedDate ?? b.data.pubDate).getTime() -
      (a.data.updatedDate ?? a.data.pubDate).getTime(),
  );
}
