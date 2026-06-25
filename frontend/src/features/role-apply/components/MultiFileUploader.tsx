'use client';

import { useRef, useState } from 'react';
import { FileText, ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImage, uploadCourseMaterial } from '@/features/course/api/publisher-service';
import type { TrainerHonorFileItem } from '../api/types';

export interface MultiFileUploaderProps {
  /** 已上传文件列表 */
  value: TrainerHonorFileItem[];
  /** 列表变化回调（新增/移除） */
  onChange: (files: TrainerHonorFileItem[]) => void;
  /** 接受的文件 MIME（默认图片 + PDF） */
  accept?: string;
  /** 最多可上传文件数（默认 10） */
  maxCount?: number;
}

const DEFAULT_ACCEPT = 'image/*,application/pdf';
const MAX_SIZE_MB = 20;

function isImage(file: File): boolean {
  return file.type.startsWith('image/');
}

function isPdf(file: File): boolean {
  return file.type === 'application/pdf';
}

/**
 * 通用多文件上传组件 — 支持图片与 PDF 混合上传，最多 {@link MultiFileUploaderProps.maxCount} 个。
 *
 * <p>图片走 /uploads/images，PDF 走 /uploads/files；返回 {name,url} 列表。
 * 用于专家申请「荣誉与资质」等多附件场景。</p>
 *
 * @author Fangxinxin
 * @date 2026-06-02 10:40
 */
export default function MultiFileUploader({
  value,
  onChange,
  accept = DEFAULT_ACCEPT,
  maxCount = 10,
}: MultiFileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList) => {
    const picked = Array.from(files);
    if (value.length + picked.length > maxCount) {
      toast.error(`最多上传 ${maxCount} 个文件`);
      return;
    }
    setUploading(true);
    const uploaded: TrainerHonorFileItem[] = [];
    try {
      for (const file of picked) {
        if (!isImage(file) && !isPdf(file)) {
          toast.error(`「${file.name}」格式不支持，仅支持图片或 PDF`);
          continue;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          toast.error(`「${file.name}」超过 ${MAX_SIZE_MB}MB`);
          continue;
        }
        const url = isImage(file) ? await uploadImage(file, file.name) : await uploadCourseMaterial(file);
        uploaded.push({ name: file.name, url });
      }
      if (uploaded.length) {
        onChange([...value, ...uploaded]);
        toast.success(`已上传 ${uploaded.length} 个文件`);
      }
    } catch {
      toast.error('上传失败，请稍后重试');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((f, idx) => {
            const pdf = /\.pdf($|\?)/i.test(f.url) || /\.pdf$/i.test(f.name);
            return (
              <li
                key={`${f.url}-${idx}`}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              >
                {pdf ? (
                  <FileText className="size-5 shrink-0 text-red-500" />
                ) : (
                  <ImageIcon className="size-5 shrink-0 text-primary" />
                )}
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 truncate text-sm text-gray-700 hover:text-primary hover:underline"
                >
                  {f.name || f.url}
                </a>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  aria-label={`移除${f.name}`}
                >
                  <X className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {value.length < maxCount && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 px-6 py-6 w-fit min-w-[180px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="size-6 text-primary animate-spin" />
              <span className="text-sm text-gray-500">正在上传…</span>
            </>
          ) : (
            <>
              <Upload className="size-6 text-slate-400" />
              <span className="text-sm text-gray-500">点击上传（图片 / PDF，可多选）</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
      />
    </div>
  );
}
