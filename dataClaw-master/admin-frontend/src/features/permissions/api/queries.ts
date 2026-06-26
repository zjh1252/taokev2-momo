import { queryOptions } from '@tanstack/react-query';
import { getPermissionTree, getPermissionList } from './service';

export const permissionKeys = {
  all: ['permissions'] as const,
  tree: () => [...permissionKeys.all, 'tree'] as const,
  list: () => [...permissionKeys.all, 'list'] as const
};

export const permissionTreeQueryOptions = () =>
  queryOptions({
    queryKey: permissionKeys.tree(),
    queryFn: getPermissionTree
  });

export const permissionListQueryOptions = () =>
  queryOptions({
    queryKey: permissionKeys.list(),
    queryFn: getPermissionList
  });
