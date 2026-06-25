<!--
  更多信息 — 个人学员学习标签（对齐 PC /dashboard/account/more）
-->
<template>
  <view class="page">
    <TkNavBar title="更多信息" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <view class="intro">
          <text class="intro__txt">填写您感兴趣的学习方向，我们将根据这些标签推荐合适的课程与讲师。</text>
        </view>

        <view class="form">
          <text class="form__label">学习标签</text>
          <textarea
            class="form__area"
            :value="studyTags"
            placeholder="多个关键词以逗号分隔，如：AI办公应用,销售技巧,演讲表达"
            placeholder-style="color:#999"
            maxlength="200"
            @input="onInput"
          />
        </view>

        <view v-if="error" class="hint">
          <text class="hint__txt">{{ error }}</text>
        </view>

        <view style="height: 200rpx;" />
      </view>
    </scroll-view>

    <TkActionBar>
      <TkActionBtn
        :label="saving ? '保存中...' : '保存学习标签'"
        type="primary"
        :disabled="saving || !dirty"
        @tap="onSave"
      />
    </TkActionBar>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { getNavBarHeight } from '@/utils/system';

const navBarH = getNavBarHeight();
const userStore = useUserStore();

const studyTags = ref('');
const initial = ref('');
const saving = ref(false);
const error = ref('');

const dirty = computed(() => studyTags.value !== initial.value);

onLoad(async () => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/auth/login' });
    return;
  }
  hydrate(userStore.profile);
  const p = await userStore.fetchProfile();
  if (p) hydrate(p);
});

function hydrate(p) {
  if (!p) return;
  studyTags.value = p.studyTags ?? '';
  initial.value = studyTags.value;
}

function onInput(e) {
  studyTags.value = e.detail.value || '';
}

async function onSave() {
  if (saving.value || !dirty.value) return;
  error.value = '';
  saving.value = true;
  try {
    await userStore.updateProfile({ studyTags: studyTags.value });
    initial.value = studyTags.value;
    uni.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 400);
  } catch (e) {
    error.value = e?.message || '保存失败';
  } finally {
    saving.value = false;
  }
}
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

.intro {
  padding: 0 8rpx;

  &__txt {
    font-size: $tk-fs-sm;
    color: $tk-text-3;
    line-height: $tk-lh-normal;
  }
}

.form {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-3;
  box-shadow: $tk-shadow-card;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-2;

  &__label {
    font-size: $tk-fs-sm;
    color: $tk-text-2;
    font-weight: 600;
  }
  &__area {
    width: 100%;
    min-height: 240rpx;
    padding: $tk-sp-3;
    background: $tk-bg-page;
    border-radius: $tk-radius-md;
    font-size: $tk-fs-md;
    color: $tk-text-1;
    box-sizing: border-box;
  }
}

.hint {
  background: rgba(230, 33, 23, 0.08);
  border: 2rpx solid rgba(230, 33, 23, 0.30);
  border-radius: $tk-radius-md;
  padding: $tk-sp-2 $tk-sp-3;

  &__txt {
    font-size: $tk-fs-sm;
    color: $tk-primary;
  }
}
</style>
