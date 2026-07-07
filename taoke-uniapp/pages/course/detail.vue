<!--
  公开课详情
  对应设计稿：design_stitch/_6/code.html
  对应后端：GET /courses/{id}（CourseDetailVO）

  区块（自上而下）：
    - 自定义顶栏（back / share）
    - 大图封面
    - 标题 + 日期/地点 元数据
    - 价格行
    - 专家卡（头像 + 姓名 + 查看专家）
    - 课程介绍（intro）
    - 课程大纲（syllabus，按行渲染）
    - 适合人群（audience）
    - 课程亮点（highlights）
    - 期次列表（plans）
    - 吸底操作栏：咨询客服 + 立即报名
-->
<template>
  <view class="page">
    <TkNavBar title="课程详情" left-icon="back">
      <template #right><TkIcon name="paperplane" :size="40" color="#1B1C1C" /></template>
    </TkNavBar>

    <scroll-view
      scroll-y
      class="page__scroll"
      :style="{ paddingTop: navBarH + 'px' }"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="page__inner">
        <!-- 封面 -->
        <view class="cover">
          <image v-if="course.coverUrl" class="cover__img" :src="toAssetUrl(course.coverUrl)" mode="aspectFill" />
          <view v-else class="cover__placeholder">
            <TkIcon name="image" :size="80" color="#bbb" />
          </view>
          <view v-if="course.typeLabel" class="cover__tag">{{ course.typeLabel }}</view>
        </view>

        <view v-if="course.isOverdue" class="expired-banner">
          <text class="expired-banner__txt">该线下公开课已结束，仅可查看历史课程资料</text>
        </view>

        <!-- 标题 + 元数据 + 价格 -->
        <view class="meta-card">
          <text class="meta-card__title">{{ course.title || '—' }}</text>

          <view v-if="metaLine" class="meta-card__row">
            <view v-if="course.nextPlanStartDate" class="meta-card__item">
              <TkIcon name="calendar" :size="24" color="#999" />
              <text class="meta-card__txt">{{ formatDate(course.nextPlanStartDate) }}</text>
            </view>
            <view v-if="course.nextPlanCity" class="meta-card__item">
              <TkIcon name="location" :size="24" color="#999" />
              <text class="meta-card__txt">{{ course.nextPlanCity }}</text>
            </view>
            <view v-if="course.durationDays" class="meta-card__item">
              <text class="meta-card__txt">{{ course.durationDays }} 天 · 共 {{ course.totalHours || '6' }} 小时</text>
            </view>
          </view>

          <view class="meta-card__price-row">
            <view class="meta-card__price-main">
              <text class="meta-card__price">¥ {{ formatPrice(course.price) }}</text>
              <text v-if="course.originalPrice && Number(course.originalPrice) > Number(course.price || 0)" class="meta-card__price-old">
                ¥ {{ formatPrice(course.originalPrice) }}
              </text>
            </view>
            <view class="meta-card__price-stats">
              <view v-if="courseRating.showStars" class="meta-card__price-stat">
                <TkIcon name="star" filled :size="22" color="#F59E0B" />
                <text>{{ courseRating.label }}</text>
              </view>
              <text v-else class="meta-card__price-stat meta-card__price-stat--muted">{{ courseRating.label }}</text>
              <text v-if="course.enrollmentCount" class="meta-card__price-stat">
                {{ course.enrollmentCount }} 人已报名
              </text>
            </view>
          </view>
        </view>

        <!-- 操作区（对齐 PC CourseSidebar） -->
        <view v-if="!course.isOverdue" class="action-panel">
          <view v-if="isOpenCourse && Number(course.price) > 0" class="action-panel__price">
            <text class="action-panel__price-label">培训参考价</text>
            <view class="action-panel__price-row">
              <text class="action-panel__price-val">¥ {{ formatPrice(course.price) }}</text>
              <text
                v-if="course.originalPrice && Number(course.originalPrice) > Number(course.price || 0)"
                class="action-panel__price-old"
              >
                ¥ {{ formatPrice(course.originalPrice) }}
              </text>
            </view>
          </view>

          <view
            v-if="isPurchasable"
            class="action-panel__btn action-panel__btn--primary"
            :class="{ 'is-disabled': buying }"
            @tap="onBuy"
          >
            <TkIcon name="fire" :size="28" color="#fff" />
            <text>{{ buying ? '处理中...' : '立即购买' }}</text>
          </view>

          <view
            v-if="isPurchasable"
            class="action-panel__btn action-panel__btn--outline"
            @tap="onAddCart"
          >
            <TkIcon name="cart" :size="28" color="#E62117" />
            <text>加入购物车</text>
          </view>

          <view v-if="!isPurchasable && isOpenCourse" class="action-panel__btn action-panel__btn--primary" @tap="onConsult">
            <TkIcon name="fire" :size="28" color="#fff" />
            <text>预约咨询</text>
          </view>

          <view class="action-panel__btn action-panel__btn--ghost" @tap="onConsult">
            <TkIcon name="chat" :size="28" color="#666" />
            <text>立即咨询</text>
          </view>

          <view class="action-panel__btn action-panel__btn--ghost" @tap="onFavorite">
            <TkIcon name="heart" :filled="favorited" :size="28" :color="favorited ? '#E62117' : '#666'" />
            <text>{{ favorited ? '已收藏' : '加入收藏' }}</text>
          </view>
        </view>

        <!-- 专家卡 -->
        <view v-if="course.trainerName" class="trainer-card" @tap="goTrainer">
          <view class="trainer-card__left">
            <image v-if="course.trainerAvatar" class="trainer-card__avatar" :src="toAssetUrl(course.trainerAvatar)" mode="aspectFill" />
            <view v-else class="trainer-card__avatar trainer-card__avatar--placeholder">
              <TkIcon name="staff" :size="40" color="#bbb" />
            </view>
            <view class="trainer-card__info">
              <text class="trainer-card__name">{{ course.trainerName }} 老师</text>
              <text class="trainer-card__sub">{{ course.publisherName || '主讲教师' }}</text>
            </view>
          </view>
          <view class="trainer-card__more">
            <text class="trainer-card__more-txt">查看专家</text>
            <TkIcon name="chevron-right" :size="22" color="#E62117" />
          </view>
        </view>

        <!-- 课程介绍 -->
        <TkSection v-if="course.intro" title="课程介绍">
          <text class="paragraph">{{ course.intro }}</text>
        </TkSection>

        <!-- 课程大纲 -->
        <TkSection v-if="syllabusLines.length" title="课程大纲">
          <view v-for="(ln, i) in syllabusLines" :key="i" class="bullet">
            <view class="bullet__dot" />
            <text class="bullet__txt">{{ ln }}</text>
          </view>
        </TkSection>

        <!-- 适合人群 -->
        <TkSection v-if="course.audience" title="适合人群">
          <text class="paragraph">{{ course.audience }}</text>
        </TkSection>

        <!-- 课程亮点 -->
        <TkSection v-if="highlightLines.length" title="课程亮点">
          <view v-for="(ln, i) in highlightLines" :key="i" class="bullet">
            <view class="bullet__dot bullet__dot--primary" />
            <text class="bullet__txt">{{ ln }}</text>
          </view>
        </TkSection>

        <!-- 期次 -->
        <TkSection v-if="(course.plans || []).length" title="开课期次">
          <view v-for="p in course.plans" :key="p.id" class="plan-item">
            <view class="plan-item__time">
              <TkIcon name="calendar" :size="24" color="#E62117" />
              <text class="plan-item__time-txt">{{ formatDate(p.startTime) }} - {{ formatDate(p.endTime) }}</text>
            </view>
            <view v-if="p.address" class="plan-item__addr">
              <TkIcon name="location" :size="22" color="#999" />
              <text class="plan-item__addr-txt">{{ p.address }}</text>
            </view>
          </view>
        </TkSection>

        <view style="height: 40rpx;" />
      </view>
    </scroll-view>

    <TkLoading v-if="loading && !course.id" />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import * as courseApi from '@/api/course';
