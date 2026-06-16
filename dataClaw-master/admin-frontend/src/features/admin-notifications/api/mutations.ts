import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createTemplate, updateTemplate, deleteTemplate, sendNotification } from './service';
import { templateKeys } from './queries';
import type { SaveTemplatePayload, SendNotificationPayload } from './types';

export const createTemplateMutation = mutationOptions({
  mutationFn: (data: SaveTemplatePayload) => createTemplate(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: templateKeys.all });
  }
});

export const updateTemplateMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: number; data: SaveTemplatePayload }) =>
    updateTemplate(id, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: templateKeys.all });
  }
});

export const deleteTemplateMutation = mutationOptions({
  mutationFn: (id: number) => deleteTemplate(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: templateKeys.all });
  }
});

export const sendNotificationMutation = mutationOptions({
  mutationFn: (data: SendNotificationPayload) => sendNotification(data)
});
