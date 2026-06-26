<!--
  专家专业认证 — GET/PUT /trainers/me/certification/professional
-->
<template>
  <view class="page">
    <TkNavBar title="专业认证" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <text class="desc">
          上传与您专业能力相关的证书、获奖证明、行业资质等附件，可上传多份。
        </text>

        <TkLoading v-if="loading" />

        <template v-else>
          <view class="files-head">
            <text class="files-head__txt">已上传附件 ({{ files.length }})</text>
            <view v-if="!readOnly" class="files-head__add" @tap="onAddFiles">
              <text class="files-head__add-txt">{{ uploading ? '上传中…' : '添加附件' }}</text>
            </view>
          </view>

          <view v-if="files.length" class="files-grid">
            <view v-for="(url, idx) in files" :key="url + idx" class="file-card">
              <image
                v-if="isImageUrl(url)"
                class="file-card__img"
                :src="toAssetUrl(url)"
                mode="aspectFill"
                @tap="previewImage(url)"
              />
              <view v-else class="file-card__doc">
                <TkIcon name="file" :size="40" color="#666" />
              </view>
              <view v-if="!readOnly" class="file-card__del" @tap="removeFile(idx)">
                <TkIcon name="close" :size="20" color="#fff" />
              </view>
            </view>
          </view>
          <view v-else class="empty-files">
            <text class="empty-files__txt">暂未上传附件</text>
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
              label="专业认证"
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
import { uploadCertFile } from '@/api/upload';
import { toAssetUrl } from '@/utils/asset';
import { getNavBarHeight } from '@/utils/system';

const navBarH = getNavBarHeight();

const loading = ref(true);
const submitting = ref(false);
const uploading = ref(false);
const data = ref(null);
const files = ref([]);

const readOnly = computed(() => data.value?.status === 2);
const submitLabel = computed(() => (data.value?.status === 3 ? '重新提交' : '提交认证'));

onShow(() => { fetchData(); });

async function fetchData() {
  loading.value = true;
  try {
    const d = await certApi.getProfessionalCert();
    data.value = d;
    files.value = d?.files ? [...d.files] : [];
  } catch (_) {
    data.value = null;
    files.value = [];
  } finally {
    loading.value = false;
  }
}

function isImageUrl(url) {
  return /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(url || '');
}

function previewImage(url) {
  uni.previewImage({ urls: [toAssetUrl(url)] });
}

function removeFile(idx) {
  files.value = files.value.filter((_, i) => i !== idx);
}

function chooseFile() {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => resolve(res.tempFilePaths || []),
      fail: reject,
    });
  });
}

async function onAddFiles() {
  if (readOnly.value || uploading.value) return;
  try {
    const paths = await chooseFile();
    if (!paths.length) return;
    uploading.value = true;
    for (const p of paths) {
      const url = await uploadCertFile(p);
      files.value.push(url);
    }
  } catch (e) {
    if (e?.errMsg && !e.errMsg.includes('cancel')) {
      uni.showToast({ title: '上传失败', icon: 'none' });
    }
  } finally {
    uploading.value = false;
  }
}

async function handleSubmit() {
  if (submitting.value) return;
  if (!files.value.length) {
    uni.showToast({ title: '请至少上传一份专业认证附件', icon: 'none' });
    return;
  }
  submitting.value = true;
  try {
    await certApi.submitProfessionalCert({ files: files.value });
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

.files-head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  &__txt {
    font-size: $tk-fs-sm;
    color: $tk-text-2;
  }

  &__add {
    padding: 10rpx 24rpx;
    border: 2rpx solid $tk-primary;
    border-radius: $tk-radius-md;
  }

  &__add-txt {
    font-size: $tk-fs-xs;
    color: $tk-primary;
    font-weight: 600;
  }
}

.files-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $tk-sp-2;
}

.file-card {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: $tk-radius-md;
  overflow: hidden;
  border: 2rpx solid $tk-divider-light;

  &__img {
    width: 100%;
    height: 100%;
  }

  &__doc {
    width: 100%;
    height: 100%;
    background: $tk-bg-page;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__del {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.empty-files {
  padding: 48rpx;
  border: 2rpx dashed $tk-divider-light;
  border-radius: $tk-radius-md;
  text-align: center;

  &__txt {
    font-size: $tk-fs-sm;
    color: $tk-text-4;
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
