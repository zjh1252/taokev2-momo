<!--
  专家详情
  对应后端：GET /trainers/{id}（TrainerPublicResponse）
            GET /trainers/{id}/courses（推荐课程）
            GET /trainers/{id}/cases（授课案例）

  设计：design_stitch 中无单独"专家详情"稿，按设计令牌+设计语言一致原则自构。
  区块（自上而下）：
    - 顶部封面背景 + TkNavBar (back / share)
    - 信息卡：头像、姓名、信得过角标、一句话介绍、评分、统计、地区
    - 标签云：擅长领域 + 行业
    - 简介、擅长、教学风格
    - 服务过的客户
    - 教育背景 / 工作经历
    - 推荐课程
    - 授课案例
    - 吸底操作栏（联系咨询 / 立即预约）
-->
<template>
  <view class="page">
    <!-- 顶部背景图区，配合透明 navBar 通栏 -->
    <view class="hero" :style="{ height: heroH + 'px' }">
      <image
        v-if="trainer.backgroundImage || trainer.avatar"
        class="hero__bg"
        :src="toAssetUrl(trainer.backgroundImage || trainer.avatar)"
        mode="aspectFill"
      />
      <view class="hero__mask" />
    </view>

    <TkNavBar transparent left-icon="back" :icon-color="'#fff'" :title-color="'#fff'" :title="''">
      <template #right>
        <TkIcon name="paperplane" :size="40" color="#fff" />
      </template>
    </TkNavBar>

    <scroll-view
      scroll-y
      class="page__scroll"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 让内容从封面下半段开始 -->
      <view class="page__inner" :style="{ paddingTop: heroH * 0.55 + 'px' }">
        <!-- 信息卡 -->
        <view class="info-card">
          <view class="info-card__row">
            <image class="info-card__avatar" :src="toAssetUrl(trainer.avatar)" mode="aspectFill" />
            <view class="info-card__main">
              <view class="info-card__name-row">
                <text class="info-card__name">{{ trainer.name || '—' }}</text>
                <text v-if="trainer.isTrusted === 1" class="info-card__badge">信得过</text>
              </view>
              <text v-if="trainer.title" class="info-card__title">{{ trainer.title }}</text>
              <text v-if="trainer.oneLineIntro" class="info-card__intro">{{ trainer.oneLineIntro }}</text>
            </view>
          </view>

          <view class="info-card__stats">
            <view class="info-card__stat">
              <view class="info-card__stat-row">
                <TkIcon name="star" filled :size="24" color="#F59E0B" />
                <text class="info-card__stat-value">{{ Number(trainer.score || 0).toFixed(1) }}</text>
              </view>
              <text class="info-card__stat-label">综合评分</text>
            </view>
            <view class="info-card__divider" />
            <view class="info-card__stat">
              <text class="info-card__stat-value">{{ trainer.viewCount || 0 }}</text>
              <text class="info-card__stat-label">浏览</text>
            </view>
            <view class="info-card__divider" />
            <view class="info-card__stat">
              <text class="info-card__stat-value">{{ trainer.commentCount || 0 }}</text>
              <text class="info-card__stat-label">评价</text>
            </view>
            <view class="info-card__divider" />
            <view class="info-card__stat">
              <text class="info-card__stat-value">{{ trainer.consultationCount || 0 }}</text>
              <text class="info-card__stat-label">咨询</text>
            </view>
          </view>

          <view v-if="locationText" class="info-card__loc">
            <TkIcon name="location" :size="22" color="#999" />
            <text class="info-card__loc-txt">{{ locationText }}</text>
          </view>
        </view>

        <!-- 标签 -->
        <view v-if="categoryTags.length || industryTags.length" class="tag-group">
          <view v-if="categoryTags.length" class="tag-group__row">
            <text class="tag-group__label">擅长</text>
            <view class="tag-group__tags">
              <text v-for="t in categoryTags" :key="'c-'+t" class="tag-group__tag">{{ t }}</text>
            </view>
          </view>
          <view v-if="industryTags.length" class="tag-group__row">
            <text class="tag-group__label">行业</text>
            <view class="tag-group__tags">
              <text v-for="t in industryTags" :key="'i-'+t" class="tag-group__tag tag-group__tag--ghost">{{ t }}</text>
            </view>
          </view>
        </view>

        <!-- 简介 -->
        <TkSection v-if="trainer.bio" title="个人简介">
          <text class="paragraph">{{ trainer.bio }}</text>
        </TkSection>

        <!-- 擅长 / 教学风格 -->
        <TkSection v-if="trainer.goodAt || trainer.teachingStyle" title="授课特色">
          <view v-if="trainer.goodAt" class="kv">
            <text class="kv__k">擅长领域</text>
            <text class="kv__v">{{ trainer.goodAt }}</text>
          </view>
          <view v-if="trainer.teachingStyle" class="kv">
            <text class="kv__k">教学风格</text>
            <text class="kv__v">{{ trainer.teachingStyle }}</text>
          </view>
          <view v-if="trainer.experienceYears" class="kv">
            <text class="kv__k">从业年限</text>
            <text class="kv__v">{{ trainer.experienceYears }} 年</text>
          </view>
        </TkSection>

        <!-- 客户 -->
        <TkSection v-if="trainer.partialClients" title="服务过的客户">
          <text class="paragraph">{{ trainer.partialClients }}</text>
        </TkSection>

        <!-- 教育 -->
        <TkSection v-if="(trainer.educations || []).length" title="教育背景">
          <view v-for="(edu, idx) in trainer.educations" :key="idx" class="line-item">
            <text class="line-item__main">{{ edu.schoolName }}<text class="line-item__sep"> · </text>{{ edu.major }}</text>
            <text v-if="edu.startDate || edu.endDate" class="line-item__sub">{{ edu.startDate || '' }} ~ {{ edu.endDate || '至今' }}</text>
          </view>
        </TkSection>

        <!-- 工作经历 -->
        <TkSection v-if="(trainer.workExperiences || []).length" title="工作经历">
          <view v-for="(w, idx) in trainer.workExperiences" :key="idx" class="line-item">
            <text class="line-item__main">{{ w.companyName }}<text class="line-item__sep"> · </text>{{ w.position }}</text>
            <text v-if="w.startDate || w.endDate" class="line-item__sub">{{ w.startDate || '' }} ~ {{ w.endDate || '至今' }}</text>
          </view>
        </TkSection>

        <!-- 推荐课程 -->
        <TkSection v-if="courses.length" title="推荐课程">
          <view class="course-list">
            <TkCourseCard v-for="c in courses" :key="c.id" :course="c" />
          </view>
        </TkSection>

        <!-- 授课案例（有数据才显示，对齐 PC 专家主页预览） -->
        <TkSection v-if="cases.length" title="授课案例">
          <view class="case-grid">
            <view
              v-for="cs in cases.slice(0, 3)"
              :key="cs.id"
              class="case-preview"
              @tap="onCaseTap(cs)"
            >
              <view class="case-preview__cover">
                <image
                  v-if="cs.coverImage"
                  class="case-preview__img"
                  :src="toAssetUrl(cs.coverImage)"
                  mode="aspectFill"
                />
                <view v-else class="case-preview__ph">暂无封面</view>
              </view>
              <text class="case-preview__title">{{ cs.caseTitle }}</text>
              <text v-if="caseDesc(cs)" class="case-preview__desc">{{ caseDesc(cs) }}</text>
            </view>
          </view>
        </TkSection>

        <view style="height: 200rpx;" />
      </view>
    </scroll-view>

    <!-- 吸底操作栏 -->
    <TkActionBar>
      <TkActionBtn icon="chat" label="咨询" @tap="onConsult" />
      <TkActionBtn
        icon="heart"
        :icon-filled="favorited"
        :icon-color="favorited ? '#E62117' : '#666'"
        :label="favorited ? '已收藏' : '收藏'"
        @tap="onFavorite"
      />
      <TkActionBtn label="立即预约" type="primary" @tap="onBook" />
    </TkActionBar>

    <TkLoading v-if="loading && !trainer.id" />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import * as expertApi from '@/api/expert';
