<template>
  <view class="stars">
    <view
      v-for="i in 5"
      :key="i"
      class="stars__item"
      @tap="onTap(i)"
    >
      <TkIcon
        name="star"
        :filled="i <= modelValue"
        :size="40"
        :color="i <= modelValue ? '#F59E0B' : '#E5E7EB'"
      />
    </view>
  </view>
</template>

<script setup>
defineProps({
  modelValue: { type: Number, default: 5 },
});
const emit = defineEmits(['update:modelValue']);

function onTap(score) {
  emit('update:modelValue', score);
}
</script>

<style lang="scss" scoped>
.stars {
  display: flex;
  gap: 12rpx;

  &__item {
    padding: 4rpx;
  }
}
</style>
