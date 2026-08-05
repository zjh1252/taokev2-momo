'use client';

import { useState, useEffect, useCallback } from 'react';
import { SafeImage } from '@/components/safe-image';
import { DEFAULT_VIDEO_COVER } from '@/lib/media';
import RichTextEditor from '@/components/rich-text-editor';
import { getVideoCategoryTree } from '@/features/video/api/service';
import {
  deleteVideoChapter,
  uploadImage,
  uploadVideoFile,
  validateVideoFile,
  VIDEO_UPLOAD_HINT,
} from '@/features/video/api/publisher-service';
import { extractVideoFirstFrame } from '@/features/video/lib/extract-first-frame';
import { MaterialPickerButton } from '@/features/ops-material/components/MaterialPickerButton';
import type {
  VideoType,
  CategoryTreeNode,
  SaveVideoRequest,
  VideoDetail,
  VideoChapter,
} from '@/features/video/api/types';
import { VideoStatus } from '@/features/video/api/types';
import { ImagePlus, X, ChevronDown, Film, CheckCircle, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VideoFormProps {
  initialData?: VideoDetail;
  onSubmit: (data: SaveVideoRequest, videoFiles?: UploadedVideoItem[]) => Promise<void>;
  submitting?: boolean;
}

/** 多文件上传项 */
export interface UploadedVideoItem {
  fileName: string;
  url: string;
}

type SeriesVideoItem = {
  fileName: string;
  url: string;
  uploading: boolean;
  progress: number;
  /** 已有章节 ID，编辑模式下删除时需调用后端 */
  existingChapterId?: number;
};

const VIDEO_TYPES: { value: VideoType; label: string }[] = [
  { value: 'SERIES', label: '多节视频' },
  { value: 'SINGLE', label: '单个视频' },
  { value: 'EXTERNAL', label: '外部网页视频' },
];

function collectExistingChapters(detail: VideoDetail): VideoChapter[] {
  if (detail.standaloneChapters?.length) {
    return detail.standaloneChapters;
  }
  return detail.seriesList?.flatMap((s) => s.chapters ?? []) ?? [];
}

function buildInitialSeriesVideos(detail?: VideoDetail): SeriesVideoItem[] {
  if (!detail || detail.videoType !== 'SERIES') return [];
  return collectExistingChapters(detail).map((ch) => ({
    fileName: ch.title,
    url: ch.videoUrl,
    uploading: false,
    progress: 100,
    existingChapterId: ch.id,
  }));
}

/**
 * 录播课创建/编辑表单
 */
export default function VideoForm({ initialData, onSubmit, submitting }: VideoFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [videoType, setVideoType] = useState<VideoType>(initialData?.videoType || 'SERIES');
  const [categoryId, setCategoryId] = useState<number>(initialData?.categoryId || 0);
  const [subCategoryId, setSubCategoryId] = useState<number>(initialData?.subCategoryId || 0);
  const [coverUrl, setCoverUrl] = useState(initialData?.coverUrl || '');
  const [intro, setIntro] = useState(initialData?.intro || '');
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl || '');
  const [externalUrl, setExternalUrl] = useState(initialData?.externalUrl || '');
  const [teacherName, setTeacherName] = useState(initialData?.teacherName || '');
  const [price, setPrice] = useState(initialData?.price || 0);
  const [isFree, setIsFree] = useState(initialData?.isFree || 0);
  const [capEnabled, setCapEnabled] = useState(
    () => (initialData?.companyPrice ?? 0) > 0 || (initialData?.maxPurchaseQty ?? 0) > 0,
  );
  const [companyPrice, setCompanyPrice] = useState(initialData?.companyPrice || 0);
  const [maxPurchaseQty, setMaxPurchaseQty] = useState(initialData?.maxPurchaseQty || 20);
  const [capPreset, setCapPreset] = useState<string>(() => {
    const qty = initialData?.maxPurchaseQty;
    if (!qty || qty <= 0) return 'unlimited';
    if (qty === 20) return '20';
    if (qty === 40) return '40';
    if (qty === 100) return '100';
    return 'custom';
  });
  const [keywords, setKeywords] = useState(initialData?.keywords || '');

  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);

  /**
   * 用户是否手动上传/调整过封面。一旦为 true，
   * 后续视频上传不再覆盖封面（避免冲掉用户的选择）。
   */
  const [coverManual, setCoverManual] = useState<boolean>(!!initialData?.coverUrl);
  /** 自动抽帧封面状态：避免重复触发 */
  const [autoCoverGenerating, setAutoCoverGenerating] = useState(false);

  // SINGLE 类型：单个视频
  const [uploadingSingleVideo, setUploadingSingleVideo] = useState(false);
  const [singleVideoFileName, setSingleVideoFileName] = useState('');
  const [singleVideoProgress, setSingleVideoProgress] = useState(0);

  // SERIES 类型：多个视频
  const [seriesVideos, setSeriesVideos] = useState<SeriesVideoItem[]>(
    () => buildInitialSeriesVideos(initialData),
  );

  const canSaveDraft = !initialData
    || initialData.status === VideoStatus.DRAFT
    || initialData.status === VideoStatus.REJECTED;

  useEffect(() => {
    getVideoCategoryTree().then(setCategories).catch(() => {});
  }, []);

  const handleUploadCover = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadImage(file);
      setCoverUrl(url);
      setCoverManual(true);
    } catch {
      toast.error('封面上传失败');
    } finally {
      setUploadingCover(false);
    }
  }, []);

  /**
   * 视频上传成功后，若用户尚未手动设置过封面，自动从首帧抽取并上传作为封面。
   *
   * @param file 本地视频文件，用于抽帧
   */
  const autoGenerateCoverFromVideo = useCallback(async (file: File) => {
    if (coverManual || coverUrl || autoCoverGenerating) return;
    setAutoCoverGenerating(true);
    setUploadingCover(true);
    try {
      const blob = await extractVideoFirstFrame(file);
      const url = await uploadImage(blob, 'video-cover.jpg');
      // 二次校验：如果在抽帧期间用户已手动上传，不要覆盖
      setCoverUrl((prev) => (prev ? prev : url));
      toast.success('已根据视频首帧自动生成封面，可在下方更换');
    } catch (err) {
      // 抽帧失败属于非关键路径，仅做轻提示
      console.warn('自动生成封面失败：', err);
    } finally {
      setAutoCoverGenerating(false);
      setUploadingCover(false);
    }
  }, [coverManual, coverUrl, autoCoverGenerating]);

  const handleUploadSingleVideo = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 上传前先做大小/格式校验，避免传到一半才失败
    const invalid = validateVideoFile(file);
    if (invalid) {
      toast.error(invalid);
      e.target.value = '';
      return;
    }
    setUploadingSingleVideo(true);
    setSingleVideoFileName(file.name);
    setSingleVideoProgress(0);
    // 同时启动首帧抽取（与视频上传并行，互不阻塞）
    void autoGenerateCoverFromVideo(file);
    try {
      const url = await uploadVideoFile(file, setSingleVideoProgress);
      setVideoUrl(url);
    } catch (err) {
      toast.error((err as Error)?.message || '视频上传失败，请检查文件格式和大小');
    } finally {
      setUploadingSingleVideo(false);
    }
  }, [autoGenerateCoverFromVideo]);

  const handleUploadSeriesVideos = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 上传前先批量校验大小/格式，不合格的整批拦截并提示
    const fileList = Array.from(files);
    for (const file of fileList) {
      const invalid = validateVideoFile(file);
      if (invalid) {
        toast.error(invalid);
        e.target.value = '';
        return;
      }
    }

    const startIndex = seriesVideos.length;
    const newItems = fileList.map((f) => ({
      fileName: f.name,
      url: '',
      uploading: true,
      progress: 0,
    }));
    setSeriesVideos((prev) => [...prev, ...newItems]);

    // 当列表为空时，把第一个视频文件作为封面自动抽帧候选
    if (startIndex === 0 && fileList[0]) {
      void autoGenerateCoverFromVideo(fileList[0]);
    }

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const itemIndex = startIndex + i;
      try {
        const url = await uploadVideoFile(file, (percent) => {
          setSeriesVideos((prev) =>
            prev.map((item, idx) =>
              idx === itemIndex ? { ...item, progress: percent } : item,
            ),
          );
        });
        setSeriesVideos((prev) =>
          prev.map((item, idx) =>
            idx === itemIndex ? { ...item, url, uploading: false, progress: 100 } : item,
          ),
        );
      } catch (err) {
        setSeriesVideos((prev) =>
          prev.map((item, idx) =>
            idx === itemIndex ? { ...item, uploading: false } : item,
          ),
        );
        toast.error((err as Error)?.message || `视频 "${file.name}" 上传失败`);
      }
    }
    // 清空 input
    e.target.value = '';
  }, [seriesVideos.length, autoGenerateCoverFromVideo]);

  const removeSeriesVideo = async (idx: number) => {
    const item = seriesVideos[idx];
    if (item?.existingChapterId && initialData?.id) {
      try {
        await deleteVideoChapter(initialData.id, item.existingChapterId);
      } catch {
        toast.error('删除章节失败');
        return;
      }
    }
    setSeriesVideos((prev) => prev.filter((_, i) => i !== idx));
  };

  /**
   * 组装并提交表单。
   *
   * @param draft true=保存草稿（校验标题与封面），false=提交发布（完整校验）
   */
  const submitForm = async (draft: boolean) => {
    if (!title.trim()) {
      toast.warning('请输入视频标题');
      return;
    }
    if (!coverUrl.trim()) {
      toast.warning('请上传录播封面');
      return;
    }
    if (!draft) {
      if (!categoryId) {
        toast.warning('请选择所属分类');
        return;
      }
      if (!intro.trim()) {
        toast.warning('请填写视频介绍');
        return;
      }
      if (isFree === 0 && (!price || price <= 0)) {
        toast.warning('请填写课程价格，或勾选"免费"');
        return;
      }
    }

    const data: SaveVideoRequest = {
      title: title.trim(),
      draft,
      videoType,
      categoryId: categoryId || undefined,
      subCategoryId: subCategoryId || undefined,
      coverUrl: coverUrl || undefined,
      intro,
      videoUrl: videoType === 'SINGLE' ? (videoUrl || undefined) : undefined,
      externalUrl: videoType === 'EXTERNAL' ? externalUrl : undefined,
      teacherName: teacherName || undefined,
      price: isFree === 1 ? 0 : price,
      isFree,
      keywords: keywords || undefined,
      companyPrice: isFree === 1 || !capEnabled ? 0 : companyPrice,
      maxPurchaseQty: isFree === 1 || !capEnabled ? 0 : maxPurchaseQty,
    };

    // SERIES 类型时，将新上传的视频列表传给父组件，由父组件调用批量创建章节
    const uploadedVideos = videoType === 'SERIES'
      ? seriesVideos
        .filter((v) => v.url && !v.uploading && !v.existingChapterId)
        .map((v) => ({ fileName: v.fileName, url: v.url }))
      : undefined;

    await onSubmit(data, uploadedVideos);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm(false);
  };

  const selectedCatName = categories.find((c) => c.id === categoryId)?.name;
  const isAnySeriesUploading = seriesVideos.some((v) => v.uploading);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 声明 */}
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
        声明：请勿发布违法或侵犯他人权利的作品，或广告等垃圾信息，否则你将需要承担相应法律责任
      </div>

      {/* 视频标题 */}
      <div className="flex items-start gap-4">
        <label className="w-24 text-sm text-gray-700 pt-2 text-right shrink-0">
          视频标题 <span className="text-red-500">*</span>
        </label>
        <div className="flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入视频标题"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* 所属分类 */}
      <div className="flex items-start gap-4">
        <label className="w-24 text-sm text-gray-700 pt-2 text-right shrink-0">
          所属分类 <span className="text-red-500">*</span>
        </label>
        <div className="flex-1 relative">
          <button
            type="button"
            onClick={() => setCatDropdownOpen(!catDropdownOpen)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <span className={selectedCatName ? 'text-gray-800' : 'text-gray-400'}>
              {selectedCatName || '请选择所属分类'}
            </span>
            <ChevronDown className="size-4 text-gray-400" />
          </button>
          {catDropdownOpen && (
            <div className="absolute z-50 top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setCategoryId(cat.id); setCatDropdownOpen(false); }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-slate-50',
                    categoryId === cat.id && 'text-primary font-medium bg-primary/5',
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 视频类型 */}
      <div className="flex items-start gap-4">
        <label className="w-24 text-sm text-gray-700 pt-2 text-right shrink-0">
          视频类型 <span className="text-red-500">*</span>
        </label>
        <div className="flex-1 flex items-center gap-4 pt-2">
          {VIDEO_TYPES.map((t) => (
            <label key={t.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="radio"
                name="videoType"
                value={t.value}
                checked={videoType === t.value}
                onChange={() => setVideoType(t.value)}
                className="accent-primary"
              />
              {t.label}
            </label>
          ))}
        </div>
      </div>

      {/* SINGLE 类型 — 单个视频上传 */}
      {videoType === 'SINGLE' && (
        <div className="flex items-start gap-4">
          <label className="w-24 text-sm text-gray-700 pt-2 text-right shrink-0">上传视频</label>
          <div className="flex-1">
            {videoUrl ? (
              <div className="flex items-center gap-3 border border-slate-200 rounded-lg px-4 py-3 bg-slate-50">
                <CheckCircle className="size-5 text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{singleVideoFileName || '已上传视频'}</p>
                  <p className="text-xs text-slate-400 truncate">{videoUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setVideoUrl(''); setSingleVideoFileName(''); }}
                  className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <label className={cn(
                'flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors',
                uploadingSingleVideo ? 'border-primary/40 bg-primary/5' : 'border-slate-300 hover:border-primary',
              )}>
                <input
                  type="file"
                  accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm,video/x-flv,.mp4,.avi,.mov,.wmv,.flv,.mkv,.webm"
                  onChange={handleUploadSingleVideo}
                  className="hidden"
                  disabled={uploadingSingleVideo}
                />
                {uploadingSingleVideo ? (
                  <>
                    <Loader2 className="size-8 text-primary animate-spin" />
                    <span className="text-sm text-primary">
                      正在上传 {singleVideoFileName}... {singleVideoProgress}%
                    </span>
                    <div className="w-full max-w-xs h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${singleVideoProgress}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <Film className="size-8 text-slate-400" />
                    <span className="text-sm text-slate-500">点击选择视频文件</span>
                    <span className="text-xs text-slate-400">{VIDEO_UPLOAD_HINT}</span>
                  </>
                )}
              </label>
            )}
            <p className="text-xs text-slate-400 mt-1.5">也可以直接填写视频URL：</p>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="或输入视频URL地址"
              className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <p className="text-xs text-blue-500 mt-1">保存后将自动生成一个章节</p>
          </div>
        </div>
      )}

      {/* SERIES 类型 — 多视频上传 */}
      {videoType === 'SERIES' && (
        <div className="flex items-start gap-4">
          <label className="w-24 text-sm text-gray-700 pt-2 text-right shrink-0">上传视频</label>
          <div className="flex-1 space-y-3">
            {/* 已上传 / 上传中的列表 */}
            {seriesVideos.length > 0 && (
              <div className="space-y-2">
                {seriesVideos.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 border border-slate-200 rounded-lg px-4 py-2.5 bg-slate-50">
                    {item.uploading ? (
                      <Loader2 className="size-4 text-primary animate-spin shrink-0" />
                    ) : item.url ? (
                      <CheckCircle className="size-4 text-green-500 shrink-0" />
                    ) : (
                      <X className="size-4 text-red-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">
                        章节{idx + 1}：{item.fileName}
                        {item.uploading && (
                          <span className="ml-2 text-xs text-primary">{item.progress}%</span>
                        )}
                      </p>
                      {item.uploading ? (
                        <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      ) : item.url ? (
                        <p className="text-xs text-slate-400 truncate">{item.url}</p>
                      ) : null}
                    </div>
                    {!item.uploading && (
                      <button
                        type="button"
                        onClick={() => removeSeriesVideo(idx)}
                        className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 上传按钮 */}
            <label className={cn(
              'flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors',
              isAnySeriesUploading ? 'border-primary/40 bg-primary/5' : 'border-slate-300 hover:border-primary',
            )}>
              <input
                type="file"
                accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm,video/x-flv,.mp4,.avi,.mov,.wmv,.flv,.mkv,.webm"
                multiple
                onChange={handleUploadSeriesVideos}
                className="hidden"
                disabled={isAnySeriesUploading}
              />
              {isAnySeriesUploading ? (
                <>
                  <Loader2 className="size-8 text-primary animate-spin" />
                  <span className="text-sm text-primary">正在上传...</span>
                </>
              ) : (
                <>
                  <Film className="size-8 text-slate-400" />
                  <span className="text-sm text-slate-500">点击选择多个视频文件</span>
                  <span className="text-xs text-slate-400">
                    每个视频自动生成一个章节；{VIDEO_UPLOAD_HINT}
                  </span>
                </>
              )}
            </label>
            <p className="text-xs text-blue-500">
              保存后，每个视频将自动生成对应章节（章节名 = 标题 - 章节N）
            </p>
          </div>
        </div>
      )}

      {/* 外部链接（EXTERNAL类型） */}
      {videoType === 'EXTERNAL' && (
        <div className="flex items-start gap-4">
          <label className="w-24 text-sm text-gray-700 pt-2 text-right shrink-0">外部链接</label>
          <div className="flex-1">
            <input
              type="text"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="请输入外部网页地址"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
      )}

      {/* 封面图片 */}
      <div className="flex items-start gap-4">
        <label className="w-24 text-sm text-gray-700 pt-2 text-right shrink-0">
          封面图片 <span className="text-red-500">*</span>
        </label>
        <div className="flex-1">
          {coverUrl ? (
            <div className="relative inline-block w-[200px] h-[150px]">
              <SafeImage
                src={coverUrl}
                alt="封面"
                fill
                className="rounded-lg object-cover border border-slate-200"
                fallback={DEFAULT_VIDEO_COVER}
              />
              <button
                type="button"
                onClick={() => {
                  setCoverUrl('');
                  // 移除后允许下一次视频上传重新自动抽帧
                  setCoverManual(false);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <label className="w-[200px] h-[150px] border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-colors">
              <input type="file" accept="image/*" onChange={handleUploadCover} className="hidden" />
              {uploadingCover ? (
                <div className="animate-spin rounded-full size-6 border-2 border-primary border-t-transparent" />
              ) : (
                <>
                  <ImagePlus className="size-8 text-slate-400" />
                  <span className="text-xs text-slate-400">选择文件</span>
                </>
              )}
            </label>
          )}
          <p className="text-xs text-slate-400 mt-1">
            建议尺寸：400 x 300 ；上传视频后将自动取首帧作为封面，您也可手动上传替换。
          </p>
          <div className="mt-2">
            <MaterialPickerButton
              materialType="COVER"
              category={selectedCatName}
              scene="VIDEO"
              onSelect={(url) => {
                setCoverUrl(url);
                setCoverManual(true);
              }}
            />
          </div>
        </div>
      </div>

      {/* 视频介绍 */}
      <div className="flex items-start gap-4">
        <label className="w-24 text-sm text-gray-700 pt-2 text-right shrink-0">
          视频介绍 <span className="text-red-500">*</span>
        </label>
        <div className="flex-1">
          <RichTextEditor value={intro} onChange={setIntro} />
          <p className="text-xs text-slate-400 mt-1">请填写视频的简要介绍，字数为 35 到 400 字符。</p>
        </div>
      </div>

      {/* 授课老师 */}
      <div className="flex items-start gap-4">
        <label className="w-24 text-sm text-gray-700 pt-2 text-right shrink-0">授课老师</label>
        <div className="flex-1">
          <input
            type="text"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            placeholder="请输入授课老师名称"
            className="w-full max-w-sm border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* 视频价格 */}
      <div className="flex items-start gap-4">
        <label className="w-24 text-sm text-gray-700 pt-2 text-right shrink-0">
          视频价格 <span className="text-red-500">*</span>
        </label>
        <div className="flex-1 space-y-3">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isFree === 1}
              onChange={(e) => {
                const free = e.target.checked ? 1 : 0;
                setIsFree(free);
                if (free === 1) setCapEnabled(false);
              }}
              className="accent-primary"
            />
            免费
          </label>
          {isFree === 0 && (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-slate-600">单价：</span>
                <input
                  type="number"
                  value={price || ''}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setPrice(next);
                    if (capEnabled && capPreset !== 'custom' && capPreset !== 'unlimited') {
                      const qty = Number(capPreset);
                      setMaxPurchaseQty(qty);
                      setCompanyPrice(Number((next * qty).toFixed(2)));
                    }
                  }}
                  min={0}
                  step={0.01}
                  placeholder="请输入单价"
                  className="w-32 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <span className="text-sm text-slate-500">元/人/年</span>
              </div>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={capEnabled}
                  onChange={(e) => setCapEnabled(e.target.checked)}
                  className="accent-primary"
                />
                封顶价设置
              </label>
              {capEnabled && (
                <div className="space-y-2 pl-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-slate-600">封顶人数：</span>
                    <select
                      value={capPreset}
                      onChange={(e) => {
                        const preset = e.target.value;
                        setCapPreset(preset);
                        if (preset === 'unlimited') {
                          setMaxPurchaseQty(0);
                          setCompanyPrice(0);
                        } else if (preset === 'custom') {
                          // 保留当前自定义值
                        } else {
                          const qty = Number(preset);
                          setMaxPurchaseQty(qty);
                          setCompanyPrice(Number((price * qty).toFixed(2)));
                        }
                      }}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="unlimited">不限</option>
                      <option value="20">20人封顶</option>
                      <option value="40">40人封顶</option>
                      <option value="100">100人封顶</option>
                      <option value="custom">自定义</option>
                    </select>
                    {capPreset === 'custom' && (
                      <input
                        type="number"
                        min={1}
                        value={maxPurchaseQty || ''}
                        onChange={(e) => {
                          const qty = Number(e.target.value);
                          setMaxPurchaseQty(qty);
                          setCompanyPrice(Number((price * qty).toFixed(2)));
                        }}
                        placeholder="人数"
                        className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>封顶价：</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={companyPrice || ''}
                      onChange={(e) => setCompanyPrice(Number(e.target.value))}
                      className="w-32 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    />
                    <span>元</span>
                    {capPreset !== 'unlimited' && price > 0 && maxPurchaseQty > 0 && (
                      <span className="text-xs text-slate-400">
                        （单价 × {maxPurchaseQty} = {Number((price * maxPurchaseQty).toFixed(2))} 元）
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    封顶价是为批量采购设置的优惠价格；批量采购时总价不超过封顶价，超过封顶人数后也不再额外收费。
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 关键字 */}
      <div className="flex items-start gap-4">
        <label className="w-24 text-sm text-gray-700 pt-2 text-right shrink-0">
          关键字 <span className="text-red-500">*</span>
        </label>
        <div className="flex-1">
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder='多个关键字用","分隔'
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* 提交按钮 */}
      <div className="flex items-center gap-4 pt-4 pl-28">
        {canSaveDraft ? (
          <button
            type="button"
            onClick={() => submitForm(true)}
            disabled={submitting || isAnySeriesUploading}
            className="border border-primary/40 text-primary font-medium px-8 py-2.5 rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            保存草稿
          </button>
        ) : null}
        <button
          type="submit"
          disabled={submitting || isAnySeriesUploading}
          className="bg-primary text-white font-medium px-8 py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {submitting ? '保存中...' : initialData ? '保存并提交审核' : '提交发布'}
        </button>
      </div>
    </form>
  );
}
