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

    /** 旧站/本地默认占位图，非真实头像 */
    public static boolean isPlaceholder(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        String normalized = url.trim().replace('\\', '/').toLowerCase();
        if (normalized.contains("/middle/00/1.")
                || normalized.endsWith("/middle/00/1")) {
            return true;
        }
        return normalized.contains("taoke-new-logo")
                || normalized.contains("expert-main")
                || normalized.contains("avatar-placeholder")
                || normalized.contains("nophoto")
                || normalized.contains("no_photo")
                || normalized.contains("no-photo")
                || normalized.contains("noavatar")
                || normalized.contains("no-avatar")
                || normalized.contains("default_avatar")
                || normalized.contains("default-avatar")
                || normalized.contains("zwzp");
    }

    /** 可用于展示的头像：非空且非占位图 */
    public static boolean isUsable(String url) {
        return url != null && !url.isBlank() && !isPlaceholder(url);
    }

    /**
     * 可用于专家/机构头像展示的 URL：在 {@link #isUsable} 基础上排除无路径脏数据，
     * 以便回退到素材库默认头像。
     */
    public static boolean isUsableAvatar(String url) {
        if (!isUsable(url)) {
            return false;
        }
        String normalized = url.trim().replace('\\', '/');
        if (normalized.startsWith("http://") || normalized.startsWith("https://")
                || normalized.startsWith("/uploads/") || normalized.startsWith("/statics/")
                || normalized.startsWith("/attachments/") || normalized.startsWith("attachments/")
                || normalized.startsWith("/u/") || normalized.startsWith("u/")) {
            return true;
        }
        return normalized.contains("/");
    }

    /**
     * 可用于课程封面的 URL：在 {@link #isUsable} 基础上排除无路径脏数据与二维码类误传图，
     * 以便回退到讲师头像或素材库默认封面。
     */
    public static boolean isUsableCourseCover(String url) {
        if (!isUsable(url)) {
            return false;
        }
        String normalized = url.trim().replace('\\', '/');
        if (looksLikeQrCodeCover(normalized)) {
            return false;
        }
        if (normalized.startsWith("http://") || normalized.startsWith("https://")
                || normalized.startsWith("/uploads/") || normalized.startsWith("/statics/")
                || normalized.startsWith("/attachments/") || normalized.startsWith("attachments/")
                || normalized.startsWith("/u/") || normalized.startsWith("u/")) {
            return true;
        }
        return normalized.contains("/");
    }

    /** URL 路径含二维码语义时视为不可用封面（旧站误把微信/活动二维码当封面） */
    static boolean looksLikeQrCodeCover(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        String lower = url.toLowerCase();
        return lower.contains("qrcode")
                || lower.contains("qr_code")
                || lower.contains("qr-code")
                || lower.contains("/qr.")
                || lower.contains("_qr.")
                || lower.contains("-qr.")
                || lower.contains("erweima")
                || lower.contains("wechat_qr")
                || lower.contains("wx_qr")
                || lower.contains("二维码");
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
        if (value.startsWith("/taoke/upload/")) {
            return "https://cdn5-pxb-videos.taoke.com" + value;
        }
        if (value.startsWith("taoke/upload/")) {
            return "https://cdn5-pxb-videos.taoke.com/" + value;
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
