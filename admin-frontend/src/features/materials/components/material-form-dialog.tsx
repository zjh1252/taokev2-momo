'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { resolveAssetUrl } from '@/lib/resolve-asset-url';
import {
  AVATAR_SCENE_OPTIONS,
  COVER_CATEGORY_OPTIONS,
  COVER_SCENE_OPTIONS,
  type MaterialType
} from '../constants';
import {
  createMaterial,
  updateMaterial,
  uploadImageFile,
  uploadMaterial,
  uploadMaterials
} from '../api/service';
import { materialKeys } from '../api/queries';
import type { Material } from '../api/types';
import {
  MAX_BATCH_FILES,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_MB,
  stripExtension,
  type PendingMaterial
} from '../material-utils';

type MaterialFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialType: MaterialType;
  editData?: Material | null;
  draftItem?: PendingMaterial | null;
  onDraftSave?: (item: PendingMaterial) => void;
};

function buildBatchName(baseName: string, index: number, total: number): string {
  const trimmed = baseName.trim();
  if (!trimmed) return '';
  if (total <= 1) return trimmed.slice(0, 50);
  const suffix = `-${index + 1}`;
  const maxBase = 50 - suffix.length;
  return `${trimmed.slice(0, maxBase)}${suffix}`;
}

export function MaterialFormDialog({
  open,
  onOpenChange,
  materialType,
  editData,
  draftItem,
  onDraftSave
}: MaterialFormDialogProps) {
  const isDraft = !!draftItem;
  const isEdit = !!editData;
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('其它');
  const [scene, setScene] = useState(
    materialType === 'COVER' ? 'GENERAL' : 'TRAINER'
  );
  const [enabled, setEnabled] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  useEffect(() => {
    if (draftItem) {
      setName(draftItem.name);
      setUrl('');
      setCategory(draftItem.category || '其它');
      setScene(draftItem.scene);
      setEnabled(draftItem.enabled);
      setIsDefault(draftItem.isDefault);
      setPendingFiles([draftItem.file]);
    } else if (editData) {
      setName(editData.name);
      setUrl(editData.url);
      setCategory(editData.category || '其它');
      setScene(editData.scene);
      setEnabled(editData.enabled);
      setIsDefault(editData.isDefault);
      setPendingFiles([]);
    } else {
      setName('');
      setUrl('');
      setCategory('其它');
      setScene(materialType === 'COVER' ? 'GENERAL' : 'TRAINER');
      setEnabled(true);
      setIsDefault(false);
      setPendingFiles([]);
    }
  }, [draftItem, editData, open, materialType]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) {
        throw new Error('请输入 1-50 字符的素材名称');
      }
      if (isDraft && draftItem && onDraftSave) {
        onDraftSave({
          ...draftItem,
          name: name.trim().slice(0, 50),
          category: materialType === 'COVER' ? category : '',
          scene,
          enabled,
          isDefault,
          file: pendingFiles[0] ?? draftItem.file
        });
        return null;
      }
      if (!isEdit && !isDraft && pendingFiles.length === 0 && !url) {
        throw new Error('请上传素材图片');
      }

      let finalUrl = url;
      if (pendingFiles.length > 0) {
        if (isEdit) {
          finalUrl = await uploadImageFile(pendingFiles[0]);
        } else if (pendingFiles.length === 1) {
          return uploadMaterial({
            file: pendingFiles[0],
            materialType,
            name: (name.trim() || stripExtension(pendingFiles[0].name)).slice(0, 50),
            category: materialType === 'COVER' ? category : undefined,
            scene,
            enabled,
            isDefault
          });
        } else {
          const payloads = pendingFiles.map((file, index) => ({
            file,
            materialType,
            name: (
              buildBatchName(name, index, pendingFiles.length)
              || stripExtension(file.name)
            ).slice(0, 50),
            category: materialType === 'COVER' ? category : undefined,
            scene,
            enabled,
            isDefault: isDefault && index === 0
          }));
          await uploadMaterials(payloads);
          return null;
        }
      }

      if (isEdit) {
        return updateMaterial(editData!.id, {
          name: name.trim(),
          url: finalUrl,
          category: materialType === 'COVER' ? category : '',
          scene,
          enabled,
          isDefault
        });
      }

      return createMaterial({
        materialType,
        name: name.trim(),
        url: finalUrl,
        category: materialType === 'COVER' ? category : '',
        scene,
        enabled,
        isDefault
      });
    },
    onSuccess: () => {
      if (isDraft) {
        toast.success('已更新');
        onOpenChange(false);
        return;
      }
      const batchCount = !isEdit && pendingFiles.length > 1 ? pendingFiles.length : 0;
      toast.success(
        batchCount > 0 ? `已新增 ${batchCount} 个素材` : isEdit ? '已更新' : '已新增'
      );
      onOpenChange(false);
      void queryClient.invalidateQueries({ queryKey: materialKeys.all });
    },
    onError: (err: Error) => toast.error(err.message || '保存失败')
  });

  const previewUrl = pendingFiles[0]
    ? URL.createObjectURL(pendingFiles[0])
    : url
      ? resolveAssetUrl(url)
      : '';

  const sceneOptions =
    materialType === 'COVER' ? COVER_SCENE_OPTIONS : AVATAR_SCENE_OPTIONS;

  const handleFilesSelected = (files: FileList | null) => {
    if (!files?.length) return;
    const valid: File[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} 超过 ${MAX_FILE_SIZE_MB}MB，已跳过`);
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;

    if (isEdit || isDraft) {
      setPendingFiles([valid[0]]);
      if (!name) setName(stripExtension(valid[0].name));
      return;
    }

    const merged = [...pendingFiles, ...valid].slice(0, MAX_BATCH_FILES);
    if (merged.length < pendingFiles.length + valid.length) {
      toast.error(`最多批量上传 ${MAX_BATCH_FILES} 张`);
    }
    setPendingFiles(merged);
    if (!name && merged.length === 1) {
      setName(stripExtension(merged[0].name));
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {isEdit || isDraft ? '编辑素材' : '新增素材'}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label>素材名称</Label>
            <Input
              value={name}
              maxLength={50}
              placeholder={
                !isEdit && !isDraft && pendingFiles.length > 1
                  ? '批量时作为名称前缀，如：销售管理课程封面'
                  : '如：销售管理课程封面-1'
              }
              onChange={(e) => setName(e.target.value)}
            />
            {!isEdit && !isDraft && pendingFiles.length > 1 ? (
              <p className='text-muted-foreground text-xs'>
                已选 {pendingFiles.length} 张，将自动命名为「前缀-1」「前缀-2」…；未填前缀则用文件名
              </p>
            ) : null}
          </div>

          {materialType === 'COVER' ? (
            <div className='space-y-2'>
              <Label>素材分类</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder='请选择分类' />
                </SelectTrigger>
                <SelectContent>
                  {COVER_CATEGORY_OPTIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className='space-y-2'>
              <Label>素材类型</Label>
              <Select value={scene} onValueChange={setScene}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVATAR_SCENE_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {materialType === 'COVER' ? (
            <div className='space-y-2'>
              <Label>适用场景</Label>
              <Select value={scene} onValueChange={setScene}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sceneOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className='space-y-2'>
            <Label>素材文件</Label>
            <input
              ref={inputRef}
              type='file'
              accept='image/jpeg,image/png,image/jpg'
              className='hidden'
              multiple={!isEdit && !isDraft}
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                e.target.value = '';
              }}
            />
            {!isEdit && !isDraft && pendingFiles.length > 1 ? (
              <div className='grid max-h-48 grid-cols-4 gap-2 overflow-y-auto rounded-md border p-2'>
                {pendingFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className='relative'>
                    <div
                      className={`relative overflow-hidden border bg-muted ${
                        materialType === 'AVATAR'
                          ? 'aspect-square rounded-full'
                          : 'aspect-[5/3] rounded-md'
                      }`}
                    >
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        fill
                        className='object-cover'
                        unoptimized
                      />
                    </div>
                    <button
                      type='button'
                      className='bg-background/90 absolute -right-1 -top-1 rounded-full border p-0.5'
                      onClick={() => removePendingFile(index)}
                      aria-label='移除'
                    >
                      <Icons.close className='size-3' />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex items-start gap-3'>
                {previewUrl ? (
                  <div
                    className={`relative shrink-0 overflow-hidden border bg-muted ${
                      materialType === 'AVATAR'
                        ? 'h-24 w-24 rounded-full'
                        : 'h-24 w-40 rounded-md'
                    }`}
                  >
                    <Image
                      src={previewUrl}
                      alt='预览'
                      fill
                      className='object-cover'
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className='bg-muted text-muted-foreground flex h-24 w-40 items-center justify-center rounded-md text-xs'>
                    暂无预览
                  </div>
                )}
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => inputRef.current?.click()}
                >
                  {isEdit || isDraft
                    ? '更换图片'
                    : pendingFiles.length > 0
                      ? '继续添加'
                      : '上传图片（可多选）'}
                </Button>
              </div>
            )}
            <p className='text-muted-foreground text-xs'>
              {materialType === 'COVER'
                ? `JPG/PNG，建议 1280×720，单文件 ≤${MAX_FILE_SIZE_MB}MB，最多批量 20 张`
                : `JPG/PNG，建议 400×400，单文件 ≤${MAX_FILE_SIZE_MB}MB，最多批量 20 张`}
            </p>
          </div>

          <div className='flex items-center justify-between'>
            <Label>状态</Label>
            <div className='flex items-center gap-2'>
              <span className='text-sm'>{enabled ? '已启用' : '已禁用'}</span>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>

          <div className='flex items-center justify-between'>
            <Label>
              {materialType === 'COVER' ? '设为平台默认封面' : '设为平台默认头像'}
            </Label>
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
          </div>
          {!isEdit && pendingFiles.length > 1 && isDefault ? (
            <p className='text-muted-foreground text-xs'>
              批量上传时仅第一张会设为默认素材
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            isLoading={mutation.isPending}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
