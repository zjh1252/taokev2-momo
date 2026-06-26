<!--
  TkActionBar —— 详情页吸底操作栏容器
  通常配合 TkActionBtn 使用：

    <TkActionBar>
      <TkActionBtn icon="chat" label="咨询" @tap="onConsult" />
      <TkActionBtn icon="heart" :label="favorited ? '已收藏' : '收藏'"
                   :icon-filled="favorited"
                   :icon-color="favorited ? '#E62117' : '#666'"
                   @tap="onFavorite" />
      <TkActionBtn label="立即报名" type="primary" @tap="onEnroll" />
    </TkActionBar>

  默认 fixed bottom，含 safe-area 兜底；如不需要 fixed 可设 :fixed="false"。
-->
<template>
  <view class="action-bar" :class="{ 'is-static': !fixed }">
    <slot />
  </view>
</template>

<script setup>
defineProps({
  fixed: { type: Boolean, default: true },
});
</script>

<style lang="scss" scoped>
.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
  background: $tk-bg-card;
  border-top: 2rpx solid $tk-divider-light;
  padding: $tk-sp-2 $tk-sp-3;
  display: flex;
  align-items: center;
  gap: $tk-sp-2;
  @include tk-safe-bottom($tk-sp-2);

  &.is-static {
    position: static;
    @include tk-safe-bottom(0);
  }
}
</style>
