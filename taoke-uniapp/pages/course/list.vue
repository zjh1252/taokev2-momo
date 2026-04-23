<!-- 公开课列表（tab 3）—— Iteration 2 实现，本期占位 -->
<template>
  <view class="page">
    <TkNavBar title="公开课" />
    <view class="page__body" :style="{ paddingTop: navBarH + 'px' }">
      <TkEmpty icon="medal" text="公开课列表 · 待实现（Iteration 2）" />
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
