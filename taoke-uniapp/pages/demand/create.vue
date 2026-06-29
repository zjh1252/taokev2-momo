<!-- 发布定制需求 — 对齐 PC CreateDemandForm -->
<template>
  <view class="page">
    <TkNavBar title="发布定制需求" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <view v-if="trainerName" class="hint">
          <text class="hint__txt">意向专家：{{ trainerName }}</text>
        </view>

        <view class="form">
          <view class="field">
            <text class="field__label">培训主题 <text class="req">*</text></text>
            <input
              class="field__input"
              :value="form.trainingTopic"
              placeholder="如：销售技巧提升培训"
              @input="setField('trainingTopic', $event)"
            />
          </view>

          <view class="field">
            <text class="field__label">需求标题</text>
            <input
              class="field__input"
              :value="form.title"
              placeholder="给需求起个标题（选填）"
              @input="setField('title', $event)"
            />
          </view>

          <view class="field">
            <text class="field__label">联系人</text>
            <input
              class="field__input"
              :value="form.contactName"
              placeholder="请输入联系人姓名"
              @input="setField('contactName', $event)"
            />
          </view>

          <view class="field">
            <text class="field__label">联系电话</text>
            <input
              class="field__input"
              type="number"
              :value="form.contactPhone"
              placeholder="请输入联系电话"
              @input="setField('contactPhone', $event)"
            />
          </view>

          <view class="field">
            <text class="field__label">培训人数</text>
            <input
              class="field__input"
              type="number"
              :value="form.traineeCount"
              placeholder="预计参训人数"
              @input="setNum('traineeCount', $event)"
            />
          </view>

          <view class="field">
            <text class="field__label">预算范围（元）</text>
            <view class="field__row">
              <input
                class="field__input field__input--half"
                type="digit"
                :value="form.budgetMin"
                placeholder="最低"
                @input="setNum('budgetMin', $event)"
              />
              <text class="field__sep">—</text>
              <input
                class="field__input field__input--half"
                type="digit"
                :value="form.budgetMax"
                placeholder="最高"
                @input="setNum('budgetMax', $event)"
              />
            </view>
            <text class="field__hint">留空表示面议</text>
          </view>

          <view class="field">
            <text class="field__label">期望开始时间</text>
            <picker mode="date" :value="form.expectedStartDate || ''" @change="onDateChange">
              <view class="field__picker">{{ form.expectedStartDate || '请选择日期' }}</view>
            </picker>
          </view>

          <view class="field">
            <text class="field__label">培训形式</text>
            <radio-group class="radio-group" @change="onFormatChange">
              <label v-for="opt in formatOptions" :key="opt.value" class="radio-row">
                <radio
                  :value="opt.value"
                  :checked="form.format === opt.value"
                  color="#E62117"
                />
                <text>{{ opt.label }}</text>
              </label>
            </radio-group>
          </view>

          <view v-if="showRegion" class="field">
            <text class="field__label">培训省份</text>
            <picker
              mode="selector"
              :range="provinces"
              range-key="name"
              :value="provinceIndex"
              @change="onProvinceChange"
            >
              <view class="field__picker">{{ provinces[provinceIndex]?.name || '请选择省份' }}</view>
            </picker>
          </view>

          <view class="field">
            <text class="field__label">需求描述</text>
            <textarea
              class="field__textarea"
              :value="form.description"
              placeholder="请描述培训目标、对象、特殊要求等"
              @input="setField('description', $event)"
            />
          </view>

          <view class="actions">
            <view class="actions__primary" :class="{ 'is-disabled': submitting }" @tap="handleSubmit">
              <text>{{ submitting ? '提交中…' : '提交需求' }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import * as demandApi from '@/api/demand';
import * as regionApi from '@/api/region';
import { useUserStore } from '@/stores/user';
import { getNavBarHeight } from '@/utils/system';
import { requireLogin } from '@/utils/auth';

const navBarH = getNavBarHeight();
const userStore = useUserStore();

const trainerName = ref('');
const submitting = ref(false);
const provinces = ref([]);
const provinceIndex = ref(0);

const formatOptions = [
  { value: 'ONLINE', label: '线上' },
  { value: 'OFFLINE', label: '线下' },
  { value: 'HYBRID', label: '混合' },
];

const form = reactive({
  demandType: 'DEFAULT',
  title: '',
  trainingTopic: '',
  traineeCount: '',
  budgetMin: '',
  budgetMax: '',
  expectedStartDate: '',
  format: '',
  description: '',
  contactName: '',
  contactPhone: '',
  provinceId: undefined,
});

const showRegion = computed(() => form.format === 'OFFLINE' || form.format === 'HYBRID');

onLoad((opt) => {
  if (!requireLogin()) return;
  trainerName.value = opt?.trainerName ? decodeURIComponent(opt.trainerName) : '';
  if (userStore.profile?.phone) {
    form.contactPhone = userStore.profile.phone;
  }
  if (userStore.profile?.nickname || userStore.profile?.realName) {
    form.contactName = userStore.profile.nickname || userStore.profile.realName;
  }
});

onMounted(async () => {
  try {
    provinces.value = await regionApi.getRegionChildren();
  } catch (_) {
    provinces.value = [];
  }
});

function setField(key, e) {
  form[key] = e.detail?.value ?? '';
}

function setNum(key, e) {
  const v = e.detail?.value ?? '';
  form[key] = v === '' ? '' : Number(v);
}

function onDateChange(e) {
  form.expectedStartDate = e.detail.value;
}

function onFormatChange(e) {
  form.format = e.detail.value;
  if (e.detail.value === 'ONLINE') {
    form.provinceId = undefined;
    provinceIndex.value = 0;
  }
}

function onProvinceChange(e) {
  provinceIndex.value = Number(e.detail.value);
  const p = provinces.value[provinceIndex.value];
  form.provinceId = p?.id;
}

async function handleSubmit() {
  if (submitting.value) return;
  if (!form.trainingTopic?.trim() && !form.title?.trim()) {
    uni.showToast({ title: '请填写培训主题或需求标题', icon: 'none' });
    return;
  }

  submitting.value = true;
  try {
    let description = form.description?.trim() || '';
    if (trainerName.value) {
      const prefix = `意向专家：${trainerName.value}`;
      description = description ? `${prefix}\n${description}` : prefix;
    }

    const payload = {
      demandType: form.demandType,
      title: form.title?.trim() || undefined,
      trainingTopic: form.trainingTopic?.trim() || undefined,
      traineeCount: form.traineeCount ? Number(form.traineeCount) : undefined,
      budgetMin: form.budgetMin !== '' ? Number(form.budgetMin) : undefined,
      budgetMax: form.budgetMax !== '' ? Number(form.budgetMax) : undefined,
      expectedStartDate: form.expectedStartDate || undefined,
      format: form.format || undefined,
      description: description || undefined,
      contactName: form.contactName?.trim() || undefined,
      contactPhone: form.contactPhone?.trim() || undefined,
      provinceId: showRegion.value ? form.provinceId : undefined,
    };

    await demandApi.createDemand(payload);
    uni.showToast({ title: '需求已提交', icon: 'success' });
    setTimeout(() => {
      uni.redirectTo({ url: '/pages/demand/list' });
    }, 800);
  } catch (e) {
    uni.showToast({ title: e?.message || '提交失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: $tk-bg-page;
}
.page__scroll {
  height: 100vh;
  box-sizing: border-box;
}
.page__inner {
  padding: $tk-sp-3;
}

.hint {
  margin-bottom: $tk-sp-3;
  padding: $tk-sp-2 $tk-sp-3;
  background: $tk-primary-soft;
  border-radius: $tk-radius-md;

  &__txt {
    font-size: $tk-fs-sm;
    color: $tk-primary;
  }
}

.form {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-3;
  box-shadow: $tk-shadow-card;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-3;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8rpx;

  &__label {
    font-size: $tk-fs-sm;
    color: $tk-text-2;
    font-weight: 600;
  }
  &__input {
    padding: 20rpx 24rpx;
    background: $tk-bg-page;
    border-radius: $tk-radius-md;
    font-size: $tk-fs-md;
    color: $tk-text-1;

    &--half {
      flex: 1;
    }
  }
  &__row {
    display: flex;
    align-items: center;
    gap: $tk-sp-2;
  }
  &__sep {
    color: $tk-text-4;
  }
  &__picker {
    padding: 20rpx 24rpx;
    background: $tk-bg-page;
    border-radius: $tk-radius-md;
    font-size: $tk-fs-md;
    color: $tk-text-1;
  }
  &__textarea {
    min-height: 180rpx;
    padding: 20rpx 24rpx;
    background: $tk-bg-page;
    border-radius: $tk-radius-md;
    font-size: $tk-fs-md;
    color: $tk-text-1;
  }
  &__hint {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }
}

.req {
  color: $tk-primary;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: $tk-sp-3;
}
.radio-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: $tk-fs-sm;
  color: $tk-text-2;
}

.actions {
  margin-top: $tk-sp-2;

  &__primary {
    padding: 24rpx;
    border-radius: $tk-radius-full;
    background: $tk-primary;
    box-shadow: $tk-shadow-primary;
    text-align: center;
    color: #fff;
    font-size: $tk-fs-md;
    font-weight: 700;

    &.is-disabled {
      opacity: 0.6;
    }
  }
}
</style>
