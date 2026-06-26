<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';

onLaunch(() => {
  // App 启动时回填登录态
  const userStore = useUserStore();
  userStore.bootstrap();
  console.log('[App] Launch');
});

onShow(() => {
  console.log('[App] Show');
});

onHide(() => {
  console.log('[App] Hide');
});
</script>

<style lang="scss">
@import '@/uni_modules/uni-scss/index.scss';
@import '@/styles/common.scss';

/* #ifndef APP-NVUE */
page {
  background-color: $tk-bg-page;
  color: $tk-text-1;
  font-size: $tk-fs-md;
  line-height: $tk-lh-normal;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC",
               "Helvetica Neue", Helvetica, "Microsoft YaHei", sans-serif;
}
/* #endif */
</style>
