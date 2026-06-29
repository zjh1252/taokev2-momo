<!--
  结算确认页 — 对齐 PC /checkout，支持微信/支付宝/模拟支付
-->
<template>
  <view class="page">
    <TkNavBar title="确认订单" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <TkLoading v-if="loading" />
        <TkEmpty v-else-if="!order" text="订单不存在" />

        <template v-else>
          <view class="status-card" :class="orderStatusClass(order.status)">
            <text class="status-card__label">{{ order.statusLabel || '订单状态' }}</text>
            <text v-if="order.status === 0 && countdownText" class="status-card__sub">
              请在 {{ countdownText }} 内完成支付
            </text>
          </view>

          <view class="section">
            <text class="section__title">商品信息</text>
            <view v-for="item in order.items || []" :key="item.id" class="item">
              <image
                v-if="item.productCover"
                class="item__cover"
                :src="toAssetUrl(item.productCover)"
                mode="aspectFill"
              />
              <view v-else class="item__cover item__cover--ph">
                <TkIcon name="course" :size="40" color="#bbb" />
              </view>
              <view class="item__meta">
                <text class="item__title">{{ item.productTitle }}</text>
                <text class="item__type">{{ item.productTypeLabel || item.productType }}</text>
                <text class="item__price">¥ {{ formatOrderAmount(item.subtotal ?? item.price) }}</text>
              </view>
            </view>
          </view>

          <view class="section">
            <view class="row">
              <text class="row__label">订单编号</text>
              <text class="row__value">{{ order.orderNo }}</text>
            </view>
            <view class="row">
              <text class="row__label">应付金额</text>
              <text class="row__value row__value--price">¥ {{ formatOrderAmount(order.payAmount) }}</text>
            </view>
          </view>
        </template>

        <view style="height: 180rpx;" />
      </view>
    </scroll-view>

    <view v-if="order && order.status === 0" class="footer">
      <view class="footer__btn footer__btn--ghost" @tap="onCancel">
        <text class="footer__btn-txt footer__btn-txt--ghost">取消订单</text>
      </view>
      <view class="footer__btn footer__btn--primary" @tap="openPaySheet">
        <text class="footer__btn-txt footer__btn-txt--primary">{{ paying ? '支付中...' : '立即支付' }}</text>
      </view>
    </view>

    <view v-else-if="order && order.status === 1" class="footer">
      <view class="footer__btn footer__btn--ghost footer__btn--compact" @tap="onReview">
        <text class="footer__btn-txt footer__btn-txt--ghost">评价</text>
      </view>
      <view class="footer__btn footer__btn--ghost footer__btn--compact" @tap="onConsult">
        <text class="footer__btn-txt footer__btn-txt--ghost">咨询</text>
      </view>
      <view class="footer__btn footer__btn--primary" @tap="onInvoice">
        <text class="footer__btn-txt footer__btn-txt--primary">申请发票</text>
      </view>
    </view>

    <view v-else-if="order && order.status === 2" class="footer">
      <view class="footer__btn footer__btn--ghost" @tap="onConsult">
        <text class="footer__btn-txt footer__btn-txt--ghost">立即咨询</text>
      </view>
      <view class="footer__btn footer__btn--primary" @tap="onRepurchase">
        <text class="footer__btn-txt footer__btn-txt--primary">重新购买</text>
      </view>
    </view>

    <view v-if="showPaySheet" class="pay-mask" @tap="closePaySheet">
      <view class="pay-sheet" @tap.stop>
        <text class="pay-sheet__title">选择支付方式</text>
        <text class="pay-sheet__amount">¥ {{ formatOrderAmount(order?.payAmount) }}</text>

        <view
          v-for="item in payMethods"
          :key="item.value"
          class="pay-sheet__item"
          :class="{ 'is-active': payMethod === item.value }"
          @tap="payMethod = item.value"
        >
          <text class="pay-sheet__item-label">{{ item.label }}</text>
        </view>

        <view class="pay-sheet__btn" @tap="onConfirmPay">
          <text class="pay-sheet__btn-txt">确认支付</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import * as orderApi from '@/api/order';
import { toAssetUrl } from '@/utils/asset';
import {
  formatOrderAmount,
  getWatchVideoIdFromOrder,
  orderStatusClass,
} from '@/utils/order';
import { getNavBarHeight } from '@/utils/system';
import {
  canUseMockPayment,
  checkoutPay,
  getDefaultPaymentMethod,
  resolveWechatOpenId,
} from '@/utils/payment';
import { callServicePhone } from '@/utils/consult';

