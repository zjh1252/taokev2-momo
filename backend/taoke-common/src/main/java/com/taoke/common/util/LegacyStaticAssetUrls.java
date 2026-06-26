package com.taoke.common.util;

import java.net.URI;
import java.util.Locale;
import java.util.Set;

/**
 * 老站静态资源 URL 拼接（Legacy 对外接口，对齐 PHP get.php / trainer.php）。
 */
public final class LegacyStaticAssetUrls {

    private static final Set<String> LEGACY_CDN_HOSTS = Set.of(
            "cdn-static.taoke.com",
            "cdn.test.taoke.com"
    );

    private static final Set<String> LEGACY_MAIN_HOSTS = Set.of(
            "www.taoke.com",
            "taoke.com"
    );

    private LegacyStaticAssetUrls() {
    }

    /**
     * 将库中相对路径转为对外可访问的完整 URL。
     *
     * @param path         头像 / 附件相对路径或已是绝对 URL
     * @param cdnBase      CDN 根，如 {@code https://cdn-static.taoke.com/taoke/}
     * @param mainSiteBase 主站根，如 {@code https://www.taoke.com/}
     */
    public static String resolve(String path, String cdnBase, String mainSiteBase) {
        if (path == null || path.isBlank()) {
            return "";
        }
        String value = path.trim().replace('\\', '/');
        if (value.startsWith("http://") || value.startsWith("https://")) {
            String relative = extractLegacyRelativePath(value);
            if (relative != null) {
                return resolve(relative, cdnBase, mainSiteBase);
            }
            return value;
        }
        if (value.startsWith("/")) {
            value = value.substring(1);
        }
        if (value.startsWith("u/")) {
            return withTrailingSlash(mainSiteBase) + value;
        }
        return withTrailingSlash(cdnBase) + value;
    }

    static String extractLegacyRelativePath(String absoluteUrl) {
        try {
            URI uri = URI.create(absoluteUrl.trim());
            String host = uri.getHost();
            if (host == null) {
                return null;
            }
            String hostLower = host.toLowerCase(Locale.ROOT);
            String uriPath = uri.getPath();
            if (uriPath == null || uriPath.isBlank()) {
                return null;
            }
            String normalizedPath = uriPath.startsWith("/") ? uriPath.substring(1) : uriPath;

            if (LEGACY_CDN_HOSTS.contains(hostLower)) {
                if (normalizedPath.startsWith("taoke/")) {
                    return normalizedPath.substring("taoke/".length());
                }
                return normalizedPath;
            }

            if (LEGACY_MAIN_HOSTS.contains(hostLower)) {
                if (normalizedPath.startsWith("u/")
                        || normalizedPath.startsWith("attachments/")
                        || normalizedPath.startsWith("statics/")) {
                    return normalizedPath;
                }
            }
        } catch (IllegalArgumentException ignored) {
            return null;
        }
        return null;
    }

    private static String withTrailingSlash(String base) {
        if (base == null || base.isBlank()) {
            return "";
        }
        return base.endsWith("/") ? base : base + "/";
    }
}
