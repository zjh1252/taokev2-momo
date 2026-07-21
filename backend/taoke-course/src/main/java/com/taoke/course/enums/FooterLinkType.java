package com.taoke.course.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 底部链接跳转类型
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
@Getter
@RequiredArgsConstructor
public enum FooterLinkType {
    INTERNAL("站内路由"),
    STATIC_PAGE("静态页"),
    EXTERNAL("外链"),
    NONE("无跳转");

    private final String label;
}
