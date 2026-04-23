<!-- 注册 —— Iteration 3 实现完整流程，本期占位 -->
<template>
  <view class="page">
    <TkNavBar title="注册" left-icon="back" />
    <view class="page__body" :style="{ paddingTop: navBarH + 'px' }">
      <TkEmpty text="注册流程 · 待实现（Iteration 3）" />
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