import * as interactionApi from '@/api/interaction';
import { MOCK_TRAINER_DETAIL, MOCK_COURSES } from '@/utils/mock';
import { normalizeCase } from '@/utils/normalize';
import { toAssetUrl } from '@/utils/asset';

const heroH = 360;

const id = ref('');
const trainer = ref({});
const courses = ref([]);
const cases = ref([]);
const loading = ref(false);
const refreshing = ref(false);
const favorited = ref(false);

const categoryTags = computed(() =>
  ((trainer.value.expertiseCategories || []).map((c) => c.categoryName).filter(Boolean)),
);
const industryTags = computed(() =>
  ((trainer.value.industryCategories || []).map((c) => c.categoryName).filter(Boolean)),
);
const locationText = computed(() => {
  const p = trainer.value.provinceName;
  const c = trainer.value.cityName;
  if (!p && !c) return '';
  if (p && c && p !== c) return `${p} · ${c}`;
  return p || c;
});

function normalizeCourse(v) {
  return {
    id: v.id || v.courseId,
    title: v.title || v.name,
    coverUrl: v.coverUrl || v.cover,
    startDate: v.nextPlanStartDate || v.startTime || '',
    city: v.nextPlanCity || v.cityName || '',
    trainerName: v.trainerName,
    price: v.price ?? v.salePrice ?? '',
  };
}

