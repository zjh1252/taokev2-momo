'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { LayoutGrid } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { CategoryTreeNode } from '@/features/course/api/types';
import { buildCategoryMenuRows } from '../utils/buildCategoryMenu';

interface HeroSectionProps {
  categories: CategoryTreeNode[];
}

/**
 * 首页 Hero — 左侧「全部分类」行级导航（hover 展开二级菜单）+ 右侧轮播
 */
export function HeroSection({ categories }: HeroSectionProps) {
  const t = useTranslations('home');
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const menuRows = useMemo(() => buildCategoryMenuRows(categories), [categories]);
  const titleParts = t('hero.title').split('\n');

  const activeRow =
    activeRowIndex !== null
      ? menuRows.find((r) => r.rowIndex === activeRowIndex)
      : undefined;

  const handleMouseEnter = useCallback((rowIndex: number) => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    setActiveRowIndex(rowIndex);
  }, []);

  const handleMouseLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => {
      setActiveRowIndex(null);
    }, 100);
  }, []);

  const cancelLeave = useCallback(() => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  }, []);

  return (
    <section className="grid grid-cols-12 gap-6 h-[480px]">
      {/* 分类侧栏 */}
      <div className="col-span-3 relative" onMouseLeave={handleMouseLeave}>
        <aside className="bg-white rounded-lg shadow-sm overflow-visible flex flex-col border border-slate-100 h-full">
          <div className="flex items-center px-5 py-3 bg-primary/5 text-primary font-bold border-l-4 border-primary shrink-0">
            <LayoutGrid className="size-5 mr-2 shrink-0" />
            <span className="text-[15px]">{t('hero.allCategories')}</span>
          </div>

          <nav className="flex-1 overflow-y-auto py-1 flex flex-col justify-evenly">
            {menuRows.map((row) => {
              const isActive = activeRowIndex === row.rowIndex;

              return (
                <div
                  key={row.rowIndex}
                  className={`mx-1 flex items-center justify-start gap-x-6 px-4 py-2 cursor-pointer transition-colors text-[14px] ${
                    isActive
                      ? 'bg-primary text-white rounded-sm'
                      : 'text-slate-800 hover:bg-primary hover:text-white rounded-sm'
                  }`}
                  onMouseEnter={() => handleMouseEnter(row.rowIndex)}
                >
                  {row.items.map((item) => (
                    <span key={item.id} className="whitespace-nowrap text-left">
                      {item.shortLabel}
                    </span>
                  ))}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* 二级菜单浮层 */}
        {activeRow && activeRow.items.length > 0 && (
          <div
            className="absolute left-full top-0 min-h-full pl-1 z-50"
            onMouseEnter={cancelLeave}
          >
            <div className="bg-white rounded-sm shadow-lg border border-slate-200 min-h-full w-[min(720px,calc(100vw-280px))] max-h-[480px] overflow-y-auto">
              {/* 行标题：一级分类全名 */}
              <div className="px-5 py-3 border-b border-slate-100 text-[15px] font-bold text-slate-900 tracking-wide">
                {activeRow.items.map((i) => i.fullName).join('  ')}
              </div>

              {/* 各一级分类下的二级子类 */}
              <div className="py-2">
                {activeRow.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex gap-4 px-5 py-3 ${
                      idx < activeRow.items.length - 1
                        ? 'border-b border-slate-100'
                        : ''
                    }`}
                  >
                    <div className="w-[88px] shrink-0 pt-0.5">
                      <Link
                        href={`/trainers?expertiseId=${item.id}`}
                        className="text-[14px] font-bold text-primary hover:underline whitespace-nowrap"
                      >
                        {item.fullName}
                      </Link>
                    </div>
                    {item.children.length > 0 ? (
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 text-[13px]">
                        {item.children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/trainers?expertiseId=${child.id}`}
                            className="text-slate-700 hover:text-primary transition-colors truncate"
                            title={child.name}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="flex-1 text-[13px] text-slate-400">暂无子分类</div>
                    )}
                  </div>
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
