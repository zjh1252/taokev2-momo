/**
 * 城市频道相关类型 — 仅供首页城市卡片 + /cities/[pinyin] 详情页使用
 */

/** 首页城市卡片项 — 来自 GET /cities/active */
export interface ActiveCityItem {
  /** URL slug（拼音），如 beijing/shanghai/guangzhou */
  enName: string;
  /** 展示名「北京 / 广州 / 苏州」 */
  cityName: string;
  /** course_plans.city_id 对应的 region 主键 */
  cityRegionId: number;
  /** 该城市当前未开课的有效公开课数量 */
  courseCount: number;
}

/** 城市详情 — 来自 GET /cities/{enName} */
export interface CityChannelDetail {
  enName: string;
  cityName: string;
  /** 所属省份名（直辖市与 cityName 含义重叠） */
  provinceName: string | null;
  /** 用于公开课过滤的 region.id (level=2) */
  cityRegionId: number;
  /** 省级 region.id (level=1) */
  provinceRegionId: number | null;
}
