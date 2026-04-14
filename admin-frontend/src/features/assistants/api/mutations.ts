import {
  approveAssistantApplication,
  rejectAssistantApplication
} from './service';
import { assistantKeys } from './queries';

export const approveAssistantMutation = {
  mutationFn: (userId: number) => approveAssistantApplication(userId),
  invalidateKeys: [assistantKeys.all]
};

export const rejectAssistantMutation = {
  mutationFn: ({ userId, reason }: { userId: number; reason: string }) =>
    rejectAssistantApplication(userId, reason),
  invalidateKeys: [assistantKeys.all]
};
