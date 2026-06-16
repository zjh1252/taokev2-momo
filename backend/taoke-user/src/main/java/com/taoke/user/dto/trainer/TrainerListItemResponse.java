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

    /** 用户 ID（用于绑定关系等以 userId 为目标的接口） */
    private Integer userId;

    private String name;
    /** 授课姓名（列表/卡片对外展示） */
    private String teachingName;
    private String avatar;
    private String title;

    /** 一句话介绍（对外展示的头衔/签名） */
    private String oneLineIntro;

    /** 综合评分（1.00-5.00） */
    private BigDecimal score;

    /** 讲师自选标签，逗号分隔 */
    private String expertiseTags;

    /** 是否后台推荐位：0=否，1=是 */
    private Integer isRecommended;

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

    /** 擅长行业分类（仅名称，用于 tag 展示） */
    private List<CategoryRefDTO> industryCategories;
}
