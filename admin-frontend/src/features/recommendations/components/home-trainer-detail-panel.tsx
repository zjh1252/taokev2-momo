'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { uploadImageFile } from '@/features/materials/api/service';
import { resolveAssetUrl } from '@/lib/resolve-asset-url';
import { resolveRecommendationDetailPath } from '../api/detail-path';
import type { RecommendedResourceItem } from '../api/types';
import type { updateRecommendation } from '../api/service';
import { HOME_TRAINER_FIXED_EXPERTS } from '../constants/home-trainer-fixed';
import {
  formatListedAt,
  resolveChiefIntro,
  resolveOneLineIntro,
  resolvePositionTitle,
  resolveTrainerCoverUrl,
  type HomeTrainerFixedLocks,
  type HomeTrainerSelection
} from '../utils/home-trainer-layout';

type DetailForm = {
  title: string;
  description: string;
  chiefIntro: string;
  expertiseOverride: string;
  keyTags: string;
  adminNote: string;
  coverUrl: string;
};

type Props = {
  selection: HomeTrainerSelection | null;
  managedItems: RecommendedResourceItem[];
  locks: HomeTrainerFixedLocks;
  slotLabel: string;
  detailPathTemplate: string;
  isSaving: boolean;
  isSavingLocks: boolean;
  onSave: (payload: Parameters<typeof updateRecommendation>[1]) => void;
  onLocksChange: (locks: HomeTrainerFixedLocks) => void;
};

