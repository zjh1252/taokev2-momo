<!--
  TkFilterBar —— 横向筛选条（picker 选择，兼容选项超过 6 条）
-->
<template>
  <scroll-view scroll-x class="filter-bar" show-scrollbar="false">
    <view class="filter-bar__inner">
      <picker
        v-for="(f, idx) in filters"
        :key="f.key || idx"
        mode="selector"
        :range="getPickerLabels(f)"
        :value="getPickerIndex(f)"
        :disabled="!(f.options || []).length"
        @change="onPickerChange($event, f, idx)"
      >
        <view
          class="filter-bar__item"
          :class="{ 'is-active': isActive(f), 'is-disabled': !(f.options || []).length }"
          @tap="onFilterTap(f)"
        >
          <text class="filter-bar__txt">{{ displayLabel(f) }}</text>
          <TkIcon name="expand-more" :size="22" :color="isActive(f) ? '#E62117' : '#999'" />
        </view>
      </picker>
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

function getPickerLabels(f) {
  return ['全部', ...(f.options || []).map(getOptionLabel)];
}

function getPickerIndex(f) {
  if (!isActive(f)) return 0;
  const idx = (f.options || []).findIndex((o) => getOptionValue(o) === f.value);
  return idx >= 0 ? idx + 1 : 0;
}

function isActive(f) {
  return f.value !== '' && f.value !== undefined && f.value !== null;
}

function displayLabel(f) {
  if (!isActive(f)) return f.label;
  const matched = (f.options || []).find((o) => getOptionValue(o) === f.value);
  const v = matched ? getOptionLabel(matched) : f.value;
  return `${f.label}·${v}`;
}

function onFilterTap(f) {
  if ((f.options || []).length) return;
  uni.showToast({ title: `${f.label}选项加载中`, icon: 'none' });
}

function onPickerChange(e, f, idx) {
  const pickIdx = Number(e.detail.value);
  const newValue = pickIdx === 0 ? '' : getOptionValue(f.options[pickIdx - 1]);
  f.value = newValue;
  const updated = props.filters.map((item, i) => (i === idx ? { ...item, value: newValue } : item));
  emit('update:filters', updated);
  emit('change', { key: f.key, value: newValue });
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

    &.is-disabled {
      opacity: 0.5;
    }
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
