export type AllianceLecturer721ApplicationStatus = 1 | 2 | 3;

export interface AllianceLecturer721Application {
  id: number;
  userId: number;
  applicationCode: string;
  lecturerName: string;
  idCardNo: string;
  coopYears: number;
  dailyFee: number;
  address: string;
  phone: string;
  wechat: string;
  email: string;
  bankName: string;
  bankAccount: string;
  signatureUrl: string;
  agreementVersion: string;
  status: AllianceLecturer721ApplicationStatus;
  rejectReason: string | null;
  reviewedAt: string | null;
  reviewedBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AllianceLecturer721ApplyPayload {
  lecturerName: string;
  idCardNo: string;
  coopYears: number;
  dailyFee: number;
  address: string;
  phone: string;
  wechat: string;
  email: string;
  bankName: string;
  bankAccount: string;
  signatureUrl: string;
  agreementSigned: boolean;
  agreementVersion?: string;
}
