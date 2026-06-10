/** 从 URL 查询参数解析列表页码（默认 1），服务端/客户端均可使用 */
export function parseListPageFromSearchParams(
  searchParams: Pick<URLSearchParams, 'get'>,
): number {
  const raw = searchParams.get('page');
  if (!raw) return 1;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}
