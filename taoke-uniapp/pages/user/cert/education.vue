<!--
  专家学历认证 — 多记录列表 + 新增/编辑表单
-->
<template>
  <view class="page">
    <TkNavBar :title="showForm ? formTitle : '学历认证'" :left-icon="showForm ? '' : 'back'" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <text v-if="!showForm" class="desc">填写您的学习经历，可添加多条记录。每条记录单独审核。</text>

        <!-- 表单 -->
        <view v-if="showForm && editing" class="form-panel">
          <text class="form-panel__title">{{ editing.id ? '编辑学历记录' : '新增学历记录' }}</text>

          <view class="field">
            <text class="field__label">持证人姓名 <text class="req">*</text></text>
            <input class="field__input" :value="form.holderName" placeholder="证书上的姓名" @input="setField('holderName', $event)" />
          </view>
          <view class="field">
            <text class="field__label">院校名称 <text class="req">*</text></text>
            <input class="field__input" :value="form.schoolName" @input="setField('schoolName', $event)" />
          </view>
          <view class="field">
            <text class="field__label">所学专业 <text class="req">*</text></text>
            <input class="field__input" :value="form.major" @input="setField('major', $event)" />
          </view>
          <view class="field">
            <text class="field__label">学历</text>
            <input class="field__input" :value="form.degree" placeholder="如：本科 / 硕士" @input="setField('degree', $event)" />
          </view>
          <view class="field">
            <text class="field__label">入学日期 <text class="req">*</text></text>
            <picker mode="date" :value="form.startDate" @change="form.startDate = $event.detail.value">
              <view class="field__picker">{{ form.startDate || '请选择入学日期' }}</view>
            </picker>
          </view>
          <view class="field">
            <text class="field__label">结束日期</text>
            <picker mode="date" :value="form.endDate" @change="form.endDate = $event.detail.value">
              <view class="field__picker">{{ form.endDate || '至今可留空' }}</view>
            </picker>
          </view>
          <view class="field field--upload">
            <text class="field__label">学历证明文件 <text class="req">*</text></text>
            <TkCertFileUpload v-model="form.proofFile" label="学历证明" />
          </view>

          <view v-if="editing.id" class="progress-wrap">
            <text class="progress-wrap__title">当前进度</text>
            <TkCertProgress
              :status="editing.status ?? null"
              :audited-at="editing.auditedAt"
              :reject-reason="editing.rejectReason"
              label="本条学历认证"
            />
          </view>

          <view class="form-actions">
            <view class="form-actions__primary" @tap="handleSave">
              <text class="form-actions__primary-txt">{{ submitting ? '保存中…' : (editing.id ? '保存修改' : '提交认证') }}</text>
            </view>
            <view class="form-actions__ghost" @tap="closeForm">
              <text class="form-actions__ghost-txt">取消</text>
            </view>
          </view>
        </view>

        <!-- 列表 -->
        <template v-else>
          <TkLoading v-if="loading" />

          <view v-else-if="!records.length" class="empty">
            <text class="empty__txt">暂无学历认证记录</text>
            <view class="empty__btn" @tap="handleNew">
              <text class="empty__btn-txt">新增学历</text>
            </view>
          </view>

          <view v-else class="list">
            <view v-for="r in records" :key="r.id" class="row" @tap="handleEdit(r)">
              <view class="row__main">
                <view class="row__title-row">
                  <text class="row__school">{{ r.schoolName }}</text>
                  <text class="row__major">{{ r.major }}</text>
                  <TkCertStatusBadge :status="r.status" />
                </view>
                <text class="row__meta">
                  {{ r.startDate }} ~ {{ r.endDate || '至今' }}
                  <text v-if="r.holderName"> · 持证人：{{ r.holderName }}</text>
                </text>
                <text v-if="r.status === 3 && r.rejectReason" class="row__reject">驳回原因：{{ r.rejectReason }}</text>
              </view>
              <view class="row__actions" @tap.stop>
                <view class="row__icon" @tap="handleEdit(r)">
                  <TkIcon name="gear" :size="28" color="#666" />
                </view>
                <view class="row__icon" @tap="handleDelete(r.id)">
                  <TkIcon name="close" :size="28" color="#DC2626" />
                </view>
              </view>
            </view>
          </view>

          <view v-if="records.length" class="fab" @tap="handleNew">
            <text class="fab__txt">新增学历</text>
          </view>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import * as certApi from '@/api/certification';
import { getNavBarHeight } from '@/utils/system';

const navBarH = getNavBarHeight();

const loading = ref(true);
const submitting = ref(false);
const records = ref([]);
const showForm = ref(false);
const editing = ref(null);
const form = reactive({
  holderName: '',
  schoolName: '',
  major: '',
  degree: '',
  startDate: '',
  endDate: '',
  proofFile: '',
});

const formTitle = computed(() => (editing.value?.id ? '编辑学历' : '新增学历'));

onShow(() => { if (!showForm.value) fetchData(); });

async function fetchData() {
  loading.value = true;
  try {
    records.value = await certApi.listEducationCerts() || [];
  } catch (_) {
    records.value = [];
  } finally {
    loading.value = false;
  }
}

function resetForm(record) {
  form.holderName = record?.holderName || '';
  form.schoolName = record?.schoolName || '';
  form.major = record?.major || '';
  form.degree = record?.degree || '';
  form.startDate = record?.startDate || '';
  form.endDate = record?.endDate || '';
  form.proofFile = record?.proofFile || '';
}

function handleNew() {
  editing.value = {};
  resetForm({});
  showForm.value = true;
}

