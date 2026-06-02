package com.taoke.course.dto.demand;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 创建需求请求体
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Data
public class CreateDemandRequest {

    /** 需求类型：DEFAULT / TRAINING / CASE_CUSTOM / INTERNAL_RESERVATION */
    @NotBlank(message = "需求类型不能为空")
    private String demandType;

    /** 需求标题 */
    private String title;

    /** 培训主题 */
    private String trainingTopic;

    /** 培训人数 */
    private Integer traineeCount;

    /** 预算最低金额 */
    private BigDecimal budgetMin;

    /** 预算最高金额 */
    private BigDecimal budgetMax;

    /** 期望开始日期 */
    private LocalDate expectedStartDate;

    /** 培训形式：ONLINE / OFFLINE / HYBRID */
    private String format;

    /** 培训类型：PUBLIC=公开课, INTERNAL=内训课 */
    private String courseType;

    /** 意向专家（自由文本，选填） */
    private String intendedTrainer;

    /** 需求详细描述 */
    private String description;

    /** 来源案例 ID（案例定制时传入） */
    private Integer sourceCaseId;

    /** 来源课程 ID（内训课预约时传入） */
    private Integer sourceCourseId;

    /** 联系人 */
    private String contactName;

    /** 联系电话 */
    private String contactPhone;

    /** 省份 ID（线下/混合时传入） */
    private Integer provinceId;

    /** 城市 ID */
    private Integer cityId;

    /** 区/县 ID */
    private Integer districtId;
}
