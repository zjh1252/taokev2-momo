package com.taoke.course.service.video;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.course.config.LegacyThirdPartyVideoProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 纵贯线录播播放地址签发（对齐老站 zgxVideo::getPlayUrl）。
 */
@Component
@RequiredArgsConstructor
public class ZgxPlaybackSigner {

    private final LegacyThirdPartyVideoProperties properties;

    public boolean supports(int vType) {
        return vType >= 9 && vType <= 11;
    }

    public LegacyThirdPartyPlaybackSigner.SignedPlayback sign(String storedPath, int vType, boolean aliOss) {
        LegacyThirdPartyVideoProperties.Zgx cfg = properties.getZgx();
        if (!cfg.isEnabled()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "纵贯线录播播放暂未启用");
        }
        String path = storedPath == null ? "" : storedPath.trim();
        if (path.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "纵贯线播放参数无效");
        }
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return new LegacyThirdPartyPlaybackSigner.SignedPlayback(path, "zgx", "direct");
        }

        if (vType == 11 && aliOss) {
            String hash = md5Hex(md5Hex(path) + "_tkw");
            String url = stripTrailingSlash(cfg.getCdnUrl())
                    + "/taoke/" + cfg.getPathPrefix() + "/videos/" + hash + ".mp4";
            return new LegacyThirdPartyPlaybackSigner.SignedPlayback(url, "zgx", "direct");
        }

        String localUrl = buildLocalPlayUrl(path, vType, cfg.getPathPrefix());
        if (vType == 10) {
            String site = cfg.getH5SiteUrl();
            if (!site.endsWith("/")) {
                site = site + "/";
            }
            String url = site + stripLeadingSlash(localUrl);
            return new LegacyThirdPartyPlaybackSigner.SignedPlayback(url, "zgx", "direct");
        }
        return new LegacyThirdPartyPlaybackSigner.SignedPlayback(signCdnUrl(localUrl, cfg), "zgx", "direct");
    }

    static String buildLocalPlayUrl(String path, int vType, String pathPrefix) {
        String ext = switch (vType) {
            case 9 -> ".jpg";
            case 10 -> "/index.html";
            case 11 -> ".mp4";
            default -> "";
        };
        if (ext.isEmpty()) {
            return "";
        }
        String normalized = path.length() > 2 ? path.substring(0, path.length() - 2) + "/" + path : path;
        return "/taoke/old-videos/supplier/" + pathPrefix + "/" + normalized + ext;
    }

    private static String signCdnUrl(String localUrl, LegacyThirdPartyVideoProperties.Zgx cfg) {
        if (localUrl == null || localUrl.isBlank()) {
            return "";
        }
        long timestamp = System.currentTimeMillis() / 1000 + 1800;
        String authKey = timestamp + "-" + ThreadLocalRandom.current().nextInt(10, 50)
                + "-" + ThreadLocalRandom.current().nextInt(50, 91) + "-";
        String hashValue = md5Hex(localUrl + "-" + authKey + cfg.getAliAuthKey());
        return stripTrailingSlash(cfg.getCdnUrl()) + localUrl + "?auth_key=" + authKey + hashValue;
    }

    public static boolean inferAliOss(int vType, String storedUrl) {
        if (vType != 11 || storedUrl == null) {
            return false;
        }
        String raw = storedUrl.trim();
        return !raw.startsWith("http://") && !raw.startsWith("https://");
    }

    private static String stripTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private static String stripLeadingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.startsWith("/") ? value.substring(1) : value;
    }

    private static String md5Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("MD5");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash).toLowerCase(Locale.ROOT);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("MD5 不可用", e);
        }
    }
}
