'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import RichTextEditor from '@/components/rich-text-editor';
import { getVideoCategoryTree } from '@/features/video/api/service';
import { uploadImage, uploadVideoFile } from '@/features/video/api/publisher-service';
import { extractVideoFirstFrame } from '@/features/video/lib/extract-first-frame';
import type {
  VideoType,
  CategoryTreeNode,
  SaveVideoRequest,
  VideoDetail,
} from '@/features/video/api/types';
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

const VIDEO_TYPES: { value: VideoType; label: string }[] = [
  { value: 'SERIES', label: '多节视频' },
  { value: 'SINGLE', label: '单个视频' },
  { value: 'EXTERNAL', label: '外部网页视频' },
];

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

  // SERIES 类型：多个视频
  const [seriesVideos, setSeriesVideos] = useState<
    { fileName: string; url: string; uploading: boolean }[]
  >([]);

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
    setUploadingSingleVideo(true);
    setSingleVideoFileName(file.name);
    // 同时启动首帧抽取（与视频上传并行，互不阻塞）
    void autoGenerateCoverFromVideo(file);
    try {
      const url = await uploadVideoFile(file);
      setVideoUrl(url);
    } catch {
      toast.error('视频上传失败，请检查文件格式和大小（最大500MB）');
    } finally {
      setUploadingSingleVideo(false);
    }
  }, [autoGenerateCoverFromVideo]);

  const handleUploadSeriesVideos = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const startIndex = seriesVideos.length;
    const newItems = Array.from(files).map((f) => ({
      fileName: f.name,
      url: '',
      uploading: true,
    }));
    setSeriesVideos((prev) => [...prev, ...newItems]);

    // 当列表为空时，把第一个视频文件作为封面自动抽帧候选
    if (startIndex === 0 && files[0]) {
      void autoGenerateCoverFromVideo(files[0]);
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const itemIndex = startIndex + i;
      try {
        const url = await uploadVideoFile(file);
        setSeriesVideos((prev) =>
          prev.map((item, idx) =>
            idx === itemIndex ? { ...item, url, uploading: false } : item,
          ),
        );
      } catch {
        setSeriesVideos((prev) =>
          prev.map((item, idx) =>
            idx === itemIndex ? { ...item, uploading: false } : item,
          ),
        );
        toast.error(`视频 "${file.name}" 上传失败`);
      }
    }
    // 清空 input
    e.target.value = '';
  }, [seriesVideos.length, autoGenerateCoverFromVideo]);

  const removeSeriesVideo = (idx: number) => {
    setSeriesVideos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warning('请输入视频标题');
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

    const data: SaveVideoRequest = {
      title: title.trim(),
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
    };

    // SERIES 类型时，将已上传的视频列表传给父组件，由父组件调用批量创建章节
    const uploadedVideos = videoType === 'SERIES'
      ? seriesVideos.filter((v) => v.url && !v.uploading).map((v) => ({ fileName: v.fileName, url: v.url }))
      : undefined;

    await onSubmit(data, uploadedVideos);
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
              <button
                type="button"
                onClick={() => { setCategoryId(0); setCatDropdownOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
              >
                不选择
              </button>
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
                    <span className="text-sm text-primary">正在上传 {singleVideoFileName}...</span>
                  </>
                ) : (
                  <>
                    <Film className="size-8 text-slate-400" />
                    <span className="text-sm text-slate-500">点击选择视频文件</span>
                    <span className="text-xs text-slate-400">支持 mp4、avi、mov 等，最大 500MB</span>
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
                      </p>
                      {item.url && (
                        <p className="text-xs text-slate-400 truncate">{item.url}</p>
                      )}
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
                    每个视频自动生成一个章节，支持 mp4、avi、mov 等，最大 500MB/个
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
        <label className="w-24 text-sm text-gray-700 pt-2 text-right shrink-0">封面图片</label>
        <div className="flex-1">
          {coverUrl ? (
            <div className="relative inline-block">
              <Image src={coverUrl} alt="封面" width={200} height={150} className="rounded-lg object-cover border border-slate-200" />
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
        <div className="flex-1 flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isFree === 1}
              onChange={(e) => setIsFree(e.target.checked ? 1 : 0)}
              className="accent-primary"
            />
            免费
          </label>
          {isFree === 0 && (
            <>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min={0}
                step={0.01}
                className="w-32 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <span className="text-sm text-slate-500">元/人/年</span>
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
        <button
          type="submit"
          disabled={submitting || isAnySeriesUploading}
          className="bg-primary text-white font-medium px-8 py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {submitting ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
}
