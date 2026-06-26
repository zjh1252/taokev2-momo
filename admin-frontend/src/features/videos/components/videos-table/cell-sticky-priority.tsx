'use client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { STICKY_PRIORITY_MAP, STICKY_PRIORITY_OPTIONS } from '../../api/types'
import { updateVideoStickyPriority } from '../../api/service'
import { videoKeys } from '../../api/queries'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface CellStickyPriorityProps {
  videoId: number
  stickyPriority: number
  status: number
}

export function CellStickyPriority({ videoId, stickyPriority, status }: CellStickyPriorityProps) {
  const queryClient = useQueryClient()
  const isPublished = status === 2

  const mutation = useMutation({
    mutationFn: (value: number) => updateVideoStickyPriority(videoId, value),
    onSuccess: (_, value) => {
      toast.success(`已设为「${STICKY_PRIORITY_MAP[value]}」`)
      void queryClient.invalidateQueries({ queryKey: videoKeys.all })
    },
    onError: () => toast.error('操作失败')
  })

  return (
    <Select
      value={String(stickyPriority ?? 0)}
      onValueChange={(v) => mutation.mutate(Number(v))}
      disabled={!isPublished || mutation.isPending}
    >
      <SelectTrigger className="h-8 w-[110px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STICKY_PRIORITY_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={String(opt.value)}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
