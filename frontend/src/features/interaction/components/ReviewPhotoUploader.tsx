'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImage } from '@/features/course/api/publisher-service';
import { resolveImageSrc } from '@/lib/media';

const MAX_PHOTOS = 9;

interface ReviewPhotoUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}

/**
 * 评价配图上传 — 最多 9 张，复用通用图片上传端点。
 */
export function ReviewPhotoUploader({ value, onChange, disabled }: ReviewPhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0 || disabled) return;

    const remaining = MAX_PHOTOS - value.length;
    if (remaining <= 0) {
      toast.error(`最多上传 ${MAX_PHOTOS} 张`);
      return;
    }

    const toUpload = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.warning(`仅上传前 ${remaining} 张，超出已忽略`);
    }

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of toUpload) {
        try {
          const url = await uploadImage(file);
          urls.push(url);
        } catch {
          toast.error(`「${file.name}」上传失败`);
        }
      }
      if (urls.length > 0) onChange([...value, ...urls]);
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((url, idx) => (
          <div
            key={`${url}-${idx}`}
            className="relative size-20 rounded-md overflow-hidden border border-slate-200 bg-slate-100"
          >
            <Image
              src={resolveImageSrc(url, '')}
              alt={`配图${idx + 1}`}
              fill
              className="object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="absolute top-0.5 right-0.5 size-5 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                aria-label="删除"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        ))}
        {!disabled && value.length < MAX_PHOTOS && (
          <label
            className={`size-20 rounded-md border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-0.5 text-slate-400 transition-colors ${
              uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50 hover:text-primary'
            }`}
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <Plus className="size-5" />
                <span className="text-[10px]">上传</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePick}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        选填，最多 {MAX_PHOTOS} 张培训现场照片
      </p>
    </div>
  );
}
