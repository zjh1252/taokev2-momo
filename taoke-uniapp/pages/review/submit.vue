<!-- 提交评价 — 对齐后端 SubmitReviewRequest -->
<template>
  <view class="page">
    <TkNavBar title="发表评价" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <view v-if="productTitle" class="product">
          <text class="product__label">评价对象</text>
          <text class="product__title">{{ productTitle }}</text>
        </view>

        <view class="form">
          <view class="field">
            <text class="field__label">授课内容</text>
            <StarRow :model-value="ratingContent" @update:model-value="ratingContent = $event" />
          </view>
          <view class="field">
            <text class="field__label">授课水平</text>
            <StarRow :model-value="ratingTeaching" @update:model-value="ratingTeaching = $event" />
          </view>
          <view class="field">
            <text class="field__label">服务态度</text>
            <StarRow :model-value="ratingService" @update:model-value="ratingService = $event" />
          </view>

          <view class="field">
            <text class="field__label">文字评价（至少20字）</text>
            <textarea
              class="field__textarea"
              :value="commentText"
              placeholder="请分享您的培训体验"
              maxlength="500"
              @input="commentText = $event.detail.value"
            />
            <text class="field__hint">{{ commentText.length }}/500</text>
          </view>

          <view class="actions">
            <view class="actions__primary" :class="{ 'is-disabled': submitting }" @tap="handleSubmit">
              <text>{{ submitting ? '提交中…' : '提交评价' }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import * as interactionApi from '@/api/interaction';
import { getNavBarHeight } from '@/utils/system';
import { requireLogin } from '@/utils/auth';
import StarRow from './components/star-row.vue';

const navBarH = getNavBarHeight();

const orderNo = ref('');
const productType = ref('');
const productId = ref('');
const productTitle = ref('');

const ratingContent = ref(5);
const ratingTeaching = ref(5);
const ratingService = ref(5);
const commentText = ref('');
const submitting = ref(false);

onLoad((opt) => {
  if (!requireLogin()) return;
  orderNo.value = opt?.orderNo || '';
  productType.value = opt?.productType || '';
  productId.value = opt?.productId || '';
  productTitle.value = opt?.productTitle ? decodeURIComponent(opt.productTitle) : '';
});

function resolveReviewScope(type) {
  if (type === 'OPEN_COURSE' || type === 'VIDEO_COURSE' || type === 'COPYRIGHT_COURSE') {
    return 'COURSE';
  }
  return 'COURSE';
}

async function handleSubmit() {
  if (submitting.value) return;
  if (!ratingContent.value || !ratingTeaching.value || !ratingService.value) {
    uni.showToast({ title: '请完成各项评分', icon: 'none' });
    return;
  }
  if (commentText.value.trim().length < 20) {
    uni.showToast({ title: '文字评价不能少于20字', icon: 'none' });
    return;
  }

  submitting.value = true;
  try {
    const scope = resolveReviewScope(productType.value);
    const payload = {
      reviewScope: scope,
      courseId: scope === 'COURSE' ? Number(productId.value) : undefined,
      courseTitle: productTitle.value || undefined,
      ratingContent: ratingContent.value,
      ratingTeaching: ratingTeaching.value,
      ratingService: ratingService.value,
      commentText: commentText.value.trim(),
      anonymous: false,
    };

    await interactionApi.submitReview(payload);
    uni.showToast({ title: '评价已提交', icon: 'success' });
    setTimeout(() => {
      if (orderNo.value) {
        uni.redirectTo({ url: `/pages/order/checkout?orderNo=${orderNo.value}` });
      } else {
        uni.redirectTo({ url: '/pages/review/list' });
      }
    }, 800);
  } catch (e) {
    uni.showToast({ title: e?.message || '提交失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: $tk-bg-page;
}
.page__scroll {
  height: 100vh;
  box-sizing: border-box;
}
.page__inner {
  padding: $tk-sp-3;
}

.product {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-3;
  margin-bottom: $tk-sp-3;
  box-shadow: $tk-shadow-card;

  &__label {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }
  &__title {
    display: block;
    margin-top: 8rpx;
    font-size: $tk-fs-md;
    font-weight: 700;
    color: $tk-text-1;
  }
}

.form {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-3;
  box-shadow: $tk-shadow-card;
}

.field {
  margin-bottom: $tk-sp-3;

  &__label {
    display: block;
    margin-bottom: 12rpx;
    font-size: $tk-fs-sm;
    font-weight: 600;
    color: $tk-text-2;
  }
  &__textarea {
    width: 100%;
    min-height: 200rpx;
    padding: 20rpx;
    background: $tk-bg-page;
    border-radius: $tk-radius-md;
    font-size: $tk-fs-md;
    box-sizing: border-box;
  }
  &__hint {
    display: block;
    margin-top: 8rpx;
    font-size: $tk-fs-xs;
    color: $tk-text-4;
    text-align: right;
  }
}

.actions__primary {
  margin-top: $tk-sp-2;
  padding: 24rpx;
  border-radius: $tk-radius-full;
  background: $tk-primary;
  text-align: center;
  color: #fff;
  font-weight: 700;

  &.is-disabled { opacity: 0.6; }
}
</style>
