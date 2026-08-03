import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { ROUTES } from '@/config/routes';
import {
  getSiteMapCourseIndexHref,
  getSiteMapCourseListPage,
  parseSiteMapCourseFile,
} from '@/features/footer/lib/site-map-course-pages';

type PageProps = {
  params: Promise<{ file: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { file } = await params;
  const parsed = parseSiteMapCourseFile(file);
  if (!parsed) {
    return { title: '页面不存在 - 淘课网' };
  }

  const page = await getSiteMapCourseListPage(parsed.kind, parsed.pageIndex);
  return {
    title: `${page.title} - 站点地图 - 淘课网`,
    description: `${page.title}课程索引，汇总淘课网对应分页下的具体课程。`,
  };
}

/**
 * 老站风格课程 sitemap 分页：/sitemap/html/opencourse_0.html
 */
export default async function SiteMapCoursePage({ params }: PageProps) {
  const { file } = await params;
  const parsed = parseSiteMapCourseFile(file);
  if (!parsed) {
    notFound();
  }

  const page = await getSiteMapCourseListPage(parsed.kind, parsed.pageIndex);
  if (page.totalPages > 0 && parsed.pageIndex >= page.totalPages) {
    notFound();
  }

  const prevHref =
    parsed.pageIndex > 0
      ? getSiteMapCourseIndexHref(parsed.kind, parsed.pageIndex - 1)
      : null;
  const nextHref =
    page.totalPages > 0 && parsed.pageIndex + 1 < page.totalPages
      ? getSiteMapCourseIndexHref(parsed.kind, parsed.pageIndex + 1)
      : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-5 px-6 py-6 lg:px-8">
      <PageBreadcrumb
        items={[
          { label: '站点地图', href: ROUTES.ABOUT_SITEMAP },
          { label: page.title },
        ]}
      />

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-950">{page.title}</h1>
            <p className="mt-2 text-sm text-slate-500">
              共 {page.total} 门，第 {parsed.pageIndex + 1} / {Math.max(page.totalPages, 1)} 页
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link
              href={ROUTES.ABOUT_SITEMAP}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-600 transition-colors hover:border-primary hover:text-primary"
            >
              返回站点地图
            </Link>
            {prevHref && (
              <Link
                href={prevHref}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-600 transition-colors hover:border-primary hover:text-primary"
              >
                上一页
              </Link>
            )}
            {nextHref && (
              <Link
                href={nextHref}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-600 transition-colors hover:border-primary hover:text-primary"
              >
                下一页
              </Link>
            )}
          </div>
        </div>

        {page.links.length > 0 ? (
          <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2 xl:grid-cols-3">
            {page.links.map((link) => (
              <li key={link.href} className="list-inside list-disc text-slate-500">
                <Link
                  href={link.href}
                  className="text-sm leading-6 text-slate-700 transition-colors hover:text-primary hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            当前分页暂无课程。
          </div>
        )}
      </div>
    </main>
  );
}
