import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createCategory, updateCategory, deleteCategory } from './service';
import { categoryKeys } from './queries';
import type { SaveCategoryPayload, UpdateCategoryPayload } from './types';

export const createCategoryMutation = mutationOptions({
  mutationFn: (data: SaveCategoryPayload) => createCategory(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: categoryKeys.all });
  }
});

export const updateCategoryMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: number; data: UpdateCategoryPayload }) =>
    updateCategory(id, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: categoryKeys.all });
  }
});

export const deleteCategoryMutation = mutationOptions({
  mutationFn: (id: number) => deleteCategory(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: categoryKeys.all });
  }
});
