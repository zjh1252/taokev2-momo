<!--
  账号绑定 — 微信 / 支付宝 / 企业微信（与 PC 一致，暂未开放后端）
-->
<template>
  <view class="page">
    <TkNavBar title="账号绑定" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <text class="desc">绑定第三方账号后可使用对应方式快捷登录。</text>

        <view class="list">
          <view v-for="item in bindings" :key="item.name" class="row">
            <text class="row__name">{{ item.name }}</text>
            <view class="row__btn" @tap="onBind(item.name)">
              <text class="row__btn-txt">{{ item.bound ? '解绑' : '去绑定' }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { getNavBarHeight } from '@/utils/system';

const navBarH = getNavBarHeight();

const bindings = ref([
  { name: '微信', bound: false },
  { name: '支付宝', bound: false },
  { name: '企业微信', bound: false },
]);

function onBind(name) {
  uni.showToast({ title: `${name}绑定功能暂未开放，敬请期待`, icon: 'none' });
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: $tk-bg-page;
}

.page__scroll {
  height: 100vh;
}

.page__inner {
  padding: $tk-sp-4;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-4;
}

.desc {
  font-size: $tk-fs-sm;
  color: $tk-text-3;
}

.list {
  display: flex;
  flex-direction: column;
  gap: $tk-sp-2;
}

.row {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: $tk-shadow-card;

  &__name {
    font-size: $tk-fs-md;
    color: $tk-text-1;
  }

  &__btn {
    padding: 12rpx 28rpx;
    border: 2rpx solid $tk-divider-light;
    border-radius: $tk-radius-md;
  }

  &__btn-txt {
    font-size: $tk-fs-xs;
    color: $tk-text-2;
  }
}
</style>