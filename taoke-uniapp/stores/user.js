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

const PROFILE_KEY = 'tk_profile';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    profile: null,
    businessRoles: [],
    initialized: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    nickname: (state) => state.profile?.nickname || state.profile?.phone || '',
    avatar: (state) => state.profile?.avatar || '',
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
      } catch (_) { /* ignore */ }
      this.initialized = true;
    },

    /**
     * 账号 + 密码登录（推荐，与 frontend 对齐）
     */
    async loginByUsername({ username, password }) {
      const data = await authApi.loginByUsername({ username, password });
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
        return data;
      } catch (e) {
        // 拉取失败可能是 token 已失效，由 request 拦截器处理跳转
        return null;
      }
    },

    /**
     * 退出登录
     */
    logout({ redirectToLogin = false } = {}) {
      this.token = '';
      this.profile = null;
      this.businessRoles = [];
      clearToken();
      uni.removeStorageSync(PROFILE_KEY);
      if (redirectToLogin) {
        uni.reLaunch({ url: '/pages/auth/login' });
      }
    },
  },
});
