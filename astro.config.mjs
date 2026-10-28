import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 배포 주소는 Cloudflare Pages 환경변수 SITE_URL에 넣으세요 (예: https://sajangnote.kr)
const site = process.env.SITE_URL || 'https://sajang-note.pages.dev';

export default defineConfig({
  site,
  trailingSlash: 'always',
  integrations: [sitemap()],
  build: { format: 'directory' },
});