import * as orderApi from '@/api/order';
import * as cartApi from '@/api/cart';
import * as interactionApi from '@/api/interaction';
import { requireLogin } from '@/utils/auth';
import { MOCK_COURSE_DETAIL } from '@/utils/mock';
import { toAssetUrl } from '@/utils/asset';
import { formatPlanStartDate } from '@/utils/course-display';
import { formatCourseRating } from '@/utils/rating-display';
import { getNavBarHeight } from '@/utils/system';

const navBarH = getNavBarHeight();

const id = ref('');
const course = ref({});
const loading = ref(false);
const refreshing = ref(false);
const favorited = ref(false);
const buying = ref(false);
const cartLoading = ref(false);

const isOpenCourse = computed(() => {
  const t = course.value.type;
  return t === 'OPEN_OFFLINE' || t === 'OPEN_ONLINE' || course.value.isOpen === true;
});

const isPurchasable = computed(() => {
  if (!isOpenCourse.value || course.value.isOverdue) return false;
  if (course.value.isFree === 1) return false;
  const price = Number(course.value.price || 0);
  return price > 0;
});

const metaLine = computed(
  () => course.value.nextPlanStartDate || course.value.nextPlanCity || course.value.durationDays,
);

const courseRating = computed(() => formatCourseRating(course.value.score));

