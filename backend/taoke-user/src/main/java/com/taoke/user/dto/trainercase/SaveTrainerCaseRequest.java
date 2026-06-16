package com.taoke.user.dto.trainercase;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * 新增/编辑案例请求
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:00
 */
@Data
public class SaveTrainerCaseRequest {

    @NotBlank(message = "案例标题不能为空")
    @Size(max = 200, message = "案例标题不能超过200字")
    private String caseTitle;

    @NotBlank(message = "企业名称不能为空")
    @Size(max = 200, message = "企业名称不能超过200字")
    private String enterpriseName;

    @Size(max = 100, message = "行业不能超过100字")
    private String industry;

    @Size(max = 200, message = "培训主题不能超过200字")
    private String trainingTopic;

    private String trainingEffect;

    /** 受训人数（>=1，未填写时为 null） */
    @Min(value = 1, message = "受训人数需为大于等于 1 的整数")
    private Integer traineeCount;

    /** 培训地点 - 省 ID（必填） */
    @NotNull(message = "请选择培训地点（省份）")
    private Integer provinceId;

    /** 培训地点 - 市 ID（必填） */
    @NotNull(message = "请选择培训地点（城市）")
    private Integer cityId;

    /** 培训地点 - 区/县 ID（必填） */
    @NotNull(message = "请选择培训地点（区/县）")
    private Integer districtId;

    /** 培训地点 - 镇/街道 ID（选填） */
    private Integer townId;

    /** 培训地点 - 详细地址（选填） */
    @Size(max = 255, message = "详细地址不能超过255字")
    private String trainingAddress;

    private LocalDate trainingDate;

    private String description;

    @Size(max = 500, message = "封面图 URL 不能超过500字")
    private String coverImage;

    private Integer sortOrder;
}
