<!-- 我的员工 — 培训机构视角 -->
<template>
  <view class="page">
    <TkNavBar title="我的员工" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <scroll-view scroll-x class="tabs">
          <view
            v-for="t in statusTabs"
            :key="t.key"
            class="tab"
            :class="{ 'tab--active': tab === t.key }"
            @tap="tab = t.key"
          >
            <text class="tab__txt">{{ t.label }}</text>
          </view>
        </scroll-view>

        <TkLoading v-if="loading" />
        <TkEmpty v-else-if="!filtered.length" text="暂无员工绑定" />
        <view v-else class="list">
          <view v-for="item in filtered" :key="item.id" class="card">
            <text class="card__name">{{ displayName(item) }}</text>
            <text class="card__badge">{{ item.statusLabel || '—' }}</text>
            <text class="card__meta">电话：{{ item.counterpartPhone || '—' }}</text>
            <view v-if="canApprove(item)" class="card__actions">
              <view class="card__act card__act--ok" @tap="handleApprove(item)"><text>通过</text></view>
              <view class="card__act card__act--no" @tap="openReject(item)"><text>拒绝</text></view>
            </view>
            <view v-else-if="canUnbind(item)" class="card__actions">
              <view class="card__act card__act--danger" @tap="handleUnbind(item)">
                <text>{{ item.status === BINDING_STATUS.PENDING ? '撤回邀请' : '解除绑定' }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="rejectItem" class="modal" @tap.self="rejectItem = null">
      <view class="modal__panel" @tap.stop>
        <text class="modal__title">拒绝申请</text>
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
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import {
  listInstitutionEmployees,
  approveEmployeeByInstitution,
  rejectEmployeeByInstitution,
  unbind,
  BINDING_STATUS,
} from '@/api/binding';
import { getNavBarHeight } from '@/utils/system';
import { requireLogin } from '@/utils/auth';

const navBarH = getNavBarHeight();
const loading = ref(true);
const items = ref([]);
const tab = ref('all');
const rejectItem = ref(null);
const rejectReason = ref('');

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending-review', label: '待我审核', predicate: (b) => b.status === BINDING_STATUS.PENDING && !b.ifInitiator },
  { key: 'pending-mine', label: '待对方确认', predicate: (b) => b.status === BINDING_STATUS.PENDING && b.ifInitiator },
  { key: 'active', label: '已生效', predicate: (b) => b.status === BINDING_STATUS.ACTIVE },
  { key: 'rejected', label: '已拒绝', predicate: (b) => b.status === BINDING_STATUS.REJECTED },
];

const filtered = computed(() => {
  const t = statusTabs.find((x) => x.key === tab.value);
  if (!t?.predicate) return items.value;
  return items.value.filter(t.predicate);
});

onShow(() => {
  if (!requireLogin()) return;
  load();
});

async function load() {
  loading.value = true;
  try {
    items.value = await listInstitutionEmployees() || [];
  } catch (_) {
    items.value = [];
  } finally {
    loading.value = false;
  }
}

function displayName(item) {
  return item.counterpartNickname || item.counterpartRealName || `员工#${item.counterpartUserId}`;
}

function canApprove(item) {
  return item.status === BINDING_STATUS.PENDING && !item.ifInitiator;
}

function canUnbind(item) {
  return item.status === BINDING_STATUS.ACTIVE
    || (item.status === BINDING_STATUS.PENDING && item.ifInitiator);
}

async function handleApprove(item) {
  await approveEmployeeByInstitution(item.id);
  uni.showToast({ title: '已通过', icon: 'none' });
  await load();
}

function openReject(item) {
  rejectItem.value = item;
  rejectReason.value = '';
}

async function submitReject() {
  if (!rejectItem.value) return;
  await rejectEmployeeByInstitution(rejectItem.value.id, rejectReason.value.trim() || undefined);
  uni.showToast({ title: '已拒绝', icon: 'none' });
  rejectItem.value = null;
  await load();
}

function handleUnbind(item) {
  const isWithdraw = item.status === BINDING_STATUS.PENDING;
  uni.showModal({
    title: isWithdraw ? '撤回邀请' : '解除绑定',
    content: isWithdraw ? '确定撤回该邀请？' : '确定解除与该员工的绑定？',
    confirmColor: '#DC2626',
    success: async (res) => {
      if (!res.confirm) return;
      await unbind(item.bindingType, item.id);
      uni.showToast({ title: isWithdraw ? '已撤回' : '已解除', icon: 'none' });
      await load();
    },
  });
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: $tk-bg-page; }
.page__scroll { height: 100vh; }
.page__inner { padding: $tk-sp-3; display: flex; flex-direction: column; gap: $tk-sp-3; }
.tabs { white-space: nowrap; }
.tab {
  display: inline-block; padding: 12rpx 24rpx; margin-right: 12rpx;
  background: $tk-bg-card; border-radius: $tk-radius-full;
  &__txt { font-size: $tk-fs-sm; color: $tk-text-2; }
  &--active { background: $tk-primary; .tab__txt { color: #fff; } }
}
.list { display: flex; flex-direction: column; gap: $tk-sp-2; }
.card {
  background: $tk-bg-card; border-radius: $tk-radius-lg; padding: $tk-sp-3; box-shadow: $tk-shadow-card;
  &__name { font-size: $tk-fs-md; font-weight: 700; color: $tk-text-1; }
  &__badge { font-size: $tk-fs-xs; color: $tk-primary; margin-top: 4rpx; }
  &__meta { font-size: $tk-fs-xs; color: $tk-text-3; margin-top: 8rpx; }
  &__actions { margin-top: 12rpx; display: flex; gap: $tk-sp-2; justify-content: flex-end; }
  &__act { padding: 10rpx 24rpx; border-radius: $tk-radius-md; font-size: $tk-fs-xs; &--ok { background: $tk-primary; color: #fff; } &--no { border: 2rpx solid $tk-divider-light; } &--danger { border: 2rpx solid rgba(220,38,38,0.3); color: #DC2626; } }
}
.modal {
  position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center; padding: $tk-sp-4;
  &__panel { width: 100%; background: #fff; border-radius: $tk-radius-lg; padding: $tk-sp-4; display: flex; flex-direction: column; gap: $tk-sp-3; }
  &__title { font-size: $tk-fs-lg; font-weight: 700; }
  &__foot { display: flex; gap: $tk-sp-2; justify-content: flex-end; }
  &__ghost, &__primary { padding: 16rpx 32rpx; border-radius: $tk-radius-md; font-size: $tk-fs-sm; }
  &__ghost { border: 2rpx solid $tk-divider-light; }
  &__primary { background: $tk-primary; color: #fff; }
}
.field__textarea { width: 100%; min-height: 160rpx; padding: 20rpx; background: $tk-bg-page; border-radius: $tk-radius-md; box-sizing: border-box; }
</style>
