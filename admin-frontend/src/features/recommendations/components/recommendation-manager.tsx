'use client';

import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { ApiError, assertApiOk } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getTrainers, updateTrainerDetail } from '@/features/trainers/api/service';
import { uploadAvatarFile } from '@/features/materials/api/service';
import { getCourses } from '@/features/courses/api/service';
import { getInstitutions } from '@/features/institutions/api/service';
import { getTrainerCases } from '@/features/trainer-cases/api/service';
import { getCategoryTree } from '@/features/categories/api/service';
import {
  recommendationKeys,
  recommendationSlotConfigQueryOptions,
  recommendationSlotsQueryOptions,
  recommendationsQueryOptions
} from '../api/queries';
import {
  addRecommendation,
  getRecommendationSlots,
  removeRecommendation,
  reorderRecommendations,
  updateRecommendation,
  updateRecommendationSlotConfig
} from '../api/service';
import { resolveRecommendationDetailPath } from '../api/detail-path';
import type { RecommendationManagerConfig, RecommendedResourceItem } from '../api/types';
import { DraggableCandidateRow } from './home-trainer-dnd';
import { HomeTrainerDetailPanel } from './home-trainer-detail-panel';
import { HomeTrainerDndProvider } from './home-trainer-dnd';
import { HomeTrainerPreview, type HomeTrainerSelection } from './home-trainer-preview';
import {
  buildHomeTrainerLayout,
  countManagedSlots,
  HOME_TRAINER_TOTAL_SLOTS,
  reorderManagedIds,
  type HomeTrainerFixedLocks
} from '../utils/home-trainer-layout';

type Props = {
  config: RecommendationManagerConfig;
};

