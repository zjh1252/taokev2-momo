import { queryOptions } from '@tanstack/react-query';
import { getTrainerHighlights, getTrainerHighlightDetail } from './service';
import type { TrainerHighlightFilters } from './types';

export const trainerHighlightKeys = {
  all: ['trainer-highlights'] as const,
  list: (filters: TrainerHighlightFilters) =>
    [...trainerHighlightKeys.all, 'list', filters] as const,
  detail: (id: number) =>
    [...trainerHighlightKeys.all, 'detail', id] as const
};

export const trainerHighlightsQueryOptions = (
  filters: TrainerHighlightFilters
) =>
  queryOptions({
    queryKey: trainerHighlightKeys.list(filters),
    queryFn: () => getTrainerHighlights(filters)
  });

export const trainerHighlightDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: trainerHighlightKeys.detail(id),
    queryFn: () => getTrainerHighlightDetail(id)
  });
