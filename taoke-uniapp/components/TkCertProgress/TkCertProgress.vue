<!-- 资质认证进度条：已提交 → 审核中 → 结果 -->
<template>
  <view v-if="status == null" class="empty">
    <text class="empty__txt">当前{{ label }}尚未提交。请填写并提交后等待平台审核。</text>
  </view>
  <view v-else class="progress">
    <view class="steps">
      <view class="step">
        <view class="step__dot step__dot--done">
          <TkIcon name="check" :size="24" color="#E62117" />
        </view>
        <text class="step__label step__label--done">已提交</text>
        <text v-if="fmtTime(submittedAt)" class="step__time">{{ fmtTime(submittedAt) }}</text>
      </view>
      <view class="connector" :class="{ 'is-active': isPending || isApproved || isRejected }" />
      <view class="step">
        <view class="step__dot" :class="pendingDotClass">
          <TkIcon :name="isPending ? 'clock' : 'check'" :size="24" :color="isPending ? '#D97706' : '#E62117'" />
        </view>
        <text class="step__label" :class="pendingLabelClass">{{ isPending ? '审核中' : '已审核' }}</text>
        <text class="step__time">{{ isPending ? '请耐心等待' : fmtTime(auditedAt) }}</text>
      </view>
      <view class="connector" :class="{ 'is-active': isApproved || isRejected }" />
      <view class="step">
        <view class="step__dot" :class="resultDotClass">
          <TkIcon :name="resultIcon" :size="24" :color="resultColor" />
        </view>
        <text class="step__label" :class="resultLabelClass">{{ resultLabel }}</text>
        <text v-if="(isApproved || isRejected) && fmtTime(auditedAt)" class="step__time">{{ fmtTime(auditedAt) }}</text>
      </view>
    </view>
    <view v-if="isRejected && rejectReason" class="reject">
      <text class="reject__txt">驳回原因：{{ rejectReason }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: { type: Number, default: null },
  submittedAt: { type: String, default: '' },
  auditedAt: { type: String, default: '' },
  rejectReason: { type: String, default: '' },
  label: { type: String, default: '认证' },
});

const isPending = computed(() => props.status === 1);
const isApproved = computed(() => props.status === 2);
const isRejected = computed(() => props.status === 3);

const resultLabel = computed(() => {
  if (isApproved.value) return '已通过';
  if (isRejected.value) return '已驳回';
  return '审核中';
});

const resultIcon = computed(() => {
  if (isApproved.value) return 'check';
  if (isRejected.value) return 'close';
  return 'clock';
});

const resultColor = computed(() => {
  if (isApproved.value) return '#E62117';
  if (isRejected.value) return '#DC2626';
  return '#999';
});

const pendingDotClass = computed(() => (isPending.value ? 'step__dot--active' : 'step__dot--done'));
const pendingLabelClass = computed(() => (isPending.value ? 'step__label--active' : 'step__label--done'));
const resultDotClass = computed(() => {
  if (isApproved.value) return 'step__dot--done';
  if (isRejected.value) return 'step__dot--error';
  return 'step__dot--idle';
});
const resultLabelClass = computed(() => {
  if (isApproved.value) return 'step__label--done';
  if (isRejected.value) return 'step__label--error';
  return 'step__label--idle';
});

function fmtTime(iso) {
  if (!iso) return '';
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return m ? `${m[1]} ${m[2]}` : iso;
}
</script>

<style lang="scss" scoped>
.empty {
  padding: $tk-sp-3;
  background: $tk-bg-page;
  border: 2rpx solid $tk-divider-light;
  border-radius: $tk-radius-md;

  &__txt {
    font-size: $tk-fs-sm;
    color: $tk-text-3;
    line-height: 1.6;
  }
}

.steps {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;

  &__dot {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    border: 4rpx solid $tk-divider-light;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;

    &--done { border-color: rgba(230, 33, 23, 0.40); background: rgba(230, 33, 23, 0.05); }
    &--active { border-color: rgba(245, 158, 11, 0.50); background: rgba(245, 158, 11, 0.08); }
    &--error { border-color: rgba(239, 68, 68, 0.40); background: rgba(239, 68, 68, 0.05); }
    &--idle { border-color: $tk-divider-light; }
  }

  &__label {
    font-size: $tk-fs-xs;
    font-weight: 600;

    &--done { color: $tk-primary; }
    &--active { color: #D97706; }
    &--error { color: #DC2626; }
    &--idle { color: $tk-text-4; }
  }

  &__time {
    font-size: 20rpx;
    color: $tk-text-4;
    text-align: center;
  }
}

.connector {
  flex: 0 0 40rpx;
  height: 4rpx;
  background: $tk-divider-light;
  margin-top: 36rpx;

  &.is-active { background: rgba(230, 33, 23, 0.35); }
}

.reject {
  margin-top: $tk-sp-3;
  padding: $tk-sp-2 $tk-sp-3;
  background: rgba(239, 68, 68, 0.06);
  border: 2rpx solid rgba(239, 68, 68, 0.20);
  border-radius: $tk-radius-md;

  &__txt {
    font-size: $tk-fs-sm;
    color: #DC2626;
    line-height: 1.5;
  }
}
</style>
