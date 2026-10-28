export const formatDate = (d: Date) =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(d);

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

// 한국 시간 기준 오늘 날짜(YYYY-MM-DD)
export const todayKST = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());

export const daysUntil = (dateStr: string, from = todayKST()) => {
  const a = Date.parse(from + 'T00:00:00Z');
  const b = Date.parse(dateStr + 'T00:00:00Z');
  return Math.round((b - a) / 86400000);
};

export const readingMinutes = (text: string) =>
  Math.max(1, Math.round(text.replace(/\s+/g, '').length / 500));
