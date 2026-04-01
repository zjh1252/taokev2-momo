import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { HeroCategory } from '../types';

interface HeroSectionProps {
  categories: HeroCategory[];
}

export function HeroSection({ categories }: HeroSectionProps) {
  const t = useTranslations('home');

  const titleParts = t('hero.title').split('\n');

  return (
    <section className="grid grid-cols-12 gap-6 h-[480px]">
      {/* 分类侧栏 */}
      <aside className="col-span-3 bg-card rounded-lg border border-border overflow-hidden flex flex-col">
        <div className="bg-primary text-primary-foreground px-5 py-3 font-bold text-base">
          {t('hero.allCategories')}
        </div>
        <nav className="flex-1 overflow-y-auto">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="flex items-center justify-between px-5 py-3 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <span>{cat.name}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </nav>
      </aside>

      {/* 主视觉区域 */}
      <div className="col-span-9 relative rounded-lg overflow-hidden bg-gradient-to-br from-primary/90 to-primary/60">
        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 flex flex-col justify-end h-full p-10">
          <span className="text-primary-foreground/80 text-sm font-medium mb-2">
            {t('hero.tagline')}
          </span>

          <h1 className="text-4xl md:text-5xl font-black text-primary-foreground leading-tight mb-4">
            {titleParts.map((part, i) => (
              <span key={i}>
                {part}
                {i < titleParts.length - 1 && <br />}
              </span>
            ))}
          </h1>

          <p className="text-primary-foreground/80 text-base max-w-lg mb-8">
            {t('hero.description')}
          </p>

          <div className="flex items-center gap-4">
            <Link
              href="/contact"
              className="bg-white text-primary font-bold px-8 py-3 rounded-lg hover:bg-white/90 transition-colors"
            >
              {t('hero.cta')}
            </Link>
            <Link
              href="/features"
              className="border border-white/40 text-primary-foreground font-bold px-8 py-3 rounded-lg hover:bg-white/10 transition-colors"
            >
              {t('hero.ctaSecondary')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
