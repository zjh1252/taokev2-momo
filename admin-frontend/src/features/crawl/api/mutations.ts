import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { crawlKeys } from './queries';
import {
  triggerCrawl,
  cancelCrawlJob,
  importCrawledTrainer,
  rejectCrawledTrainer,
  importCrawledCourse,
  rejectCrawledCourse,
  createCrawlSource,
  updateCrawlSource,
  deleteCrawlSource
} from './service';
import type { SaveCrawlSourcePayload } from './types';

export function useTriggerCrawl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: triggerCrawl,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crawlKeys.all });
    }
  });
}

export function useCancelCrawlJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cancelCrawlJob(id),
    onSuccess: (_, __, context) => {
      qc.invalidateQueries({ queryKey: crawlKeys.all });
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      toast.error(err.message || '取消任务失败');
    }
  });
}

export function useImportCrawledTrainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, edits }: {
      id: number;
      edits?: { name?: string; title?: string; bio?: string; forceImport?: boolean }
    }) => importCrawledTrainer(id, edits),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crawlKeys.all });
    }
  });
}

export function useRejectCrawledTrainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      rejectCrawledTrainer(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crawlKeys.all });
    }
  });
}

export function useImportCrawledCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, edits }: {
      id: number;
      edits?: { categoryId?: number; subCategoryId?: number; trainerId?: number; title?: string; forceImport?: boolean }
    }) => importCrawledCourse(id, edits),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crawlKeys.all });
    }
  });
}

export function useRejectCrawledCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      rejectCrawledCourse(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crawlKeys.all });
    }
  });
}

export function useCreateCrawlSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SaveCrawlSourcePayload) => createCrawlSource(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crawlKeys.sources() });
    }
  });
}

export function useUpdateCrawlSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: SaveCrawlSourcePayload }) =>
      updateCrawlSource(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crawlKeys.sources() });
    }
  });
}

export function useDeleteCrawlSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCrawlSource(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crawlKeys.sources() });
    }
  });
}
