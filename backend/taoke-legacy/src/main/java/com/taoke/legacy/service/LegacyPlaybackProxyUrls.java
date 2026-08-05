package com.taoke.legacy.service;

import org.springframework.util.StringUtils;

/**
 * 将 PXB CDN 播放地址改写为同源反代路径，避免 iframe/video 标签携带 Referer 被 CDN 403。
 */
public final class LegacyPlaybackProxyUrls {

    private static final String PXB_CDN_HTTPS = "https://cdn5-pxb-videos.taoke.com/";
    private static final String PXB_CDN_HTTP = "http://cdn5-pxb-videos.taoke.com/";

    private LegacyPlaybackProxyUrls() {
    }

    public static String toSameOriginProxy(String playUrl) {
        String path = toSameOriginProxyPath(playUrl);
        return path == null ? playUrl : path;
    }

    /** @return 反代路径（以 /pxb-videos/ 开头），非 PXB CDN 则 null */
    public static String toSameOriginProxyPath(String playUrl) {
        if (!StringUtils.hasText(playUrl)) {
            return null;
        }
        String trimmed = playUrl.trim();
        if (trimmed.regionMatches(true, 0, PXB_CDN_HTTPS, 0, PXB_CDN_HTTPS.length())) {
            return "/pxb-videos/" + trimmed.substring(PXB_CDN_HTTPS.length());
        }
        if (trimmed.regionMatches(true, 0, PXB_CDN_HTTP, 0, PXB_CDN_HTTP.length())) {
            return "/pxb-videos/" + trimmed.substring(PXB_CDN_HTTP.length());
        }
        return null;
    }

    public static String toAbsoluteProxy(String playUrl, String publicBaseUrl) {
        String path = toSameOriginProxyPath(playUrl);
        if (path == null) {
            return playUrl;
        }
        if (!StringUtils.hasText(publicBaseUrl)) {
            return path;
        }
        String base = publicBaseUrl.endsWith("/") ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1) : publicBaseUrl;
        return base + path;
    }
}
