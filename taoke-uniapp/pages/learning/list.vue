<!--
  我的学习 — 对齐 PC /dashboard/learning
  Tab：录播课 / 公开课报名
-->
<template>
  <view class="page">
    <TkNavBar title="我的学习" left-icon="back" />

    <view class="tabs" :style="{ top: navBarH + 'px' }">
      <view
        v-for="t in TABS"
        :key="t.key"
        class="tabs__item"
        :class="{ 'is-active': activeTab === t.key }"
        @tap="switchTab(t.key)"
      >
        <text class="tabs__txt">{{ t.label }}</text>
        <view v-if="activeTab === t.key" class="tabs__bar" />
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
        <TkLoading v-if="loading && !currentList.length" />

        <!-- 录播课 -->
        <template v-if="activeTab === 'video'">
          <TkEmpty v-if="!loading && !currentList.length" icon="course" text="暂无录播课学习记录" />
          <view
            v-for="v in currentList"
            :key="v.videoId"
            class="learn-card"
            @tap="goVideoPlay(v)"
          >
            <image
              class="learn-card__cover"
              :src="toAssetUrl(v.coverUrl)"
              mode="aspectFill"
            />
            <view class="learn-card__body">
              <text class="learn-card__title">{{ v.title }}</text>
              <text class="learn-card__sub">讲师：{{ v.teacherName || '—' }}</text>
              <view class="learn-card__progress">
                <view class="learn-card__bar">
                  <view class="learn-card__fill" :style="{ width: (v.progress || 0) + '%' }" />
                </view>
                <text class="learn-card__pct">{{ v.progress || 0 }}%</text>
              </view>
              <text class="learn-card__action">{{ v.completed ? '已学完' : (v.progress > 0 ? '继续学习' : '开始学习') }}</text>
            </view>
          </view>
        </template>

        <!-- 公开课 -->
        <template v-else>
          <TkEmpty v-if="!loading && !currentList.length" icon="medal" text="暂无公开课报名记录" />
          <view
            v-for="c in currentList"
            :key="c.courseId"
            class="learn-card"
            @tap="goCourseDetail(c)"
          >
            <image
              class="learn-card__cover"
              :src="toAssetUrl(c.coverUrl)"
              mode="aspectFill"
            />
            <view class="learn-card__body">
              <text class="learn-card__title">{{ c.title }}</text>
              <text class="learn-card__sub">{{ c.typeLabel || '公开课' }} · {{ c.trainerName || '—' }}</text>
              <text v-if="c.planCity || c.planStartTime" class="learn-card__sub">
                {{ formatPlan(c) }}
              </text>
              <text class="learn-card__action">查看课程</text>
            </view>
          </view>
        </template>

        <view v-if="loadingMore" class="more"><TkLoading /></view>
        <view v-else-if="finished && currentList.length" class="more">
          <text class="more__txt">— 已经到底啦 —</text>
        </view>

        <view style="height: 40rpx;" />
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import * as learningApi from '@/api/learning';
import { requireLogin } from '@/utils/auth';
import { toAssetUrl } from '@/utils/asset';
import { getNavBarHeight } from '@/utils/system';

const navBarH = getNavBarHeight();

const TABS = [
  { key: 'video', label: '录播课' },
  { key: 'course', label: '公开课' },
];

const activeTab = ref('video');
const videoList = ref([]);
const courseList = ref([]);
const loading = ref(false);
const loadingMore = ref(false);
const refreshing = ref(false);
const finished = ref(false);
const page = ref(1);
const size = 10;

const currentList = computed(() => (activeTab.value === 'video' ? videoList.value : courseList.value));

function formatPlan(c) {
  const parts = [];
  if (c.planCity) parts.push(c.planCity);
  if (c.planStartTime) parts.push(String(c.planStartTime).slice(0, 10));
  return parts.join(' · ');
}

async function loadList(reset = false) {
  if (reset) {
    page.value = 1;
    finished.value = false;
  }
  if (reset) loading.value = true;
  else loadingMore.value = true;

  try {
    const resp = activeTab.value === 'video'
      ? await learningApi.getMyVideoLearnings(page.value, size)
      : await learningApi.getMyCourseEnrollments(page.value, size);

    const records = resp?.list || resp?.records || resp?.content || [];
    const target = activeTab.value === 'video' ? videoList : courseList;

    if (reset) target.value = records;
    else target.value = target.value.concat(records);

    const total = resp?.total ?? resp?.totalElements ?? target.value.length;
    if (target.value.length >= total || records.length < size) finished.value = true;
    else page.value += 1;
  } catch (_) {
    if (reset) {
      if (activeTab.value === 'video') videoList.value = [];
      else courseList.value = [];
    }
  } finally {
    loading.value = false;
    loadingMore.value = false;
    refreshing.value = false;
  }
}

function switchTab(key) {
  if (activeTab.value === key) return;
  activeTab.value = key;
  loadList(true);
}

function loadMore() {
  if (loadingMore.value || finished.value || loading.value) return;
  loadList(false);
}

async function onRefresh() {
  refreshing.value = true;
  await loadList(true);
}

function goVideoPlay(v) {
  uni.navigateTo({ url: `/pages/video/play?id=${v.videoId}` });
}

function goCourseDetail(c) {
  uni.navigateTo({ url: `/pages/course/detail?id=${c.courseId}` });
}

onMounted(() => {
  if (!requireLogin()) return;
  loadList(true);
});
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
  z-index: 10;
  display: flex;
  background: $tk-bg-card;
  border-bottom: 2rpx solid $tk-divider-light;

  &__item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: $tk-sp-3 0 $tk-sp-2;
    position: relative;
  }
  &__txt {
    font-size: $tk-fs-md;
    color: $tk-text-2;
  }
  &__item.is-active &__txt {
    color: $tk-primary;
    font-weight: 700;
  }
  &__bar {
    position: absolute;
    bottom: 0;
    width: 48rpx;
    height: 6rpx;
    background: $tk-primary;
    border-radius: $tk-radius-full;
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
  gap: $tk-sp-3;
}

.learn-card {
  display: flex;
  gap: $tk-sp-3;
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-3;
  box-shadow: $tk-shadow-card;

  &__cover {
    width: 200rpx;
    height: 128rpx;
    border-radius: $tk-radius-sm;
    background: $tk-divider-light;
    flex-shrink: 0;
  }
  &__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
  }
  &__title {
    font-size: $tk-fs-md;
    font-weight: 600;
    color: $tk-text-1;
    @include tk-ellipsis(2);
  }
  &__sub {
    font-size: $tk-fs-xs;
    color: $tk-text-3;
  }
  &__progress {
    display: flex;
    align-items: center;
    gap: $tk-sp-2;
    margin-top: 4rpx;
  }
  &__bar {
    flex: 1;
    height: 8rpx;
    background: $tk-divider-light;
    border-radius: $tk-radius-full;
    overflow: hidden;
  }
  &__fill {
    height: 100%;
    background: $tk-primary;
    border-radius: $tk-radius-full;
  }
  &__pct {
    font-size: $tk-fs-xs;
    color: $tk-text-3;
    flex-shrink: 0;
  }
  &__action {
    margin-top: 4rpx;
    font-size: $tk-fs-xs;
    color: $tk-primary;
    font-weight: 600;
  }
}

.more {
  padding: $tk-sp-3 0;
  text-align: center;
  &__txt {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }
}
</style>
