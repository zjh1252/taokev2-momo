/** 去除 HTML 标签与常见实体，供卡片/列表纯文本展示 */
export function toPlainIntroText(text?: string | null): string {
  if (!text?.trim()) return '';
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-zA-Z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 转为纯文本简介，空则 undefined */
export function plainIntroOrUndefined(text?: string | null): string | undefined {
  const plain = toPlainIntroText(text);
  return plain || undefined;
}

/**
 * 从长文本中提取首句作为一句话简介（以 ；;。\n 为分隔）。
 * 最多返回 48 字，确保适合作为姓名旁的简短头衔展示。
 */
export function pickFirstSentence(text?: string | null): string | undefined {
  const plain = toPlainIntroText(text);
  if (!plain) return undefined;
  const first = plain.split(/[；;。\n]/)[0]?.trim();
  if (!first || first.length === 0) return undefined;
  const cleaned = first.replace(/\s+/g, ' ').trim();
  return cleaned.length > 48 ? cleaned.slice(0, 48) : cleaned;
}

/** 标签最大长度：超过此长度的字符串视为误填段落（如擅长课题文本），不作为标签展示 */
const MAX_TAG_LENGTH = 15;
/** 原始标签字符串最大总长度：超过视为误填长文本段落 */
const MAX_TAGS_RAW_LENGTH = 200;

/** 拆分逗号分隔标签字符串并过滤无效项 */
export function parseExpertiseTags(raw?: string): string[] {
  if (!raw?.trim()) return [];
  // 总长度过长说明是误填的段落文本，不提取任何标签
  if (raw.length > MAX_TAGS_RAW_LENGTH) return [];
  return raw
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t.length <= MAX_TAG_LENGTH);
}

/** 人名后短头衔：过滤 biography / 营销长段落误填 */
export function isDisplayTitle(title: string | undefined, name: string): title is string {
  const t = title?.trim();
  if (!t || t.length > 48) return false;
  if (t.startsWith(name) || t.includes(`${name}老师`)) return false;
  if (/合作价值|曾先后|针对企业|定制化开发|善于针对/.test(t)) return false;
  // 过滤仅由标点/特殊符号组成的无效数据（如 "，"、"、"、"•" 等）
  if (/^[\s\p{P}\p{S}]+$/u.test(t)) return false;
  return true;
}

export function pickDisplayTitle(title: string | undefined, name: string): string | undefined {
  const t = toPlainIntroText(title);
  return isDisplayTitle(t, name) ? t : undefined;
}

/** 推荐专家大卡副文案：与老站一致，优先一句话介绍，短头衔仅兜底 */
export function pickRecommendedTrainerSubtitle(
  title: string | undefined,
  oneLineIntro: string | undefined,
  name: string,
): string | undefined {
  return plainIntroOrUndefined(oneLineIntro) || pickDisplayTitle(title, name);
}
