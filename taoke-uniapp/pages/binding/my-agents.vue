<!-- 我的代理 — 专家视角 -->
<template>
  <view class="page">
    <TkNavBar title="我的代理" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <view class="section">
          <view class="section__head">
            <text class="section__title">待我确认</text>
            <text v-if="pending.length" class="section__badge">{{ pending.length }}</text>
          </view>
          <TkLoading v-if="loading" />
          <TkEmpty v-else-if="!pending.length" text="暂无待确认的绑定请求" />
          <view v-else class="list">
            <view v-for="item in pending" :key="itemKey(item)" class="card">
              <text class="card__name">{{ displayName(item) }}</text>
              <text class="card__role">{{ item.counterpartRoleLabel || item.counterpartRole || '—' }}</text>
              <text class="card__meta">{{ item.ifInitiator ? '对方发起' : '我方发起' }} · {{ fmtDate(item.createdAt) }}</text>
              <view class="card__actions">
                <view class="card__act card__act--ok" @tap="handleConfirm(item)">
                  <text>{{ actingId === item.id ? '处理中…' : '同意' }}</text>
                </view>
                <view class="card__act card__act--no" @tap="openReject(item)">
                  <text>拒绝</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view class="section">
          <view class="section__head">
            <text class="section__title">已生效绑定</text>
            <text v-if="active.length" class="section__badge section__badge--green">{{ active.length }}</text>
          </view>
          <TkLoading v-if="loading" />
          <TkEmpty v-else-if="!active.length" text="暂无已生效的代理绑定" />
          <view v-else class="list">
            <view v-for="item in active" :key="itemKey(item)" class="card">
              <text class="card__name">{{ displayName(item) }}</text>
              <text class="card__role">{{ item.counterpartRoleLabel || item.counterpartRole || '—' }}</text>
              <text class="card__meta">电话：{{ item.counterpartPhone || '—' }}</text>
              <view class="card__actions">
                <view class="card__act card__act--danger" @tap="handleUnbind(item)">
                  <text>解除绑定</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="rejectItem" class="modal" @tap.self="rejectItem = null">
      <view class="modal__panel" @tap.stop>
        <text class="modal__title">拒绝绑定请求</text>
        <textarea class="field__textarea" :value="rejectReason" placeholder="拒绝理由（可选）" @input="rejectReason = $event.detail.value" />
        <view class="modal__foot">
          <view class="modal__ghost" @tap="rejectItem = null"><text>取消</text></view>
          <view class="modal__primary" @tap="submitReject"><text>确认拒绝</text></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import {
  listMyAgents,
  listMyBindingRequests,
  confirmBindingByTrainer,
  rejectBindingByTrainer,
  unbind,
  BINDING_STATUS,
} from '@/api/binding';
import { getNavBarHeight } from '@/utils/system';
import { requireLogin } from '@/utils/auth';

const navBarH = getNavBarHeight();

const loading = ref(true);
const pending = ref([]);
const active = ref([]);
const actingId = ref(null);
const rejectItem = ref(null);
const rejectReason = ref('');

onShow(() => {
  if (!requireLogin()) return;
  load();
});

async function load() {
  loading.value = true;
  try {
    const [reqs, agents] = await Promise.all([listMyBindingRequests(), listMyAgents()]);
    pending.value = (reqs || []).filter((b) => b.status === BINDING_STATUS.PENDING);
    active.value = (agents || []).filter((b) => b.status === BINDING_STATUS.ACTIVE);
  } catch (_) {
    pending.value = [];
    active.value = [];
  } finally {
    loading.value = false;
  }
}

function itemKey(item) {
  return `${item.bindingType}-${item.id}`;
}

function displayName(item) {
  return item.counterpartNickname || item.counterpartOrgName || item.counterpartRealName || `用户#${item.counterpartUserId}`;
}

function fmtDate(v) {
  return v ? String(v).slice(0, 10) : '';
}

async function handleConfirm(item) {
  actingId.value = item.id;
  try {
    await confirmBindingByTrainer(item.bindingType, item.id);
    uni.showToast({ title: '已同意绑定', icon: 'none' });
    await load();
  } finally {
    actingId.value = null;
  }
}

function openReject(item) {
  rejectItem.value = item;
  rejectReason.value = '';
}

async function submitReject() {
  if (!rejectItem.value) return;
  actingId.value = rejectItem.value.id;
  try {
    await rejectBindingByTrainer(rejectItem.value.bindingType, rejectItem.value.id, rejectReason.value.trim() || undefined);
    uni.showToast({ title: '已拒绝', icon: 'none' });
    rejectItem.value = null;
    await load();
  } finally {
    actingId.value = null;
  }
}

function handleUnbind(item) {
  uni.showModal({
    title: '解除绑定',
    content: '确定解除与该角色的绑定？',
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
  &__badge { font-size: $tk-fs-xs; color: #D97706; background: rgba(245, 158, 11, 0.12); padding: 4rpx 12rpx; border-radius: $tk-radius-full; &--green { color: #059669; background: rgba(5, 150, 105, 0.12); } }
}

.list { display: flex; flex-direction: column; gap: $tk-sp-2; }
.card {
  background: $tk-bg-card; border-radius: $tk-radius-lg; padding: $tk-sp-3; box-shadow: $tk-shadow-card;
  display: flex; flex-direction: column; gap: 8rpx;
  &__name { font-size: $tk-fs-md; font-weight: 700; color: $tk-text-1; }
  &__role { font-size: $tk-fs-sm; color: $tk-primary; }
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
