import { approveApplication, rejectApplication } from './service';
import { trainerKeys } from './queries';

export const approveApplicationMutation = {
  mutationFn: (userId: number) => approveApplication(userId),
  invalidateKeys: [trainerKeys.all]
};

export const rejectApplicationMutation = {
  mutationFn: ({ userId, reason }: { userId: number; reason: string }) =>
    rejectApplication(userId, reason),
  invalidateKeys: [trainerKeys.all]
};
