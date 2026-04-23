<!-- 登录 —— Iteration 3 实现完整 UI / SMS 切换，本期最简密码登录骨架 -->
<template>
  <view class="page">
    <TkNavBar title="登录" left-icon="back" />
    <view class="page__body" :style="{ paddingTop: navBarH + 'px' }">
      <view class="form">
        <text class="form__title">欢迎登录淘课网</text>
        <input
          class="form__input"
          v-model="account"
          placeholder="手机号 / 邮箱"
          placeholder-style="color:#999"
        />
        <input
          class="form__input"
          v-model="password"
          type="password"
          placeholder="密码"
          placeholder-style="color:#999"
        />
        <view class="form__btn" :class="{ 'is-loading': loading }" @tap="onLogin">
          <text class="form__btn-txt">{{ loading ? '登录中...' : '登录' }}</text>
        </view>
        <view class="form__links">
          <text class="form__link" @tap="goRegister">注册账号</text>
          <text class="form__link form__link--muted">忘记密码？</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';

const sysInfo = uni.getSystemInfoSync();
const navBarH = (sysInfo.statusBarHeight || 20) + 44;
const userStore = useUserStore();

const account = ref('');
const password = ref('');
const loading = ref(false);
const redirect = ref('');

onLoad((opt) => { redirect.value = opt?.redirect || ''; });

async function onLogin() {
  if (!account.value || !password.value) {
    uni.showToast({ title: '请输入账号和密码', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    await userStore.loginByPassword({ account: account.value, password: password.value });
    uni.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => {
      if (redirect.value) {
        uni.reLaunch({ url: redirect.value });
      } else {
        uni.switchTab({ url: '/pages/home/index' });
      }
    }, 600);
  } catch (e) {
    // toast 已在 request 拦截器统一处理
  } finally {
    loading.value = false;
  }
}

function goRegister() { uni.navigateTo({ url: '/pages/auth/register' }); }
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: $tk-bg-page; }
.page__body { padding: $tk-sp-6 $tk-sp-4; }

.form {
  display: flex;
  flex-direction: column;
  gap: $tk-sp-3;
  background: $tk-bg-card;
  padding: $tk-sp-5 $tk-sp-4;
  border-radius: $tk-radius-lg;
  box-shadow: $tk-shadow-card;

  &__title {
    font-size: $tk-fs-2xl;
    font-weight: 700;
    color: $tk-text-1;
    margin-bottom: $tk-sp-2;
  }

  &__input {
    height: 88rpx;
    padding: 0 $tk-sp-3;
    background: $tk-bg-page;
    border-radius: $tk-radius-md;
    font-size: $tk-fs-md;
    color: $tk-text-1;
  }

  &__btn {
    height: 88rpx;
    background: $tk-primary;
    border-radius: $tk-radius-full;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: $tk-shadow-primary;
    &.is-loading { opacity: 0.7; }
  }
  &__btn-txt {
    color: #fff;
    font-size: $tk-fs-lg;
    font-weight: 600;
  }

  &__links {
    display: flex;
    justify-content: space-between;
    margin-top: $tk-sp-2;
  }
  &__link {
    font-size: $tk-fs-sm;
    color: $tk-primary;
    &--muted { color: $tk-text-4; }
  }
}
</style>
