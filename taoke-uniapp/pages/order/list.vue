<!--
  我的订单 — 对齐 PC 用户中心订单列表
-->
<template>
  <view class="page">
    <TkNavBar title="我的订单" left-icon="back" />

    <view class="tabs" :style="{ top: navBarH + 'px' }">
      <view
        v-for="t in TABS"
        :key="t.key"
        class="tabs__item"
        :class="{ 'is-active': activeStatus === t.key }"
        @tap="switchTab(t.key)"
      >
        <text class="tabs__txt">{{ t.label }}</text>
        <view v-if="activeStatus === t.key" class="tabs__bar" />
      </view>
    </view>

    <scroll-view
      scroll-y
      class="page__scroll"
      :style="{ paddingTop: navBarH + 88 + 'px' }"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <view class="page__inner">
        <TkLoading v-if="loading && !list.length" />
        <TkEmpty v-else-if="!loading && !list.length" icon="cart" text="暂无订单" />

        <view
          v-else
          v-for="o in list"
          :key="o.orderNo"
          class="order-card"
          @tap="goCheckout(o)"
        >
          <view class="order-card__head">
            <text class="order-card__no">{{ o.orderNo }}</text>
            <text class="order-card__status" :class="orderStatusClass(o.status)">
              {{ o.statusLabel }}
            </text>
          </view>
          <view v-for="item in (o.items || []).slice(0, 2)" :key="item.id" class="order-card__item">
            <text class="order-card__title">{{ item.productTitle }}</text>
            <text class="order-card__price">¥ {{ formatOrderAmount(item.subtotal ?? item.price) }}</text>
          </view>
          <view class="order-card__foot">
            <text class="order-card__time">{{ formatTime(o.createdAt) }}</text>
            <text class="order-card__total">合计 ¥ {{ formatOrderAmount(o.payAmount) }}</text>
          </view>
          <view v-if="o.status === 0" class="order-card__actions">
            <view class="order-card__btn" @tap.stop="goCheckout(o)">
              <text class="order-card__btn-txt">去支付</text>
            </view>
          </view>
        </view>

        <view v-if="loadingMore" class="more"><TkLoading /></view>
        <view v-else-if="finished && list.length" class="more">
          <text class="more__txt">— 已经到底啦 —</text>
        </view>

        <view style="height: 40rpx;" />
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import * as orderApi from '@/api/order';
import { requireLogin } from '@/utils/auth';
import { formatOrderAmount, orderStatusClass } from '@/utils/order';
import { getNavBarHeight } from '@/utils/system';

const navBarH = getNavBarHeight();

const TABS = [
  { key: 'all', label: '全部' },
  { key: 0, label: '待支付' },
  { key: 1, label: '已支付' },
];

const activeStatus = ref('all');
const list = ref([]);
const loading = ref(false);
const loadingMore = ref(false);
const refreshing = ref(false);
const finished = ref(false);
const page = ref(1);
const size = 10;

function formatTime(t) {
  if (!t) return '';
  return String(t).replace('T', ' ').slice(0, 16);
}

async function loadList(reset = false) {
  if (reset) {
    page.value = 1;
    finished.value = false;
  }
  if (reset) loading.value = true;
  else loadingMore.value = true;

  const params = { page: page.value, size };
  if (activeStatus.value !== 'all') params.status = activeStatus.value;

  try {
    const resp = await orderApi.listOrders(params);
    const records = resp?.list || resp?.records || resp?.content || [];
    if (reset) list.value = records;
    else list.value = list.value.concat(records);

    const total = resp?.total ?? resp?.totalElements ?? list.value.length;
    if (list.value.length >= total || records.length < size) finished.value = true;
    else page.value += 1;
  } catch (_) {
    if (reset) list.value = [];
  } finally {
    loading.value = false;
    loadingMore.value = false;
    refreshing.value = false;
  }
}

function switchTab(key) {
  if (activeStatus.value === key) return;
  activeStatus.value = key;
  loadList(true);
}

function loadMore() {
  if (loadingMore.value || finished.value || loading.value) return;
  loadList(false);
}

async function onRefresh() {
  refreshing.value = true;
  await loadList(true);
}

function goCheckout(o) {
  uni.navigateTo({ url: `/pages/order/checkout?orderNo=${o.orderNo}` });
}

onMounted(() => {
  if (!requireLogin()) return;
  loadList(true);
});

onShow(() => {
  if (list.value.length) loadList(true);
});
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  background: $tk-bg-page;
}
.tabs {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  background: $tk-bg-card;
  border-bottom: 2rpx solid $tk-divider-light;

  &__item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: $tk-sp-3 0 $tk-sp-2;
    position: relative;
  }
  &__txt {
    font-size: $tk-fs-md;
    color: $tk-text-2;
  }
  &__item.is-active &__txt {
    color: $tk-primary;
    font-weight: 700;
  }
  &__bar {
    position: absolute;
    bottom: 0;
    width: 48rpx;
    height: 6rpx;
    background: $tk-primary;
    border-radius: $tk-radius-full;
  }
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

.order-card {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-3;
  box-shadow: $tk-shadow-card;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-2;

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: $tk-sp-2;
    border-bottom: 2rpx solid $tk-divider-light;
  }
  &__no {
    font-size: $tk-fs-xs;
    color: $tk-text-3;
  }
  &__status {
    font-size: $tk-fs-sm;
    font-weight: 600;
    &.is-pending { color: $tk-primary; }
    &.is-paid { color: #16A34A; }
    &.is-cancelled { color: $tk-text-4; }
  }
  &__item {
    display: flex;
    justify-content: space-between;
    gap: $tk-sp-2;
  }
  &__title {
    flex: 1;
    font-size: $tk-fs-md;
    color: $tk-text-1;
    @include tk-ellipsis(2);
  }
  &__price {
    font-size: $tk-fs-sm;
    color: $tk-text-2;
    flex-shrink: 0;
  }
  &__foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: $tk-sp-2;
  }
  &__time {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }
  &__total {
    font-size: $tk-fs-md;
    font-weight: 700;
    color: $tk-text-1;
  }
  &__actions {
    display: flex;
    justify-content: flex-end;
  }
  &__btn {
    padding: 12rpx 32rpx;
    border-radius: $tk-radius-full;
    background: $tk-primary-soft;
  }
  &__btn-txt {
    font-size: $tk-fs-sm;
    color: $tk-primary;
    font-weight: 600;
  }
}

.more {
  padding: $tk-sp-3 0;
  text-align: center;
  &__txt {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }
}
</style>
