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

/**
 * 思酷租赁录播播放地址签发（对齐老站 schoVideo::getPlayUrl）。
 *
 * @author Fangxinxin
 * @date 2026-06-11 16:00
 */
@Component
@RequiredArgsConstructor
public class SchoPlaybackSigner {

    private final LegacyThirdPartyVideoProperties properties;

    public boolean supports(String storedUrl) {
        String raw = storedUrl == null ? "" : storedUrl.trim();
        if (raw.isEmpty()) {
            return false;
        }
        if (raw.regionMatches(true, 0, "scho:", 0, "scho:".length())) {
            return true;
        }
        return raw.startsWith("/lease/");
    }

    /**
     * 对租赁路径本地 MD5 签名，返回 iframe embed 地址。
     */
    public LegacyThirdPartyPlaybackSigner.SignedPlayback sign(String storedUrl) {
        LegacyThirdPartyVideoProperties.Scho cfg = properties.getScho();
        if (!cfg.isEnabled()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "思酷录播播放暂未启用");
        }

        String leasePath = normalizeLeasePath(storedUrl);
        long timestamp = System.currentTimeMillis();
        String signature = md5Hex(leasePath + cfg.getSecretKey() + timestamp);

        String base = stripTrailingSlash(cfg.getApiUrl());
        String embedUrl = base + leasePath + "?timestamp=" + timestamp + "&signature=" + signature;
        return new LegacyThirdPartyPlaybackSigner.SignedPlayback(embedUrl, "scho", "embed");
    }

    private static String normalizeLeasePath(String storedUrl) {
        String value = storedUrl.trim();
        if (value.regionMatches(true, 0, "scho:", 0, "scho:".length())) {
            value = value.substring("scho:".length()).trim();
        }
        if (!value.startsWith("/")) {
            value = "/" + value;
        }
        if (!value.startsWith("/lease/")) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "思酷租赁路径无效");
        }
        return value;
    }

    private static String stripTrailingSlash(String base) {
        if (base == null || base.isBlank()) {
            return "";
        }
        return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
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
