<!-- 代管发布时选择专家（对齐 PC TrainerSwitcher） -->
<template>
  <view v-if="visible" class="picker">
    <text class="picker__label">{{ label }}</text>
    <picker
      mode="selector"
      :range="options"
      range-key="label"
      :value="selectedIndex"
      @change="onChange"
    >
      <view class="picker__value">
        <text class="picker__value-txt">{{ currentLabel }}</text>
        <TkIcon name="expand-more" :size="24" color="#999" />
      </view>
    </picker>
  </view>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { listManagedTrainers } from '@/api/binding';
import { isDelegatingRole, selfPublishingAllowed } from '@/utils/delegating-role';

const props = defineProps({
  activeRole: { type: String, default: 'BUYER' },
  modelValue: { type: Number, default: undefined },
  label: { type: String, default: '为谁发布' },
});

const emit = defineEmits(['update:modelValue']);

const trainers = ref([]);
const loading = ref(false);

const visible = computed(() => isDelegatingRole(props.activeRole));

const options = computed(() => {
  const list = [];
  if (selfPublishingAllowed(props.activeRole)) {
    list.push({ label: '我自己', value: undefined });
  }
  trainers.value.forEach((t) => {
    const name = t.counterpartNickname || t.counterpartRealName || t.counterpartPhone || `用户${t.counterpartUserId}`;
    list.push({ label: name, value: t.counterpartUserId });
  });
  return list;
});

const selectedIndex = computed(() => {
  const idx = options.value.findIndex((o) => o.value === props.modelValue);
  return idx >= 0 ? idx : 0;
});

const currentLabel = computed(() => options.value[selectedIndex.value]?.label || '请选择');

async function loadTrainers() {
  if (!visible.value) return;
  loading.value = true;
  try {
    const list = await listManagedTrainers();
    trainers.value = (list || []).filter((t) => t.status === 1);
  } catch (_) {
    trainers.value = [];
  } finally {
    loading.value = false;
  }
}

function onChange(e) {
  const idx = Number(e.detail.value);
  const opt = options.value[idx];
  emit('update:modelValue', opt?.value);
}

onMounted(loadTrainers);
watch(() => props.activeRole, loadTrainers);
</script>

<style lang="scss" scoped>
.picker {
  background: $tk-bg-card;
  border-radius: $tk-radius-md;
  padding: $tk-sp-3;
  display: flex;
  flex-direction: column;
  gap: 12rpx;

  &__label {
    font-size: $tk-fs-sm;
    color: $tk-text-3;
  }

  &__value {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16rpx 20rpx;
    background: $tk-bg-page;
    border-radius: $tk-radius-md;
  }

  &__value-txt {
    font-size: $tk-fs-md;
    color: $tk-text-1;
    flex: 1;
    @include tk-ellipsis-1;
  }
}
</style>
