<!--
  公开课列表卡片 — 对齐 PC OpenCourseCard（含封面）
-->
<template>
  <view class="open-card" @tap="onTap">
    <view class="open-card__cover">
      <image
        v-if="coverUrl"
        class="open-card__cover-img"
        :src="coverUrl"
        mode="aspectFill"
        @error="coverFailed = true"
      />
      <view v-else class="open-card__cover-ph">
        <TkIcon name="medal" :size="48" color="#ccc" />
      </view>
    </view>

    <view class="open-card__body">
      <view class="open-card__head">
        <view class="open-card__title-row">
          <text class="open-card__title">{{ course.title }}</text>
          <text v-if="course.isFeatured === 1" class="open-card__badge">推荐</text>
        </view>
        <view class="open-card__stats">
          <text class="open-card__stat">看过：{{ course.viewCount || 0 }}</text>
          <view class="open-card__stars">
            <text class="open-card__stat">评分：</text>
            <template v-if="ratingDisplay.showStars">
              <TkIcon
                v-for="i in 5"
                :key="i"
                name="star"
                :filled="i <= ratingDisplay.starCount"
                :size="22"
                :color="i <= ratingDisplay.starCount ? '#F59E0B' : '#E5E7EB'"
              />
            </template>
            <text v-else class="open-card__stat open-card__stat--muted">{{ ratingDisplay.label }}</text>
          </view>
        </view>
      </view>

      <view class="open-card__grid">
        <view class="open-card__row">
          <text class="open-card__label">开课时间：</text>
          <text class="open-card__val">{{ course.planTime || '-' }}</text>
        </view>
        <view class="open-card__row">
          <text class="open-card__label">课程天数：</text>
          <text class="open-card__val">{{ durationText }}</text>
        </view>
        <view class="open-card__row">
          <text class="open-card__label">开课地点：</text>
          <text class="open-card__val">{{ course.planCity || '-' }}</text>
        </view>
        <view class="open-card__row">
          <text class="open-card__label">授课讲师：</text>
          <text class="open-card__val">{{ course.trainerName || '-' }}</text>
        </view>
        <view class="open-card__row open-card__row--full">
          <text class="open-card__label">课程分类：</text>
          <text class="open-card__val">{{ course.categoryName || '-' }}</text>
        </view>
        <view v-if="keywordTags.length" class="open-card__row open-card__row--full">
          <text class="open-card__label">关键词：</text>
          <text class="open-card__val open-card__val--kw">{{ keywordTags.join(' ') }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { formatKeywords } from '@/utils/course-display';
import { formatCourseRating } from '@/utils/rating-display';
import { toAssetUrl } from '@/utils/asset';

const props = defineProps({
  course: { type: Object, required: true },
});
const emit = defineEmits(['tap']);

const coverFailed = ref(false);

watch(() => props.course.coverUrl, () => { coverFailed.value = false; });

const coverUrl = computed(() => {
  if (coverFailed.value) return '';
  return toAssetUrl(props.course.coverUrl) || '';
});

const ratingDisplay = computed(() => formatCourseRating(props.course.score));

const durationText = computed(() => {
  const d = props.course.durationDaysDisplay;
  return d != null ? `${d}天` : '-';
});
const keywordTags = computed(() => formatKeywords(props.course.keywords));

function onTap() {
  emit('tap', props.course);
  if (props.course.id) {
    uni.navigateTo({ url: `/pages/course/detail?id=${props.course.id}` });
  }
}
</script>

<style lang="scss" scoped>
.open-card {
  display: flex;
  gap: $tk-sp-3;
  padding: $tk-sp-3;
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  border: 2rpx solid rgba(0, 0, 0, 0.04);
  box-shadow: $tk-shadow-card;

  &__cover {
    width: 160rpx;
    height: 120rpx;
    flex-shrink: 0;
    border-radius: $tk-radius-md;
    overflow: hidden;
    background: #f8fafc;
    border: 2rpx solid #f1f5f9;
  }

  &__cover-img {
    width: 100%;
    height: 100%;
  }

  &__cover-ph {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__head {
    margin-bottom: $tk-sp-2;
  }

  &__title-row {
    display: flex;
    align-items: flex-start;
    gap: 8rpx;
    margin-bottom: 8rpx;
  }

  &__title {
    flex: 1;
    font-size: $tk-fs-md;
    font-weight: 700;
    color: $tk-text-1;
    line-height: $tk-lh-tight;
    @include tk-ellipsis(2);
  }

  &__badge {
    flex-shrink: 0;
    font-size: 20rpx;
    font-weight: 700;
    color: $tk-primary;
    border: 2rpx solid rgba(230, 33, 23, 0.3);
    background: rgba(230, 33, 23, 0.05);
    padding: 2rpx 8rpx;
    border-radius: 4rpx;
  }

  &__stats {
    display: flex;
    flex-wrap: wrap;
    gap: $tk-sp-2;
    align-items: center;
  }

  &__stat {
    font-size: $tk-fs-xs;
    color: $tk-text-4;

    &--muted {
      color: $tk-text-3;
    }
  }

  &__stars {
    display: flex;
    align-items: center;
    gap: 2rpx;
  }

  &__grid {
    display: flex;
    flex-wrap: wrap;
    padding: $tk-sp-2;
    border-radius: $tk-radius-md;
    background: rgba(248, 250, 252, 0.8);
  }

  &__row {
    width: 50%;
    display: flex;
    align-items: flex-start;
    gap: 4rpx;
    box-sizing: border-box;
    padding: 4rpx 8rpx 4rpx 0;

    &--full {
      width: 100%;
    }
  }

  &__label {
    flex-shrink: 0;
    font-size: $tk-fs-xs;
    color: $tk-text-4;
    min-width: 120rpx;
  }

  &__val {
    flex: 1;
    font-size: $tk-fs-xs;
    color: $tk-text-2;
    min-width: 0;

    &--kw {
      @include tk-ellipsis(2);
    }
  }
}
</style>
