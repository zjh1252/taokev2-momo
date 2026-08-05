<!-- 专家经纪公司资质认证 -->
<template>
  <view class="page">
    <TkNavBar title="经纪公司资质" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <TkLoading v-if="loading" />

        <view v-else class="form">
          <text class="desc">上传公司 Logo 与营业执照，提交后等待平台审核。</text>

          <view class="field field--upload">
            <text class="field__label">公司 Logo <text class="req">*</text></text>
            <TkMediaUpload v-model="form.certLogoUrl" label="公司 Logo" />
          </view>

          <view class="field field--upload">
            <text class="field__label">营业执照 <text class="req">*</text></text>
            <TkCertFileUpload v-model="form.qualificationDocUrl" label="营业执照" />
          </view>

          <view class="progress-wrap">
            <text class="progress-wrap__title">审核进度</text>
            <TkCertProgress
              :status="certData?.status ?? null"
              :submitted-at="certData?.submittedAt"
              :audited-at="certData?.auditedAt"
              :reject-reason="certData?.rejectReason"
              label="经纪公司资质"
            />
          </view>

          <view class="actions">
            <view class="actions__primary" @tap="handleSubmit">
              <text>{{ submitting ? '提交中…' : '提交认证' }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getEnterpriseAgentCert, submitEnterpriseAgentCert } from '@/api/role-cert';
import { getNavBarHeight } from '@/utils/system';
import { requireLogin } from '@/utils/auth';

const navBarH = getNavBarHeight();
const loading = ref(true);
const submitting = ref(false);
const certData = ref(null);

const form = reactive({
  certLogoUrl: '',
  qualificationDocUrl: '',
});

onShow(() => {
  if (!requireLogin()) return;
  fetchData();
});

async function fetchData() {
  loading.value = true;
  try {
    certData.value = await getEnterpriseAgentCert();
    form.certLogoUrl = certData.value?.certLogoUrl || '';
    form.qualificationDocUrl = certData.value?.qualificationDocUrl || '';
  } catch (_) {
    certData.value = null;
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (submitting.value) return;
  if (!form.certLogoUrl) return uni.showToast({ title: '请上传公司 Logo', icon: 'none' });
  if (!form.qualificationDocUrl) return uni.showToast({ title: '请上传营业执照', icon: 'none' });
  submitting.value = true;
  try {
    await submitEnterpriseAgentCert({
      certLogoUrl: form.certLogoUrl,
      qualificationDocUrl: form.qualificationDocUrl,
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
}
.req { color: #DC2626; }
.progress-wrap {
  padding-top: $tk-sp-2; border-top: 2rpx solid $tk-divider-light;
  &__title { display: block; font-size: $tk-fs-sm; font-weight: 700; color: $tk-text-1; margin-bottom: $tk-sp-2; }
}
.actions__primary { padding: 24rpx 0; background: $tk-primary; border-radius: $tk-radius-md; text-align: center; color: #fff; font-size: $tk-fs-md; font-weight: 700; }
</style>
