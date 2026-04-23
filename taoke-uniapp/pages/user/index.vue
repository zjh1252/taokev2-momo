<!-- 我的（tab 4）—— Iteration 3 实现，本期最简未登录态占位 -->
<template>
  <view class="page">
    <TkNavBar title="我的" />
    <view class="page__body" :style="{ paddingTop: navBarH + 'px' }">
      <view v-if="userStore.isLoggedIn" class="logged">
        <view class="logged__avatar-wrap">
          <image class="logged__avatar" :src="userStore.avatar || '/static/logo.png'" mode="aspectFill" />
        </view>
        <text class="logged__name">{{ userStore.nickname || '用户' }}</text>
        <view class="logged__btn" @tap="logout">
          <text class="logged__btn-txt">退出登录</text>
        </view>
      </view>
      <view v-else class="guest">
        <text class="guest__title">欢迎来到淘课网</text>
        <text class="guest__sub">登录后享受更多企业培训权益</text>
        <view class="guest__btn" @tap="goLogin">
          <text class="guest__btn-txt">登录 / 注册</text>
        </view>
        <text class="guest__note">Iteration 3 将实现完整菜单与价值说明</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { useUserStore } from '@/stores/user';

const sysInfo = uni.getSystemInfoSync();
const navBarH = (sysInfo.statusBarHeight || 20) + 44;
const userStore = useUserStore();

function goLogin() { uni.navigateTo({ url: '/pages/auth/login' }); }
function logout()  { userStore.logout({ redirectToLogin: false }); }
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: $tk-bg-page; }
.page__body { padding: $tk-sp-5 $tk-sp-4; }

.guest, .logged {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $tk-sp-3;
  background: $tk-bg-card;
  padding: $tk-sp-6 $tk-sp-4;
  border-radius: $tk-radius-lg;
  box-shadow: $tk-shadow-card;
}

.guest {
  &__title { font-size: $tk-fs-2xl; font-weight: 700; color: $tk-text-1; }
  &__sub   { font-size: $tk-fs-md; color: $tk-text-2; }
  &__btn   { margin-top: $tk-sp-2; padding: 18rpx 64rpx; background: $tk-primary; border-radius: $tk-radius-full; box-shadow: $tk-shadow-primary; }
  &__btn-txt { color: #fff; font-size: $tk-fs-md; font-weight: 600; }
  &__note  { margin-top: $tk-sp-3; font-size: $tk-fs-xs; color: $tk-text-4; }
}

.logged {
  &__avatar-wrap { padding: 6rpx; border-radius: 50%; background: $tk-primary-soft; }
  &__avatar { width: 144rpx; height: 144rpx; border-radius: 50%; background: $tk-divider-light; }
  &__name { font-size: $tk-fs-xl; font-weight: 700; color: $tk-text-1; }
  &__btn  { margin-top: $tk-sp-2; padding: 14rpx 48rpx; border: 2rpx solid $tk-divider; border-radius: $tk-radius-full; }
  &__btn-txt { color: $tk-text-2; font-size: $tk-fs-sm; }
}
</style>
