<!--
  TkNavBar —— 自定义顶栏
  - 自动适配状态栏高度（uni.getSystemInfoSync().statusBarHeight）
  - 三段式：左 / 中 / 右，slot 都可覆盖
  - 透明模式（详情页头图通栏用）

  用法：
    <TkNavBar title="淘课网" />
    <TkNavBar title="详情" left-icon="back" @left-click="back" />
    <TkNavBar transparent>
      <template #right><TkIcon name="more" color="#fff" /></template>
    </TkNavBar>
-->
<template>
  <view class="tk-navbar" :class="{ 'is-transparent': transparent, 'is-fixed': fixed }">
    <view class="tk-navbar__placeholder" :style="{ height: statusBarHeight + 'px' }" />
    <view class="tk-navbar__bar">
      <view class="tk-navbar__left" @tap="onLeftClick">
        <slot name="left">
          <TkIcon
            v-if="leftIcon"
            :name="leftIcon"
            :size="40"
            :color="iconColor"
          />
        </slot>
      </view>
      <view class="tk-navbar__title">
        <slot>
          <text class="tk-navbar__title-text" :style="{ color: titleColor }">{{ title }}</text>
        </slot>
      </view>
      <view class="tk-navbar__right" @tap="$emit('right-click')">
        <slot name="right" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  title:       { type: String, default: '' },
  leftIcon:    { type: String, default: '' }, // 默认无；详情页传 'back'
  transparent: { type: Boolean, default: false },
  fixed:       { type: Boolean, default: true },
  titleColor:  { type: String, default: '#1B1C1C' },
  iconColor:   { type: String, default: '#E62117' },
});

const emit = defineEmits(['left-click', 'right-click']);

// 状态栏高度（跨端 OK）
const sysInfo = uni.getSystemInfoSync();
const statusBarHeight = ref(sysInfo.statusBarHeight || 20);

function onLeftClick() {
  if (!props.leftIcon) return;
  if (props.leftIcon === 'back') {
    uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/home/index' }) });
  }
  emit('left-click');
}
</script>

<style lang="scss" scoped>
.tk-navbar {
  background: $tk-bg-page;
  z-index: 99;

  &.is-fixed {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
  }

  &.is-transparent {
    background: transparent;
  }

  &__bar {
    display: flex;
    align-items: center;
    height: $tk-navbar-h;
    padding: 0 $tk-sp-3;
  }

  &__left,
  &__right {
    min-width: 80rpx;
    display: flex;
    align-items: center;
  }
  &__right { justify-content: flex-end; }

  &__title {
    flex: 1;
    text-align: center;
    overflow: hidden;
  }

  &__title-text {
    font-size: $tk-fs-xl;
    font-weight: 700;
    @include tk-ellipsis-1;
  }
}
</style>
