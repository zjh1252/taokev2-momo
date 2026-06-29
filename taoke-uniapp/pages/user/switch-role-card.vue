<template>
  <view class="card">
    <view class="card__main">
      <view class="card__icon">
        <TkIcon :name="role.icon" :size="36" color="#E62117" />
      </view>
      <view class="card__meta">
        <view class="card__title-row">
          <text class="card__title">{{ role.label }}</text>
          <text v-if="isCurrent" class="card__tag card__tag--current">当前身份</text>
          <text v-else-if="status === 2" class="card__tag card__tag--pending">审核中</text>
          <text v-else-if="status === 3" class="card__tag card__tag--reject">已驳回</text>
        </view>
        <text class="card__desc">{{ role.description }}</text>
      </view>
    </view>
    <view class="card__actions">
      <view
        v-if="isCurrent === false && status === 1"
        class="card__btn card__btn--ghost"
        @tap="$emit('switch')"
      >
        <text class="card__btn-txt">点击切换</text>
      </view>
      <view
        v-if="canApply"
        class="card__btn card__btn--primary"
        @tap="$emit('apply')"
      >
        <text class="card__btn-txt card__btn-txt--white">点击申请</text>
      </view>
      <view
        v-if="status === 1 && role.code !== 'BUYER'"
        class="card__btn card__btn--ghost"
        @tap="$emit('edit')"
      >
        <text class="card__btn-txt">修改角色资料</text>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  role: { type: Object, required: true },
  isCurrent: { type: Boolean, default: false },
  status: { type: Number, default: undefined },
  canApply: { type: Boolean, default: false },
});

defineEmits(['switch', 'apply', 'edit']);
</script>

<style lang="scss" scoped>
.card {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-3;
  box-shadow: $tk-shadow-card;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-3;

  &__main {
    display: flex;
    gap: $tk-sp-3;
    align-items: flex-start;
  }
  &__icon {
    width: 72rpx;
    height: 72rpx;
    border-radius: $tk-radius-md;
    background: $tk-primary-soft;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  &__meta { flex: 1; min-width: 0; }
  &__title-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 6rpx;
  }
  &__title {
    font-size: $tk-fs-md;
    font-weight: 700;
    color: $tk-text-1;
  }
  &__tag {
    font-size: 20rpx;
    padding: 2rpx 12rpx;
    border-radius: $tk-radius-xs;
    &--current { background: $tk-primary-soft; color: $tk-primary; }
    &--pending { background: rgba(245, 158, 11, 0.15); color: #D97706; }
    &--reject { background: rgba(230, 33, 23, 0.10); color: $tk-primary; }
  }
  &__desc {
    font-size: $tk-fs-xs;
    color: $tk-text-3;
    line-height: $tk-lh-normal;
  }
  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: $tk-sp-2;
    justify-content: flex-end;
  }
  &__btn {
    padding: 12rpx 28rpx;
    border-radius: $tk-radius-full;
    &--ghost { border: 2rpx solid $tk-divider; }
    &--primary { background: $tk-primary; }
  }
  &__btn-txt {
    font-size: $tk-fs-sm;
    color: $tk-text-2;
    font-weight: 600;
    &--white { color: #fff; }
  }
}
</style>
