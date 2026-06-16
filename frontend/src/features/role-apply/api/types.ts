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

/** 申请表单内嵌的著作条目（与后端 SaveTrainerBookRequest 对齐） */
export interface TrainerBookFormItem {
  title: string;
  authorName?: string;
  coverUrl?: string;
  publisher?: string;
  publishDate?: string;
  description?: string;
  buyUrl?: string;
}

export interface TrainerFormData {
  /** 真实姓名 */
  name: string;
  /** 授课姓名（对外展示，可与真实姓名不同） */
  teachingName: string;
  /** 头像 URL */
  avatar: string;
  title: string;
  gender: number;
  phone: string;
  email: string;
  /** 身份证号（18 位，专家入驻时必填，用于后续实名认证） */
  idCardNo: string;
  provinceId: number | null;
  cityId: number | null;
  districtId: number | null;
  address: string;
  /** 一句话介绍（80 字内） */
  oneLineIntro: string;
  bio: string;
  /** 实战经历 / 从业背景（长文本） */
  background: string;
  /** 服务过客户（沿用 partialClients 字段，仅 label 改名） */
  partialClients: string;
  goodAt: string;
  /** 擅长行业一级分类 ID 列表 */
  industryCategoryIds: number[];
  /** 擅长领域一级分类 ID 列表 */
  expertiseCategoryIds: number[];
  expertiseTags: string;
  teachingStyle: string;
  experienceYears: number | null;
  teachingYears: number | null;
  quoteMin: number | null;
  quoteMax: number | null;
  quoteUnit: string;
  quoteRemark: string;
  /** 淘课网售价（元/天） */
  taokePrice: number | null;
  /** 淘课网合作课酬（元/天） */
  taokeCommission: number | null;
  /** 我的著作（提交时整体替换） */
  books: TrainerBookFormItem[];
  /** 是否同意《淘课网注册专家合作协议》 */
  agreementSigned: boolean;
  /** 协议版本号，默认 v1 */
  agreementVersion: string;
  /** 简历 URL（AI 解析后回填，可选透传给后端） */
  resumeUrl: string;
}

/** 服务城市条目（与后端 com.taoke.user.dto.common.ServiceCityItem 对齐） */
export interface ServiceCityItem {
  provinceId: number | null;
  cityId: number | null;
  provinceName?: string;
  cityName?: string;
}

export interface AgentFormData {
  /** 真实姓名 */
  realName: string;
  /** 联系电话 */
  contactPhone: string;
  /** 常用邮箱 */
  email: string;
  /** 多服务城市 */
  serviceCities: ServiceCityItem[];
  /** 申请加入的目标经纪公司 ID（必填） */
  enterpriseAgentId: number | null;
  /** 是否同意《淘课网注册专家经纪人合作协议》 */
  agreementSigned: boolean;
  /** 协议版本号，默认 v1 */
  agreementVersion: string;
  // ---- 历史字段（保留兼容，新表单不再收集） ----
  bio?: string;
  specialties?: string;
  serviceCityIds?: string;
}

export interface AssistantFormData {
  /** 真实姓名 */
  realName: string;
  /** 联系电话 */
  contactPhone: string;
  /** 常用邮箱 */
  email: string;
  /** 多服务城市 */
  serviceCities: ServiceCityItem[];
  /** 是否同意《淘课网注册专家助理合作协议》 */
  agreementSigned: boolean;
  /** 协议版本号，默认 v1 */
  agreementVersion: string;
  // ---- 历史字段（保留兼容） ----
  bio?: string;
  authScope?: string;
}

export interface EnterpriseAgentFormData {
  companyName: string;
  licenseNo: string;
  legalPerson: string;
  industry: string;
  companySize: string;
  /** 公司简介 */
  bio: string;
  contactName: string;
  contactPhone: string;
  provinceId: number | null;
  cityId: number | null;
  districtId: number | null;
  townId: number | null;
  address: string;
  /** 营业执照图片 URL */
  qualificationDocUrl: string;
  /** 是否同意《淘课网注册专家经纪公司合作协议》 */
  agreementSigned: boolean;
  /** 协议版本号，默认 v1 */
  agreementVersion: string;
}

export interface InstitutionFormData {
  /** 机构名称 */
  orgName: string;
  /** 机构类型 */
  orgType: number;
  /** 法人代表 */
  legalRepresentative: string;
  /** 营业执照号 */
  licenseNo: string;
  /** 成立时间（YYYY-MM-DD） */
  establishedAt: string;
  /** 机构 Logo URL */
  logoUrl: string;
  /** 机构简介 */
  bio: string;
  /** 擅长行业一级分类 ID 列表（复用 TRAINER_INDUSTRY 分类树） */
  industryCategoryIds: number[];
  /** 擅长领域一级分类 ID 列表（复用 TRAINER_EXPERTISE 分类树） */
  expertiseCategoryIds: number[];
  /** 我的客户（长文本） */
  clientCases: string;
  /** 是否有场地：0=否，1=是 */
  hasVenue: number;
  /** 是否有专家：0=否，1=是 */
  hasExperts: number;
  /** 联系人姓名 */
  contactName: string;
  /** 联系电话 */
  contactPhone: string;
  /** 是否公开联系方式：0=否，1=是 */
  showContact: number;
  /** 4 级地区 */
  provinceId: number | null;
  cityId: number | null;
  districtId: number | null;
  townId: number | null;
  /** 详细地址 */
  address: string;
  /** 是否同意《淘课网注册培训机构合作协议》 */
  agreementSigned: boolean;
  /** 协议版本号，默认 v1 */
  agreementVersion: string;
}

export interface InstitutionEmployeeFormData {
  /** 真实姓名 */
  realName: string;
  /** 联系电话 */
  contactPhone: string;
  /** 常用邮箱 */
  email: string;
  /** 多服务城市（2 级联动） */
  serviceCities: ServiceCityItem[];
  /** 所属机构 ID */
  orgId: number | null;
  /** 是否同意《淘课网注册培训机构员工合作协议》 */
  agreementSigned: boolean;
  /** 协议版本号，默认 v1 */
  agreementVersion: string;
  // ---- 历史字段（保留兼容） ----
  position?: string;
  department?: string;
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
