'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CustomerServiceChatDialog } from '@/components/customer-service-chat-dialog';
import type { CategoryTreeNode } from '@/features/course/api/types';
import type { HomeBanner } from '@/features/home/types';
import { filtersToHtmPath } from '@/features/trainer/utils/url';
import { Link } from '@/i18n/navigation';
import { buildCategoryMenuRows } from '../utils/buildCategoryMenu';

interface HeroSectionProps {
  categories: CategoryTreeNode[];
  banners: HomeBanner[];
}

const DEFAULT_BANNER: HomeBanner = {
  id: 'default-2026',
  imageUrl: '/statics/images/hero-banner.jpg',
  tagline: '淘课网 2026 年度专题',
  title: '找得到、信得过、价更优、+AI',
  description: '汇聚全球 5000+ 顶尖商学院专家，为您的企业量身定制成长路径',
  ctaLabel: '立即咨询',
  secondaryLabel: '查看专题'
};

export function HeroSection({ categories, banners }: HeroSectionProps) {
  const t = useTranslations('home');
  const [activeIndex, setActiveIndex] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const menuRows = useMemo(() => buildCategoryMenuRows(categories), [categories]);
  const slides = banners.length > 0 ? banners : [DEFAULT_BANNER];
  const activeBanner = slides[activeIndex] ?? slides[0];

  const showPrev = () => {
    setActiveIndex((index) => (index - 1 + slides.length) % slides.length);
  };

  const showNext = () => {
    setActiveIndex((index) => (index + 1) % slides.length);
  };

  return (
    <section className="grid grid-cols-12 gap-6 h-[480px]">
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

      <div className="col-span-9 relative rounded-lg overflow-hidden shadow-sm bg-slate-900 group">
        <Image
          src={activeBanner.imageUrl}
          alt={activeBanner.title}
          fill
          sizes="(max-width: 768px) 100vw, 75vw"
          className="object-cover opacity-70"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent flex flex-col justify-center px-12">
          <span className="text-white/80 font-bold tracking-widest mb-4">
            {activeBanner.tagline}
          </span>
          <h1 className="text-white text-5xl font-black leading-tight mb-6">
            {activeBanner.title}
          </h1>
          <p className="text-white/85 text-lg max-w-md mb-8">
            {activeBanner.description}
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg"
            >
              {activeBanner.ctaLabel}
            </button>
            <Link
              href={filtersToHtmPath({ field: 'MBA/总裁班' })}
              className="bg-white/20 backdrop-blur-md text-white border border-white/30 px-8 py-3 rounded-full font-bold hover:bg-white/30 transition-all"
            >
              {activeBanner.secondaryLabel}
            </Link>
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              aria-label="上一张"
              onClick={showPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 grid size-10 place-items-center rounded-full bg-black/30 text-white backdrop-blur hover:bg-black/45 transition-colors"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="下一张"
              onClick={showNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 grid size-10 place-items-center rounded-full bg-black/30 text-white backdrop-blur hover:bg-black/45 transition-colors"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        <div className="absolute bottom-6 right-12 flex gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`切换到第 ${index + 1} 张`}
              onClick={() => setActiveIndex(index)}
              className={`h-1 rounded-full transition-all ${
                index === activeIndex ? 'w-8 bg-primary' : 'w-8 bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      <CustomerServiceChatDialog open={chatOpen} onOpenChange={setChatOpen} />
    </section>
  );
}
