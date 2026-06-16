import { queryOptions } from '@tanstack/react-query';
import { getTrainingReviews } from './service';
import type { TrainingReviewFilters } from './types';

export const trainingReviewKeys = {
  all: ['training-reviews'] as const,
  list: (filters: TrainingReviewFilters) =>
    [...trainingReviewKeys.all, 'list', filters] as const
};

export const trainingReviewsQueryOptions = (filters: TrainingReviewFilters) =>
  queryOptions({
    queryKey: trainingReviewKeys.list(filters),
    queryFn: () => getTrainingReviews(filters)
  });
