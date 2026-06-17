import { ApiError, assertApiOk } from '@/lib/api-client';

import { queryOptions } from '@tanstack/react-query';

import { getStaticRecommendationSlots } from '../constants/slots';

import { getRecommendationSlots, getRecommendations, getRecommendationSlotConfig } from './service';



export const recommendationKeys = {

  all: ['recommendations'] as const,

  slots: (resourceType?: string) =>

    [...recommendationKeys.all, 'slots', resourceType ?? 'all'] as const,

  list: (slotCode: string, categoryId?: number) =>

    [...recommendationKeys.all, 'list', slotCode, categoryId ?? 'none'] as const,

  slotConfig: (slotCode: string) =>
    [...recommendationKeys.all, 'slot-config', slotCode] as const

};



function isBackendUnavailable(err: unknown): boolean {

  return (

    err instanceof ApiError &&

    (err.status === 404 || err.status === 408 || err.status === 504 || err.status === 502)

  );

}



export const recommendationSlotsQueryOptions = (resourceType?: string) =>

  queryOptions({

    queryKey: recommendationKeys.slots(resourceType),

    queryFn: async () => {

      try {

        const resp = await getRecommendationSlots(resourceType);

        return assertApiOk(resp);

      } catch (err) {

        if (isBackendUnavailable(err)) {

          return getStaticRecommendationSlots(resourceType);

        }

        throw err;

      }

    }

  });



export const recommendationsQueryOptions = (slotCode: string, categoryId?: number) =>

  queryOptions({

    queryKey: recommendationKeys.list(slotCode, categoryId),

    queryFn: async () => {

      try {

        const resp = await getRecommendations(slotCode, categoryId);

        return assertApiOk(resp) ?? [];

      } catch (err) {

        if (isBackendUnavailable(err)) {

          return [];

        }

        throw err;

      }

    }

  });

export const recommendationSlotConfigQueryOptions = (slotCode: string) =>
  queryOptions({
    queryKey: recommendationKeys.slotConfig(slotCode),
    queryFn: async () => {
      try {
        const resp = await getRecommendationSlotConfig(slotCode);
        return assertApiOk(resp);
      } catch (err) {
        if (isBackendUnavailable(err)) {
          return { slotCode, lockMain: true, lockMiddle: true };
        }
        throw err;
      }
    }
  });
