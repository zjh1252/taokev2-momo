<!--
  TkActionBtn —— TkActionBar 内的单个操作按钮
  - type='ghost'（默认）：纵向 icon + 文案，固定 120rpx 宽，作为副操作
  - type='primary'：横向纯文字，flex:1，渐变红主操作
  - type='secondary'：横向纯文字，flex:1，灰底，次主操作
-->
<template>
  <view
    class="btn"
    :class="['btn--' + type, { 'is-disabled': disabled }]"
    @tap="onTap"
  >
    <TkIcon
      v-if="icon && type === 'ghost'"
      :name="icon"
      :filled="iconFilled"
      :size="iconSize"
      :color="iconColor"
    />
    <text class="btn__txt" :class="'btn__txt--' + type">{{ label }}</text>
  </view>
</template>

<script setup>
const props = defineProps({
  icon:       { type: String, default: '' },
  iconColor:  { type: String, default: '#666' },
  iconSize:   { type: [Number, String], default: 32 },
  iconFilled: { type: Boolean, default: false },
  label:      { type: String, required: true },
  /** 'ghost' | 'primary' | 'secondary' */
  type:       { type: String, default: 'ghost' },
  disabled:   { type: Boolean, default: false },
});

const emit = defineEmits(['tap']);

function onTap(e) {
  if (props.disabled) return;
  emit('tap', e);
}
</script>

<style lang="scss" scoped>
.btn {
  height: 80rpx;
  border-radius: $tk-radius-md;
  display: flex;
  align-items: center;
  justify-content: center;

  &--ghost {
    flex-direction: column;
    gap: 0;
    flex: 0 0 auto;
    width: 120rpx;
    background: transparent;
  }

  &--primary {
    flex: 1;
    background: linear-gradient(135deg, $tk-primary 0%, #FF8C00 100%);
    box-shadow: $tk-shadow-primary;
  }

  &--secondary {
    flex: 1;
    background: $tk-bg-page;
  }

  &.is-disabled {
    opacity: 0.5;
    box-shadow: none;
  }
}

.btn__txt {
  font-weight: 500;

  &--ghost {
    font-size: $tk-fs-xs;
    color: $tk-text-2;
    margin-top: 2rpx;
  }
  &--primary {
    font-size: $tk-fs-md;
    color: #fff;
    font-weight: 700;
  }
  &--secondary {
    font-size: $tk-fs-md;
    color: $tk-text-1;
    font-weight: 600;
  }
}
</style>
