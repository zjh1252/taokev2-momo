import type { MaterialType } from '../constants';

export type Material = {
  id: number;
  materialType: MaterialType;
  name: string;
  url: string;
  category: string;
  scene: string;
  enabled: boolean;
  isDefault: boolean;
  usageCount: number;
  createdAt: string;
};

export type MaterialFilters = {
  page?: number;
  limit?: number;
  materialType: MaterialType;
  keyword?: string;
  category?: string;
  scene?: string;
  enabled?: string;
  isDefault?: string;
};

export type MaterialsResponse = {
  code: number;
  message: string;
  data: {
    list: Material[];
    total: number;
    page: number;
    size: number;
  };
};

export type MaterialResponse = {
  code: number;
  message: string;
  data: Material;
};

export type SaveMaterialPayload = {
  materialType: MaterialType;
  name: string;
  url: string;
  category?: string;
  scene: string;
  enabled: boolean;
  isDefault: boolean;
};

export type UpdateMaterialPayload = {
  name?: string;
  url?: string;
  category?: string;
  scene?: string;
  enabled?: boolean;
  isDefault?: boolean;
};

export type BatchMaterialPayload = {
  ids: number[];
  action: string;
};

export type UploadMaterialPayload = {
  file: File;
  materialType: MaterialType;
  name?: string;
  category?: string;
  scene?: string;
  enabled?: boolean;
  isDefault?: boolean;
};
