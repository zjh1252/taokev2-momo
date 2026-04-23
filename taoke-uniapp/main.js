import { createSSRApp } from 'vue';
import * as Pinia from 'pinia';
import App from './App.vue';

export function createApp() {
  const app = createSSRApp(App);
  app.use(Pinia.createPinia());
  return {
    app,
    Pinia, // HBuilderX uniapp 要求显式导出 Pinia 以便 SSR 兼容
  };
}
