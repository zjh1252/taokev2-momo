<!--
  我的收藏（GET /interaction/favorites）
  - 4 Tab：课程 / 专家 / 机构 / 案例（targetType: COURSE / TRAINER / INSTITUTION / CASE）
  - 分页 0-based，size 20，上拉加载更多
  - 取消收藏：长按或点 X 按钮 → 二次确认 → DELETE /interaction/favorites
  - 卡片点击跳对应详情
-->
<template>
  <view class="page">
    <TkNavBar title="我的收藏" left-icon="back" />

    <view class="tabs" :style="{ top: navBarH + 'px' }">
      <view
        v-for="t in TABS"
        :key="t.key"
        class="tabs__item"
        :class="{ 'is-active': activeKey === t.key }"
        @tap="switchTab(t.key)"
      >
        <text class="tabs__txt">{{ t.label }}</text>
        <view v-if="activeKey === t.key" class="tabs__bar" />
      </view>
    </view>

    <scroll-view
      scroll-y
      class="page__scroll"
      :style="{ paddingTop: navBarH + 88 + 'px' }"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <view class="page__inner">
        <TkLoading v-if="loading && !list.length" />
        <TkEmpty v-else-if="!loading && !list.length" icon="heart" text="暂无收藏" />
        <view
          v-else
          v-for="item in list"
          :key="item.id"
          class="fav"
          @tap="onItemTap(item)"
          @longpress="onItemLongPress(item)"
        >
          <image
            v-if="item.coverUrl"
            class="fav__cover"
            :class="{ 'fav__cover--round': activeKey === 'TRAINER' }"
            :src="toAssetUrl(item.coverUrl)"
            mode="aspectFill"
          />
          <view
            v-else
            class="fav__cover fav__cover--placeholder"
            :class="{ 'fav__cover--round': activeKey === 'TRAINER' }"
          >
            <TkIcon :name="placeholderIcon" :size="40" color="#C2C8D0" />
          </view>
          <view class="fav__main">
            <text class="fav__title">{{ item.title || '无标题' }}</text>
            <text v-if="item.subtitle" class="fav__subtitle">{{ item.subtitle }}</text>
            <text class="fav__meta">收藏于 {{ formatDate(item.createdAt) }}</text>
          </view>
          <view class="fav__rm" @tap.stop="onRemove(item)">
            <TkIcon name="close" :size="28" color="#C2C8D0" />
          </view>
        </view>

        <view v-if="loadingMore" class="more"><TkLoading /></view>
        <view v-else-if="finished && list.length" class="more">
          <text class="more__txt">— 已经到底啦 —</text>
        </view>

        <view style="height: 40rpx;" />
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import * as interactionApi from '@/api/interaction';
import { useUserStore } from '@/stores/user';
import { toAssetUrl } from '@/utils/asset';

import { getNavBarHeight } from '@/utils/system';

const navBarH = getNavBarHeight();

const TABS = [
  { key: 'COURSE',      label: '课程' },
  { key: 'TRAINER',     label: '专家' },
  { key: 'INSTITUTION', label: '机构' },
  { key: 'CASE',        label: '案例' },
];

const userStore = useUserStore();
const activeKey = ref('COURSE');

const list = ref([]);
const loading = ref(false);
const loadingMore = ref(false);
const refreshing = ref(false);
const finished = ref(false);
const page = ref(0);
const PAGE_SIZE = 20;

const placeholderIcon = computed(() => {
  switch (activeKey.value) {
    case 'TRAINER':     return 'person';
    case 'INSTITUTION': return 'shop';
    case 'CASE':        return 'image';
    default:            return 'course';
  }
});

onLoad(() => {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    setTimeout(() => uni.reLaunch({ url: '/pages/auth/login' }), 600);
    return;
  }
  loadList(true);
});

onShow(() => {
  // 从详情页"取消收藏"回来时，刷新列表
  if (userStore.isLoggedIn && list.value.length > 0) {
    loadList(true);
  }
});

function switchTab(key) {
  if (activeKey.value === key) return;
  activeKey.value = key;
  loadList(true);
}

async function loadList(reset = false) {
  if (reset) {
    page.value = 0;
    finished.value = false;
    loading.value = true;
  } else {
    loadingMore.value = true;
  }
  try {
    const resp = await interactionApi.listFavorites({
      targetType: activeKey.value,
      page: page.value,
      size: PAGE_SIZE,
    });
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

function onItemTap(item) {
  switch (item.targetType) {
    case 'COURSE':
      uni.navigateTo({ url: `/pages/course/detail?id=${item.targetId}` });
      break;
    case 'TRAINER':
      uni.navigateTo({ url: `/pages/expert/detail?id=${item.targetId}` });
      break;
    case 'INSTITUTION':
      uni.showToast({ title: '机构详情页建设中', icon: 'none' });
      break;
    case 'CASE':
      uni.showToast({ title: '案例详情页建设中', icon: 'none' });
      break;
    default:
      break;
  }
}

function onItemLongPress(item) {
  onRemove(item);
}

function onRemove(item) {
  uni.showModal({
    title: '取消收藏',
    content: `确定要取消收藏"${item.title || '该项'}"吗？`,
    confirmColor: '#E62117',
    confirmText: '确认取消',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await interactionApi.removeFavorite({
          targetType: item.targetType,
          targetId: item.targetId,
        });
        list.value = list.value.filter((x) => x.id !== item.id);
        uni.showToast({ title: '已取消收藏', icon: 'none' });
      } catch (_) {
        // toast 已由 request 拦截器处理
      }
    },
  });
}

function formatDate(s) {
  if (!s) return '';
  const d = typeof s === 'string' ? new Date(s.replace(' ', 'T')) : new Date(s);
  if (Number.isNaN(d.getTime())) return s;
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

.tabs {
  position: fixed;
  left: 0;
  right: 0;
  height: 88rpx;
  background: $tk-bg-card;
  display: flex;
  align-items: center;
  padding: 0 $tk-sp-3;
  z-index: 9;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

  &__item {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  &__txt {
    font-size: $tk-fs-md;
    color: $tk-text-2;
    font-weight: 500;
  }
  &__item.is-active &__txt {
    color: $tk-primary;
    font-weight: 700;
  }
  &__bar {
    position: absolute;
    bottom: 8rpx;
    width: 48rpx;
    height: 6rpx;
    border-radius: 3rpx;
    background: $tk-primary;
  }
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

.fav {
  display: flex;
  align-items: center;
  gap: $tk-sp-3;
  padding: $tk-sp-3;
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  box-shadow: $tk-shadow-card;

  &__cover {
    flex-shrink: 0;
    width: 160rpx;
    height: 120rpx;
    background: $tk-divider-light;
    border-radius: $tk-radius-md;

    &--round {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
    }

    &--placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
  }
  &__title {
    font-size: $tk-fs-md;
    color: $tk-text-1;
    font-weight: 600;
    @include tk-ellipsis(2);
  }
  &__subtitle {
    font-size: $tk-fs-sm;
    color: $tk-text-2;
    @include tk-ellipsis-1;
  }
  &__meta {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }
  &__rm {
    flex-shrink: 0;
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $tk-bg-page;
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
</style>
