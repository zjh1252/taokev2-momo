/** 留言列表项 / 详情（对齐后端 AdminTrainerMessageVO） */
export type AdminTrainerMessage = {
  id: number;
  trainerUserId: number;
  trainerNickname: string | null;
  trainingTopic: string;
  trainingGoal: string | null;
  contactName: string;
  contactMobile: string;
  companyName: string;
  companyPhone: string | null;
  provinceId: number | null;
  cityId: number | null;
  districtId: number | null;
  trainingDays: string | null;
  email: string | null;
  remark: string | null;
  userId: number | null;
  userNickname: string | null;
  status: number;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
};

export type TrainerMessageFilters = {
  page?: number;
  limit?: number;
  status?: string;
  trainerUserId?: number;
  keyword?: string;
};

export type TrainerMessagesResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminTrainerMessage[];
  };
};

export type TrainerMessageDetailResponse = {
  code: number;
  message: string;
  data: AdminTrainerMessage;
};

/** 留言状态值 → 文本（与后端 AdminTrainerMessageVO.statusLabel 对齐） */
export const MESSAGE_STATUS_MAP: Record<number, string> = {
  0: '新建',
  1: '已分配',
  2: '已处理',
};

export const MESSAGE_STATUS_OPTIONS = [
  { value: '0', label: '新建' },
  { value: '1', label: '已分配' },
  { value: '2', label: '已处理' },
];
