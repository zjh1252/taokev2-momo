export type RecommendationSlotMeta = {
  code: string;
  label: string;
  resourceType: 'TRAINER' | 'COURSE' | 'CASE' | 'INSTITUTION';
};

export type RecommendedResourceItem = {
  id: number;
  slotCode: string;
  resourceType: string;
  resourceId: number;
  categoryId: number | null;
  roleType: 'PRIMARY' | 'BACKUP';
  sortOrder: number;
  coverUrl: string | null;
  title: string | null;
  description: string | null;
  expertiseOverride: string | null;
  keyTags: string | null;
  adminNote: string | null;
  resourceName: string | null;
  resourceCoverUrl: string | null;
  resourceDescription: string | null;
  resourceMeta: string | null;
  resourceStatus: number | null;
};

export type RecommendationsResponse = {
  code: number;
  message: string;
  data: RecommendedResourceItem[];
};

export type RecommendationSlotsResponse = {
  code: number;
  message: string;
  data: RecommendationSlotMeta[];
};

export type AddRecommendationPayload = {
  slotCode: string;
  resourceType: string;
  resourceId: number;
  categoryId?: number;
  roleType?: 'PRIMARY' | 'BACKUP';
  coverUrl?: string;
  title?: string;
  description?: string;
  expertiseOverride?: string;
  keyTags?: string;
  adminNote?: string;
};

export type UpdateRecommendationPayload = {
  coverUrl?: string;
  title?: string;
  description?: string;
  expertiseOverride?: string;
  keyTags?: string;
  adminNote?: string;
};

export type ReorderRecommendationsPayload = {
  slotCode: string;
  categoryId?: number;
  orderedIds: number[];
};

export type RecommendationManagerConfig = {
  resourceType: RecommendationSlotMeta['resourceType'];
  defaultSlotCode: string;
  pageTitle: string;
  candidateLabel: string;
  /** 详情链接模板，含 `{id}` 时替换为 resourceId；无占位符则固定跳转列表页 */
  detailPathTemplate: string;
};
