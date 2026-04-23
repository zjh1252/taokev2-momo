/**
 * 后台静态资源 URL 解析工具。
 *
 * <p>背景：后端上传文件物理写入 C 端 Next.js 的 {@code public/uploads}，
 * 数据库中保存的 URL 一般为相对路径（例如 {@code /uploads/images/xxx.png}），
 * 由 C 端站点（默认 {@code http://localhost:3000}）直接对外提供访问。</p>
 *
 * <p>后台站点（默认 {@code http://localhost:3001}）自身没有这些文件，
 * 因此对相对路径的图片/附件 URL 需要补成绝对地址，指向 C 端站点。</p>
 *
 * <p>每个环境必须通过 {@code NEXT_PUBLIC_FRONTEND_BASE_URL} 显式配置 C 端域名
 *（dev 例如 {@code http://localhost:3000}，生产例如 {@code https://www.taoke.com}）。
 * 未配置时不会编造默认值，相对路径会原样返回，浏览器请求会落到当前后台域名上。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-16 23:30
 */

/** C 端前台站点 BaseURL — 用于解析后端返回的相对资源路径 */
const FRONTEND_BASE_URL = (process.env.NEXT_PUBLIC_FRONTEND_BASE_URL ?? '').replace(
  /\/+$/,
  '',
);

/**
 * 把后端返回的资源 URL 解析为可在浏览器中直接访问的绝对地址。
 *
 * <ul>
 *   <li>空值 → 原样返回</li>
 *   <li>已是 {@code http(s)://} 或 {@code data:} / {@code blob:} → 原样返回</li>
 *   <li>{@code //example.com/x} → 加上当前协议</li>
 *   <li>其他（一般为 {@code /uploads/...}） → 拼上 C 端 BaseURL</li>
 * </ul>
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
  // 未配置 NEXT_PUBLIC_FRONTEND_BASE_URL 时，原样返回相对路径（避免拼出错误的绝对地址）
  if (!FRONTEND_BASE_URL) return path;
  return `${FRONTEND_BASE_URL}${path}`;
}
