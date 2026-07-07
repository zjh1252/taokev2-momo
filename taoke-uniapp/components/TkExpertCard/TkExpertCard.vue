<!--
  TkExpertCard —— 专家卡片
  - variant="grid"：竖向，用于首页"推荐专家"横向滚动
  - variant="row" ：横向（头像+姓名+介绍+评分+标签），用于专家列表
-->
<template>
  <view :class="['tk-expert', `tk-expert--${variant}`]" @tap="onTap">
    <view v-if="expert.verified" class="tk-expert__badge">信得过</view>

    <view class="tk-expert__header">
      <image class="tk-expert__avatar" :src="avatarUrl" mode="aspectFill" @error="onAvatarError" />
      <view v-if="variant === 'row'" class="tk-expert__head-info">
        <text class="tk-expert__name">{{ expert.nickname || expert.name }}</text>
        <text class="tk-expert__title">{{ expert.title || '资深专家' }}</text>
      </view>
    </view>

    <template v-if="variant === 'grid'">
      <text class="tk-expert__name">{{ expert.nickname || expert.name }}</text>
      <text class="tk-expert__title">{{ expert.title || '资深专家' }}</text>
      <view class="tk-expert__rating">
        <template v-if="ratingDisplay.showStars">
          <TkIcon
            v-for="i in 5"
            :key="i"
            name="star"
            filled
            :size="20"
            :color="i <= ratingDisplay.starCount ? '#F59E0B' : '#E0E3E6'"
          />
        </template>
        <text v-else class="tk-expert__rating-label">{{ ratingDisplay.label }}</text>
      </view>
      <view class="tk-expert__btn">
        <text class="tk-expert__btn-txt">查看主页</text>
      </view>
    </template>

    <template v-else>
      <view class="tk-expert__row-meta">
        <view class="tk-expert__rating">
          <template v-if="ratingDisplay.showStars">
            <TkIcon
              v-for="i in 5"
              :key="i"
              name="star"
              filled
              :size="20"
              :color="i <= ratingDisplay.starCount ? '#F59E0B' : '#E0E3E6'"
            />
            <text class="tk-expert__rating-txt">{{ ratingDisplay.label }}</text>
          </template>
          <text v-else class="tk-expert__rating-label">{{ ratingDisplay.label }}</text>
        </view>
        <view class="tk-expert__row-stats">
          <text class="tk-expert__stat">浏览 {{ expert.viewCount || 0 }}</text>
          <text class="tk-expert__stat">收藏 {{ expert.favCount || 0 }}</text>
        </view>
      </view>
      <view v-if="expert.tags && expert.tags.length" class="tk-expert__tags">
        <text v-for="t in expert.tags.slice(0, 3)" :key="t" class="tk-expert__tag">{{ t }}</text>
      </view>
    </template>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { toAssetUrl } from '@/utils/asset';
import { formatExpertRating } from '@/utils/rating-display';

const props = defineProps({
  expert:  { type: Object, required: true },
  variant: { type: String, default: 'grid' },
});
const emit = defineEmits(['tap']);

const FALLBACK_AVATAR = '/static/logo.png';
const avatarFailed = ref(false);

watch(() => props.expert.avatar, () => { avatarFailed.value = false; });

const avatarUrl = computed(() => {
  if (avatarFailed.value) return FALLBACK_AVATAR;
  return toAssetUrl(props.expert.avatar) || FALLBACK_AVATAR;
});

const ratingDisplay = computed(() =>
  formatExpertRating(props.expert.rating ?? props.expert.score),
);

function onAvatarError() {
  avatarFailed.value = true;
}

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
  &__rating-label {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }

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
