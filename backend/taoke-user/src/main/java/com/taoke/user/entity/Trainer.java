package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 专家主表实体 — 对应 PRD trainers 主表，存储讲师核心信息。
 * <p>
 * 教育经历、工作经历、荣誉资质、培训分类等 1:N 关系通过独立子表管理，
 * 查询时在 Service 层显式批量加载，避免 JPA 懒加载 N+1 问题。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Getter
@Setter
@Entity
@Table(name = "user_trainers")
public class Trainer extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private Integer userId;

    // ==================== 基础信息 ====================

    /** 讲师姓名 */
    @Column(name = "name", length = 100)
    private String name;

    /** 头像 URL */
    @Column(name = "avatar", length = 500)
    private String avatar;

    /** 头衔（如：资深管理顾问） */
    @Column(name = "title", length = 64)
    private String title;

    /** 性别：0=未知，1=男，2=女 */
    @Column(name = "gender", columnDefinition = "tinyint")
    private Integer gender = 0;

    /** 联系电话 */
    @Column(name = "phone", length = 20)
    private String phone;

    /** 电子邮箱 */
    @Column(name = "email", length = 200)
    private String email;

    /** 邮编 */
    @Column(name = "post_code", length = 10)
    private String postCode;

    /** 省份 ID */
    @Column(name = "province_id")
    private Integer provinceId = 0;

    /** 城市 ID */
    @Column(name = "city_id")
    private Integer cityId = 0;

    /** 区县 ID */
    @Column(name = "district_id")
    private Integer districtId = 0;

    /** 乡镇 ID */
    @Column(name = "town_id")
    private Integer townId = 0;

    /** 详细地址 */
    @Column(name = "address", length = 200)
    private String address;

    // ==================== 专业信息 ====================

    /** 个人简介（支持富文本） */
    @Column(name = "bio", columnDefinition = "text")
    private String bio;

    /** 详细介绍（富文本，支持美化格式） */
    @Column(name = "intro", columnDefinition = "longtext")
    private String intro;

    /** 从业经历/背景 */
    @Column(name = "background", columnDefinition = "text")
    private String background;

    /** 专长描述 */
    @Column(name = "good_at", columnDefinition = "text")
    private String goodAt;

    /** 擅长领域，JSON 数组 */
    @Column(name = "specialties", length = 512)
    private String specialties;

    /** 讲师自选/新增标签，逗号分隔 */
    @Column(name = "expertise_tags", length = 500)
    private String expertiseTags;

    /** 授课风格 */
    @Column(name = "teaching_style", length = 500)
    private String teachingStyle;

    /** 从业年限 */
    @Column(name = "experience_years")
    private Integer experienceYears;

    /** 培训年限 */
    @Column(name = "teaching_years")
    private Integer teachingYears;

    /** 授课城市 ID 列表，JSON 数组 */
    @Column(name = "service_city_ids", length = 512)
    private String serviceCityIds;

    // ==================== 报价信息（敏感，仅讲师+客服可见） ====================

    /** 报价范围-最低 */
    @Column(name = "quote_min", precision = 10, scale = 2)
    private BigDecimal quoteMin;

    /** 报价范围-最高 */
    @Column(name = "quote_max", precision = 10, scale = 2)
    private BigDecimal quoteMax;

    /** 报价单位：天/次/小时 */
    @Column(name = "quote_unit", length = 20)
    private String quoteUnit = "天";

    /** 报价备注 */
    @Column(name = "quote_remark", length = 500)
    private String quoteRemark;

    // ==================== 平台信息 ====================

    /** 主页背景图 URL */
    @Column(name = "background_image", length = 500)
    private String backgroundImage;

    /** 认证等级：0=未认证，1=基础认证，2=高级认证，3=专家认证 */
    @Column(name = "cert_level", nullable = false, columnDefinition = "tinyint")
    private Integer certLevel = 0;

    /** 资质等级：0=普通，1=认证，2=高级认证 */
    @Column(name = "qualification_level", nullable = false, columnDefinition = "tinyint")
    private Integer qualificationLevel = 0;

    /** 状态：0=草稿/待提交，1=待审核，2=审核通过，3=审核驳回，4=已禁用 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint")
    private Integer status = 0;

    /** 审核驳回原因 */
    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    /** 是否签约讲师 */
    @Column(name = "is_signed", nullable = false, columnDefinition = "tinyint")
    private Integer isSigned = 0;

    /** 是否信得过专家（可直通） */
    @Column(name = "is_trusted", nullable = false, columnDefinition = "tinyint")
    private Integer isTrusted = 0;

    /** 是否推荐讲师 */
    @Column(name = "is_recommended", nullable = false, columnDefinition = "tinyint")
    private Integer isRecommended = 0;

    /** 是否拥有版权课 */
    @Column(name = "has_copyright_course", nullable = false, columnDefinition = "tinyint")
    private Integer hasCopyrightCourse = 0;

    // ==================== 统计字段 ====================

    /** 曝光权重，资质升级后增加 */
    @Column(name = "exposure_weight", nullable = false)
    private Integer exposureWeight = 0;

    /** 自定义排序值 */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    /** 综合评分（1.00-5.00） */
    @Column(name = "score", nullable = false, precision = 3, scale = 2)
    private BigDecimal score = BigDecimal.ZERO;

    /** 累计曝光量 */
    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;

    /** 累计咨询量 */
    @Column(name = "consultation_count", nullable = false)
    private Integer consultationCount = 0;

    /** 累计评论数 */
    @Column(name = "comment_count", nullable = false)
    private Integer commentCount = 0;

    // ==================== 时间字段 ====================

    /** 草稿过期时间 */
    @Column(name = "draft_expired_at")
    private LocalDateTime draftExpiredAt;

    /** 审核通过时间 */
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
}
