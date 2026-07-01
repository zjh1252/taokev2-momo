package com.taoke.legacy.service;

import com.taoke.course.api.PxbLegacyVideoQueryService;
import com.taoke.legacy.security.LegacySignatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class LegacyMobilePlayerService {

    private static final Pattern VID_CHILD = Pattern.compile("(vid=(?<vid>\\d*))|(child=(?<child>\\d*))");

    private final LegacySignatureService signatureService;
    private final PxbUserResolver userResolver;
    private final PxbLegacyVideoQueryService legacyVideoQueryService;
    private final LegacyConcurrencyLimiterService concurrencyLimiterService;

    public Map<String, Object> playForPxbMobile(int cdbid,
                                                 long timestamp,
                                                 int videoId,
                                                 String token,
                                                 String videoUrlEncoded,
                                                 String appId,
                                                 int pxbRootId) {
        Map<String, Object> fail = playerFail("未授权不能提供服务");
        if (cdbid <= 0 || !StringUtils.hasText(token) || timestamp <= 0) {
            return fail;
        }
        Map<String, String> signData = new LinkedHashMap<>();
        signData.put("appid", StringUtils.hasText(appId) ? appId : "taoke");
        signData.put("timetamp", String.valueOf(timestamp));
        signData.put("cdbid", String.valueOf(cdbid));
        signData.put("video_id", String.valueOf(videoId));
        if (!signatureService.verifySortedData(signData, signData.get("appid"), token)) {
            return fail;
        }
        if (!signatureService.isTimestampValid("taokevideo", timestamp)) {
            return fail;
        }

        int userId = userResolver.resolveUserId(
                StringUtils.hasText(appId) ? appId : "taoke", cdbid);
        if (userId <= 0) {
            return fail;
        }

        int resolvedVideoId = videoId;
        int chapterId = 0;
        String decodedUrl = decodeVideoUrl(videoUrlEncoded);
        if (StringUtils.hasText(decodedUrl)) {
            Matcher matcher = VID_CHILD.matcher(decodedUrl);
            while (matcher.find()) {
                if (StringUtils.hasText(matcher.group("vid"))) {
                    resolvedVideoId = Integer.parseInt(matcher.group("vid"));
                }
                if (StringUtils.hasText(matcher.group("child"))) {
                    chapterId = Integer.parseInt(matcher.group("child"));
                }
            }
        }
        if (resolvedVideoId <= 0) {
            return playerFail("未找到相匹配的资源");
        }

        Map<String, Object> playback = legacyVideoQueryService.resolveMobilePlayback(
                userId, resolvedVideoId, chapterId, pxbRootId > 0 ? pxbRootId : null);
        if (playback.isEmpty()) {
            return playerFail("课程未购买，不能提供服务");
        }

        int limit = legacyVideoQueryService.resolvePlaybackConcurrencyLimit(userId, resolvedVideoId);
        Map<String, Object> limitPayload = null;
        if (limit > 0) {
            String resourceId = concurrencyLimiterService.buildResourceId(userId, resolvedVideoId);
            String targetId = concurrencyLimiterService.acquireSlot(resourceId, limit);
            if (targetId == null) {
                return playerFail(limit + "个观看名额已满<br/>请联系管理追加购买");
            }
            limitPayload = Map.of(
                    "targetId", targetId,
                    "resourceId", resourceId,
                    "limit", limit,
                    "endtime", System.currentTimeMillis() / 1000 + 3600
            );
        }

        Map<String, Object> data = new LinkedHashMap<>(playback);
        data.put("limit", limitPayload);
        return playerOk(data);
    }

    private static String decodeVideoUrl(String raw) {
        if (!StringUtils.hasText(raw)) {
            return "";
        }
        try {
            String decoded = URLDecoder.decode(raw, StandardCharsets.UTF_8);
            byte[] bytes = Base64.getDecoder().decode(decoded);
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return raw;
        }
    }

    private static Map<String, Object> playerOk(Map<String, Object> data) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("isok", true);
        body.put("data", data);
        return body;
    }

    private static Map<String, Object> playerFail(String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("isok", false);
        body.put("data", message);
        return body;
    }
}
