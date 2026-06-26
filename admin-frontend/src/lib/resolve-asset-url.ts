/**
 * 后台静态资源 URL 解析工具。
 *
 * <p>背景：后端上传文件物理写入 C 端 Next.js 的 {@code public/uploads}，
 * 数据库中保存的 URL 一般为相对路径（例如 {@code /uploads/images/xxx.png}），
 * 由 C 端站点（默认 {@code http://localhost:3000}）直接对外提供访问。</p>
 *
 * <p>老站迁移数据常见 {@code /attachments/}、{@code /u/} 等路径，需指向旧站域名。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-16 23:30
 */

/** C 端前台站点 BaseURL — 用于解析后端返回的相对资源路径 */
const FRONTEND_BASE_URL = (
  process.env.NEXT_PUBLIC_FRONTEND_BASE_URL ??
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '')
).replace(/\/+$/, '');

/** 老站静态资源域名（资质证明等 attachments 路径） */
const LEGACY_ASSET_BASE = (
  process.env.NEXT_PUBLIC_LEGACY_ASSET_BASE_URL ?? 'https://www.taoke.com'
).replace(/\/+$/, '');

function joinBase(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\.\//, '').replace(/^\//, '')}`;
}

/** 老站 attachments / u 路径 → 绝对 URL */
function resolveLegacyAssetPath(path: string): string | null {
  if (path.startsWith('/attachments/') || path.startsWith('/u/')) {
    return joinBase(LEGACY_ASSET_BASE, path);
  }
  if (path.startsWith('attachments/') || path.startsWith('u/')) {
    return joinBase(LEGACY_ASSET_BASE, path);
  }
  return null;
}

/**
 * 把后端返回的资源 URL 解析为可在浏览器中直接访问的绝对地址。
 */
export function resolveAssetUrl(
  url: string | null | undefined,
): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  const legacy = resolveLegacyAssetPath(path.startsWith('/') ? path : trimmed);
  if (legacy) return legacy;

  if (!FRONTEND_BASE_URL) return path;
  return `${FRONTEND_BASE_URL}${path}`;
}

/** 是否像可展示的图片资源 URL（过滤纯数字等脏数据） */
export function isLikelyImageAssetUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const trimmed = url.trim();
  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    return (
      /\/uploads\//i.test(trimmed)
      || /\/statics\//i.test(trimmed)
      || /\/attachments\//i.test(trimmed)
      || /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(trimmed)
    );
  }
  return (
    trimmed.startsWith('/uploads/')
    || trimmed.startsWith('uploads/')
    || trimmed.startsWith('/statics/')
    || trimmed.startsWith('statics/')
    || /\/attachments\//i.test(trimmed)
    || /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(trimmed)
  );
}
