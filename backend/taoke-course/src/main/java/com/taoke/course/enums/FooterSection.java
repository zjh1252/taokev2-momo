package com.taoke.course.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 底部分区编码
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
@Getter
@RequiredArgsConstructor
public enum FooterSection {
    NAV("网站导航"),
    ABOUT("关于我们"),
    BUSINESS("商务服务"),
    LEGAL("法律声明"),
    CONTACT("联系我们");

    private final String label;
}
