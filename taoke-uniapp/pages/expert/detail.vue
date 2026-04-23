<!-- 专家详情 —— 后续实现 -->
<template>
  <view class="page">
    <TkNavBar title="专家详情" left-icon="back" />
    <view class="page__body" :style="{ paddingTop: navBarH + 'px' }">
      <TkEmpty text="专家详情 · 待实现" />
      <view class="page__hint"><text>id={{ id }}</text></view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const sysInfo = uni.getSystemInfoSync();
const navBarH = (sysInfo.statusBarHeight || 20) + 44;
const id = ref('');
onLoad((opt) => { id.value = opt?.id || ''; });
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: $tk-bg-page; }
.page__body { padding: $tk-sp-4 $tk-sp-3; text-align: center; }
.page__hint { color: $tk-text-4; font-size: $tk-fs-sm; }
</style>
