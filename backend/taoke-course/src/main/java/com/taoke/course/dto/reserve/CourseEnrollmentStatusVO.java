package com.taoke.course.dto.reserve;

import lombok.Data;

/**
 * 当前用户对课程的报名/购买状态
 *
 * @author Fangxinxin
 * @date 2026-07-16 16:55
 */
@Data
public class CourseEnrollmentStatusVO {

    /** 是否已报名/购买（有效报名记录） */
    private Boolean enrolled;
}
