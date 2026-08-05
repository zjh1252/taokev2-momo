<!--

  公开课列表（tab 3）— 对齐 PC /opencourse 列表

  - isOpen=true 固定筛选

  - 课程分类来自 COURSE_CATEGORY（非视频分类）

  - 搜索关键字跨 Tab 传递

-->

<template>

  <view class="page">

    <TkNavBar title="公开课">

      <template #left><TkIcon name="search" :size="40" color="#E62117" /></template>

      <template #right><TkIcon name="notification" :size="40" color="#E62117" @tap="goMessages" /></template>

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

        <TkSearchBar

          v-model="kw"

          :categories="[]"

          placeholder="搜索公开课名称"

          @search="onSearch"

        />



        <!-- 排序条 -->

        <scroll-view scroll-x class="sort-bar" show-scrollbar="false">

          <view class="sort-bar__inner">

            <view

              v-for="opt in sortOptions"

              :key="opt.value"

              class="sort-bar__item"

              :class="{ 'is-active': sortBy === opt.value }"

              @tap="onSortChange(opt.value)"

            >

              <text class="sort-bar__txt">{{ opt.label }}</text>

            </view>

          </view>

        </scroll-view>



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



        <view class="section">

          <view class="section__head">

            <view class="section__bar" />

            <text class="section__title">{{ activeCatId ? activeCatName + '课程' : '公开课列表' }}</text>

            <view class="section__more">

              <text class="section__more-txt">{{ total ? `共 ${total} 门` : '' }}</text>

            </view>

          </view>



          <view class="course-list">

            <TkLoading v-if="loading && !list.length" />

            <TkEmpty v-else-if="!loading && !list.length" icon="medal" text="暂无符合条件的课程" />

            <TkOpenCourseCard v-else v-for="c in list" :key="c.id" :course="c" />



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

import { onShow } from '@dcloudio/uni-app';

import * as courseApi from '@/api/course';

import * as categoryApi from '@/api/category';

import { useSearchStore } from '@/stores/search';

import { useUserStore } from '@/stores/user';

import { normalizeOpenCourseListItem, flattenTopCategories } from '@/utils/normalize';

import { getNavBarHeight } from '@/utils/system';

const navBarH = getNavBarHeight();

const searchStore = useSearchStore();

const userStore = useUserStore();



const kw = ref('');

const sortBy = ref('time');

const sortOptions = [

  { label: '最近开课', value: 'time' },

  { label: '综合排序', value: 'default' },

  { label: '价格最低', value: 'price' },

  { label: '好评优先', value: 'score' },

];



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



async function loadCategories() {

  try {

    const tree = await categoryApi.getCategoryTree('COURSE_CATEGORY');

    const flat = flattenTopCategories(tree).map((c) => ({

      id: c.id,

      name: c.name,

      icon: 'medal',

    }));

    flat.push({ id: null, name: '全部分类', icon: 'list' });

    categories.value = flat;

  } catch (_) {

    uni.showToast({ title: '分类加载失败，请下拉刷新', icon: 'none' });

    categories.value = [{ id: null, name: '全部分类', icon: 'list' }];

  }



async function loadList(reset = false) {

  if (reset) {

    page.value = 1;

    finished.value = false;

  }

  if (reset) loading.value = true;

  else loadingMore.value = true;



  const query = {

    page: page.value,

    size,

    keyword: kw.value || undefined,

    sortBy: sortBy.value,

  };

  if (activeCatId.value) query.categoryIds = activeCatId.value;



  try {

    const resp = await courseApi.listOpenCourses(query);

    const records = (resp && (resp.records || resp.content || resp.list)) || [];

    const items = records.map(normalizeOpenCourseListItem).filter(Boolean);



    if (reset) list.value = items;

    else list.value = list.value.concat(items);



    total.value = (resp && (resp.total || resp.totalElements || resp.count)) || list.value.length;



    if (items.length < size) finished.value = true;

    else page.value += 1;



    if (reset && !items.length) {

      try {

        const hot = await courseApi.getHotOpenCourses();

        if (Array.isArray(hot) && hot.length) {

          list.value = hot.map(normalizeOpenCourseListItem).filter(Boolean);

          total.value = hot.length;

          finished.value = true;

          return;

        }

      } catch (_) { /* 静默 */ }

      list.value = [];

      total.value = 0;

      finished.value = true;

    }

  } catch (_) {

    if (reset) {

      list.value = [];

      total.value = 0;

      finished.value = true;

    }

  } finally {

    loading.value = false;

    loadingMore.value = false;

    refreshing.value = false;

  }

}



function applyIncomingSearch() {

  const incomingKw = searchStore.consumeKeyword();

  if (incomingKw) kw.value = incomingKw;



  const incomingFilter = searchStore.consumeCourseFilter();

  if (incomingFilter.categoryId) {

    activeCatId.value = incomingFilter.categoryId;

  }



  if (incomingKw || Object.keys(incomingFilter).length) {

    loadList(true);

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



function onSortChange(value) {

  if (sortBy.value === value) return;

  sortBy.value = value;

  loadList(true);

}



function onCategoryTap(c) {

  if (!c.id || c.id === activeCatId.value) {

    activeCatId.value = null;

  } else {

    activeCatId.value = c.id;

  }

  loadList(true);

}



function goMessages() {

  if (!userStore.isLoggedIn) {

    uni.navigateTo({ url: '/pages/auth/login' });

    return;

  }

  uni.navigateTo({ url: '/pages/message/list' });

}



onMounted(async () => {

  await loadCategories();

  await loadList(true);

});



onShow(() => {

  applyIncomingSearch();

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



.sort-bar {

  width: 100%;

  background: $tk-bg-card;

  border-radius: $tk-radius-md;

  padding: $tk-sp-2 0;

  box-shadow: $tk-shadow-card;



  &__inner {

    display: inline-flex;

    gap: $tk-sp-2;

    padding: 0 $tk-sp-3;

  }

  &__item {

    flex-shrink: 0;

    padding: 8rpx 20rpx;

    border-radius: $tk-radius-full;

    background: $tk-bg-page;

  }

  &__item.is-active {

    background: $tk-primary-soft;

  }

  &__txt {

    font-size: $tk-fs-sm;

    color: $tk-text-2;

    white-space: nowrap;

  }

  &__item.is-active &__txt {

    color: $tk-primary;

    font-weight: 600;

  }

}



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

    text-align: center;

  }

  &__item.is-active &__icon {

    background: $tk-primary-pressed;

  }

  &__item.is-active &__txt {

    color: $tk-primary;

    font-weight: 700;

  }

}



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

