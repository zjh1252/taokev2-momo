<!-- 课程发布/编辑表单 MVP -->
<template>
  <view class="page">
    <TkNavBar :title="courseId ? '编辑课程' : '发布课程'" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <view class="form">
          <view class="field">
            <text class="field__label">课程标题 <text class="req">*</text></text>
            <input class="field__input" :value="form.title" placeholder="请输入课程标题" @input="setField('title', $event)" />
          </view>

          <view class="field">
            <text class="field__label">一级分类</text>
            <picker mode="selector" :range="catL1" range-key="name" :value="catL1Index" @change="onCatL1Change">
              <view class="field__picker">{{ catL1[catL1Index]?.name || '请选择一级分类' }}</view>
            </picker>
          </view>
          <view class="field">
            <text class="field__label">二级分类</text>
            <picker mode="selector" :range="catL2" range-key="name" :value="catL2Index" @change="onCatL2Change">
              <view class="field__picker">{{ catL2[catL2Index]?.name || '请选择二级分类' }}</view>
            </picker>
          </view>

          <view class="field field--upload">
            <text class="field__label">课程封面</text>
            <TkMediaUpload v-model="form.coverUrl" label="上传封面" />
          </view>

          <view class="field">
            <text class="field__label">课程天数</text>
            <input class="field__input" type="number" :value="form.durationDays" placeholder="如 3" @input="setNum('durationDays', $event)" />
          </view>
          <view class="field">
            <text class="field__label">总时长（小时）</text>
            <input class="field__input" type="digit" :value="form.totalHours" placeholder="如 24" @input="setField('totalHours', $event)" />
          </view>
          <view class="field">
            <text class="field__label">价格（元）</text>
            <input class="field__input" type="digit" :value="form.price" placeholder="如 9800" @input="setField('price', $event)" />
          </view>

          <view class="field">
            <text class="field__label">课程介绍</text>
            <textarea class="field__textarea" :value="form.intro" placeholder="课程详细介绍" @input="setField('intro', $event)" />
          </view>
          <view class="field">
            <text class="field__label">课程大纲</text>
            <textarea class="field__textarea" :value="form.syllabus" placeholder="课程大纲内容" @input="setField('syllabus', $event)" />
          </view>

          <view class="field">
            <text class="field__label">是否有公开课计划</text>
            <radio-group @change="onHasPlanChange">
              <label class="radio-row"><radio value="1" :checked="form.hasPlan === 1" color="#E62117" /><text>是</text></label>
              <label class="radio-row"><radio value="0" :checked="form.hasPlan === 0" color="#E62117" /><text>否</text></label>
            </radio-group>
          </view>

          <view class="actions">
            <view class="actions__ghost" @tap="handleSave(true)">
              <text>{{ submitting ? '保存中…' : '存草稿' }}</text>
            </view>
            <view class="actions__primary" @tap="handleSave(false)">
              <text>{{ submitting ? '提交中…' : '提交审核' }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getCategoryTree } from '@/api/category';
import {
  getMyCourseDetail,
  createCourse,
  updateCourse,
  submitCourse,
} from '@/api/publisher-course';
import { getNavBarHeight } from '@/utils/system';
import { requireLogin } from '@/utils/auth';

const navBarH = getNavBarHeight();
const courseId = ref(null);
const trainerUserId = ref(undefined);
const submitting = ref(false);
const categoryTree = ref([]);

const form = reactive({
  title: '',
  categoryId: null,
  subCategoryId: null,
  coverUrl: '',
  durationDays: '',
  totalHours: '',
  price: '',
  intro: '',
  syllabus: '',
  hasPlan: 0,
});

const catL1 = computed(() => categoryTree.value || []);
const catL1Index = computed(() => {
  const idx = catL1.value.findIndex((c) => c.id === form.categoryId);
  return idx >= 0 ? idx : 0;
});
const catL2 = computed(() => catL1.value[catL1Index.value]?.children || []);
const catL2Index = computed(() => {
  const idx = catL2.value.findIndex((c) => c.id === form.subCategoryId);
  return idx >= 0 ? idx : 0;
});

