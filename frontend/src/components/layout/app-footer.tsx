import { getPublicFooterServer } from '@/features/footer/api/service';
import { FooterView } from '@/features/footer/components/footer-view';

/**
 * 全站深色 Footer — 数据来自 CMS 底部管理
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
export async function AppFooter() {
  const data = await getPublicFooterServer();
  return <FooterView data={data} />;
}
