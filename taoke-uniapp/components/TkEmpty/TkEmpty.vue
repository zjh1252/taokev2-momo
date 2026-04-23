<!-- TkEmpty —— 列表/页面空状态占位 -->
<template>
  <view class="tk-empty">
    <TkIcon :name="icon" :size="120" color="#D0D3D6" />
    <text class="tk-empty__txt">{{ text }}</text>
    <slot />
  </view>
</template>

<script setup>
defineProps({
  icon: { type: String, default: 'list' },
  text: { type: String, default: '暂无数据' },
});
</script>

<style lang="scss" scoped>
.tk-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $tk-sp-8 $tk-sp-4;
  gap: $tk-sp-3;

  &__txt {
    font-size: $tk-fs-md;
    color: $tk-text-4;
  }
}
</style>
