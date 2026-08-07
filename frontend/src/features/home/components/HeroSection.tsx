'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CustomerServiceChatDialog } from '@/components/customer-service-chat-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { CategoryTreeNode } from '@/features/course/api/types';
import { HOME_BANNER_DEFAULTS, DEFAULT_TOPIC_BUTTON_LINK } from '@/features/home/constants/banner-defaults';
import type { HomeBanner } from '@/features/home/types';
import { filtersToHtmPath } from '@/features/trainer/utils/url';
import { Link } from '@/i18n/navigation';
import { buildCategoryMenuRows } from '../utils/buildCategoryMenu';

interface HeroSectionProps {
  categories: CategoryTreeNode[];
  banners: HomeBanner[];
}

const AUTOPLAY_INTERVAL_MS = 5000;

const DEFAULT_BANNER: HomeBanner = {
  id: 'default-2026',
  imageUrl: HOME_BANNER_DEFAULTS[0].coverUrl,
  consultButtonImageUrl: HOME_BANNER_DEFAULTS[0].consultButtonImageUrl,
  topicButtonImageUrl: HOME_BANNER_DEFAULTS[0].topicButtonImageUrl,
  topicButtonLinkUrl: DEFAULT_TOPIC_BUTTON_LINK
};

const TOPIC_BUTTON_CLASS =
  'relative block h-12 w-[128px] cursor-pointer transition-all duration-200 hover:scale-110 hover:brightness-110 hover:drop-shadow-lg active:scale-95 sm:h-16 sm:w-[170px]';

function isExternalLink(url: string) {
  return /^https?:\/\//i.test(url);
}

export function HeroSection({ categories, banners }: HeroSectionProps) {
  const t = useTranslations('home');
  const [activeIndex, setActiveIndex] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const menuRows = buildCategoryMenuRows(categories);
  const menuItems = menuRows.flatMap((row) => row.items);
  const slides = banners.length > 0 ? banners : [DEFAULT_BANNER];
  const activeBanner = slides[activeIndex] ?? slides[0];

  const showPrev = () => {
    setActiveIndex((index) => (index - 1 + slides.length) % slides.length);
  };

  const showNext = () => {
    setActiveIndex((index) => (index + 1) % slides.length);
  };

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, AUTOPLAY_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="flex w-full min-w-0 flex-col gap-3 overflow-x-hidden lg:grid lg:h-[480px] lg:grid-cols-12 lg:gap-6">
      {/* 移动端：顶部横向分类 + 收起式全部分类弹窗，避免 PC 侧栏常驻造成横向溢出 */}
      <div className="flex min-w-0 flex-col gap-2 lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setCategoryOpen(true)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 text-xs font-semibold text-primary"
          >
            <LayoutGrid className="size-3.5 shrink-0" />
            {t('hero.allCategories')}
          </button>
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={filtersToHtmPath({ field: item.fullName })}
                className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-100"
              >
                {item.shortLabel}
              </Link>
            ))}
          </div>
        </div>

        <Sheet open={categoryOpen} onOpenChange={setCategoryOpen}>
          <SheetContent side="bottom" className="max-h-[75vh] gap-0 rounded-t-xl p-0">
            <SheetHeader className="border-b border-slate-100 px-4 py-3">
              <SheetTitle>{t('hero.allCategories')}</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-2 overflow-y-auto p-4 text-sm">
              {menuItems.map((item) => (
                <Link
                  key={item.id}
                  href={filtersToHtmPath({ field: item.fullName })}
                  onClick={() => setCategoryOpen(false)}
                  className="rounded-md bg-slate-50 px-3 py-2 text-slate-700 hover:bg-primary/5 hover:text-primary"
                >
                  {item.shortLabel}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden min-w-0 lg:col-span-3 lg:block">
        <aside className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
          <div className="flex shrink-0 items-center border-l-4 border-primary bg-primary/5 px-5 py-3 font-bold text-primary">
            <LayoutGrid className="mr-2 size-5 shrink-0" />
            <h2 className="text-[15px]">{t('hero.allCategories')}</h2>
          </div>

          <nav className="flex flex-1 flex-col justify-evenly overflow-y-auto py-1">
            {menuRows.map((row) => (
              <div
                key={row.rowIndex}
                className="mx-1 flex items-center justify-start gap-x-6 px-4 py-2 text-[14px]"
              >
                {row.items.map((item) => (
                  <Link
                    key={item.id}
                    href={filtersToHtmPath({ field: item.fullName })}
                    className="whitespace-nowrap rounded-sm px-2 py-1 text-left text-slate-800 transition-colors hover:bg-primary hover:text-white"
                  >
                    {item.shortLabel}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </aside>
      </div>

      <div className="relative h-[260px] min-w-0 overflow-hidden rounded-lg bg-slate-900 shadow-sm group sm:h-[360px] lg:col-span-9 lg:h-auto">
        <Image
          src={activeBanner.imageUrl}
          alt="首页轮播图"
          fill
          sizes="(max-width: 768px) 100vw, 75vw"
          className="object-cover"
          priority
        />

        <div className="absolute bottom-4 left-4 flex items-center gap-3 sm:bottom-5 sm:left-12 sm:gap-4">
          <button
            type="button"
            aria-label="立即咨询"
            onClick={() => setChatOpen(true)}
            className="relative h-12 w-[128px] cursor-pointer transition-all duration-200 hover:scale-110 hover:brightness-110 hover:drop-shadow-lg active:scale-95 sm:h-16 sm:w-[170px]"
          >
            <Image
              src={activeBanner.consultButtonImageUrl}
              alt="立即咨询"
              fill
              sizes="170px"
              className="object-fill"
            />
          </button>
          {isExternalLink(activeBanner.topicButtonLinkUrl) ? (
            <a
              href={activeBanner.topicButtonLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="查看专题"
              className={TOPIC_BUTTON_CLASS}
            >
              <Image
                src={activeBanner.topicButtonImageUrl}
                alt="查看专题"
                fill
                sizes="170px"
                className="object-fill"
              />
            </a>
          ) : (
            <Link
              href={activeBanner.topicButtonLinkUrl}
              aria-label="查看专题"
              className={TOPIC_BUTTON_CLASS}
            >
              <Image
                src={activeBanner.topicButtonImageUrl}
                alt="查看专题"
                fill
                sizes="170px"
                className="object-fill"
              />
            </Link>
          )}
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

        <div className="absolute bottom-4 right-4 flex gap-2 sm:bottom-6 sm:right-12">
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