const syllabusLines = computed(() => splitLines(course.value.syllabus));
const highlightLines = computed(() => splitLines(course.value.highlights));

function splitLines(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .split(/\n|；|;|·|•/)
    .map((s) => s.trim().replace(/^[0-9]+[.、]\s*/, '').replace(/^[•·]\s*/, ''))
    .filter(Boolean);
}

function formatPrice(p) {
  if (p == null || p === '') return '面议';
  const n = Number(p);
  if (!Number.isFinite(n)) return p;
  return n.toLocaleString('zh-CN');
}

function formatDate(t) {
  return formatPlanStartDate(t);
}

async function loadDetail() {
  loading.value = true;
  try {
    const data = await courseApi.getCourseDetail(id.value);
    course.value = data || MOCK_COURSE_DETAIL;
  } catch (_) {
    course.value = MOCK_COURSE_DETAIL;
  } finally {
    loading.value = false;
  }

  if (course.value && course.value.id) {
    interactionApi
      .checkFavorite({ targetType: 'COURSE', targetId: course.value.id })
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

function goTrainer() {
  const tid = course.value.trainerId || course.value.publisherId;
  if (!tid) {
    uni.showToast({ title: '专家信息暂不可用', icon: 'none' });
    return;
  }
  uni.navigateTo({ url: `/pages/expert/detail?id=${tid}` });
}

function onConsult() {
  uni.showActionSheet({
    itemList: ['消息中心留言', '返回'],
    success: (res) => {
      if (res.tapIndex === 0) {
        if (!requireLogin()) return;
        uni.navigateTo({ url: '/pages/message/list' });
      }
    },
  });
}

async function submitOrder() {
  const order = await orderApi.createOrder({
    directItem: { productType: 'OPEN_COURSE', productId: course.value.id, quantity: 1 },
  });
  uni.navigateTo({ url: `/pages/order/checkout?orderNo=${order.orderNo}` });
}

async function onBuy() {
  if (!course.value.id) return;
  if (course.value.isOverdue) {
    uni.showToast({ title: '课程已结束', icon: 'none' });
    return;
  }
  if (!requireLogin()) return;
  if (!isPurchasable.value) {
    onConsult();
    return;
  }
  if (buying.value) return;
  buying.value = true;
  try {
    const pending = await orderApi.getPendingOrderByProduct('OPEN_COURSE', course.value.id);
    if (pending?.orderNo) {
      uni.showModal({
        title: '待支付订单',
        content: '您有一笔待支付订单，是否前往支付？',
        confirmText: '去支付',
        confirmColor: '#E62117',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({ url: `/pages/order/checkout?orderNo=${pending.orderNo}` });
          }
        },
      });
      return;
    }
    await submitOrder();
  } catch (e) {
    uni.showToast({ title: e?.message || '下单失败', icon: 'none' });
  } finally {
    buying.value = false;
  }
}

