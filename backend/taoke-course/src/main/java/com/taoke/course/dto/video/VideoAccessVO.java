package com.taoke.course.dto.video;

import lombok.Data;

/**
 * 录播课访问权限信息
 *
 * @author Fangxinxin
 * @date 2026-04-08 10:00
 */
@Data
public class VideoAccessVO {

    /** 是否可播放（免费或已购买未过期） */
    private Boolean accessible;

    /** 是否已报名/购买 */
    private Boolean enrolled;

    /** 是否免费课程 */
    private Boolean isFree;
}
