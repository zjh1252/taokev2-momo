import { type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface SectionHeaderProps {
  title: string;
  viewMoreHref?: string;
  viewMoreText?: string;
  icon?: ReactNode;
}

export function SectionHeader({
  title,
  viewMoreHref,
  viewMoreText,
  icon,
}: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-8 border-l-4 border-primary pl-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-2xl font-black text-foreground">{title}</h2>
      </div>

      {viewMoreHref && viewMoreText && (
        <Link
          href={viewMoreHref}
          className="text-primary font-bold flex items-center gap-1 hover:underline text-sm"
        >
          {viewMoreText}
          <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
