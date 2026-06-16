<!--
  专家列表（tab 2）
  对应设计稿：design_stitch/_1/code.html
  区块：
    - 自定义顶栏（左 search / 中标题 / 右 notification）
    - 搜索栏（不带分类）
    - 横向筛选条：类别 / 行业 / 省份 / 评分 / 特色
    - NEW 条：最新专家入驻（单行省略）
    - 专家列表：TkExpertCard variant="row"，纵向
    - 下拉刷新 + 上拉加载更多
-->
<template>
  <view class="page">
    <TkNavBar title="专家">
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
          placeholder="请输入专家名字"
          @search="onSearch"
        />

        <!-- 横向筛选条 -->
        <TkFilterBar :filters="filters" @change="loadList(true)" />

        <!-- NEW 条 -->
        <view class="new-strip">
          <text class="new-strip__tag">NEW</text>
          <text class="new-strip__txt">{{ newcomerTip }}</text>
          <view class="new-strip__stars">
            <TkIcon
              v-for="i in 5"
              :key="i"
              name="star"
              filled
              :size="22"
              :color="i <= 4 ? '#F59E0B' : '#E0E3E6'"
            />
          </view>
        </view>

        <!-- 列表 -->
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
import * as expertApi from '@/api/expert';
import { MOCK_TRAINER_LIST } from '@/utils/mock';

const sysInfo = uni.getSystemInfoSync();
const navBarH = (sysInfo.statusBarHeight || 20) + 44;

const kw = ref('');
const filters = reactive([
  { key: 'expertiseCategoryId', label: '类别', value: '', options: ['领导力', '战略管理', '财税', '营销', '组织发展'] },
  { key: 'industryCategoryId',  label: '行业', value: '', options: ['互联网', '金融', '制造业', '零售'] },
  { key: 'provinceId',          label: '省份', value: '', options: ['北京', '上海', '广州', '深圳', '杭州'] },
  { key: 'sort',                label: '评分', value: '', options: ['评分最高', '评论最多', '最新入驻'] },
  { key: 'isTrusted',           label: '特色', value: '', options: ['信得过', '签约专家', '版权课程'] },
]);

const newcomerTip = ref('最新专家入驻：张伟杰教授 - 数字化转型实战专家，开启企业数字化新篇章...');

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
    if (f.value) q[f.key] = f.value;
  });
  return q;
}

function normalize(item) {
  // 后端 TrainerListItemResponse → TkExpertCard 数据契约
  const tags =
    (Array.isArray(item.expertiseCategories) && item.expertiseCategories.map((c) => c.categoryName).filter(Boolean)) ||
    (typeof item.expertiseTags === 'string' && item.expertiseTags ? item.expertiseTags.split(/[、,，\s]+/).filter(Boolean) : []) ||
    [];
  return {
    id: item.id,
    nickname: item.name || item.nickname,
    avatar: item.avatar,
    title: item.title || item.oneLineIntro,
    rating: Number(item.score || 0),
    verified: !!(item.isTrusted === 1 || item.isTrusted === true),
    tags,
    viewCount: item.viewCount || 0,
    favCount: item.commentCount || 0,
  };
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
    const items = records.map(normalize);

    if (reset) list.value = items;
    else list.value = list.value.concat(items);

    if (items.length < size) finished.value = true;
    else page.value += 1;

    if (reset && !items.length) {
      list.value = MOCK_TRAINER_LIST.map(normalize);
      finished.value = true;
    }
  } catch (_) {
    if (reset) {
      list.value = MOCK_TRAINER_LIST.map(normalize);
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

onMounted(() => loadList(true));
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

// 筛选条 → 已抽至 TkFilterBar 公共组件

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
  &__stars {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 2rpx;
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
