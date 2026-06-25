<!--
  录播课播放页 — 对齐 PC /videos/[id]/play
  支持直链 mp4 播放 + 章节切换 + 进度上报
-->
<template>
  <view class="page">
    <TkNavBar :title="video.title || '视频学习'" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <TkLoading v-if="loading && !video.id" />

        <template v-else>
          <!-- 播放器 -->
          <view class="player-wrap">
            <video
              v-if="playUrl && accessible"
              :id="playerId"
              class="player"
              :src="playUrl"
              :initial-time="initialTime"
              controls
              show-center-play-btn
              enable-progress-gesture
              object-fit="contain"
              @timeupdate="onTimeUpdate"
              @ended="onEnded"
            />
            <view v-else class="player player--placeholder">
              <TkIcon name="course" :size="80" color="#fff" />
              <text class="player__tip">{{ placeholderTip }}</text>
            </view>
          </view>

          <view class="meta">
            <text class="meta__title">{{ currentChapter?.title || video.title }}</text>
            <text v-if="video.teacherName" class="meta__sub">讲师：{{ video.teacherName }}</text>
          </view>

          <!-- 章节目录 -->
          <view v-if="chapters.length" class="chapter-panel">
            <text class="chapter-panel__title">章节目录</text>
            <view
              v-for="ch in chapters"
              :key="ch.id"
              class="chapter-item"
              :class="{ 'is-active': currentChapter?.id === ch.id }"
              @tap="selectChapter(ch)"
            >
              <text class="chapter-item__title">{{ ch.title }}</text>
              <text v-if="chapterProgress(ch.id) >= 0" class="chapter-item__pct">
                {{ chapterProgress(ch.id) }}%
              </text>
            </view>
          </view>
        </template>

        <view style="height: 40rpx;" />
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import * as videoApi from '@/api/video';
import { requireLogin, isLoggedIn } from '@/utils/auth';
import { flattenVideoChapters, resolveDirectPlayUrl } from '@/utils/video';
import { toAssetUrl } from '@/utils/asset';
import { getNavBarHeight } from '@/utils/system';

const navBarH = getNavBarHeight();
const playerId = 'tk-video-player';

const videoId = ref('');
const video = ref({});
const chapters = ref([]);
const progressInfo = ref(null);
const currentChapter = ref(null);
const playUrl = ref('');
const accessible = ref(false);
const loading = ref(false);
const initialTime = ref(0);

let lastReportAt = 0;
let watchDuration = 0;
let chapterDuration = 0;

const placeholderTip = computed(() => {
  if (!accessible.value) return '请先购买或登录后观看';
  if (!playUrl.value) return '该章节暂无可播放片源';
  return '加载中...';
});

function chapterProgress(chapterId) {
  const cp = progressInfo.value?.chapters?.find((c) => c.chapterId === chapterId);
  return cp?.progress ?? -1;
}

