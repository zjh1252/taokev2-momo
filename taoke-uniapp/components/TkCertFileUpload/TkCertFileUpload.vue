<!-- 认证证明文件上传（图片 / PDF） -->
<template>
  <view class="upload">
    <view v-if="displayUrl" class="preview" @tap="onPreview">
      <image
        v-if="isImage"
        class="preview__img"
        :src="displayUrl"
        mode="aspectFill"
      />
      <view v-else class="preview__file">
        <TkIcon name="file" :size="48" color="#666" />
        <text class="preview__file-txt">已上传文件</text>
      </view>
      <view v-if="!disabled" class="preview__del" @tap.stop="onRemove">
        <TkIcon name="close" :size="24" color="#fff" />
      </view>
    </view>
    <view v-else-if="!disabled" class="picker" @tap="onPick">
      <TkLoading v-if="uploading" />
      <template v-else>
        <TkIcon name="camera" :size="48" color="#999" />
        <text class="picker__txt">{{ label || '上传证明文件' }}</text>
        <text class="picker__sub">支持图片或 PDF</text>
      </template>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { uploadCertFile } from '@/api/upload';
import { toAssetUrl } from '@/utils/asset';

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue']);

const uploading = ref(false);

const displayUrl = computed(() => {
  if (!props.modelValue) return '';
  return toAssetUrl(props.modelValue);
});

const isImage = computed(() => {
  const u = props.modelValue || '';
  return /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(u);
});

function onRemove() {
  emit('update:modelValue', '');
}

function onPreview() {
  if (isImage.value && displayUrl.value) {
    uni.previewImage({ urls: [displayUrl.value] });
  }
}

function chooseImage() {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => resolve(res.tempFilePaths[0]),
      fail: reject,
    });
  });
}

function chooseFile() {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    uni.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
      success: (res) => resolve(res.tempFiles[0]?.path),
      fail: reject,
    });
    // #endif
    // #ifndef MP-WEIXIN
    chooseImage().then(resolve).catch(reject);
    // #endif
  });
}

async function onPick() {
  if (props.disabled || uploading.value) return;
  try {
    const path = await chooseFile();
    if (!path) return;
    uploading.value = true;
    const url = await uploadCertFile(path);
    emit('update:modelValue', url);
  } catch (e) {
    if (e?.errMsg && !e.errMsg.includes('cancel')) {
      uni.showToast({ title: '上传失败', icon: 'none' });
    }
  } finally {
    uploading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.upload {
  display: inline-block;
}

.picker {
  width: 240rpx;
  height: 240rpx;
  border: 2rpx dashed $tk-divider-light;
  border-radius: $tk-radius-md;
  background: $tk-bg-page;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;

  &__txt {
    font-size: $tk-fs-xs;
    color: $tk-text-2;
  }
  &__sub {
    font-size: 20rpx;
    color: $tk-text-4;
  }
}

.preview {
  position: relative;
  width: 240rpx;
  height: 240rpx;
  border-radius: $tk-radius-md;
  overflow: hidden;
  border: 2rpx solid $tk-divider-light;

  &__img {
    width: 100%;
    height: 100%;
  }

  &__file {
    width: 100%;
    height: 100%;
    background: $tk-bg-page;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
  }

  &__file-txt {
    font-size: $tk-fs-xs;
    color: $tk-text-3;
  }

  &__del {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
    width: 44rpx;
    height: 44rpx;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
