'use client';

import { useState, useEffect, use } from 'react';
import { toast } from 'sonner';
import { useRouter, Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import CourseForm from '@/features/course/components/publisher/CourseForm';
import { getMyCourseDetail, updateCourse } from '@/features/course/api/publisher-service';
import type { SaveCourseRequest, CourseDetail } from '@/features/course/api/types';
import { ApiException } from '@/lib/http/client';
import { ArrowLeft } from 'lucide-react';
import { OwnedTrainerBanner } from '@/features/binding/components/owned-trainer-banner';
import { BoundPublisherGuard } from '@/features/binding/components/BoundPublisherGuard';

/**
 * 编辑课程页面 — 加载已有课程数据并允许修改保存
 *
 * @author Fangxinxin
 * @date 2026-04-07 12:30
 */
export default function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const courseId = Number(id);
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMyCourseDetail(courseId)
      .then(setCourse)
      .catch(() => alert('加载课程失败'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleSubmit = async (data: SaveCourseRequest) => {
    setSubmitting(true);
    try {
      await updateCourse(courseId, data);
      toast.success(
        data.draft
          ? '草稿已保存，可在「管理课程-草稿」中继续编辑'
          : course?.status === 1
            ? '已保存，课程仍在待审核中'
            : '已保存并提交审核，请等待平台审核',
      );
      router.push(ROUTES.UC_COURSES_MANAGE);
    } catch (err) {
      // ApiException 已由 http client 弹出后端具体失败原因，这里只兜底未知错误
      if (!(err instanceof ApiException)) {
        toast.error('保存失败，请稍后重试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full size-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>课程不存在或无权编辑</p>
        <Link href={ROUTES.UC_COURSES_MANAGE} className="text-primary text-sm mt-4 inline-block">
          返回管理课程
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.UC_COURSES_MANAGE}
          className="text-gray-400 hover:text-primary transition-colors"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">编辑课程</h1>
      </div>
      <BoundPublisherGuard>
        <OwnedTrainerBanner
          trainerUserId={course.publisherType === 'TRAINER' ? course.publisherId : undefined}
          trainerNameHint={course.trainerName}
        />
        <CourseForm initialData={course} onSubmit={handleSubmit} submitting={submitting} />
      </BoundPublisherGuard>
    </section>
  );
}
