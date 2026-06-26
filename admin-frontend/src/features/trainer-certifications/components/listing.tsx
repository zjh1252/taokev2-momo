import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { certKeys } from '../api/queries';
import {
  getRealNameCertsFromServer,
  getProfessionalCertsFromServer,
  getEducationCertsFromServer,
  getWorkCertsFromServer
} from '../api/server-service';
import { RealNameCertTable } from './real-name-table';
import { ProfessionalCertTable } from './professional-table';
import { EducationCertTable } from './education-table';
import { WorkCertTable } from './work-table';

/**
 * 资质认证审核列表 — 4 个维度复用同一个外壳，按 dimension 选择对应表格组件。
 *
 * @author Fangxinxin
 * @date 2026-04-16 21:00
 */
type Dimension = 'real-name' | 'professional' | 'education' | 'work';

export default async function CertListingPage({ dimension }: { dimension: Dimension }) {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');

  const filters = {
    page,
    limit: pageLimit,
    ...(status && { status })
  };

  const queryClient = getQueryClient();
  let table: React.ReactNode;

  switch (dimension) {
    case 'real-name':
      try {
        await queryClient.prefetchQuery({
          queryKey: certKeys.realName(filters),
          queryFn: () => getRealNameCertsFromServer(filters)
        });
      } catch {
        // 后端未启动、未登录或网络失败时跳过 SSR 数据，由客户端 useSuspenseQuery 重试
      }
      table = <RealNameCertTable />;
      break;
    case 'professional':
      try {
        await queryClient.prefetchQuery({
          queryKey: certKeys.professional(filters),
          queryFn: () => getProfessionalCertsFromServer(filters)
        });
      } catch {
        // 后端未启动、未登录或网络失败时跳过 SSR 数据，由客户端 useSuspenseQuery 重试
      }
      table = <ProfessionalCertTable />;
      break;
    case 'education':
      try {
        await queryClient.prefetchQuery({
          queryKey: certKeys.education(filters),
          queryFn: () => getEducationCertsFromServer(filters)
        });
      } catch {
        // 后端未启动、未登录或网络失败时跳过 SSR 数据，由客户端 useSuspenseQuery 重试
      }
      table = <EducationCertTable />;
      break;
    case 'work':
      try {
        await queryClient.prefetchQuery({
          queryKey: certKeys.work(filters),
          queryFn: () => getWorkCertsFromServer(filters)
        });
      } catch {
        // 后端未启动、未登录或网络失败时跳过 SSR 数据，由客户端 useSuspenseQuery 重试
      }
      table = <WorkCertTable />;
      break;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>{table}</HydrationBoundary>
  );
}
