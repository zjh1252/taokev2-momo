export type NotificationTemplate = {
  id: number;
  code: string;
  channel: string;
  lang: string;
  titleTemplate: string | null;
  contentTemplate: string;
  enabled: number;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SaveTemplatePayload = {
  code: string;
  channel?: string;
  lang?: string;
  titleTemplate?: string;
  contentTemplate: string;
  enabled?: number;
  remark?: string;
};

export type SendNotificationPayload = {
  targetType: 'ALL' | 'ROLE' | 'USERS';
  roleCodes?: string[];
  userIds?: number[];
  title?: string;
  content?: string;
  templateCode?: string;
  templateVariables?: Record<string, string>;
  type?: string;
  relatedUrl?: string;
};

export type ApiResp<T> = { code: number; message: string; data: T };
