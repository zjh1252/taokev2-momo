import { defineStore } from 'pinia';

/**
 * 跨 Tab 搜索与筛选传参（首页 → 专家/公开课列表）
 */
export const useSearchStore = defineStore('search', {
  state: () => ({
    keyword: '',
    targetTab: '',
    expertFilter: {},
    courseFilter: {},
  }),

  actions: {
    setSearch(keyword, targetTab) {
      this.keyword = keyword || '';
      this.targetTab = targetTab || '';
    },

    setExpertFilter(filter = {}) {
      this.expertFilter = { ...filter };
    },

    setCourseFilter(filter = {}) {
      this.courseFilter = { ...filter };
    },

    consumeKeyword() {
      const kw = this.keyword;
      this.keyword = '';
      this.targetTab = '';
      return kw;
    },

    consumeExpertFilter() {
      const f = { ...this.expertFilter };
      this.expertFilter = {};
      return f;
    },

    consumeCourseFilter() {
      const f = { ...this.courseFilter };
      this.courseFilter = {};
      return f;
    },
  },
});
