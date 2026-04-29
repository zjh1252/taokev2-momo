<!--
  我的（tab 4）—— 我的淘课网首页
  - 顶部红色品牌区 + 头像/昵称/角色徽标
  - 数据卡（学习 / 收藏 / 消息）
  - 菜单组 1：常用（我的收藏 / 消息中心 / 我的学习占位 / 我的订单占位）
  - 菜单组 2：账号（基础信息 / 修改密码 / 账号绑定占位 / 修改身份占位）
  - 退出登录（带二次确认）
  未登录时整屏显示登录引导
-->
<template>
  <view class="page">
    <TkNavBar title="我的" :title-color="'#fff'" :icon-color="'#fff'" transparent />

    <scroll-view scroll-y class="page__scroll">
      <!-- 顶部红色 Hero（沉浸式：红色一直延伸到屏幕顶部，TkNavBar 透明浮在上面） -->
      <view class="hero" :style="{ paddingTop: (navBarH + 12) + 'px' }">
        <!-- 已登录：头像 + 昵称 + 角色 -->
        <view v-if="userStore.isLoggedIn" class="hero__user">
          <TkAvatar
            :src="userStore.avatar"
            :nickname="userStore.nickname"
            :size="160"
            bordered
            @tap="goProfile"
          />
          <view class="hero__user-meta">
            <text class="hero__user-name">{{ userStore.nickname || '用户' }}</text>
            <view v-if="roleLabels.length" class="hero__roles">
              <text v-for="r in roleLabels" :key="r" class="hero__role">{{ r }}</text>
            </view>
            <text v-else class="hero__user-id">学号 {{ userIdLabel }}</text>
          </view>
        </view>

        <!-- 未登录：CTA -->
        <view v-else class="hero__guest">
          <view class="hero__guest-avatar">
            <TkIcon name="person" :size="80" color="#fff" />
          </view>
          <view class="hero__guest-meta">
            <text class="hero__guest-title">未登录</text>
            <text class="hero__guest-sub">登录后查看个人信息与学习记录</text>
          </view>
          <view class="hero__guest-btn" @tap="goLogin">
            <text class="hero__guest-btn-txt">登录 / 注册</text>
          </view>
        </view>
      </view>

      <view class="page__inner">
        <!-- 数据卡 -->
        <view class="stats">
          <view class="stats__item" @tap="goLearning">
            <text class="stats__num">{{ stats.learning }}</text>
            <text class="stats__label">在学课程</text>
          </view>
          <view class="stats__divider" />
          <view class="stats__item" @tap="goFavorites">
            <text class="stats__num">{{ stats.favorites }}</text>
            <text class="stats__label">我的收藏</text>
          </view>
          <view class="stats__divider" />
          <view class="stats__item" @tap="goMessages">
            <view class="stats__num-wrap">
              <text class="stats__num">{{ stats.messages }}</text>
              <view v-if="stats.unread > 0" class="stats__dot" />
            </view>
            <text class="stats__label">消息中心</text>
          </view>
        </view>

        <!-- 菜单组：常用 -->
        <view class="menu">
          <view class="menu__title">
            <text class="menu__title-txt">常用</text>
          </view>
          <view class="menu__list">
            <view class="menu__row" @tap="goFavorites">
              <view class="menu__row-l">
                <view class="menu__icon menu__icon--red">
                  <TkIcon name="heart" :size="32" color="#E62117" />
                </view>
                <text class="menu__row-txt">我的收藏</text>
              </view>
              <TkIcon name="chevron-right" :size="28" color="#C2C8D0" />
            </view>
            <view class="menu__row" @tap="goMessages">
              <view class="menu__row-l">
                <view class="menu__icon menu__icon--blue">
                  <TkIcon name="campaign" :size="32" color="#2563EB" />
                </view>
                <text class="menu__row-txt">消息中心</text>
              </view>
              <view class="menu__row-r">
                <view v-if="stats.unread > 0" class="menu__badge">
                  <text class="menu__badge-txt">{{ stats.unread > 99 ? '99+' : stats.unread }}</text>
                </view>
                <TkIcon name="chevron-right" :size="28" color="#C2C8D0" />
              </view>
            </view>
            <view class="menu__row" @tap="goLearning">
              <view class="menu__row-l">
                <view class="menu__icon menu__icon--orange">
                  <TkIcon name="course" :size="32" color="#F59E0B" />
                </view>
                <text class="menu__row-txt">我的学习</text>
              </view>
              <view class="menu__row-r">
                <text class="menu__row-tip">即将上线</text>
                <TkIcon name="chevron-right" :size="28" color="#C2C8D0" />
              </view>
            </view>
            <view class="menu__row menu__row--last" @tap="goOrders">
              <view class="menu__row-l">
                <view class="menu__icon menu__icon--green">
                  <TkIcon name="cart" :size="32" color="#16A34A" />
                </view>
                <text class="menu__row-txt">我的订单</text>
              </view>
              <view class="menu__row-r">
                <text class="menu__row-tip">即将上线</text>
                <TkIcon name="chevron-right" :size="28" color="#C2C8D0" />
              </view>
            </view>
          </view>
        </view>

        <!-- 菜单组：账号 -->
        <view class="menu">
          <view class="menu__title">
            <text class="menu__title-txt">账号</text>
          </view>
          <view class="menu__list">
            <view class="menu__row" @tap="goProfile">
              <view class="menu__row-l">
                <view class="menu__icon menu__icon--gray">
                  <TkIcon name="person" :size="32" color="#666" />
                </view>
                <text class="menu__row-txt">基础信息</text>
              </view>
              <TkIcon name="chevron-right" :size="28" color="#C2C8D0" />
            </view>
            <view class="menu__row" @tap="goPassword">
              <view class="menu__row-l">
                <view class="menu__icon menu__icon--gray">
                  <TkIcon name="lock" :size="32" color="#666" />
                </view>
                <text class="menu__row-txt">修改密码</text>
              </view>
              <TkIcon name="chevron-right" :size="28" color="#C2C8D0" />
            </view>
            <view class="menu__row" @tap="goBind">
              <view class="menu__row-l">
                <view class="menu__icon menu__icon--gray">
                  <TkIcon name="phone" :size="32" color="#666" />
                </view>
                <text class="menu__row-txt">账号绑定</text>
              </view>
              <view class="menu__row-r">
                <text class="menu__row-tip">即将上线</text>
                <TkIcon name="chevron-right" :size="28" color="#C2C8D0" />
              </view>
            </view>
            <view class="menu__row menu__row--last" @tap="goSwitchRole">
              <view class="menu__row-l">
                <view class="menu__icon menu__icon--gray">
                  <TkIcon name="vip" :size="32" color="#666" />
                </view>
                <text class="menu__row-txt">修改身份</text>
              </view>
              <view class="menu__row-r">
                <text class="menu__row-tip">即将上线</text>
                <TkIcon name="chevron-right" :size="28" color="#C2C8D0" />
              </view>
            </view>
          </view>
        </view>

        <!-- 退出登录 -->
        <view v-if="userStore.isLoggedIn" class="logout-row" @tap="confirmLogout">
          <text class="logout-row__txt">退出登录</text>
        </view>

        <text class="footer-tip">淘课网 · 让学习更简单</text>

        <view style="height: 40rpx;" />
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import * as notificationApi from '@/api/notification';
import * as interactionApi from '@/api/interaction';

