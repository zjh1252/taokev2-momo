<!-- TkLoading —— 简易加载占位 -->
<template>
  <view class="tk-loading">
    <view class="tk-loading__spinner" />
    <text class="tk-loading__txt" v-if="text">{{ text }}</text>
  </view>
</template>

<script setup>
defineProps({
  text: { type: String, default: '加载中...' },
});
</script>

<style lang="scss" scoped>
.tk-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $tk-sp-5;
  gap: $tk-sp-2;

  &__spinner {
    width: 48rpx;
    height: 48rpx;
    border: 4rpx solid $tk-divider-light;
    border-top-color: $tk-primary;
    border-radius: 50%;
    animation: tkSpin 0.8s linear infinite;
  }

  &__txt {
    font-size: $tk-fs-sm;
    color: $tk-text-4;
  }
}

@keyframes tkSpin {
  to { transform: rotate(360deg); }
}
</style>
