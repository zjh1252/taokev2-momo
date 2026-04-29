<!--
  TkAvatar —— 圆形头像
  - src 优先；失败 / 为空时回落显示 nickname 首字母（中文取首汉字、英文/数字取首字大写）
  - size 默认 80rpx；可传 number/string，自动 rpx 单位
  - bordered 可选边框（用于头像被覆盖在背景图上时的对比）
-->
<template>
  <view
    class="avatar"
    :class="{ 'is-bordered': bordered }"
    :style="{
      width: sizeRpx,
      height: sizeRpx,
      backgroundColor: hasImage ? 'transparent' : fallbackBg,
    }"
    @tap="onTap"
  >
    <image
      v-if="hasImage"
      class="avatar__img"
      :src="src"
      mode="aspectFill"
      @error="onError"
    />
    <text v-else class="avatar__txt" :style="{ fontSize: txtSize }">
      {{ initials }}
    </text>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  src:       { type: String, default: '' },
  nickname:  { type: String, default: '' },
  size:      { type: [Number, String], default: 80 },
  bordered:  { type: Boolean, default: false },
  fallbackBg: { type: String, default: '#FCE8E6' }, // primary-soft
});

const emit = defineEmits(['tap']);

const failed = ref(false);

watch(() => props.src, () => { failed.value = false; });

const hasImage = computed(() => !!props.src && !failed.value);

const sizeRpx = computed(() => {
  const n = Number(props.size);
  return Number.isFinite(n) ? `${n}rpx` : String(props.size);
});

const txtSize = computed(() => {
  const n = Number(props.size);
  return Number.isFinite(n) ? `${Math.round(n * 0.42)}rpx` : '32rpx';
});

const initials = computed(() => {
  const name = (props.nickname || '').trim();
  if (!name) return 'U';
  const ch = name.charAt(0);
  // 中文/全角直接取一个字；英文/数字大写
  if (/[\u4E00-\u9FA5]/.test(ch)) return ch;
  return ch.toUpperCase();
});

function onError() {
  failed.value = true;
}
function onTap(e) {
  emit('tap', e);
}
</script>

<style lang="scss" scoped>
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;

  &.is-bordered {
    border: 4rpx solid #fff;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.10);
  }

  &__img {
    width: 100%;
    height: 100%;
  }

  &__txt {
    color: $tk-primary;
    font-weight: 700;
    line-height: 1;
  }
}
</style>
