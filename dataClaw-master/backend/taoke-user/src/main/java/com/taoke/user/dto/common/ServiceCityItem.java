package com.taoke.user.dto.common;

import lombok.Data;

/**
 * 服务城市条目（省 + 市），用于经纪人 / 助理等角色「多服务城市」字段。
 *
 * <p>多条记录以 JSON 数组形式存储到对应实体的 {@code service_cities} 列。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-22 14:00
 */
@Data
public class ServiceCityItem {

    /** 省份 ID */
    private Integer provinceId;

    /** 城市 ID */
    private Integer cityId;

    /** 省份名称（冗余存储，便于前端直接展示） */
    private String provinceName;

    /** 城市名称（冗余存储） */
    private String cityName;
}
