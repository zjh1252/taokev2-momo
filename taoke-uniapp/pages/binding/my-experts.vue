<!-- 我的专家 — 机构/经纪公司/经纪人/助理视角 -->
<template>
  <view class="page">
    <TkNavBar title="我的专家" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <view class="head">
          <text class="head__count">共 {{ items.length }} 位</text>
          <view class="head__btn" @tap="showAdd = true">
            <text class="head__btn-txt">添加专家</text>
          </view>
        </view>

        <scroll-view scroll-x class="tabs">
          <view
            v-for="t in statusTabs"
            :key="t.label"
            class="tab"
            :class="{ 'tab--active': tab === t.value }"
            @tap="tab = t.value"
          >
            <text class="tab__txt">{{ t.label }}</text>
            <text v-if="t.value !== undefined" class="tab__cnt">({{ countByStatus(t.value) }})</text>
          </view>
        </scroll-view>

        <TkLoading v-if="loading" />
        <TkEmpty v-else-if="!filtered.length" icon="expert" text="暂无专家绑定" />
        <view v-else class="list">
          <view v-for="item in filtered" :key="itemKey(item)" class="card">
            <view class="card__head">
              <text class="card__name">{{ displayName(item) }}</text>
              <text class="card__badge">{{ item.statusLabel || statusLabel(item.status) }}</text>
            </view>
            <text class="card__meta">真实姓名：{{ item.counterpartRealName || '—' }}</text>
            <text class="card__meta">电话：{{ item.counterpartPhone || '—' }}</text>
            <text class="card__meta">
              {{ item.ifInitiator ? '我方发起邀请' : '对方发起申请' }}
              <text v-if="item.createdAt"> · {{ fmtDate(item.createdAt) }}</text>
            </text>
            <text v-if="item.note" class="card__note">备注：{{ item.note }}</text>
            <text v-if="item.rejectReason" class="card__reject">拒绝理由：{{ item.rejectReason }}</text>
            <view
              v-if="item.status === BINDING_STATUS.ACTIVE || (item.status === BINDING_STATUS.PENDING && item.ifInitiator)"
              class="card__actions"
            >
              <view class="card__act card__act--danger" @tap="handleUnbind(item)">
                <text>{{ item.status === BINDING_STATUS.PENDING ? '撤回邀请' : '解除绑定' }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="showAdd" class="modal" @tap.self="closeAdd">
      <view class="modal__panel" @tap.stop>
        <view class="modal__head">
          <text class="modal__title">添加专家</text>
          <view @tap="closeAdd"><TkIcon name="close" :size="32" color="#999" /></view>
        </view>
        <view class="modal__body">
          <text class="field__label">专家手机号</text>
          <view class="search-row">
            <input class="field__input" :value="phone" placeholder="请输入对方注册手机号" @input="phone = $event.detail.value" />
            <view class="search-row__btn" @tap="handleLookup">
              <text>{{ searching ? '查找中…' : '查找' }}</text>
            </view>
          </view>
          <text v-if="lookupError" class="hint hint--warn">{{ lookupError }}</text>
          <view v-if="picked" class="picked">
            <text class="picked__name">{{ picked.nickname || `用户#${picked.id}` }}</text>
            <text class="picked__phone">{{ picked.phone }}</text>
          </view>
          <text class="field__label">备注（可选）</text>
          <textarea class="field__textarea" :value="note" placeholder="向专家说明绑定意图" @input="note = $event.detail.value" />
        </view>
        <view class="modal__foot">
          <view class="modal__ghost" @tap="closeAdd"><text>取消</text></view>
          <view class="modal__primary" @tap="handleAdd">
            <text>{{ submitting ? '提交中…' : '发起绑定' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import {
  listMyExpertsByRole,
  mapRoleToExpertBindingType,
  initiateBinding,
  unbind,
  lookupUserByPhone,
  BINDING_STATUS,
  BINDING_STATUS_LABEL,
} from '@/api/binding';
import { getNavBarHeight } from '@/utils/system';
import { requireLogin } from '@/utils/auth';
import { useUserStore } from '@/stores/user';

const navBarH = getNavBarHeight();
const userStore = useUserStore();

const loading = ref(true);
const items = ref([]);
const tab = ref(undefined);
const showAdd = ref(false);
const phone = ref('');
const note = ref('');
const picked = ref(null);
const searching = ref(false);
const submitting = ref(false);
const lookupError = ref('');

const statusTabs = [
  { label: '全部', value: undefined },
  { label: '已生效', value: BINDING_STATUS.ACTIVE },
  { label: '待确认', value: BINDING_STATUS.PENDING },
  { label: '已拒绝', value: BINDING_STATUS.REJECTED },
  { label: '已解绑', value: BINDING_STATUS.UNBOUND },
];

const filtered = computed(() => {
  if (tab.value === undefined) return items.value;
  return items.value.filter((b) => b.status === tab.value);
});

onShow(() => {
  if (!requireLogin()) return;
  fetchData();
});

async function fetchData() {
  loading.value = true;
  try {
    items.value = await listMyExpertsByRole(userStore.activeRole) || [];
  } catch (_) {
    items.value = [];
  } finally {
    loading.value = false;
  }
}

function countByStatus(status) {
  return items.value.filter((b) => b.status === status).length;
}

function itemKey(item) {
  return `${item.bindingType}-${item.id}`;
}

function displayName(item) {
  return item.counterpartNickname || item.counterpartRealName || `专家#${item.counterpartUserId}`;
}

function statusLabel(status) {
  return BINDING_STATUS_LABEL[status] || '—';
}

function fmtDate(v) {
  return v ? String(v).slice(0, 10) : '';
}

function closeAdd() {
  showAdd.value = false;
  phone.value = '';
  note.value = '';
  picked.value = null;
  lookupError.value = '';
}

async function handleLookup() {
  const p = phone.value.trim();
  if (!p) return uni.showToast({ title: '请输入手机号', icon: 'none' });
  searching.value = true;
  lookupError.value = '';
  picked.value = null;
  try {
    const found = await lookupUserByPhone(p);
    if (userStore.profile?.id != null && found.id === userStore.profile.id) {
      lookupError.value = '不能邀请自己作为专家';
      return;
    }
    if (!found.approvedTrainer) {
      lookupError.value = '该用户尚未通过专家审核，暂时无法添加';
      return;
    }
    picked.value = found;
  } catch (e) {
    if (e?.status === 404) {
      lookupError.value = '平台上没有该用户，请先引导对方注册并完成专家入驻';
    } else {
      lookupError.value = e?.message || '查找失败';
    }
  } finally {
    searching.value = false;
  }
}

async function handleAdd() {
  if (submitting.value || !picked.value) {
    return uni.showToast({ title: '请先查找用户', icon: 'none' });
  }
  const bindingType = mapRoleToExpertBindingType(userStore.activeRole);
  if (!bindingType) return uni.showToast({ title: '当前身份不支持添加专家', icon: 'none' });
  submitting.value = true;
  try {
    await initiateBinding({
      bindingType,
      targetUserId: picked.value.id,
      note: note.value.trim() || undefined,
    });
    uni.showToast({ title: '绑定请求已发送', icon: 'none' });
    closeAdd();
    await fetchData();
  } finally {
    submitting.value = false;
  }
}

function handleUnbind(item) {
  const isWithdraw = item.status === BINDING_STATUS.PENDING;
  uni.showModal({
    title: isWithdraw ? '撤回邀请' : '解除绑定',
    content: isWithdraw ? '确定撤回该绑定邀请？' : '确定解除与该专家的绑定？',
    confirmColor: '#DC2626',
    success: async (res) => {
      if (!res.confirm) return;
      await unbind(item.bindingType, item.id);
      uni.showToast({ title: isWithdraw ? '已撤回' : '已解除绑定', icon: 'none' });
      await fetchData();
    },
  });
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: $tk-bg-page; }
.page__scroll { height: 100vh; }
.page__inner { padding: $tk-sp-3; display: flex; flex-direction: column; gap: $tk-sp-3; padding-bottom: 40rpx; }

.head {
  display: flex; align-items: center; justify-content: space-between;
  &__count { font-size: $tk-fs-sm; color: $tk-text-3; }
  &__btn { padding: 12rpx 28rpx; background: $tk-primary; border-radius: $tk-radius-md; }
  &__btn-txt { color: #fff; font-size: $tk-fs-sm; font-weight: 600; }
}

.tabs { white-space: nowrap; }
.tab {
  display: inline-flex; align-items: center; gap: 4rpx;
  padding: 12rpx 24rpx; margin-right: 12rpx;
  background: $tk-bg-card; border-radius: $tk-radius-full;
  &__txt { font-size: $tk-fs-sm; color: $tk-text-2; }
  &__cnt { font-size: $tk-fs-xs; color: $tk-text-4; }
  &--active { background: $tk-primary; .tab__txt, .tab__cnt { color: #fff; } }
}

.list { display: flex; flex-direction: column; gap: $tk-sp-2; }
.card {
  background: $tk-bg-card; border-radius: $tk-radius-lg; padding: $tk-sp-3;
  box-shadow: $tk-shadow-card; display: flex; flex-direction: column; gap: 8rpx;
  &__head { display: flex; align-items: center; justify-content: space-between; gap: $tk-sp-2; }
  &__name { flex: 1; font-size: $tk-fs-md; font-weight: 700; color: $tk-text-1; }
  &__badge { font-size: $tk-fs-xs; color: $tk-primary; background: $tk-primary-soft; padding: 4rpx 12rpx; border-radius: $tk-radius-xs; }
  &__meta { font-size: $tk-fs-xs; color: $tk-text-3; }
  &__note { font-size: $tk-fs-xs; color: $tk-text-2; }
  &__reject { font-size: $tk-fs-xs; color: #DC2626; }
  &__actions { margin-top: 8rpx; display: flex; justify-content: flex-end; }
  &__act {
    padding: 10rpx 24rpx; border-radius: $tk-radius-md; font-size: $tk-fs-xs;
    &--danger { border: 2rpx solid rgba(220, 38, 38, 0.3); color: #DC2626; }
  }
}

.modal {
  position: fixed; inset: 0; z-index: 100; background: rgba(0, 0, 0, 0.45);
  display: flex; align-items: center; justify-content: center; padding: $tk-sp-4;
  &__panel { width: 100%; max-width: 640rpx; background: #fff; border-radius: $tk-radius-lg; overflow: hidden; }
  &__head { padding: $tk-sp-3 $tk-sp-4; border-bottom: 2rpx solid $tk-divider-light; display: flex; align-items: center; justify-content: space-between; }
  &__title { font-size: $tk-fs-lg; font-weight: 700; color: $tk-text-1; }
  &__body { padding: $tk-sp-4; display: flex; flex-direction: column; gap: $tk-sp-2; }
  &__foot { padding: $tk-sp-3 $tk-sp-4; border-top: 2rpx solid $tk-divider-light; display: flex; gap: $tk-sp-2; justify-content: flex-end; }
  &__ghost, &__primary { padding: 16rpx 32rpx; border-radius: $tk-radius-md; font-size: $tk-fs-sm; }
  &__ghost { border: 2rpx solid $tk-divider-light; color: $tk-text-2; }
  &__primary { background: $tk-primary; color: #fff; font-weight: 600; }
}

.field__label { display: block; font-size: $tk-fs-sm; color: $tk-text-3; margin-bottom: 8rpx; }
.field__input, .field__textarea {
  width: 100%; padding: 20rpx 24rpx; background: $tk-bg-page; border-radius: $tk-radius-md;
  font-size: $tk-fs-md; color: $tk-text-1; box-sizing: border-box;
}
.field__textarea { min-height: 160rpx; }
.search-row { display: flex; gap: $tk-sp-2; align-items: center; &__btn { flex-shrink: 0; padding: 20rpx 24rpx; background: $tk-primary; border-radius: $tk-radius-md; color: #fff; font-size: $tk-fs-sm; } }
.hint { font-size: $tk-fs-xs; &--warn { color: #D97706; } }
.picked { padding: $tk-sp-2 $tk-sp-3; background: $tk-primary-soft; border-radius: $tk-radius-md; &__name { display: block; font-size: $tk-fs-md; font-weight: 600; color: $tk-text-1; } &__phone { font-size: $tk-fs-xs; color: $tk-text-3; } }
</style>
