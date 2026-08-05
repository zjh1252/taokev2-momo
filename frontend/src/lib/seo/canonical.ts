import { siteConfig } from '@/config/site';

export type CanonicalSearchParamsInput = Record<
  string,
  string | string[] | undefined
>;

export function buildCanonicalUrl(
  inputPath: string,
  params?: URLSearchParams,
  allowedQueryKeys: string[] = [],
): string {
  const base = new URL(siteConfig.url);
  const source = new URL(inputPath || '/', base);
  const canonical = new URL(source.pathname || '/', base);

  if (params && allowedQueryKeys.length > 0) {
    const allowed = new Set(allowedQueryKeys);
    const keys = Array.from(new Set(Array.from(params.keys())))
      .filter((key) => allowed.has(key))
      .sort();
    keys.forEach((key) => {
      const values = params.getAll(key).filter(Boolean);
      values.forEach((value) => {
        if (key === 'page' && value === '1') return;
        canonical.searchParams.append(key, value);
      });
    });
  }

  return canonical.toString().replace(/\/$/, canonical.pathname === '/' ? '/' : '');
}

export function pickCanonicalSearchParams(
  source: CanonicalSearchParamsInput,
  allowedKeys: string[],
): URLSearchParams {
  const allowed = new Set(allowedKeys);
  const params = new URLSearchParams();
  Object.entries(source)
    .filter(([key]) => allowed.has(key))
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.filter(Boolean).forEach((item) => params.append(key, item));
      } else if (value) {
        params.append(key, value);
      }
    });
  return params;
}
