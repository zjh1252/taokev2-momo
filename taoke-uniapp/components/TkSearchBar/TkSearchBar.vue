<!--
  TkSearchBar —— 胶囊搜索框
  - 左侧分类下拉（"讲师"/"公开课" 等）
  - 中间输入框
  - 右侧圆形搜索按钮

  用法：
    <TkSearchBar
      v-model="kw"
      :categories="['讲师','公开课']"
      v-model:category="cat"
      placeholder="搜索感兴趣的内容"
      @search="onSearch"
    />
-->
<template>
  <view class="tk-search">
    <view class="tk-search__cat" v-if="categories.length" @tap="togglePicker">
      <text class="tk-search__cat-txt">{{ category || categories[0] }}</text>
      <TkIcon name="expand-more" :size="24" color="#666" />
    </view>
    <view v-if="categories.length" class="tk-search__sep" />
    <input
      class="tk-search__input"
      :value="modelValue"
      :placeholder="placeholder"
      placeholder-style="color:#999"
      confirm-type="search"
      @input="onInput"
      @confirm="onConfirm"
    />
    <view class="tk-search__btn" @tap="onConfirm">
      <TkIcon name="search" :size="36" color="#fff" />
    </view>

    <!-- 简易分类 picker（封装 uni-data-picker 太重，直接 actionSheet） -->
  </view>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: String, default: '' },
  category:   { type: String, default: '' },
  categories: { type: Array, default: () => [] },
  placeholder:{ type: String, default: '搜索感兴趣的内容' },
});

const emit = defineEmits(['update:modelValue', 'update:category', 'search']);

function onInput(e) {
  emit('update:modelValue', e.detail.value);
}

function onConfirm() {
  emit('search', props.modelValue);
}

function togglePicker() {
  if (!props.categories.length) return;
  uni.showActionSheet({
    itemList: props.categories,
    success: (res) => {
      const picked = props.categories[res.tapIndex];
      emit('update:category', picked);
    },
  });
}
</script>

<style lang="scss" scoped>
.tk-search {
  display: flex;
  align-items: center;
  height: 80rpx;
  background: $tk-bg-card;
  border-radius: $tk-radius-full;
  padding: 8rpx 8rpx 8rpx 24rpx;
  box-shadow: $tk-shadow-card;

  &__cat {
    display: flex;
    align-items: center;
    gap: 4rpx;
    padding: 0 8rpx;
  }
  &__cat-txt {
    font-size: $tk-fs-md;
    color: $tk-text-2;
    font-weight: 500;
  }

  &__sep {
    width: 2rpx;
    height: 28rpx;
    background: $tk-divider;
    margin: 0 12rpx;
  }

  &__input {
    flex: 1;
    min-width: 0;
    height: 100%;
    font-size: $tk-fs-md;
    color: $tk-text-1;
    background: transparent;
    padding: 0 16rpx;
  }

  &__btn {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    background: $tk-primary;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: $tk-shadow-primary;
  }
}
</style>
