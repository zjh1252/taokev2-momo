<!--
  TkSection —— 卡片式分组容器
  - 左侧红色竖条 + 标题 + 默认插槽内容
  - 用于详情页 / 长内容页的内容分组
  - 可选 :divider="false" 关闭头尾分隔线

  用法：
    <TkSection title="课程介绍">
      <text>...</text>
    </TkSection>
-->
<template>
  <view class="tk-section">
    <view class="tk-section__head" :class="{ 'has-divider': divider }">
      <view class="tk-section__bar" />
      <text class="tk-section__title">{{ title }}</text>
      <view class="tk-section__extra"><slot name="extra" /></view>
    </view>
    <view class="tk-section__body"><slot /></view>
  </view>
</template>

<script setup>
defineProps({
  title:   { type: String, required: true },
  divider: { type: Boolean, default: true },
});
</script>

<style lang="scss" scoped>
.tk-section {
  background: $tk-bg-card;
  border-radius: $tk-radius-md;
  padding: $tk-sp-3;
  box-shadow: $tk-shadow-card;

  &__head {
    display: flex;
    align-items: center;
    gap: $tk-sp-2;
    margin-bottom: $tk-sp-3;

    &.has-divider {
      padding-bottom: $tk-sp-2;
      border-bottom: 2rpx solid $tk-divider-light;
    }
  }
  &__bar {
    width: 6rpx;
    height: 28rpx;
    background: $tk-primary;
    border-radius: $tk-radius-full;
    flex-shrink: 0;
  }
  &__title {
    flex: 1;
    font-size: $tk-fs-lg;
    font-weight: 700;
    color: $tk-text-1;
  }
  &__extra {
    flex-shrink: 0;
  }
}
</style>
