/** 当前浏览器 pathname（含 locale 前缀，与地址栏一致） */
export function getBrowserPathname(): string {
  if (typeof window === 'undefined') return '';
  return window.location.pathname;
}

/** 更新地址栏查询参数，不触发 Next.js RSC 软导航（避免列表筛选被 SSR 重置） */
export function replaceBrowserUrl(path: string, params: URLSearchParams) {
  if (typeof window === 'undefined') return;
  const qs = params.toString();
  const target = qs ? `${path}?${qs}` : path;
  const current = `${window.location.pathname}${window.location.search}`;
  if (current !== target) {
    window.history.replaceState(null, '', target);
  }
}

/** 跳转到 SEO 频道页（整页刷新，清除 query 上下文） */
export function navigateToSeoPath(seoPath: string) {
  if (typeof window === 'undefined') return;
  window.location.assign(seoPath);
}

export function setPageParam(params: URLSearchParams, page: number) {
  if (page <= 1) {
    params.delete('page');
  } else {
    params.set('page', String(page));
  }
}