const sysInfo = uni.getSystemInfoSync();
const navBarH = (sysInfo.statusBarHeight || 20) + 44;
const userStore = useUserStore();

const stats = ref({ learning: 0, favorites: 0, messages: 0, unread: 0 });

// 后端业务角色 code → 中文
const ROLE_LABELS = {
  STUDENT: '学员',
  TRAINER: '专家',
  INSTITUTION: '培训机构',
  AGENT: '经纪人',
  AGENCY: '经纪公司',
  ENTERPRISE: '企业',
};

const roleLabels = computed(() =>
  (userStore.roleCodes || [])
    .map((code) => ROLE_LABELS[code] || code)
    .filter(Boolean)
    .slice(0, 4),
);

const userIdLabel = computed(() => {
  const id = userStore.profile?.id;
  return id ? `C${String(id).padStart(5, '0')}` : '——';
});

onShow(async () => {
  if (!userStore.isLoggedIn) return;
  // 拉新版资料（保证 onShow 时数据是最新的，比如刚改完头像/昵称回来）
  userStore.fetchProfile();
  refreshStats();
});

async function refreshStats() {
  // 三个轻量请求并发拉，失败容忍
  const tasks = [
    notificationApi.getUnreadCount().catch(() => 0),
    interactionApi.listFavorites({ page: 0, size: 1 }).catch(() => null),
  ];
  const [unread, favPage] = await Promise.all(tasks);
  stats.value = {
    learning: 0,
    favorites: favPage?.total ?? favPage?.totalElements ?? 0,
    messages: unread || 0,
    unread: unread || 0,
  };
}

function goLogin()    { uni.navigateTo({ url: '/pages/auth/login' }); }
function goProfile()  { ensureLogged(() => uni.navigateTo({ url: '/pages/user/profile' })); }
function goPassword() { ensureLogged(() => uni.navigateTo({ url: '/pages/user/password' })); }
function goFavorites(){ ensureLogged(() => uni.navigateTo({ url: '/pages/favorite/list' })); }
function goMessages() { ensureLogged(() => uni.navigateTo({ url: '/pages/message/list' })); }
function goLearning() { uni.showToast({ title: '我的学习页建设中', icon: 'none' }); }
function goOrders()   { uni.showToast({ title: '我的订单页建设中', icon: 'none' }); }
function goBind()     { uni.showToast({ title: '账号绑定页建设中', icon: 'none' }); }
function goSwitchRole(){ uni.showToast({ title: '修改身份页建设中', icon: 'none' }); }

function ensureLogged(action) {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    setTimeout(() => uni.navigateTo({ url: '/pages/auth/login' }), 600);
    return;
  }
  action();
}

function confirmLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    confirmText: '退出',
    confirmColor: '#E62117',
    success: (res) => {
      if (res.confirm) {
        userStore.logout({ redirectToLogin: false });
        uni.showToast({ title: '已退出', icon: 'none' });
        stats.value = { learning: 0, favorites: 0, messages: 0, unread: 0 };
      }
    },
  });
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
  padding: 0 $tk-sp-3 $tk-sp-6;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-3;
}

// Hero
.hero {
  position: relative;
  z-index: 0;
  background: linear-gradient(135deg, $tk-primary 0%, #FF6B35 100%);
  padding: 0 $tk-sp-4 100rpx; // padding-top 由 inline style 控制（navBarH + 12px）

  &__user {
    display: flex;
    align-items: center;
    gap: $tk-sp-3;
    padding: $tk-sp-3 0;
  }
  &__user-meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }
  &__user-name {
    color: #fff;
    font-size: $tk-fs-2xl;
    font-weight: 800;
    @include tk-ellipsis-1;
  }
  &__user-id {
    color: rgba(255, 255, 255, 0.85);
    font-size: $tk-fs-sm;
  }
  &__roles {
    display: flex;
    flex-wrap: wrap;
    gap: 8rpx;
  }
  &__role {
    padding: 4rpx 12rpx;
    background: rgba(255, 255, 255, 0.20);
    color: #fff;
    font-size: $tk-fs-xs;
    border-radius: $tk-radius-xs;
  }

  &__guest {
    display: flex;
    align-items: center;
    gap: $tk-sp-3;
    padding: $tk-sp-3 0;
  }
  &__guest-avatar {
    width: 144rpx;
    height: 144rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.20);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__guest-meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }
  &__guest-title {
    color: #fff;
    font-size: $tk-fs-xl;
    font-weight: 700;
  }
  &__guest-sub {
    color: rgba(255, 255, 255, 0.85);
    font-size: $tk-fs-sm;
  }
  &__guest-btn {
    flex-shrink: 0;
    padding: 14rpx 32rpx;
    background: #fff;
    border-radius: $tk-radius-full;
  }
  &__guest-btn-txt {
    color: $tk-primary;
    font-size: $tk-fs-sm;
    font-weight: 700;
  }
}

// 数据卡 —— 与 hero 重叠 1/3（白卡叠红底）
.stats {
  position: relative;
  z-index: 1; // 保险：确保整张白卡（含 box-shadow）绘制在 hero 红色之上
  margin-top: -60rpx;
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-4 0;
  display: flex;
  align-items: center;
  box-shadow: $tk-shadow-card-md;

  &__item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
  }
  &__num-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
  }
  &__dot {
    position: absolute;
    top: -2rpx;
    right: -10rpx;
    width: 14rpx;
    height: 14rpx;
    border-radius: 50%;
    background: $tk-primary;
  }
  &__num {
    font-size: 40rpx;
    font-weight: 800;
    color: $tk-text-1;
  }
  &__label {
    font-size: $tk-fs-xs;
    color: $tk-text-3;
  }
  &__divider {
    width: 2rpx;
    height: 56rpx;
    background: $tk-divider-light;
  }
}

// 菜单
.menu {
  display: flex;
  flex-direction: column;
  gap: $tk-sp-2;

  &__title-txt {
    font-size: $tk-fs-sm;
    color: $tk-text-3;
    padding: 0 $tk-sp-2;
  }
  &__list {
    background: $tk-bg-card;
    border-radius: $tk-radius-lg;
    box-shadow: $tk-shadow-card;
    overflow: hidden;
  }
  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $tk-sp-3 $tk-sp-3;
    border-bottom: 2rpx solid $tk-divider-light;

    &--last {
      border-bottom: none;
    }
  }
  &__row-l {
    display: flex;
    align-items: center;
    gap: $tk-sp-3;
  }
  &__row-r {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }
  &__icon {
    width: 56rpx;
    height: 56rpx;
    border-radius: $tk-radius-sm;
    display: flex;
    align-items: center;
    justify-content: center;

    &--red    { background: rgba(230, 33, 23, 0.10); }
    &--blue   { background: rgba(37, 99, 235, 0.10); }
    &--orange { background: rgba(245, 158, 11, 0.10); }
    &--green  { background: rgba(22, 163, 74, 0.10); }
    &--gray   { background: $tk-bg-page; }
  }
  &__row-txt {
    font-size: $tk-fs-md;
    color: $tk-text-1;
    font-weight: 500;
  }
  &__row-tip {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
  }
  &__badge {
    min-width: 32rpx;
    height: 32rpx;
    border-radius: 16rpx;
    background: $tk-primary;
    padding: 0 10rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__badge-txt {
    color: #fff;
    font-size: 20rpx;
    font-weight: 700;
  }
}

// 退出
.logout-row {
  margin-top: $tk-sp-3;
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-3 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: $tk-shadow-card;

  &__txt {
    font-size: $tk-fs-md;
    font-weight: 600;
    color: $tk-primary;
  }
}

.footer-tip {
  margin-top: $tk-sp-2;
  text-align: center;
  font-size: $tk-fs-xs;
  color: $tk-text-4;
}
</style>
