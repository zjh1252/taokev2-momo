'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import {
  getVideoChapterList,
  getVideoSeriesList,
  getMyVideoDetail,
  createVideoChapter,
  updateVideoChapter,
  deleteVideoChapter,
} from '@/features/video/api/publisher-service';
import type {
  VideoChapter,
  VideoSeries,
  VideoDetail,
  SaveVideoChapterRequest,
} from '@/features/video/api/types';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Play,
  Eye,
  X,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function VideoChaptersManagePage() {
  const params = useParams();
  const videoId = Number(params.id);

  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [chapters, setChapters] = useState<VideoChapter[]>([]);
  const [seriesList, setSeriesList] = useState<VideoSeries[]>([]);
  const [loading, setLoading] = useState(true);

  // 弹窗控制
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<VideoChapter | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formDuration, setFormDuration] = useState(0);
  const [formSort, setFormSort] = useState(0);
  const [formSeriesId, setFormSeriesId] = useState(0);
  const [formIsPreview, setFormIsPreview] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    try {
      const [v, c, s] = await Promise.all([
        getMyVideoDetail(videoId),
        getVideoChapterList(videoId),
        getVideoSeriesList(videoId),
      ]);
      setVideo(v);
      setChapters(c);
      setSeriesList(s);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingChapter(null);
    setFormTitle('');
    setFormDesc('');
    setFormVideoUrl('');
    setFormDuration(0);
    setFormSort(chapters.length);
    setFormSeriesId(0);
    setFormIsPreview(0);
    setModalOpen(true);
  };

  const openEdit = (ch: VideoChapter) => {
    setEditingChapter(ch);
    setFormTitle(ch.title);
    setFormDesc(ch.description || '');
    setFormVideoUrl(ch.videoUrl || '');
    setFormDuration(ch.duration || 0);
    setFormSort(ch.sortOrder);
    setFormSeriesId(ch.seriesId || 0);
    setFormIsPreview(ch.isPreview || 0);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      alert('请输入章节标题');
      return;
    }
    setSaving(true);
    try {
      const data: SaveVideoChapterRequest = {
        title: formTitle.trim(),
        description: formDesc || undefined,
        videoUrl: formVideoUrl || undefined,
        duration: formDuration || undefined,
        sortOrder: formSort,
        seriesId: formSeriesId || 0,
        isPreview: formIsPreview,
      };
      if (editingChapter) {
        await updateVideoChapter(videoId, editingChapter.id, data);
      } else {
        await createVideoChapter(videoId, data);
      }
      setModalOpen(false);
      fetchData();
    } catch {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (chapterId: number) => {
    if (!confirm('确定要删除此章节吗？')) return;
    try {
      await deleteVideoChapter(videoId, chapterId);
      fetchData();
    } catch {
      alert('删除失败');
    }
  };

  // 按系列分组
  const chaptersBySeriesId: Record<number, VideoChapter[]> = {};
  chapters.forEach((ch) => {
    const sid = ch.seriesId || 0;
    if (!chaptersBySeriesId[sid]) chaptersBySeriesId[sid] = [];
    chaptersBySeriesId[sid].push(ch);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <div className="animate-spin rounded-full size-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.UC_VIDEOS_MANAGE}
          className="text-gray-400 hover:text-primary transition-colors"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">
          章节管理
          {video && <span className="font-normal text-gray-500 text-sm ml-2">— {video.title}</span>}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">共 {chapters.length} 个章节</p>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            添加章节
          </button>
        </div>

        {chapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Play className="size-12 mb-4 text-gray-300" />
            <p className="text-sm">暂无章节</p>
          </div>
        ) : (
          <div className="space-y-0">
            {/* 按系列分组展示 */}
            {seriesList.map((series) => {
              const seriesChapters = chaptersBySeriesId[series.id] || [];
              if (seriesChapters.length === 0) return null;
              return (
                <div key={series.id}>
                  <div className="px-6 py-2.5 bg-slate-50 border-b border-t border-slate-200">
                    <span className="text-sm font-medium text-slate-700">{series.title}</span>
                    <span className="text-xs text-slate-400 ml-2">({seriesChapters.length} 个章节)</span>
                  </div>
                  {seriesChapters.map((ch) => (
                    <ChapterRow key={ch.id} chapter={ch} onEdit={openEdit} onDelete={handleDelete} />
                  ))}
                </div>
              );
            })}

            {/* 独立章节 */}
            {chaptersBySeriesId[0] && chaptersBySeriesId[0].length > 0 && (
              <div>
                {seriesList.length > 0 && (
                  <div className="px-6 py-2.5 bg-slate-50 border-b border-t border-slate-200">
                    <span className="text-sm font-medium text-slate-700">独立章节</span>
                    <span className="text-xs text-slate-400 ml-2">({chaptersBySeriesId[0].length} 个章节)</span>
                  </div>
                )}
                {chaptersBySeriesId[0].map((ch) => (
                  <ChapterRow key={ch.id} chapter={ch} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 创建/编辑弹窗 */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">
                {editingChapter ? '编辑章节' : '添加章节'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-sm text-gray-700 mb-1 block">
                  章节标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="请输入章节标题"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {seriesList.length > 0 && (
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">所属系列</label>
                  <select
                    value={formSeriesId}
                    onChange={(e) => setFormSeriesId(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value={0}>不属于任何系列</option>
                    {seriesList.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-sm text-gray-700 mb-1 block">视频地址</label>
                <input
                  type="text"
                  value={formVideoUrl}
                  onChange={(e) => setFormVideoUrl(e.target.value)}
                  placeholder="请输入视频地址"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="text-sm text-gray-700 mb-1 block">章节描述</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="可选：输入章节描述"
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">时长（秒）</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    min={0}
                    className="w-28 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">排序</label>
                  <input
                    type="number"
                    value={formSort}
                    onChange={(e) => setFormSort(Number(e.target.value))}
                    min={0}
                    className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPreview === 1}
                    onChange={(e) => setFormIsPreview(e.target.checked ? 1 : 0)}
                    className="accent-primary"
                  />
                  允许免费试看
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ChapterRow({
  chapter,
  onEdit,
  onDelete,
}: {
  chapter: VideoChapter;
  onEdit: (ch: VideoChapter) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="px-6 py-3 flex items-center gap-3 border-b border-slate-100 hover:bg-slate-50 transition-colors">
      {chapter.isPreview === 1 ? (
        <Play className="size-4 text-primary shrink-0" />
      ) : (
        <Lock className="size-4 text-slate-300 shrink-0" />
      )}
      <span className="text-sm text-gray-700 flex-1 truncate">{chapter.title}</span>
      {chapter.isPreview === 1 && (
        <span className="text-xs text-primary flex items-center gap-0.5 shrink-0">
          <Eye className="size-3" />
          试看
        </span>
      )}
      {chapter.duration > 0 && (
        <span className="text-xs text-slate-400 shrink-0">{formatDuration(chapter.duration)}</span>
      )}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onEdit(chapter)}
          className="p-1.5 rounded text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
          title="编辑"
        >
          <Edit className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(chapter.id)}
          className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="删除"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
