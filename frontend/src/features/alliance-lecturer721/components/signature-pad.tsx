'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { resolveImageSrc } from '@/lib/media';

interface SignaturePadProps {
  value?: string;
  error?: string;
  onUploaded: (url: string) => void;
  onClear: () => void;
  upload: (blob: Blob) => Promise<string>;
}

/** 本地 /uploads 走 Next rewrite，勿被 resolveImageSrc 映射到 PXB CDN。 */
function previewSignatureSrc(url: string): string {
  if (url.startsWith('/uploads/')) return url;
  return resolveImageSrc(url, '');
}

/**
 * 点击预览区放大后在弹层画布签字并上传。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:20
 */
export function SignaturePad({
  value,
  error,
  onUploaded,
  onClear,
  upload,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    if (!open) return;
    setHasInk(false);
    setLocalError(null);
    const frame = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    drawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    const point = getPoint(event);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    setHasInk(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const point = getPoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }

  function handlePointerUp() {
    drawingRef.current = false;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    setLocalError(null);
  }

  function handleClearUploaded() {
    onClear();
    setLocalError(null);
  }

  async function handleConfirm() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!hasInk) {
      setLocalError('请先在画布上签字');
      return;
    }
    setUploading(true);
    setLocalError(null);
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (!blob) {
        throw new Error('签字生成失败');
      }
      const url = await upload(blob);
      onUploaded(url);
      setOpen(false);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : '签字上传失败');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex-1">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-32 w-full cursor-pointer flex-col items-center justify-center border border-gray-300 bg-white transition-colors hover:border-[#0066cc] hover:bg-slate-50"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewSignatureSrc(value)}
            alt="已上传签字"
            referrerPolicy="no-referrer"
            className="max-h-full max-w-full object-contain p-2"
          />
        ) : (
          <span className="text-sm text-gray-400">点击放大签字</span>
        )}
      </button>

      <div className="mt-2 flex items-center gap-3 text-sm">
        {value ? (
          <>
            <span className="text-green-700">签字已上传</span>
            <button
              type="button"
              onClick={handleClearUploaded}
              className="cursor-pointer text-[#0066cc] hover:underline"
            >
              清除重签
            </button>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="cursor-pointer text-[#0066cc] hover:underline"
            >
              重新签字
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="cursor-pointer text-[#0066cc] hover:underline"
          >
            点击放大签字
          </button>
        )}
      </div>
      {error || localError ? (
        <p className="mt-1 text-xs text-red-500">{error || localError}</p>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="sm:max-w-3xl"
          showCloseButton={!uploading}
        >
          <DialogHeader>
            <DialogTitle>手写签字</DialogTitle>
            <DialogDescription>
              请在下方放大画布中签字，完成后点击确认上传。
            </DialogDescription>
          </DialogHeader>
          <canvas
            ref={canvasRef}
            width={960}
            height={360}
            className="h-[280px] w-full touch-none rounded border border-gray-300 bg-white sm:h-[320px]"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
          {localError ? (
            <p className="text-xs text-red-500">{localError}</p>
          ) : null}
          <DialogFooter className="gap-2 sm:justify-between">
            <button
              type="button"
              disabled={uploading}
              onClick={clearCanvas}
              className="cursor-pointer rounded border border-gray-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              清空重签
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded border border-gray-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={() => void handleConfirm()}
                className="cursor-pointer rounded bg-[#f44336] px-4 py-2 text-sm font-bold text-white hover:bg-[#d32f2f] disabled:opacity-50"
              >
                {uploading ? '上传中...' : '确认签字并上传'}
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
