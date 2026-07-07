<!-- 培训机构公司资料 -->
<template>
  <view class="page">
    <TkNavBar title="公司资料" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <TkLoading v-if="loading" />

        <view v-else class="form">
          <text class="desc">完善机构公司资料以获得平台合作资质。修改并保存后将重新进入审核。</text>

          <view class="field field--upload">
            <text class="field__label">公司 Logo <text class="req">*</text></text>
            <TkMediaUpload v-model="form.logoUrl" label="公司 Logo" />
          </view>

          <view class="field">
            <text class="field__label">公司性质 <text class="req">*</text></text>
            <picker mode="selector" :range="companyNatureOptions" :value="natureIndex" @change="onNatureChange">
              <view class="field__picker">{{ form.companyNature || '请选择' }}</view>
            </picker>
          </view>

          <view class="field">
            <text class="field__label">机构规模 <text class="req">*</text></text>
            <picker mode="selector" :range="companySizeOptions" :value="sizeIndex" @change="onSizeChange">
              <view class="field__picker">{{ form.companySize || '请选择' }}</view>
            </picker>
          </view>

          <view class="field">
            <text class="field__label">年营业额 <text class="req">*</text></text>
            <input class="field__input" :value="form.annualRevenue" placeholder="如 1000万" @input="setField('annualRevenue', $event)" />
          </view>
          <view class="field">
            <text class="field__label">注册资本 <text class="req">*</text></text>
            <input class="field__input" :value="form.registeredCapital" placeholder="如 500万" @input="setField('registeredCapital', $event)" />
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
          <view class="field">
            <text class="field__label">详细地址 <text class="req">*</text></text>
            <input class="field__input" :value="form.address" @input="setField('address', $event)" />
          </view>

          <view class="field">
            <text class="field__label">公开课最高佣金比例（%） <text class="req">*</text></text>
            <input class="field__input" type="digit" :value="form.maxCommissionRate" @input="setField('maxCommissionRate', $event)" />
          </view>

          <view class="field">
            <text class="field__label">可接受付款方式</text>
            <view class="checks">
              <view
                v-for="m in paymentMethodOptions"
                :key="m"
                class="check"
                :class="{ 'check--on': form.paymentMethods.includes(m) }"
                @tap="togglePayment(m)"
              >
                <text>{{ m }}</text>
              </view>
            </view>
          </view>

          <view class="field field--upload">
            <text class="field__label">营业执照附件 <text class="req">*</text></text>
            <TkCertFileUpload v-model="form.licenseDocUrl" label="营业执照" />
          </view>
          <view class="field">
            <text class="field__label">营业执照号</text>
            <input class="field__input" :value="form.licenseNo" placeholder="15位或18位统一社会信用代码" @input="setField('licenseNo', $event)" />
          </view>

          <view class="progress-wrap">
            <text class="progress-wrap__title">审核进度</text>
            <TkCertProgress
              :status="certData?.status ?? null"
              :submitted-at="certData?.submittedAt"
              :audited-at="certData?.auditedAt"
              :reject-reason="certData?.rejectReason"
              label="公司资料"
            />
          </view>

          <view class="actions">
            <view class="actions__primary" @tap="handleSubmit">
              <text>{{ submitting ? '提交中…' : '提交审核' }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getInstitutionCompanyInfo, submitInstitutionCompanyInfo } from '@/api/role-cert';
import { getRegionChildren } from '@/api/region';
import { getNavBarHeight } from '@/utils/system';
import { requireLogin } from '@/utils/auth';

const navBarH = getNavBarHeight();
const loading = ref(true);
const submitting = ref(false);
const certData = ref(null);

const companyNatureOptions = ['国企', '民营', '外资', '合资', '事业单位', '其他'];
const companySizeOptions = ['1-10人', '10-50人', '50-100人', '100-500人', '500-1000人', '1000人以上'];
const paymentMethodOptions = ['对公转账', '支付宝', '微信', '现金', '其他'];

const provinces = ref([]);
const cities = ref([]);
const districts = ref([]);

const form = reactive({
  logoUrl: '',
  companyNature: '',
  companySize: '',
  annualRevenue: '',
  registeredCapital: '',
  provinceId: null,
  cityId: null,
  districtId: null,
  address: '',
  maxCommissionRate: '',
  paymentMethods: [],
  licenseDocUrl: '',
  licenseNo: '',
});

const natureIndex = computed(() => Math.max(0, companyNatureOptions.indexOf(form.companyNature)));
const sizeIndex = computed(() => Math.max(0, companySizeOptions.indexOf(form.companySize)));
const provinceIndex = computed(() => Math.max(0, provinces.value.findIndex((r) => r.id === form.provinceId)));
const cityIndex = computed(() => Math.max(0, cities.value.findIndex((r) => r.id === form.cityId)));
const districtIndex = computed(() => Math.max(0, districts.value.findIndex((r) => r.id === form.districtId)));

onShow(async () => {
  if (!requireLogin()) return;
  await loadProvinces();
  await fetchData();
});

async function loadProvinces() {
  provinces.value = await getRegionChildren() || [];
}

async function loadCities(code) {
  cities.value = code ? await getRegionChildren(code) || [] : [];
  districts.value = [];
}

async function loadDistricts(code) {
  districts.value = code ? await getRegionChildren(code) || [] : [];
}

