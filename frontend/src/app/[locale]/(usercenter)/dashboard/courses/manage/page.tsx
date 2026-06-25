'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/lib/auth/auth-context';
import {
  getMyCourses,
  submitCourse,
  unpublishCourse,
  deleteCourse,
  type MyCourseListParams,
} from '@/features/course/api/publisher-service';
import { TrainerSwitcher } from '@/features/binding/components/trainer-switcher';
import { isDelegatingRole, selfPublishingAllowed } from '@/features/binding/lib/delegating-role';
import {
  CourseStatus,
  CourseStatusLabelMap,
  type CourseListItem,
  type CourseStatusValue,
} from '@/features/course/api/types';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Send,
  EyeOff,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveImageSrc } from '@/lib/media';

const STATUS_TABS: { label: string; value: number | undefined }[] = [
  { label: '全部', value: undefined },
  { label: '草稿', value: CourseStatus.DRAFT },
  { label: '待审核', value: CourseStatus.PENDING },
  { label: '已上架', value: CourseStatus.PUBLISHED },
  { label: '已驳回', value: CourseStatus.REJECTED },
  { label: '已下架', value: CourseStatus.UNPUBLISHED },
];

const STATUS_BADGE_STYLES: Record<number, string> = {
  [CourseStatus.DRAFT]: 'bg-slate-100 text-slate-600',
  [CourseStatus.PENDING]: 'bg-amber-50 text-amber-600',
  [CourseStatus.PUBLISHED]: 'bg-green-50 text-green-600',
  [CourseStatus.REJECTED]: 'bg-red-50 text-red-600',
  [CourseStatus.UNPUBLISHED]: 'bg-gray-100 text-gray-500',
};

const PAGE_SIZE = 10;

/**
 * 管理课程 — 我的课程列表页（状态 Tab + 搜索 + 卡片列表 + 分页）
 *
 * @author Fangxinxin
 * @date 2026-04-07 11:00
 */
