<!--
  TkIcon —— 全局图标封装
  - 底层基于 uni-ui 自带的 uni-icons（覆盖 100+ 常用图标）
  - 业务页面只能通过本组件使用图标，禁止直接写 material-symbols-outlined / unicode
  - name 维护语义化别名 → uni-icons type 的映射，方便后续替换底层图标库（如换 iconfont）

  用法：
    <TkIcon name="search" :size="32" color="#666" />
    <TkIcon name="star" filled />
-->
<template>
  <view class="tk-icon" :class="customClass" @tap="$emit('tap', $event)">
    <uni-icons :type="resolvedType" :size="resolvedSize" :color="color" />
  </view>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  name:    { type: String, required: true },
  size:    { type: [Number, String], default: 36 }, // 单位 rpx
  color:   { type: String, default: '#1B1C1C' },
  filled:  { type: Boolean, default: false },
  customClass: { type: String, default: '' },
});

defineEmits(['tap']);

// 语义名 → uni-icons type 映射表
// 不在映射表中的 name 直接透传，方便逐步扩展
const NAME_MAP = {
  // 通用
  menu: 'bars',
  more: 'more-filled',
  close: 'close',
  search: 'search',
  scan: 'scan',
  refresh: 'refresh',
  back: 'back',
  forward: 'forward',
  // 方向
  'arrow-right': 'right',
  'arrow-left':  'left',
  'arrow-up':    'up',
  'arrow-down':  'down',
  'expand-more': 'down',
  'chevron-right': 'right',
  // tab 区
  home:    'home',
  expert:  'staff',         // 专家
  course:  'medal',         // 公开课
  person:  'person',
  user:    'person',
  // 业务
  star:        'star',
  'star-half': 'starhalf',
  calendar:    'calendar',
  location:    'location',
  campaign:    'notification', // 喇叭/通知
  heart:       'heart',
  chat:        'chat',
  phone:       'phone',
  email:       'email',
  notification:'notification',
  cart:        'cart',
  shop:        'shop',
  list:        'list',
  gear:        'gear',
  vip:         'vip',
  fire:        'fire',
  gift:        'gift',
  eye:         'eye',
  lock:        'locked',
  info:        'info',
  help:        'help',
  upload:      'upload',
  download:    'download',
  image:       'image',
  camera:      'camera',
  videocam:    'videocam',
};

const resolvedType = computed(() => {
  const base = NAME_MAP[props.name] || props.name;
  // 部分图标支持 filled 变体
  if (props.filled) {
    const candidate = `${base}-filled`;
    return candidate;
  }
  return base;
});

// uni-icons 的 size 单位是 px；我们暴露 rpx 设计稿尺寸，按 750/2 折算（设计基准 375）
// 设计稿 rpx → px：rpx / 2
const resolvedSize = computed(() => {
  const s = Number(props.size);
  if (!Number.isFinite(s)) return 18;
  return Math.round(s / 2);
});
</script>

<style lang="scss" scoped>
.tk-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
</style>
