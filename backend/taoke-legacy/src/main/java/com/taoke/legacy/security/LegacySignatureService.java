package com.taoke.legacy.security;

import com.taoke.legacy.config.LegacyApiProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;
import java.util.TreeMap;

/**
 * 复刻 PHP {@code create_signature} / {@code checked_signature}。
 */
@Service
@RequiredArgsConstructor
public class LegacySignatureService {

    private final LegacyApiProperties properties;

    public boolean verify(String appid, long timestamp, String opt, String signature) {
        if (!StringUtils.hasText(signature) || !StringUtils.hasText(appid) || !StringUtils.hasText(opt)) {
            return false;
        }
        String expected = sign(appid, timestamp, opt);
        return expected.equalsIgnoreCase(signature.trim());
    }

    public String sign(String appid, long timestamp, String opt) {
        Map<String, String> data = new TreeMap<>();
        data.put("appid", appid);
        data.put("opt", opt);
        data.put("timetamp", String.valueOf(timestamp));
        return signSortedData(data, appid);
    }

    public boolean verifySortedData(Map<String, String> data, String appid, String signature) {
        if (!StringUtils.hasText(signature) || data == null || data.isEmpty()) {
            return false;
        }
        String expected = signSortedData(data, appid);
        return expected.equalsIgnoreCase(signature.trim());
    }

    public String signSortedData(Map<String, String> data, String appid) {
        Map<String, String> sorted = new TreeMap<>(data);
        String query = sorted.entrySet().stream()
                .map(e -> phpUrlEncode(e.getKey()) + "=" + phpUrlEncode(e.getValue()))
                .reduce((a, b) -> a + "&" + b)
                .orElse("");
        String secret = properties.getSignatureKeys().get(appid);
        if (!StringUtils.hasText(secret)) {
            return "";
        }
        return md5Hex(query + secret);
    }

    public boolean isTimestampValid(String apiFile, long timestamp) {
        long now = System.currentTimeMillis() / 1000;
        long skew = "search_course.php".equals(apiFile)
                ? properties.getSearchCourseTimestampSkewSeconds()
                : properties.getDefaultTimestampSkewSeconds();
        return timestamp > 0 && timestamp >= now - skew;
    }

    /** 对齐 PHP {@code urlencode}（空格为 +）。 */
    static String phpUrlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    static String md5Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("MD5");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("MD5 not available", e);
        }
    }
}