const SILENT = { silent: true };

async function loadDetail() {
  loading.value = true;
  try {
    const data = await expertApi.getTrainerDetail(id.value, SILENT);
    trainer.value = data || MOCK_TRAINER_DETAIL;
  } catch (_) {
    trainer.value = MOCK_TRAINER_DETAIL;
  } finally {
    loading.value = false;
  }

  expertApi
    .listTrainerCourses(id.value, { page: 1, size: 5 }, SILENT)
    .then((page) => {
      const records = (page && (page.records || page.content || page.list)) || [];
      courses.value = records.map(normalizeCourse);
    })
    .catch(() => {
      courses.value = MOCK_COURSES.slice(0, 2);
    });

  expertApi
    .listTrainerCases(id.value, SILENT)
    .then((data) => {
      cases.value = Array.isArray(data) ? data.map(normalizeCase).filter(Boolean) : [];
    })
    .catch(() => {
      cases.value = [];
    });

  // 收藏态
  if (trainer.value && trainer.value.userId) {
    interactionApi
      .checkFavorite({ targetType: 'TRAINER', targetId: trainer.value.userId }, SILENT)
      .then((r) => {
        favorited.value = !!r;
      })
      .catch(() => {});
  }
}

async function onRefresh() {
  refreshing.value = true;
  await loadDetail();
  refreshing.value = false;
}

function onConsult() {
  uni.showToast({ title: '咨询入口建设中', icon: 'none' });
}

function onBook() {
  if (courses.value && courses.value.length) {
    uni.navigateTo({ url: `/pages/course/detail?id=${courses.value[0].id}` });
    return;
  }
  uni.showToast({ title: '该专家暂无可预约课程', icon: 'none' });
}

async function onFavorite() {
  const targetId = trainer.value.userId || trainer.value.id;
  if (!targetId) return;
  try {
    if (favorited.value) {
      await interactionApi.removeFavorite({ targetType: 'TRAINER', targetId });
      favorited.value = false;
      uni.showToast({ title: '已取消收藏', icon: 'none' });
    } else {
      await interactionApi.addFavorite({ targetType: 'TRAINER', targetId });
      favorited.value = true;
      uni.showToast({ title: '已收藏', icon: 'none' });
    }
  } catch (e) {
    if (e && (e.code === 401 || e.code === 10001)) return;
    uni.showToast({ title: e?.message || '操作失败', icon: 'none' });
  }
}

function onCaseTap(_cs) {
  uni.showToast({ title: '案例详情请在 PC 端查看', icon: 'none' });
}

function caseDesc(cs) {
  const d = cs?.description || '';
  if (!d || typeof d !== 'string') return '';
  return d.replace(/<[^>]+>/g, '').trim();
}

onLoad((opt) => {
  id.value = opt?.id || '';
  if (!id.value) {
    trainer.value = MOCK_TRAINER_DETAIL;
    courses.value = MOCK_COURSES.slice(0, 2);
    return;
  }
  loadDetail();
});
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  background: $tk-bg-page;
  position: relative;
}

.hero {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  overflow: hidden;
  background: linear-gradient(135deg, $tk-primary 0%, #FF8C00 100%);

  &__bg {
    width: 100%;
    height: 100%;
    opacity: 0.55;
  }
  &__mask {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(247,249,252,0.95) 95%, $tk-bg-page 100%);
  }
}

.page__scroll {
  position: relative;
  z-index: 2;
  height: 100vh;
  box-sizing: border-box;
}

.page__inner {
  padding-left: $tk-sp-3;
  padding-right: $tk-sp-3;
  padding-bottom: $tk-sp-6;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-4;
}