export default function ManageCoursesPage() {
  const { user, activeRole } = useAuth();
  const search = useSearchParams();
  // 经纪人代经纪公司视角：URL 带 enterpriseAgentUserId 时列出该经纪公司发布的课程
  const enterpriseAgentUserId = search.get('enterpriseAgentUserId')
    ? Number(search.get('enterpriseAgentUserId'))
    : undefined;
  const showSwitcher = isDelegatingRole(activeRole) && !enterpriseAgentUserId;
  const hideSelfOption = showSwitcher && !selfPublishingAllowed(activeRole);
  const [activeTab, setActiveTab] = useState<number | undefined>(undefined);
  const [keyword, setKeyword] = useState('');
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [trainerUserId, setTrainerUserId] = useState<number | undefined>(undefined);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchCourses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params: MyCourseListParams = {
        page,
        size: PAGE_SIZE,
        status: activeTab,
        keyword: keyword || undefined,
        trainerUserId: enterpriseAgentUserId ? undefined : trainerUserId,
        enterpriseAgentUserId,
      };
      const res = await getMyCourses(params);
      setCourses(res.list || []);
      setTotal(res.total || 0);
    } catch {
      setCourses([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [user, page, activeTab, keyword, trainerUserId, enterpriseAgentUserId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleTabChange = (val: number | undefined) => {
    setActiveTab(val);
    setPage(1);
  };

  const handleSearch = () => {
    setPage(1);
    fetchCourses();
  };

  const handleSubmit = async (id: number) => {
    if (!confirm('确定要提交审核吗？')) return;
    try {
      await submitCourse(id);
      fetchCourses();
    } catch {
      alert('提交审核失败');
    }
  };

  const handleUnpublish = async (id: number) => {
    if (!confirm('确定要下架此课程吗？')) return;
    try {
      await unpublishCourse(id);
      fetchCourses();
    } catch {
      alert('下架失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此课程吗？此操作不可恢复。')) return;
    try {
      await deleteCourse(id);
      fetchCourses();
    } catch {
      alert('删除失败');
    }
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      {/* 标题栏 */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-gray-800">管理课程</h2>
        <div className="flex items-center gap-2">
          {showSwitcher && (
            <TrainerSwitcher
              value={trainerUserId}
              hideSelf={hideSelfOption}
              onChange={(uid) => {
                setTrainerUserId(uid);
                setPage(1);
              }}
            />
          )}
          <Link
            href={trainerUserId
              ? `${ROUTES.UC_COURSES_CREATE}?trainerUserId=${trainerUserId}`
              : ROUTES.UC_COURSES_CREATE}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            发布新课程
          </Link>
        </div>
      </div>

      {/* 状态 Tabs + 搜索 */}
      <div className="px-6 pt-4 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => handleTabChange(tab.value)}
              className={cn(
                'px-3.5 py-1.5 text-sm rounded-full transition-colors',
                activeTab === tab.value
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-gray-600 hover:bg-slate-200',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索课程..."
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-gray-500 hover:bg-slate-50 transition-colors"
          >
            <Search className="size-4" />
          </button>
        </div>
      </div>

      {/* 课程列表 */}
      <div className="px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="animate-spin rounded-full size-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <BookOpen className="size-12 mb-4 text-gray-300" />
            <p className="text-sm">暂无课程</p>
            <Link
              href={ROUTES.UC_COURSES_CREATE}
              className="mt-4 text-sm text-primary hover:underline"
            >
              去发布第一门课程
            </Link>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onSubmit={handleSubmit}
                onUnpublish={handleUnpublish}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm text-gray-500 px-3">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function CourseCard({
  course,
  onSubmit,
  onUnpublish,
  onDelete,
}: {
  course: CourseListItem;
  onSubmit: (id: number) => void;
  onUnpublish: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const statusLabel = CourseStatusLabelMap[course.status as CourseStatusValue] || course.statusLabel;
  const badgeStyle = STATUS_BADGE_STYLES[course.status] || 'bg-slate-100 text-slate-600';
  const isDraft = course.status === CourseStatus.DRAFT;
  const isRejected = course.status === CourseStatus.REJECTED;
  const isPublished = course.status === CourseStatus.PUBLISHED;
  const isPending = course.status === CourseStatus.PENDING;

  return (
    <div className="border border-slate-200 rounded-lg p-4 flex gap-4 hover:shadow-md transition-shadow">
      {/* 封面 */}
      <div className="w-[160px] h-[100px] rounded-lg overflow-hidden bg-slate-100 shrink-0">
        {course.coverUrl ? (
          <Image
            src={resolveImageSrc(course.coverUrl, '/statics/images/taoke-new-logo.jpg')}
            alt={course.title}
            width={160}
            height={100}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <BookOpen className="size-8" />
          </div>
        )}
      </div>

      {/* 信息区 */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-800 truncate">{course.title}</h3>
            <span className={cn('text-[11px] px-2 py-0.5 rounded-full shrink-0', badgeStyle)}>
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            <span>{course.typeLabel}</span>
            {course.categoryName && <span>· {course.categoryName}</span>}
            {course.price > 0 && <span>· ¥{course.price}</span>}
            {course.isFree === 1 && <span className="text-green-600">· 免费</span>}
          </div>
          {isRejected && (
            <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
              <AlertCircle className="size-3.5" />
              {/* TODO: 实际 rejectReason 需要从详情 API 获取 */}
              <span>审核未通过，请修改后重新提交</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
          <span>浏览 {course.viewCount}</span>
          <span>报名 {course.enrollmentCount}</span>
          <span>创建于 {course.createdAt?.slice(0, 10)}</span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col gap-2 shrink-0 justify-center">
        {/* 编辑：除「待审核」外的所有状态都允许编辑；后端 update 时若原状态为
            PUBLISHED/UNPUBLISHED 等会自动回到 PENDING 走重新审核 */}
        {!isPending && (
          <Link
            href={`/dashboard/courses/${course.id}/edit`}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-slate-200 text-gray-600 hover:bg-slate-50 transition-colors"
            title={isPublished ? '编辑后将回到待审核状态' : undefined}
          >
            <Edit className="size-3.5" />
            编辑
          </Link>
        )}
        {(isDraft || isRejected) && (
          <button
            type="button"
            onClick={() => onSubmit(course.id)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            <Send className="size-3.5" />
            提交审核
          </button>
        )}
        {isPublished && (
          <button
            type="button"
            onClick={() => onUnpublish(course.id)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-amber-300 text-amber-600 hover:bg-amber-50 transition-colors"
          >
            <EyeOff className="size-3.5" />
            下架
          </button>
        )}
        {!isPending && !isPublished && (
          <button
            type="button"
            onClick={() => onDelete(course.id)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="size-3.5" />
            删除
          </button>
        )}
      </div>
    </div>
  );
}
