export const STATUS_OPTIONS = [
  { value: '1', label: '正常' },
  { value: '2', label: '已冻结' }
];

export const ROLE_LABEL_MAP: Record<string, string> = {
  BUYER: '个人学员',
  ENTERPRISE_BUYER: '企业采购方',
  TRAINER: '专家',
  AGENT: '专家经纪人',
  ASSISTANT: '专家助理',
  ENTERPRISE_AGENT: '经纪公司',
  INSTITUTION: '机构',
  INSTITUTION_EMPLOYEE: '机构员工',
  PLATFORM_AUDITOR: '平台审核员',
  PLATFORM_CS: '平台客服',
  SUPER_ADMIN: '超级管理员'
};

export const ROLE_FILTER_OPTIONS = [
  { value: 'BUYER', label: '个人学员' },
  { value: 'ENTERPRISE_BUYER', label: '企业采购方' },
  { value: 'TRAINER', label: '专家' },
  { value: 'AGENT', label: '专家经纪人' },
  { value: 'ASSISTANT', label: '专家助理' },
  { value: 'ENTERPRISE_AGENT', label: '经纪公司' },
  { value: 'INSTITUTION', label: '机构' },
  { value: 'INSTITUTION_EMPLOYEE', label: '机构员工' }
];
