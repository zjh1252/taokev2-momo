<!--
  基础信息（PUT /users/me）
  - 头像：tap → uni.chooseImage → POST /uploads/avatars → 仅本地预览，需点保存才落库
  - 昵称：可改
  - 真实姓名：可改
  - 性别：男 / 女 / 未知（保留扩展）
  - 手机号：只读（学习标签见「更多信息」页）
  - 保存按钮 → PUT /users/me
-->
<template>
  <view class="page">
    <TkNavBar title="基础信息" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <!-- 头像 -->
        <view class="avatar-card" @tap="onPickAvatar">
          <view class="avatar-card__l">
            <TkAvatar :src="avatarUrl" :nickname="form.nickname" :size="120" />
          </view>
          <view class="avatar-card__c">
            <text class="avatar-card__title">点击更换头像</text>
            <text class="avatar-card__sub">支持 jpg / png / webp，单张 ≤ 10MB</text>
          </view>
          <TkIcon name="chevron-right" :size="28" color="#C2C8D0" />
        </view>

        <!-- 表单 -->
        <view class="form">
          <view class="row">
            <text class="row__label">昵称</text>
            <input
              class="row__input"
              :value="form.nickname"
              placeholder="请输入昵称"
              placeholder-style="color:#999"
              maxlength="64"
              @input="onInput('nickname', $event)"
            />
          </view>
          <view class="row">
            <text class="row__label">真实姓名</text>
            <input
              class="row__input"
              :value="form.realName"
              placeholder="请输入真实姓名"
              placeholder-style="color:#999"
              maxlength="64"
              @input="onInput('realName', $event)"
            />
          </view>
          <view class="row">
            <text class="row__label">性别</text>
            <view class="row__radio">
              <view
                v-for="g in genders"
                :key="g.value"
                class="row__radio-item"
                :class="{ 'is-active': form.gender === g.value }"
                @tap="form.gender = g.value"
              >
                <text class="row__radio-txt">{{ g.label }}</text>
              </view>
            </view>
          </view>
          <view class="row row--last">
            <text class="row__label">手机号</text>
            <text class="row__readonly">{{ phone || '——' }}</text>
          </view>
        </view>

        <view class="hint" v-if="error">
          <text class="hint__txt">{{ error }}</text>
        </view>

        <view style="height: 200rpx;" />
      </view>
    </scroll-view>

    <TkActionBar>
      <TkActionBtn
        :label="saving ? '保存中...' : '保存基础信息'"
        type="primary"
        :disabled="saving || !dirty"
        @tap="onSave"
      />
    </TkActionBar>
  </view>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import * as uploadApi from '@/api/upload';

import { getNavBarHeight } from '@/utils/system';

const navBarH = getNavBarHeight();
const userStore = useUserStore();

const genders = [
  { value: 1, label: '男' },
  { value: 2, label: '女' },
  { value: 0, label: '保密' },
];

const form = reactive({
  nickname: '',
  realName: '',
  avatarUrl: '',
  gender: 0,
});

const initial = ref({});
const avatarUrl = computed(() => form.avatarUrl);
const phone = ref('');

const saving = ref(false);
const error = ref('');

const dirty = computed(() => {
  const keys = Object.keys(form);
  return keys.some((k) => form[k] !== initial.value[k]);
});

onLoad(async () => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/auth/login' });
    return;
  }
  // 用 store 缓存即开即用，再静默从后端拉一份
  hydrate(userStore.profile);
  const p = await userStore.fetchProfile();
  if (p) hydrate(p);
});

function hydrate(p) {
  if (!p) return;
  form.nickname  = p.nickname  ?? '';
  form.realName  = p.realName  ?? '';
  form.avatarUrl = p.avatarUrl ?? p.avatar ?? '';
  form.gender    = p.gender    ?? 0;
  phone.value    = p.phone || '';
  initial.value = { ...form };
}

function onInput(field, e) {
  form[field] = e.detail.value || '';
}

