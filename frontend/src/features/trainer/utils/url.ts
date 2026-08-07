/**
 * 专家列表页 SEO URL 工具 — .htm 路径 ↔ 筛选参数双向转换
 *
 * <p>URL 格式（无筛选时直接 /trainer）：</p>
 * <pre>
 * /trainer/field=战略规划&industry=软件.htm
 * /trainer/field=经营战略_战略规划&industry=软件.htm  （二级名跨一级重名时）
 * /trainer/field=经营战略&industry=软件&region=上海.htm
 * </pre>
 *
 * <p>规则：</p>
 * <ul>
 *   <li>参数间用 {@code &} 分隔，每个参数格式为 {@code key=value}。</li>
 *   <li>{@code field}（擅长领域）：选中二级且名唯一时为 {@code 二级}；
 *       二级重名时为 {@code 一级_二级}；选中一级时为 {@code 一级}。</li>
 *   <li>{@code industry}（擅长行业）：单值。</li>
 *   <li>{@code region}（长驻省市）：单值。</li>
 *   <li>三个参数均非必传，至少有 1 个参数时才出现 .htm 后缀。</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-06-05 16:00
 */

export interface TrainerSlugParams {
  /** 擅长领域 — 二级名 / "一级_二级" / "一级" */
  field?: string;
  /** 擅长行业 — 单值，传给后端 industry 参数 */
  industry?: string;
  /** 长驻省市 — 单值，传给后端 region 参数 */
  region?: string;
  /** 页码 — 仅 > 1 时写入 URL */
  page?: number;
}

const PARAM_KEYS = ['field', 'industry', 'region'] as const;

/**
 * 将筛选条件转为 .htm URL 路径段（不含 /trainer 前缀）。
 * @returns 如 "field=战略规划&industry=软件.htm"，无参数时返回 "/trainer"
 */
export function filtersToHtmPath(params: TrainerSlugParams): string {
  const parts: string[] = [];

  for (const key of PARAM_KEYS) {
    const val = params[key];
    if (val && val.length > 0) {
      parts.push(`${key}=${encodeURIComponent(val)}`);
    }
  }

  if (params.page && params.page > 1) {
    parts.push(`page=${params.page}`);
  }

  return parts.length > 0 ? `/trainer/${parts.join('&')}.htm` : '/trainer';
}

/**
 * 从浏览器 pathname 解析专家列表筛选参数。
 * 兼容 `/trainer`、`/trainer/field=xxx.htm`、以及带 locale 前缀的路径。
 */
export function parseTrainerListPathname(pathname: string): TrainerSlugParams {
  if (!pathname) return {};
  const normalized = pathname.replace(/^\/(zh-CN|en)(?=\/)/, '');
  if (normalized === '/trainer' || normalized.startsWith('/trainer?')) return {};
  const match = normalized.match(/^\/trainer\/(.+?)\.htm\/?$/);
  if (!match) return {};
  let slug = match[1];
  try {
    // pathname 可能已解码；若仍含 %XX 则再解一次
    if (/%[0-9A-Fa-f]{2}/.test(slug)) {
      slug = decodeURIComponent(slug);
    }
  } catch {
    // keep raw
  }
  return parseSlug(slug);
}

/**
 * 解析 .htm URL 的 slug 段。
 * @example
 *   parseSlug('field=战略规划&industry=软件') → { field: '战略规划', industry: '软件' }
 *   parseSlug('field=经营战略&region=上海')   → { field: '经营战略', region: '上海' }
 */
export function parseSlug(slug: string): TrainerSlugParams {
  const params: TrainerSlugParams = {};
  if (!slug) return params;

  // 去掉可能残留在 slug 尾部的 .htm 后缀（rewrite 可能带入）
  slug = slug.replace(/\.htm$/, '');

  // 按 & 拆分为多个 key_value 对
  const pairs = slug.split('&');
  for (const pair of pairs) {
    if (!pair) continue;

    // 按第一个 = 拆分为 key 和 value（field 值内部使用 _ 表示层级，不受影响）
    const idx = pair.indexOf('=');
    if (idx === -1) continue;

    const key = pair.slice(0, idx);
    const rawValue = pair.slice(idx + 1);

    if (!rawValue) continue;

    // 安全解码：浏览器可能已解码，也可能未解码
    let value = rawValue;
    try {
      value = decodeURIComponent(rawValue);
    } catch {
      // 已经是解码后的值，直接使用
    }

    switch (key) {
      case 'field':
        params.field = value;
        break;
      case 'industry':
        params.industry = value;
        break;
      case 'region':
        params.region = value;
        break;
      case 'page': {
        const n = Number.parseInt(value, 10);
        if (Number.isFinite(n) && n > 0) params.page = n;
        break;
      }
    }
  }

  return params;
}

/**
 * @deprecated 请优先使用 splitFieldForFilter（需分类树）；本函数仅按 `_` 机械拆分。
 */
export function splitFieldValue(value?: string): string[] {
  if (!value) return [];
  return value.split('_').filter(Boolean);
}

export { canonicalizeTrainerSlugField, joinFieldValue } from './expertise-categories';
