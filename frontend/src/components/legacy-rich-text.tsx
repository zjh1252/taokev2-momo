import { cn } from '@/lib/utils';
import { parseLegacyRichTextSections } from '@/lib/legacy-rich-text';

interface LegacyRichTextProps {
  content: string;
  className?: string;
}

/**
 * 展示老站迁移的富文本（&lt;br&gt;、简单 HTML），自动分段与去标签。
 */
export function LegacyRichText({ content, className }: LegacyRichTextProps) {
  const sections = parseLegacyRichTextSections(content);
  if (sections.length === 0) return null;

  const hasTitles = sections.some((s) => s.title);

  if (!hasTitles) {
    return (
      <div
        className={cn(
          'text-[15px] leading-7 text-slate-600 whitespace-pre-line',
          className,
        )}
      >
        {sections[0]?.body}
      </div>
    );
  }

  return (
    <div className={cn('space-y-5 text-[15px] leading-7 text-slate-600', className)}>
      {sections.map((section, index) => (
        <div key={index}>
          {section.title && (
            <h3 className="font-semibold text-slate-800 mb-2 text-[15px]">{section.title}</h3>
          )}
          {section.body && (
            <p className="whitespace-pre-line text-slate-600 leading-relaxed">{section.body}</p>
          )}
        </div>
      ))}
    </div>
  );
}