async function onAddCart() {
  if (!course.value.id) return;
  if (!isPurchasable.value) {
    uni.showToast({ title: '该课程暂不支持加入购物车', icon: 'none' });
    return;
  }
  if (!requireLogin()) return;
  if (cartLoading.value) return;
  cartLoading.value = true;
  try {
    await cartApi.addCartItem({ productType: 'OPEN_COURSE', productId: course.value.id, quantity: 1 });
    uni.showToast({ title: '已加入购物车', icon: 'success' });
  } catch (e) {
    if (e && (e.code === 401 || e.code === 10001)) return;
    uni.showToast({ title: e?.message || '加入失败', icon: 'none' });
  } finally {
    cartLoading.value = false;
  }
}

async function onFavorite() {
  if (!course.value.id) return;
  try {
    if (favorited.value) {
      await interactionApi.removeFavorite({ targetType: 'COURSE', targetId: course.value.id });
      favorited.value = false;
      uni.showToast({ title: '已取消收藏', icon: 'none' });
    } else {
      await interactionApi.addFavorite({ targetType: 'COURSE', targetId: course.value.id });
      favorited.value = true;
      uni.showToast({ title: '已收藏', icon: 'none' });
    }
  } catch (e) {
    if (e && (e.code === 401 || e.code === 10001)) return;
    uni.showToast({ title: e?.message || '操作失败', icon: 'none' });
  }
}

