<!--
  公开课列表（tab 3）
  对应设计稿：design_stitch/_2/code.html
  区块：
    - 自定义顶栏（左 search / 中标题 / 右 notification）
    - 搜索栏（不带分类）
    - 分类八宫格（来自 /videos/categories，失败回落 mock）
    - 推荐课程列表（GET /courses，失败回落 /opencourses/hot 或 mock）
    - 下拉刷新 + 上拉加载更多
-->
<template>
  <view class="page">
    <TkNavBar title="公开课">
      <template #left><TkIcon name="search" :size="40" color="#E62117" /></template>
      <template #right><TkIcon name="notification" :size="40" color="#E62117" /></template>
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
        <!-- 搜索 -->
        <TkSearchBar
          v-model="kw"
          :categories="[]"
          placeholder="搜索公开课名称"
          @search="onSearch"
        />

        <!-- 分类八宫格 -->
        <view class="cat-grid">
          <view
            v-for="(c, idx) in categories"
            :key="c.id || idx"
            class="cat-grid__item"
            :class="{ 'is-active': activeCatId === c.id }"
            @tap="onCategoryTap(c)"
          >
            <view class="cat-grid__icon">
              <TkIcon :name="c.icon || 'medal'" :size="36" color="#fff" />
            </view>
            <text class="cat-grid__txt">{{ c.name }}</text>
          </view>
        </view>

        <!-- 推荐课程 -->
        <view class="section">
          <view class="section__head">
            <view class="section__bar" />
            <text class="section__title">{{ activeCatId ? activeCatName + '课程' : '推荐课程' }}</text>
            <view class="section__more">
              <text class="section__more-txt">{{ total ? `共 ${total} 门` : '' }}</text>
            </view>
          </view>

          <view class="course-list">
            <TkLoading v-if="loading && !list.length" />
            <TkEmpty v-else-if="!loading && !list.length" icon="medal" text="暂无符合条件的课程" />
            <TkCourseCard v-else v-for="c in list" :key="c.id" :course="c" />

            <view v-if="loadingMore" class="course-list__more"><TkLoading /></view>
            <view v-else-if="finished && list.length" class="course-list__bottom">
              <text class="course-list__bottom-txt">— 已经到底啦 —</text>
            </view>
          </view>
        </view>

        <view style="height: 40rpx;" />
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import * as courseApi from '@/api/course';
import { MOCK_COURSES, MOCK_VIDEO_CATEGORIES } from '@/utils/mock';

const sysInfo = uni.getSystemInfoSync();
const navBarH = (sysInfo.statusBarHeight || 20) + 44;

const kw = ref('');
const categories = ref([]);
const activeCatId = ref(null);
const list = ref([]);
const total = ref(0);
const loading = ref(false);
const loadingMore = ref(false);
const refreshing = ref(false);
const finished = ref(false);
const page = ref(1);
const size = 10;

const activeCatName = computed(() => {
  const c = categories.value.find((x) => x.id === activeCatId.value);
  return c ? c.name : '';
});

function normalizeCourse(v) {
  return {
    id: v.id || v.courseId,
    title: v.title || v.name,
    coverUrl: v.coverUrl || v.cover || v.thumbnail,
    startDate: v.nextPlanStartDate || v.startTime || v.startDate || '',
    city: v.nextPlanCity || v.city || v.cityName || '',
    trainerName: v.trainerName || v.lecturerName || '',
    price: v.price ?? v.salePrice ?? '',
  };
}

async function loadCategories() {
  try {
    const data = await courseApi.getVideoCategories();
    if (Array.isArray(data) && data.length) {
      // 后端可能返回扁平或带 children 的树；都按 id+name 取，最多 8 项 + 1 个"全部"
      const flat = data.slice(0, 7).map((c) => ({ id: c.id, name: c.name || c.categoryName, icon: 'medal' }));
      flat.push({ id: null, name: '全部分类', icon: 'list' });
      categories.value = flat;
      return;
    }
  } catch (_) { /* 静默 */ }
  categories.value = MOCK_VIDEO_CATEGORIES;
}

async function loadList(reset = false) {
  if (reset) {
    page.value = 1;
    finished.value = false;
  }
  if (reset) loading.value = true;
  else loadingMore.value = true;

  const query = { page: page.value, size, keyword: kw.value || undefined };
  if (activeCatId.value) query.categoryIds = [activeCatId.value];

  try {
    const resp = await courseApi.listCourses(query);
    const records = (resp && (resp.records || resp.content || resp.list)) || [];
    const items = records.map(normalizeCourse);

    if (reset) list.value = items;
    else list.value = list.value.concat(items);

    total.value = (resp && (resp.total || resp.totalElements || resp.count)) || list.value.length;

    if (items.length < size) finished.value = true;
    else page.value += 1;

    if (reset && !items.length) {
      // 通用列表空，尝试热门公开课兜底
      try {
        const hot = await courseApi.getHotOpenCourses();
        if (Array.isArray(hot) && hot.length) {
          list.value = hot.map(normalizeCourse);
          total.value = hot.length;
          finished.value = true;
          return;
        }
      } catch (_) { /* 静默 */ }
      list.value = MOCK_COURSES;
      total.value = MOCK_COURSES.length;
      finished.value = true;
    }
  } catch (_) {
    if (reset) {
      list.value = MOCK_COURSES;
      total.value = MOCK_COURSES.length;
      finished.value = true;
    }
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

async function onRefresh() {
  refreshing.value = true;
  await loadList(true);
}

function onSearch() {
  loadList(true);
}

function onCategoryTap(c) {
  // 点击"全部分类"或同一分类二次点击 → 清空筛选
  if (!c.id || c.id === activeCatId.value) {
    activeCatId.value = null;
  } else {
    activeCatId.value = c.id;
  }
  loadList(true);
}

onMounted(() => {
  loadCategories();
  loadList(true);
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

// 分类八宫格
.cat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  row-gap: $tk-sp-3;
  column-gap: $tk-sp-2;
  background: $tk-bg-card;
  border-radius: $tk-radius-md;
  padding: $tk-sp-4 $tk-sp-3;
  box-shadow: $tk-shadow-card;

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
  }
  &__icon {
    width: 96rpx;
    height: 96rpx;
    background: $tk-primary;
    border-radius: $tk-radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: $tk-shadow-primary;
  }
  &__txt {
    font-size: $tk-fs-xs;
    color: $tk-text-1;
    font-weight: 500;
  }
  &__item.is-active &__icon {
    background: $tk-primary-pressed;
  }
  &__item.is-active &__txt {
    color: $tk-primary;
    font-weight: 700;
  }
}

// section
.section {
  display: flex;
  flex-direction: column;
  gap: $tk-sp-2;

  &__head {
    display: flex;
    align-items: center;
    gap: $tk-sp-2;
    padding: 0 4rpx;
  }
  &__bar {
    width: 6rpx;
    height: 28rpx;
    background: $tk-primary;
    border-radius: $tk-radius-full;
  }
  &__title {
    flex: 1;
    font-size: $tk-fs-xl;
    font-weight: 700;
    color: $tk-text-1;
  }
  &__more-txt {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: $tk-sp-2;

  &__more,
  &__bottom {
    padding: $tk-sp-3 0;
    text-align: center;
  }
  &__bottom-txt {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }
}
</style>
