'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import CourseForm from '@/features/course/components/publisher/CourseForm';
import { createCourse } from '@/features/course/api/publisher-service';
import type { SaveCourseRequest } from '@/features/course/api/types';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { usePublishingTarget } from '@/features/binding/components/publishing-target-banner';
import { AssistantPublishGuard } from '@/features/assistant/components/AssistantPublishGuard';

/**
 * 发布课程页面 — 创建新课程（草稿）
 *
 * @author Fangxinxin
 * @date 2026-04-07 12:30
 */
export default function CreateCoursePage() {
  const router = useRouter();
  const { trainerUserId, banner, valid } = usePublishingTarget('课程');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: SaveCourseRequest) => {
    if (!valid) {
      toast.error('请先在顶部选择要代发课程的专家');
      return;
    }
    setSubmitting(true);
    try {
      await createCourse(data, trainerUserId);
      toast.success('课程已保存为草稿');
      router.push(
        trainerUserId
          ? `${ROUTES.UC_COURSES_MANAGE}?trainerUserId=${trainerUserId}`
          : ROUTES.UC_COURSES_MANAGE,
      );
    } catch {
      toast.error('保存失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.UC_COURSES_MANAGE}
          className="text-gray-400 hover:text-primary transition-colors"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">发布新课程</h1>
      </div>
      <AssistantPublishGuard>
        {banner}
        <CourseForm onSubmit={handleSubmit} submitting={submitting} />
      </AssistantPublishGuard>
    </section>
  );
}
