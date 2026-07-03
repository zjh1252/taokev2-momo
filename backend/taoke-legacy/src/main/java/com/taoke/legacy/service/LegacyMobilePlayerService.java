package com.taoke.legacy.service;

import com.taoke.course.api.PxbLegacyVideoQueryService;
import com.taoke.course.dto.pxb.PxbLegacyMobilePlaybackResult;
import com.taoke.legacy.security.LegacySignatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class LegacyMobilePlayerService {

    private static final Pattern VID_CHILD = Pattern.compile("(vid=(?<vid>\\d*))|(child=(?<child>\\d*))");
    private static final Set<Integer> PXB_MOBILE_JSON_V_TYPES = Set.of(1, 6, 7, 11);
    private static final Set<Integer> PC_NATIVE_VIDEO_V_TYPES = Set.of(1, 6, 7, 11);
    private static final int LEGACY_LIMIT_ENDTIME = 3600;

    private final LegacySignatureService signatureService;
    private final PxbUserResolver userResolver;
    private final PxbLegacyVideoQueryService legacyVideoQueryService;
    private final LegacyConcurrencyLimiterService concurrencyLimiterService;
    private final LegacyMobileSupplierHtmlRenderer supplierHtmlRenderer;
    private final LegacyMobilePlayerHtmlRenderer playerHtmlRenderer;

    public LegacyMobilePlayResult play(int cdbid,
                                       long timestamp,
                                       int videoId,
                                       String token,
                                       String videoUrlEncoded,
                                       String appId,
                                       int pxbRootId,
                                       boolean pxbMobile,
                                       boolean pxbPcOrigin,
                                       String publicBaseUrl) {
        if (cdbid <= 0 || !StringUtils.hasText(token) || timestamp <= 0
                || !StringUtils.hasText(videoUrlEncoded)) {
            return failResult(pxbMobile, "未授权不能提供服务");
        }

        String resolvedAppId = StringUtils.hasText(appId) ? appId : "taoke";
        Map<String, String> signData = new LinkedHashMap<>();
        signData.put("appid", resolvedAppId);
        signData.put("timetamp", String.valueOf(timestamp));
        signData.put("cdbid", String.valueOf(cdbid));
        signData.put("video_id", String.valueOf(videoId));
        if (!signatureService.verifySortedData(signData, resolvedAppId, token)) {
            return failResult(pxbMobile, "未授权不能提供服务");
        }
        if (!signatureService.isTimestampValid("taokevideo", timestamp)) {
            return failResult(pxbMobile, "未授权不能提供服务");
        }

        int userId = userResolver.resolveUserId(resolvedAppId, cdbid);
        if (userId <= 0) {
            return failResult(pxbMobile, "未授权不能提供服务");
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
            return failResult(pxbMobile, "未找到相匹配的资源");
        }

        Integer rootFilter = pxbRootId > 0 ? pxbRootId : null;
        PxbLegacyMobilePlaybackResult playback = legacyVideoQueryService.resolveMobilePlayback(
                userId, resolvedVideoId, chapterId, rootFilter);
        if (!playback.isSuccess()) {
            String message = playback.getRejectMessage() != null
                    ? playback.getRejectMessage() : "课程未购买，不能提供服务";
            return failResult(pxbMobile, message);
        }

        Map<String, Object> limitPayload = resolveLimitPayload(userId, resolvedVideoId, rootFilter);
        if (limitPayload == null) {
            int limit = legacyVideoQueryService.resolvePlaybackConcurrencyLimit(
                    userId, resolvedVideoId, rootFilter);
            return failResult(pxbMobile, limit + "个观看名额已满<br/>请联系管理追加购买");
        }
        Map<String, Object> heartbeat = limitPayload.isEmpty() ? null : limitPayload;

        if (!pxbMobile) {
            return renderPcPlayer(playback, heartbeat, pxbPcOrigin, publicBaseUrl);
        }

        if (playback.isSupplierPage() || !PXB_MOBILE_JSON_V_TYPES.contains(playback.getVType())) {
            String html = supplierHtmlRenderer.render(
                    playback.getVType(), playback.getVideoUrl(), heartbeat, null);
            return LegacyMobilePlayResult.html(html);
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("video_url", playback.getVideoUrl());
        data.put("poster", playback.getPoster());
        data.put("online", playback.isOnline());
        data.put("size", playback.getSize());
        data.put("limit", heartbeat);
        return LegacyMobilePlayResult.json(playerOk(data));
    }

    private LegacyMobilePlayResult renderPcPlayer(PxbLegacyMobilePlaybackResult playback,
                                                  Map<String, Object> heartbeat,
                                                  boolean pxbPcOrigin,
                                                  String publicBaseUrl) {
        if (playback.isSupplierPage() || !PC_NATIVE_VIDEO_V_TYPES.contains(playback.getVType())) {
            String html = supplierHtmlRenderer.render(
                    playback.getVType(), playback.getVideoUrl(), heartbeat, null);
            return LegacyMobilePlayResult.html(html);
        }
        String html = playerHtmlRenderer.renderVideo(
                playback.getVideoUrl(),
                playback.getPoster(),
                pxbPcOrigin,
                playback.isOnline(),
                heartbeat,
                publicBaseUrl);
        return LegacyMobilePlayResult.html(html);
    }

    private LegacyMobilePlayResult failResult(boolean pxbMobile, String message) {
        if (pxbMobile) {
            return LegacyMobilePlayResult.json(playerFail(message));
        }
        return LegacyMobilePlayResult.html(playerHtmlRenderer.renderError(stripHtml(message)));
    }

    public String renderSupplierPage(int videoId, int vType, String tokenEncoded, int length) {
        if (videoId <= 0 || !StringUtils.hasText(tokenEncoded) || tokenEncoded.length() != length) {
            return supplierHtmlRenderer.render(0, "", null, "未授权不能提供服务");
        }
        String playUrl;
        try {
            playUrl = new String(Base64.getDecoder().decode(tokenEncoded), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return supplierHtmlRenderer.render(0, "", null, "未授权不能提供服务");
        }
        return supplierHtmlRenderer.render(vType, playUrl, null, null);
    }

    /** @return 空 Map=不限并发；null=名额已满 */
    private Map<String, Object> resolveLimitPayload(int userId, int videoId, Integer pxbRootId) {
        int limit = legacyVideoQueryService.resolvePlaybackConcurrencyLimit(userId, videoId, pxbRootId);
        if (limit <= 0) {
            return Map.of();
        }
        String resourceId = concurrencyLimiterService.buildResourceId(userId, videoId);
        String targetId = concurrencyLimiterService.acquireSlot(resourceId, limit);
        if (targetId == null) {
            return null;
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("targetId", targetId);
        payload.put("resourceId", resourceId);
        payload.put("limit", limit);
        payload.put("endtime", LEGACY_LIMIT_ENDTIME);
        return payload;
    }

    private static String stripHtml(String message) {
        return message == null ? "" : message.replace("<br/>", " ").replace("<br>", " ");
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
