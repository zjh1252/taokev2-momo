<!--

  专家列表（tab 2）— 对齐 PC /trainer 列表

  - 搜索 + 跨 Tab 关键字

  - 类别/行业/省份/排序/特色筛选（字典 ID 提交）

  - NEW 条来自最近入驻专家

-->

<template>

  <view class="page">

    <TkNavBar title="专家">

      <template #left><TkIcon name="search" :size="40" color="#E62117" @tap="focusSearch" /></template>

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

          placeholder="请输入专家名字"

          @search="onSearch"

        />



        <TkFilterBar :filters="filters" @change="loadList(true)" />



        <view v-if="newcomerTip" class="new-strip">

          <text class="new-strip__tag">NEW</text>

          <text class="new-strip__txt">{{ newcomerTip }}</text>

        </view>



        <view class="list">

          <TkLoading v-if="loading && !list.length" />

          <TkEmpty v-else-if="!loading && !list.length" icon="staff" text="暂无符合条件的专家" />

          <TkExpertCard

            v-else

            v-for="e in list"

            :key="e.id"

            :expert="e"

            variant="row"

          />



          <view v-if="loadingMore" class="list__more"><TkLoading /></view>

          <view v-else-if="finished && list.length" class="list__bottom">

            <text class="list__bottom-txt">— 已经到底啦 —</text>

          </view>

        </view>



        <view style="height: 40rpx;" />

      </view>

    </scroll-view>

  </view>

</template>



<script setup>

import { ref, reactive, onMounted } from 'vue';

import { onShow } from '@dcloudio/uni-app';

import * as expertApi from '@/api/expert';

import * as categoryApi from '@/api/category';

import * as regionApi from '@/api/region';

import { useSearchStore } from '@/stores/search';

import { useUserStore } from '@/stores/user';

import { normalizeExpert, flattenLeafCategories } from '@/utils/normalize';

import { MOCK_TRAINER_LIST } from '@/utils/mock';

import { getNavBarHeight } from '@/utils/system';



const navBarH = getNavBarHeight();

const searchStore = useSearchStore();

const userStore = useUserStore();



const kw = ref('');

const filters = reactive([

  { key: 'expertiseCategoryId', label: '类别', value: '', options: [] },

  { key: 'industryCategoryId', label: '行业', value: '', options: [] },

  { key: 'provinceId', label: '省份', value: '', options: [] },

  {

    key: 'sort',

    label: '排序',

    value: '',

    options: [

      { label: '综合排序', value: 'default' },

      { label: '好评率', value: 'score' },

      { label: '最新入驻', value: 'newly_joined' },

    ],

  },

  {

    key: 'isTrusted',

    label: '特色',

    value: '',

    options: [{ label: '信得过', value: 1 }],

  },

]);



const newcomerTip = ref('');

const list = ref([]);

const loading = ref(false);

const loadingMore = ref(false);

const refreshing = ref(false);

const finished = ref(false);

const page = ref(1);

const size = 10;



function buildQuery() {

  const q = { page: page.value, size, keyword: kw.value || undefined };

  filters.forEach((f) => {

    if (f.value !== '' && f.value !== undefined && f.value !== null) {

      q[f.key] = f.value;

    }

  });

  if (!q.sort) q.sort = 'default';

  return q;

}



async function loadFilterOptions() {

  try {

    const [expertise, industry, provinces] = await Promise.all([

      categoryApi.getCategoryTree('TRAINER_EXPERTISE'),

      categoryApi.getCategoryTree('TRAINER_INDUSTRY'),

      regionApi.getRegionChildren(),

    ]);

    filters[0].options = flattenLeafCategories(expertise).map((c) => ({ label: c.name, value: c.id }));
    filters[1].options = flattenLeafCategories(industry).map((c) => ({ label: c.name, value: c.id }));

    filters[2].options = (provinces || [])

      .filter((p) => p.id && p.name)

      .map((p) => ({ label: p.name, value: p.id }));

  } catch (_) {

    uni.showToast({ title: '筛选选项加载失败，请下拉刷新', icon: 'none' });

  }

}



async function loadNewcomerTip() {

  try {

    const resp = await expertApi.listTrainers({ page: 1, size: 1, sort: 'newly_joined' });

    const records = (resp && (resp.records || resp.content || resp.list)) || [];

    if (records.length) {

      const t = records[0];

      const name = t.teachingName || t.name || '新入驻专家';

      const intro = t.oneLineIntro || t.title || '';

      newcomerTip.value = intro ? `最新专家入驻：${name} - ${intro}` : `最新专家入驻：${name}`;

    }

  } catch (_) {

    newcomerTip.value = '';

  }

}



async function loadList(reset = false) {

  if (reset) {

    page.value = 1;

    finished.value = false;

  }

  if (reset) loading.value = true;

  else loadingMore.value = true;



  try {

    const resp = await expertApi.listTrainers(buildQuery());

    const records = (resp && (resp.records || resp.content || resp.list)) || [];

    const items = records.map(normalizeExpert).filter(Boolean);



    if (reset) list.value = items;

    else list.value = list.value.concat(items);



    if (items.length < size) finished.value = true;

    else page.value += 1;



    if (reset && !items.length) {

      list.value = MOCK_TRAINER_LIST.map(normalizeExpert).filter(Boolean);

      finished.value = true;

    }

  } catch (_) {

    if (reset) {

      list.value = MOCK_TRAINER_LIST.map(normalizeExpert).filter(Boolean);

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



  const incomingFilter = searchStore.consumeExpertFilter();

  if (incomingFilter.expertiseCategoryId) {

    filters[0].value = incomingFilter.expertiseCategoryId;

  }

  if (incomingFilter.industryCategoryId) {

    filters[1].value = incomingFilter.industryCategoryId;

  }

  if (incomingFilter.provinceId) {

    filters[2].value = incomingFilter.provinceId;

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

  await Promise.all([loadNewcomerTip(), loadList(true)]);

}



function onSearch() {

  loadList(true);

}



function focusSearch() {

  uni.pageScrollTo({ scrollTop: 0, duration: 200 });

}



function goMessages() {

  if (!userStore.isLoggedIn) {

    uni.navigateTo({ url: '/pages/auth/login' });

    return;

  }

  uni.navigateTo({ url: '/pages/message/list' });

}



onMounted(async () => {

  await loadFilterOptions();

  await loadNewcomerTip();

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

    gap: $tk-sp-3;

  }

}



.new-strip {

  display: flex;

  align-items: center;

  gap: $tk-sp-2;

  padding: $tk-sp-2 $tk-sp-3;

  background: $tk-bg-card;

  border-radius: $tk-radius-md;

  box-shadow: $tk-shadow-card;



  &__tag {

    flex-shrink: 0;

    padding: 4rpx 12rpx;

    background: $tk-primary;

    color: #fff;

    font-size: $tk-fs-xs;

    font-weight: 800;

    border-radius: $tk-radius-xs;

    font-style: italic;

  }

  &__txt {

    flex: 1;

    min-width: 0;

    font-size: $tk-fs-sm;

    color: $tk-text-2;

    @include tk-ellipsis-1;

  }

}



.list {

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

