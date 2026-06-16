import { Link } from '@/i18n/navigation';
import type { TrainerListItem } from '@/features/trainer/types';
import { filtersToHtmPath } from '@/features/trainer/utils/url';

interface CityTrainerFlowListProps {
  cityName: string;
  trainers: TrainerListItem[];
}

/**
 * 城市频道 — 最新授课专家流式列表（含领域/行业标签）
 */
export function CityTrainerFlowList({ cityName, trainers }: CityTrainerFlowListProps) {
  return (
    <div className="px-5 py-4 flex flex-col gap-3">
      {trainers.map((trainer) => {
        const fieldTags = (trainer.expertiseCategories ?? []).slice(0, 2);
        const industryTags = (trainer.industryCategories ?? []).slice(0, 2);
        const displayName = trainer.teachingName || trainer.name;

        return (
          <div key={trainer.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="text-primary shrink-0">[{cityName}]</span>
            {fieldTags.map((tag) => (
              <Link
                key={`f-${trainer.id}-${tag.categoryId}`}
                href={filtersToHtmPath({ field: tag.categoryName, region: cityName })}
                className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-primary/10 hover:text-primary"
              >
                {tag.categoryName}
              </Link>
            ))}
            {industryTags.map((tag) => (
              <Link
                key={`i-${trainer.id}-${tag.categoryId}`}
                href={filtersToHtmPath({ industry: tag.categoryName, region: cityName })}
                className="rounded bg-orange-50 px-2 py-0.5 text-xs text-orange-700 hover:bg-orange-100"
              >
                {tag.categoryName}
              </Link>
            ))}
            <h3 className="inline font-normal m-0">
              <Link href={`/trainer/${trainer.id}.htm`} className="text-slate-900 hover:text-primary font-medium">
                {displayName}
              </Link>
            </h3>
          </div>
        );
      })}
    </div>
  );
}
