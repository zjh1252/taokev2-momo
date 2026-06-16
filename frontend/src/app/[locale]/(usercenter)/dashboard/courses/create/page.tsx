'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import CourseForm from '@/features/course/components/publisher/CourseForm';
import { createCourse } from '@/features/course/api/publisher-service';
import type { SaveCourseRequest } from '@/features/course/api/types';
import { ApiException } from '@/lib/http/client';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { usePublishingTarget } from '@/features/binding/components/publishing-target-banner';
import { BoundPublisherGuard } from '@/features/binding/components/BoundPublisherGuard';

/**
 * 发布课程页面 — 创建新课程（保存即提交审核）
 *
 * @author Fangxinxin
 * @date 2026-04-07 12:30
 */
export default function CreateCoursePage() {
  const router = useRouter();
  const { trainerUserId, enterpriseAgentUserId, banner, valid } = usePublishingTarget('课程', {
    allowEnterpriseAgentDelegation: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: SaveCourseRequest) => {
    if (!valid) {
      toast.error('请先在顶部选择要代发课程的专家或经纪公司');
      return;
    }
    setSubmitting(true);
    try {
      await createCourse(data, trainerUserId, enterpriseAgentUserId);
      toast.success(
        data.draft
          ? '草稿已保存，可在「管理课程-草稿」中继续编辑'
          : '已提交审核，请等待平台审核',
      );
      const manageQuery = trainerUserId
        ? `?trainerUserId=${trainerUserId}`
        : enterpriseAgentUserId
          ? `?enterpriseAgentUserId=${enterpriseAgentUserId}`
          : '';
      router.push(`${ROUTES.UC_COURSES_MANAGE}${manageQuery}`);
    } catch (err) {
      // ApiException 已由 http client 弹出后端具体失败原因，这里只兜底未知错误
      if (!(err instanceof ApiException)) {
        toast.error('保存失败，请稍后重试');
      }
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
      <BoundPublisherGuard options={{ allowEnterpriseAgentFallback: true }}>
        {banner}
        <CourseForm onSubmit={handleSubmit} submitting={submitting} />
      </BoundPublisherGuard>
    </section>
  );
}
