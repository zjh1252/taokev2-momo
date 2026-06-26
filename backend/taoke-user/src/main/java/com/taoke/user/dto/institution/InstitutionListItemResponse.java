package com.taoke.user.dto.institution;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 机构列表项 DTO — 列表页轻量化展示
 *
 * @author Fangxinxin
 * @date 2026-04-07 15:00
 */
@Data
public class InstitutionListItemResponse {

    private Integer id;

    /** 老站 tk_member.roleid，URL 段 /company/{legacyRoleId}.htm */
    private Integer legacyRoleId;

    private String orgName;

    /** 擅长领域，逗号分隔 */
    private String specialties;

    /** 擅长行业，逗号分隔 */
    private String industries;

    /** 机构简介 */
    private String bio;

    /** Logo URL */
    private String logoUrl;

    /** 省份 ID */
    private Integer provinceId;

    /** 城市 ID */
    private Integer cityId;

    /** 省份名称（列表接口回填） */
    private String provinceName;

    /** 城市名称（列表接口回填） */
    private String cityName;

    /** 综合评分 */
    private BigDecimal score;

    /** 浏览量/人气 */
    private Integer viewCount;

    /** 评价数量 */
    private Integer commentCount;

    /** 公开课数量 */
    private Integer openCourseCount;

    /** 内训课数量 */
    private Integer innerCourseCount;

    /** 是否已认证 */
    private Integer isCertified;

    /** 是否金牌推荐 */
    private Integer isRecommended;

    /** 是否培训协会 */
    private Boolean association;
}
