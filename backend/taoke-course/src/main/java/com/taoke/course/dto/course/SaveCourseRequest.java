package com.taoke.course.dto.course;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 创建/编辑课程请求体
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
@Data
public class SaveCourseRequest {

    @NotBlank(message = "课程标题不能为空")
    private String title;

    @NotNull(message = "课程类型不能为空")
    private String type;

    /** 一级分类 ID */
    private Integer categoryId;

    /** 二级分类 ID */
    private Integer subCategoryId;

    /** 课程封面 URL */
    private String coverUrl;

    /** 课程介绍（富文本 HTML） */
    @NotBlank(message = "课程介绍不能为空")
    private String intro;

    /** 课程大纲（富文本 HTML） */
    private String syllabus;

    /** 适用人群 */
    private String audience;

    /** 课程亮点/收益 */
    private String highlights;

    /** 课程天数 */
    private Integer durationDays;

    /** 每天课时（小时/天） */
    private BigDecimal hoursPerDay;

    /** 课程价格 */
    private BigDecimal price;

    /** 原价（划线价） */
    private BigDecimal originalPrice;

    /** 关键词，逗号分隔 */
    private String keywords;

    /** 是否主打课程 */
    private Integer isFeatured;

    /** 是否免费 */
    private Integer isFree;

    /**
     * 公开课开课计划列表，type 为 OPEN_OFFLINE/OPEN_ONLINE 时必填
     */
    @Valid
    private List<CoursePlanDTO> plans;
}
