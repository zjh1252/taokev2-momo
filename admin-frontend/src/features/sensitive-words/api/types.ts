export type SensitiveWord = {
  id: number;
  word: string;
  category: number | null;
  replacement: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SensitiveWordFilters = {
  page?: number;
  limit?: number;
  keyword?: string;
  category?: number;
  enabled?: string;
};

export type SensitiveWordsResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: SensitiveWord[];
  };
};

export type SaveSensitiveWordPayload = {
  word: string;
  category?: number | null;
  replacement?: string | null;
  enabled?: boolean;
};

export const CATEGORY_MAP: Record<number, string> = {
  0: '通用',
  1: '政治',
  2: '色情',
  3: '暴力',
  4: '广告',
  5: '其他'
};

export const CATEGORY_OPTIONS = [
  { value: '0', label: '通用' },
  { value: '1', label: '政治' },
  { value: '2', label: '色情' },
  { value: '3', label: '暴力' },
  { value: '4', label: '广告' },
  { value: '5', label: '其他' }
];
