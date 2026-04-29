<!--
  TkCourseCard —— 课程列表项卡
  - 横向布局：左缩略图 + 右标题/日期/地点/专家/价格
  - 用于：首页推荐课程、公开课列表

  数据契约（兼容 CourseListItemVO）：
    {
      id, title, coverUrl,
      startDate (string),
      city (string),
      trainerName (string),
      price (number)
    }
-->
<template>
  <view class="tk-course-card" @tap="onTap">
    <image class="tk-course-card__img" :src="cover" mode="aspectFill" />
    <view class="tk-course-card__body">
      <view class="tk-course-card__top">
        <text class="tk-course-card__title">{{ course.title }}</text>
        <view class="tk-course-card__meta">
          <view class="tk-course-card__meta-item" v-if="course.startDate">
            <TkIcon name="calendar" :size="22" color="#999" />
            <text class="tk-course-card__meta-txt">{{ course.startDate }}</text>
          </view>
          <view class="tk-course-card__meta-item" v-if="course.city">
            <TkIcon name="location" :size="22" color="#999" />
            <text class="tk-course-card__meta-txt">{{ course.city }}</text>
          </view>
        </view>
      </view>
      <view class="tk-course-card__bottom">
        <text class="tk-course-card__trainer" v-if="course.trainerName">专家：{{ course.trainerName }}</text>
        <text class="tk-course-card__price">¥ {{ formatPrice(course.price) }}</text>
      </view>
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

const FALLBACK_COVER = '/static/logo.png';
const cover = computed(() => toAssetUrl(props.course.coverUrl || props.course.cover) || FALLBACK_COVER);

function formatPrice(p) {
  if (p == null || p === '') return '面议';
  const n = Number(p);
  if (!Number.isFinite(n)) return p;
  return n.toLocaleString('zh-CN');
}

function onTap() {
  emit('tap', props.course);
  if (props.course.id) {
    uni.navigateTo({ url: `/pages/course/detail?id=${props.course.id}` });
  }
}
</script>

<style lang="scss" scoped>
.tk-course-card {
  display: flex;
  gap: $tk-sp-3;
  padding: $tk-sp-3;
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  box-shadow: $tk-shadow-card;

  &__img {
    width: 192rpx;
    height: 192rpx;
    flex-shrink: 0;
    border-radius: $tk-radius-md;
    background: $tk-divider-light;
  }

  &__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 4rpx 0;
  }

  &__title {
    font-size: $tk-fs-md;
    font-weight: 700;
    color: $tk-text-1;
    line-height: $tk-lh-tight;
    @include tk-ellipsis(2);
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: $tk-sp-2;
    margin-top: 8rpx;
  }
  &__meta-item {
    display: flex;
    align-items: center;
    gap: 4rpx;
  }
  &__meta-txt {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }

  &__bottom {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  &__trainer {
    font-size: $tk-fs-xs;
    color: $tk-text-2;
  }
  &__price {
    font-size: $tk-fs-lg;
    font-weight: 700;
    color: $tk-primary;
  }
}
</style>
