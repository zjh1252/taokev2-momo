/**
 * 用户登录态 store
 *
 * 字段：
 * - token：JWT
 * - profile：当前用户信息（来自 GET /users/me）
 * - businessRoles：业务角色编码集合
 *
 * 持久化：token 存 storage（key=tk_token），profile 内存为主、storage 镜像兜底
 */
import { defineStore } from 'pinia';
import { getToken, setToken, clearToken } from '@/utils/request';
import * as authApi from '@/api/auth';
import * as userApi from '@/api/user';
import { roleLabel } from '@/constants/role';

const PROFILE_KEY = 'tk_profile';
const ACTIVE_ROLE_KEY = 'tk_active_role';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    profile: null,
    businessRoles: [],
    activeRole: 'BUYER',
    initialized: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    nickname: (state) => state.profile?.nickname || state.profile?.phone || '',
    /** 头像 URL，后端字段为 avatarUrl，兼容旧字段 avatar */
    avatar: (state) => state.profile?.avatarUrl || state.profile?.avatar || '',
    /** 业务角色码列表（来自 profile.roles[].role） */
    roleCodes: (state) => (state.profile?.roles || []).map((r) => r?.role).filter(Boolean),
    activeRoleLabel: (state) => roleLabel(state.activeRole) || '个人学员',
  },

  actions: {
    /**
     * App 启动时调用：从 storage 回填
     */
    bootstrap() {
      this.token = getToken();
      try {
        const cached = uni.getStorageSync(PROFILE_KEY);
        if (cached) this.profile = cached;
        const savedRole = uni.getStorageSync(ACTIVE_ROLE_KEY);
        if (savedRole) this.activeRole = savedRole;
      } catch (_) { /* ignore */ }
      this.syncActiveRole();
      this.initialized = true;
    },

    setActiveRole(role) {
      this.activeRole = role || 'BUYER';
      try { uni.setStorageSync(ACTIVE_ROLE_KEY, this.activeRole); } catch (_) {}
    },

    /** 校验 storage 中的 activeRole 是否仍有效 */
    syncActiveRole() {
      const roles = this.profile?.roles || [];
      const activeCodes = new Set(
        roles.filter((r) => r?.status === 1).map((r) => r.role),
      );
      activeCodes.add('BUYER');
      if (!activeCodes.has(this.activeRole)) {
        this.setActiveRole('BUYER');
      }
    },

    /**
     * 账号 + 密码登录（推荐，与 frontend 对齐）
     */
    async loginByUsername({ username, password, captchaToken }) {
      const data = await authApi.loginByUsername({ username, password, captchaToken });
      this.applyToken(data);
      await this.fetchProfile();
      return data;
    },

    /**
     * 账号 + 密码注册（推荐，与 frontend 对齐）
     * 成功后接口直接返回 TokenResponse，自动登录
     */
    async registerByUsername({ username, password, nickname }) {
      const data = await authApi.registerByUsername({ username, password, nickname });
      this.applyToken(data);
      await this.fetchProfile();
      return data;
    },

    /**
     * 短信验证码登录（手机号未注册时后端自动注册）
     */
    async loginBySms({ phone, code }) {
      const data = await authApi.loginBySms({ phone, code });
      this.applyToken(data);
      await this.fetchProfile();
      return data;
    },

    /**
     * @deprecated 旧版"账号+密码"登录（兼容老接口 /auth/login）
     */
    async loginByPassword({ account, password }) {
      const data = await authApi.loginByPassword({ account, password });
      this.applyToken(data);
      await this.fetchProfile();
      return data;
    },

    applyToken(data) {
      const t = data?.token || data?.accessToken || '';
      this.token = t;
      setToken(t);
    },

    /**
     * 拉取当前用户资料
     */
    async fetchProfile() {
      try {
        const data = await userApi.getMyProfile();
        this.profile = data;
        uni.setStorageSync(PROFILE_KEY, data);
        this.syncActiveRole();
        return data;
      } catch (e) {
        // 拉取失败可能是 token 已失效，由 request 拦截器处理跳转
        return null;
      }
    },

    /**
     * 修改当前用户资料（PUT /users/me）；成功后乐观更新 profile + 缓存
     */
    async updateProfile(payload) {
      await userApi.updateMyProfile(payload);
      const next = { ...(this.profile || {}), ...payload };
      this.profile = next;
      try { uni.setStorageSync(PROFILE_KEY, next); } catch (_) {}
      // 静默从后端拉一份兜底（角色 / 时间戳等只能后端给）
      this.fetchProfile();
      return next;
    },

    /**
     * 退出登录
     */
    logout({ redirectToLogin = false } = {}) {
      this.token = '';
      this.profile = null;
      this.businessRoles = [];
      this.activeRole = 'BUYER';
      clearToken();
      uni.removeStorageSync(PROFILE_KEY);
      uni.removeStorageSync(ACTIVE_ROLE_KEY);
      if (redirectToLogin) {
        uni.reLaunch({ url: '/pages/auth/login' });
      }
    },
  },
});
