'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import SingleImageUploader from '@/features/role-apply/components/SingleImageUploader';
import { resolveImageSrc } from '@/lib/media';
import type { TrainerBookFormItem } from '../api/types';

interface TrainerBooksEditorProps {
  value: TrainerBookFormItem[];
  onChange: (next: TrainerBookFormItem[]) => void;
}

const EMPTY_BOOK: TrainerBookFormItem = {
  title: '',
  authorName: '',
  coverUrl: '',
  publisher: '',
  publishDate: '',
  description: '',
  buyUrl: '',
};

/**
 * 申请表单内嵌「我的著作」编辑器
 *
 * <p>负责维护本地数组 {@code formData.books}；新增 / 编辑通过 dialog 完成，
 * 删除直接从数组移除。提交时由父组件透传给后端 apply 接口整体替换。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-21 22:30
 */
export function TrainerBooksEditor({ value, onChange }: TrainerBooksEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<TrainerBookFormItem>(EMPTY_BOOK);
  const [open, setOpen] = useState(false);

  const openCreate = () => {
    setEditingIndex(null);
    setDraft({ ...EMPTY_BOOK });
    setOpen(true);
  };

  const openEdit = (index: number) => {
    setEditingIndex(index);
    setDraft({ ...EMPTY_BOOK, ...value[index] });
    setOpen(true);
  };

  const remove = (index: number) => {
    const next = value.slice();
    next.splice(index, 1);
    onChange(next);
  };

  const submit = () => {
    if (!draft.title?.trim()) return;
    const item: TrainerBookFormItem = {
      title: draft.title.trim(),
      authorName: draft.authorName?.trim() || '',
      coverUrl: draft.coverUrl?.trim() || '',
      publisher: draft.publisher?.trim() || '',
      publishDate: draft.publishDate || '',
      description: draft.description?.trim() || '',
      buyUrl: draft.buyUrl?.trim() || '',
    };
    if (editingIndex == null) {
      onChange([...value, item]);
    } else {
      const next = value.slice();
      next[editingIndex] = item;
      onChange(next);
    }
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <BookOpen className="mx-auto size-6 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">尚未添加著作，可以从这里开始添加</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-3 inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-white hover:bg-primary/90"
          >
            <Plus className="size-3.5" />
            添加著作
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {value.map((book, idx) => (
              <div
                key={`${idx}-${book.title}`}
                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-primary/40"
              >
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100">
                  {book.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveImageSrc(book.coverUrl, '')}
                      alt={book.title}
                      className="size-full object-cover"
                    />
                  ) : (
                    <BookOpen className="size-5 text-gray-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-900">
                    {book.title}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-gray-500">
                    {book.authorName && <span>{book.authorName}</span>}
                    {book.publisher && <span>{book.publisher}</span>}
                    {book.publishDate && <span>{book.publishDate}</span>}
                  </div>
                  {book.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                      {book.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(idx)}
                    className="inline-flex size-7 items-center justify-center rounded text-gray-500 transition-colors hover:bg-slate-100 hover:text-primary"
                    aria-label="编辑"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="inline-flex size-7 items-center justify-center rounded text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
                    aria-label="删除"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-dashed border-slate-300 px-3 text-xs font-medium text-gray-600 transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Plus className="size-3.5" />
            添加著作
          </button>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingIndex == null ? '添加著作' : '编辑著作'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="book-title">书名 *</Label>
              <Input
                id="book-title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="请输入书名"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="book-author">作者</Label>
              <Input
                id="book-author"
                value={draft.authorName || ''}
                onChange={(e) => setDraft({ ...draft, authorName: e.target.value })}
                placeholder="请输入作者姓名"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="book-publisher">出版社</Label>
                <Input
                  id="book-publisher"
                  value={draft.publisher || ''}
                  onChange={(e) => setDraft({ ...draft, publisher: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="book-date">出版日期</Label>
                <Input
                  id="book-date"
                  type="date"
                  value={draft.publishDate || ''}
                  onChange={(e) => setDraft({ ...draft, publishDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>封面图</Label>
              <SingleImageUploader
                label="著作封面"
                value={draft.coverUrl || ''}
                onChange={(url) => setDraft({ ...draft, coverUrl: url })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="book-buy">购买链接</Label>
              <Input
                id="book-buy"
                value={draft.buyUrl || ''}
                onChange={(e) => setDraft({ ...draft, buyUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="book-desc">简介</Label>
              <Textarea
                id="book-desc"
                rows={3}
                value={draft.description || ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="简短介绍这本著作（选填）"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={submit} disabled={!draft.title?.trim()}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
