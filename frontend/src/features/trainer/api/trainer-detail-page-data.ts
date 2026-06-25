import {
  getTrainerCourses,
  getTrainerVideos,
  getTrainerApprovedCases,
  getTrainerBooks,
} from './service';
import { getTrainerHighlights } from '@/features/trainer-highlight/api/service';
import { getTrainerDetailCached } from './server';
import type { TrainerDetail, TrainerBook } from '../types';
import type { CourseListItem } from '@/features/course/api/types';
import type { VideoListItem } from '@/features/video/api/types';
import type { TrainerCase } from '@/features/trainer-case/api/types';
import type { TrainerHighlight } from '@/features/trainer-highlight/api/types';

export const TRAINER_DETAIL_PAGE_SIZE = 20;

export interface TrainerDetailPageData {
  trainer: TrainerDetail;
  courses: CourseListItem[];
  coursesTotal: number;
  cases: TrainerCase[];
  highlights: TrainerHighlight[];
  videos: VideoListItem[];
  videosTotal: number;
  books: TrainerBook[];
}

export async function getTrainerDetailPageData(
  trainerId: number,
): Promise<TrainerDetailPageData | null> {
  let trainer: TrainerDetail;
  try {
    trainer = await getTrainerDetailCached(trainerId);
  } catch {
    return null;
  }

  const [coursesPage, videosPage, cases, books, highlights] = await Promise.all([
    getTrainerCourses(trainerId, 1, TRAINER_DETAIL_PAGE_SIZE).catch(() => ({
      list: [],
      total: 0,
      page: 1,
      size: TRAINER_DETAIL_PAGE_SIZE,
      totalPages: 0,
    })),
    getTrainerVideos(trainerId, 1, TRAINER_DETAIL_PAGE_SIZE).catch(() => ({
      list: [],
      total: 0,
      page: 1,
      size: TRAINER_DETAIL_PAGE_SIZE,
      totalPages: 0,
    })),
    getTrainerApprovedCases(trainerId).catch(() => []),
    getTrainerBooks(trainerId).catch(() => []),
    getTrainerHighlights(trainerId).catch(() => []),
  ]);

  return {
    trainer,
    courses: coursesPage.list,
    coursesTotal: coursesPage.total,
    cases,
    highlights,
    videos: videosPage.list,
    videosTotal: videosPage.total,
    books,
  };
}
