package com.taoke.course.dto.enrollment;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 管理端更新报名处理状态与备注
 *
 * @author Fangxinxin
 * @date 2026-08-06 20:15
 */
@Data
public class UpdateOpenCourseEnrollmentRequest {

    @NotNull(message = "处理状态不能为空")
    @Min(value = 0, message = "处理状态无效")
    @Max(value = 2, message = "处理状态无效")
    private Integer status;

    /** 运营备注，可空字符串清空为 null */
    private String adminRemark;
}
