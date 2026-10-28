// 공유용 썸네일(1200x630 PNG)을 빌드 시점에 만듭니다.
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { SITE, getCategory } from '../site.config';

const fontDir = path.resolve('src/assets/fonts');
let fonts: { name: string; data: Buffer; weight: 600 | 800; style: 'normal' }[] | null = null;
const loadFonts = () =>
  (fonts ??= [
    { name: 'Pretendard', data: fs.readFileSync(path.join(fontDir, 'Pretendard-SemiBold.otf')), weight: 600, style: 'normal' },
    { name: 'Pretendard', data: fs.readFileSync(path.join(fontDir, 'Pretendard-ExtraBold.otf')), weight: 800, style: 'normal' },
  ]);

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: unknown[]): Node => ({
  type,
  props: { style, children: children.length === 1 ? children[0] : children },
});

const INK = '#1b2a41';
const MARK = '#ffe45c';

export async function renderOg(opts: { title: string; category?: string; kicker?: string }) {
  const cat = opts.category ? getCategory(opts.category) : null;
  const color = cat?.color ?? INK;
  const len = opts.title.length;
  const size = len > 34 ? 58 : len > 22 ? 66 : 76;

  const icon: Node | null = cat
    ? {
        type: 'svg',
        props: {
          width: 44,
          height: 44,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: color,
          'stroke-width': 2,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          children: { type: 'path', props: { d: cat.icon } },
        },
      }
    : null;

  const tree = h(
    'div',
    { width: 1200, height: 630, display: 'flex', background: '#ffffff', fontFamily: 'Pretendard' },
    h('div', { width: 28, height: 630, background: color }),
    h(
      'div',
      { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 80px 56px 72px', flex: 1 },
      h(
        'div',
        { display: 'flex', alignItems: 'center', gap: 16, color, fontSize: 34, fontWeight: 800 },
        ...(icon ? [icon] : []),
        opts.kicker ?? cat?.name ?? '',
      ),
      h(
        'div',
        { display: 'flex', color: INK, fontSize: size, fontWeight: 800, lineHeight: 1.28, wordBreak: 'keep-all', letterSpacing: -2, maxHeight: size * 1.28 * 3, overflow: 'hidden' },
        opts.title,
      ),
      h(
        'div',
        { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `4px solid ${INK}`, paddingTop: 24 },
        h(
          'div',
          { display: 'flex', position: 'relative', fontSize: 38, fontWeight: 800, color: INK },
          h('div', { position: 'absolute', left: -6, right: -6, bottom: 2, height: 20, background: MARK }),
          h('div', { display: 'flex', position: 'relative' }, SITE.name),
        ),
        h('div', { display: 'flex', fontSize: 28, fontWeight: 600, color: '#5d6878' }, '원문 확인 후 쉽게 정리합니다'),
      ),
    ),
  );

  const svg = await satori(tree as never, { width: 1200, height: 630, fonts: loadFonts() });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
