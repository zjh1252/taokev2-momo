'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Play, PenLine } from 'lucide-react';
import { SafeImage } from '@/components/safe-image';
import type { InstitutionDetail } from '../../types';
import {
  getInstitutionSidebarOpenCourses,
  getInstitutionSidebarVideos,
  getHotOpenCourses,
} from '../../api/service';
import type { CourseListItem } from '@/features/course/api/types';
import type { VideoListItem } from '@/features/video/api/types';
import { useAuthGuard } from '@/lib/auth/auth-guard-context';
import { useRouter } from '@/i18n/navigation';

interface InstitutionDetailSidebarProps {
  institution: InstitutionDetail;
}

/**
 * 机构详情页右侧栏
 * <p>
 * 依次展示：机构公开课（最多 6）、机构视频（最多 6）、热门公开课（最多 5），
 * 以及一个「发布需求」大按钮，跳转用户中心需求创建页。
 * </p>
 */
export function InstitutionDetailSidebar({ institution }: InstitutionDetailSidebarProps) {
  const router = useRouter();
  const { requireAuth } = useAuthGuard();
  const [openCourses, setOpenCourses] = useState<CourseListItem[]>([]);
  const [videos, setVideos] = useState<VideoListItem[]>([]);
  const [hotCourses, setHotCourses] = useState<CourseListItem[]>([]);

  useEffect(() => {
    getInstitutionSidebarOpenCourses(institution.id)
      .then(setOpenCourses)
      .catch(() => setOpenCourses([]));
    getInstitutionSidebarVideos(institution.id)
      .then(setVideos)
      .catch(() => setVideos([]));
    getHotOpenCourses()
      .then(setHotCourses)
      .catch(() => setHotCourses([]));
  }, [institution.id]);

  const goPublishDemand = () => {
    requireAuth(() => router.push('/dashboard/demands/create'));
  };

  return (
    <aside className="w-full lg:w-[300px] shrink-0 flex flex-col gap-4">
      {/* 机构公开课 */}
      {openCourses.length > 0 && (
        <SidebarCard title="机构公开课">
          <ul className="divide-y divide-slate-100">
            {openCourses.map((c) => (
              <li key={c.id} className="py-2 first:pt-0 last:pb-0">
                <Link
                  href={`/opencourse/${c.id}.htm`}
                  className="flex items-center gap-3 group"
                >
                  <SafeImage
                    src={c.coverUrl}
                    alt={c.title}
                    className="w-14 h-[42px] object-cover rounded border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-medium text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                      {c.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {c.enrollmentCount ?? 0} 人报名
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </SidebarCard>
      )}

      {/* 机构视频 */}
      {videos.length > 0 && (
        <SidebarCard title="机构视频">
          <ul className="divide-y divide-slate-100">
            {videos.map((v) => (
              <li key={v.id} className="py-2 first:pt-0 last:pb-0">
                <Link href={`/vedio/${v.id}.htm`} className="flex items-center gap-3 group">
                  <div className="relative w-14 h-[42px] rounded border border-slate-200 overflow-hidden shrink-0 bg-slate-100">
                    <SafeImage
                      src={v.coverUrl}
                      alt={v.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play className="size-3.5 text-white fill-white" />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-medium text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                      {v.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {v.totalEpisodes ? `${v.totalEpisodes}节` : '—'}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </SidebarCard>
      )}

      {/* 热门公开课 */}
      {hotCourses.length > 0 && (
        <SidebarCard title="热门公开课">
          <ul className="divide-y divide-slate-100">
            {hotCourses.map((c) => (
              <li key={c.id} className="py-2 first:pt-0 last:pb-0">
                <Link
                  href={`/opencourse/${c.id}.htm`}
                  className="flex items-center gap-3 group"
                >
                  <SafeImage
                    src={c.coverUrl}
                    alt={c.title}
                    className="w-14 h-[42px] object-cover rounded border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-medium text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                      {c.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {c.enrollmentCount ?? 0} 人报名
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </SidebarCard>
      )}

      {/* 发布需求大按钮 */}
      <button
        onClick={goPublishDemand}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-primary to-red-500 text-white font-bold text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] transition-all"
      >
        <PenLine className="size-5" />
        发布培训需求
      </button>
    </aside>
  );
}

function SidebarCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center">
        <h3 className="font-bold text-primary text-[15px] border-l-2 border-primary pl-2 leading-none">
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
