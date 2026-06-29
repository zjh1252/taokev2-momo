<!-- 申请发票 — 对齐 PC dashboard/orders/invoice -->
<template>
  <view class="page">
    <TkNavBar title="申请发票" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <TkLoading v-if="loading" />
        <TkEmpty v-else-if="!orderNo" text="缺少订单号" />

        <template v-else-if="existing">
          <view class="status-card">
            <text class="status-card__title">发票申请已提交</text>
            <text class="status-card__sub">{{ invoiceStatusLabel(existing.status) }}</text>
          </view>
          <view class="readonly">
            <view class="row"><text class="row__k">发票类型</text><text class="row__v">{{ invoiceTypeLabel(existing.invoiceType) }}</text></view>
            <view class="row"><text class="row__k">抬头类型</text><text class="row__v">{{ existing.titleType === 'COMPANY' ? '企业' : '个人' }}</text></view>
            <view class="row"><text class="row__k">开票金额</text><text class="row__v row__v--price">¥ {{ formatAmount(existing.amount) }}</text></view>
            <view class="row"><text class="row__k">发票抬头</text><text class="row__v">{{ existing.title }}</text></view>
            <view v-if="existing.titleType === 'COMPANY'" class="row">
              <text class="row__k">纳税人识别号</text><text class="row__v">{{ existing.taxNo }}</text>
            </view>
            <view class="row"><text class="row__k">接收邮箱</text><text class="row__v">{{ existing.email }}</text></view>
          </view>
        </template>

        <template v-else>
          <view class="tip">
            <text class="tip__txt">电子发票与纸质发票具有同等法律效力。企业抬头需填写纳税人识别号。</text>
          </view>

          <view class="form">
            <view class="field">
              <text class="field__label">发票类型</text>
              <radio-group class="radio-group" @change="onInvoiceTypeChange">
                <label v-for="opt in invoiceTypeOptions" :key="opt.value" class="radio-row">
                  <radio :value="opt.value" :checked="invoiceType === opt.value" color="#E62117" />
                  <text>{{ opt.label }}</text>
                </label>
              </radio-group>
            </view>

            <view class="field">
              <text class="field__label">抬头类型</text>
              <radio-group class="radio-group" @change="onTitleTypeChange">
                <label class="radio-row">
                  <radio value="PERSONAL" :checked="titleType === 'PERSONAL'" color="#E62117" />
                  <text>个人</text>
                </label>
                <label class="radio-row">
                  <radio value="COMPANY" :checked="titleType === 'COMPANY'" color="#E62117" />
                  <text>企业</text>
                </label>
              </radio-group>
            </view>

            <view class="field">
              <text class="field__label">发票抬头 <text class="req">*</text></text>
              <input class="field__input" :value="title" placeholder="请输入发票抬头" @input="title = $event.detail.value" />
            </view>

            <view v-if="titleType === 'COMPANY'" class="field">
              <text class="field__label">纳税人识别号 <text class="req">*</text></text>
              <input class="field__input" :value="taxNo" placeholder="统一社会信用代码" @input="taxNo = $event.detail.value" />
            </view>

            <view v-if="titleType === 'COMPANY'" class="field">
              <text class="field__label">开户银行</text>
              <input class="field__input" :value="bankName" placeholder="选填" @input="bankName = $event.detail.value" />
            </view>

            <view v-if="titleType === 'COMPANY'" class="field">
              <text class="field__label">银行账号</text>
              <input class="field__input" :value="bankAccount" placeholder="选填" @input="bankAccount = $event.detail.value" />
            </view>

            <view v-if="titleType === 'COMPANY'" class="field">
              <text class="field__label">企业地址</text>
              <input class="field__input" :value="companyAddress" placeholder="选填" @input="companyAddress = $event.detail.value" />
            </view>

            <view v-if="titleType === 'COMPANY'" class="field">
              <text class="field__label">企业电话</text>
              <input class="field__input" :value="companyPhone" placeholder="选填" @input="companyPhone = $event.detail.value" />
            </view>

            <view class="field">
              <text class="field__label">接收邮箱 <text class="req">*</text></text>
              <input class="field__input" :value="email" placeholder="用于接收电子发票" @input="email = $event.detail.value" />
            </view>

            <view class="actions">
              <view class="actions__primary" :class="{ 'is-disabled': submitting }" @tap="handleSubmit">
                <text>{{ submitting ? '提交中…' : '提交申请' }}</text>
              </view>
            </view>
          </view>
        </template>

        <view style="height: 40rpx;" />
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import * as orderApi from '@/api/order';
import * as userApi from '@/api/user';
import { getNavBarHeight } from '@/utils/system';
import { formatOrderAmount } from '@/utils/order';
import { requireLogin } from '@/utils/auth';

const navBarH = getNavBarHeight();

const orderNo = ref('');
const order = ref(null);
const existing = ref(null);
const loading = ref(true);
const submitting = ref(false);

