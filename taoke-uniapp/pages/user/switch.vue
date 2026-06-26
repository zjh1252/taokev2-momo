<!--
  修改身份 — 对齐 PC /dashboard/account/switch
  展示 8 种业务角色，支持切换当前身份、申请新角色（跳转 PC/H5）
-->
<template>
  <view class="page">
    <TkNavBar title="修改身份" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <view class="current">
          <text class="current__label">当前身份</text>
          <text class="current__value">{{ userStore.activeRoleLabel }}</text>
        </view>

        <view class="cards">
          <view v-for="role in ALL_ROLES" :key="role.code" class="card">
            <view class="card__main">
              <view class="card__icon">
                <TkIcon :name="role.icon" :size="36" color="#E62117" />
              </view>
              <view class="card__meta">
                <view class="card__title-row">
                  <text class="card__title">{{ role.label }}</text>
                  <text v-if="isCurrent(role.code)" class="card__tag card__tag--current">当前身份</text>
                  <text v-else-if="roleStatus(role.code) === 2" class="card__tag card__tag--pending">审核中</text>
                  <text v-else-if="roleStatus(role.code) === 3" class="card__tag card__tag--reject">已驳回</text>
                </view>
                <text class="card__desc">{{ role.description }}</text>
              </view>
            </view>
            <view class="card__actions">
              <view
                v-if="canSwitch(role.code)"
                class="card__btn card__btn--ghost"
                @tap="onSwitch(role.code)"
              >
                <text class="card__btn-txt">点击切换</text>
              </view>
              <view
                v-if="canApply(role.code)"
                class="card__btn card__btn--primary"
                @tap="onApply(role.code)"
              >
                <text class="card__btn-txt card__btn-txt--white">点击申请</text>
              </view>
              <view
                v-if="canEditProfile(role.code)"
                class="card__btn card__btn--ghost"
                @tap="onEditProfile(role.code)"
              >
                <text class="card__btn-txt">修改角色资料</text>
              </view>
            </view>
          </view>
        </view>

        <view style="height: 40rpx;" />
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import config from '@/configs';
import { getNavBarHeight } from '@/utils/system';

const navBarH = getNavBarHeight();
const userStore = useUserStore();

const WEB_BASE = (config.assetBaseURL || 'https://v2.taoke.com').replace(/\/+$/, '');

const ALL_ROLES = [
  { code: 'BUYER', label: '个人学员', description: '默认角色，浏览课程、学习记录', icon: 'person' },
  { code: 'ENTERPRISE_BUYER', label: '企业培训采购方', description: '发布培训需求、购买课程', icon: 'shop' },
  { code: 'TRAINER', label: '专家', description: '发布课程、管理授课案例', icon: 'expert' },
  { code: 'AGENT', label: '专家经纪人', description: '维护专家资源、筛选匹配推荐', icon: 'person' },
  { code: 'ASSISTANT', label: '专家助理', description: '辅助专家运营管理', icon: 'person' },
  { code: 'ENTERPRISE_AGENT', label: '专家经纪公司', description: '批量运营专家资源', icon: 'vip' },
  { code: 'INSTITUTION', label: '培训机构', description: '管理师资团队、发布课程', icon: 'course' },
  { code: 'INSTITUTION_EMPLOYEE', label: '机构员工', description: '机构内部运营人员', icon: 'person' },
];

const APPLYABLE = new Set([
  'ENTERPRISE_BUYER',
  'TRAINER',
  'AGENT',
  'ASSISTANT',
  'ENTERPRISE_AGENT',
  'INSTITUTION',
  'INSTITUTION_EMPLOYEE',
]);

const roleStatusMap = computed(() => {
  const map = new Map();
  map.set('BUYER', 1);
  (userStore.profile?.roles || []).forEach((r) => {
    if (r?.role) map.set(r.role, r.status);
  });
  return map;
});

onShow(() => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/auth/login' });
    return;
  }
  userStore.fetchProfile();
});

