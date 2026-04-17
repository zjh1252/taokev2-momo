package com.taoke.user.dto.trainer;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 专家列表项 DTO — 列表页轻量化展示，不含子表详细数据
 *
 * @author Fangxinxin
 * @date 2026-04-01 21:00
 */
@Data
public class TrainerListItemResponse {

    private Integer id;

    private String name;
    private String avatar;
    private String title;

    /** 综合评分（1.00-5.00） */
    private BigDecimal score;

    /** 讲师自选标签，逗号分隔 */
    private String expertiseTags;

    /** 是否信得过专家 */
    private Integer isTrusted;

    /** 累计评论数 */
    private Integer commentCount;

    /** 累计曝光量 */
    private Integer viewCount;

    /** 省份 ID */
    private Integer provinceId;

    /** 城市 ID */
    private Integer cityId;

    /** 省份名称 */
    private String provinceName;

    /** 城市名称 */
    private String cityName;

    /** 擅长领域分类（仅名称，用于 tag 展示） */
    private List<CategoryRefDTO> expertiseCategories;
}