onLoad(async (opts) => {
  if (!requireLogin()) return;
  if (opts?.id) courseId.value = Number(opts.id);
  if (opts?.trainerUserId) trainerUserId.value = Number(opts.trainerUserId);
  await loadCategories();
  if (courseId.value) await loadDetail();
});

async function loadCategories() {
  try {
    categoryTree.value = await getCategoryTree('COURSE_CATEGORY') || [];
  } catch (_) {
    categoryTree.value = [];
  }
}

async function loadDetail() {
  const d = await getMyCourseDetail(courseId.value);
  form.title = d.title || '';
  form.categoryId = d.categoryId || null;
  form.subCategoryId = d.subCategoryId || null;
  form.coverUrl = d.coverUrl || '';
  form.durationDays = d.durationDays != null ? String(d.durationDays) : '';
  form.totalHours = d.totalHours != null ? String(d.totalHours) : '';
  form.price = d.price != null ? String(d.price) : '';
  form.intro = d.intro || '';
  form.syllabus = d.syllabus || '';
  form.hasPlan = d.hasPlan ?? 0;
}

function setField(key, e) {
  form[key] = e.detail?.value ?? '';
}

function setNum(key, e) {
  const v = e.detail?.value ?? '';
  form[key] = v;
}

function onCatL1Change(e) {
  const idx = Number(e.detail.value);
  const c = catL1.value[idx];
  form.categoryId = c?.id || null;
  form.subCategoryId = c?.children?.[0]?.id || null;
}

function onCatL2Change(e) {
  const idx = Number(e.detail.value);
  form.subCategoryId = catL2.value[idx]?.id || null;
}

function onHasPlanChange(e) {
  form.hasPlan = Number(e.detail.value);
}

function buildPayload(draft) {
  return {
    title: form.title.trim(),
    draft,
    categoryId: form.categoryId,
    subCategoryId: form.subCategoryId,
    coverUrl: form.coverUrl || undefined,
    durationDays: form.durationDays ? Number(form.durationDays) : undefined,
    totalHours: form.totalHours ? Number(form.totalHours) : undefined,
    price: form.price ? Number(form.price) : undefined,
    intro: form.intro.trim() || undefined,
    syllabus: form.syllabus.trim() || undefined,
    hasPlan: form.hasPlan,
  };
}

async function handleSave(draft) {
  if (submitting.value) return;
  if (!form.title.trim()) return uni.showToast({ title: '请输入课程标题', icon: 'none' });
  submitting.value = true;
  try {
    const payload = buildPayload(draft);
    if (courseId.value) {
      await updateCourse(courseId.value, payload);
      if (!draft) await submitCourse(courseId.value);
    } else {
      const created = await createCourse(payload, trainerUserId.value);
      const id = created?.id;
      if (!draft && id) await submitCourse(id);
    }
    uni.showToast({ title: draft ? '草稿已保存' : '已提交审核', icon: 'none' });
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
  &__input, &__picker, &__textarea {
    width: 100%; padding: 20rpx 24rpx; background: $tk-bg-page; border-radius: $tk-radius-md;
    font-size: $tk-fs-md; color: $tk-text-1; box-sizing: border-box;
  }
  &__textarea { min-height: 180rpx; }
  &--upload { margin-top: 4rpx; }
}
.req { color: #DC2626; }
.radio-row { display: inline-flex; align-items: center; gap: 8rpx; margin-right: 32rpx; font-size: $tk-fs-md; color: $tk-text-1; }
.actions {
  display: flex; flex-direction: column; gap: $tk-sp-2; margin-top: $tk-sp-2;
  &__ghost, &__primary { padding: 24rpx 0; border-radius: $tk-radius-md; text-align: center; font-size: $tk-fs-md; font-weight: 700; }
  &__ghost { border: 2rpx solid $tk-divider-light; color: $tk-text-2; }
  &__primary { background: $tk-primary; color: #fff; }
}
</style>
