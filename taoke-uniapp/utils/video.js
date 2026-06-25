/**
 * 录播课章节与播放辅助
 */

export function flattenVideoChapters(video) {
  if (!video) return [];
  const fromSeries = (video.seriesList || []).flatMap((s) => s.chapters || []);
  const standalone = video.standaloneChapters || [];
  return [...fromSeries, ...standalone].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

export function resolveDirectPlayUrl(raw) {
  const url = (raw || '').trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url;
  return url;
}
