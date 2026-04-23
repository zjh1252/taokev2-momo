<!--
  TkExpertCard —— 专家卡片
  - variant="grid"：竖向，用于首页"推荐专家"横向滚动
  - variant="row" ：横向（头像+姓名+介绍+评分+标签），用于专家列表

  数据契约（适配后端 TrainerListItemVO / 临时替代字段）：
    {
      id, nickname / name, avatar, title (头衔/简介一句话),
      verified (boolean 信得过), rating (number),
      tags ([string]), viewCount, favCount
    }
-->
<template>
  <view :class="['tk-expert', `tk-expert--${variant}`]" @tap="onTap">
    <!-- 信得过 标 -->
    <view v-if="expert.verified" class="tk-expert__badge">信得过</view>

    <view class="tk-expert__header">
      <image class="tk-expert__avatar" :src="avatarUrl" mode="aspectFill" />
      <view v-if="variant === 'row'" class="tk-expert__head-info">
        <text class="tk-expert__name">{{ expert.nickname || expert.name }}</text>
        <text class="tk-expert__title">{{ expert.title || '资深讲师' }}</text>
      </view>
    </view>

    <template v-if="variant === 'grid'">
      <text class="tk-expert__name">{{ expert.nickname || expert.name }}</text>
      <text class="tk-expert__title">{{ expert.title || '资深讲师' }}</text>
      <view class="tk-expert__rating">
        <TkIcon
          v-for="i in 5"
          :key="i"
          name="star"
          filled
          :size="20"
          :color="i <= Math.round(expert.rating || 5) ? '#F59E0B' : '#E0E3E6'"
        />
      </view>
      <view class="tk-expert__btn">
        <text class="tk-expert__btn-txt">查看主页</text>
      </view>
    </template>

    <template v-else>
      <view class="tk-expert__row-meta">
        <view class="tk-expert__rating">
          <TkIcon
            v-for="i in 5"
            :key="i"
            name="star"
            filled
            :size="20"
            :color="i <= Math.round(expert.rating || 5) ? '#F59E0B' : '#E0E3E6'"
          />
          <text class="tk-expert__rating-txt">{{ (expert.rating || 0).toFixed(1) }}</text>
        </view>
        <view class="tk-expert__row-stats">
          <text class="tk-expert__stat">浏览 {{ expert.viewCount || 0 }}</text>
          <text class="tk-expert__stat">收藏 {{ expert.favCount || 0 }}</text>
        </view>
      </view>
      <view class="tk-expert__tags" v-if="expert.tags && expert.tags.length">
        <text v-for="t in expert.tags.slice(0, 3)" :key="t" class="tk-expert__tag">{{ t }}</text>
      </view>
    </template>
  </view>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  expert:  { type: Object, required: true },
  variant: { type: String, default: 'grid' }, // 'grid' | 'row'
});
const emit = defineEmits(['tap']);

const FALLBACK_AVATAR = '/static/logo.png';
const avatarUrl = computed(() => props.expert.avatar || FALLBACK_AVATAR);

function onTap() {
  emit('tap', props.expert);
  if (props.expert.id) {
    uni.navigateTo({ url: `/pages/expert/detail?id=${props.expert.id}` });
  }
}
</script>

<style lang="scss" scoped>
.tk-expert {
  position: relative;
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-3;
  box-shadow: $tk-shadow-card;

  &__badge {
    position: absolute;
    top: 0;
    right: 0;
    background: $tk-primary-soft;
    color: $tk-primary;
    font-size: 20rpx;
    font-weight: 700;
    padding: 6rpx 14rpx;
    border-radius: 0 $tk-radius-lg 0 $tk-radius-md;
  }

  &__avatar {
    width: 128rpx;
    height: 128rpx;
    border-radius: 50%;
    background: $tk-divider-light;
    box-shadow: $tk-shadow-card;
  }

  &__name {
    font-size: $tk-fs-lg;
    font-weight: 700;
    color: $tk-text-1;
    margin-top: 4rpx;
  }
  &__title {
    font-size: $tk-fs-xs;
    color: $tk-text-2;
    margin-top: 4rpx;
  }

  &__rating {
    display: flex;
    align-items: center;
    gap: 2rpx;
  }
  &__rating-txt {
    font-size: $tk-fs-xs;
    color: $tk-text-2;
    margin-left: 6rpx;
  }

  // grid 变体（首页横滑）
  &--grid {
    width: 280rpx;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8rpx;

    .tk-expert__btn {
      width: 100%;
      margin-top: 12rpx;
      padding: 12rpx 0;
      background: $tk-primary-soft;
      border-radius: $tk-radius-md;
    }
    .tk-expert__btn-txt {
      font-size: $tk-fs-xs;
      color: $tk-primary;
      font-weight: 600;
    }
  }

  // row 变体（列表）
  &--row {
    .tk-expert__header {
      display: flex;
      gap: $tk-sp-3;
      align-items: center;
    }
    .tk-expert__head-info {
      display: flex;
      flex-direction: column;
      gap: 4rpx;
    }
    .tk-expert__row-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: $tk-sp-2;
    }
    .tk-expert__row-stats {
      display: flex;
      gap: $tk-sp-2;
    }
    .tk-expert__stat {
      font-size: $tk-fs-xs;
      color: $tk-text-4;
    }
    .tk-expert__tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8rpx;
      margin-top: $tk-sp-2;
    }
    .tk-expert__tag {
      font-size: $tk-fs-xs;
      padding: 4rpx 12rpx;
      background: $tk-bg-page;
      color: $tk-text-2;
      border-radius: $tk-radius-sm;
    }
  }
}
</style>
