package com.taoke.course.dto.city;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 「有有效公开课的城市」聚合项，用于首页城市频道卡片。
 *
 * <p>聚合口径：course.status=PUBLISHED 且 course.type=线下公开课 且
 * course_plans.start_time &gt;= now() 的所有 city_id GROUP BY 计数。</p>
 *
 * @author Fangxinxin
 * @date 2026-05-20 17:00
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActiveCityVO {

    /** URL slug，已去除直辖市市辖区的 "-1" 后缀（如 beijing/shanghai/guangzhou） */
    private String enName;

    /** 展示名：直辖市为「北京/上海/天津/重庆」，普通市去「市/自治州/盟」后缀 */
    private String cityName;

    /** course_plans.city_id 对应的 region 主键，前端跳到城市频道页后用于课程过滤 */
    private Integer cityRegionId;

    /** 该城市未开课的有效公开课数量 */
    private Long courseCount;
}
