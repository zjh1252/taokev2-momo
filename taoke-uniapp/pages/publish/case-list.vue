<!-- 我的案例列表 -->
<template>
  <view class="page">
    <TkNavBar title="我的案例" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <TkTrainerPicker v-if="showPicker" v-model="trainerUserId" :active-role="activeRole" />

        <scroll-view scroll-x class="tabs">
          <view
            v-for="t in statusTabs"
            :key="t.label"
            class="tab"
            :class="{ 'tab--active': tab === t.value }"
            @tap="switchTab(t.value)"
          >
            <text class="tab__txt">{{ t.label }}</text>
          </view>
        </scroll-view>

        <TkLoading v-if="loading" />
        <TkEmpty v-else-if="!filtered.length" text="暂无案例" />
        <view v-else class="list">
          <view v-for="item in filtered" :key="item.id" class="card" @tap="goEdit(item.id)">
            <text class="card__title">{{ item.caseTitle || '未命名案例' }}</text>
            <text class="card__meta">{{ item.enterpriseName || '—' }}</text>
            <text class="card__status">{{ CaseStatusLabel[item.status] || '—' }}</text>
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
import { getMyCases, CaseStatus, CaseStatusLabel } from '@/api/publisher-case';
import { getNavBarHeight } from '@/utils/system';
import { requireLogin } from '@/utils/auth';
import { useUserStore } from '@/stores/user';
import { isDelegatingRole } from '@/utils/delegating-role';

const navBarH = getNavBarHeight();
const userStore = useUserStore();
const activeRole = computed(() => userStore.activeRole);
const showPicker = computed(() => isDelegatingRole(activeRole.value));

const loading = ref(true);
const items = ref([]);
const tab = ref(undefined);
const trainerUserId = ref(undefined);

const statusTabs = [
  { label: '全部', value: undefined },
  { label: '待审核', value: CaseStatus.PENDING },
  { label: '已通过', value: CaseStatus.APPROVED },
  { label: '已驳回', value: CaseStatus.REJECTED },
];

const filtered = computed(() => {
  if (tab.value === undefined) return items.value;
  return items.value.filter((c) => c.status === tab.value);
});

onShow(() => {
  if (!requireLogin()) return;
  load();
});

watch(trainerUserId, () => load());

function switchTab(v) {
  tab.value = v;
}

async function load() {
  loading.value = true;
  try {
    items.value = await getMyCases(trainerUserId.value) || [];
  } catch (_) {
    items.value = [];
  } finally {
    loading.value = false;
  }
}

function qs() {
  const parts = [];
  if (trainerUserId.value) parts.push(`trainerUserId=${trainerUserId.value}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

function goCreate() {
  uni.navigateTo({ url: `/pages/publish/case-form${qs()}` });
}

function goEdit(id) {
  uni.navigateTo({ url: `/pages/publish/case-form?id=${id}${trainerUserId.value ? `&trainerUserId=${trainerUserId.value}` : ''}` });
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: $tk-bg-page; }
.page__scroll { height: 100vh; }
.page__inner { padding: $tk-sp-3; display: flex; flex-direction: column; gap: $tk-sp-3; padding-bottom: 120rpx; }
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
  &__title { font-size: $tk-fs-md; font-weight: 700; color: $tk-text-1; }
  &__meta { display: block; margin-top: 8rpx; font-size: $tk-fs-sm; color: $tk-text-3; }
  &__status { display: block; margin-top: 8rpx; font-size: $tk-fs-xs; color: $tk-primary; }
}
.fab {
  position: fixed; right: $tk-sp-4; bottom: 80rpx; width: 96rpx; height: 96rpx;
  background: $tk-primary; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  box-shadow: $tk-shadow-card-md;
  &__txt { color: #fff; font-size: 56rpx; font-weight: 300; line-height: 1; }
}
</style>
