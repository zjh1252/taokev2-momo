import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { MapPin, ArrowRight, Check, Sparkles } from 'lucide-react';
import type { ActiveCityItem } from '../api/types';
import { getCityLandmarkSrc } from '../lib/city-landmarks';
import { cityChannelPath } from '../lib/paths';

interface CityChannelCardProps {
  /** 来自 GET /cities/active 的列表，最多展示 18 个 */
  cities: ActiveCityItem[];
}

/**
 * 首页城市频道入口 — 地标插画 + 6 列卡片网格
 *
 * @author Fangxinxin
 * @date 2026-06-23 10:00
 */
export function CityChannelCard({ cities }: CityChannelCardProps) {
  const display = cities.slice(0, 18);

  return (
    <section className="rounded-2xl border border-slate-100 bg-[#f8fafc] p-6 md:p-8 shadow-sm">
      {/* 标题区 */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">城市频道</h2>
            <p className="mt-1 text-sm text-slate-500">
              热门城市培训资源一览，快速发现本地公开课
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
          <Sparkles className="size-3.5" />
          本地培训资源
        </span>
      </div>

      {display.length === 0 ? (
        <div className="flex min-h-[160px] items-center justify-center text-sm text-slate-400">
          暂无开课城市
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {display.map((city) => (
            <CityCard key={city.enName} city={city} />
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <Link
          href="/opencourses"
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-white px-8 py-2.5 text-sm font-medium text-primary shadow-sm transition-colors hover:border-primary hover:bg-primary/5"
        >
          查看全部城市公开课
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

function CityCard({ city }: { city: ActiveCityItem }) {
  const landmarkSrc = getCityLandmarkSrc(city.enName);

  return (
    <Link
      href={cityChannelPath(city.enName)}
      className="group relative flex items-center gap-2 overflow-hidden rounded-xl border border-transparent bg-white p-2 shadow-sm transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md"
    >
      {/* 选中态角标（hover 时显示） */}
      <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary opacity-0 transition-opacity group-hover:opacity-100">
        <Check className="size-2.5 text-white" strokeWidth={3} />
      </span>

      {/* 地标插画 */}
      <div className="relative h-14 w-[52px] shrink-0 overflow-hidden rounded-lg">
        <Image
          src={landmarkSrc}
          alt={`${city.cityName}地标`}
          fill
          sizes="52px"
          className="object-cover object-center"
        />
      </div>

      {/* 城市信息 */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800 transition-colors group-hover:text-primary">
          {city.cityName}
        </p>
        <span className="mt-0.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
          {city.courseCount}门课
        </span>
      </div>
    </Link>
  );
}
