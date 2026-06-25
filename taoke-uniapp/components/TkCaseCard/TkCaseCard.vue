<!--
  授课案例卡片 — 对齐 PC CaseCard / 专家详情案例预览
-->
<template>
  <view class="case-card" @tap="onTap">
    <view class="case-card__cover">
      <image
        v-if="cover"
        class="case-card__img"
        :src="cover"
        mode="aspectFill"
      />
      <view v-else class="case-card__ph">
        <text class="case-card__ph-txt">暂无封面</text>
      </view>
    </view>

    <view class="case-card__body">
      <text v-if="caseStudy.tag" class="case-card__tag">{{ caseStudy.tag }}</text>
      <text class="case-card__title">{{ caseStudy.title || caseStudy.caseTitle }}</text>
      <text v-if="description" class="case-card__desc">{{ description }}</text>

      <view class="case-card__foot">
        <view v-if="tags.length" class="case-card__tags">
          <text v-for="t in tags" :key="t" class="case-card__chip">{{ t }}</text>
        </view>
        <view class="case-card__bottom">
          <text v-if="caseStudy.caseDate" class="case-card__date">{{ caseStudy.caseDate }}</text>
          <text class="case-card__more">了解更多</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import { toAssetUrl } from '@/utils/asset';

const props = defineProps({
  caseStudy: { type: Object, required: true },
});
const emit = defineEmits(['tap']);

const cover = computed(() =>
  toAssetUrl(props.caseStudy.image || props.caseStudy.coverImage) || '',
);
const description = computed(() => {
  const d = props.caseStudy.description || '';
  return typeof d === 'string' ? d.replace(/<[^>]+>/g, '').trim() : '';
});
const tags = computed(() => {
  if (Array.isArray(props.caseStudy.tags) && props.caseStudy.tags.length) {
    return props.caseStudy.tags;
  }
  if (props.caseStudy.industry) return [props.caseStudy.industry];
  return [];
});

function onTap() {
  emit('tap', props.caseStudy);
}
</script>

<style lang="scss" scoped>
.case-card {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  overflow: hidden;
  border: 2rpx solid rgba(0, 0, 0, 0.04);
  box-shadow: $tk-shadow-card;
  display: flex;
  flex-direction: column;
  height: 100%;

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
  }

  &__ph-txt {
    font-size: $tk-fs-sm;
    color: $tk-text-4;
  }

  &__body {
    padding: $tk-sp-3;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  &__tag {
    font-size: 20rpx;
    font-weight: 700;
    color: $tk-primary;
    letter-spacing: 2rpx;
    text-transform: uppercase;
  }

  &__title {
    font-size: $tk-fs-md;
    font-weight: 700;
    color: $tk-text-1;
    line-height: $tk-lh-tight;
    @include tk-ellipsis(2);
  }

  &__desc {
    font-size: $tk-fs-sm;
    color: $tk-text-3;
    line-height: $tk-lh-normal;
    @include tk-ellipsis(2);
  }

  &__foot {
    margin-top: auto;
    padding-top: $tk-sp-2;
    border-top: 2rpx solid $tk-divider-light;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8rpx;
    margin-bottom: 8rpx;
  }

  &__chip {
    font-size: 20rpx;
    padding: 4rpx 12rpx;
    background: #f1f5f9;
    color: $tk-text-3;
    border-radius: 4rpx;
  }

  &__bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $tk-sp-2;
  }

  &__date {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }

  &__more {
    flex-shrink: 0;
    font-size: $tk-fs-xs;
    font-weight: 600;
    color: #fff;
    background: $tk-primary;
    padding: 8rpx 24rpx;
    border-radius: $tk-radius-sm;
  }
}
</style>
