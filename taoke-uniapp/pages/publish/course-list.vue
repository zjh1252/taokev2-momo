<!-- 管理课程 — 状态 Tab + 搜索 + 列表 -->
<template>
  <view class="page">
    <TkNavBar title="我的课程" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <TkTrainerPicker v-if="showPicker" v-model="trainerUserId" :active-role="activeRole" />

        <view class="search">
          <input class="search__input" :value="keyword" placeholder="搜索课程标题" confirm-type="search" @confirm="reload" @input="keyword = $event.detail.value" />
          <view class="search__btn" @tap="reload"><text>搜索</text></view>
        </view>

        <scroll-view scroll-x class="tabs">
          <view
            v-for="t in statusTabs"
            :key="t.label"
            class="tab"
            :class="{ 'tab--active': activeTab === t.value }"
            @tap="switchTab(t.value)"
          >
            <text class="tab__txt">{{ t.label }}</text>
          </view>
        </scroll-view>

        <TkLoading v-if="loading && !courses.length" />
        <TkEmpty v-else-if="!loading && !courses.length" text="暂无课程" />
        <view v-else class="list">
          <view v-for="c in courses" :key="c.id" class="card">
            <view class="card__head">
              <text class="card__title">{{ c.title || '未命名课程' }}</text>
              <text class="card__status">{{ CourseStatusLabel[c.status] || '—' }}</text>
            </view>
            <text v-if="c.price != null" class="card__meta">价格：¥{{ c.price }}</text>
            <text class="card__meta">更新：{{ fmtDate(c.updatedAt || c.createdAt) }}</text>
            <view class="card__actions">
              <view class="card__act" @tap="goEdit(c.id)"><text>编辑</text></view>
              <view v-if="c.status === CourseStatus.PUBLISHED" class="card__act" @tap="handleUnpublish(c.id)"><text>下架</text></view>
              <view class="card__act card__act--danger" @tap="handleDelete(c.id)"><text>删除</text></view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="fab" @tap="goCreate">
      <text class="fab__txt">+</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import {
  getMyCourses,
  unpublishCourse,
  deleteCourse,
  CourseStatus,
  CourseStatusLabel,
} from '@/api/publisher-course';
import { getNavBarHeight } from '@/utils/system';
import { requireLogin } from '@/utils/auth';
import { useUserStore } from '@/stores/user';
import { isDelegatingRole } from '@/utils/delegating-role';

const navBarH = getNavBarHeight();
const userStore = useUserStore();
const activeRole = computed(() => userStore.activeRole);
const showPicker = computed(() => isDelegatingRole(activeRole.value));

const loading = ref(false);
const courses = ref([]);
const activeTab = ref(undefined);
const keyword = ref('');
const trainerUserId = ref(undefined);

const statusTabs = [
  { label: '全部', value: undefined },
  { label: '草稿', value: CourseStatus.DRAFT },
  { label: '待审核', value: CourseStatus.PENDING },
  { label: '已上架', value: CourseStatus.PUBLISHED },
  { label: '已驳回', value: CourseStatus.REJECTED },
  { label: '已下架', value: CourseStatus.UNPUBLISHED },
];

onShow(() => {
  if (!requireLogin()) return;
  reload();
});

watch(trainerUserId, () => reload());

function switchTab(v) {
  activeTab.value = v;
  reload();
}

async function reload() {
  loading.value = true;
  try {
    const res = await getMyCourses({
      page: 1,
      size: 50,
      status: activeTab.value,
      keyword: keyword.value.trim() || undefined,
      trainerUserId: trainerUserId.value,
    });
    courses.value = res?.list || res?.records || res?.content || [];
  } catch (_) {
    courses.value = [];
  } finally {
    loading.value = false;
  }
}

function fmtDate(v) {
  return v ? String(v).replace('T', ' ').slice(0, 16) : '';
}

function qsTrainer() {
  return trainerUserId.value ? `?trainerUserId=${trainerUserId.value}` : '';
}

function goCreate() {
  uni.navigateTo({ url: `/pages/publish/course-form${qsTrainer()}` });
}

function goEdit(id) {
  uni.navigateTo({ url: `/pages/publish/course-form?id=${id}${trainerUserId.value ? `&trainerUserId=${trainerUserId.value}` : ''}` });
}

function handleUnpublish(id) {
  uni.showModal({
    title: '下架课程',
    content: '确定下架该课程？',
    success: async (res) => {
      if (!res.confirm) return;
      await unpublishCourse(id);
      uni.showToast({ title: '已下架', icon: 'none' });
      reload();
    },
  });
}

function handleDelete(id) {
  uni.showModal({
    title: '删除课程',
    content: '删除后不可恢复，确定删除？',
    confirmColor: '#DC2626',
    success: async (res) => {
      if (!res.confirm) return;
      await deleteCourse(id);
      uni.showToast({ title: '已删除', icon: 'none' });
      reload();
    },
  });
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: $tk-bg-page; }
.page__scroll { height: 100vh; }
.page__inner { padding: $tk-sp-3; display: flex; flex-direction: column; gap: $tk-sp-3; padding-bottom: 120rpx; }
.search {
  display: flex; gap: $tk-sp-2;
  &__input { flex: 1; padding: 20rpx 24rpx; background: $tk-bg-card; border-radius: $tk-radius-md; font-size: $tk-fs-md; }
  &__btn { padding: 20rpx 28rpx; background: $tk-primary; border-radius: $tk-radius-md; color: #fff; font-size: $tk-fs-sm; }
}
.tabs { white-space: nowrap; }
.tab {
  display: inline-block; padding: 12rpx 24rpx; margin-right: 12rpx;
  background: $tk-bg-card; border-radius: $tk-radius-full;
  &__txt { font-size: $tk-fs-sm; color: $tk-text-2; }
  &--active { background: $tk-primary; .tab__txt { color: #fff; } }
}
.list { display: flex; flex-direction: column; gap: $tk-sp-2; }
.card {
  background: $tk-bg-card; border-radius: $tk-radius-lg; padding: $tk-sp-3; box-shadow: $tk-shadow-card;
  &__head { display: flex; justify-content: space-between; gap: $tk-sp-2; }
  &__title { flex: 1; font-size: $tk-fs-md; font-weight: 700; color: $tk-text-1; }
  &__status { font-size: $tk-fs-xs; color: $tk-primary; background: $tk-primary-soft; padding: 4rpx 12rpx; border-radius: $tk-radius-xs; }
  &__meta { display: block; margin-top: 8rpx; font-size: $tk-fs-xs; color: $tk-text-3; }
  &__actions { margin-top: 12rpx; display: flex; gap: $tk-sp-2; justify-content: flex-end; flex-wrap: wrap; }
  &__act { padding: 10rpx 20rpx; border: 2rpx solid $tk-divider-light; border-radius: $tk-radius-md; font-size: $tk-fs-xs; color: $tk-text-2; &--danger { color: #DC2626; border-color: rgba(220,38,38,0.3); } }
}
.fab {
  position: fixed; right: $tk-sp-4; bottom: 80rpx; width: 96rpx; height: 96rpx;
  background: $tk-primary; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  box-shadow: $tk-shadow-card-md;
  &__txt { color: #fff; font-size: 56rpx; font-weight: 300; line-height: 1; }
}
</style>
