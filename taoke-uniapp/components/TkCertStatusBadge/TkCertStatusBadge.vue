<!-- 资质审核状态徽章 -->
<template>
  <text class="badge" :class="'badge--' + variant">{{ label }}</text>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: { type: Number, default: null },
});

const MAP = {
  1: { label: '待审核', variant: 'pending' },
  2: { label: '已通过', variant: 'approved' },
  3: { label: '已驳回', variant: 'rejected' },
};

const label = computed(() => MAP[props.status]?.label || '未提交');
const variant = computed(() => MAP[props.status]?.variant || 'idle');
</script>

<style lang="scss" scoped>
.badge {
  display: inline-flex;
  padding: 4rpx 16rpx;
  border-radius: $tk-radius-full;
  font-size: 20rpx;
  font-weight: 600;
  border: 2rpx solid;

  &--idle {
    color: $tk-text-3;
    background: $tk-bg-page;
    border-color: $tk-divider-light;
  }
  &--pending {
    color: #D97706;
    background: rgba(245, 158, 11, 0.10);
    border-color: rgba(245, 158, 11, 0.30);
  }
  &--approved {
    color: #059669;
    background: rgba(16, 185, 129, 0.10);
    border-color: rgba(16, 185, 129, 0.30);
  }
  &--rejected {
    color: #DC2626;
    background: rgba(239, 68, 68, 0.10);
    border-color: rgba(239, 68, 68, 0.30);
  }
}
</style>
