<!--
  首页（tab 1）
  对应设计稿：design_stitch/app/code.html

  区块：
  - 自定义顶栏（菜单 / 标题 / 更多）
  - 搜索栏（讲师/公开课分类切换）
  - Banner（渐变卡 + 双按钮）
  - 最新案例 横向跑马灯（简化为单行省略）
  - 推荐专家（横向滚动卡片）
  - 推荐课程（纵向列表）
-->
<template>
  <view class="page">
    <TkNavBar title="淘课网">
      <template #left><TkIcon name="menu" :size="44" color="#E62117" /></template>
      <template #right><TkIcon name="more" :size="44" color="#E62117" /></template>
    </TkNavBar>

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarHeight + 'px' }">
      <view class="page__inner">

        <!-- 搜索栏 -->
        <TkSearchBar
          v-model="kw"
          v-model:category="cat"
          :categories="['讲师', '公开课']"
          @search="onSearch"
        />

        <!-- Banner -->
        <view class="banner">
          <view class="banner__blob banner__blob--1" />
          <view class="banner__blob banner__blob--2" />
          <text class="banner__title">{{ banner.title }}</text>
          <text class="banner__sub">{{ banner.subtitle }}</text>
          <view class="banner__actions">
            <view class="banner__btn banner__btn--primary" @tap="goPath(banner.primaryAction.url)">
              <text class="banner__btn-txt banner__btn-txt--primary">{{ banner.primaryAction.text }}</text>
            </view>
            <view class="banner__btn banner__btn--ghost" @tap="goPath(banner.secondaryAction.url)">
              <text class="banner__btn-txt banner__btn-txt--ghost">{{ banner.secondaryAction.text }}</text>
            </view>
          </view>
        </view>

        <!-- 最新案例 -->
        <view class="case-strip">
          <view class="case-strip__label">
            <TkIcon name="campaign" :size="28" color="#E62117" />
            <text class="case-strip__label-txt">最新案例</text>
          </view>
          <view class="case-strip__sep" />
          <text class="case-strip__txt">{{ latestCase }}</text>
        </view>

        <!-- 推荐专家 -->
        <view class="section">
          <view class="section__head">
            <text class="section__title">推荐专家</text>
            <view class="section__more" @tap="goExpertList">
              <text class="section__more-txt">查看全部</text>
              <TkIcon name="chevron-right" :size="22" color="#999" />
            </view>
          </view>
          <scroll-view scroll-x class="expert-scroll" show-scrollbar="false">
            <view class="expert-scroll__inner">
              <TkExpertCard
                v-for="e in experts"
                :key="e.id"
                :expert="e"
                variant="grid"
              />
            </view>
          </scroll-view>
        </view>

        <!-- 推荐课程 -->
        <view class="section">
          <view class="section__head">
            <text class="section__title">推荐课程</text>
          </view>
          <view class="course-list">
            <TkLoading v-if="loading" />
            <TkEmpty v-else-if="!courses.length" text="暂无推荐课程" />
            <TkCourseCard
              v-else
              v-for="c in courses"
              :key="c.id"
              :course="c"
            />
          </view>
        </view>

        <view style="height: 40rpx;" />
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onPullDownRefresh } from '@dcloudio/uni-app';
import * as courseApi from '@/api/course';
import { MOCK_BANNER, MOCK_LATEST_CASE, MOCK_EXPERTS, MOCK_COURSES } from '@/utils/mock';

// 状态栏 + 导航栏总高度，用于 scroll-view padding-top（自定义顶栏 fixed）
const sysInfo = uni.getSystemInfoSync();
const navBarHeight = (sysInfo.statusBarHeight || 20) + 44;

const kw = ref('');
const cat = ref('讲师');

const banner = ref(MOCK_BANNER);
const latestCase = ref(MOCK_LATEST_CASE);
const experts = ref(MOCK_EXPERTS);
const courses = ref([]);
const loading = ref(false);

async function loadCourses() {
  loading.value = true;
  try {
    // 优先取热门公开课，失败回退到通用列表，再失败用 mock
    let data = null;
    try {
      data = await courseApi.getHotOpenCourses();
    } catch (_) { /* 静默 */ }

    if (!data || !Array.isArray(data) || !data.length) {
      try {
        const page = await courseApi.listCourses({ page: 1, size: 5 });
        data = (page && (page.records || page.content || page.list)) || [];
      } catch (_) { /* 静默 */ }
    }

    if (data && data.length) {
      courses.value = data.map(normalizeCourse);
    } else {
      courses.value = MOCK_COURSES;
    }
  } catch (e) {
    courses.value = MOCK_COURSES;
  } finally {
    loading.value = false;
  }
}

