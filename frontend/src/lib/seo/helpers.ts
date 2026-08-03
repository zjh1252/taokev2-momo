import type { Metadata } from 'next';
import { buildCanonicalUrl } from './canonical';

/** 剥离 HTML 并压缩空白 */
export function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * 富文本是否为空（与后端 CourseServiceImpl#isBlankHtml 规则对齐）。
 * 含仅空段落、&nbsp;、零宽空格等视为未填写。
 */
export function isBlankHtml(html?: string | null): boolean {
  if (!html || !html.trim()) return true;
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/\u200B/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length === 0;
}

/**
 * 将描述截断到 SEO 规范区间（默认 80-120 字）。
 * 不足 80 字时原样返回；超出 120 字时截断并加省略号。
 */
export function truncateDescription(text: string, max = 120): string {
  const plain = stripHtml(text);
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max - 1)}…`;
}

/** 拼接关键词，过滤空值 */
export function joinKeywords(...parts: (string | undefined | null)[]): string {
  return parts
    .flatMap((p) => (p ? p.split(/[,，、]/).map((s) => s.trim()) : []))
    .filter(Boolean)
    .join(', ');
}

/** 从专家列表 slug 的 field 值提取展示用领域词（优先二级分类） */
export function parseFieldLabel(field?: string): string | undefined {
  if (!field) return undefined;
  const parts = field.split('_').filter(Boolean);
  return parts[parts.length - 1];
}

/** 拼接筛选维度前缀，如「上海软件领导力」 */
export function joinFilterPrefix(ctx: {
  city?: string;
  industry?: string;
  field?: string;
}): string {
  const fieldLabel = parseFieldLabel(ctx.field) ?? ctx.field;
  return [ctx.city, ctx.industry, fieldLabel].filter(Boolean).join('');
}

export interface SeoFields {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  canonicalParams?: URLSearchParams;
  canonicalQueryKeys?: string[];
}

/** 转为 Next.js Metadata */
export function toMetadata({
  title,
  description,
  keywords,
  canonical,
  canonicalParams,
  canonicalQueryKeys,
}: SeoFields): Metadata {
  return {
    title,
    description: truncateDescription(description),
    ...(keywords ? { keywords } : {}),
    ...(canonical
      ? {
          alternates: {
            canonical: buildCanonicalUrl(canonical, canonicalParams, canonicalQueryKeys),
          },
        }
      : {}),
  };
}
