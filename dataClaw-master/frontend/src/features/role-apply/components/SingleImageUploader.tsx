'use client';

import { useRef, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImage } from '@/features/course/api/publisher-service';

export interface SingleImageUploaderProps {
  /** 当前已上传的图片 URL；空字符串表示未上传 */
  value: string;
  /** 选中并上传成功后回调；传空表示移除 */
  onChange: (url: string) => void;
  /** 单图语义标签，用于占位文案 / 移除 alt（如「营业执照」「机构 Logo」） */
  label: string;
  /** 接受的文件 MIME（默认 image/*） */
  accept?: string;
  /** 上传成功提示文案；默认 `${label}上传成功` */
  successMessage?: string;
}

/**
 * 通用单图上传组件 — 复用 /uploads/images 通用图片上传端点（{@link uploadImage}）。
 *
 * <p>替代 EnterpriseAgentForm 中私有的 BusinessLicenseUploader，机构 Logo /
 * 营业执照等单图场景统一使用本组件。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-22 16:00
 */
export default function SingleImageUploader({
  value,
  onChange,
  label,
  accept = 'image/*',
  successMessage,
}: SingleImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
      toast.success(successMessage || `${label}上传成功`);
    } catch {
      toast.error('上传失败，请稍后重试');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  if (value) {
    return (
      <div className="flex items-start gap-3">
        <div className="relative size-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className="size-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-red-500"
            aria-label={`移除${label}`}
          >
            <X className="size-3.5" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-sm text-primary hover:underline disabled:opacity-50"
        >
          {uploading ? '正在上传…' : '重新上传'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 px-6 py-8 w-fit min-w-[160px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <>
            <Loader2 className="size-6 text-primary animate-spin" />
            <span className="text-sm text-gray-500">正在上传…</span>
          </>
        ) : (
          <>
            <Upload className="size-6 text-slate-400" />
            <span className="text-sm text-gray-500">点击上传{label}</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </>
  );
}
