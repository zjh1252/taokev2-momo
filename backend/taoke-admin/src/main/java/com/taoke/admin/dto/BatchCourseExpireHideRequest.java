package com.taoke.admin.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 批量更新课程「到期自动隐藏」开关
 *
 * @author Fangxinxin
 * @date 2026-06-18 10:00
 */
@Data
public class BatchCourseExpireHideRequest {

    @NotEmpty(message = "请选择课程")
    private List<Integer> ids;

    /** 1=开启自动隐藏 0=关闭 */
    @NotNull(message = "请指定到期自动隐藏开关")
    private Integer isExpireHide;
}
