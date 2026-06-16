'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  uploadMaterial
} from '../api/service';
import { materialKeys } from '../api/queries';
import type { Material } from '../api/types';

type MaterialFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialType: MaterialType;
  editData?: Material | null;
};

export function MaterialFormDialog({
  open,
  onOpenChange,
  materialType,
  editData
}: MaterialFormDialogProps) {
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
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setUrl(editData.url);
      setCategory(editData.category || '其它');
      setScene(editData.scene);
      setEnabled(editData.enabled);
      setIsDefault(editData.isDefault);
      setPendingFile(null);
    } else {
      setName('');
      setUrl('');
      setCategory('其它');
      setScene(materialType === 'COVER' ? 'GENERAL' : 'TRAINER');
      setEnabled(true);
      setIsDefault(false);
      setPendingFile(null);
    }
  }, [editData, open, materialType]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) {
        throw new Error('请输入 1-50 字符的素材名称');
      }
      if (!isEdit && !pendingFile && !url) {
        throw new Error('请上传素材图片');
      }

      let finalUrl = url;
      if (pendingFile) {
        if (isEdit) {
          finalUrl = await uploadImageFile(pendingFile);
        } else {
          return uploadMaterial({
            file: pendingFile,
            materialType,
            name: name.trim(),
            category: materialType === 'COVER' ? category : undefined,
            scene,
            enabled,
            isDefault
          });
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
      toast.success(isEdit ? '已更新' : '已新增');
      onOpenChange(false);
      void queryClient.invalidateQueries({ queryKey: materialKeys.all });
    },
    onError: (err: Error) => toast.error(err.message || '保存失败')
  });

  const previewUrl = pendingFile
    ? URL.createObjectURL(pendingFile)
    : url
      ? resolveAssetUrl(url)
      : '';

  const sceneOptions =
    materialType === 'COVER' ? COVER_SCENE_OPTIONS : AVATAR_SCENE_OPTIONS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑素材' : '新增素材'}</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label>素材名称</Label>
            <Input
              value={name}
              maxLength={50}
              placeholder='如：销售管理课程封面-1'
              onChange={(e) => setName(e.target.value)}
            />
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
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) {
                  toast.error('请上传 JPG/PNG 格式、大小 ≤2MB 的图片');
                  e.target.value = '';
                  return;
                }
                setPendingFile(file);
                if (!name) setName(file.name.replace(/\.[^.]+$/, ''));
                e.target.value = '';
              }}
            />
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
                {isEdit ? '更换图片' : '上传图片'}
              </Button>
            </div>
            <p className='text-muted-foreground text-xs'>
              {materialType === 'COVER'
                ? 'JPG/PNG，建议 1280×720，单文件 ≤2MB'
                : 'JPG/PNG，建议 400×400，单文件 ≤2MB'}
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
