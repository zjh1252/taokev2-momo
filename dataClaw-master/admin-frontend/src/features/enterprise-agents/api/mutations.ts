import { approveEAApplication, rejectEAApplication } from './service';
import { eaKeys } from './queries';

export const approveEAMutation = { mutationFn: (userId: number) => approveEAApplication(userId), invalidateKeys: [eaKeys.all] };
export const rejectEAMutation = { mutationFn: ({ userId, reason }: { userId: number; reason: string }) => rejectEAApplication(userId, reason), invalidateKeys: [eaKeys.all] };
