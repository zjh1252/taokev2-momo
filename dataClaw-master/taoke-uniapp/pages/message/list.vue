<!--
  消息中心（GET /notifications）
  - 列表：每条 type 标签 + 标题 + 内容 2 行省略 + 时间 + 未读小红点
  - 顶部右侧"全部已读"
  - 点击未读条目：自动 markRead → 弹底部抽屉显示完整内容；如有 relatedUrl 提供"查看详情"按钮
  - 上拉加载更多（page 1-based）
-->
<template>
  <view class="page">
    <TkNavBar title="消息中心" left-icon="back">
      <template #right>
        <text class="navbar-action" @tap="onMarkAll">全部已读</text>
      </template>
    </TkNavBar>

    <scroll-view
      scroll-y
      class="page__scroll"
      :style="{ paddingTop: navBarH + 'px' }"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <view class="page__inner">
        <TkLoading v-if="loading && !list.length" />
        <TkEmpty v-else-if="!loading && !list.length" icon="campaign" text="暂无消息" />
        <view
          v-else
          v-for="m in list"
          :key="m.id"
          class="msg"
          :class="{ 'is-unread': m.isRead === 0 }"
          @tap="onItemTap(m)"
        >
          <view class="msg__icon" :class="iconClass(m.type)">
            <TkIcon :name="iconName(m.type)" :size="32" :color="iconColor(m.type)" />
          </view>
          <view class="msg__main">
            <view class="msg__head">
              <text class="msg__title">{{ m.title || m.typeLabel || '系统通知' }}</text>
              <text class="msg__time">{{ formatTime(m.createdAt) }}</text>
            </view>
            <text class="msg__content">{{ m.content || '暂无详细内容' }}</text>
            <view class="msg__foot">
              <text class="msg__type">{{ m.typeLabel || tagLabel(m.type) }}</text>
              <view v-if="m.isRead === 0" class="msg__dot" />
            </view>
          </view>
        </view>

        <view v-if="loadingMore" class="more"><TkLoading /></view>
        <view v-else-if="finished && list.length" class="more">
          <text class="more__txt">— 已经到底啦 —</text>
        </view>

        <view style="height: 40rpx;" />
      </view>
    </scroll-view>

    <!-- 详情底部抽屉 -->
    <view v-if="detail" class="modal" @tap="closeDetail">
      <view class="modal__sheet" @tap.stop>
        <view class="modal__head">
          <text class="modal__title">{{ detail.title || detail.typeLabel || '消息详情' }}</text>
          <view class="modal__close" @tap="closeDetail">
            <TkIcon name="close" :size="32" color="#999" />
          </view>
        </view>
        <view class="modal__meta">
          <text class="modal__type">{{ detail.typeLabel || tagLabel(detail.type) }}</text>
          <text class="modal__time">{{ formatTime(detail.createdAt) }}</text>
        </view>
        <view class="modal__body">
          <text class="modal__content">{{ detail.content || '暂无详细内容' }}</text>
        </view>
        <view v-if="detail.relatedUrl" class="modal__action" @tap="onJumpRelated(detail)">
          <text class="modal__action-txt">查看关联内容</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import * as notificationApi from '@/api/notification';
import { useUserStore } from '@/stores/user';

const sysInfo = uni.getSystemInfoSync();
const navBarH = (sysInfo.statusBarHeight || 20) + 44;
const userStore = useUserStore();

const list = ref([]);
const loading = ref(false);
const loadingMore = ref(false);
const refreshing = ref(false);
const finished = ref(false);
const page = ref(1);
const PAGE_SIZE = 20;

const detail = ref(null);

onLoad(() => {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    setTimeout(() => uni.reLaunch({ url: '/pages/auth/login' }), 600);
    return;
  }
  loadList(true);
});

async function loadList(reset = false) {
  if (reset) {
    page.value = 1;
    finished.value = false;
    loading.value = true;
  } else {
    loadingMore.value = true;
  }
  try {
    const resp = await notificationApi.listNotifications({ page: page.value, size: PAGE_SIZE });
    const records = (resp && (resp.records || resp.list || resp.content)) || [];
    if (reset) list.value = records;
    else list.value = list.value.concat(records);

    if (records.length < PAGE_SIZE) finished.value = true;
    else page.value += 1;
  } catch (_) {
    if (reset) list.value = [];
    finished.value = true;
  } finally {
    loading.value = false;
    loadingMore.value = false;
    refreshing.value = false;
  }
}

function loadMore() {
  if (loadingMore.value || finished.value || loading.value) return;
  loadList(false);
}
function onRefresh() {
  refreshing.value = true;
  loadList(true);
}

async function onItemTap(m) {
  detail.value = m;
  if (m.isRead === 0) {
    try {
      await notificationApi.markRead(m.id);
      const idx = list.value.findIndex((x) => x.id === m.id);
      if (idx !== -1) list.value[idx] = { ...list.value[idx], isRead: 1 };
    } catch (_) { /* silent */ }
  }
}

function closeDetail() {
  detail.value = null;
}

async function onMarkAll() {
  if (!list.value.some((x) => x.isRead === 0)) {
    uni.showToast({ title: '没有未读消息', icon: 'none' });
    return;
  }
  uni.showModal({
    title: '全部已读',
    content: '将当前账户的所有消息标记为已读？',
    confirmColor: '#E62117',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await notificationApi.markAllRead();
        list.value = list.value.map((x) => ({ ...x, isRead: 1 }));
        uni.showToast({ title: '已全部标记为已读', icon: 'none' });
      } catch (_) { /* request 拦截器已 toast */ }
    },
  });
}

