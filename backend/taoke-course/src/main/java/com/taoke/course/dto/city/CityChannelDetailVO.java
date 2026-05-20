package com.taoke.course.dto.city;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 城市频道页详情，路由参数 enName 解析后的城市完整信息。
 *
 * <p>支持省级拼音入参（如 beijing/shanghai）：识别到直辖市时，自动 fallback 到下属唯一的「市辖区」记录，
 * 把 cityRegionId 设为该 level=2 行政区主键，确保和 course_plans.city_id 对得上。</p>
 *
 * @author Fangxinxin
 * @date 2026-05-20 17:00
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CityChannelDetailVO {

    /** 命中的 URL slug（与入参一致，便于前端复用作面包屑/title） */
    private String enName;

    /** 展示名：「北京 / 广州 / 苏州」（已去常见后缀） */
    private String cityName;

    /** 所属省份名：「广东省 / 北京市」（直辖市该字段与 cityName 含义重叠，保留以便前端排版） */
    private String provinceName;

    /** 用于公开课过滤的 region.id（level=2，直辖市为其市辖区 id） */
    private Integer cityRegionId;

    /** 省级 region.id（level=1） */
    private Integer provinceRegionId;
}
