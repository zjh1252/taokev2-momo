package com.taoke.user.dto.institution;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 机构公开详情 DTO — 详情页完整展示（不含敏感信息）
 *
 * @author Fangxinxin
 * @date 2026-04-07 15:00
 */
@Data
public class InstitutionPublicResponse {

    private Integer id;

    /** 老站 tk_member.roleid，URL 段 /company/{legacyRoleId}.htm */
    private Integer legacyRoleId;

    private String orgName;

    /** 机构类型：0=非高校，1=高校 */
    private Integer orgType;

    /** 机构简介 */
    private String bio;

    /** SEO 自定义描述 */
    private String seoDescription;

    /** 擅长领域 */
    private String specialties;

    /** 擅长行业 */
    private String industries;

    /** Logo URL */
    private String logoUrl;

    /** 横幅图 URL */
    private String bannerUrl;

    /** 省份 ID */
    private Integer provinceId;

    /** 城市 ID */
    private Integer cityId;

    /** 区县 ID */
    private Integer districtId;

    /** 详细地址 */
    private String address;

    /** 联系人姓名（showContact=1 时才返回） */
    private String contactName;

    /** 联系电话（showContact=1 时才返回） */
    private String contactPhone;

    /** 是否公开联系方式 */
    private Integer showContact;

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

    /** 服务过的客户描述（部分客户） */
    private String clientCases;

    /** 成功案例（长文本） */
    private String successCases;

    /** 省份名称（详情接口回填） */
    private String provinceName;

    /** 城市名称（详情接口回填） */
    private String cityName;

    /** 是否培训协会 */
    private Boolean association;

    private LocalDateTime createdAt;
}
