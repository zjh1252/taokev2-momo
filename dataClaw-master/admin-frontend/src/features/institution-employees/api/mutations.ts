import {
  approveInstEmployeeApplication,
  rejectInstEmployeeApplication
} from './service';
import { instEmployeeKeys } from './queries';

export const approveInstEmployeeMutation = {
  mutationFn: (userId: number) => approveInstEmployeeApplication(userId),
  invalidateKeys: [instEmployeeKeys.all]
};

export const rejectInstEmployeeMutation = {
  mutationFn: ({ userId, reason }: { userId: number; reason: string }) =>
    rejectInstEmployeeApplication(userId, reason),
  invalidateKeys: [instEmployeeKeys.all]
};