function handleEdit(r) {
  editing.value = { ...r };
  resetForm(r);
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editing.value = null;
}

function setField(key, e) {
  form[key] = e.detail?.value ?? '';
}

async function handleSave() {
  if (submitting.value) return;
  if (!form.holderName.trim()) return uni.showToast({ title: '请输入持证人姓名', icon: 'none' });
  if (!form.schoolName.trim()) return uni.showToast({ title: '请输入院校名称', icon: 'none' });
  if (!form.major.trim()) return uni.showToast({ title: '请输入所学专业', icon: 'none' });
  if (!form.startDate) return uni.showToast({ title: '请选择入学日期', icon: 'none' });
  if (form.endDate && form.endDate < form.startDate) {
    return uni.showToast({ title: '结束日期不能早于开始日期', icon: 'none' });
  }
  if (!form.proofFile) return uni.showToast({ title: '请上传学历证明文件', icon: 'none' });

  const payload = {
    holderName: form.holderName.trim(),
    schoolName: form.schoolName.trim(),
    major: form.major.trim(),
    degree: form.degree.trim(),
    startDate: form.startDate,
    endDate: form.endDate || null,
    isGraduated: 1,
    proofFile: form.proofFile,
  };

  submitting.value = true;
  try {
    if (editing.value?.id) {
      await certApi.updateEducationCert(editing.value.id, payload);
      uni.showToast({ title: '已更新，重新进入待审核', icon: 'none' });
    } else {
      await certApi.createEducationCert(payload);
      uni.showToast({ title: '已提交，等待审核', icon: 'none' });
    }
    closeForm();
    await fetchData();
  } finally {
    submitting.value = false;
  }
}

function handleDelete(id) {
  uni.showModal({
    title: '确认删除',
    content: '确认删除该学历认证记录？',
    confirmColor: '#DC2626',
    success: async (res) => {
      if (!res.confirm) return;
      await certApi.deleteEducationCert(id);
      uni.showToast({ title: '已删除', icon: 'none' });
      await fetchData();
    },
  });
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
  gap: $tk-sp-3;
  padding-bottom: 120rpx;
}

.desc {
  font-size: $tk-fs-sm;
  color: $tk-text-3;
  line-height: 1.6;
}

.req { color: #DC2626; }

.empty {
  padding: 80rpx $tk-sp-4;
  border: 2rpx dashed $tk-divider-light;
  border-radius: $tk-radius-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $tk-sp-4;

  &__txt {
    font-size: $tk-fs-sm;
    color: $tk-text-4;
  }

  &__btn {
    padding: 20rpx 48rpx;
    background: $tk-primary;
    border-radius: $tk-radius-md;
  }

  &__btn-txt {
    color: #fff;
    font-size: $tk-fs-md;
    font-weight: 600;
  }
}

.list {
  display: flex;
  flex-direction: column;
  gap: $tk-sp-2;
}

.row {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-3 $tk-sp-4;
  display: flex;
  align-items: flex-start;
  gap: $tk-sp-2;
  box-shadow: $tk-shadow-card;

  &__main { flex: 1; min-width: 0; }

  &__title-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8rpx;
  }

  &__school {
    font-size: $tk-fs-md;
    font-weight: 600;
    color: $tk-text-1;
  }

  &__major {
    font-size: $tk-fs-sm;
    color: $tk-text-3;
  }

  &__meta {
    display: block;
    margin-top: 8rpx;
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }

  &__reject {
    display: block;
    margin-top: 8rpx;
    font-size: $tk-fs-xs;
    color: #DC2626;
  }

  &__actions {
    display: flex;
    gap: 8rpx;
  }

  &__icon {
    padding: 8rpx;
  }
}

.fab {
  position: fixed;
  right: $tk-sp-4;
  bottom: 80rpx;
  padding: 20rpx 36rpx;
  background: $tk-primary;
  border-radius: $tk-radius-full;
  box-shadow: $tk-shadow-card-md;

  &__txt {
    color: #fff;
    font-size: $tk-fs-sm;
    font-weight: 700;
  }
}

.form-panel {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-4;
  box-shadow: $tk-shadow-card;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-3;

  &__title {
    font-size: $tk-fs-lg;
    font-weight: 700;
    color: $tk-text-1;
  }
}

.field {
  &__label {
    display: block;
    font-size: $tk-fs-sm;
    color: $tk-text-3;
    margin-bottom: 12rpx;
  }

  &__input, &__picker {
    width: 100%;
    padding: 20rpx 24rpx;
    background: $tk-bg-page;
    border-radius: $tk-radius-md;
    font-size: $tk-fs-md;
    color: $tk-text-1;
    box-sizing: border-box;
  }

  &--upload { margin-top: 8rpx; }
}

.progress-wrap {
  padding-top: $tk-sp-2;
  border-top: 2rpx solid $tk-divider-light;

  &__title {
    display: block;
    font-size: $tk-fs-sm;
    font-weight: 700;
    color: $tk-text-1;
    margin-bottom: $tk-sp-2;
  }
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: $tk-sp-2;
  margin-top: $tk-sp-2;

  &__primary {
    padding: 24rpx 0;
    background: $tk-primary;
    border-radius: $tk-radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__primary-txt {
    color: #fff;
    font-size: $tk-fs-md;
    font-weight: 700;
  }

  &__ghost {
    padding: 24rpx 0;
    border: 2rpx solid $tk-divider-light;
    border-radius: $tk-radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__ghost-txt {
    font-size: $tk-fs-md;
    color: $tk-text-2;
  }
}
</style>
