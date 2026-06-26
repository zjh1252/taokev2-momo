/** 解析逗号/顿号/空白分隔的标签字符串，去重并保持顺序 */
export function parseDelimitedTags(value?: string | null): string[] {
  if (!value) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of value.split(/[,，、\s]+/)) {
    const tag = part.trim();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    result.push(tag);
  }
  return result;
}

/** 标签数组去重，保持顺序 */
export function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    const trimmed = tag.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}
