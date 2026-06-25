'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { FormField } from '@/components/FormField';
import { uploadImage } from '@/features/course/api/publisher-service';
import { listManagedTrainers } from '@/features/binding/api/service';
import { isDelegatingRole } from '@/features/binding/lib/delegating-role';
import type { ManagedTrainerOption } from '@/features/binding/components/trainer-switcher';
import { getMyTrainerProfileAsForm } from '@/features/role-apply/api/service';
import { getTrainerDisplayName } from '@/features/trainer/utils/displayName';
import { resolveImageSrc } from '@/lib/media';
import type { SaveTrainerBookRequest } from '../api/types';
import { toast } from 'sonner';

const inputClassName =
  'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50';

interface BookFormFieldsProps {
  form: Partial<SaveTrainerBookRequest>;
  onChange: (patch: Partial<SaveTrainerBookRequest>) => void;
  disabled?: boolean;
  /** 当前激活角色，决定作者字段展示方式 */
  activeRole?: string | null;
  /** 代管专家 user_id（与顶部「为谁代发」联动） */
  trainerUserId?: number;
  onTrainerUserIdChange?: (userId: number | undefined) => void;
}

export function BookFormFields({
  form,
  onChange,
  disabled,
  activeRole,
  trainerUserId,
  onTrainerUserIdChange,
}: BookFormFieldsProps) {
  const [coverUploading, setCoverUploading] = useState(false);
  const [managedTrainers, setManagedTrainers] = useState<ManagedTrainerOption[]>([]);
  const [trainersLoading, setTrainersLoading] = useState(false);
  const trainerAutoFilledRef = useRef(false);

  const updateField = <K extends keyof SaveTrainerBookRequest>(
    key: K,
    value: SaveTrainerBookRequest[K] | undefined,
  ) => onChange({ [key]: value });

  const isTrainerSelf = activeRole === 'TRAINER';
  const isDelegating = isDelegatingRole(activeRole);

  useEffect(() => {
    if (!isTrainerSelf || trainerAutoFilledRef.current) return;
    trainerAutoFilledRef.current = true;
    void getMyTrainerProfileAsForm().then((profile) => {
      if (!profile) return;
      const name = getTrainerDisplayName({
        name: profile.name || '',
        teachingName: profile.teachingName,
      });
      if (name) onChange({ authorName: name });
    });
  }, [isTrainerSelf, onChange]);

  useEffect(() => {
    if (!isDelegating) return;
    setTrainersLoading(true);
    listManagedTrainers()
      .then((list) => {
        const seen = new Set<number>();
        const opts: ManagedTrainerOption[] = [];
        for (const b of list) {
          if (!b.counterpartUserId || seen.has(b.counterpartUserId)) continue;
          seen.add(b.counterpartUserId);
          opts.push({
            userId: b.counterpartUserId,
            nickname: b.counterpartNickname || `专家#${b.counterpartUserId}`,
            avatarUrl: b.counterpartAvatarUrl,
          });
        }
        setManagedTrainers(opts);
      })
      .catch(() => setManagedTrainers([]))
      .finally(() => setTrainersLoading(false));
  }, [isDelegating]);

  useEffect(() => {
    if (!isDelegating || trainerUserId === undefined || managedTrainers.length === 0) return;
    const matched = managedTrainers.find((t) => t.userId === trainerUserId);
    if (matched && form.authorName !== matched.nickname) {
      onChange({ authorName: matched.nickname });
    }
  }, [isDelegating, trainerUserId, managedTrainers, form.authorName, onChange]);

  const handleAuthorSelect = (raw: string) => {
    const uid = raw ? Number(raw) : undefined;
    const matched = managedTrainers.find((t) => t.userId === uid);
    onTrainerUserIdChange?.(uid);
    updateField('authorName', matched?.nickname || '');
  };

  const uploadCoverFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }
    setCoverUploading(true);
    try {
      const url = await uploadImage(file);
      updateField('coverUrl', url);
      toast.success('封面上传成功');
    } catch {
      toast.error('封面上传失败');
    } finally {
      setCoverUploading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || disabled) return;
    await uploadCoverFile(file);
  };

  const handleCoverPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const items = e.clipboardData?.items;
    if (items) {
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) void uploadCoverFile(file);
          return;
        }
      }
    }
    const text = e.clipboardData?.getData('text')?.trim();
    if (text && (/^https?:\/\//i.test(text) || text.startsWith('/uploads/'))) {
      updateField('coverUrl', text);
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
          className={inputClassName}
        />
      </FormField>

      <FormField label="作者" required>
        {isDelegating ? (
          <>
            <select
              value={trainerUserId ?? ''}
              onChange={(e) => handleAuthorSelect(e.target.value)}
              disabled={disabled || trainersLoading}
              className={`${inputClassName} cursor-pointer`}
            >
              <option value="">
                {trainersLoading ? '加载专家库…' : '请从专家库选择作者'}
              </option>
              {managedTrainers.map((opt) => (
                <option key={opt.userId} value={opt.userId}>
                  {opt.nickname}
                </option>
              ))}
            </select>
            {managedTrainers.length === 0 && !trainersLoading ? (
              <p className="text-xs text-amber-600 mt-1">暂无可选专家，请先绑定专家后再添加著作</p>
            ) : null}
          </>
        ) : (
          <input
            type="text"
            value={form.authorName || ''}
            readOnly
            disabled
            placeholder="自动填充专家姓名"
            className={`${inputClassName} bg-slate-50 text-gray-700`}
          />
        )}
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="出版社">
          <input
            type="text"
            value={form.publisher || ''}
            onChange={(e) => updateField('publisher', e.target.value)}
            placeholder="如：机械工业出版社"
            disabled={disabled}
            className={inputClassName}
          />
        </FormField>
        <FormField label="出版日期">
          <input
            type="date"
            value={form.publishDate || ''}
            onChange={(e) => updateField('publishDate', e.target.value)}
            disabled={disabled}
            className={inputClassName}
          />
        </FormField>
      </div>

      <FormField label="封面图" required>
        <BookCoverField
          value={form.coverUrl || ''}
          disabled={disabled}
          uploading={coverUploading}
          onChange={(url) => updateField('coverUrl', url)}
          onUpload={handleCoverUpload}
          onPaste={handleCoverPaste}
        />
      </FormField>

      <FormField label="购买链接">
        <input
          type="url"
          value={form.buyUrl || ''}
          onChange={(e) => updateField('buyUrl', e.target.value)}
          placeholder="https://..."
          disabled={disabled}
          className={inputClassName}
        />
      </FormField>

      <FormField label="简介">
        <textarea
          value={form.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          rows={4}
          placeholder="简短介绍这本著作（选填）"
          disabled={disabled}
          className={`${inputClassName} resize-none`}
        />
      </FormField>
    </div>
  );
}

interface BookCoverFieldProps {
  value: string;
  disabled?: boolean;
  uploading: boolean;
  onChange: (url: string) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
}

function BookCoverField({
  value,
  disabled,
  uploading,
  onChange,
  onUpload,
  onPaste,
}: BookCoverFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewSrc = value ? resolveImageSrc(value, '') : '';

  return (
    <div
      tabIndex={disabled ? -1 : 0}
      onPaste={onPaste}
      className="space-y-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="输入封面 URL，或粘贴图片 / 链接"
          disabled={disabled}
          className={`${inputClassName} flex-1 min-w-[200px]`}
        />
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {uploading ? '上传中…' : '上传图片'}
        </button>
        {value && !disabled ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
          >
            <X className="size-4" />
            清除
          </button>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onUpload}
          className="hidden"
          disabled={disabled || uploading}
        />
      </div>

      {previewSrc ? (
        <div className="relative w-[100px] h-[140px] rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
          <Image src={previewSrc} alt="封面预览" fill className="object-cover" unoptimized />
        </div>
      ) : (
        <label
          className={`w-[100px] h-[140px] rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'
          }`}
        >
          <Upload className="size-5 text-slate-400" />
          <span className="text-xs text-slate-400 text-center px-2">
            {uploading ? '上传中…' : '点击上传'}
          </span>
          {!disabled && (
            <input
              type="file"
              accept="image/*"
              onChange={onUpload}
              className="hidden"
              disabled={uploading}
            />
          )}
        </label>
      )}

      <p className="text-xs text-gray-400">支持 URL、本地上传、Ctrl+V 粘贴图片或链接（必填）</p>
    </div>
  );
}

export const BOOK_RULES = {
  title: { required: true, requiredMessage: '请输入书名' },
  authorName: { required: true, requiredMessage: '请填写作者' },
  coverUrl: { required: true, requiredMessage: '请上传封面图' },
};