function roleStatus(code) {
  return roleStatusMap.value.get(code);
}

function isActive(code) {
  return roleStatus(code) === 1;
}

function isCurrent(code) {
  return userStore.activeRole === code;
}

function canSwitch(code) {
  return isActive(code) && !isCurrent(code);
}

function canApply(code) {
  return APPLYABLE.has(code) && !isActive(code) && roleStatus(code) !== 2;
}

function canEditProfile(code) {
  return isActive(code) && code !== 'BUYER';
}

function onSwitch(code) {
  userStore.setActiveRole(code);
  uni.showToast({ title: `已切换为${ALL_ROLES.find((r) => r.code === code)?.label || ''}`, icon: 'none' });
}

function onApply(code) {
  uni.showModal({
    title: '申请角色',
    content: '角色入驻申请需在 PC/H5 用户中心填写完整资料，是否复制链接？',
    confirmText: '复制链接',
    success: (res) => {
      if (!res.confirm) return;
      const url = `${WEB_BASE}/dashboard/apply/${code}`;
      uni.setClipboardData({
        data: url,
        success: () => uni.showToast({ title: '链接已复制', icon: 'none' }),
      });
    },
  });
}

function onEditProfile(code) {
  uni.showModal({
    title: '修改角色资料',
    content: '请在 PC/H5 用户中心修改角色资料，是否复制链接？',
    confirmText: '复制链接',
    success: (res) => {
      if (!res.confirm) return;
      const url = `${WEB_BASE}/dashboard/apply/${code}`;
      uni.setClipboardData({
        data: url,
        success: () => uni.showToast({ title: '链接已复制', icon: 'none' }),
      });
    },
  });
}
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
  padding: $tk-sp-3;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-3;
}

.current {
  background: linear-gradient(135deg, rgba(230, 33, 23, 0.08) 0%, rgba(255, 107, 53, 0.05) 100%);
  border: 2rpx solid rgba(230, 33, 23, 0.12);
  border-radius: $tk-radius-lg;
  padding: $tk-sp-4;

  &__label {
    font-size: $tk-fs-sm;
    color: $tk-text-3;
    display: block;
    margin-bottom: 8rpx;
  }
  &__value {
    font-size: $tk-fs-xl;
    font-weight: 800;
    color: $tk-primary;
  }
}

.cards {
  display: flex;
  flex-direction: column;
  gap: $tk-sp-3;
}

.card {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-3;
  box-shadow: $tk-shadow-card;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-3;

  &__main {
    display: flex;
    gap: $tk-sp-3;
    align-items: flex-start;
  }
  &__icon {
    width: 72rpx;
    height: 72rpx;
    border-radius: $tk-radius-md;
    background: $tk-primary-soft;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  &__meta {
    flex: 1;
    min-width: 0;
  }
  &__title-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 6rpx;
  }
  &__title {
    font-size: $tk-fs-md;
    font-weight: 700;
    color: $tk-text-1;
  }
  &__tag {
    font-size: 20rpx;
    padding: 2rpx 12rpx;
    border-radius: $tk-radius-xs;

    &--current {
      background: $tk-primary-soft;
      color: $tk-primary;
    }
    &--pending {
      background: rgba(245, 158, 11, 0.15);
      color: #D97706;
    }
    &--reject {
      background: rgba(230, 33, 23, 0.10);
      color: $tk-primary;
    }
  }
  &__desc {
    font-size: $tk-fs-xs;
    color: $tk-text-3;
    line-height: $tk-lh-normal;
  }
  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: $tk-sp-2;
    justify-content: flex-end;
  }
  &__btn {
    padding: 12rpx 28rpx;
    border-radius: $tk-radius-full;

    &--ghost {
      border: 2rpx solid $tk-divider;
    }
    &--primary {
      background: $tk-primary;
    }
  }
  &__btn-txt {
    font-size: $tk-fs-sm;
    color: $tk-text-2;
    font-weight: 600;

    &--white {
      color: #fff;
    }
  }
}
</style>
