export type OpsMaterialType = 'COVER' | 'AVATAR';

export type OpsMaterialScene =
  | 'GENERAL'
  | 'OPEN'
  | 'INTERNAL'
  | 'VIDEO'
  | 'TRAINER'
  | 'INSTITUTION';

export type OpsMaterialItem = {
  id: number;
  materialType: OpsMaterialType;
  name: string;
  url: string;
  category: string;
  scene: OpsMaterialScene;
  isDefault: boolean;
  createdAt: string;
};

export type OpsMaterialListParams = {
  materialType: OpsMaterialType;
  category?: string;
  scene?: string;
  page?: number;
  size?: number;
};

export type OpsMaterialListResponse = {
  list: OpsMaterialItem[];
  total: number;
  page: number;
  size: number;
};
