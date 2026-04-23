'use client';

import { useRef, useState } from 'react';
import { FileText, Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { uploadCertFile } from '@/features/user-center/api/cert-service';

export interface CertFileUploaderProps {
  /** 已上传文件 URL；空字符串表示未上传 */
  value: string;
  /** 上传/移除回调 */
  onChange: (url: string) => void;
  /** 占位文案，例如「身份证人像面」「学历证明」 */
  label: string;
  /** 接受的文件 MIME，默认 image/* */
  accept?: string;
}

/**
 * 资质认证用单文件上传组件 — 自动按 MIME 走 /uploads/images 或 /uploads/files。
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
export function CertFileUploader({
  value,
  onChange,
  label,
  accept = 'image/*',
}: CertFileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadCertFile(file);
      onChange(url);
      toast.success(`${label}上传成功`);
    } catch {
      toast.error(`${label}上传失败，请重试`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const isImage = value && /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(value);

  if (value) {
    return (
      <div className="flex items-start gap-3">
        {isImage ? (
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
        ) : (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm text-slate-700"
          >
            <FileText className="size-4 text-slate-500" />
            <span className="truncate max-w-[180px]">查看已上传文件</span>
          </a>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-sm text-primary hover:underline disabled:opacity-50"
        >
          {uploading ? '正在上传…' : '重新上传'}
        </button>
        {!isImage && (
          <button
            type="button"
            onClick={() => onChange('')}
            disabled={uploading}
            className="text-sm text-red-500 hover:underline disabled:opacity-50"
          >
            移除
          </button>
        )}
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
        className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 px-6 py-6 w-fit min-w-[160px] transition-colors disabled:opacity-50"
      >
        {uploading ? (
          <>
            <Loader2 className="size-6 text-primary animate-spin" />
            <span className="text-sm text-gray-500">正在上传…</span>
          </>
        ) : (
          <>
            {accept.includes('image') ? (
              <ImageIcon className="size-6 text-slate-400" />
            ) : (
              <Upload className="size-6 text-slate-400" />
            )}
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
