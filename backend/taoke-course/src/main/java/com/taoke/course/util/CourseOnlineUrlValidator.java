package com.taoke.course.util;

import java.util.regex.Pattern;

/**
 * 线上公开课直播/回放链接校验
 *
 * @author Fangxinxin
 * @date 2026-07-16 15:15
 */
public final class CourseOnlineUrlValidator {

    private static final Pattern HTTPS_PREFIX = Pattern.compile("^https://.+", Pattern.CASE_INSENSITIVE);
    private static final Pattern TENCENT_MEETING = Pattern.compile(
            "^https://meeting\\.tencent\\.com/dm/[A-Za-z0-9]+$", Pattern.CASE_INSENSITIVE);

    private CourseOnlineUrlValidator() {
    }

    public static boolean isHttpsUrl(String url) {
        return url != null && !url.isBlank() && HTTPS_PREFIX.matcher(url.trim()).matches();
    }

    public static boolean isTencentMeetingUrl(String url) {
        return url != null && !url.isBlank() && TENCENT_MEETING.matcher(url.trim()).matches();
    }

    public static void validateRequiredOnlineUrl(String url) {
        if (!isHttpsUrl(url)) {
            throw new IllegalArgumentException("线上公开课必须填写有效的直播会议链接（以 https:// 开头）");
        }
        if (!isTencentMeetingUrl(url)) {
            throw new IllegalArgumentException("线上公开课必须填写有效的腾讯会议链接");
        }
    }
}
