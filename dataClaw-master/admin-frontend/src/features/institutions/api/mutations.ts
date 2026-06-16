import {
  approveInstitutionApplication,
  rejectInstitutionApplication,
  setInstitutionAssociation
} from './service';
import { institutionKeys } from './queries';

export const approveInstitutionMutation = {
  mutationFn: (userId: number) => approveInstitutionApplication(userId),
  invalidateKeys: [institutionKeys.all]
};

export const rejectInstitutionMutation = {
  mutationFn: ({ userId, reason }: { userId: number; reason: string }) =>
    rejectInstitutionApplication(userId, reason),
  invalidateKeys: [institutionKeys.all]
};

export const setAssociationMutation = {
  mutationFn: ({ id, association }: { id: number; association: boolean }) =>
    setInstitutionAssociation(id, association),
  invalidateKeys: [institutionKeys.all]
};
