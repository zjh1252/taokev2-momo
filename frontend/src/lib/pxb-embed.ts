/** 培训宝 iframe 嵌入：URL 参数 origin=91pxb */
export const PXB_ORIGIN_VALUE = '91pxb';

/** proxy 注入，供 Server Layout 读取 */
export const PXB_EMBED_HEADER = 'x-taoke-pxb-embed';

export function isPxbEmbedOrigin(
  origin: string | string[] | null | undefined,
): boolean {
  if (Array.isArray(origin)) {
    return origin.includes(PXB_ORIGIN_VALUE);
  }
  return origin === PXB_ORIGIN_VALUE;
}

/** 在 Query 上保留 origin=91pxb */
export function appendPxbOrigin(params: URLSearchParams): URLSearchParams {
  params.set('origin', PXB_ORIGIN_VALUE);
  return params;
}

/** 从现有 Query 克隆并保留 origin=91pxb */
export function clonePxbSearchParams(
  source?: URLSearchParams | string,
): URLSearchParams {
  const params = new URLSearchParams(
    typeof source === 'string' ? source : source?.toString() ?? '',
  );
  return appendPxbOrigin(params);
}

/** 生成带 origin 的 /opencourse 等老路径（地址栏 SEO 形态） */
export function withPxbOriginPath(
  path: string,
  params?: URLSearchParams,
): string {
  const qs = clonePxbSearchParams(params).toString();
  const base = path.startsWith('/') ? path : `/${path}`;
  return `${base}?${qs}`;
}

/** 培训宝父页面根地址（不含路径），用于 iframe 高度回传等 */
const DEFAULT_PXB_BASE_URL = 'http://local.91pxb.com';

/** 培训宝 selection 页 query（与老站 peixunbao.php?mod=tt-course&do=selection 一致） */
const PXB_SELECTION_QUERY = {
  mod: 'tt-course',
  do: 'selection',
  buy_type: '1',
} as const;

export function getPxbBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_PXB_BASE_URL || DEFAULT_PXB_BASE_URL;
  return raw.replace(/\/$/, '');
}

/** iframe 高度回传目标：{PXB_BASE}/?mod=tt-course&do=selection&buy_type=1 */
export function getPxbSelectionUrl(): string {
  const url = new URL('/', `${getPxbBaseUrl()}/`);
  for (const [key, value] of Object.entries(PXB_SELECTION_QUERY)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}
