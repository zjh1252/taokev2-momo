'use client';

import { useMemo } from 'react';
import { LayoutGrid } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { CategoryTreeNode } from '@/features/course/api/types';
import { buildCategoryMenuRows } from '../utils/buildCategoryMenu';
import { filtersToHtmPath } from '@/features/trainer/utils/url';

interface HeroSectionProps {
  categories: CategoryTreeNode[];
}

/**
 * 首页 Hero — 左侧「全部分类」行级导航（点击直达专家列表筛选）+ 右侧轮播
 */
export function HeroSection({ categories }: HeroSectionProps) {
  const t = useTranslations('home');

  const menuRows = useMemo(() => buildCategoryMenuRows(categories), [categories]);
  const heroTitle = t('hero.title');

  return (
    <section className="grid grid-cols-12 gap-6 h-[480px]">
      {/* 分类侧栏 */}
      <div className="col-span-3">
        <aside className="bg-white rounded-lg shadow-sm flex flex-col border border-slate-100 h-full">
          <div className="flex items-center px-5 py-3 bg-primary/5 text-primary font-bold border-l-4 border-primary shrink-0">
            <LayoutGrid className="size-5 mr-2 shrink-0" />
            <h2 className="text-[15px]">{t('hero.allCategories')}</h2>
          </div>

          <nav className="flex-1 overflow-y-auto py-1 flex flex-col justify-evenly">
            {menuRows.map((row) => (
              <div
                key={row.rowIndex}
                className="mx-1 flex items-center justify-start gap-x-6 px-4 py-2 text-[14px]"
              >
                {row.items.map((item) => (
                  <Link
                    key={item.id}
                    href={filtersToHtmPath({ field: item.fullName })}
                    className="whitespace-nowrap text-left text-slate-800 hover:bg-primary hover:text-white rounded-sm px-2 py-1 transition-colors"
                  >
                    {item.shortLabel}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </aside>
      </div>

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
            {heroTitle}
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
        <div className="absolute bottom-6 right-12 flex gap-2">
          <div className="w-8 h-1 bg-primary rounded-full" />
          <div className="w-8 h-1 bg-white/30 rounded-full" />
          <div className="w-8 h-1 bg-white/30 rounded-full" />
        </div>
      </div>
    </section>
  );
}
