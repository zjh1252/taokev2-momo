import { approveAgentApplication, rejectAgentApplication } from './service';
import { agentKeys } from './queries';

export const approveAgentMutation = {
  mutationFn: (userId: number) => approveAgentApplication(userId),
  invalidateKeys: [agentKeys.all]
};

export const rejectAgentMutation = {
  mutationFn: ({ userId, reason }: { userId: number; reason: string }) =>
    rejectAgentApplication(userId, reason),
  invalidateKeys: [agentKeys.all]
};
