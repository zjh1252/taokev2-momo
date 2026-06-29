<!--
  修改身份 — 已拥有身份与可申请身份分区展示（PDF 3 要求）
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

        <view v-if="ownedRoles.length" class="section">
          <text class="section__title">已拥有身份（{{ ownedRoles.length }}）</text>
          <view class="cards">
            <view v-for="role in ownedRoles" :key="role.code" class="card">
              <RoleCard
                :role="role"
                :is-current="isCurrent(role.code)"
                @switch="onSwitch(role.code)"
                @edit="onEditProfile(role.code)"
              />
            </view>
          </view>
        </view>

        <view v-if="otherRoles.length" class="section">
          <text class="section__title">其他身份</text>
          <view class="cards">
            <view v-for="role in otherRoles" :key="role.code" class="card">
              <RoleCard
                :role="role"
                :status="roleStatus(role.code)"
                :can-apply="canApply(role.code)"
                @apply="onApply(role.code)"
              />
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
import RoleCard from './switch-role-card.vue';

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
  'ENTERPRISE_BUYER', 'TRAINER', 'AGENT', 'ASSISTANT',
  'ENTERPRISE_AGENT', 'INSTITUTION', 'INSTITUTION_EMPLOYEE',
]);

const roleStatusMap = computed(() => {
  const map = new Map();
  map.set('BUYER', 1);
  (userStore.profile?.roles || []).forEach((r) => {
    if (r?.role) map.set(r.role, r.status);
  });
  return map;
});

const ownedRoles = computed(() =>
  ALL_ROLES.filter((r) => roleStatus(r.code) === 1),
);

const otherRoles = computed(() =>
  ALL_ROLES.filter((r) => roleStatus(r.code) !== 1),
);

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

function isCurrent(code) {
  return userStore.activeRole === code;
}

function canApply(code) {
  return APPLYABLE.has(code) && roleStatus(code) !== 2;
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

.section {
  display: flex;
  flex-direction: column;
  gap: $tk-sp-2;

  &__title {
    font-size: $tk-fs-sm;
    color: $tk-text-3;
    padding: 0 $tk-sp-1;
  }
}

.cards {
  display: flex;
  flex-direction: column;
  gap: $tk-sp-3;
}
</style>