const invoiceType = ref('NORMAL');
const titleType = ref('PERSONAL');
const title = ref('');
const taxNo = ref('');
const bankName = ref('');
const bankAccount = ref('');
const companyAddress = ref('');
const companyPhone = ref('');
const email = ref('');

const invoiceTypeOptions = [
  { value: 'NORMAL', label: '全电普通发票' },
  { value: 'SPECIAL', label: '全电专用发票' },
];

const INVOICE_STATUS_LABELS = { 0: '待开票', 1: '已开票', 2: '已驳回' };
const INVOICE_TYPE_LABELS = { NORMAL: '全电普通发票', SPECIAL: '全电专用发票' };

function invoiceStatusLabel(status) {
  return INVOICE_STATUS_LABELS[status] ?? '处理中';
}

function invoiceTypeLabel(type) {
  return INVOICE_TYPE_LABELS[type] ?? type;
}

function formatAmount(amount) {
  return formatOrderAmount(amount);
}

onLoad((opt) => {
  if (!requireLogin()) return;
  orderNo.value = opt?.orderNo || '';
  loadData();
});

async function loadData() {
  if (!orderNo.value) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const [orderRes, invoiceRes, profileRes] = await Promise.all([
      orderApi.getOrderDetail(orderNo.value),
      orderApi.getInvoiceRequest(orderNo.value).catch(() => null),
      userApi.getMyProfile().catch(() => null),
    ]);
    order.value = orderRes;
    existing.value = invoiceRes || null;
    if (profileRes?.email) {
      email.value = profileRes.email;
    }
  } catch (_) {
    uni.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function onInvoiceTypeChange(e) {
  invoiceType.value = e.detail.value;
}

function onTitleTypeChange(e) {
  titleType.value = e.detail.value;
}

async function handleSubmit() {
  if (submitting.value) return;
  if (!title.value.trim()) {
    uni.showToast({ title: '请填写发票抬头', icon: 'none' });
    return;
  }
  if (titleType.value === 'COMPANY' && !taxNo.value.trim()) {
    uni.showToast({ title: '企业抬头需填写纳税人识别号', icon: 'none' });
    return;
  }
  if (!email.value.trim()) {
    uni.showToast({ title: '请填写接收发票的邮箱', icon: 'none' });
    return;
  }

  submitting.value = true;
  try {
    const result = await orderApi.submitInvoiceRequest(orderNo.value, {
      invoiceType: invoiceType.value,
      titleType: titleType.value,
      title: title.value.trim(),
      taxNo: taxNo.value.trim(),
      bankName: bankName.value.trim(),
      bankAccount: bankAccount.value.trim(),
      companyAddress: companyAddress.value.trim(),
      companyPhone: companyPhone.value.trim(),
      email: email.value.trim(),
    });
    existing.value = result;
    uni.showToast({ title: '发票申请已提交', icon: 'success' });
  } catch (e) {
    uni.showToast({ title: e?.message || '提交失败', icon: 'none' });
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
  box-sizing: border-box;
}
.page__inner {
  padding: $tk-sp-3;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-3;
}

.tip {
  padding: $tk-sp-3;
  background: #FFFBEB;
  border: 2rpx solid #FDE68A;
  border-radius: $tk-radius-md;

  &__txt {
    font-size: $tk-fs-xs;
    color: #92400E;
    line-height: $tk-lh-normal;
  }
}

.status-card {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-4;
  box-shadow: $tk-shadow-card;

  &__title {
    font-size: $tk-fs-lg;
    font-weight: 700;
    color: #16A34A;
  }
  &__sub {
    display: block;
    margin-top: 8rpx;
    font-size: $tk-fs-sm;
    color: $tk-text-3;
  }
}

.readonly, .form {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-3;
  box-shadow: $tk-shadow-card;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: $tk-sp-2;
  padding: 16rpx 0;
  border-bottom: 2rpx solid $tk-divider-light;

  &__k {
    font-size: $tk-fs-sm;
    color: $tk-text-4;
    flex-shrink: 0;
  }
  &__v {
    font-size: $tk-fs-sm;
    color: $tk-text-1;
    text-align: right;

    &--price {
      color: $tk-primary;
      font-weight: 700;
    }
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: $tk-sp-3;

  &__label {
    font-size: $tk-fs-sm;
    color: $tk-text-2;
    font-weight: 600;
  }
  &__input {
    padding: 20rpx 24rpx;
    background: $tk-bg-page;
    border-radius: $tk-radius-md;
    font-size: $tk-fs-md;
  }
}

.req { color: $tk-primary; }

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: $tk-sp-3;
}
.radio-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: $tk-fs-sm;
  color: $tk-text-2;
}

.actions__primary {
  padding: 24rpx;
  border-radius: $tk-radius-full;
  background: $tk-primary;
  text-align: center;
  color: #fff;
  font-weight: 700;

  &.is-disabled { opacity: 0.6; }
}
</style>
