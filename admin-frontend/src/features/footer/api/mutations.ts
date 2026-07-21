import { footerKeys } from './queries';
import {
  getAdminFooter,
  updateFooterConfig,
  updateFooterLink,
  updateStaticPage
} from './service';

export const footerQueries = {
  admin: () => ({
    queryKey: footerKeys.all,
    queryFn: async () => {
      const res = await getAdminFooter();
      return res.data;
    }
  })
};

export const updateFooterConfigMutation = {
  mutationFn: updateFooterConfig
};

export const updateFooterLinkMutation = {
  mutationFn: ({ itemCode, payload }: { itemCode: string; payload: Parameters<typeof updateFooterLink>[1] }) =>
    updateFooterLink(itemCode, payload)
};

export const updateStaticPageMutation = {
  mutationFn: ({ pageCode, payload }: { pageCode: string; payload: Parameters<typeof updateStaticPage>[1] }) =>
    updateStaticPage(pageCode, payload)
};
