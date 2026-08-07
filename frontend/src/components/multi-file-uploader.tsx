'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, X, Play, ImageIcon, Film, Loader2 } from 'lucide-react';
import { authHeaders, getAccessToken } from '@/lib/auth/token';

export interface UploadedFile {
  /** 后端文件记录 ID（已有文件才有） */
  id?: number;
  fileType: number;
  fileUrl: string;
  thumbnailUrl?: string;
  title?: string;
  width?: number;
  height?: number;
  duration?: number;
  fileSize?: number;
  sortOrder?: number;
}

interface MultiFileUploaderProps {
  files: UploadedFile[];
  onAdd: (file: UploadedFile) => void;
  onRemove: (index: number, file: UploadedFile) => void;
  disabled?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

async function uploadFile(file: File, isVideo: boolean): Promise<string> {
  if (!getAccessToken()) {
    throw new Error('登录已过期，请重新登录');
  }
  const formData = new FormData();
  formData.append('file', file);
  const endpoint = isVideo ? '/uploads/videos' : '/uploads/images';
  const resp = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  if (!resp.ok) throw new Error('上传失败');
  const json = await resp.json() as { data: { url: string } };
  return json.data.url;
}

function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

/**
 * 多文件上传组件，支持图片和视频，展示已上传文件网格，支持删除。
 */
export function MultiFileUploader({ files, onAdd, onRemove, disabled }: MultiFileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);

  const handleFiles = useCallback(async (selectedFiles: FileList) => {
    setUploading(true);
    setUploadCount(selectedFiles.length);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      try {
        const isVideo = isVideoFile(file);
        const url = await uploadFile(file, isVideo);
        onAdd({
          fileType: isVideo ? 2 : 1,
          fileUrl: url,
          thumbnailUrl: isVideo ? '' : url,
          title: file.name,
          fileSize: file.size,
          sortOrder: files.length + i,
        });
      } catch {
        console.error(`上传文件 ${file.name} 失败`);
      }
      setUploadCount(selectedFiles.length - i - 1);
    }

    setUploading(false);
    setUploadCount(0);
    if (inputRef.current) inputRef.current.value = '';
  }, [files.length, onAdd]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || uploading) return;
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled, uploading, handleFiles]);

  return (
    <div className="space-y-3">
      {/* 已上传文件网格 */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {files.map((file, idx) => (
            <div
              key={`${file.fileUrl}-${idx}`}
              className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
            >
              {file.fileType === 2 ? (
                <div className="size-full flex items-center justify-center bg-slate-900">
                  {file.thumbnailUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={file.thumbnailUrl}
                        alt={file.title || ''}
                        className="size-full object-cover opacity-60"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="size-8 text-white fill-white/80" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-white/60">
                      <Film className="size-8" />
                      <span className="text-[10px]">视频</span>
                    </div>
                  )}
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.thumbnailUrl || file.fileUrl}
                  alt={file.title || ''}
                  className="size-full object-cover"
                />
              )}

              {/* 删除按钮 */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onRemove(idx, file)}
                  className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <X className="size-3.5" />
                </button>
              )}

              {/* 文件类型标识 */}
              <div className="absolute bottom-1 left-1">
                {file.fileType === 2 ? (
                  <Film className="size-3.5 text-white drop-shadow" />
                ) : (
                  <ImageIcon className="size-3.5 text-white drop-shadow" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 上传区域 */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 px-4 transition-colors cursor-pointer ${
          disabled || uploading
            ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
            : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/30'
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="size-8 text-blue-500 animate-spin" />
            <span className="text-sm text-slate-500">
              正在上传... 剩余 {uploadCount} 个文件
            </span>
          </>
        ) : (
          <>
            <Upload className="size-8 text-slate-400" />
            <span className="text-sm text-slate-500">
              点击或拖拽上传图片/视频
            </span>
            <span className="text-xs text-slate-400">
              支持 JPG、PNG、GIF、MP4、MOV 等格式
            </span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
          }
        }}
      />
    </div>
  );
}
