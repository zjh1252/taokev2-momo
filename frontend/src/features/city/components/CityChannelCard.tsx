import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Flame,
  Map,
  MapPin,
  Send,
  ShieldCheck,
  Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ActiveCityItem } from '../api/types';
import { cityChannelPath } from '../lib/paths';

interface CityChannelCardProps {
  /** 来自 GET /cities/active 的列表，最多展示 18 个 */
  cities: ActiveCityItem[];
}

interface CityDisplayItem {
  enName: string;
  cityName: string;
  imageSrc: string;
  fallbackCourseCount: number;
  monthlyCount?: number;
}

interface ResolvedCity extends CityDisplayItem {
  courseCount: number;
  href: string;
}

interface FilterItem {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  dropdown?: boolean;
}

const CITY_IMAGE_BASE = '/statics/images/city';

const FEATURED_CITY_ITEMS: CityDisplayItem[] = [
  {
    enName: 'shanghai',
    cityName: '上海',
    imageSrc: `${CITY_IMAGE_BASE}/城市名片，上海.png`,
    fallbackCourseCount: 241,
    monthlyCount: 18,
  },
  {
    enName: 'shenzhen',
    cityName: '深圳',
    imageSrc: `${CITY_IMAGE_BASE}/城市名片，深圳.png`,
    fallbackCourseCount: 117,
    monthlyCount: 12,
  },
  {
    enName: 'guangzhou',
    cityName: '广州',
    imageSrc: `${CITY_IMAGE_BASE}/城市名片，广州.png`,
    fallbackCourseCount: 83,
    monthlyCount: 9,
  },
];

const SMALL_CITY_ITEMS: CityDisplayItem[] = [
  {
    enName: 'suzhou',
    cityName: '苏州',
    imageSrc: `${CITY_IMAGE_BASE}/苏州.png`,
    fallbackCourseCount: 74,
  },
  {
    enName: 'beijing',
    cityName: '北京',
    imageSrc: `${CITY_IMAGE_BASE}/北京.png`,
    fallbackCourseCount: 67,
  },
  {
    enName: 'hangzhou',
    cityName: '杭州',
    imageSrc: `${CITY_IMAGE_BASE}/杭州.png`,
    fallbackCourseCount: 57,
  },
  {
    enName: 'xian',
    cityName: '西安',
    imageSrc: `${CITY_IMAGE_BASE}/西安.png`,
    fallbackCourseCount: 17,
  },
  {
    enName: 'wuhan',
    cityName: '武汉',
    imageSrc: `${CITY_IMAGE_BASE}/武汉.png`,
    fallbackCourseCount: 16,
  },
  {
    enName: 'chengdu',
    cityName: '成都',
    imageSrc: `${CITY_IMAGE_BASE}/成都.png`,
    fallbackCourseCount: 13,
  },
  {
    enName: 'qingdao',
    cityName: '青岛',
    imageSrc: `${CITY_IMAGE_BASE}/青岛、.png`,
    fallbackCourseCount: 12,
  },
  {
    enName: 'jiaxing',
    cityName: '嘉兴',
    imageSrc: `${CITY_IMAGE_BASE}/嘉兴.png`,
    fallbackCourseCount: 7,
  },
  {
    enName: 'hefei',
    cityName: '合肥',
    imageSrc: `${CITY_IMAGE_BASE}/合肥.png`,
    fallbackCourseCount: 6,
  },
  {
    enName: 'changsha',
    cityName: '长沙',
    imageSrc: `${CITY_IMAGE_BASE}/长沙.png`,
    fallbackCourseCount: 4,
  },
  {
    enName: 'kunming',
    cityName: '昆明',
    imageSrc: `${CITY_IMAGE_BASE}/昆明.png`,
    fallbackCourseCount: 4,
  },
  {
    enName: 'chongqing',
    cityName: '重庆',
    imageSrc: `${CITY_IMAGE_BASE}/重庆.png`,
    fallbackCourseCount: 3,
  },
];

const FILTER_ITEMS: FilterItem[] = [
  { label: '热门城市', icon: Flame, active: true },
  { label: '附近城市', icon: MapPin },
  { label: '生产管理', icon: Target, dropdown: true },
  { label: '质量管理', icon: ShieldCheck, dropdown: true },
  { label: '本月开课', icon: CalendarDays, dropdown: true },
];

const SERVICE_POINTS = ['专业顾问对接', '精准匹配课程', '快速响应需求'];

/**
 * 首页城市频道入口 — 重点城市名片 + 小城市网格
 *
 * @author Fangxinxin
 * @date 2026-06-23 10:00
 */
