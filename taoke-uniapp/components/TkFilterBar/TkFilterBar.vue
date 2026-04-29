<!--
  TkFilterBar —— 横向滚动多维筛选条
  使用：
    <TkFilterBar v-model:filters="filters" @change="loadList(true)" />
  filters 数组每项形如：
    { key: 'expertiseCategoryId', label: '类别', value: '', options: ['领导力', '战略管理'] }
  其中 options 也可以是 [{ label, value }] 形式（label 显示，value 提交给后端）。
  点击某维度时弹出 ActionSheet 选择，"全部" 清空当前维度。
-->
<template>
  <scroll-view scroll-x class="filter-bar" show-scrollbar="false">
    <view class="filter-bar__inner">
      <view
        v-for="(f, idx) in filters"
        :key="f.key || idx"
        class="filter-bar__item"
        :class="{ 'is-active': isActive(f) }"
        @tap="openFilter(f, idx)"
      >
        <text class="filter-bar__txt">{{ displayLabel(f) }}</text>
        <TkIcon name="expand-more" :size="22" :color="isActive(f) ? '#E62117' : '#999'" />
      </view>
    </view>
  </scroll-view>
</template>

<script setup>
const props = defineProps({
  filters: { type: Array, required: true },
});
const emit = defineEmits(['update:filters', 'change']);

function getOptionLabel(opt) {
  return typeof opt === 'string' ? opt : opt?.label ?? '';
}
function getOptionValue(opt) {
  return typeof opt === 'string' ? opt : opt?.value ?? opt?.label ?? '';
}

function isActive(f) {
  return f.value !== '' && f.value !== undefined && f.value !== null;
}

function displayLabel(f) {
  if (!isActive(f)) return f.label;
  // 如果 options 是 { label, value }，反查出 label
  const matched = (f.options || []).find((o) => getOptionValue(o) === f.value);
  const v = matched ? getOptionLabel(matched) : f.value;
  return `${f.label}·${v}`;
}

function openFilter(f, idx) {
  const items = ['全部', ...(f.options || []).map(getOptionLabel)];
  uni.showActionSheet({
    itemList: items,
    success: (res) => {
      const newValue = res.tapIndex === 0
        ? ''
        : getOptionValue(f.options[res.tapIndex - 1]);
      // 直接修改原数组的项（filters 通常用 reactive，便于父组件双向绑定）
      const updated = props.filters.map((item, i) => (i === idx ? { ...item, value: newValue } : item));
      emit('update:filters', updated);
      // 同时 mutate 当前项以兼容 reactive 数组直接传入的写法
      f.value = newValue;
      emit('change', { key: f.key, value: newValue, filter: f });
    },
  });
}
</script>

<style lang="scss" scoped>
.filter-bar {
  width: 100%;
  background: $tk-bg-card;
  border-radius: $tk-radius-md;
  padding: $tk-sp-2 0;
  box-shadow: $tk-shadow-card;

  &__inner {
    display: inline-flex;
    align-items: center;
    gap: $tk-sp-3;
    padding: 0 $tk-sp-3;
  }

  &__item {
    display: inline-flex;
    align-items: center;
    gap: 4rpx;
    flex-shrink: 0;
    padding: 8rpx 0;
  }
  &__txt {
    font-size: $tk-fs-sm;
    color: $tk-text-1;
    font-weight: 500;
    white-space: nowrap;
  }
  &__item.is-active &__txt {
    color: $tk-primary;
    font-weight: 600;
  }
}
</style>
