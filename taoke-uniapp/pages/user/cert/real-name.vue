<!--
  专家实名认证 — GET/PUT /trainers/me/certification/real-name
-->
<template>
  <view class="page">
    <TkNavBar title="实名认证" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <text class="desc">身份证信息将严格保密，仅用于平台资质审核与必要的法律合规场景。</text>

        <TkLoading v-if="loading" />

        <template v-else>
          <view class="form">
            <view class="field">
              <text class="field__label">真实姓名 <text class="req">*</text></text>
              <input
                class="field__input"
                :value="realName"
                :disabled="readOnly"
                placeholder="请输入真实姓名"
                placeholder-style="color:#999"
                @input="onInput('realName', $event)"
              />
            </view>
            <view class="field">
              <text class="field__label">身份证号 <text class="req">*</text></text>
              <input
                class="field__input"
                :value="idCardNo"
                :disabled="readOnly"
                placeholder="15 或 18 位身份证号"
                placeholder-style="color:#999"
                maxlength="18"
                @input="onInput('idCardNo', $event)"
              />
            </view>
          </view>

          <view class="upload-row">
            <view class="upload-item">
              <text class="upload-item__label">身份证人像面 <text class="req">*</text></text>
              <TkCertFileUpload v-model="idCardFront" label="人像面" :disabled="readOnly" />
            </view>
            <view class="upload-item">
              <text class="upload-item__label">身份证国徽面 <text class="req">*</text></text>
              <TkCertFileUpload v-model="idCardBack" label="国徽面" :disabled="readOnly" />
            </view>
          </view>

          <view v-if="!readOnly" class="submit" @tap="handleSubmit">
            <text class="submit__txt">{{ submitting ? '提交中…' : submitLabel }}</text>
          </view>

          <view class="section">
            <text class="section__title">认证进度</text>
            <TkCertProgress
              :status="data?.status ?? null"
              :submitted-at="data?.submittedAt"
              :audited-at="data?.auditedAt"
              :reject-reason="data?.rejectReason"
              label="实名认证"
            />
          </view>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import * as certApi from '@/api/certification';
import { getNavBarHeight } from '@/utils/system';

const navBarH = getNavBarHeight();

const loading = ref(true);
const submitting = ref(false);
const data = ref(null);
const realName = ref('');
const idCardNo = ref('');
const idCardFront = ref('');
const idCardBack = ref('');

const readOnly = computed(() => data.value?.status === 2);
const submitLabel = computed(() => (data.value?.status === 3 ? '重新提交' : '提交认证'));

onShow(() => { fetchData(); });

async function fetchData() {
  loading.value = true;
  try {
    const d = await certApi.getRealNameCert();
    data.value = d;
    realName.value = d?.realName || '';
    idCardNo.value = d?.idCardNo || '';
    idCardFront.value = d?.idCardFront || '';
    idCardBack.value = d?.idCardBack || '';
  } catch (_) {
    data.value = null;
  } finally {
    loading.value = false;
  }
}

function onInput(field, e) {
  const v = e.detail?.value ?? '';
  if (field === 'realName') realName.value = v;
  if (field === 'idCardNo') idCardNo.value = v;
}

async function handleSubmit() {
  if (submitting.value) return;
  if (!realName.value.trim()) {
    uni.showToast({ title: '请输入真实姓名', icon: 'none' });
    return;
  }
  if (!/^\d{15}$|^\d{17}[\dXx]$/.test(idCardNo.value)) {
    uni.showToast({ title: '身份证号格式不正确', icon: 'none' });
    return;
  }
  if (!idCardFront.value) {
    uni.showToast({ title: '请上传身份证人像面', icon: 'none' });
    return;
  }
  if (!idCardBack.value) {
    uni.showToast({ title: '请上传身份证国徽面', icon: 'none' });
    return;
  }
  submitting.value = true;
  try {
    await certApi.submitRealNameCert({
      realName: realName.value.trim(),
      idCardNo: idCardNo.value.trim(),
      idCardFront: idCardFront.value,
      idCardBack: idCardBack.value,
    });
    uni.showToast({ title: '已提交，等待审核', icon: 'none' });
    await fetchData();
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
}

.page__inner {
  padding: $tk-sp-4;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-4;
}

.desc {
  font-size: $tk-fs-sm;
  color: $tk-text-3;
  line-height: 1.6;
}

.req {
  color: #DC2626;
}

.form {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  overflow: hidden;
  box-shadow: $tk-shadow-card;
}

.field {
  padding: $tk-sp-3 $tk-sp-4;
  border-bottom: 2rpx solid $tk-divider-light;

  &:last-child { border-bottom: none; }

  &__label {
    display: block;
    font-size: $tk-fs-sm;
    color: $tk-text-3;
    margin-bottom: 12rpx;
  }

  &__input {
    font-size: $tk-fs-md;
    color: $tk-text-1;
  }
}

.upload-row {
  display: flex;
  gap: $tk-sp-4;
  flex-wrap: wrap;
}

.upload-item {
  display: flex;
  flex-direction: column;
  gap: 12rpx;

  &__label {
    font-size: $tk-fs-sm;
    color: $tk-text-2;
  }
}

.submit {
  padding: 24rpx 0;
  background: $tk-primary;
  border-radius: $tk-radius-md;
  display: flex;
  align-items: center;
  justify-content: center;

  &__txt {
    color: #fff;
    font-size: $tk-fs-md;
    font-weight: 700;
  }
}

.section {
  padding-top: $tk-sp-2;
  border-top: 2rpx solid $tk-divider-light;

  &__title {
    display: block;
    font-size: $tk-fs-md;
    font-weight: 700;
    color: $tk-text-1;
    margin-bottom: $tk-sp-3;
  }
}
</style>
