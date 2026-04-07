package com.taoke.course.enums;

import lombok.Getter;

/**
 * 录播课视频类型枚举
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
@Getter
public enum VideoType {

    SERIES("多节视频"),
    SINGLE("单个视频"),
    EXTERNAL("外部网页视频");

    private final String label;

    VideoType(String label) {
        this.label = label;
    }
}
