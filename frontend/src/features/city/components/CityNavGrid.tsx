import { Link } from '@/i18n/navigation';
import { MapPin } from 'lucide-react';
import type { ActiveCityItem } from '../api/types';
import { cityChannelPath } from '../lib/paths';

interface CityNavGridProps {
  cities: ActiveCityItem[];
  currentEnName?: string;
}

/**
 * 城市频道底部 — 全国城市快速切换
 */
export function CityNavGrid({ cities, currentEnName }: CityNavGridProps) {
  if (cities.length === 0) return null;

  return (
    <section className="bg-white rounded-lg border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="size-4 text-primary" />
        <h2 className="text-base font-bold text-slate-900 m-0">全国城市培训频道</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {cities.map((city) => {
          const active = city.enName === currentEnName;
          return (
            <Link
              key={city.enName}
              href={cityChannelPath(city.enName)}
              className={
                active
                  ? 'rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary'
                  : 'rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:border-primary hover:text-primary transition-colors'
              }
            >
              {city.cityName}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
