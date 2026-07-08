import { filtersToHtmPath } from '@/features/trainer/utils/url';

export const DEFAULT_TOPIC_BUTTON_LINK = filtersToHtmPath({ field: 'MBA/总裁班' });

export const HOME_BANNER_DEFAULTS = [
  {
    position: 1,
    coverUrl: '/statics/images/banner改/无按钮/Frame 26.png',
    consultButtonImageUrl: '/statics/images/banner改/按钮/橙色/Frame 28.png',
    topicButtonImageUrl: '/statics/images/banner改/按钮/橙色/Frame 29.png',
    topicButtonLinkUrl: DEFAULT_TOPIC_BUTTON_LINK
  },
  {
    position: 2,
    coverUrl: '/statics/images/banner改/无按钮/Frame 28.png',
    consultButtonImageUrl: '/statics/images/banner改/按钮/紫色/紫1.png',
    topicButtonImageUrl: '/statics/images/banner改/按钮/紫色/紫2.png',
    topicButtonLinkUrl: DEFAULT_TOPIC_BUTTON_LINK
  },
  {
    position: 3,
    coverUrl: '/statics/images/banner改/无按钮/Frame 30.png',
    consultButtonImageUrl: '/statics/images/banner改/按钮/蓝色/蓝1.png',
    topicButtonImageUrl: '/statics/images/banner改/按钮/蓝色/蓝2.png',
    topicButtonLinkUrl: DEFAULT_TOPIC_BUTTON_LINK
  }
] as const;

export function getHomeBannerDefault(position: number) {
  return HOME_BANNER_DEFAULTS.find((item) => item.position === position) ?? HOME_BANNER_DEFAULTS[0];
}
