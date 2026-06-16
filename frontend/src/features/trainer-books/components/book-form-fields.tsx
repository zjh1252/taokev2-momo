'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import Image from 'next/image';
import { FormField } from '@/components/FormField';
import { uploadImage } from '@/features/course/api/publisher-service';
import type { SaveTrainerBookRequest } from '../api/types';
import { toast } from 'sonner';

interface BookFormFieldsProps {
  form: Partial<SaveTrainerBookRequest>;
  onChange: (patch: Partial<SaveTrainerBookRequest>) => void;
  disabled?: boolean;
}

export function BookFormFields({ form, onChange, disabled }: BookFormFieldsProps) {
  const [coverUploading, setCoverUploading] = useState(false);

  const updateField = <K extends keyof SaveTrainerBookRequest>(
    key: K,
    value: SaveTrainerBookRequest[K] | undefined,
  ) => onChange({ [key]: value });

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || disabled) return;
    setCoverUploading(true);
    try {
      const url = await uploadImage(file);
      updateField('coverUrl', url);
    } catch {
      toast.error('封面上传失败');
    } finally {
      setCoverUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      <FormField label="书名" required>
        <input
          type="text"
          value={form.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="请输入书名"
          disabled={disabled}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="出版社">
          <input
            type="text"
            value={form.publisher || ''}
            onChange={(e) => updateField('publisher', e.target.value)}
            placeholder="如：机械工业出版社"
            disabled={disabled}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50"
          />
        </FormField>
        <FormField label="出版日期">
          <input
            type="date"
            value={form.publishDate || ''}
            onChange={(e) => updateField('publishDate', e.target.value)}
            disabled={disabled}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50"
          />
        </FormField>
      </div>

      <FormField label="封面图">
        <div className="flex items-center gap-4">
          {form.coverUrl ? (
            <div className="relative w-[100px] h-[140px] rounded-lg overflow-hidden border border-slate-200">
              <Image src={form.coverUrl} alt="封面" fill className="object-cover" />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => updateField('coverUrl', '')}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full size-5 flex items-center justify-center text-xs hover:bg-black/70"
                >
                  ×
                </button>
              )}
            </div>
          ) : (
            <label className={`w-[100px] h-[140px] rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}`}>
              <Upload className="size-5 text-slate-400" />
              <span className="text-xs text-slate-400">
                {coverUploading ? '上传中...' : '上传封面'}
              </span>
              {!disabled && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                  disabled={coverUploading}
                />
              )}
            </label>
          )}
        </div>
      </FormField>

      <FormField label="购买链接">
        <input
          type="url"
          value={form.buyUrl || ''}
          onChange={(e) => updateField('buyUrl', e.target.value)}
          placeholder="https://..."
          disabled={disabled}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50"
        />
      </FormField>

      <FormField label="简介">
        <textarea
          value={form.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          rows={4}
          placeholder="简短介绍这本著作（选填）"
          disabled={disabled}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none disabled:bg-slate-50"
        />
      </FormField>
    </div>
  );
}

export const BOOK_RULES = {
  title: { required: true, requiredMessage: '请输入书名' },
};
