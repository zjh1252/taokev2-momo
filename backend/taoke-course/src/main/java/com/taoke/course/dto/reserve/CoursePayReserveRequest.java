package com.taoke.course.dto.reserve;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 支付成功后触发预约通知（前端双保险入口）
 *
 * @author Fangxinxin
 * @date 2026-07-16 15:15
 */
@Data
public class CoursePayReserveRequest {

    /** 可选；不传时按整单补发全部商品购买通知 */
    private Integer courseId;

    @NotBlank
    private String orderNo;
}
