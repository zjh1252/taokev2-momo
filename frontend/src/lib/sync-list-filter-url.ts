/** 当前浏览器 pathname（含 locale 前缀，与地址栏一致） */
export function getBrowserPathname(): string {
  if (typeof window === 'undefined') return '';
  return window.location.pathname;
}

/**
 * 更新地址栏（不触发 Next.js RSC 软导航）。
 * 尽量保留现有 history.state；若 state 无法 structured clone，则降级为 null，
 * 保证 URL 一定能更新（分页/筛选持久化优先于保留 state）。
 */
export function replaceBrowserHistoryUrl(target: string) {
  if (typeof window === 'undefined') return;
  const current = `${window.location.pathname}${window.location.search}`;
  if (current === target) return;
  try {
    window.history.replaceState(window.history.state, '', target);
  } catch {
    window.history.replaceState(null, '', target);
  }
}

/** 更新地址栏查询参数，不触发 Next.js RSC 软导航，避免列表筛选被 SSR 重置 */
export function replaceBrowserUrl(path: string, params: URLSearchParams) {
  if (typeof window === 'undefined') return;
  const qs = params.toString();
  const target = qs ? `${path}?${qs}` : path;
  replaceBrowserHistoryUrl(target);
}

type ListUrlParamValue = string | number | null | undefined;

export function currentBrowserSearchParams(fallback?: URLSearchParams): URLSearchParams {
  if (typeof window !== 'undefined') {
    return new URLSearchParams(window.location.search);
  }
  return new URLSearchParams(fallback?.toString() ?? '');
}

export function mergeListUrlParams(
  current: string | URLSearchParams,
  updates: Record<string, ListUrlParamValue>,
  page?: number,
): URLSearchParams {
  const params = new URLSearchParams(
    typeof current === 'string' && current.startsWith('?')
      ? current.slice(1)
      : current.toString(),
  );

  for (const [key, value] of Object.entries(updates)) {
    const next = value == null ? '' : String(value).trim();
    if (next) {
      params.set(key, next);
    } else {
      params.delete(key);
    }
  }

  if (page !== undefined) {
    setPageParam(params, page);
  }

  return params;
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
