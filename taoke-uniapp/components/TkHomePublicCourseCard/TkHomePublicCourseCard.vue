<!--
  首页线下公开课 — 对齐 PC PublicCourseItem（封面图 + 信息 + 查看详情）
-->
<template>
  <view class="home-course">
    <image
      v-if="course.coverUrl"
      class="home-course__cover"
      :src="coverSrc"
      mode="aspectFill"
    />
    <view class="home-course__main">
      <text class="home-course__title" @tap="onTap">{{ course.title }}</text>
      <view class="home-course__grid">
        <text class="home-course__meta">授课专家：{{ course.instructor || '-' }}</text>
        <text class="home-course__meta">开课城市：{{ course.city || '-' }}</text>
        <text class="home-course__meta">开课时间：{{ course.startDate || '-' }}</text>
        <text class="home-course__meta">课程天数：{{ durationText }}</text>
      </view>
    </view>

    <view class="home-course__action" @tap="onTap">
      <text class="home-course__btn">查看详情</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import { toAssetUrl } from '@/utils/asset';

const props = defineProps({
  course: { type: Object, required: true },
});
const emit = defineEmits(['tap']);

const coverSrc = computed(() => toAssetUrl(props.course.coverUrl));

const durationText = computed(() => {
  const d = props.course.durationDays;
  return d != null ? `${d}天` : '-';
});

function onTap() {
  emit('tap', props.course);
  if (props.course.id) {
    uni.navigateTo({ url: `/pages/course/detail?id=${props.course.id}` });
  }
}
</script>

<style lang="scss" scoped>
.home-course {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: $tk-sp-3;
  padding: $tk-sp-3;
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  border: 2rpx solid rgba(0, 0, 0, 0.04);
  box-shadow: $tk-shadow-card;

  &__cover {
    width: 160rpx;
    height: 120rpx;
    border-radius: $tk-radius-md;
    flex-shrink: 0;
    background: $tk-divider-light;
  }

  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
  }

  &__title {
    font-size: $tk-fs-md;
    font-weight: 700;
    color: $tk-text-1;
    line-height: $tk-lh-tight;
    @include tk-ellipsis(2);
  }

  &__grid {
    display: flex;
    flex-wrap: wrap;
  }

  &__meta {
    width: 50%;
    font-size: $tk-fs-xs;
    color: $tk-text-3;
    line-height: 1.6;
    box-sizing: border-box;
    padding-right: 8rpx;
  }

  &__action {
    flex-shrink: 0;
    align-self: center;
  }

  &__btn {
    display: inline-block;
    padding: 12rpx 24rpx;
    background: $tk-primary;
    color: #fff;
    font-size: $tk-fs-xs;
    font-weight: 700;
    border-radius: $tk-radius-md;
    white-space: nowrap;
  }
}
</style>
