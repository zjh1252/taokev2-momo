<!--

  首页（tab 1）— 对齐 PC 端首页核心区块：

  - 搜索（专家/公开课切换，关键字跨 Tab 传递）

  - Hero Banner + 快捷入口

  - 擅长领域快捷分类（来自 TRAINER_EXPERTISE）

  - 最新案例（/trainer-cases/recent）

  - 推荐专家（运营位 / 推荐池 / 公开列表）

  - 推荐公开课（运营位 / 热门 / isOpen 列表）

-->

<template>

  <view class="page">

    <TkNavBar title="淘课网">

      <template #left><TkIcon name="menu" :size="44" color="#E62117" /></template>

      <template #right>

        <view class="nav-actions">

          <TkIcon name="campaign" :size="44" color="#E62117" @tap="goMessages" />

        </view>

      </template>

    </TkNavBar>



    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarHeight + 'px' }">

      <view class="page__inner">



        <TkSearchBar

          v-model="kw"

          v-model:category="cat"

          :categories="['专家', '公开课']"

          @search="onSearch"

        />



        <!-- Hero Banner -->

        <view class="banner">

          <view class="banner__blob banner__blob--1" />

          <view class="banner__blob banner__blob--2" />

          <text class="banner__tag">企业培训采购平台</text>

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



        <!-- 推荐专家 -->

        <view class="section">

          <view class="section__head">

            <text class="section__title">推荐专家</text>

            <view class="section__more" @tap="goExpertList">

              <text class="section__more-txt">查看全部</text>

              <TkIcon name="chevron-right" :size="22" color="#999" />

            </view>

          </view>

          <TkLoading v-if="loadingExperts" />

          <scroll-view v-else scroll-x class="expert-scroll" show-scrollbar="false">

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



        <!-- 线下公开课（对齐 PC PublicCoursesSection） -->

        <view class="section">

          <view class="section__head">

            <view class="section__title-row">

              <view class="section__bar" />

              <TkIcon name="course" :size="32" color="#EAB308" />

              <text class="section__title">线下公开课</text>

            </view>

            <view class="section__more" @tap="goCourseList">

              <text class="section__more-txt">查看全部</text>

              <TkIcon name="chevron-right" :size="22" color="#999" />

            </view>

          </view>

          <view class="course-list">

            <TkLoading v-if="loadingCourses" />

            <TkEmpty v-else-if="!courses.length" text="暂无推荐课程" />

            <TkHomePublicCourseCard

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

import { onPullDownRefresh, onShow } from '@dcloudio/uni-app';

import { useSearchStore } from '@/stores/search';

import { loadHomeExperts, loadHomePublicCourses } from '@/utils/home-data';

import { MOCK_BANNER } from '@/utils/mock';

import { getNavBarHeight } from '@/utils/system';

import { useUserStore } from '@/stores/user';



const navBarHeight = getNavBarHeight();

const searchStore = useSearchStore();

const userStore = useUserStore();



const kw = ref('');

const cat = ref('专家');



const banner = ref({

  ...MOCK_BANNER,

  title: '连接企业与培训专家',

  subtitle: '精选行业大咖，公开课与内训一站式采购',

  primaryAction: { text: '找专家', url: '/pages/expert/list' },

  secondaryAction: { text: '看公开课', url: '/pages/course/list' },

});



const experts = ref([]);

const courses = ref([]);

const loadingExperts = ref(false);

const loadingCourses = ref(false);



async function loadExperts() {

  loadingExperts.value = true;

  try {

    experts.value = await loadHomeExperts(6);

  } finally {

    loadingExperts.value = false;

  }

}



async function loadCourses() {

  loadingCourses.value = true;

  try {

    courses.value = await loadHomePublicCourses(3);

  } finally {

    loadingCourses.value = false;

  }

}



async function refreshAll() {

  await Promise.all([loadExperts(), loadCourses()]);

}



function onSearch() {

  const target = cat.value === '专家' ? 'expert' : 'course';

  searchStore.setSearch(kw.value, target);

  uni.switchTab({

    url: target === 'expert' ? '/pages/expert/list' : '/pages/course/list',

  });

}



function goExpertList() { uni.switchTab({ url: '/pages/expert/list' }); }

function goCourseList() { uni.switchTab({ url: '/pages/course/list' }); }



function goMessages() {

  if (!userStore.isLoggedIn) {

    uni.navigateTo({ url: '/pages/auth/login' });

    return;

  }

  uni.navigateTo({ url: '/pages/message/list' });

}



function goPath(url) {

  if (!url) return;

  const tabbar = ['/pages/home/index', '/pages/expert/list', '/pages/course/list', '/pages/user/index'];

  if (tabbar.includes(url)) uni.switchTab({ url });

  else uni.navigateTo({ url });

}



onMounted(refreshAll);



onShow(() => {

  // 从其他 Tab 返回时不重复拉全量，仅轻量刷新案例条

  if (experts.value.length) return;

  refreshAll();

});



onPullDownRefresh(async () => {

  await refreshAll();

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



.nav-actions {

  display: flex;

  align-items: center;

}



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

    filter: blur(12rpx);

    &--1 { width: 240rpx; height: 240rpx; top: -48rpx; right: -48rpx; }

    &--2 { width: 160rpx; height: 160rpx; bottom: -32rpx; left: -32rpx; }

  }



  &__tag {

    position: relative;

    display: block;

    color: rgba(255,255,255,0.85);

    font-size: $tk-fs-xs;

    font-weight: 600;

    letter-spacing: 2rpx;

    margin-bottom: 8rpx;

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



.cat-quick {

  background: $tk-bg-card;

  border-radius: $tk-radius-md;

  padding: $tk-sp-3;

  box-shadow: $tk-shadow-card;



  &__head {

    display: flex;

    align-items: center;

    gap: 8rpx;

    margin-bottom: $tk-sp-2;

  }

  &__title {

    font-size: $tk-fs-md;

    font-weight: 700;

    color: $tk-text-1;

  }

  &__scroll {

    width: 100%;

    white-space: nowrap;

  }

  &__inner {

    display: inline-flex;

    gap: $tk-sp-2;

  }

  &__chip {

    flex-shrink: 0;

    padding: 10rpx 24rpx;

    background: $tk-primary-soft;

    border-radius: $tk-radius-full;

  }

  &__chip-txt {

    font-size: $tk-fs-sm;

    color: $tk-primary;

    font-weight: 500;

    white-space: nowrap;

  }

}



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



.section {

  display: flex;

  flex-direction: column;

  gap: $tk-sp-2;



  &__head {

    display: flex;

    justify-content: space-between;

    align-items: center;

    padding: 0 4rpx;

  }

  &__title-row {

    display: flex;

    align-items: center;

    gap: 8rpx;

  }

  &__bar {

    width: 6rpx;

    height: 32rpx;

    background: $tk-primary;

    border-radius: 4rpx;

    flex-shrink: 0;

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



.case-grid {

  display: grid;

  grid-template-columns: repeat(2, 1fr);

  gap: $tk-sp-2;

}

</style>

