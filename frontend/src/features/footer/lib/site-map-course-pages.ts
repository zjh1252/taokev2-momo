import { getCourseList } from '@/features/course/api/service';
import { getCourseDetailPath } from '@/features/course/utils/routes';
import { getVideoList } from '@/features/video/api/service';
import type { CourseListItem, PageResponse } from '@/features/course/api/types';
import type { VideoListItem } from '@/features/video/api/types';
import type { SiteMapLink } from '@/features/footer/content/site-map';

export const SITE_MAP_COURSE_PAGE_SIZE = 100;

export type SiteMapCourseKind = 'opencourse' | 'inhousecourse' | 'video';

export type SiteMapCourseListPage = {
  kind: SiteMapCourseKind;
  title: string;
  pageIndex: number;
  links: SiteMapLink[];
  total: number;
  totalPages: number;
};

export type SiteMapCourseIndex = {
  kind: SiteMapCourseKind;
  title: string;
  total: number;
  links: SiteMapLink[];
};

const COURSE_KIND_LABELS: Record<SiteMapCourseKind, string> = {
  opencourse: '公开课',
  inhousecourse: '内训课程,企业内训',
  video: '录播课',
};

export function getSiteMapCourseKindLabel(kind: SiteMapCourseKind): string {
  return COURSE_KIND_LABELS[kind];
}

export function getSiteMapCourseIndexHref(
  kind: SiteMapCourseKind,
  pageIndex: number,
): string {
  return `/sitemap/html/${kind}_${pageIndex}.html`;
}

export function parseSiteMapCourseFile(
  file: string,
): { kind: SiteMapCourseKind; pageIndex: number } | null {
  const match = file.match(/^(opencourse|inhousecourse|video)_(\d+)\.html$/);
  if (!match) return null;
  return {
    kind: match[1] as SiteMapCourseKind,
    pageIndex: Number(match[2]),
  };
}

export function buildSiteMapCourseIndexLinks(
  kind: SiteMapCourseKind,
  total: number,
): SiteMapLink[] {
  const pageCount = Math.ceil(total / SITE_MAP_COURSE_PAGE_SIZE);
  const label = getSiteMapCourseKindLabel(kind);

  return Array.from({ length: pageCount }, (_, pageIndex) => ({
    label: `${label},${pageIndex}`,
    href: getSiteMapCourseIndexHref(kind, pageIndex),
  }));
}

function courseToLink(course: CourseListItem): SiteMapLink {
  return {
    label: `《${course.title}》`,
    href: getCourseDetailPath(course.id, course.type, course.seoPathId),
  };
}

function videoToLink(video: VideoListItem): SiteMapLink {
  return {
    label: `《${video.title}》`,
    href: `/video/${video.id}.htm`,
  };
}

function emptyCoursePage<T>(
  pageIndex: number,
): PageResponse<T> {
  return {
    list: [],
    total: 0,
    page: pageIndex + 1,
    size: SITE_MAP_COURSE_PAGE_SIZE,
    totalPages: 0,
  };
}

export async function getSiteMapCourseIndex(
  kind: SiteMapCourseKind,
): Promise<SiteMapCourseIndex> {
  const label = getSiteMapCourseKindLabel(kind);

  if (kind === 'video') {
    const data = await getVideoList({ page: 1, size: 1 }).catch(() =>
      emptyCoursePage<VideoListItem>(0),
    );
    return {
      kind,
      title: `${label}列表`,
      total: data.total,
      links: buildSiteMapCourseIndexLinks(kind, data.total),
    };
  }

  const data = await getCourseList({
    page: 1,
    size: 1,
    isOpen: kind === 'opencourse',
  }).catch(() => emptyCoursePage<CourseListItem>(0));

  return {
    kind,
    title: `${label}列表`,
    total: data.total,
    links: buildSiteMapCourseIndexLinks(kind, data.total),
  };
}

export async function getSiteMapCourseListPage(
  kind: SiteMapCourseKind,
  pageIndex: number,
): Promise<SiteMapCourseListPage> {
  const page = pageIndex + 1;

  if (kind === 'video') {
    const data = await getVideoList({
      page,
      size: SITE_MAP_COURSE_PAGE_SIZE,
    }).catch(() => emptyCoursePage<VideoListItem>(pageIndex));

    return {
      kind,
      title: `${getSiteMapCourseKindLabel(kind)},${pageIndex}`,
      pageIndex,
      links: data.list.map(videoToLink),
      total: data.total,
      totalPages: data.totalPages,
    };
  }

  const data = await getCourseList({
    page,
    size: SITE_MAP_COURSE_PAGE_SIZE,
    isOpen: kind === 'opencourse',
  }).catch(() => emptyCoursePage<CourseListItem>(pageIndex));

  return {
    kind,
    title: `${getSiteMapCourseKindLabel(kind)},${pageIndex}`,
    pageIndex,
    links: data.list.map(courseToLink),
    total: data.total,
    totalPages: data.totalPages,
  };
}
