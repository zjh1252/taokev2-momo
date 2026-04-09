package com.taoke.user.dto.trainer;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 专家公开详情返回（前台 C 端展示，不含报价敏感字段）
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:30
 */
@Data
public class TrainerPublicResponse {

    /** 专家主表 ID（路由、公开详情路径参数） */
    private Integer id;

    /**
     * 关联的平台用户 ID
     * <p>互动域中 targetType=TRAINER 的 targetId、专家留言的 trainerUserId 等均须使用该字段。</p>
     */
    private Integer userId;

    /** 专家编号 */
    private String trainerCode;

    // ==================== 基础展示 ====================

    private String name;
    private String avatar;
    private String title;
    private Integer gender;

    // ==================== 地区 ====================

    private Integer provinceId;
    private Integer cityId;
    private String provinceName;
    private String cityName;

    // ==================== 专业信息 ====================

    private String bio;
    private String intro;
    private String background;
    private String goodAt;
    private String specialties;
    private String expertiseTags;
    private String teachingStyle;
    private Integer experienceYears;
    private Integer teachingYears;

    // ==================== 平台信息 ====================

    private String backgroundImage;
    private Integer certLevel;
    private Integer isSigned;
    private Integer isTrusted;
    private Integer isRecommended;
    private Integer hasCopyrightCourse;

    // ==================== 统计 ====================

    private BigDecimal score;
    private Integer viewCount;
    private Integer consultationCount;
    private Integer commentCount;

    // ==================== 子表数据 ====================

    private List<TrainerEducationDTO> educations;
    private List<TrainerWorkExperienceDTO> workExperiences;
    private List<TrainerHonorDTO> honors;
    private List<CategoryRefDTO> expertiseCategories;
    private List<CategoryRefDTO> industryCategories;
}