async function fetchData() {
  loading.value = true;
  try {
    certData.value = await getInstitutionCompanyInfo();
    const d = certData.value || {};
    form.logoUrl = d.logoUrl || '';
    form.companyNature = d.companyNature || '';
    form.companySize = d.companySize || '';
    form.annualRevenue = d.annualRevenue || '';
    form.registeredCapital = d.registeredCapital || '';
    form.provinceId = d.provinceId || null;
    form.cityId = d.cityId || null;
    form.districtId = d.districtId || null;
    form.address = d.address || '';
    form.maxCommissionRate = d.maxCommissionRate != null ? String(d.maxCommissionRate) : '';
    form.paymentMethods = d.paymentMethods || [];
    form.licenseDocUrl = d.licenseDocUrl || '';
    form.licenseNo = d.licenseNo || '';
    const p = provinces.value.find((r) => r.id === form.provinceId);
    if (p?.code) {
      await loadCities(p.code);
      const c = cities.value.find((r) => r.id === form.cityId);
      if (c?.code) await loadDistricts(c.code);
    }
  } catch (_) {
    certData.value = null;
  } finally {
    loading.value = false;
  }
}

function setField(key, e) {
  form[key] = e.detail?.value ?? '';
}

function onNatureChange(e) {
  form.companyNature = companyNatureOptions[Number(e.detail.value)] || '';
}

function onSizeChange(e) {
  form.companySize = companySizeOptions[Number(e.detail.value)] || '';
}

async function onProvinceChange(e) {
  const p = provinces.value[Number(e.detail.value)];
  form.provinceId = p?.id || null;
  form.cityId = null;
  form.districtId = null;
  await loadCities(p?.code);
}

async function onCityChange(e) {
  const c = cities.value[Number(e.detail.value)];
  form.cityId = c?.id || null;
  form.districtId = null;
  await loadDistricts(c?.code);
}

function onDistrictChange(e) {
  form.districtId = districts.value[Number(e.detail.value)]?.id || null;
}

function togglePayment(method) {
  const idx = form.paymentMethods.indexOf(method);
  if (idx >= 0) form.paymentMethods.splice(idx, 1);
  else form.paymentMethods.push(method);
}

async function handleSubmit() {
  if (submitting.value) return;
  if (!form.logoUrl) return uni.showToast({ title: '请上传公司 Logo', icon: 'none' });
  if (!form.companyNature) return uni.showToast({ title: '请选择公司性质', icon: 'none' });
  if (!form.companySize) return uni.showToast({ title: '请选择机构规模', icon: 'none' });
  if (!form.annualRevenue.trim()) return uni.showToast({ title: '请填写年营业额', icon: 'none' });
  if (!form.registeredCapital.trim()) return uni.showToast({ title: '请填写注册资本', icon: 'none' });
  if (!form.provinceId || !form.cityId || !form.districtId) {
    return uni.showToast({ title: '请选择注册地址', icon: 'none' });
  }
  if (!form.address.trim()) return uni.showToast({ title: '请填写详细地址', icon: 'none' });
  const rate = Number(form.maxCommissionRate);
  if (!form.maxCommissionRate || Number.isNaN(rate) || rate < 0 || rate > 100) {
    return uni.showToast({ title: '佣金比例需在 0-100 之间', icon: 'none' });
  }
  if (!form.licenseDocUrl) return uni.showToast({ title: '请上传营业执照', icon: 'none' });
  if (form.licenseNo.trim() && !/^\d{15}$|^[A-Z\d]{18}$/.test(form.licenseNo.trim())) {
    return uni.showToast({ title: '营业执照号格式不正确', icon: 'none' });
  }

  submitting.value = true;
  try {
    await submitInstitutionCompanyInfo({
      logoUrl: form.logoUrl,
      companyNature: form.companyNature,
      companySize: form.companySize,
      annualRevenue: form.annualRevenue.trim(),
      registeredCapital: form.registeredCapital.trim(),
      provinceId: form.provinceId,
      cityId: form.cityId,
      districtId: form.districtId,
      address: form.address.trim(),
      maxCommissionRate: rate,
      paymentMethods: form.paymentMethods,
      licenseDocUrl: form.licenseDocUrl,
      licenseNo: form.licenseNo.trim(),
    });
    uni.showToast({ title: '已提交，等待审核', icon: 'none' });
    await fetchData();
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: $tk-bg-page; }
.page__scroll { height: 100vh; }
.page__inner { padding: $tk-sp-3; padding-bottom: 60rpx; }
.desc { font-size: $tk-fs-sm; color: $tk-text-3; line-height: 1.6; margin-bottom: $tk-sp-3; }
.form { background: $tk-bg-card; border-radius: $tk-radius-lg; padding: $tk-sp-4; box-shadow: $tk-shadow-card; display: flex; flex-direction: column; gap: $tk-sp-3; }
.field {
  &__label { display: block; font-size: $tk-fs-sm; color: $tk-text-3; margin-bottom: 12rpx; }
  &__input, &__picker {
    width: 100%; padding: 20rpx 24rpx; background: $tk-bg-page; border-radius: $tk-radius-md;
    font-size: $tk-fs-md; color: $tk-text-1; box-sizing: border-box;
  }
}
.req { color: #DC2626; }
.checks { display: flex; flex-wrap: wrap; gap: 12rpx; }
.check {
  padding: 12rpx 24rpx; border: 2rpx solid $tk-divider-light; border-radius: $tk-radius-full;
  font-size: $tk-fs-sm; color: $tk-text-2;
  &--on { border-color: $tk-primary; color: $tk-primary; background: $tk-primary-soft; }
}
.progress-wrap {
  padding-top: $tk-sp-2; border-top: 2rpx solid $tk-divider-light;
  &__title { display: block; font-size: $tk-fs-sm; font-weight: 700; color: $tk-text-1; margin-bottom: $tk-sp-2; }
}
.actions__primary { padding: 24rpx 0; background: $tk-primary; border-radius: $tk-radius-md; text-align: center; color: #fff; font-size: $tk-fs-md; font-weight: 700; }
</style>
