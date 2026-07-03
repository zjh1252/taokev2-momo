package com.taoke.course.service.video;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 本地淘课录播 URL 补全（对齐老站 videoPlayUrl / PXB CDN）。
 */
@Component
@RequiredArgsConstructor
public class LegacyLocalVideoUrlResolver {

    private static final String PXB_CDN = "https://cdn5-pxb-videos.taoke.com/";

    private final LegacyPxbVideoUrlResolver pxbVideoUrlResolver;

    public String resolve(String storedUrl, int publisherId) {
        String url = storedUrl == null ? "" : storedUrl.trim();
        if (url.isEmpty()) {
            return url;
        }
        if (url.startsWith("http://") || url.startsWith("https://")) {
            return pxbVideoUrlResolver.fixMisMigratedFullUrl(url);
        }
        if (url.contains("/")) {
            return PXB_CDN + stripLeadingSlash(url);
        }
        return PXB_CDN + "taoke/old-videos/videos/" + url + ".mp4";
    }

    public String resolvePoster(String playUrl, String coverUrl) {
        if (coverUrl != null && !coverUrl.isBlank()) {
            if (coverUrl.startsWith("http://") || coverUrl.startsWith("https://")) {
                return coverUrl;
            }
            return PXB_CDN + stripLeadingSlash(coverUrl);
        }
        return "";
    }

    private static String stripLeadingSlash(String value) {
        return value.startsWith("/") ? value.substring(1) : value;
    }
}
