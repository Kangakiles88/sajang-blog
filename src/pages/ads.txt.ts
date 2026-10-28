// 애드센스 승인 후 PUBLIC_ADSENSE_CLIENT(ca-pub-...)를 넣으면 ads.txt가 자동으로 만들어집니다.
export function GET() {
  const client = import.meta.env.PUBLIC_ADSENSE_CLIENT as string | undefined;
  const pub = client?.replace(/^ca-/, '');
  const body = pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : '';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
