export type AdminTrainerMaintainer = {
  roleType: string;
  roleLabel: string;
  contactName: string | null;
  contactPhone: string | null;
  orgName: string | null;
};

export type AdminTrainerResourceItem = {
  id: number;
  type: string;
  title: string;
  status: number | null;
  statusLabel: string | null;
  adminPath: string | null;
};

export type AdminTrainerBookItem = {
  id: number;
  title: string | null;
  author: string | null;
  status: number | null;
  statusLabel: string | null;
};

export type AdminTrainerCategoryRef = {
  id?: number | null;
  categoryId: number;
  categoryName?: string | null;
  sortOrder?: number | null;
};

export type AdminTrainerHonor = {
  id?: number | null;
  honorName: string;
  honorImage?: string | null;
  issuingAuthority?: string | null;
  issuedAt?: string | null;
  description?: string | null;
  sortOrder?: number | null;
};

export type AdminTrainerUpdatePayload = {
  name?: string | null;
  teachingName?: string | null;
  avatar?: string | null;
  title?: string | null;
  gender?: number | null;
  phone?: string | null;
  email?: string | null;
  provinceId?: number | null;
  cityId?: number | null;
  idCardNo?: string | null;
  resumeUrl?: string | null;
  bio?: string | null;
  oneLineIntro?: string | null;
  intro?: string | null;
  background?: string | null;
  partialClients?: string | null;
  goodAt?: string | null;
  specialties?: string | null;
  expertiseTags?: string | null;
  teachingStyle?: string | null;
  experienceYears?: number | null;
  teachingYears?: number | null;
  quoteMin?: number | null;
  quoteMax?: number | null;
  quoteUnit?: string | null;
  quoteRemark?: string | null;
  taokePrice?: number | null;
  taokeCommission?: number | null;
  industryCategoryIds?: number[] | null;
  expertiseCategoryIds?: number[] | null;
  honors?: AdminTrainerHonor[] | null;
};
