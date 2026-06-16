'use client';

import { Switch } from '@/components/ui/switch';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { setTrainerRecommended } from '../../api/service';
import { trainerKeys } from '../../api/queries';

/**
 * 专家推荐位开关 — 仅修改 is_recommended，幂等。
 *
 * <p>采用「乐观更新」：先本地切换显示，再发请求；失败时回滚并提示。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-22 14:30
 */
export function RecommendSwitch({
  trainerId,
  value
}: {
  trainerId: number;
  value: number;
}) {
  const queryClient = useQueryClient();
  const [checked, setChecked] = useState(value === 1);

  const mutation = useMutation({
    mutationFn: (next: 0 | 1) => setTrainerRecommended(trainerId, next),
    onSuccess: (_, next) => {
      toast.success(next === 1 ? '已设为推荐' : '已取消推荐');
      void queryClient.invalidateQueries({ queryKey: trainerKeys.all });
    },
    onError: () => {
      setChecked((c) => !c);
      toast.error('操作失败，请重试');
    }
  });

  return (
    <Switch
      checked={checked}
      disabled={mutation.isPending}
      onCheckedChange={(next) => {
        setChecked(next);
        mutation.mutate(next ? 1 : 0);
      }}
      aria-label='设为推荐专家'
    />
  );
}
