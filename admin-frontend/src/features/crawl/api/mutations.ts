import { useMutation, useQueryClient } from '@tanstack/react-query';
import { crawlKeys } from './queries';
import {
  triggerCrawl,
  cancelCrawlJob,
  importCrawledTrainer,
  rejectCrawledTrainer,
  importCrawledCourse,
  updateCrawledCourse,
  rejectCrawledCourse,
  restoreCrawledCourse
} from './service';
import type { CrawledCourseEditPayload } from './types';

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crawlKeys.all });
    }
  });
}

export function useImportCrawledTrainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      edits
    }: {
      id: number;
      edits?: { name?: string; title?: string; bio?: string; forceImport?: boolean };
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
    mutationFn: ({ id, edits }: { id: number; edits?: CrawledCourseEditPayload }) =>
      importCrawledCourse(id, edits),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crawlKeys.all });
    }
  });
}

export function useUpdateCrawledCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, edits }: { id: number; edits: CrawledCourseEditPayload }) =>
      updateCrawledCourse(id, edits),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crawlKeys.all });
    }
  });
}

export function useRejectCrawledCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectCrawledCourse(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crawlKeys.all });
    }
  });
}

export function useRestoreCrawledCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => restoreCrawledCourse(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crawlKeys.all });
    }
  });
}
