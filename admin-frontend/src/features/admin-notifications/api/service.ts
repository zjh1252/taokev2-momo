import { apiClient } from '@/lib/api-client';
import type {
  NotificationTemplate,
  SaveTemplatePayload,
  SendNotificationPayload,
  ApiResp
} from './types';

export async function getTemplates() {
  return apiClient<ApiResp<NotificationTemplate[]>>('/notification-templates');
}

export async function createTemplate(payload: SaveTemplatePayload) {
  return apiClient<ApiResp<NotificationTemplate>>('/notification-templates', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateTemplate(id: number, payload: SaveTemplatePayload) {
  return apiClient<ApiResp<NotificationTemplate>>(
    `/notification-templates/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload)
    }
  );
}

export async function deleteTemplate(id: number) {
  return apiClient<ApiResp<null>>(`/notification-templates/${id}`, {
    method: 'DELETE'
  });
}

export async function sendNotification(payload: SendNotificationPayload) {
  return apiClient<ApiResp<number>>('/notifications/send', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