onLoad((opt) => {
  id.value = opt?.id || '';
  if (!id.value) {
    course.value = MOCK_COURSE_DETAIL;
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

// 封面
.cover {
  position: relative;
  border-radius: $tk-radius-md;
  overflow: hidden;
  height: 384rpx;
  background: $tk-divider-light;
  box-shadow: $tk-shadow-card;

  &__img {
    width: 100%;
    height: 100%;
  }
  &__placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__tag {
    position: absolute;
    top: $tk-sp-2;
    left: $tk-sp-2;
    padding: 4rpx 16rpx;
    background: rgba(230, 33, 23, 0.92);
    color: #fff;
    font-size: $tk-fs-xs;
    font-weight: 700;
    border-radius: $tk-radius-xs;
  }
}

.expired-banner {
  margin-top: $tk-sp-2;
  padding: 20rpx 24rpx;
  border-radius: $tk-radius-md;
  background: #f1f5f9;
  border: 1rpx solid $tk-divider;

  &__txt {
    font-size: 26rpx;
    color: $tk-text-2;
    line-height: 1.5;
  }
}

// 标题 + 元数据 + 价格 卡片
.meta-card {
  background: $tk-bg-card;
  border-radius: $tk-radius-md;
  padding: $tk-sp-4 $tk-sp-3;
  box-shadow: $tk-shadow-card;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-2;

  &__title {
    font-size: $tk-fs-2xl;
    font-weight: 800;
    color: $tk-text-1;
    line-height: $tk-lh-tight;
  }

  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: $tk-sp-3;
  }
  &__item {
    display: flex;
    align-items: center;
    gap: 4rpx;
  }
  &__txt {
    font-size: $tk-fs-sm;
    color: $tk-text-2;
  }

  &__price-row {
    margin-top: $tk-sp-2;
    padding-top: $tk-sp-3;
    border-top: 2rpx solid $tk-divider-light;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: $tk-sp-2;
  }
  &__price-main {
    display: flex;
    align-items: baseline;
    gap: $tk-sp-2;
  }
  &__price {
    font-size: $tk-fs-3xl;
    font-weight: 800;
    color: $tk-primary;
    line-height: $tk-lh-tight;
  }
  &__price-old {
    font-size: $tk-fs-sm;
    color: $tk-text-4;
    text-decoration: line-through;
  }
  &__price-stats {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4rpx;
  }
  &__price-stat {
    font-size: $tk-fs-xs;
    color: $tk-text-2;
    display: flex;
    align-items: center;
    gap: 4rpx;

    &--muted {
      color: $tk-text-4;
    }
  }
}

// 操作区（对齐 PC 侧栏）
.action-panel {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-3;
  box-shadow: $tk-shadow-card;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-2;

  &__price {
    text-align: center;
    padding-bottom: $tk-sp-2;
    border-bottom: 2rpx solid $tk-divider-light;
  }

  &__price-label {
    display: block;
    font-size: $tk-fs-sm;
    color: $tk-text-3;
    margin-bottom: 4rpx;
  }

  &__price-row {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 8rpx;
  }

  &__price-val {
    font-size: 56rpx;
    font-weight: 800;
    color: $tk-primary;
  }

  &__price-old {
    font-size: $tk-fs-sm;
    color: $tk-text-4;
    text-decoration: line-through;
  }

  &__btn {
    height: 88rpx;
    border-radius: $tk-radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    font-size: $tk-fs-md;
    font-weight: 600;

    &--primary {
      background: $tk-primary;
      color: #fff;
      box-shadow: $tk-shadow-primary;
    }

    &--outline {
      background: #fff;
      color: $tk-primary;
      border: 2rpx solid $tk-primary;
    }

    &--ghost {
      background: #fff;
      color: $tk-text-2;
      border: 2rpx solid $tk-border;
    }

    &.is-disabled {
      opacity: 0.6;
    }
  }
}

// 专家卡
.trainer-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: $tk-bg-card;
  border-radius: $tk-radius-md;
  padding: $tk-sp-3;
  box-shadow: $tk-shadow-card;

  &__left {
    display: flex;
    align-items: center;
    gap: $tk-sp-2;
    flex: 1;
    min-width: 0;
  }
  &__avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: $tk-divider-light;
    flex-shrink: 0;
    border: 2rpx solid $tk-border;

    &--placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  &__info {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
    min-width: 0;
  }
  &__name {
    font-size: $tk-fs-md;
    font-weight: 600;
    color: $tk-text-1;
  }
  &__sub {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }
  &__more {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 2rpx;
  }
  &__more-txt {
    font-size: $tk-fs-sm;
    color: $tk-primary;
    font-weight: 500;
  }
}

.paragraph {
  display: block;
  font-size: $tk-fs-md;
  color: $tk-text-2;
  line-height: $tk-lh-relaxed;
}

.bullet {
  display: flex;
  gap: $tk-sp-2;
  align-items: flex-start;
  padding: 8rpx 0;

  &__dot {
    flex-shrink: 0;
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: $tk-text-4;
    margin-top: 14rpx;

    &--primary { background: $tk-primary; }
  }
  &__txt {
    flex: 1;
    font-size: $tk-fs-md;
    color: $tk-text-2;
    line-height: $tk-lh-normal;
  }
}

.plan-item {
  padding: $tk-sp-2 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  border-bottom: 2rpx solid $tk-divider-light;

  &:last-child { border-bottom: none; }

  &__time,
  &__addr {
    display: flex;
    align-items: center;
    gap: 4rpx;
  }
  &__time-txt {
    font-size: $tk-fs-md;
    color: $tk-text-1;
    font-weight: 500;
  }
  &__addr-txt {
    font-size: $tk-fs-sm;
    color: $tk-text-2;
  }
}

// 吸底操作栏 → 已抽至 TkActionBar / TkActionBtn 公共组件
</style>
