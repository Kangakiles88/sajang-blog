import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string().min(10).max(70),
    description: z.string().min(40).max(160),
    category: z.enum(['loan', 'support', 'tax', 'closing']),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    // 공고·법령 원문 링크. 최소 1개 필수.
    sources: z
      .array(z.object({ title: z.string(), url: z.string().url() }))
      .min(1),
    // 글과 함께 보여줄 계산기 (선택)
    tool: z.enum(['vat', 'loan']).optional(),
    // 글 맨 위 "한눈에 보기" 박스. 2~4줄 (예: 대상 / 금액 / 마감 / 신청처)
    keyPoints: z
      .array(z.object({ label: z.string().max(8), value: z.string().max(80) }))
      .min(2)
      .max(4)
      .optional(),
  }),
});

export const collections = { posts };
