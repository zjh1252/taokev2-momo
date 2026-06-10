'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import {
  getVideoSeriesList,
  getMyVideoDetail,
  createVideoSeries,
  updateVideoSeries,
  deleteVideoSeries,
} from '@/features/video/api/publisher-service';
import type { VideoSeries, VideoDetail, SaveVideoSeriesRequest } from '@/features/video/api/types';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Layers,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VideoSeriesManagePage() {
  const params = useParams();
  const videoId = Number(params.id);

  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [seriesList, setSeriesList] = useState<VideoSeries[]>([]);
  const [loading, setLoading] = useState(true);

  // 弹窗控制
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<VideoSeries | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSort, setFormSort] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    try {
      const [v, s] = await Promise.all([
        getMyVideoDetail(videoId),
        getVideoSeriesList(videoId),
      ]);
      setVideo(v);
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
    setEditingSeries(null);
    setFormTitle('');
    setFormDesc('');
    setFormSort(seriesList.length);
    setModalOpen(true);
  };

  const openEdit = (series: VideoSeries) => {
    setEditingSeries(series);
    setFormTitle(series.title);
    setFormDesc(series.description || '');
    setFormSort(series.sortOrder);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      alert('请输入系列名称');
      return;
    }
    setSaving(true);
    try {
      const data: SaveVideoSeriesRequest = {
        title: formTitle.trim(),
        description: formDesc || undefined,
        sortOrder: formSort,
      };
      if (editingSeries) {
        await updateVideoSeries(videoId, editingSeries.id, data);
      } else {
        await createVideoSeries(videoId, data);
      }
      setModalOpen(false);
      fetchData();
    } catch {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (seriesId: number) => {
    if (!confirm('确定要删除此系列吗？系列下的章节将变为独立章节。')) return;
    try {
      await deleteVideoSeries(videoId, seriesId);
      fetchData();
    } catch {
      alert('删除失败');
    }
  };

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
          系列管理
          {video && <span className="font-normal text-gray-500 text-sm ml-2">— {video.title}</span>}
        </h1>
      </div>

      {/* 操作 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">共 {seriesList.length} 个系列</p>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            添加系列
          </button>
        </div>

        {seriesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Layers className="size-12 mb-4 text-gray-300" />
            <p className="text-sm">暂无系列</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {seriesList.map((series) => (
              <div key={series.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800">{series.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>{series.chapterCount || 0} 个章节</span>
                    <span>排序：{series.sortOrder}</span>
                    {series.description && <span className="truncate max-w-xs">{series.description}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(series)}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-slate-200 text-gray-600 hover:bg-slate-50 transition-colors"
                  >
                    <Edit className="size-3.5" />
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(series.id)}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 创建/编辑弹窗 */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">
                {editingSeries ? '编辑系列' : '添加系列'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="text-sm text-gray-700 mb-1 block">
                  系列名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="请输入系列名称"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm text-gray-700 mb-1 block">系列描述</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="可选：输入系列描述"
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
