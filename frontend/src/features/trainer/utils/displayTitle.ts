/** 人名后短头衔：过滤 biography / 营销长段落误填 */
export function isDisplayTitle(title: string | undefined, name: string): title is string {
  const t = title?.trim();
  if (!t || t.length > 48) return false;
  if (t.startsWith(name) || t.includes(`${name}老师`)) return false;
  if (/合作价值|曾先后|针对企业|定制化开发|善于针对/.test(t)) return false;
  return true;
}

export function pickDisplayTitle(title: string | undefined, name: string): string | undefined {
  return isDisplayTitle(title, name) ? title.trim() : undefined;
}
