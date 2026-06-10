/** searchParams 里可能是 string 或 string[]，归一化为 number[] */
export function normalizeNumberIds(raw: string | string[] | undefined): number[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n > 0);
}

/** searchParams 里可能是 string 或 string[]，归一化为 string[] */
export function normalizeStringValues(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

export function firstStringValue(raw: string | string[] | undefined): string | undefined {
  const values = normalizeStringValues(raw);
  return values[0];
}
