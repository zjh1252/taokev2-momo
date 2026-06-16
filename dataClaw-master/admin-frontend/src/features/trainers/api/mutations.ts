import {
  approveApplication,
  rejectApplication,
  setTrainerRecommended
} from './service';
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

export const setTrainerRecommendedMutation = {
  mutationFn: ({ trainerId, value }: { trainerId: number; value: 0 | 1 }) =>
    setTrainerRecommended(trainerId, value),
  invalidateKeys: [trainerKeys.all]
};