// 把后端 VO 字段对齐到 TkCourseCard 数据契约
function normalizeCourse(v) {
  return {
    id: v.id || v.courseId,
    title: v.title || v.name,
    coverUrl: v.coverUrl || v.cover || v.thumbnail,
    startDate: v.startDate || v.startTime || v.scheduleDate || '',
    city: v.city || v.cityName || v.location || '',
    trainerName: v.trainerName || v.lecturerName || v.teacherName || '',
    price: v.price ?? v.salePrice ?? v.amount ?? '',
  };
}

function onSearch(v) {
  uni.switchTab({
    url: cat.value === '专家' || cat.value === '讲师'
      ? '/pages/expert/list'
      : '/pages/course/list',
  });
  // TODO: 把 kw 传到目标 tab 页（需要 store / event-bus）
  console.log('[home] search', cat.value, v);
}

function goExpertList() { uni.switchTab({ url: '/pages/expert/list' }); }

function goPath(url) {
  if (!url) return;
  // 简单判断 tabBar 页面 vs 普通页
  const tabbar = ['/pages/home/index','/pages/expert/list','/pages/course/list','/pages/user/index'];
  if (tabbar.includes(url)) uni.switchTab({ url });
  else uni.navigateTo({ url });
}

onMounted(() => {
  loadCourses();
});

onPullDownRefresh(async () => {
  await loadCourses();
  uni.stopPullDownRefresh();
});
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  background: $tk-bg-page;

  &__scroll {
    height: 100vh;
    box-sizing: border-box;
  }

  &__inner {
    padding: $tk-sp-3 $tk-sp-3 $tk-sp-6;
    display: flex;
    flex-direction: column;
    gap: $tk-sp-4;
  }
}

// Banner
.banner {
  position: relative;
  overflow: hidden;
  padding: $tk-sp-4;
  border-radius: $tk-radius-lg;
  background: linear-gradient(135deg, #E62117 0%, #FF8C00 100%);
  box-shadow: $tk-shadow-primary;

  &__blob {
    position: absolute;
    background: rgba(255,255,255,0.10);
    border-radius: 50%;
    filter: blur(12rpx); // 跨端友好的弱模糊；不依赖 backdrop-blur
    &--1 { width: 240rpx; height: 240rpx; top: -48rpx; right: -48rpx; }
    &--2 { width: 160rpx; height: 160rpx; bottom: -32rpx; left: -32rpx; }
  }

  &__title {
    position: relative;
    color: #fff;
    font-size: $tk-fs-2xl;
    font-weight: 800;
    line-height: $tk-lh-tight;
  }
  &__sub {
    position: relative;
    display: block;
    margin-top: $tk-sp-2;
    color: rgba(255,255,255,0.85);
    font-size: $tk-fs-sm;
  }
  &__actions {
    position: relative;
    margin-top: $tk-sp-3;
    display: flex;
    gap: $tk-sp-2;
  }
  &__btn {
    padding: 14rpx 28rpx;
    border-radius: $tk-radius-full;
    &--primary { background: #fff; }
    &--ghost   { background: rgba(255,255,255,0.20); border: 2rpx solid rgba(255,255,255,0.35); }
  }
  &__btn-txt {
    font-size: $tk-fs-sm;
    font-weight: 600;
    &--primary { color: $tk-primary; }
    &--ghost   { color: #fff; }
  }
}

// 最新案例条
.case-strip {
  display: flex;
  align-items: center;
  gap: $tk-sp-2;
  padding: $tk-sp-2 $tk-sp-3;
  background: $tk-bg-card;
  border-radius: $tk-radius-md;
  box-shadow: $tk-shadow-card;

  &__label {
    display: flex;
    align-items: center;
    gap: 4rpx;
    flex-shrink: 0;
  }
  &__label-txt {
    color: $tk-primary;
    font-size: $tk-fs-sm;
    font-weight: 700;
  }
  &__sep {
    width: 2rpx;
    height: 24rpx;
    background: $tk-divider;
    flex-shrink: 0;
  }
  &__txt {
    flex: 1;
    min-width: 0;
    font-size: $tk-fs-sm;
    color: $tk-text-2;
    @include tk-ellipsis-1;
  }
}

// section 通用
.section {
  display: flex;
  flex-direction: column;
  gap: $tk-sp-2;

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 0 4rpx;
  }
  &__title {
    font-size: $tk-fs-xl;
    font-weight: 700;
    color: $tk-text-1;
  }
  &__more {
    display: flex;
    align-items: center;
    gap: 2rpx;
  }
  &__more-txt {
    font-size: $tk-fs-xs;
    color: $tk-text-2;
  }
}

.expert-scroll {
  width: 100%;
  white-space: nowrap;
  &__inner {
    display: inline-flex;
    gap: $tk-sp-3;
    padding: 8rpx 0 $tk-sp-2;
  }
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: $tk-sp-2;
}
</style>
