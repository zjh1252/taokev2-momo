import {
  approveEnterpriseBuyerApplication,
  rejectEnterpriseBuyerApplication
} from './service';
import { enterpriseBuyerKeys } from './queries';

export const approveEnterpriseBuyerMutation = {
  mutationFn: (userId: number) => approveEnterpriseBuyerApplication(userId),
  invalidateKeys: [enterpriseBuyerKeys.all]
};

export const rejectEnterpriseBuyerMutation = {
  mutationFn: ({ userId, reason }: { userId: number; reason: string }) =>
    rejectEnterpriseBuyerApplication(userId, reason),
  invalidateKeys: [enterpriseBuyerKeys.all]
};
