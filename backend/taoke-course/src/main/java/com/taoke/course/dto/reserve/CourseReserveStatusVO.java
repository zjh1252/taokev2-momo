package com.taoke.course.dto.reserve;

import lombok.Data;

/**
 * 当前用户对课程的预约状态
 *
 * @author Fangxinxin
 * @date 2026-07-16 15:15
 */
@Data
public class CourseReserveStatusVO {

    /** 是否已预约（含免费预约与付费购买） */
    private boolean reserved;
}