export function HomeTrainerDetailPanel({
  selection,
  managedItems,
  locks,
  slotLabel,
  detailPathTemplate,
  isSaving,
  isSavingLocks,
  onSave,
  onLocksChange
}: Props) {
  const [form, setForm] = useState<DetailForm>({
    title: '',
    description: '',
    chiefIntro: '',
    expertiseOverride: '',
    keyTags: '',
    adminNote: '',
    coverUrl: ''
  });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const managedItem =
    selection?.kind === 'managed'
      ? (managedItems.find((item) => item.id === selection.id) ?? null)
      : null;

  const fixedExpert =
    selection?.kind === 'fixed' ? HOME_TRAINER_FIXED_EXPERTS[selection.slot] : null;

  const isFixedSelection = selection?.kind === 'fixed';
  const fixedSlot = selection?.kind === 'fixed' ? selection.slot : null;
  const showChiefIntro =
    fixedSlot === 'main' ||
    (managedItem !== null &&
      managedItems[0]?.id === managedItem.id &&
      !locks.main);

  useEffect(() => {
    if (fixedExpert) {
      setForm({
        title: fixedExpert.title,
        description: fixedExpert.subtitle || fixedExpert.bio,
        chiefIntro: fixedExpert.chiefIntro,
        expertiseOverride: fixedExpert.expertise,
        keyTags: fixedExpert.keyTags,
        adminNote: fixedExpert.adminNote,
        coverUrl: fixedExpert.coverUrl
      });
      return;
    }

    if (managedItem) {
      setForm({
        title: resolvePositionTitle(managedItem),
        description: resolveOneLineIntro(managedItem),
        chiefIntro: resolveChiefIntro(managedItem),
        expertiseOverride: managedItem.expertiseOverride ?? managedItem.resourceMeta ?? '',
        keyTags: managedItem.keyTags ?? '',
        adminNote: managedItem.adminNote ?? '',
        coverUrl: managedItem.coverUrl ?? managedItem.resourceCoverUrl ?? ''
      });
      return;
    }

    setForm({
      title: '',
      description: '',
      chiefIntro: '',
      expertiseOverride: '',
      keyTags: '',
      adminNote: '',
      coverUrl: ''
    });
  }, [fixedExpert, managedItem]);

  if (!selection) {
    return (
      <div className='text-muted-foreground rounded-lg border border-dashed p-6 text-sm'>
        选择预览区中的推荐项，在此编辑运营覆盖字段
      </div>
    );
  }

  const resourceName = fixedExpert?.name ?? managedItem?.resourceName ?? '';
  const resourceId = fixedExpert?.id ?? managedItem?.resourceId ?? 0;
  const listedAt = fixedExpert?.listedAt ?? formatListedAt(managedItem?.createdAt);
  const displayPosition = slotLabelForSelection(selection, slotLabel, locks);
  const coverPreview = form.coverUrl.trim()
    ? resolveAssetUrl(form.coverUrl)
    : managedItem
      ? resolveTrainerCoverUrl(managedItem)
      : fixedExpert
        ? resolveAssetUrl(fixedExpert.coverUrl)
        : '';

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      setForm((prev) => ({ ...prev, coverUrl: url }));
    } finally {
      setUploading(false);
    }
  };

  const handleLockToggle = (slot: 'main' | 'middle', checked: boolean) => {
    onLocksChange({
      ...locks,
      [slot]: checked
    });
  };

  return (
    <div className='rounded-lg border p-4'>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <h3 className='font-semibold'>推荐详情区</h3>
        {isFixedSelection ? (
          <span className='text-muted-foreground text-xs'>固定大卡展示默认专家，可在下方切换固定开关</span>
        ) : null}
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <div className='space-y-2'>
          <Label>专家名称</Label>
          <div className='bg-muted rounded-md px-3 py-2 text-sm'>
            {isFixedSelection ? (
              <span>{resourceName}</span>
            ) : (
              <Link
                href={resolveRecommendationDetailPath(detailPathTemplate, resourceId)}
                className='text-primary hover:underline'
              >
                {resourceName}
              </Link>
            )}
          </div>
        </div>

        <div className='space-y-2'>
          <Label>显示位置</Label>
          <div className='bg-muted rounded-md px-3 py-2 text-sm'>{displayPosition}</div>
        </div>

        {fixedSlot === 'main' || fixedSlot === 'middle' ? (
          <div className='flex items-center justify-between rounded-md border px-3 py-2 md:col-span-2'>
            <div>
              <p className='text-sm font-medium'>
                {fixedSlot === 'main' ? '左侧大卡固定展示' : '中间大卡固定展示'}
              </p>
              <p className='text-muted-foreground text-xs'>
                关闭后该位置由推荐列表中的专家按从左到右顺序填充
              </p>
            </div>
            <Switch
              checked={locks[fixedSlot]}
              disabled={isSavingLocks}
              onCheckedChange={(checked) => handleLockToggle(fixedSlot, checked)}
            />
          </div>
        ) : null}

        <div className='space-y-2'>
          <Label>擅长领域</Label>
          <Input
            value={form.expertiseOverride}
            disabled={isFixedSelection}
            onChange={(e) => setForm((prev) => ({ ...prev, expertiseOverride: e.target.value }))}
            placeholder='如：人力资源'
          />
        </div>

        <div className='space-y-2'>
          <Label>关键标签</Label>
          <Input
            value={form.keyTags}
            disabled={isFixedSelection}
            onChange={(e) => setForm((prev) => ({ ...prev, keyTags: e.target.value }))}
            placeholder='多个标签用逗号分隔'
          />
        </div>

        <div className='space-y-2 md:col-span-2'>
          <Label>定位/头衔</Label>
          <Input
            value={form.title}
            disabled={isFixedSelection}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder='如：阿里巴巴首任 COO'
          />
        </div>

        <div className='space-y-2 md:col-span-2'>
          <Label>描述</Label>
          <Textarea
            rows={2}
            value={form.description}
            disabled={isFixedSelection}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder='专家详情页名称后的一句话简介，无则留空'
          />
          {!isFixedSelection && managedItem && !managedItem.description && !form.description ? (
            <p className='text-muted-foreground text-xs'>
              当前专家档案未填写一句话简介
            </p>
          ) : null}
        </div>

        {showChiefIntro ? (
          <div className='space-y-2 md:col-span-2'>
            <Label>首席简介</Label>
            <Textarea
              rows={4}
              value={form.chiefIntro}
              disabled={isFixedSelection}
              onChange={(e) => setForm((prev) => ({ ...prev, chiefIntro: e.target.value }))}
              placeholder='首席大卡长文案，首页按卡片尺寸截断展示'
            />
          </div>
        ) : null}

        <div className='space-y-2 md:col-span-2'>
          <Label>备注</Label>
          <Textarea
            rows={2}
            value={form.adminNote}
            disabled={isFixedSelection}
            onChange={(e) => setForm((prev) => ({ ...prev, adminNote: e.target.value }))}
            placeholder='推荐理由等，仅后台可见'
          />
        </div>

        <div className='space-y-2 md:col-span-2'>
          <Label>推荐封面</Label>
          <div className='flex flex-wrap items-center gap-2'>
            <Input
              value={form.coverUrl}
              disabled={isFixedSelection}
              onChange={(e) => setForm((prev) => ({ ...prev, coverUrl: e.target.value }))}
              placeholder='封面 URL，留空则使用专家头像'
              className='min-w-[240px] flex-1'
            />
            {coverPreview ? (
              <Button type='button' variant='outline' size='sm' asChild>
                <a href={coverPreview} target='_blank' rel='noreferrer'>
                  查看
                </a>
              </Button>
            ) : null}
            {!isFixedSelection ? (
              <>
                <input
                  ref={fileRef}
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUpload(file);
                    e.target.value = '';
                  }}
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  isLoading={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  <Icons.upload className='mr-1 h-3.5 w-3.5' />
                  上传
                </Button>
              </>
            ) : null}
          </div>
          {coverPreview ? (
            <div className='mt-2 h-24 w-40 overflow-hidden rounded-md border'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverPreview}
                alt='推荐封面预览'
                className='h-full w-full object-cover'
              />
            </div>
          ) : null}
        </div>

        <div className='space-y-2'>
          <Label>上架时间</Label>
          <div className='bg-muted rounded-md px-3 py-2 text-sm'>{listedAt}</div>
        </div>
      </div>

      {!isFixedSelection ? (
        <div className='mt-4 flex justify-end'>
          <Button
            isLoading={isSaving}
            onClick={() =>
              onSave({
                title: form.title || undefined,
                description: form.description || undefined,
                chiefIntro: form.chiefIntro || undefined,
                expertiseOverride: form.expertiseOverride || undefined,
                keyTags: form.keyTags || undefined,
                adminNote: form.adminNote || undefined,
                coverUrl: form.coverUrl || undefined
              })
            }
          >
            保存推荐详情
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function slotLabelForSelection(
  selection: HomeTrainerSelection,
  slotLabel: string,
  locks: HomeTrainerFixedLocks
): string {
  if (selection.kind === 'fixed') {
    if (selection.slot === 'main') {
      return locks.main
        ? `${slotLabel} · 左侧首席大卡（固定）`
        : `${slotLabel} · 左侧首席大卡`;
    }
    return locks.middle
      ? `${slotLabel} · 中间深色大卡（固定）`
      : `${slotLabel} · 中间深色大卡`;
  }
  return `${slotLabel} · 推荐位专家`;
}