export function RecommendationManager({ config }: Props) {
  const queryClient = useQueryClient();
  const [slotCode, setSlotCode] = useState(config.defaultSlotCode);
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [homeTrainerSelection, setHomeTrainerSelection] =
    useState<HomeTrainerSelection | null>(null);
  const [avatarUploadingId, setAvatarUploadingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [candidatePage, setCandidatePage] = useState(1);
  const [backendWarning, setBackendWarning] = useState<string | null>(null);

  useEffect(() => {
    void getRecommendationSlots(config.resourceType)
      .then((resp) => {
        if (resp.code !== 0) {
          setBackendWarning(
            '推荐 API 未就绪（后端返回异常）。请在 backend 目录执行 mvn clean compile -pl taoke-app -am 并重启 TaokeApplication，确认 Flyway V102 已执行。'
          );
        }
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && (err.status === 404 || err.status === 504)) {
          setBackendWarning(
            '推荐 API 未部署或后端无响应。请重新编译并启动 Java 后端（localhost:8080）。'
          );
        }
      });
  }, [config.resourceType]);

  const { data: slots } = useSuspenseQuery(
    recommendationSlotsQueryOptions(config.resourceType)
  );

  const activeCategoryId =
    slotCode === 'TRAINER_CATEGORY_EXPERT' ? categoryId : undefined;

  const needsCategory = slotCode === 'TRAINER_CATEGORY_EXPERT' && !categoryId;

  const { data: items = [] } = useSuspenseQuery(
    recommendationsQueryOptions(slotCode, activeCategoryId)
  );

  const isHomeTrainerSlot = slotCode === 'HOME_TRAINER';

  const { data: homeSlotConfig } = useSuspenseQuery(
    recommendationSlotConfigQueryOptions('HOME_TRAINER')
  );

  const homeTrainerLocks: HomeTrainerFixedLocks = isHomeTrainerSlot
    ? {
        main: homeSlotConfig.lockMain ?? true,
        middle: homeSlotConfig.lockMiddle ?? true
      }
    : { main: true, middle: true };

  const homeTrainerLayout = isHomeTrainerSlot
    ? buildHomeTrainerLayout(homeTrainerLocks, items)
    : null;
  const homeTrainerManagedItems = homeTrainerLayout?.managedItems ?? [];
  const homeTrainerMaxItems = isHomeTrainerSlot
    ? countManagedSlots(homeTrainerLocks)
    : HOME_TRAINER_TOTAL_SLOTS;

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const selectedManagedItem =
    homeTrainerSelection?.kind === 'managed'
      ? (items.find((item) => item.id === homeTrainerSelection.id) ?? null)
      : null;

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: recommendationKeys.list(slotCode, activeCategoryId)
    });
  };

  const addMutation = useMutation({
    mutationFn: addRecommendation,
    onSuccess: () => {
      toast.success('已加入推荐位');
      invalidate();
    },
    onError: () => toast.error('添加失败')
  });

  const tryAddRecommendation = (resourceId: number, roleType?: 'PRIMARY' | 'BACKUP') => {
    if (isHomeTrainerSlot && homeTrainerManagedItems.length >= homeTrainerMaxItems) {
      toast.error(`当前最多可推荐 ${homeTrainerMaxItems} 位专家`);
      return;
    }
    addMutation.mutate({
      slotCode,
      resourceType: config.resourceType,
      resourceId,
      categoryId: activeCategoryId,
      roleType
    });
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateRecommendation>[1] }) =>
      updateRecommendation(id, payload),
    onSuccess: () => {
      toast.success('推荐详情已保存');
      invalidate();
    },
    onError: () => toast.error('保存失败')
  });

  const removeMutation = useMutation({
    mutationFn: removeRecommendation,
    onSuccess: () => {
      toast.success('已移出推荐位');
      setSelectedId(null);
      setHomeTrainerSelection(null);
      invalidate();
    },
    onError: () => toast.error('移除失败')
  });

  const lockMutation = useMutation({
    mutationFn: (locks: HomeTrainerFixedLocks) =>
      updateRecommendationSlotConfig('HOME_TRAINER', {
        lockMain: locks.main,
        lockMiddle: locks.middle
      }),
    onSuccess: () => {
      toast.success('固定展示设置已更新');
      void queryClient.invalidateQueries({
        queryKey: recommendationKeys.slotConfig('HOME_TRAINER')
      });
    },
    onError: () => toast.error('固定展示设置保存失败')
  });

  const reorderMutation = useMutation({
    mutationFn: reorderRecommendations,
    onSuccess: () => {
      toast.success('排序已更新');
      invalidate();
    },
    onError: () => toast.error('排序失败')
  });

  const avatarMutation = useMutation({
    mutationFn: ({ trainerId, avatarUrl }: { trainerId: number; avatarUrl: string }) =>
      updateTrainerDetail(trainerId, { avatar: avatarUrl }),
    onSuccess: () => {
      toast.success('专家头像已更新');
      invalidate();
    },
    onError: () => toast.error('头像更新失败')
  });

  const handleAvatarUpload = async (resourceId: number, file: File) => {
    setAvatarUploadingId(resourceId);
    try {
      const url = await uploadAvatarFile(file);
      await avatarMutation.mutateAsync({ trainerId: resourceId, avatarUrl: url });
    } catch {
      toast.error('头像上传失败');
    } finally {
      setAvatarUploadingId(null);
    }
  };

  const handleUnfix = (slot: 'main' | 'middle') => {
    lockMutation.mutate({
      ...homeTrainerLocks,
      [slot]: false
    });
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const reorderItems = isHomeTrainerSlot ? homeTrainerManagedItems : items;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= reorderItems.length) return;
    const orderedIds = reorderItems.map((item) => item.id);
    const [moved] = orderedIds.splice(index, 1);
    orderedIds.splice(nextIndex, 0, moved);
    reorderMutation.mutate({
      slotCode,
      categoryId: activeCategoryId,
      orderedIds
    });
  };

  const handleDragReorder = (fromIndex: number, toIndex: number) => {
    const orderedIds = reorderManagedIds(homeTrainerManagedItems, fromIndex, toIndex);
    reorderMutation.mutate({
      slotCode,
      categoryId: activeCategoryId,
      orderedIds
    });
  };

  const handleDropCandidate = async (resourceId: number, targetIndex: number) => {
    const existingIndex = homeTrainerManagedItems.findIndex(
      (item) => item.resourceId === resourceId
    );
    if (existingIndex >= 0) {
      handleDragReorder(existingIndex, targetIndex);
      return;
    }
    if (homeTrainerManagedItems.length >= homeTrainerMaxItems) {
      toast.error(`当前最多可推荐 ${homeTrainerMaxItems} 位专家`);
      return;
    }
    try {
      const resp = await addRecommendation({
        slotCode,
        resourceType: config.resourceType,
        resourceId,
        categoryId: activeCategoryId
      });
      if (resp.code !== 0 || !resp.data) {
        toast.error(resp.message || '添加失败');
        return;
      }
      const orderedIds = homeTrainerManagedItems.map((item) => item.id);
      orderedIds.splice(Math.min(targetIndex, orderedIds.length), 0, resp.data.id);
      await reorderRecommendations({
        slotCode,
        categoryId: activeCategoryId,
        orderedIds
      });
      toast.success('已加入推荐位');
      invalidate();
    } catch {
      toast.error('添加失败');
    }
  };

  const slotLabel = slots.find((s) => s.code === slotCode)?.label ?? slotCode;

  const previewAndDetail = (
    <div className='flex min-h-0 flex-col gap-4'>
      {isHomeTrainerSlot ? (
        <>
          <HomeTrainerPreview
            items={needsCategory ? [] : items}
            locks={homeTrainerLocks}
            selection={homeTrainerSelection}
            onSelect={setHomeTrainerSelection}
            onRemove={(id) => removeMutation.mutate(id)}
            onUnfix={handleUnfix}
            onAvatarUpload={handleAvatarUpload}
            avatarUploadingId={avatarUploadingId}
          />
          <HomeTrainerDetailPanel
            selection={homeTrainerSelection}
            managedItems={homeTrainerManagedItems}
            locks={homeTrainerLocks}
            slotLabel={slotLabel}
            detailPathTemplate={config.detailPathTemplate}
            isSaving={updateMutation.isPending}
            isSavingLocks={lockMutation.isPending}
            onLocksChange={(locks) => lockMutation.mutate(locks)}
            onUnfix={handleUnfix}
            onSaveAvatar={(resourceId, avatarUrl) => {
              avatarMutation.mutate({ trainerId: resourceId, avatarUrl });
            }}
            onSave={(payload) => {
              if (!selectedManagedItem) return;
              updateMutation.mutate({ id: selectedManagedItem.id, payload });
            }}
          />
        </>
      ) : (
        <>
          <PreviewPanel
            slotLabel={slotLabel}
            items={needsCategory ? [] : items}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={moveItem}
            onRemove={(id) => removeMutation.mutate(id)}
            detailPathTemplate={config.detailPathTemplate}
          />
          <DetailPanel
            item={selected}
            slotLabel={slotLabel}
            detailPathTemplate={config.detailPathTemplate}
            isSaving={updateMutation.isPending}
            onSave={(payload) => {
              if (!selected) return;
              updateMutation.mutate({ id: selected.id, payload });
            }}
          />
        </>
      )}
    </div>
  );

  const candidatePanel = (
    <CandidatePanel
      config={config}
      slotCode={slotCode}
      categoryId={activeCategoryId}
      search={search}
      page={candidatePage}
      existingIds={
        isHomeTrainerSlot
          ? homeTrainerManagedItems.map((item) => item.resourceId)
          : items.map((item) => item.resourceId)
      }
      maxItems={isHomeTrainerSlot ? homeTrainerMaxItems : undefined}
      managedCount={isHomeTrainerSlot ? homeTrainerManagedItems.length : undefined}
      enableCandidateDrag={isHomeTrainerSlot}
      onSearchChange={setSearch}
      onPageChange={setCandidatePage}
      onAdd={(resourceId, roleType) => tryAddRecommendation(resourceId, roleType)}
      isAdding={addMutation.isPending}
    />
  );
  return (
    <div className='flex min-h-0 flex-1 flex-col gap-4'>
      {backendWarning ? (
        <div className='rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100'>
          {backendWarning}
        </div>
      ) : null}
      <div className='flex flex-wrap items-center gap-3'>
        <Select
          value={slotCode}
          onValueChange={(value) => {
            setSlotCode(value);
            setSelectedId(null);
            setHomeTrainerSelection(null);
          }}
        >
          <SelectTrigger className='w-[240px]'>
            <SelectValue placeholder='选择推荐位' />
          </SelectTrigger>
          <SelectContent>
            {slots.map((slot) => (
              <SelectItem key={slot.code} value={slot.code}>
                {slot.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {slotCode === 'TRAINER_CATEGORY_EXPERT' ? (
          <CategoryPicker value={categoryId} onChange={setCategoryId} />
        ) : null}
      </div>

      {isHomeTrainerSlot ? (
        <HomeTrainerDndProvider
          onReorder={handleDragReorder}
          onDropCandidate={handleDropCandidate}
        >
          <div className='grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_320px]'>
            {previewAndDetail}
            {candidatePanel}
          </div>
        </HomeTrainerDndProvider>
      ) : (
        <div className='grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_320px]'>
          {previewAndDetail}
          {candidatePanel}
        </div>
      )}
    </div>
  );
}

function CategoryPicker({
  value,
  onChange
}: {
  value?: number;
  onChange: (id: number | undefined) => void;
}) {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    void getCategoryTree('TRAINER_EXPERTISE').then((resp) => {
      const flat: { id: number; name: string }[] = [];
      const walk = (nodes: typeof resp.data, prefix = '') => {
        for (const node of nodes ?? []) {
          const label = prefix ? `${prefix} / ${node.name}` : node.name;
          flat.push({ id: node.id, name: label });
          if (node.children?.length) walk(node.children, label);
        }
      };
      walk(resp.data ?? []);
      setCategories(flat);
    });
  }, []);

  return (
    <Select
      value={value ? String(value) : undefined}
      onValueChange={(v) => onChange(Number(v))}
    >
      <SelectTrigger className='w-[280px]'>
        <SelectValue placeholder='选择擅长领域' />
      </SelectTrigger>
      <SelectContent>
        {categories.map((cat) => (
          <SelectItem key={cat.id} value={String(cat.id)}>
            {cat.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PreviewPanel({
  slotLabel,
  items,
  selectedId,
  onSelect,
  onMove,
  onRemove,
  detailPathTemplate
}: {
  slotLabel: string;
  items: RecommendedResourceItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (id: number) => void;
  detailPathTemplate: string;
}) {
  return (
    <div className='rounded-lg border p-4'>
      <div className='mb-3 flex items-center justify-between'>
        <div>
          <h3 className='font-semibold'>预览区 · {slotLabel}</h3>
          <p className='text-muted-foreground text-xs'>点击卡片查看/编辑推荐详情，可调整顺序</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className='text-muted-foreground flex h-40 items-center justify-center text-sm'>
          {slotLabel.includes('擅长领域') ? '请先选择擅长领域，再从右侧添加专家' : '暂无推荐内容，请从右侧列表添加'}
        </div>
      ) : (
        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
          {items.map((item, index) => (
            <div
              key={item.id}
              role='button'
              tabIndex={0}
              onClick={() => onSelect(item.id)}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(item.id)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                selectedId === item.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
              }`}
            >
              <div className='mb-2 flex items-start justify-between gap-2'>
                <div className='min-w-0 flex-1'>
                  <Link
                    href={resolveRecommendationDetailPath(detailPathTemplate, item.resourceId)}
                    className='text-primary line-clamp-1 font-medium hover:underline'
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.resourceName ?? `#${item.resourceId}`}
                  </Link>
                  {item.roleType === 'BACKUP' ? (
                    <Badge variant='secondary' className='mt-1'>
                      备选
                    </Badge>
                  ) : null}
                </div>
                <div className='flex shrink-0 gap-1'>
                  <Button
                    type='button'
                    size='icon'
                    variant='ghost'
                    className='h-7 w-7'
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMove(index, -1);
                    }}
                  >
                    <Icons.chevronUp className='h-4 w-4' />
                  </Button>
                  <Button
                    type='button'
                    size='icon'
                    variant='ghost'
                    className='h-7 w-7'
                    disabled={index === items.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMove(index, 1);
                    }}
                  >
                    <Icons.chevronDown className='h-4 w-4' />
                  </Button>
                  <Button
                    type='button'
                    size='icon'
                    variant='ghost'
                    className='text-destructive h-7 w-7'
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id);
                    }}
                  >
                    <Icons.trash className='h-4 w-4' />
                  </Button>
                </div>
              </div>
              <p className='text-muted-foreground line-clamp-2 text-xs'>
                {item.description ?? item.resourceDescription ?? '暂无描述'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailPanel({
  item,
  slotLabel,
  detailPathTemplate,
  isSaving,
  onSave
}: {
  item: RecommendedResourceItem | null;
  slotLabel: string;
  detailPathTemplate: string;
  isSaving: boolean;
  onSave: (payload: Parameters<typeof updateRecommendation>[1]) => void;
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    expertiseOverride: '',
    keyTags: '',
    adminNote: ''
  });

  useEffect(() => {
    if (!item) return;
    setForm({
      title: item.title ?? '',
      description: item.description ?? item.resourceDescription ?? '',
      expertiseOverride: item.expertiseOverride ?? item.resourceMeta ?? '',
      keyTags: item.keyTags ?? '',
      adminNote: item.adminNote ?? ''
    });
  }, [item]);

  if (!item) {
    return (
      <div className='text-muted-foreground rounded-lg border border-dashed p-6 text-sm'>
        选择预览区中的推荐项，在此编辑运营覆盖字段
      </div>
    );
  }

  return (
    <div className='rounded-lg border p-4'>
      <h3 className='mb-4 font-semibold'>推荐详情</h3>
      <div className='grid gap-4 md:grid-cols-2'>
        <div className='space-y-2'>
          <Label>资源名称</Label>
          <div className='bg-muted rounded-md px-3 py-2 text-sm'>
            <Link
              href={resolveRecommendationDetailPath(detailPathTemplate, item.resourceId)}
              className='text-primary hover:underline'
            >
              {item.resourceName}
            </Link>
          </div>
        </div>
        <div className='space-y-2'>
          <Label>显示位置</Label>
          <div className='bg-muted rounded-md px-3 py-2 text-sm'>{slotLabel}</div>
        </div>
        <div className='space-y-2 md:col-span-2'>
          <Label>定位/头衔</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder='如：阿里巴巴首任 COO'
          />
        </div>
        <div className='space-y-2'>
          <Label>擅长领域/标签覆盖</Label>
          <Input
            value={form.expertiseOverride}
            onChange={(e) => setForm((prev) => ({ ...prev, expertiseOverride: e.target.value }))}
          />
        </div>
        <div className='space-y-2'>
          <Label>关键标签</Label>
          <Input
            value={form.keyTags}
            onChange={(e) => setForm((prev) => ({ ...prev, keyTags: e.target.value }))}
          />
        </div>
        <div className='space-y-2 md:col-span-2'>
          <Label>描述</Label>
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder='默认填充资源原始简介，可运营覆盖'
          />
        </div>
        <div className='space-y-2 md:col-span-2'>
          <Label>运营备注</Label>
          <Textarea
            rows={2}
            value={form.adminNote}
            onChange={(e) => setForm((prev) => ({ ...prev, adminNote: e.target.value }))}
            placeholder='仅后台可见'
          />
        </div>
      </div>
      <div className='mt-4 flex justify-end'>
        <Button isLoading={isSaving} onClick={() => onSave(form)}>
          保存推荐详情
        </Button>
      </div>
    </div>
  );
}

function CandidatePanel({
  config,
  slotCode,
  categoryId,
  search,
  page,
  existingIds,
  maxItems,
  managedCount,
  enableCandidateDrag,
  onSearchChange,
  onPageChange,
  onAdd,
  isAdding
}: {
  config: RecommendationManagerConfig;
  slotCode: string;
  categoryId?: number;
  search: string;
  page: number;
  existingIds: number[];
  maxItems?: number;
  managedCount?: number;
  enableCandidateDrag?: boolean;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onAdd: (resourceId: number, roleType?: 'PRIMARY' | 'BACKUP') => void;
  isAdding: boolean;
}) {
  const [rows, setRows] = useState<
    { id: number; name: string; meta?: string | null }[]
  >([]);
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (slotCode === 'TRAINER_CATEGORY_EXPERT' && !categoryId) {
        setRows([]);
        setTotal(0);
        setLoadError(null);
        return;
      }

      setLoading(true);
      setLoadError(null);
      try {
        if (config.resourceType === 'TRAINER') {
          const resp = await getTrainers({ page, limit: 10, search: search || undefined, status: '2' });
          const data = assertApiOk(resp);
          setRows(
            (data?.list ?? []).map((t) => ({
              id: t.id,
              name: t.name,
              meta: t.title
            }))
          );
          setTotal(data?.total ?? 0);
          return;
        }

        if (config.resourceType === 'COURSE') {
          const type =
            slotCode === 'HOME_INNER_COURSE'
              ? 'INTERNAL'
              : slotCode === 'HOME_OPEN_COURSE'
                ? 'OPEN_OFFLINE'
                : undefined;
          const resp = await getCourses({
            page,
            limit: 10,
            search: search || undefined,
            status: '2',
            type
          });
          const data = assertApiOk(resp);
          setRows(
            (data?.list ?? []).map((c) => ({
              id: c.id,
              name: c.title,
              meta: c.trainerName
            }))
          );
          setTotal(data?.total ?? 0);
          return;
        }

        if (config.resourceType === 'CASE') {
          const resp = await getTrainerCases({
            page,
            limit: 10,
            status: '1'
          });
          const data = assertApiOk(resp);
          setRows(
            (data?.list ?? []).map((c) => ({
              id: c.id,
              name: c.caseTitle,
              meta: c.industry
            }))
          );
          setTotal(data?.total ?? 0);
          return;
        }

        if (config.resourceType === 'INSTITUTION') {
          const resp = await getInstitutions({ page, limit: 10, search: search || undefined, status: '1' });
          const data = assertApiOk(resp);
          setRows(
            (data?.list ?? []).map((i) => ({
              id: i.id,
              name: i.orgName,
              meta: i.contactName
            }))
          );
          setTotal(data?.total ?? 0);
        }
      } catch (err) {
        let message = err instanceof Error ? err.message : '加载候选资源失败';
        if (err instanceof ApiError && err.status >= 500) {
          message = `${message}。请检查后端日志（/admin 列表接口约 10s 返回 500 多为数据库连接问题）。`;
        }
        setLoadError(message);
        setRows([]);
        setTotal(0);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [config.resourceType, slotCode, categoryId, search, page]);

  const pageCount = Math.max(1, Math.ceil(total / 10));
  const showBackup = slotCode === 'TRAINER_CATEGORY_EXPERT';

  return (
    <div className='flex min-h-0 flex-col rounded-lg border'>
      <div className='space-y-3 border-b p-4'>
        <div>
          <h3 className='font-semibold'>{config.candidateLabel}</h3>
          {maxItems !== undefined ? (
            <p className='text-muted-foreground mt-1 text-xs'>
              取消固定大卡后可配置更多位置；当前已添加 {managedCount ?? existingIds.length}/{maxItems}
              {enableCandidateDrag ? '。可拖动专家到左侧预览区' : ''}
            </p>
          ) : enableCandidateDrag ? (
            <p className='text-muted-foreground mt-1 text-xs'>可拖动专家到左侧预览区</p>
          ) : null}
        </div>
        <Input
          value={search}
          onChange={(e) => {
            onSearchChange(e.target.value);
            onPageChange(1);
          }}
          placeholder='搜索名称…'
        />
      </div>

      <div className='min-h-0 flex-1 overflow-auto'>
        {loading ? (
          <div className='text-muted-foreground p-4 text-sm'>加载中…</div>
        ) : loadError ? (
          <div className='text-destructive p-4 text-sm'>{loadError}</div>
        ) : rows.length === 0 ? (
          <div className='text-muted-foreground p-4 text-sm'>暂无可选资源</div>
        ) : (
          rows.map((row) => {
            const added = existingIds.includes(row.id);
            const slotFull = maxItems !== undefined && existingIds.length >= maxItems;
            const nameBlock = (
              <div className='min-w-0 flex-1'>
                <p className='truncate font-medium'>{row.name}</p>
                {row.meta ? (
                  <p className='text-muted-foreground truncate text-xs'>{row.meta}</p>
                ) : null}
              </div>
            );

            return (
              <div
                key={row.id}
                className='flex items-center gap-2 border-b px-4 py-3 last:border-b-0'
              >
                {enableCandidateDrag ? (
                  <DraggableCandidateRow
                    resourceId={row.id}
                    name={row.name}
                    disabled={slotFull && !added}
                  >
                    {nameBlock}
                  </DraggableCandidateRow>
                ) : (
                  nameBlock
                )}
                <div className='flex shrink-0 gap-1'>
                  {showBackup ? (
                    <Button
                      size='sm'
                      variant='outline'
                      disabled={added || isAdding}
                      onClick={() => onAdd(row.id, 'BACKUP')}
                    >
                      备选
                    </Button>
                  ) : null}
                  <Button
                    size='sm'
                    disabled={added || isAdding || slotFull}
                    onClick={() => onAdd(row.id, 'PRIMARY')}
                  >
                    {added ? '已添加' : slotFull ? '已满' : '推荐'}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className='flex items-center justify-between border-t p-3'>
        <Button
          size='sm'
          variant='outline'
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          上一页
        </Button>
        <span className='text-muted-foreground text-xs'>
          {page} / {pageCount}
        </span>
        <Button
          size='sm'
          variant='outline'
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}
