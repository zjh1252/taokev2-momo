package com.taoke.course.dto.interaction;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 专家留言请求体 — 对齐旧站「给XX留言」弹窗
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Data
public class SubmitTrainerMessageRequest {

    /** 目标专家 user_id */
    @NotNull(message = "专家ID不能为空")
    private Integer trainerUserId;

    /** 培训主题 2~30 字 */
    @NotBlank(message = "培训主题不能为空")
    @Size(min = 2, max = 30, message = "培训主题限制2~30个字符")
    private String trainingTopic;

    /** 培训目标 */
    private String trainingGoal;

    /** 联系人姓名 */
    @NotBlank(message = "姓名不能为空")
    private String contactName;

    /** 联系手机 */
    @NotBlank(message = "联系手机不能为空")
    private String contactMobile;

    /** 公司名称 */
    @NotBlank(message = "公司名称不能为空")
    private String companyName;

    /** 公司电话 */
    private String companyPhone;

    /** 省 ID */
    @NotNull(message = "请选择省份")
    private Integer provinceId;

    /** 市 ID */
    @NotNull(message = "请选择城市")
    private Integer cityId;

    /** 区/县 ID */
    @NotNull(message = "请选择区/县")
    private Integer districtId;

    /** 培训天数 */
    private String trainingDays;

    /** Email */
    private String email;

    /** 备注 */
    private String remark;
}
