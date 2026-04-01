import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { HeroCategory } from '../types';

interface HeroSectionProps {
  categories: HeroCategory[];
}

/**
 * 首页 Hero 区域 — 左侧分类侧栏 + 右侧轮播背景图
 */
export function HeroSection({ categories }: HeroSectionProps) {
  const t = useTranslations('home');

  const titleParts = t('hero.title').split('\n');

  return (
    <section className="grid grid-cols-12 gap-6 h-[480px]">
      {/* 分类侧栏 */}
      <aside className="col-span-3 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col py-4 border border-slate-100">
        <div className="flex items-center px-6 py-3 bg-primary/5 text-primary font-bold border-l-4 border-primary mb-2">
          <span className="text-[15px]">{t('hero.allCategories')}</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 space-y-1">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 rounded-lg transition-all"
            >
              <span className="text-[15px] font-medium text-slate-800">
                {cat.name}
              </span>
              <ChevronRight className="size-4 opacity-30 group-hover:opacity-100 text-primary transition-opacity" />
            </Link>
          ))}
        </nav>
      </aside>

      {/* 主视觉区域 */}
      <div className="col-span-9 relative rounded-lg overflow-hidden shadow-sm bg-slate-900 group">
        <Image
          src="/statics/images/hero-banner.jpg"
          alt="Hero Banner"
          fill
          className="object-cover opacity-70"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center px-12">
          <span className="text-white/80 font-bold tracking-widest mb-4">
            {t('hero.tagline')}
          </span>
          <h1 className="text-white text-5xl font-black leading-tight mb-6">
            {titleParts.map((part, i) => (
              <span key={i}>
                {part}
                {i < titleParts.length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="text-white/80 text-lg max-w-md mb-8">
            {t('hero.description')}
          </p>
          <div className="flex gap-4">
            <Link
              href="/contact"
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg"
            >
              {t('hero.cta')}
            </Link>
            <Link
              href="/features"
              className="bg-white/20 backdrop-blur-md text-white border border-white/30 px-8 py-3 rounded-full font-bold hover:bg-white/30 transition-all"
            >
              {t('hero.ctaSecondary')}
            </Link>
          </div>
        </div>
        {/* 轮播指示器占位 */}
        <div className="absolute bottom-6 right-12 flex gap-2">
          <div className="w-8 h-1 bg-primary rounded-full" />
          <div className="w-8 h-1 bg-white/30 rounded-full" />
          <div className="w-8 h-1 bg-white/30 rounded-full" />
        </div>
      </div>
    </section>
  );
}
