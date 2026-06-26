import { Link } from '@/i18n/navigation';
import type { InstitutionListItem } from '@/features/institution/types';
import { institutionPublicHref } from '@/features/institution/utils/public-path';

interface CityInstitutionFlowListProps {
  cityName: string;
  institutions: InstitutionListItem[];
}

/**
 * 城市频道 — 最新培训机构流式列表
 */
export function CityInstitutionFlowList({ cityName, institutions }: CityInstitutionFlowListProps) {
  return (
    <div className="px-5 py-4 flex flex-wrap gap-x-4 gap-y-2 text-sm leading-7">
      {institutions.map((inst) => (
        <h3 key={inst.id} className="inline font-normal m-0">
          <Link
            href={institutionPublicHref(inst)}
            className="text-slate-800 hover:text-primary"
          >
            <span className="text-primary">[{cityName}]</span>
            {inst.orgName}
          </Link>
        </h3>
      ))}
    </div>
  );
}
