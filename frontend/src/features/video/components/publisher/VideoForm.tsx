'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import RichTextEditor from '@/components/rich-text-editor';
import { getVideoCategoryTree } from '@/features/video/api/service';
import { uploadImage } from '@/features/video/api/publisher-service';
import type {
  VideoType,
  CategoryTreeNode,
  SaveVideoRequest,
  VideoDetail,
} from '@/features/video/api/types';
import { ImagePlus, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoFormProps {
  initialData?: VideoDetail;
  onSubmit: (data: SaveVideoRequest) => Promise<void>;
  submitting?: boolean;
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
  const [uploading, setUploading] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);

  useEffect(() => {
    getVideoCategoryTree().then(setCategories).catch(() => {});
  }, []);

  const handleUploadCover = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setCoverUrl(url);
    } catch {
      alert('封面上传失败');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('请输入视频标题');
      return;
    }
    if (!intro.trim()) {
      alert('请填写视频介绍');
      return;
    }
    const data: SaveVideoRequest = {
      title: title.trim(),
      videoType,
      categoryId: categoryId || undefined,
      subCategoryId: subCategoryId || undefined,
      coverUrl: coverUrl || undefined,
      intro,
      videoUrl: videoType === 'SINGLE' ? videoUrl : undefined,
      externalUrl: videoType === 'EXTERNAL' ? externalUrl : undefined,
      teacherName: teacherName || undefined,
      price: isFree === 1 ? 0 : price,
      isFree,
      keywords: keywords || undefined,
    };
    await onSubmit(data);
  };

  const selectedCatName = categories.find((c) => c.id === categoryId)?.name;

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

      {/* 单个视频URL（SINGLE类型） */}
      {videoType === 'SINGLE' && (
        <div className="flex items-start gap-4">
          <label className="w-24 text-sm text-gray-700 pt-2 text-right shrink-0">视频地址</label>
          <div className="flex-1">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="请输入视频URL"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
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
                onClick={() => setCoverUrl('')}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <label className="w-[200px] h-[150px] border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-colors">
              <input type="file" accept="image/*" onChange={handleUploadCover} className="hidden" />
              {uploading ? (
                <div className="animate-spin rounded-full size-6 border-2 border-primary border-t-transparent" />
              ) : (
                <>
                  <ImagePlus className="size-8 text-slate-400" />
                  <span className="text-xs text-slate-400">选择文件</span>
                </>
              )}
            </label>
          )}
          <p className="text-xs text-slate-400 mt-1">建议尺寸：400 x 300</p>
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
          disabled={submitting}
          className="bg-primary text-white font-medium px-8 py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {submitting ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
}