function onJumpRelated(m) {
  if (!m.relatedUrl) return;
  // relatedUrl 可能是 H5 url 或 uni 路径，简单分发
  if (/^https?:\/\//i.test(m.relatedUrl)) {
    uni.setClipboardData({
      data: m.relatedUrl,
      success: () => uni.showToast({ title: '已复制链接', icon: 'none' }),
    });
  } else {
    uni.navigateTo({
      url: m.relatedUrl,
      fail: () => uni.showToast({ title: '页面建设中', icon: 'none' }),
    });
  }
  closeDetail();
}

// type → 图标映射（与后端约定保持松耦合，未知类型回落到 campaign）
function iconName(type) {
  const t = String(type || '').toUpperCase();
  if (t.includes('ORDER') || t.includes('PAYMENT')) return 'cart';
  if (t.includes('COURSE') || t.includes('STUDY'))  return 'course';
  if (t.includes('TRAINER') || t.includes('USER'))  return 'person';
  if (t.includes('FAVORITE') || t.includes('LIKE')) return 'heart';
  if (t.includes('BIND') || t.includes('AUTH'))     return 'phone';
  return 'campaign';
}
function iconClass(type) {
  const t = String(type || '').toUpperCase();
  if (t.includes('ORDER') || t.includes('PAYMENT')) return 'msg__icon--green';
  if (t.includes('COURSE') || t.includes('STUDY'))  return 'msg__icon--orange';
  if (t.includes('FAVORITE') || t.includes('LIKE')) return 'msg__icon--red';
  return 'msg__icon--blue';
}
function iconColor(type) {
  const t = String(type || '').toUpperCase();
  if (t.includes('ORDER') || t.includes('PAYMENT')) return '#16A34A';
  if (t.includes('COURSE') || t.includes('STUDY'))  return '#F59E0B';
  if (t.includes('FAVORITE') || t.includes('LIKE')) return '#E62117';
  return '#2563EB';
}
function tagLabel(type) {
  return type || '系统';
}

function formatTime(s) {
  if (!s) return '';
  const d = typeof s === 'string' ? new Date(s.replace(' ', 'T')) : new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  const now = Date.now();
  const diff = Math.max(0, now - d.getTime());
  const min = 60 * 1000;
  if (diff < min) return '刚刚';
  if (diff < 60 * min) return `${Math.floor(diff / min)}分钟前`;
  if (diff < 24 * 60 * min) return `${Math.floor(diff / (60 * min))}小时前`;
  if (diff < 7 * 24 * 60 * min) return `${Math.floor(diff / (24 * 60 * min))}天前`;
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
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
  gap: $tk-sp-2;
}

.navbar-action {
  font-size: $tk-fs-sm;
  color: $tk-primary;
  font-weight: 600;
  padding: 0 $tk-sp-2;
}

.msg {
  display: flex;
  gap: $tk-sp-3;
  padding: $tk-sp-3;
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  box-shadow: $tk-shadow-card;
  position: relative;

  &.is-unread {
    border-left: 6rpx solid $tk-primary;
  }

  &__icon {
    flex-shrink: 0;
    width: 72rpx;
    height: 72rpx;
    border-radius: $tk-radius-md;
    display: flex;
    align-items: center;
    justify-content: center;

    &--red    { background: rgba(230, 33, 23, 0.10); }
    &--blue   { background: rgba(37, 99, 235, 0.10); }
    &--orange { background: rgba(245, 158, 11, 0.10); }
    &--green  { background: rgba(22, 163, 74, 0.10); }
  }
  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
  }
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $tk-sp-2;
  }
  &__title {
    font-size: $tk-fs-md;
    color: $tk-text-1;
    font-weight: 600;
    @include tk-ellipsis-1;
  }
  &__time {
    flex-shrink: 0;
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }
  &__content {
    font-size: $tk-fs-sm;
    color: $tk-text-2;
    line-height: $tk-lh-normal;
    @include tk-ellipsis(2);
  }
  &__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $tk-sp-2;
  }
  &__type {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
    padding: 2rpx 12rpx;
    background: $tk-bg-page;
    border-radius: $tk-radius-xs;
  }
  &__dot {
    width: 14rpx;
    height: 14rpx;
    border-radius: 50%;
    background: $tk-primary;
  }
}

.more {
  text-align: center;
  padding: $tk-sp-3 0;

  &__txt {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }
}

// 底部抽屉
.modal {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;

  &__sheet {
    background: $tk-bg-card;
    border-radius: $tk-radius-lg $tk-radius-lg 0 0;
    padding: $tk-sp-4 $tk-sp-3;
    display: flex;
    flex-direction: column;
    gap: $tk-sp-3;
    @include tk-safe-bottom($tk-sp-3);
  }
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $tk-sp-3;
  }
  &__title {
    font-size: $tk-fs-lg;
    font-weight: 700;
    color: $tk-text-1;
    flex: 1;
    @include tk-ellipsis-1;
  }
  &__close {
    flex-shrink: 0;
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $tk-bg-page;
  }
  &__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $tk-sp-2;
  }
  &__type {
    font-size: $tk-fs-xs;
    color: $tk-text-3;
    padding: 4rpx 12rpx;
    background: $tk-bg-page;
    border-radius: $tk-radius-xs;
  }
  &__time {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }
  &__body {
    max-height: 600rpx;
    padding: $tk-sp-3;
    background: $tk-bg-page;
    border-radius: $tk-radius-md;
  }
  &__content {
    font-size: $tk-fs-md;
    color: $tk-text-1;
    line-height: $tk-lh-relaxed;
    word-break: break-all;
  }
  &__action {
    height: 88rpx;
    border-radius: $tk-radius-full;
    background: linear-gradient(135deg, $tk-primary 0%, #FF8C00 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: $tk-shadow-primary;
  }
  &__action-txt {
    color: #fff;
    font-size: $tk-fs-md;
    font-weight: 700;
  }
}
</style>
