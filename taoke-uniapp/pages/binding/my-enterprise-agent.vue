<!-- 我的经纪公司 — 经纪人视角 -->
<template>
  <view class="page">
    <TkNavBar title="我的经纪公司" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <view class="section">
          <view class="section__head">
            <text class="section__title">公司邀请</text>
            <text v-if="pending.length" class="section__badge">{{ pending.length }}</text>
          </view>
          <TkLoading v-if="loading" />
          <TkEmpty v-else-if="!pending.length" text="暂无待确认的公司邀请" />
          <view v-else class="list">
            <view v-for="item in pending" :key="item.id" class="card">
              <text class="card__name">{{ item.counterpartOrgName || displayName(item) }}</text>
              <text class="card__meta">{{ fmtDate(item.createdAt) }}</text>
              <view class="card__actions">
                <view class="card__act card__act--ok" @tap="handleConfirm(item)"><text>同意加入</text></view>
                <view class="card__act card__act--no" @tap="openReject(item)"><text>拒绝</text></view>
              </view>
            </view>
          </view>
        </view>

        <view class="section">
          <view class="section__head">
            <text class="section__title">已加入的经纪公司</text>
          </view>
          <TkLoading v-if="loading" />
          <TkEmpty v-else-if="!active.length" text="暂未加入任何经纪公司" />
          <view v-else class="list">
            <view v-for="item in active" :key="item.id" class="card">
              <text class="card__name">{{ item.counterpartOrgName || displayName(item) }}</text>
              <text class="card__meta">确认时间：{{ fmtDate(item.confirmedAt) }}</text>
              <view class="card__actions">
                <view class="card__act card__act--danger" @tap="handleUnbind(item)"><text>离开公司</text></view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="rejectItem" class="modal" @tap.self="rejectItem = null">
      <view class="modal__panel" @tap.stop>
        <text class="modal__title">拒绝邀请</text>
        <textarea class="field__textarea" :value="rejectReason" placeholder="拒绝理由（可选）" @input="rejectReason = $event.detail.value" />
        <view class="modal__foot">
          <view class="modal__ghost" @tap="rejectItem = null"><text>取消</text></view>
          <view class="modal__primary" @tap="submitReject"><text>确认</text></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import {
  listMyEnterpriseAgents,
  confirmBindingByAgent,
  rejectBindingByAgent,
  unbind,
  BINDING_STATUS,
} from '@/api/binding';
import { getNavBarHeight } from '@/utils/system';
import { requireLogin } from '@/utils/auth';

const navBarH = getNavBarHeight();
const loading = ref(true);
const pending = ref([]);
const active = ref([]);
const rejectItem = ref(null);
const rejectReason = ref('');

onShow(() => {
  if (!requireLogin()) return;
  load();
});

async function load() {
  loading.value = true;
  try {
    const list = await listMyEnterpriseAgents() || [];
    pending.value = list.filter((b) => b.status === BINDING_STATUS.PENDING && !b.ifInitiator);
    active.value = list.filter((b) => b.status === BINDING_STATUS.ACTIVE);
  } catch (_) {
    pending.value = [];
    active.value = [];
  } finally {
    loading.value = false;
  }
}

function displayName(item) {
  return item.counterpartNickname || item.counterpartOrgName || `公司#${item.counterpartUserId}`;
}

function fmtDate(v) {
  return v ? String(v).slice(0, 10) : '';
}

async function handleConfirm(item) {
  await confirmBindingByAgent(item.id);
  uni.showToast({ title: '已加入经纪公司', icon: 'none' });
  await load();
}

function openReject(item) {
  rejectItem.value = item;
  rejectReason.value = '';
}

async function submitReject() {
  if (!rejectItem.value) return;
  await rejectBindingByAgent(rejectItem.value.id, rejectReason.value.trim() || undefined);
  uni.showToast({ title: '已拒绝', icon: 'none' });
  rejectItem.value = null;
  await load();
}

function handleUnbind(item) {
  uni.showModal({
    title: '离开公司',
    content: '确定离开该经纪公司？',
    confirmColor: '#DC2626',
    success: async (res) => {
      if (!res.confirm) return;
      await unbind(item.bindingType, item.id);
      uni.showToast({ title: '已解除绑定', icon: 'none' });
      await load();
    },
  });
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: $tk-bg-page; }
.page__scroll { height: 100vh; }
.page__inner { padding: $tk-sp-3; display: flex; flex-direction: column; gap: $tk-sp-4; padding-bottom: 40rpx; }
.section {
  &__head { display: flex; align-items: center; gap: 12rpx; margin-bottom: $tk-sp-2; }
  &__title { font-size: $tk-fs-lg; font-weight: 700; color: $tk-text-1; }
  &__badge { font-size: $tk-fs-xs; color: #D97706; background: rgba(245, 158, 11, 0.12); padding: 4rpx 12rpx; border-radius: $tk-radius-full; }
}
.list { display: flex; flex-direction: column; gap: $tk-sp-2; }
.card {
  background: $tk-bg-card; border-radius: $tk-radius-lg; padding: $tk-sp-3; box-shadow: $tk-shadow-card;
  display: flex; flex-direction: column; gap: 8rpx;
  &__name { font-size: $tk-fs-md; font-weight: 700; color: $tk-text-1; }
  &__meta { font-size: $tk-fs-xs; color: $tk-text-3; }
  &__actions { margin-top: 8rpx; display: flex; gap: $tk-sp-2; justify-content: flex-end; }
  &__act { padding: 10rpx 24rpx; border-radius: $tk-radius-md; font-size: $tk-fs-xs; &--ok { background: $tk-primary; color: #fff; } &--no { border: 2rpx solid $tk-divider-light; color: $tk-text-2; } &--danger { border: 2rpx solid rgba(220, 38, 38, 0.3); color: #DC2626; } }
}
.modal {
  position: fixed; inset: 0; z-index: 100; background: rgba(0, 0, 0, 0.45);
  display: flex; align-items: center; justify-content: center; padding: $tk-sp-4;
  &__panel { width: 100%; background: #fff; border-radius: $tk-radius-lg; padding: $tk-sp-4; display: flex; flex-direction: column; gap: $tk-sp-3; }
  &__title { font-size: $tk-fs-lg; font-weight: 700; color: $tk-text-1; }
  &__foot { display: flex; gap: $tk-sp-2; justify-content: flex-end; }
  &__ghost, &__primary { padding: 16rpx 32rpx; border-radius: $tk-radius-md; font-size: $tk-fs-sm; }
  &__ghost { border: 2rpx solid $tk-divider-light; color: $tk-text-2; }
  &__primary { background: $tk-primary; color: #fff; }
}
.field__textarea { width: 100%; min-height: 160rpx; padding: 20rpx; background: $tk-bg-page; border-radius: $tk-radius-md; font-size: $tk-fs-md; box-sizing: border-box; }
</style>
