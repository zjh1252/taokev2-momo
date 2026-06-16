import { Link } from '@/i18n/navigation';
import { MapPin, ArrowRight } from 'lucide-react';
import type { ActiveCityItem } from '../api/types';
import { cityChannelPath } from '../lib/paths';

interface CityChannelCardProps {
  /** 来自 GET /cities/active 的列表，最多展示 9 个 */
  cities: ActiveCityItem[];
}

/**
 * 首页城市频道入口卡片
 * <p>显示最多 9 个「当前有有效公开课」的城市，每个城市点击跳转到 `/cities/[enName]`。</p>
 *
 * @author Fangxinxin
 * @date 2026-05-20 18:00
 */
export function CityChannelCard({ cities }: CityChannelCardProps) {
  const display = cities.slice(0, 9);

  return (
    <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-primary" />
          <h3 className="text-base font-bold text-slate-900">城市频道</h3>
        </div>
        <span className="text-xs text-slate-400">本地培训资源</span>
      </div>

      {display.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
          暂无开课城市
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 flex-1">
          {display.map((city) => (
            <Link
              key={city.enName}
              href={cityChannelPath(city.enName)}
              className="group flex flex-col items-center justify-center gap-1 py-3 rounded-md border border-slate-100 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <span className="text-sm font-medium text-slate-800 group-hover:text-primary transition-colors">
                {city.cityName}
              </span>
              <span className="text-[11px] text-slate-400 group-hover:text-primary/70 transition-colors">
                {city.courseCount} 门课
              </span>
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/opencourses"
        className="mt-4 flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-primary transition-colors"
      >
        查看全部城市公开课
        <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}
