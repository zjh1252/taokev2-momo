package com.taoke.course.service.video;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 培训宝共享录播 URL（对齐老站 tk_video::getPxbVideoUrl）。
 */
@Component
public class LegacyPxbVideoUrlResolver {

    private static final String PXB_CDN = "https://cdn5-pxb-videos.taoke.com/";
    private static final Pattern WRONG_V88_MIGRATION = Pattern.compile(
            "(https?://cdn5-pxb-videos\\.taoke\\.com/)taoke/old-videos/videos/([a-f0-9]{32})\\.mp4",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern MD5_KEY = Pattern.compile("^[a-f0-9]{32}$", Pattern.CASE_INSENSITIVE);

    /**
     * 将存储值解析为可播放的 PXB CDN 地址。
     */
    public String resolve(String storedUrl) {
        String url = storedUrl == null ? "" : storedUrl.trim();
        if (url.isEmpty()) {
            return "";
        }
        url = fixMisMigratedFullUrl(url);
        if (url.startsWith("http://") || url.startsWith("https://")) {
            return url;
        }
        String key = stripLeadingSlash(url);
        if (key.contains("/")) {
            String[] segments = key.split("/");
            if (segments.length > 2) {
                return PXB_CDN + key;
            }
        }
        String bareKey = key.endsWith(".mp4") ? key.substring(0, key.length() - 4) : key;
        return PXB_CDN + "old-videos/" + bareKey + ".mp4";
    }

    /**
     * V88 误将 PXB 共享 key 迁移为 v_type=1 路径时，改回 {@code old-videos/{md5}.mp4}。
     */
    public String fixMisMigratedFullUrl(String url) {
        if (!StringUtils.hasText(url)) {
            return url;
        }
        Matcher matcher = WRONG_V88_MIGRATION.matcher(url.trim());
        if (matcher.matches()) {
            return matcher.group(1) + "old-videos/" + matcher.group(2) + ".mp4";
        }
        return url;
    }

    public boolean isBareMd5Key(String value) {
        return value != null && MD5_KEY.matcher(value.trim()).matches();
    }

    private static String stripLeadingSlash(String value) {
        return value.startsWith("/") ? value.substring(1) : value;
    }
}
