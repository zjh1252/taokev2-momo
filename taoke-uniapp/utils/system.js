/**
 * 跨端系统信息 —— 优先 uni 新 API，避免 wx.getSystemInfoSync 弃用警告
 */

let cached = null;

export function getSystemInfo() {
  if (cached) return cached;

  if (typeof uni.getWindowInfo === 'function') {
    const windowInfo = uni.getWindowInfo();
    cached = {
      statusBarHeight: windowInfo.statusBarHeight ?? 20,
      windowWidth: windowInfo.windowWidth,
      windowHeight: windowInfo.windowHeight,
      safeAreaInsets: windowInfo.safeAreaInsets,
    };
    return cached;
  }

  cached = uni.getSystemInfoSync();
  return cached;
}

/** 自定义顶栏总高度：状态栏 + 导航栏内容区（默认 44px） */
export function getNavBarHeight(contentHeight = 44) {
  const { statusBarHeight = 20 } = getSystemInfo();
  return statusBarHeight + contentHeight;
}
