/**
 * 城市地标插画映射 — 首页城市频道卡片左侧背景图
 * enName 来自 regions.en_name（如 shanghai / beijing）
 */

const CITY_LANDMARKS: Record<string, string> = {
  shanghai: '/statics/images/cities/shanghai.svg',
  shenzhen: '/statics/images/cities/shenzhen.svg',
  beijing: '/statics/images/cities/beijing.svg',
  guangzhou: '/statics/images/cities/guangzhou.svg',
  suzhou: '/statics/images/cities/suzhou.svg',
  hangzhou: '/statics/images/cities/hangzhou.svg',
  wuhan: '/statics/images/cities/wuhan.svg',
  xian: '/statics/images/cities/xian.svg',
  chengdu: '/statics/images/cities/chengdu.svg',
  jiaxing: '/statics/images/cities/jiaxing.svg',
  qingdao: '/statics/images/cities/qingdao.svg',
  hefei: '/statics/images/cities/hefei.svg',
  chongqing: '/statics/images/cities/chongqing.svg',
  jinan: '/statics/images/cities/jinan.svg',
  changsha: '/statics/images/cities/changsha.svg',
  kunming: '/statics/images/cities/kunming.svg',
  nantong: '/statics/images/cities/nantong.svg',
  dalian: '/statics/images/cities/dalian.svg',
  tianjin: '/statics/images/cities/tianjin.svg',
  nanjing: '/statics/images/cities/nanjing.svg',
  ningbo: '/statics/images/cities/ningbo.svg',
  wuxi: '/statics/images/cities/wuxi.svg',
  zhengzhou: '/statics/images/cities/zhengzhou.svg',
  foshan: '/statics/images/cities/foshan.svg',
  dongguan: '/statics/images/cities/dongguan.svg',
};

const DEFAULT_LANDMARK = '/statics/images/cities/default.svg';

/** 按城市拼音 slug 取地标插画路径，未知城市回退通用 skyline */
export function getCityLandmarkSrc(enName: string): string {
  const key = enName.trim().toLowerCase();
  return CITY_LANDMARKS[key] ?? DEFAULT_LANDMARK;
}
