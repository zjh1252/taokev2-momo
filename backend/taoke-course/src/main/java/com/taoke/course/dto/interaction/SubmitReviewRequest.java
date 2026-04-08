package com.taoke.course.dto.interaction;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 提交培训评价请求体 — 对齐旧站弹窗表单字段
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Data
public class SubmitReviewRequest {

    /** 评价范围：COURSE / TRAINER */
    @NotBlank(message = "评价范围不能为空")
    private String reviewScope;

    /** 被评课程 ID（scope=COURSE 时必填） */
    private Integer courseId;

    /** 被评专家 user_id（scope=TRAINER 时必填） */
    private Integer trainerUserId;

    /** 专家姓名 */
    private String expertName;

    /** 培训/出场日期 */
    private LocalDate trainingDate;

    /** 课程天数/出场天数 */
    private BigDecimal courseDays;

    /** 课程标题/培训主题 */
    private String courseTitle;

    /** 甲方企业名称 */
    private String clientCompany;

    /** 培训地点 */
    private String trainingLocation;

    /** 授课内容评分 1-5 */
    @NotNull(message = "授课内容评分不能为空")
    @Min(value = 1, message = "评分最低为1")
    @Max(value = 5, message = "评分最高为5")
    private Integer ratingContent;

    /** 授课水平评分 1-5 */
    @NotNull(message = "授课水平评分不能为空")
    @Min(value = 1, message = "评分最低为1")
    @Max(value = 5, message = "评分最高为5")
    private Integer ratingTeaching;

    /** 服务态度评分 1-5 */
    @NotNull(message = "服务态度评分不能为空")
    @Min(value = 1, message = "评分最低为1")
    @Max(value = 5, message = "评分最高为5")
    private Integer ratingService;

    /** 文字评价（>=20 字） */
    @NotBlank(message = "文字评价不能为空")
    @Size(min = 20, message = "文字评价不能少于20字")
    private String commentText;

    /** 图片 URL 列表，限 1~9 张 */
    @Size(max = 9, message = "最多上传9张图片")
    private List<String> photoUrls;

    /** 评价者姓名 */
    private String submitterName;

    /** 专家电话/微信（选填） */
    private String submitterContact;

    /** 是否匿名 */
    private Boolean anonymous = false;
}
