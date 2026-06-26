package com.taoke.course.service.video;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.course.config.LegacyThirdPartyVideoProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 宽学网录播播放地址签发（对齐老站 kx_video::getPlayVideoUrl → RemoteCourse/courseUrl）。
 *
 * @author Fangxinxin
 * @date 2026-06-11 14:30
 */
@Component
@RequiredArgsConstructor
public class KuanxuePlaybackSigner {

    private static final Pattern KUANXUE_SCHEME = Pattern.compile(
            "^kuanxue:([^:]+):([^:]+):([^:]+)$",
            Pattern.CASE_INSENSITIVE
    );

    private final LegacyThirdPartyVideoProperties properties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient = RestClient.create();

    public boolean supports(String storedUrl) {
        String raw = storedUrl == null ? "" : storedUrl.trim();
        if (raw.isEmpty()) {
            return false;
        }
        return KUANXUE_SCHEME.matcher(raw).matches()
                || raw.regionMatches(true, 0, "courseId=", 0, "courseId=".length());
    }

    /**
     * 向宽学网换取临时 mp4 播放地址。
     */
    public LegacyThirdPartyPlaybackSigner.SignedPlayback sign(String storedUrl) {
        LegacyThirdPartyVideoProperties.Kuanxue cfg = properties.getKuanxue();
        if (!cfg.isEnabled()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "宽学网录播播放暂未启用");
        }

        Map<String, String> chapterParams = parseChapterParams(storedUrl);
        if (chapterParams.get("courseId") == null || chapterParams.get("chapterId") == null) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "宽学网播放参数无效");
        }

        Map<String, String> query = new LinkedHashMap<>();
        query.put("company", cfg.getCorpId());
        query.put("corpId", cfg.getCorpId());
        query.put("url_method", "GET");
        query.putAll(chapterParams);

        String endpoint = normalizeBase(cfg.getApiUrl()) + "RemoteCourse/courseUrl";
        String requestUrl = UriComponentsBuilder.fromUriString(endpoint)
                .queryParam("company", query.get("company"))
                .queryParam("corpId", query.get("corpId"))
                .queryParam("url_method", query.get("url_method"))
                .queryParam("courseId", query.get("courseId"))
                .queryParam("chapterId", query.get("chapterId"))
                .queryParam("chapterType", query.getOrDefault("chapterType", "video"))
                .build(true)
                .toUriString();

        String body;
        try {
            body = restClient.get()
                    .uri(requestUrl)
                    .retrieve()
                    .body(String.class);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "宽学网播放地址获取失败");
        }

        String courseUrl = extractCourseUrl(body);
        if (courseUrl == null || courseUrl.isBlank()) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "宽学网未返回有效播放地址");
        }

        return new LegacyThirdPartyPlaybackSigner.SignedPlayback(courseUrl.trim(), "kuanxue", "direct");
    }

    private Map<String, String> parseChapterParams(String storedUrl) {
        String raw = storedUrl.trim();
        Matcher scheme = KUANXUE_SCHEME.matcher(raw);
        if (scheme.matches()) {
            Map<String, String> params = new LinkedHashMap<>();
            params.put("courseId", scheme.group(1));
            params.put("chapterId", scheme.group(2));
            params.put("chapterType", scheme.group(3));
            return params;
        }

        Map<String, String> params = new LinkedHashMap<>();
        for (String part : raw.split("&")) {
            int eq = part.indexOf('=');
            if (eq <= 0) {
                continue;
            }
            String key = part.substring(0, eq).trim();
            String value = URLDecoder.decode(part.substring(eq + 1).trim(), StandardCharsets.UTF_8);
            if (!key.isEmpty() && !value.isEmpty()) {
                params.put(key, value);
            }
        }
        return params;
    }

    private String extractCourseUrl(String body) {
        if (body == null || body.isBlank()) {
            return null;
        }
        try {
            JsonNode root = objectMapper.readTree(body);
            if (!"success".equalsIgnoreCase(root.path("status").asText())) {
                return null;
            }
            return root.path("result").path("courseUrl").asText(null);
        } catch (Exception e) {
            return null;
        }
    }

    private static String normalizeBase(String base) {
        if (base == null || base.isBlank()) {
            return "";
        }
        return base.endsWith("/") ? base : base + "/";
    }
}