async function loadAll() {
  loading.value = true;
  try {
    video.value = await videoApi.getVideoDetail(videoId.value);
    chapters.value = flattenVideoChapters(video.value);

    if (video.value.isFree === 1) {
      accessible.value = true;
    } else if (isLoggedIn()) {
      try {
        const access = await videoApi.getVideoAccess(videoId.value);
        accessible.value = !!(access?.accessible || access?.enrolled || access?.isOwner);
      } catch (_) {
        accessible.value = false;
      }
    }

    if (accessible.value) {
      try {
        progressInfo.value = await videoApi.getVideoProgress(videoId.value);
      } catch (_) {
        progressInfo.value = null;
      }
    }

    const preferredId = progressInfo.value?.lastChapterId;
    const defaultChapter =
      chapters.value.find((c) => c.id === preferredId) || chapters.value[0] || null;
    if (defaultChapter) await selectChapter(defaultChapter);
  } catch (_) {
    uni.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

async function selectChapter(ch) {
  if (!ch) return;
  currentChapter.value = ch;
  watchDuration = 0;
  chapterDuration = ch.duration || 0;
  initialTime.value = 0;

  const cp = progressInfo.value?.chapters?.find((c) => c.chapterId === ch.id);
  if (cp && cp.chapterDuration > 0 && cp.progress > 0 && cp.progress < 100) {
    initialTime.value = Math.floor((cp.chapterDuration * cp.progress) / 100);
    watchDuration = initialTime.value;
  } else if (cp?.watchDuration > 0) {
    initialTime.value = cp.watchDuration;
    watchDuration = cp.watchDuration;
  }

  playUrl.value = '';

  const direct = resolveDirectPlayUrl(ch.videoUrl || video.value.videoUrl);
  if (direct && accessible.value) {
    playUrl.value = toAssetUrl(direct) || direct;
    return;
  }

  if (!accessible.value) return;

  try {
    const signed = await videoApi.getChapterPlaybackUrl(videoId.value, ch.id);
    if (signed?.playbackMode === 'direct' && signed.embedUrl) {
      playUrl.value = signed.embedUrl;
    } else if (signed?.embedUrl) {
      // 第三方 iframe 源在小程序内用 web-view 体验较差，提示用户
      uni.showModal({
        title: '外部播放源',
        content: '该章节为第三方嵌入播放，当前环境可能无法直接播放，请稍后在 H5 端观看。',
        showCancel: false,
      });
    }
  } catch (_) {
    playUrl.value = '';
  }
}

function onTimeUpdate(e) {
  if (!currentChapter.value || !accessible.value) return;
  watchDuration = Math.floor(e.detail.currentTime || 0);
  chapterDuration = Math.floor(e.detail.duration || chapterDuration || currentChapter.value.duration || 1);
  const now = Date.now();
  if (now - lastReportAt < 15000) return;
  lastReportAt = now;
  reportProgress();
}

function onEnded() {
  watchDuration = chapterDuration || watchDuration;
  reportProgress();
}

function reportProgress() {
  if (!currentChapter.value || !videoId.value) return;
  const dur = chapterDuration || currentChapter.value.duration || 1;
  videoApi.updateVideoProgress(videoId.value, {
    chapterId: currentChapter.value.id,
    watchDuration,
    chapterDuration: dur,
  }).catch(() => {});
}

onLoad((opt) => {
  videoId.value = opt?.id || '';
  if (!videoId.value) {
    uni.showToast({ title: '缺少视频 ID', icon: 'none' });
    return;
  }
  if (!requireLogin()) return;
  loadAll();
});

onUnload(() => {
  reportProgress();
});
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  background: $tk-bg-page;
}
.page__scroll {
  height: 100vh;
  box-sizing: border-box;
}
.page__inner {
  padding: $tk-sp-3;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-3;
}

.player-wrap {
  border-radius: $tk-radius-md;
  overflow: hidden;
  background: #000;
}
.player {
  width: 100%;
  height: 420rpx;

  &--placeholder {
    height: 420rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $tk-sp-2;
    background: #1a1a1a;
  }
  &__tip {
    font-size: $tk-fs-sm;
    color: rgba(255,255,255,0.75);
  }
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;

  &__title {
    font-size: $tk-fs-xl;
    font-weight: 700;
    color: $tk-text-1;
  }
  &__sub {
    font-size: $tk-fs-sm;
    color: $tk-text-3;
  }
}

.chapter-panel {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-3;
  box-shadow: $tk-shadow-card;

  &__title {
    font-size: $tk-fs-md;
    font-weight: 700;
    color: $tk-text-1;
    margin-bottom: $tk-sp-2;
    display: block;
  }
}

.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $tk-sp-2 0;
  border-bottom: 2rpx solid $tk-divider-light;

  &:last-child { border-bottom: none; }
  &.is-active {
    .chapter-item__title { color: $tk-primary; font-weight: 600; }
  }

  &__title {
    flex: 1;
    font-size: $tk-fs-md;
    color: $tk-text-1;
    @include tk-ellipsis(1);
  }
  &__pct {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
    margin-left: $tk-sp-2;
  }
}
</style>
