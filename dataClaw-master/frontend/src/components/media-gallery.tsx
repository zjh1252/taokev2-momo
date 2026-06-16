'use client';

import { useCallback, useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';

export interface MediaGalleryItem {
  url: string;
  thumbnailUrl?: string | null;
  type: 'image' | 'video';
}

interface MediaGalleryProps {
  files: MediaGalleryItem[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

/**
 * 全屏灯箱组件，支持图片浏览和视频播放、键盘/鼠标导航。
 */
export function MediaGallery({ files, initialIndex = 0, open, onClose }: MediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : files.length - 1));
  }, [files.length]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i < files.length - 1 ? i + 1 : 0));
  }, [files.length]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, goPrev, goNext]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open || files.length === 0) return null;

  const current = files[currentIndex];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/90">
      {/* 顶栏 */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm">
          {currentIndex + 1} / {files.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 hover:bg-white/20 transition-colors"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* 主展示区 */}
      <div className="relative flex-1 flex items-center justify-center min-h-0 px-12">
        {/* 左箭头 */}
        {files.length > 1 && (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 z-10 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/25 transition-colors"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}

        {/* 内容 */}
        <div className="flex items-center justify-center w-full h-full">
          {current.type === 'video' ? (
            <video
              key={current.url}
              src={current.url}
              controls
              autoPlay
              className="max-h-full max-w-full rounded"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.url}
              alt=""
              className="max-h-full max-w-full object-contain rounded"
            />
          )}
        </div>

        {/* 右箭头 */}
        {files.length > 1 && (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 z-10 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/25 transition-colors"
          >
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>

      {/* 底部缩略图导航 */}
      {files.length > 1 && (
        <div className="flex items-center justify-center gap-2 px-4 py-3 overflow-x-auto">
          {files.map((file, idx) => (
            <button
              key={`${file.url}-${idx}`}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`relative flex-shrink-0 size-14 rounded overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? 'border-white opacity-100'
                  : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.thumbnailUrl || file.url}
                alt=""
                className="size-full object-cover"
              />
              {file.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="size-4 text-white fill-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
