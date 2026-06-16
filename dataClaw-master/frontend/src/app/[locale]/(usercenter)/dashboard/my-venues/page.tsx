'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  MapPin, Plus, Edit, Trash2, Loader2, X, Power, ImagePlus, Upload,
} from 'lucide-react';
import RegionCascader from '@/components/region-cascader';
import {
  listMyVenues,
  createVenue,
  updateVenue,
  toggleVenueStatus,
  deleteVenue,
  type VenueItem,
  type VenuePayload,
} from '@/features/venue/api/service';
import { uploadImage } from '@/features/course/api/publisher-service';

const MAX_IMAGES = 9;

/**
 * 我的场地 — 培训机构视角
 *
 * @author Fangxinxin
 * @date 2026-04-21 17:30
 */
export default function MyVenuesPage() {
  const [items, setItems] = useState<VenueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VenueItem | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listMyVenues());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async (v: VenueItem) => {
    try {
      await toggleVenueStatus(v.id);
      toast.success('状态已更新');
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleDelete = async (v: VenueItem) => {
    if (!confirm(`确定要删除场地「${v.name}」吗？`)) return;
    try {
      await deleteVenue(v.id);
      toast.success('已删除');
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleEdit = (v: VenueItem) => {
    setEditing(v);
    setShowDialog(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setShowDialog(true);
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-800">我的场地</h2>
          <span className="text-xs text-gray-400">{items.length} 个</span>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" />
          新增场地
        </button>
      </div>

      <div className="px-6 pb-6 pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <MapPin className="size-12 mb-3 text-gray-300" />
            <p className="text-sm">暂无场地，点击右上角添加</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((v) => (
              <VenueCard
                key={v.id}
                venue={v}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>

      {showDialog && (
        <VenueDialog
          venue={editing}
          onClose={() => setShowDialog(false)}
          onSaved={() => {
            setShowDialog(false);
            fetchData();
          }}
        />
      )}
    </section>
  );
}

function VenueCard({
  venue, onEdit, onDelete, onToggle,
}: {
  venue: VenueItem;
  onEdit: (v: VenueItem) => void;
  onDelete: (v: VenueItem) => void;
  onToggle: (v: VenueItem) => void;
}) {
  const enabled = venue.status === 1;
  const region = [venue.provinceName, venue.cityName, venue.districtName].filter(Boolean).join(' / ');
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <div className="aspect-video bg-slate-100 relative">
        {venue.coverUrl ? (
          <Image src={venue.coverUrl} alt={venue.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <MapPin className="size-10" />
          </div>
        )}
        <span
          className={`absolute top-2 right-2 text-[11px] px-2 py-0.5 rounded-full ${
            enabled
              ? 'bg-green-50 text-green-600 border border-green-100'
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}
        >
          {enabled ? '启用中' : '已停用'}
        </span>
        {venue.images && venue.images.length > 1 && (
          <span className="absolute bottom-2 right-2 text-[11px] px-2 py-0.5 rounded-full bg-black/50 text-white">
            +{venue.images.length - 1}
          </span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <div className="font-medium text-gray-800 truncate">{venue.name}</div>
        {region && <div className="text-xs text-gray-500 mt-1 truncate">{region}</div>}
        {venue.address && <div className="text-xs text-gray-500 mt-0.5 truncate">{venue.address}</div>}
        {venue.capacity && <div className="text-xs text-gray-500 mt-0.5">容纳 {venue.capacity} 人</div>}
        {venue.description && (
          <div className="text-xs text-gray-500 mt-1 line-clamp-2">{venue.description}</div>
        )}
        <div className="mt-3 flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={() => onToggle(venue)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-slate-200 text-gray-600 hover:bg-slate-50 transition-colors"
          >
            <Power className="size-3.5" />
            {enabled ? '停用' : '启用'}
          </button>
          <button
            type="button"
            onClick={() => onEdit(venue)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-slate-200 text-gray-600 hover:bg-slate-50 transition-colors"
          >
            <Edit className="size-3.5" />
            编辑
          </button>
          <button
            type="button"
            onClick={() => onDelete(venue)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="size-3.5" />
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

interface RegionValue {
  provinceId?: number;
  provinceName?: string;
  cityId?: number;
  cityName?: string;
  districtId?: number;
  districtName?: string;
}

function VenueDialog({
  venue, onClose, onSaved,
}: {
  venue: VenueItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(venue?.name ?? '');
  const [address, setAddress] = useState(venue?.address ?? '');
  const [capacity, setCapacity] = useState<string>(venue?.capacity ? String(venue.capacity) : '');
  // 多图上传：images[0] 默认作为封面
  const initialImages = venue?.images && venue.images.length > 0
    ? venue.images
    : (venue?.coverUrl ? [venue.coverUrl] : []);
  const [images, setImages] = useState<string[]>(initialImages);
  const [description, setDescription] = useState(venue?.description ?? '');
  const [sortOrder, setSortOrder] = useState<string>(venue?.sortOrder != null ? String(venue.sortOrder) : '0');
  const [region, setRegion] = useState<RegionValue>({
    provinceId: venue?.provinceId,
    provinceName: venue?.provinceName,
    cityId: venue?.cityId,
    cityName: venue?.cityName,
    districtId: venue?.districtId,
    districtName: venue?.districtName,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('请填写场地名称');
      return;
    }
    const payload: VenuePayload = {
      name: name.trim(),
      provinceId: region.provinceId,
      cityId: region.cityId,
      districtId: region.districtId,
      address: address.trim() || undefined,
      capacity: capacity ? Number(capacity) : undefined,
      coverUrl: images[0] || undefined,
      images: images.length > 0 ? images : undefined,
      description: description.trim() || undefined,
      sortOrder: sortOrder ? Number(sortOrder) : 0,
    };
    setSubmitting(true);
    try {
      if (venue) {
        await updateVenue(venue.id, payload);
        toast.success('已更新');
      } else {
        await createVenue(payload);
        toast.success('已新增');
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[88vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">{venue ? '编辑场地' : '新增场地'}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="size-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <Field label="场地名称 *">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="例如：上海徐汇主会场"
            />
          </Field>
          <Field label="所在地区">
            <RegionCascader
              value={region}
              onChange={(v) => setRegion(v)}
              maxLevel={3}
            />
          </Field>
          <Field label="详细地址">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={500}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="街道、楼宇号等"
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="容纳人数">
              <input
                type="number"
                min={0}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </Field>
            <Field label="排序值（越大越靠前）">
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </Field>
          </div>
          <Field label={`场地图片（最多 ${MAX_IMAGES} 张，第 1 张作为封面）`}>
            <VenueImageUploader value={images} onChange={setImages} max={MAX_IMAGES} />
          </Field>
          <Field label="简介">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="场地特色、配套设施等"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </Field>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="inline-flex items-center gap-1 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

/**
 * 场地多图上传器：复用通用 /uploads/images，使用 FileReader 即时预览，
 * 支持选中多文件、删除、调整封面（点击非首张图“设为封面”）。
 */
function VenueImageUploader({
  value, onChange, max,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  max: number;
}) {
  const [uploading, setUploading] = useState(false);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    const remaining = max - value.length;
    if (remaining <= 0) {
      toast.error(`最多上传 ${max} 张`);
      return;
    }
    const toUpload = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.warning(`仅上传前 ${remaining} 张，超出已忽略`);
    }
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of toUpload) {
        try {
          const url = await uploadImage(f);
          urls.push(url);
        } catch {
          toast.error(`「${f.name}」上传失败`);
        }
      }
      if (urls.length > 0) onChange([...value, ...urls]);
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const moveToFront = (idx: number) => {
    if (idx <= 0) return;
    const next = [...value];
    const [picked] = next.splice(idx, 1);
    next.unshift(picked);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {value.map((url, idx) => (
          <div
            key={`${url}-${idx}`}
            className="relative group aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
          >
            <Image src={url} alt={`图${idx + 1}`} fill className="object-cover" />
            {idx === 0 && (
              <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-primary text-white">
                封面
              </span>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {idx > 0 && (
                <button
                  type="button"
                  onClick={() => moveToFront(idx)}
                  className="text-[11px] px-2 py-1 rounded bg-white/90 text-gray-700 hover:bg-white"
                >
                  设为封面
                </button>
              )}
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="text-[11px] px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
              >
                删除
              </button>
            </div>
          </div>
        ))}

        {value.length < max && (
          <label
            className={`aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
              uploading ? 'border-slate-200 text-gray-300' : 'border-slate-300 text-gray-400 hover:border-primary/50 hover:text-primary'
            }`}
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <Upload className="size-5" />
                <span className="text-xs">添加图片</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              disabled={uploading}
              onChange={handlePick}
            />
          </label>
        )}
      </div>
      <div className="text-xs text-gray-400 flex items-center gap-1">
        <ImagePlus className="size-3.5" />
        已选 {value.length}/{max} 张；第一张为封面，鼠标悬停可调整。
      </div>
    </div>
  );
}
