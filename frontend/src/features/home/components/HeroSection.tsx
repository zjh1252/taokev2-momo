'use client';

import { useState, useRef, useCallback } from 'react';
import { ChevronRight, LayoutGrid } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { CategoryTreeNode } from '@/features/course/api/types';

interface HeroSectionProps {
  categories: CategoryTreeNode[];
}

/**
 * 首页 Hero 区域 — 左侧分类侧栏（hover 弹出子分类）+ 右侧轮播背景图
 */
export function HeroSection({ categories }: HeroSectionProps) {
  const t = useTranslations('home');
  const [activeCatId, setActiveCatId] = useState<number | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>();

  const titleParts = t('hero.title').split('\n');

  const handleMouseEnter = useCallback((id: number) => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = undefined;
    }
    setActiveCatId(id);
  }, []);

  const handleMouseLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => {
      setActiveCatId(null);
    }, 80);
  }, []);

  const activeCat = categories.find((c) => c.id === activeCatId);

  return (
    <section className="grid grid-cols-12 gap-6 h-[480px]">
      {/* 分类侧栏 */}
      <div
        className="col-span-3 relative"
        onMouseLeave={handleMouseLeave}
      >
        <aside className="bg-white rounded-lg shadow-sm overflow-visible flex flex-col py-4 border border-slate-100 h-full">
          <div className="flex items-center px-6 py-3 bg-primary/5 text-primary font-bold border-l-4 border-primary mb-2">
            <LayoutGrid className="size-5 mr-2" />
            <span className="text-[15px]">{t('hero.allCategories')}</span>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 space-y-1">
            {categories.slice(0, 8).map((cat) => (
              <div
                key={cat.id}
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
                  activeCatId === cat.id ? 'bg-slate-50' : 'hover:bg-slate-50'
                }`}
                onMouseEnter={() => handleMouseEnter(cat.id)}
              >
                <span className="text-[15px] font-medium text-slate-800">
                  {cat.name}
                </span>
                <ChevronRight
                  className={`size-4 transition-all ${
                    activeCatId === cat.id
                      ? 'opacity-100 text-primary'
                      : 'opacity-30 text-primary'
                  }`}
                />
              </div>
            ))}
          </nav>
        </aside>

        {/* 子分类浮层 */}
        {activeCat && activeCat.children && activeCat.children.length > 0 && (
          <div
            className="absolute left-full top-0 min-h-full pl-2 z-50"
            onMouseEnter={() => {
              if (leaveTimer.current) {
                clearTimeout(leaveTimer.current);
                leaveTimer.current = undefined;
              }
            }}
          >
            <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-6 w-[420px]">
              <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                {activeCat.name}
              </h4>
              <div className="grid grid-cols-3 gap-x-4 gap-y-3 text-sm">
                {activeCat.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/trainers?expertiseId=${child.id}`}
                    className="text-slate-600 hover:text-primary transition-colors truncate"
                    title={child.name}
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
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
        <div className="absolute bottom-6 right-12 flex gap-2">
          <div className="w-8 h-1 bg-primary rounded-full" />
          <div className="w-8 h-1 bg-white/30 rounded-full" />
          <div className="w-8 h-1 bg-white/30 rounded-full" />
        </div>
      </div>
    </section>
  );
}
