package com.taoke.user.dto.trainer;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 专家档案完整返回（讲师本人 + 后台使用，含报价敏感字段）
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Data
public class TrainerResponse {

    private Integer id;
    private Integer userId;

    /** 专家编号 */
    private String trainerCode;

    // ==================== 基础信息 ====================

    private String name;
    /** 授课姓名（对外展示，可与真实姓名不同） */
    private String teachingName;
    private String avatar;
    private String title;
    private Integer gender;
    private String phone;
    private String email;
    private String postCode;
    private Integer provinceId;
    private Integer cityId;
    private Integer districtId;
    private Integer townId;
    private String address;
    /** 身份证号（专家本人可见，用于回写表单） */
    private String idCardNo;

    // ==================== 专业信息 ====================

    private String bio;
    /** 一句话介绍 */
    private String oneLineIntro;
    private String intro;
    private String background;
    /** 部分客户（长文本） */
    private String partialClients;
    private String goodAt;
    private String specialties;
    private String expertiseTags;
    private String teachingStyle;
    private Integer experienceYears;
    private Integer teachingYears;
    private String serviceCityIds;

    // ==================== 报价信息（敏感） ====================

    private BigDecimal quoteMin;
    private BigDecimal quoteMax;
    private String quoteUnit;
    private String quoteRemark;
    /** 淘课网售价（元/天） */
    private BigDecimal taokePrice;
    /** 淘课网合作课酬（元/天） */
    private BigDecimal taokeCommission;

    // ==================== 协议与简历 ====================

    private LocalDateTime agreementSignedAt;
    private String agreementVersion;
    private String resumeUrl;

    /** 荣誉与资质文件 JSON 字符串（数组 [{name,url}]，前端解析展示） */
    private String honorFiles;

    // ==================== 平台信息 ====================

    private String backgroundImage;
    private Integer certLevel;
    private Integer qualificationLevel;
    private Integer status;
    private String rejectReason;
    private Integer isSigned;
    private Integer isTrusted;
    private Integer isRecommended;
    private Integer hasCopyrightCourse;

    // ==================== 统计 ====================

    private BigDecimal score;
    private Integer viewCount;
    private Integer consultationCount;
    private Integer commentCount;

    // ==================== 时间 ====================

    private LocalDateTime draftExpiredAt;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ==================== 子表数据 ====================

    private List<TrainerEducationDTO> educations;
    private List<TrainerWorkExperienceDTO> workExperiences;
    private List<TrainerHonorDTO> honors;
    private List<CategoryRefDTO> expertiseCategories;
    private List<CategoryRefDTO> industryCategories;
}
