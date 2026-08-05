export type AlliancePartnerApplicationStatus = 1 | 2 | 3;

export interface AlliancePartnerApplication {
  id: number;
  userId: number;
  partnerCode: string;
  contactName: string;
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  provinceId: number;
  cityId: number;
  legalPerson: string;
  legalIdCard: string;
  contactQq?: string | null;
  agreementVersion: string;
  status: AlliancePartnerApplicationStatus;
  rejectReason?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlliancePartnerApplyPayload {
  contactName: string;
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  provinceId: number;
  cityId: number;
  legalPerson: string;
  legalIdCard: string;
  contactQq: string;
  agreementSigned: true;
  agreementVersion: 'v1';
}
