import { Link } from '@/i18n/navigation';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import {
  FOOTER_ABOUT_LINKS,
  FOOTER_BUSINESS_LINKS,
  FOOTER_LEGAL_LINKS,
  FOOTER_NAV_LINKS,
} from '@/features/footer/constants/footer-links';
import {
  SITE_MAP_CATEGORY_NAMES,
  SITE_MAP_CITY_LINKS,
  SITE_MAP_INDEX_LINKS,
  SITE_MAP_KEYWORDS,
  SITE_MAP_MAIN_LINKS,
  buildSearchHref,
  type SiteMapLink,
} from '@/features/footer/content/site-map';
import {
  getSiteMapCourseIndex,
  type SiteMapCourseIndex,
} from '@/features/footer/lib/site-map-course-pages';
import { getActiveCitiesCached } from '@/features/city/api/server';
import { cityChannelPath } from '@/features/city/lib/paths';
import { filtersToHtmPath } from '@/features/trainer/utils/url';
import { filterStandardTrainerExpertiseTree } from '@/features/trainer/utils/expertise-categories';
import { getCachedCourseCategoryTree, getCachedTrainerExpertiseTree } from '@/lib/cached-categories';
import type { CategoryTreeNode } from '@/features/course/api/types';

type SiteMapSectionProps = {
  title: string;
  links: SiteMapLink[];
};

function topLevelCategories(tree: CategoryTreeNode[]): CategoryTreeNode[] {
  return tree
    .filter((item) => item.level <= 1 || Boolean(item.children?.length))
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

function courseCategoryLinks(
  categories: CategoryTreeNode[],
  basePath: '/opencourse' | '/inhousecourse',
): SiteMapLink[] {
  if (categories.length === 0) {
    return SITE_MAP_CATEGORY_NAMES.map((name) => ({
      label: name,
      href: `${basePath}?categoryName=${encodeURIComponent(name)}`,
    }));
  }

  return categories.map((category) => {
    const params = new URLSearchParams();
    params.set('categoryIds', String(category.id));
    params.set('categoryName', category.name);
    return {
      label: category.name,
      href: `${basePath}?${params.toString()}`,
    };
  });
}

function trainerCategoryLinks(categories: CategoryTreeNode[]): SiteMapLink[] {
  if (categories.length === 0) {
    return SITE_MAP_CATEGORY_NAMES.map((name) => ({
      label: name,
      href: filtersToHtmPath({ field: name }),
    }));
  }

  return categories.map((category) => ({
    label: category.name,
    href: filtersToHtmPath({ field: category.name }),
  }));
}

function institutionCategoryLinks(categories: CategoryTreeNode[]): SiteMapLink[] {
  if (categories.length === 0) {
    return SITE_MAP_CATEGORY_NAMES.map((name) => ({
      label: name,
      href: `/company?categoryName=${encodeURIComponent(name)}`,
    }));
  }

  return categories.map((category) => {
    const params = new URLSearchParams();
    params.set('expertiseCategoryId', String(category.id));
    params.set('categoryName', category.name);
    return {
      label: category.name,
      href: `/company?${params.toString()}`,
    };
  });
}

function searchLinks(suffix: string): SiteMapLink[] {
  return SITE_MAP_CATEGORY_NAMES.map((name) => ({
    label: name,
    href: buildSearchHref(`${name}${suffix}`),
  }));
}

function footerLinks(): SiteMapLink[] {
  return [
    ...FOOTER_NAV_LINKS.filter((item) => item.label !== '站点地图'),
    ...FOOTER_ABOUT_LINKS,
    ...FOOTER_BUSINESS_LINKS,
    ...FOOTER_LEGAL_LINKS,
  ];
}

function SiteMapAnchor({ link }: { link: SiteMapLink }) {
  const className =
    'inline-flex min-h-8 items-center rounded-md px-2.5 py-1 text-sm leading-6 text-slate-700 transition-colors hover:bg-primary/5 hover:text-primary';

  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="nofollow noopener noreferrer"
        className={className}
      >
        {link.label}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

function SiteMapSection({ title, links }: SiteMapSectionProps) {
  if (links.length === 0) return null;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-bold text-slate-900">{title}</h2>
      <div className="flex flex-wrap gap-x-1.5 gap-y-2">
        {links.map((link) => (
          <SiteMapAnchor key={`${title}-${link.label}-${link.href}`} link={link} />
        ))}
      </div>
    </section>
  );
}

function SiteMapCourseIndexSection({ index }: { index: SiteMapCourseIndex }) {
  if (index.links.length === 0 && index.total === 0) return null;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">{index.title}</h2>
        <span className="text-xs text-slate-500">共 {index.total} 门</span>
      </div>

      <div className="flex flex-wrap gap-x-1.5 gap-y-2">
        {index.links.map((link) => (
          <SiteMapAnchor key={`${index.kind}-${link.href}`} link={link} />
        ))}
      </div>
    </section>
  );
}

/**
 * 底部「站点地图」页：参考老站 sitemap 分区，链接落到新站现有频道。
 */
export async function SiteMapPage() {
  const [courseTree, trainerTree, activeCities, openCourseIndex, innerCourseIndex, videoIndex] = await Promise.all([
    getCachedCourseCategoryTree(),
    getCachedTrainerExpertiseTree().then(filterStandardTrainerExpertiseTree),
    getActiveCitiesCached(36).catch(() => []),
    getSiteMapCourseIndex('opencourse'),
    getSiteMapCourseIndex('inhousecourse'),
    getSiteMapCourseIndex('video'),
  ]);

  const courseCategories = topLevelCategories(courseTree);
  const trainerCategories = topLevelCategories(trainerTree);
  const cityLinks =
    activeCities.length > 0
      ? activeCities.map((city) => ({
          label: city.cityName,
          href: cityChannelPath(city.enName),
        }))
      : SITE_MAP_CITY_LINKS;

  return (
    <div className="bg-[var(--page-bg)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-5 px-6 py-6 lg:px-8">
        <PageBreadcrumb items={[{ label: '站点地图' }]} />

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
            站点地图
          </h1>
          <div className="h-1 w-10 rounded-full bg-primary" />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <SiteMapSection title="栏目一览" links={SITE_MAP_MAIN_LINKS} />
          <SiteMapSection title="网站导航" links={footerLinks()} />
        </div>

        <SiteMapCourseIndexSection index={openCourseIndex} />
        <SiteMapCourseIndexSection index={innerCourseIndex} />
        <SiteMapCourseIndexSection index={videoIndex} />

        <SiteMapSection
          title="公开课"
          links={courseCategoryLinks(courseCategories, '/opencourse')}
        />
        <SiteMapSection
          title="内训课程,企业内训"
          links={courseCategoryLinks(courseCategories, '/inhousecourse')}
        />
        <SiteMapSection title="培训讲师" links={trainerCategoryLinks(trainerCategories)} />
        <SiteMapSection title="培训机构" links={institutionCategoryLinks(trainerCategories)} />
        <SiteMapSection title="培训资料" links={searchLinks(' 培训资料')} />
        <SiteMapSection title="培训资讯" links={searchLinks(' 培训资讯')} />
        <SiteMapSection title="培训场地" links={cityLinks} />
        <SiteMapSection title="索引列表" links={SITE_MAP_INDEX_LINKS} />
        <SiteMapSection
          title="热门关键字"
          links={SITE_MAP_KEYWORDS.map((keyword) => ({
            label: keyword,
            href: buildSearchHref(keyword),
          }))}
        />
      </div>
    </div>
  );
}
