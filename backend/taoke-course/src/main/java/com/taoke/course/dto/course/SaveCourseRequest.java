package com.taoke.course.dto.course;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
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

    /** hasPlan=1 时必须传 OPEN_OFFLINE 或 OPEN_ONLINE，否则可不传（默认 INTERNAL） */
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

    /** 课程简介（短文本） */
    @NotBlank(message = "课程简介不能为空")
    private String summary;

    /** 课程大纲（富文本 HTML） */
    private String syllabus;

    /** 课程资料文件 URL（doc/docx/pdf） */
    private String materialUrl;

    /** 目标受众（原适用人群） */
    private String audience;

    /** 课程收益（原课程亮点） */
    private String highlights;

    /** 课程天数 */
    private Integer durationDays;

    /** 课程总时长（小时） */
    private BigDecimal totalHours;

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

    /** 是否有公开课计划：0=否 1=是 */
    private Integer hasPlan;

    /**
     * 公开课开课计划列表，hasPlan=1 时必填
     */
    @Valid
    private List<CoursePlanDTO> plans;
}
