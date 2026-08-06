'use client';

import { useCallback, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Camera, Loader2, RotateCcw, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { SafeImage } from '@/components/safe-image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { uploadImage } from '@/features/course/api/publisher-service';
import { cn } from '@/lib/utils';

/**
 * 通用裁剪上传组件 props。
 *
 * <p>用户选择图片后弹出裁剪窗口（react-easy-crop），可缩放、旋转、切换比例，
 * 确认后把裁剪结果（Blob）走 {@link uploadImage} 上传，上传成功 onChange(url)。</p>
 */
export interface ImageCropperUploaderProps {
  /** 当前已上传图片的 URL */
  value?: string | null;
  /** 上传成功后回调（图片 URL） */
  onChange: (url: string) => void;
  /** 默认裁剪比例，默认 16:9 */
  aspect?: number;
  /** 是否允许用户切换其他比例 / 自由裁剪。默认 true */
  allowFreeAspect?: boolean;
  /** 预览框 className（默认 200x125 4:3） */
  previewClassName?: string;
  /** 顶部标签文案 */
  label?: string;
  /** 文件大小限制（字节），默认 10MB */
  maxSizeBytes?: number;
}

interface AspectOption {
  key: string;
  label: string;
  value: number | undefined;
}

const DEFAULT_ASPECT_OPTIONS: AspectOption[] = [
  { key: '16-9', label: '16:9', value: 16 / 9 },
  { key: '4-3', label: '4:3', value: 4 / 3 },
  { key: '1-1', label: '1:1', value: 1 },
  { key: 'free', label: '自由', value: undefined },
];

/**
 * 把 cropped 区域信息转为 PNG/JPEG Blob。
 */
async function getCroppedBlob(
  imageSrc: string,
  area: Area,
  rotation = 0,
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = imageSrc;
  });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建画布');

  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const bBoxWidth = image.width * cos + image.height * sin;
  const bBoxHeight = image.width * sin + image.height * cos;

  // 旋转 + 平移，避免裁剪后内容缺角
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(radians);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);

  const data = ctx.getImageData(area.x, area.y, area.width, area.height);
  canvas.width = area.width;
  canvas.height = area.height;
  ctx.putImageData(data, 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('裁剪失败'))),
      'image/jpeg',
      0.92,
    );
  });
}

/**
 * 通用图片裁剪上传组件 — 支持缩放 / 旋转 / 多比例切换。
 *
 * @author Fangxinxin
 * @date 2026-04-28 17:00
 */
export function ImageCropperUploader({
  value,
  onChange,
  aspect = 16 / 9,
  allowFreeAspect = true,
  previewClassName = 'w-[200px] h-[125px]',
  label,
  maxSizeBytes = 10 * 1024 * 1024,
}: ImageCropperUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [activeAspect, setActiveAspect] = useState<number | undefined>(aspect);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);

  const aspectOptions = allowFreeAspect
    ? DEFAULT_ASPECT_OPTIONS
    : DEFAULT_ASPECT_OPTIONS.filter((opt) => opt.value !== undefined);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxSizeBytes) {
      toast.error(`图片不能超过 ${Math.round(maxSizeBytes / 1024 / 1024)} MB`);
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(typeof reader.result === 'string' ? reader.result : null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setActiveAspect(aspect);
      setOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, rotation);
      const url = await uploadImage(blob, 'cropped.jpg');
      onChange(url);
      setOpen(false);
      setImageSrc(null);
      toast.success('图片上传成功');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setActiveAspect(aspect);
  };

  return (
    <div className="space-y-2">
      {label && <div className="text-sm text-gray-600">{label}</div>}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'relative rounded border border-dashed border-slate-300 overflow-hidden bg-slate-50 group cursor-pointer',
            previewClassName,
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          {value ? (
            <>
              <SafeImage
                src={value}
                alt={label || '已上传'}
                fill
                sizes="200px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                <Camera className="size-4 mr-1" />
                重新上传
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
              <Upload className="size-5" />
              <span>点击上传</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 text-xs text-slate-500">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded bg-primary text-white hover:bg-primary/90 transition-colors text-xs inline-flex items-center gap-1"
          >
            <Upload className="size-3.5" />
            {value ? '重新上传' : '选择图片'}
          </button>
          <span>支持 JPG / PNG / WEBP，最大 {Math.round(maxSizeBytes / 1024 / 1024)}MB</span>
          <span>选择后可拖拽 / 缩放 / 切换比例</span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <Dialog open={open} onOpenChange={(o) => !uploading && setOpen(o)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>裁剪图片</DialogTitle>
            <DialogDescription>
              拖拽调整位置，使用滑块缩放或旋转，可切换裁剪比例后再确认上传。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="relative w-full bg-slate-900 rounded h-[360px] overflow-hidden">
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={activeAspect}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                  showGrid
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <span className="w-12 shrink-0">缩放</span>
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="w-10 text-right tabular-nums">{zoom.toFixed(2)}x</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <span className="w-12 shrink-0">旋转</span>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="w-10 text-right tabular-nums">{rotation}°</span>
              </label>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">裁剪比例：</span>
              {aspectOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setActiveAspect(opt.value)}
                  className={cn(
                    'px-3 py-1 rounded-full border text-xs transition-colors',
                    activeAspect === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50',
                  )}
                >
                  {opt.label}
                </button>
              ))}
              <button
                type="button"
                onClick={handleReset}
                className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                <RotateCcw className="size-3.5" />
                重置
              </button>
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={uploading}
              className="px-4 py-2 rounded text-sm border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={uploading || !croppedAreaPixels}
              className="inline-flex items-center gap-1 px-4 py-2 rounded text-sm bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {uploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  上传中…
                </>
              ) : (
                '确认上传'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
