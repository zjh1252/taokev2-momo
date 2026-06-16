package com.taoke.common.util;

/**
 * 旧站头像 URL 判定与规范化（专家/机构通用）。
 *
 * @author Fangxinxin
 * @date 2026-06-12 12:00
 */
public final class LegacyAvatarUrls {

    private LegacyAvatarUrls() {
    }

    /** 旧站默认占位图 middle/00/1.jpg，非真实头像 */
    public static boolean isPlaceholder(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        String normalized = url.trim().replace('\\', '/');
        return normalized.contains("/middle/00/1.")
                || normalized.endsWith("/middle/00/1");
    }

    /** 可用于展示的头像：非空且非占位图 */
    public static boolean isUsable(String url) {
        return url != null && !url.isBlank() && !isPlaceholder(url);
    }

    /** 将相对路径规范为 https 绝对地址（attachments/、/u/ 等） */
    public static String normalize(String url) {
        if (url == null || url.isBlank()) {
            return "";
        }
        String value = url.trim();
        if (value.startsWith("http://www.taoke.com/") || value.startsWith("http://taoke.com/")) {
            return value.replace("http://taoke.com/", "https://www.taoke.com/")
                    .replace("http://www.taoke.com/", "https://www.taoke.com/");
        }
        if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/uploads/")
                || value.startsWith("/statics/")) {
            return value;
        }
        if (value.startsWith("attachments/") || value.startsWith("u/")) {
            return "https://www.taoke.com/" + value;
        }
        if (value.startsWith("/attachments/") || value.startsWith("/u/")) {
            return "https://www.taoke.com" + value;
        }
        return value;
    }

    /** 按优先级选取第一个可用头像并规范化 */
    public static String pickFirstUsable(String... candidates) {
        if (candidates == null) {
            return "";
        }
        for (String candidate : candidates) {
            if (isUsable(candidate)) {
                return normalize(candidate);
            }
        }
        return "";
    }
}
