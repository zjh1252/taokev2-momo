export type AllianceAmbassadorApplicationStatus = 1 | 2 | 3;

export interface AllianceAmbassadorApplication {
  id: number;
  userId: number;
  ambassadorCode: string;
  agreementVersion: string;
  status: AllianceAmbassadorApplicationStatus;
  rejectReason: string | null;
  reviewedAt: string | null;
  reviewedBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AllianceAmbassadorApplyPayload {
  agreementSigned: boolean;
  agreementVersion?: string;
}
