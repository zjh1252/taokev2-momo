'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/lib/auth/auth-context';
import { getMyBooks, deleteBook, updateBook } from '@/features/trainer-books/api/service';
import { TrainerSwitcher } from '@/features/binding/components/trainer-switcher';
import { isDelegatingRole, selfPublishingAllowed } from '@/features/binding/lib/delegating-role';
import {
  BookStatus,
  BookStatusLabelMap,
  type TrainerBook,
  type SaveTrainerBookRequest,
} from '@/features/trainer-books/api/types';
import { BookFormFields } from '@/features/trainer-books/components/book-form-fields';
import {
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { validateForm, getFirstError } from '@/lib/validation';
import { BOOK_RULES } from '@/features/trainer-books/components/book-form-fields';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const STATUS_TABS: { label: string; value: number | undefined }[] = [
  { label: '全部', value: undefined },
  { label: '待审核', value: BookStatus.PENDING },
  { label: '已通过', value: BookStatus.APPROVED },
  { label: '已驳回', value: BookStatus.REJECTED },
];

const STATUS_BADGE_STYLES: Record<number, string> = {
  [BookStatus.PENDING]: 'bg-amber-50 text-amber-600',
  [BookStatus.APPROVED]: 'bg-green-50 text-green-600',
  [BookStatus.REJECTED]: 'bg-red-50 text-red-600',
};

export default function ManageBooksPage() {
  const { user, activeRole } = useAuth();
  const showSwitcher = isDelegatingRole(activeRole);
  const hideSelfOption = showSwitcher && !selfPublishingAllowed(activeRole);
  const [activeTab, setActiveTab] = useState<number | undefined>(undefined);
  const [books, setBooks] = useState<TrainerBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [trainerUserId, setTrainerUserId] = useState<number | undefined>(undefined);
  const [editBook, setEditBook] = useState<TrainerBook | null>(null);
  const [editForm, setEditForm] = useState<Partial<SaveTrainerBookRequest>>({});
  const [saving, setSaving] = useState(false);

  const filteredBooks = activeTab === undefined
    ? books
    : books.filter((b) => b.status === activeTab);

  const fetchBooks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await getMyBooks(trainerUserId);
      setBooks(list || []);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [user, trainerUserId]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleConfirmDelete = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await deleteBook(deleteId, trainerUserId);
      setDeleteId(null);
      fetchBooks();
    } catch {
      // 静默处理
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (book: TrainerBook) => {
    setEditBook(book);
    setEditForm({
      title: book.title,
      coverUrl: book.coverUrl,
      publisher: book.publisher,
      publishDate: book.publishDate,
      description: book.description,
      buyUrl: book.buyUrl,
    });
  };

  const handleSaveEdit = async () => {
    if (!editBook) return;
    const validation = validateForm(editForm as SaveTrainerBookRequest, BOOK_RULES);
    if (!validation.valid) {
      toast.error(getFirstError(validation.errors) || '请完善必填信息');
      return;
    }
    setSaving(true);
    try {
      await updateBook(editBook.id, editForm as SaveTrainerBookRequest, trainerUserId);
      toast.success('著作已更新');
      setEditBook(null);
      fetchBooks();
    } catch {
      // 平台层已统一处理错误提示
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-gray-800">管理著作</h2>
        <div className="flex items-center gap-2">
          {showSwitcher && (
            <TrainerSwitcher
              value={trainerUserId}
              hideSelf={hideSelfOption}
              onChange={(uid) => setTrainerUserId(uid)}
            />
          )}
          <Link
            href={trainerUserId
              ? `${ROUTES.UC_BOOKS_CREATE}?trainerUserId=${trainerUserId}`
              : ROUTES.UC_BOOKS_CREATE}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            添加著作
          </Link>
        </div>
      </div>

      <div className="px-6 pt-4 pb-2 flex gap-1 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-3.5 py-1.5 text-sm rounded-full transition-colors',
              activeTab === tab.value
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-gray-600 hover:bg-slate-200',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="animate-spin rounded-full size-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <BookOpen className="size-12 mb-4 text-gray-300" />
            <p className="text-sm">暂无著作</p>
            <Link
              href={ROUTES.UC_BOOKS_CREATE}
              className="mt-4 text-sm text-primary hover:underline"
            >
              去添加第一本著作
            </Link>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {filteredBooks.map((item) => (
              <BookCard
                key={item.id}
                item={item}
                onDelete={(id) => setDeleteId(id)}
                onEdit={openEdit}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定删除？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可恢复，该著作将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editBook !== null} onOpenChange={(open) => { if (!open) setEditBook(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑著作</DialogTitle>
          </DialogHeader>
          <BookFormFields
            form={editForm}
            onChange={(patch) => setEditForm((prev) => ({ ...prev, ...patch }))}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBook(null)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function BookCard({
  item,
  onDelete,
  onEdit,
}: {
  item: TrainerBook;
  onDelete: (id: number) => void;
  onEdit: (book: TrainerBook) => void;
}) {
  const statusLabel = BookStatusLabelMap[item.status] || '未知';
  const badgeStyle = STATUS_BADGE_STYLES[item.status] || 'bg-slate-100 text-slate-600';
  const isPending = item.status === BookStatus.PENDING;
  const isRejected = item.status === BookStatus.REJECTED;
  const canEdit = isPending || isRejected;

  return (
    <div className="border border-slate-200 rounded-lg p-4 flex gap-4 hover:shadow-md transition-shadow">
      <div className="size-16 shrink-0 rounded overflow-hidden bg-slate-100 flex items-center justify-center">
        {item.coverUrl ? (
          <Image src={item.coverUrl} alt={item.title} width={64} height={64} className="object-cover size-full" />
        ) : (
          <BookOpen className="size-6 text-gray-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-gray-800 truncate">{item.title}</h3>
          <span className={cn('text-[11px] px-2 py-0.5 rounded-full shrink-0', badgeStyle)}>
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
          {item.publisher && <span>{item.publisher}</span>}
          {item.publishDate && <span>· {item.publishDate}</span>}
        </div>
        {isRejected && item.rejectReason && (
          <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
            <AlertCircle className="size-3.5" />
            <span>驳回原因：{item.rejectReason}</span>
          </div>
        )}
        <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
          <span>创建于 {item.createdAt?.slice(0, 10)}</span>
          {item.reviewedAt && <span>审核于 {item.reviewedAt.slice(0, 10)}</span>}
        </div>
      </div>

      <div className="flex flex-col gap-2 shrink-0 justify-center">
        {canEdit && (
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-slate-200 text-gray-600 hover:bg-slate-50 transition-colors"
          >
            <Edit className="size-3.5" />
            编辑
          </button>
        )}
        {canEdit && (
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="size-3.5" />
            删除
          </button>
        )}
      </div>
    </div>
  );
}
