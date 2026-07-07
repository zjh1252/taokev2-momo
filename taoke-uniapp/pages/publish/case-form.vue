<!-- 案例发布/编辑表单 MVP -->
<template>
  <view class="page">
    <TkNavBar :title="caseId ? '编辑案例' : '发布案例'" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <view class="form">
          <view class="field">
            <text class="field__label">案例标题 <text class="req">*</text></text>
            <input class="field__input" :value="form.caseTitle" @input="setField('caseTitle', $event)" />
          </view>
          <view class="field">
            <text class="field__label">企业名称 <text class="req">*</text></text>
            <input class="field__input" :value="form.enterpriseName" @input="setField('enterpriseName', $event)" />
          </view>

          <view class="field">
            <text class="field__label">省份 <text class="req">*</text></text>
            <picker mode="selector" :range="provinces" range-key="name" :value="provinceIndex" @change="onProvinceChange">
              <view class="field__picker">{{ provinces[provinceIndex]?.name || '请选择省份' }}</view>
            </picker>
          </view>
          <view class="field">
            <text class="field__label">城市 <text class="req">*</text></text>
            <picker mode="selector" :range="cities" range-key="name" :value="cityIndex" @change="onCityChange">
              <view class="field__picker">{{ cities[cityIndex]?.name || '请选择城市' }}</view>
            </picker>
          </view>
          <view class="field">
            <text class="field__label">区县 <text class="req">*</text></text>
            <picker mode="selector" :range="districts" range-key="name" :value="districtIndex" @change="onDistrictChange">
              <view class="field__picker">{{ districts[districtIndex]?.name || '请选择区县' }}</view>
            </picker>
          </view>

          <view class="field field--upload">
            <text class="field__label">封面图</text>
            <TkMediaUpload v-model="form.coverImage" label="上传封面" />
          </view>

          <view class="field">
            <text class="field__label">案例描述</text>
            <textarea class="field__textarea" :value="form.description" placeholder="案例详细描述" @input="setField('description', $event)" />
          </view>

          <view class="actions">
            <view class="actions__primary" @tap="handleSubmit">
              <text>{{ submitting ? '提交中…' : '保存' }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getRegionChildren } from '@/api/region';
import {
  getMyCaseDetail,
  createCase,
  updateCase,
} from '@/api/publisher-case';
import { getNavBarHeight } from '@/utils/system';
import { requireLogin } from '@/utils/auth';

const navBarH = getNavBarHeight();
const caseId = ref(null);
const trainerUserId = ref(undefined);
const submitting = ref(false);

const provinces = ref([]);
const cities = ref([]);
const districts = ref([]);

const form = reactive({
  caseTitle: '',
  enterpriseName: '',
  provinceId: null,
  cityId: null,
  districtId: null,
  coverImage: '',
  description: '',
});

const provinceIndex = computed(() => Math.max(0, provinces.value.findIndex((r) => r.id === form.provinceId)));
const cityIndex = computed(() => Math.max(0, cities.value.findIndex((r) => r.id === form.cityId)));
const districtIndex = computed(() => Math.max(0, districts.value.findIndex((r) => r.id === form.districtId)));

onLoad(async (opts) => {
  if (!requireLogin()) return;
  if (opts?.id) caseId.value = Number(opts.id);
  if (opts?.trainerUserId) trainerUserId.value = Number(opts.trainerUserId);
  await loadProvinces();
  if (caseId.value) await loadDetail();
});

async function loadProvinces() {
  provinces.value = await getRegionChildren() || [];
}

async function loadCities(parentCode) {
  cities.value = parentCode ? await getRegionChildren(parentCode) || [] : [];
  districts.value = [];
}

async function loadDistricts(parentCode) {
  districts.value = parentCode ? await getRegionChildren(parentCode) || [] : [];
}

async function loadDetail() {
  const d = await getMyCaseDetail(caseId.value, trainerUserId.value);
  form.caseTitle = d.caseTitle || '';
  form.enterpriseName = d.enterpriseName || '';
  form.provinceId = d.provinceId || null;
  form.cityId = d.cityId || null;
  form.districtId = d.districtId || null;
  form.coverImage = d.coverImage || '';
  form.description = d.description || '';
  const p = provinces.value.find((r) => r.id === form.provinceId);
  if (p?.code) {
    await loadCities(p.code);
    const c = cities.value.find((r) => r.id === form.cityId);
    if (c?.code) await loadDistricts(c.code);
  }
}

function setField(key, e) {
  form[key] = e.detail?.value ?? '';
}

async function onProvinceChange(e) {
  const idx = Number(e.detail.value);
  const p = provinces.value[idx];
  form.provinceId = p?.id || null;
  form.cityId = null;
  form.districtId = null;
  await loadCities(p?.code);
}

async function onCityChange(e) {
  const idx = Number(e.detail.value);
  const c = cities.value[idx];
  form.cityId = c?.id || null;
  form.districtId = null;
  await loadDistricts(c?.code);
}

function onDistrictChange(e) {
  const idx = Number(e.detail.value);
  form.districtId = districts.value[idx]?.id || null;
}

async function handleSubmit() {
  if (submitting.value) return;
  if (!form.caseTitle.trim()) return uni.showToast({ title: '请输入案例标题', icon: 'none' });
  if (!form.enterpriseName.trim()) return uni.showToast({ title: '请输入企业名称', icon: 'none' });
  if (!form.provinceId || !form.cityId || !form.districtId) {
    return uni.showToast({ title: '请选择培训地点', icon: 'none' });
  }
  submitting.value = true;
  try {
    const payload = {
      caseTitle: form.caseTitle.trim(),
      enterpriseName: form.enterpriseName.trim(),
      provinceId: form.provinceId,
      cityId: form.cityId,
      districtId: form.districtId,
      coverImage: form.coverImage || undefined,
      description: form.description.trim() || undefined,
    };
    if (caseId.value) {
      await updateCase(caseId.value, payload, trainerUserId.value);
    } else {
      await createCase(payload, trainerUserId.value);
    }
    uni.showToast({ title: '已保存', icon: 'none' });
    setTimeout(() => uni.navigateBack(), 500);
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: $tk-bg-page; }
.page__scroll { height: 100vh; }
.page__inner { padding: $tk-sp-3; padding-bottom: 60rpx; }
.form { background: $tk-bg-card; border-radius: $tk-radius-lg; padding: $tk-sp-4; box-shadow: $tk-shadow-card; display: flex; flex-direction: column; gap: $tk-sp-3; }
.field {
  &__label { display: block; font-size: $tk-fs-sm; color: $tk-text-3; margin-bottom: 12rpx; }
  &__input, &__picker, &__textarea {
    width: 100%; padding: 20rpx 24rpx; background: $tk-bg-page; border-radius: $tk-radius-md;
    font-size: $tk-fs-md; color: $tk-text-1; box-sizing: border-box;
  }
  &__textarea { min-height: 180rpx; }
}
.req { color: #DC2626; }
.actions__primary { padding: 24rpx 0; background: $tk-primary; border-radius: $tk-radius-md; text-align: center; color: #fff; font-size: $tk-fs-md; font-weight: 700; }
</style>
