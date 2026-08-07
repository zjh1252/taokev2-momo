import type { Metadata } from 'next';
import { buildCanonicalUrl } from './canonical';

/** SEO description 中文长度下限（阻断验收） */
export const SEO_DESCRIPTION_MIN = 60;
/** SEO description 中文长度上限（阻断验收） */
export const SEO_DESCRIPTION_MAX = 85;

/** 空字段 / 过短文案时的友好兜底（须 ≥60 字，禁止输出空 description） */
export const SEO_DESCRIPTION_FALLBACK =
  '淘课网提供企业培训课程、讲师和机构信息，帮助企业快速筛选适合的培训资源，一站式解决企业人才培养与采购需求，查找实战企业管理培训。';

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
 * 将描述截断到 SEO 上限（默认 85 字）。
 * 超出时截断并加省略号。
 */
export function truncateDescription(
  text: string,
  max = SEO_DESCRIPTION_MAX,
): string {
  const plain = stripHtml(text);
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max - 1)}…`;
}

/**
 * 规范化 description：禁止空值，控制在 60–85 字。
 * 不足 60 字时追加友好兜底后再截断。
 */
export function normalizeSeoDescription(text?: string | null): string {
  let plain = stripHtml(text ?? '').trim();
  if (!plain) {
    plain = SEO_DESCRIPTION_FALLBACK;
  }
  if (plain.length < SEO_DESCRIPTION_MIN) {
    const joiner = plain.endsWith('。') || plain.endsWith('.') ? '' : '。';
    plain = `${plain}${joiner}${SEO_DESCRIPTION_FALLBACK}`;
  }
  return truncateDescription(plain, SEO_DESCRIPTION_MAX);
}

/**
 * 后台自定义 SEO 描述优先，否则使用模板；最终走 60–85 字规范化。
 */
export function preferSeoDescription(
  custom?: string | null,
  template = SEO_DESCRIPTION_FALLBACK,
): string {
  const text = custom?.trim() || template.trim() || SEO_DESCRIPTION_FALLBACK;
  return normalizeSeoDescription(text);
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
    description: normalizeSeoDescription(description),
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