// 信息卡
.info-card {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-4 $tk-sp-3;
  box-shadow: $tk-shadow-card-md;

  &__row {
    display: flex;
    gap: $tk-sp-3;
    align-items: flex-start;
  }
  &__avatar {
    width: 144rpx;
    height: 144rpx;
    border-radius: $tk-radius-md;
    flex-shrink: 0;
    background: $tk-divider-light;
    box-shadow: $tk-shadow-card;
  }
  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    padding-top: 4rpx;
  }
  &__name-row {
    display: flex;
    align-items: center;
    gap: $tk-sp-2;
    flex-wrap: wrap;
  }
  &__name {
    font-size: $tk-fs-2xl;
    font-weight: 800;
    color: $tk-text-1;
  }
  &__badge {
    font-size: $tk-fs-xs;
    font-weight: 700;
    color: $tk-primary;
    background: $tk-primary-soft;
    border: 2rpx solid rgba(230, 33, 23, 0.30);
    padding: 4rpx 12rpx;
    border-radius: $tk-radius-xs;
  }
  &__title {
    font-size: $tk-fs-md;
    color: $tk-text-2;
    font-weight: 500;
  }
  &__intro {
    font-size: $tk-fs-sm;
    color: $tk-text-3;
    line-height: $tk-lh-normal;
    @include tk-ellipsis(2);
  }

  &__stats {
    margin-top: $tk-sp-3;
    padding-top: $tk-sp-3;
    border-top: 2rpx solid $tk-divider-light;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  &__stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rpx;
  }
  &__stat-row {
    display: flex;
    align-items: center;
    gap: 4rpx;
  }
  &__stat-value {
    font-size: $tk-fs-xl;
    font-weight: 800;
    color: $tk-text-1;
  }
  &__stat-label {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }
  &__divider {
    width: 2rpx;
    height: 48rpx;
    background: $tk-divider-light;
    flex-shrink: 0;
  }

  &__loc {
    margin-top: $tk-sp-2;
    display: flex;
    align-items: center;
    gap: 4rpx;
  }
  &__loc-txt {
    font-size: $tk-fs-sm;
    color: $tk-text-2;
  }
}

// 标签组
.tag-group {
  background: $tk-bg-card;
  border-radius: $tk-radius-md;
  padding: $tk-sp-3;
  box-shadow: $tk-shadow-card;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-2;

  &__row {
    display: flex;
    align-items: flex-start;
    gap: $tk-sp-2;
  }
  &__label {
    flex-shrink: 0;
    font-size: $tk-fs-sm;
    color: $tk-text-2;
    margin-top: 6rpx;
  }
  &__tags {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 8rpx;
  }
  &__tag {
    font-size: $tk-fs-xs;
    padding: 6rpx 16rpx;
    background: $tk-primary-soft;
    color: $tk-primary;
    border-radius: $tk-radius-full;
    font-weight: 500;
  }
  &__tag--ghost {
    background: $tk-bg-page;
    color: $tk-text-2;
  }
}

.paragraph {
  display: block;
  font-size: $tk-fs-md;
  color: $tk-text-2;
  line-height: $tk-lh-relaxed;
}

.kv {
  display: flex;
  gap: $tk-sp-2;
  padding: $tk-sp-1 0;

  &__k {
    flex-shrink: 0;
    width: 144rpx;
    font-size: $tk-fs-sm;
    color: $tk-text-4;
  }
  &__v {
    flex: 1;
    font-size: $tk-fs-md;
    color: $tk-text-1;
    line-height: $tk-lh-normal;
  }
}

.line-item {
  padding: $tk-sp-2 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  border-bottom: 2rpx solid $tk-divider-light;

  &:last-child { border-bottom: none; }

  &__main {
    font-size: $tk-fs-md;
    color: $tk-text-1;
    font-weight: 500;
  }
  &__sep {
    color: $tk-text-4;
    font-weight: 400;
  }
  &__sub {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: $tk-sp-2;
}

.case-grid {
  display: flex;
  flex-direction: column;
  gap: $tk-sp-2;
}

.case-preview {
  border-radius: $tk-radius-md;
  overflow: hidden;
  border: 2rpx solid $tk-border;
  background: $tk-bg-card;

  &__cover {
    width: 100%;
    height: 280rpx;
    background: #f1f5f9;
    overflow: hidden;
  }

  &__img {
    width: 100%;
    height: 100%;
  }

  &__ph {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: $tk-fs-sm;
    color: $tk-text-4;
  }

  &__title {
    display: block;
    padding: $tk-sp-2 $tk-sp-3 0;
    font-size: $tk-fs-md;
    font-weight: 600;
    color: $tk-text-1;
    @include tk-ellipsis(2);
  }

  &__desc {
    display: block;
    padding: 8rpx $tk-sp-3 $tk-sp-3;
    font-size: $tk-fs-sm;
    color: $tk-text-3;
    @include tk-ellipsis(2);
  }
}

// 吸底操作栏 → 已抽至 TkActionBar / TkActionBtn 公共组件
</style>