async function onPickAvatar() {
  try {
    const choose = await new Promise((resolve, reject) => {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed', 'original'],
        sourceType: ['album', 'camera'],
        success: resolve,
        fail: reject,
      });
    });
    const filePath = choose?.tempFilePaths?.[0];
    if (!filePath) return;

    uni.showLoading({ title: '上传中...', mask: true });
    const data = await uploadApi.uploadAvatar(filePath);
    const url = typeof data === 'string' ? data : data?.url;
    if (!url) throw new Error('上传失败');
    form.avatarUrl = url;
    uni.hideLoading();
    uni.showToast({ title: '头像上传成功，记得点保存', icon: 'none' });
  } catch (e) {
    uni.hideLoading();
    if (e && e.errMsg && e.errMsg.includes('cancel')) return;
    uni.showToast({ title: '头像上传失败，请重试', icon: 'none' });
  }
}

async function onSave() {
  if (saving.value || !dirty.value) return;
  error.value = '';
  saving.value = true;
  try {
    const payload = {
      nickname:  form.nickname,
      realName:  form.realName,
      avatarUrl: form.avatarUrl,
      gender:    form.gender,
    };
    await userStore.updateProfile(payload);
    initial.value = { ...form };
    uni.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/user/index' }) }), 400);
  } catch (e) {
    if (!e || (e.code !== 401 && e.code !== 10001)) {
      error.value = e?.message || '保存失败';
    }
  } finally {
    saving.value = false;
  }
}

// 兜底：用户在该页时 store 异步刷新了 profile，同步表单
watch(() => userStore.profile, (p) => {
  if (!dirty.value) hydrate(p);
});
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  background: $tk-bg-page;
}
.page__scroll {
  height: 100vh;
  box-sizing: border-box;
}
.page__inner {
  padding: $tk-sp-3 $tk-sp-3 $tk-sp-6;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-3;
}

.avatar-card {
  display: flex;
  align-items: center;
  gap: $tk-sp-3;
  padding: $tk-sp-3;
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  box-shadow: $tk-shadow-card;

  &__l {
    flex-shrink: 0;
  }
  &__c {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }
  &__title {
    font-size: $tk-fs-md;
    color: $tk-text-1;
    font-weight: 600;
  }
  &__sub {
    font-size: $tk-fs-xs;
    color: $tk-text-3;
  }
}

.form {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  box-shadow: $tk-shadow-card;
  overflow: hidden;
}

.row {
  display: flex;
  align-items: center;
  padding: $tk-sp-3;
  gap: $tk-sp-3;
  border-bottom: 2rpx solid $tk-divider-light;

  &--last {
    border-bottom: none;
  }
  &--block {
    flex-direction: column;
    align-items: flex-start;
    gap: 8rpx;
    border-bottom: none;
  }

  &__label {
    flex-shrink: 0;
    width: 160rpx;
    font-size: $tk-fs-sm;
    color: $tk-text-2;
  }
  &__sub {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }
  &__input {
    flex: 1;
    font-size: $tk-fs-md;
    color: $tk-text-1;
    text-align: right;

    &--block {
      width: 100%;
      text-align: left;
      padding: $tk-sp-2;
      background: $tk-bg-page;
      border-radius: $tk-radius-md;
      box-sizing: border-box;
    }
  }
  &__readonly {
    flex: 1;
    font-size: $tk-fs-md;
    color: $tk-text-3;
    text-align: right;
  }
  &__radio {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    gap: 12rpx;
  }
  &__radio-item {
    padding: 6rpx 24rpx;
    border-radius: $tk-radius-full;
    background: $tk-bg-page;
    border: 2rpx solid transparent;

    &.is-active {
      background: $tk-primary-soft;
      border-color: $tk-primary;
    }
  }
  &__radio-txt {
    font-size: $tk-fs-sm;
    color: $tk-text-2;
  }
  &__radio-item.is-active &__radio-txt {
    color: $tk-primary;
    font-weight: 600;
  }
}

.hint {
  background: rgba(230, 33, 23, 0.08);
  border: 2rpx solid rgba(230, 33, 23, 0.30);
  border-radius: $tk-radius-md;
  padding: $tk-sp-2 $tk-sp-3;

  &__txt {
    font-size: $tk-fs-sm;
    color: $tk-primary;
  }
}
</style>