const navBarH = getNavBarHeight();

const orderNo = ref('');
const order = ref(null);
const loading = ref(false);
const paying = ref(false);
const showPaySheet = ref(false);
const payMethod = ref(getDefaultPaymentMethod());
const remainingMs = ref(0);
let timer = null;

const payMethods = computed(() => {
  const list = [
    { value: 'WECHAT', label: '微信支付' },
    { value: 'ALIPAY', label: '支付宝' },
  ];
  if (canUseMockPayment()) {
    list.push({ value: 'MOCK', label: '模拟支付（开发）' });
  }
  return list;
});

const countdownText = computed(() => {
  if (remainingMs.value <= 0) return '';
  const totalSec = Math.floor(remainingMs.value / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

function startCountdown(expiredAt) {
  if (!expiredAt) return;
  const end = new Date(String(expiredAt).replace(' ', 'T')).getTime();
  if (Number.isNaN(end)) return;
  const tick = () => {
    remainingMs.value = Math.max(0, end - Date.now());
    if (remainingMs.value <= 0 && timer) {
      clearInterval(timer);
      timer = null;
      loadOrder();
    }
  };
  tick();
  timer = setInterval(tick, 1000);
}

async function loadOrder() {
  if (!orderNo.value) return;
  loading.value = true;
  try {
    order.value = await orderApi.getOrderDetail(orderNo.value);
    if (order.value?.status === 0 && order.value.expiredAt) {
      if (timer) clearInterval(timer);
      startCountdown(order.value.expiredAt);
    }
  } catch (_) {
    order.value = null;
  } finally {
    loading.value = false;
  }
}

function openPaySheet() {
  if (!order.value || paying.value) return;
  showPaySheet.value = true;
}

function closePaySheet() {
  if (paying.value) return;
  showPaySheet.value = false;
}

async function onConfirmPay() {
  if (!order.value || paying.value) return;
  paying.value = true;
  try {
    let openId;
    // #ifdef MP-WEIXIN
    if (payMethod.value === 'WECHAT') {
      openId = await resolveWechatOpenId();
    }
    // #endif

    await checkoutPay({
      orderNo: order.value.orderNo,
      method: payMethod.value,
      openId,
    });

    showPaySheet.value = false;
    uni.showToast({ title: '支付成功', icon: 'success' });
    await loadOrder();
    redirectAfterPaid();
  } catch (e) {
    uni.showToast({ title: e?.message || e?.errMsg || '支付失败', icon: 'none' });
  } finally {
    paying.value = false;
  }
}

function redirectAfterPaid() {
  const videoId = getWatchVideoIdFromOrder(order.value);
  if (videoId) {
    setTimeout(() => {
      uni.redirectTo({ url: `/pages/video/play?id=${videoId}` });
    }, 800);
  }
}

function onCancel() {
  if (!order.value) return;
  uni.showModal({
    title: '取消订单',
    content: '确定要取消该订单吗？',
    confirmColor: '#E62117',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await orderApi.cancelOrder(order.value.orderNo);
        uni.showToast({ title: '已取消', icon: 'none' });
        uni.redirectTo({ url: '/pages/order/list' });
      } catch (e) {
        uni.showToast({ title: e?.message || '取消失败', icon: 'none' });
      }
    },
  });
}

function onConsult() {
  callServicePhone();
}

function onReview() {
  const item = order.value?.items?.[0];
  if (!item) {
    uni.showToast({ title: '订单商品信息缺失', icon: 'none' });
    return;
  }
  const title = encodeURIComponent(item.productTitle || '');
  uni.navigateTo({
    url: `/pages/review/submit?orderNo=${order.value.orderNo}&productType=${item.productType}&productId=${item.productId}&productTitle=${title}`,
  });
}

function onInvoice() {
  if (!order.value?.orderNo) return;
  uni.navigateTo({ url: `/pages/order/invoice?orderNo=${order.value.orderNo}` });
}

async function onRepurchase() {
  const item = order.value?.items?.[0];
  if (!item?.productId) {
    uni.showToast({ title: '无法重新购买', icon: 'none' });
    return;
  }
  if (item.productType === 'OPEN_COURSE') {
    uni.navigateTo({ url: `/pages/course/detail?id=${item.productId}` });
    return;
  }
  try {
    const created = await orderApi.createOrder({
      directItem: {
        productType: item.productType,
        productId: item.productId,
        quantity: 1,
      },
    });
    uni.navigateTo({ url: `/pages/order/checkout?orderNo=${created.orderNo}` });
  } catch (e) {
    uni.showToast({ title: e?.message || '下单失败', icon: 'none' });
  }
}

function onDone() {
  uni.redirectTo({ url: '/pages/order/list' });
}

onLoad((opt) => {
  orderNo.value = opt?.orderNo || '';
  loadOrder();
});

onShow(() => {
  if (orderNo.value && order.value?.status === 0) {
    loadOrder();
  }
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  background: $tk-bg-page;
  position: relative;
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

.status-card {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-4;
  box-shadow: $tk-shadow-card;

  &__label {
    font-size: $tk-fs-xl;
    font-weight: 800;
    color: $tk-text-1;
  }
  &__sub {
    display: block;
    margin-top: 8rpx;
    font-size: $tk-fs-sm;
    color: $tk-primary;
  }
  &.is-pending &__label { color: $tk-primary; }
  &.is-paid &__label { color: #16A34A; }
}

.section {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-3;
  box-shadow: $tk-shadow-card;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-2;

  &__title {
    font-size: $tk-fs-md;
    font-weight: 700;
    color: $tk-text-1;
    padding-bottom: $tk-sp-2;
    border-bottom: 2rpx solid $tk-divider-light;
  }
}

.item {
  display: flex;
  gap: $tk-sp-3;

  &__cover {
    width: 128rpx;
    height: 128rpx;
    border-radius: $tk-radius-sm;
    background: $tk-divider-light;
    flex-shrink: 0;

    &--ph {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  &__meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
  }
  &__title {
    font-size: $tk-fs-md;
    font-weight: 600;
    color: $tk-text-1;
    @include tk-ellipsis(2);
  }
  &__type {
    font-size: $tk-fs-xs;
    color: $tk-text-3;
  }
  &__price {
    font-size: $tk-fs-md;
    font-weight: 700;
    color: $tk-primary;
  }
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;

  &__label {
    font-size: $tk-fs-sm;
    color: $tk-text-3;
  }
  &__value {
    font-size: $tk-fs-sm;
    color: $tk-text-1;

    &--price {
      font-size: $tk-fs-xl;
      font-weight: 800;
      color: $tk-primary;
    }
  }
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: $tk-sp-3 $tk-sp-3 calc(#{$tk-sp-3} + env(safe-area-inset-bottom));
  background: $tk-bg-card;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.06);
  display: flex;
  gap: $tk-sp-2;

  &--single {
    .footer__btn { flex: 1; }
  }

  &__btn {
    flex: 1;
    padding: 24rpx 0;
    border-radius: $tk-radius-full;
    display: flex;
    align-items: center;
    justify-content: center;

    &--compact {
      flex: 0 0 160rpx;
    }

    &--ghost {
      border: 2rpx solid $tk-divider;
      background: $tk-bg-card;
    }
    &--primary {
      background: $tk-primary;
      box-shadow: $tk-shadow-primary;
    }
  }
  &__btn-txt {
    font-size: $tk-fs-md;
    font-weight: 700;

    &--ghost { color: $tk-text-2; }
    &--primary { color: #fff; }
  }
}

.pay-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}

.pay-sheet {
  width: 100%;
  background: $tk-bg-card;
  border-radius: $tk-radius-lg $tk-radius-lg 0 0;
  padding: $tk-sp-4 $tk-sp-3 calc(#{$tk-sp-4} + env(safe-area-inset-bottom));

  &__title {
    display: block;
    text-align: center;
    font-size: $tk-fs-lg;
    font-weight: 700;
    color: $tk-text-1;
  }
  &__amount {
    display: block;
    text-align: center;
    margin-top: 8rpx;
    margin-bottom: $tk-sp-3;
    font-size: 40rpx;
    font-weight: 800;
    color: $tk-primary;
  }
  &__item {
    padding: 28rpx 24rpx;
    border: 2rpx solid $tk-divider-light;
    border-radius: $tk-radius-md;
    margin-bottom: $tk-sp-2;

    &.is-active {
      border-color: $tk-primary;
      background: rgba(230, 33, 23, 0.06);
    }
  }
  &__item-label {
    font-size: $tk-fs-md;
    color: $tk-text-1;
    font-weight: 600;
  }
  &__btn {
    margin-top: $tk-sp-2;
    background: $tk-primary;
    border-radius: $tk-radius-full;
    padding: 24rpx 0;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: $tk-shadow-primary;
  }
  &__btn-txt {
    color: #fff;
    font-size: $tk-fs-md;
    font-weight: 700;
  }
}
</style>
