<!-- 精彩瞬间发布/编辑表单 -->
<template>
  <view class="page">
    <TkNavBar :title="highlightId ? '编辑精彩瞬间' : '发布精彩瞬间'" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <view class="form">
          <view class="field">
            <text class="field__label">标题</text>
            <input class="field__input" :value="form.title" placeholder="精彩瞬间标题" @input="setField('title', $event)" />
          </view>
          <view class="field">
            <text class="field__label">描述</text>
            <textarea class="field__textarea" :value="form.description" placeholder="简要描述" @input="setField('description', $event)" />
          </view>
          <view class="field field--upload">
            <text class="field__label">封面图</text>
            <TkMediaUpload v-model="form.coverImage" label="上传封面" />
          </view>
          <view class="field field--upload">
            <text class="field__label">媒体文件</text>
            <view class="media-list">
              <TkMediaUpload
                v-for="(f, i) in mediaFiles"
                :key="i"
                :model-value="f"
                accept-video
                @update:model-value="updateMedia(i, $event)"
              />
              <view class="media-add" @tap="addMediaSlot">
                <text class="media-add__plus">+</text>
                <text class="media-add__txt">添加媒体</text>
              </view>
            </view>
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
import { ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import {
  createHighlight,
  updateHighlight,
  addHighlightFile,
  MediaType,
} from '@/api/publisher-highlight';
import { getNavBarHeight } from '@/utils/system';
import { requireLogin } from '@/utils/auth';

const navBarH = getNavBarHeight();
const highlightId = ref(null);
const trainerUserId = ref(undefined);
const submitting = ref(false);
const mediaFiles = ref(['']);

const form = reactive({
  title: '',
  description: '',
  coverImage: '',
});

onLoad((opts) => {
  if (!requireLogin()) return;
  if (opts?.id) highlightId.value = Number(opts.id);
  if (opts?.trainerUserId) trainerUserId.value = Number(opts.trainerUserId);
});

function setField(key, e) {
  form[key] = e.detail?.value ?? '';
}

function addMediaSlot() {
  mediaFiles.value.push('');
}

function updateMedia(index, url) {
  mediaFiles.value[index] = url;
}

function detectFileType(url) {
  return /\.(mp4|mov|avi|webm)(\?|$)/i.test(url || '') ? MediaType.VIDEO : MediaType.IMAGE;
}

async function handleSubmit() {
  if (submitting.value) return;
  submitting.value = true;
  try {
    const payload = {
      title: form.title.trim() || undefined,
      description: form.description.trim() || undefined,
      coverImage: form.coverImage || undefined,
    };
    let id = highlightId.value;
    if (id) {
      await updateHighlight(id, payload, trainerUserId.value);
    } else {
      const created = await createHighlight(payload, trainerUserId.value);
      id = created?.id;
    }
    const files = mediaFiles.value.filter(Boolean);
    for (let i = 0; i < files.length; i++) {
      await addHighlightFile(id, {
        fileType: detectFileType(files[i]),
        fileUrl: files[i],
        sortOrder: i,
      }, trainerUserId.value);
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
  &__input, &__textarea {
    width: 100%; padding: 20rpx 24rpx; background: $tk-bg-page; border-radius: $tk-radius-md;
    font-size: $tk-fs-md; color: $tk-text-1; box-sizing: border-box;
  }
  &__textarea { min-height: 160rpx; }
}
.media-list { display: flex; flex-wrap: wrap; gap: $tk-sp-2; }
.media-add {
  width: 240rpx; height: 240rpx; border: 2rpx dashed $tk-divider-light; border-radius: $tk-radius-md;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8rpx;
  &__plus { font-size: 48rpx; color: $tk-text-4; line-height: 1; }
  &__txt { font-size: $tk-fs-xs; color: $tk-text-3; }
}
.actions__primary { padding: 24rpx 0; background: $tk-primary; border-radius: $tk-radius-md; text-align: center; color: #fff; font-size: $tk-fs-md; font-weight: 700; }
</style>
