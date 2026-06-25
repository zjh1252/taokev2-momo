<!--
  我的点评 GET /interaction/reviews/mine
-->
<template>
  <view class="page">
    <TkNavBar title="我的点评" left-icon="back" />

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
        <TkEmpty v-else-if="!loading && !list.length" icon="chat" text="暂无点评" />
        <view v-else v-for="item in list" :key="item.id" class="item">
          <view class="item__head">
            <text class="item__title">{{ item.courseTitle || item.expertName || '培训评价' }}</text>
            <text class="item__score">{{ formatScore(item) }}</text>
          </view>
          <text v-if="item.commentText" class="item__comment">{{ item.commentText }}</text>
          <text class="item__meta">{{ reviewStatusLabel(item.status) }} · {{ formatDate(item.createdAt) }}</text>
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
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import * as interactionApi from '@/api/interaction';
import { getNavBarHeight } from '@/utils/system';

const navBarH = getNavBarHeight();

const list = ref([]);
const loading = ref(false);
const loadingMore = ref(false);
const refreshing = ref(false);
const finished = ref(false);
const page = ref(0);
const PAGE_SIZE = 10;

onLoad(() => {
  loadList(true);
});

async function loadList(reset = false) {
  if (reset) {
    page.value = 0;
    finished.value = false;
    list.value = [];
  }
  if (finished.value && !reset) return;

  const isFirst = page.value === 0;
  if (isFirst) loading.value = true;
  else loadingMore.value = true;

  try {
    const res = await interactionApi.listMyReviews({ page: page.value, size: PAGE_SIZE });
    const rows = res?.list || res?.records || res?.content || [];
    list.value = reset ? rows : [...list.value, ...rows];
    const total = res?.total ?? res?.totalElements ?? 0;
    if (list.value.length >= total || rows.length < PAGE_SIZE) {
      finished.value = true;
    } else {
      page.value += 1;
    }
  } catch (_) {
    if (reset) list.value = [];
  } finally {
    loading.value = false;
    loadingMore.value = false;
    refreshing.value = false;
  }
}

function onRefresh() {
  refreshing.value = true;
  loadList(true);
}

function loadMore() {
  if (!loading.value && !loadingMore.value) loadList(false);
}

function formatScore(item) {
  if (item.avgScore != null) return `${item.avgScore} 分`;
  const parts = [item.ratingContent, item.ratingTeaching, item.ratingService].filter(Boolean);
  if (!parts.length) return '';
  const avg = parts.reduce((a, b) => a + b, 0) / parts.length;
  return `${avg.toFixed(1)} 分`;
}

function reviewStatusLabel(status) {
  if (status === 1) return '已通过';
  if (status === 2) return '待审核';
  if (status === 3) return '已驳回';
  return '审核中';
}

function formatDate(v) {
  if (!v) return '';
  return String(v).replace('T', ' ').slice(0, 16);
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

.item {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-3;
  box-shadow: $tk-shadow-card;
  display: flex;
  flex-direction: column;
  gap: 8rpx;

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: $tk-sp-2;
  }
  &__title {
    flex: 1;
    font-size: $tk-fs-md;
    font-weight: 700;
    color: $tk-text-1;
    @include tk-ellipsis(2);
  }
  &__score {
    flex-shrink: 0;
    font-size: $tk-fs-sm;
    color: $tk-star;
    font-weight: 700;
  }
  &__comment {
    font-size: $tk-fs-sm;
    color: $tk-text-2;
    line-height: $tk-lh-normal;
    @include tk-ellipsis(3);
  }
  &__meta {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }
}

.more {
  padding: $tk-sp-3 0;
  display: flex;
  justify-content: center;

  &__txt {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }
}
</style>
