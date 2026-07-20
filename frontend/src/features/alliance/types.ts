export type PartnerApplicationStatus =
  | 'none'
  | 'pending'
  | 'approved'
  | 'rejected';

export type PartnerPanelStatus = 'pending' | 'approved';

export type PartnerApplicationSnapshot = {
  status: PartnerApplicationStatus;
  partnerCode?: string;
};
