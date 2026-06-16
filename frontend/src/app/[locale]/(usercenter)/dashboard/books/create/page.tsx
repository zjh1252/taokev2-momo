'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { createBook } from '@/features/trainer-books/api/service';
import type { SaveTrainerBookRequest } from '@/features/trainer-books/api/types';
import { BookFormFields, BOOK_RULES } from '@/features/trainer-books/components/book-form-fields';
import { validateForm, getFirstError } from '@/lib/validation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { usePublishingTarget } from '@/features/binding/components/publishing-target-banner';
import { BoundPublisherGuard } from '@/features/binding/components/BoundPublisherGuard';

export default function CreateBookPage() {
  const router = useRouter();
  const { trainerUserId, banner, valid } = usePublishingTarget('著作');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Partial<SaveTrainerBookRequest>>({
    title: '',
    coverUrl: '',
    publisher: '',
    publishDate: '',
    description: '',
    buyUrl: '',
  });

  const handleSubmit = async () => {
    if (!valid) {
      toast.error('请先在顶部选择要代发著作的专家');
      return;
    }
    const validation = validateForm(form as SaveTrainerBookRequest, BOOK_RULES);
    if (!validation.valid) {
      toast.error(getFirstError(validation.errors) || '请完善必填信息');
      return;
    }

    setSubmitting(true);
    try {
      await createBook(form as SaveTrainerBookRequest, trainerUserId);
      toast.success('著作已提交，等待审核');
      router.push(
        trainerUserId
          ? `${ROUTES.UC_BOOKS_MANAGE}?trainerUserId=${trainerUserId}`
          : ROUTES.UC_BOOKS_MANAGE,
      );
    } catch {
      // 平台层已统一处理错误提示
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 px-6 py-4 flex items-center gap-3">
        <Link href={ROUTES.UC_BOOKS_MANAGE} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <h2 className="text-lg font-bold text-gray-800">添加著作</h2>
      </div>

      <BoundPublisherGuard>
        {banner}

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 px-6 py-6 max-w-2xl">
          <BookFormFields
            form={form}
            onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
          />

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-primary text-white text-sm px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? '提交中...' : '提交著作'}
            </button>
            <Link
              href={ROUTES.UC_BOOKS_MANAGE}
              className="border border-slate-200 text-gray-600 text-sm px-6 py-2.5 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center"
            >
              取消
            </Link>
          </div>
        </div>
      </BoundPublisherGuard>
    </section>
  );
}
