/**
 * 角色申请相关类型定义 — 与后端各角色 *Request DTO 对齐
 *
 * @author Fangxinxin
 * @date 2026-04-03 15:00
 */

/** 可申请的角色编码 */
export type ApplyableRole =
  | 'ENTERPRISE_BUYER'
  | 'TRAINER'
  | 'AGENT'
  | 'ASSISTANT'
  | 'ENTERPRISE_AGENT'
  | 'INSTITUTION'
  | 'INSTITUTION_EMPLOYEE';

/** 角色元信息 */
export interface RoleMeta {
  code: ApplyableRole;
  label: string;
  description: string;
  icon: string;
  needsReview: boolean;
}

/** 全部可申请角色列表 */
export const APPLYABLE_ROLES: RoleMeta[] = [
  {
    code: 'ENTERPRISE_BUYER',
    label: '企业培训采购方',
    description: '企业培训需求方，检索专家/课程、发布培训需求、购买课程',
    icon: 'building',
    needsReview: false,
  },
  {
    code: 'TRAINER',
    label: '专家',
    description: '平台核心培训师，发布课程、管理授课案例、获取收益',
    icon: 'graduationCap',
    needsReview: true,
  },
  {
    code: 'AGENT',
    label: '专家经纪人',
    description: '培训资源中介，维护旗下专家资源库、筛选匹配推荐',
    icon: 'userCheck',
    needsReview: true,
  },
  {
    code: 'ASSISTANT',
    label: '专家助理',
    description: '辅助专家处理日常运营，维护资料、管理排期',
    icon: 'headset',
    needsReview: true,
  },
  {
    code: 'ENTERPRISE_AGENT',
    label: '专家经纪公司',
    description: '具备多经纪人管理能力，批量运营专家资源',
    icon: 'briefcase',
    needsReview: true,
  },
  {
    code: 'INSTITUTION',
    label: '培训机构',
    description: '专业培训服务运营方，管理师资团队、发布课程',
    icon: 'landmark',
    needsReview: true,
  },
  {
    code: 'INSTITUTION_EMPLOYEE',
    label: '机构员工',
    description: '机构内部运营人员，在机构授权范围内执行业务',
    icon: 'idCard',
    needsReview: true,
  },
];

// ---- 各角色申请表单类型 ----

export interface EnterpriseBuyerFormData {
  companyName: string;
  industry: string;
  companySize: string;
  contactName: string;
  contactPhone: string;
  provinceId: number | null;
  cityId: number | null;
  districtId: number | null;
  townId: number | null;
  address: string;
  trainingTags: string;
}

export interface TrainerFormData {
  name: string;
  title: string;
  gender: number;
  phone: string;
  email: string;
  provinceId: number | null;
  cityId: number | null;
  districtId: number | null;
  address: string;
  bio: string;
  goodAt: string;
  expertiseTags: string;
  teachingStyle: string;
  experienceYears: number | null;
  teachingYears: number | null;
  quoteMin: number | null;
  quoteMax: number | null;
  quoteUnit: string;
  quoteRemark: string;
}

export interface AgentFormData {
  bio: string;
  specialties: string;
  serviceCityIds: string;
}

export interface AssistantFormData {
  bio: string;
  authScope: string;
}

export interface EnterpriseAgentFormData {
  companyName: string;
  licenseNo: string;
  legalPerson: string;
  industry: string;
  companySize: string;
  contactName: string;
  contactPhone: string;
  provinceId: number | null;
  cityId: number | null;
  districtId: number | null;
  address: string;
  qualificationDocUrl: string;
}

export interface InstitutionFormData {
  orgName: string;
  orgType: number;
  licenseNo: string;
  bio: string;
  contactName: string;
  contactPhone: string;
  showContact: number;
  provinceId: number | null;
  cityId: number | null;
  districtId: number | null;
  address: string;
}

export interface InstitutionEmployeeFormData {
  orgId: number | null;
  position: string;
  department: string;
}

/** 所有表单数据的联合类型 */
export type RoleFormData =
  | EnterpriseBuyerFormData
  | TrainerFormData
  | AgentFormData
  | AssistantFormData
  | EnterpriseAgentFormData
  | InstitutionFormData
  | InstitutionEmployeeFormData;
