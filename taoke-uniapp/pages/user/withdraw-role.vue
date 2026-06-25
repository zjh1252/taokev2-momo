<!--
  注销身份 — DELETE /users/me/roles/{roleCode}
  仅 status=1 且非 BUYER 的角色可注销
-->
<template>
  <view class="page">
    <TkNavBar title="注销身份" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <text class="desc">
          注销为不可恢复的硬删除操作。注销后将立即删除该角色对应的全部业务子表数据和相关绑定关系。
        </text>

        <view v-if="!withdrawableRoles.length" class="empty">
          <text class="empty__txt">您当前没有可注销的非默认身份。</text>
          <text class="empty__sub">如需注销账号，请前往「我的 → 注销账号」。</text>
        </view>

        <view v-else class="list">
          <view v-for="r in withdrawableRoles" :key="r.role" class="row">
            <view class="row__meta">
              <text class="row__title">{{ roleLabel(r.role) }}</text>
              <text class="row__code">{{ r.role }}</text>
            </view>
            <view class="row__btn" @tap="openConfirm(r.role)">
              <text class="row__btn-txt">注销该身份</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { roleLabel } from '@/constants/role';
import * as userApi from '@/api/user';
import { getNavBarHeight } from '@/utils/system';

const navBarH = getNavBarHeight();
const userStore = useUserStore();
const submitting = ref(false);

const withdrawableRoles = computed(() =>
  (userStore.profile?.roles || []).filter(
    (r) => r?.status === 1 && r.role !== 'BUYER',
  ),
);

onShow(() => {
  if (userStore.isLoggedIn) userStore.fetchProfile();
});

function openConfirm(roleCode) {
  const label = roleLabel(roleCode);
  uni.showModal({
    title: `确认注销「${label}」身份`,
    content: `注销后将立即硬删除「${label}」角色记录、对应业务资料及绑定关系。此操作不可恢复。`,
    confirmText: '确认注销',
    confirmColor: '#DC2626',
    success: (res) => {
      if (res.confirm) handleWithdraw(roleCode);
    },
  });
}

async function handleWithdraw(roleCode) {
  if (submitting.value) return;
  submitting.value = true;
  uni.showLoading({ title: '正在注销...' });
  try {
    await userApi.withdrawRole(roleCode);
    uni.hideLoading();
    uni.showToast({ title: '身份已注销', icon: 'none' });
    await userStore.fetchProfile();
    if (userStore.activeRole === roleCode) {
      userStore.setActiveRole('BUYER');
    }
  } catch (_) {
    uni.hideLoading();
  } finally {
    submitting.value = false;
  }
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
  line-height: 1.6;
}

.empty {
  padding: 80rpx $tk-sp-4;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 12rpx;

  &__txt {
    font-size: $tk-fs-sm;
    color: $tk-text-3;
  }
  &__sub {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }
}

.list {
  display: flex;
  flex-direction: column;
  gap: $tk-sp-2;
}

.row {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-3 $tk-sp-4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $tk-sp-3;
  box-shadow: $tk-shadow-card;

  &__meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  &__title {
    font-size: $tk-fs-md;
    font-weight: 600;
    color: $tk-text-1;
  }

  &__code {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }

  &__btn {
    flex-shrink: 0;
    padding: 12rpx 24rpx;
    border: 2rpx solid rgba(239, 68, 68, 0.35);
    border-radius: $tk-radius-md;
  }

  &__btn-txt {
    font-size: $tk-fs-xs;
    color: #DC2626;
    font-weight: 600;
  }
}
</style>
