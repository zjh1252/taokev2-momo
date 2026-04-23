<!-- 专家列表（tab 2）—— Iteration 2 实现，本期占位 -->
<template>
  <view class="page">
    <TkNavBar title="专家" />
    <view class="page__body" :style="{ paddingTop: navBarH + 'px' }">
      <TkEmpty icon="staff" text="专家列表 · 待实现（Iteration 2）" />
    </view>
  </view>
</template>

<script setup>
const sysInfo = uni.getSystemInfoSync();
const navBarH = (sysInfo.statusBarHeight || 20) + 44;
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: $tk-bg-page; }
.page__body { padding: $tk-sp-4 $tk-sp-3; }
</style>