export function CityChannelCard({ cities }: CityChannelCardProps) {
  const featuredCities = FEATURED_CITY_ITEMS.map((city) => resolveCity(cities, city));
  const smallCities = SMALL_CITY_ITEMS.map((city) => resolveCity(cities, city));

  return (
    <section className="bg-white">
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
            城市公开课频道
          </h2>
          <p className="mt-3 text-base text-slate-500">
            发现本地热门培训资源，快速查看近期公开课安排
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={cityChannelPath('shanghai')}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            <MapPin className="size-4" />
            定位：上海
            <ChevronDown className="size-4 text-slate-400" />
          </Link>
          <Link
            href="/opencourses"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Map className="size-4" />
            查看全部城市
          </Link>
        </div>
      </div>

      <div className="mb-7 w-full max-w-full overflow-x-auto overscroll-x-contain border-y border-slate-100 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex min-w-max overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
          {FILTER_ITEMS.map((item, index) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                type="button"
                className={[
                  'inline-flex h-12 items-center gap-2 px-7 text-sm font-semibold transition-colors',
                  item.active
                    ? 'bg-red-50 text-red-600'
                    : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  index > 0 ? 'border-l border-slate-100' : '',
                ].join(' ')}
              >
                <Icon className="size-4" />
                {item.label}
                {item.dropdown ? <ChevronDown className="size-4 text-slate-400" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {featuredCities.map((city) => (
          <FeaturedCityCard key={city.enName} city={city} />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {smallCities.map((city) => (
          <SmallCityCard key={city.enName} city={city} />
        ))}
      </div>

      <div className="mt-7 flex flex-col gap-5 rounded-lg border border-red-100 bg-red-50/25 p-5 lg:flex-row lg:items-center lg:justify-between lg:px-7">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500">
            <Target className="size-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">没有找到合适课程？</h3>
            <p className="mt-1 text-sm text-slate-500">发布培训需求，获取本地培训方案</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-7">
          <Link
            href="/publish-demand"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-red-600 px-8 text-sm font-bold text-white shadow-sm shadow-red-200 transition-colors hover:bg-red-700"
          >
            <Send className="size-4" />
            发布培训需求
          </Link>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {SERVICE_POINTS.map((point) => (
              <span
                key={point}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500"
              >
                <CheckCircle2 className="size-4 text-slate-400" />
                {point}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedCityCard({ city }: { city: ResolvedCity }) {
  return (
    <Link
      href={city.href}
      className="group relative block h-[190px] overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md sm:h-[178px]"
    >
      <Image
        src={city.imageSrc}
        alt={`${city.cityName}城市名片`}
        fill
        sizes="(min-width: 1024px) 33vw, 100vw"
        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      <div className="relative z-10 flex h-full flex-col justify-center pl-[34%] pr-16 sm:pl-[31%] sm:pr-5 lg:pl-[33%]">
        <h3 className="text-2xl font-bold text-slate-950">{city.cityName}</h3>
        <p className="mt-4 text-xl font-bold text-red-600">
          {city.courseCount}
          <span className="ml-1 text-sm font-semibold">门课</span>
        </p>
        <p className="mt-3 text-[11px] font-semibold leading-4 text-slate-600 sm:text-sm sm:leading-5">
          热门分类：生产管理 / 质量管理
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          本月开课：{city.monthlyCount ?? 0}场
        </p>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-red-600">
          查看课程
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function SmallCityCard({ city }: { city: ResolvedCity }) {
  return (
    <Link
      href={city.href}
      className="group flex h-[96px] items-center gap-3 overflow-hidden rounded-lg border border-slate-200 bg-white px-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
    >
      <div className="relative h-16 w-[74px] shrink-0">
        <Image
          src={city.imageSrc}
          alt={`${city.cityName}城市地标`}
          fill
          sizes="74px"
          className="object-contain"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-lg font-bold leading-tight text-slate-900 transition-colors group-hover:text-red-600">
          {city.cityName}
        </h3>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          {city.courseCount}门课
        </p>
        <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition-colors group-hover:text-red-600">
          查看课程
          <ArrowRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}

function resolveCity(cities: ActiveCityItem[], item: CityDisplayItem): ResolvedCity {
  const match = cities.find(
    (city) => city.enName === item.enName || city.cityName === item.cityName
  );

  return {
    ...item,
    courseCount: match?.courseCount ?? item.fallbackCourseCount,
    href: cityChannelPath(match?.enName ?? item.enName),
  };
}
