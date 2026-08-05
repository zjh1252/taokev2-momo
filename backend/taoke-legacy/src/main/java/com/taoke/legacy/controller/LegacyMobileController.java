package com.taoke.legacy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.security.Public;
import com.taoke.legacy.service.LegacyGetDataService;
import com.taoke.legacy.service.LegacyMobilePlayResult;
import com.taoke.legacy.service.LegacyMobilePlayerService;
import com.taoke.legacy.service.LegacyParamResolver;
import com.taoke.legacy.support.LegacyJsonpResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * 培训宝 legacy 移动站：taokevideo 播放 + getData 并发心跳。
 * <p>
 * 对齐老站 {@code ?c=taokevideo&a=player} 与 {@code /getData/?json=...}。
 */
@RestController
@RequiredArgsConstructor
public class LegacyMobileController {

    private final LegacyParamResolver paramResolver;
    private final LegacyMobilePlayerService mobilePlayerService;
    private final LegacyGetDataService getDataService;
    private final ObjectMapper objectMapper;

    @Public
    @GetMapping(params = {"c=taokevideo", "a=player"})
    public ResponseEntity<String> taokeVideoPlayer(HttpServletRequest request) throws Exception {
        return handlePlayer(request);
    }

    @Public
    @PostMapping(params = {"c=taokevideo", "a=player"})
    public ResponseEntity<String> taokeVideoPlayerPost(HttpServletRequest request) throws Exception {
        return handlePlayer(request);
    }

    @Public
    @GetMapping(params = {"c=taokevideo", "a=supplier"}, produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> taokeVideoSupplier(HttpServletRequest request) {
        int videoId = paramResolver.getInt(request, "video_id", 0);
        int vType = paramResolver.getInt(request, "v_type", 0);
        String token = paramResolver.getString(request, "token");
        int length = paramResolver.getInt(request, "length", 0);
        String html = mobilePlayerService.renderSupplierPage(videoId, vType, token, length);
        return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
    }

    @Public
    @GetMapping(value = {"/getData", "/getData/"})
    public ResponseEntity<String> getDataGet(@RequestParam(value = "json", required = false) String json,
                                            HttpServletRequest request) throws Exception {
        return jsonOrJsonp(getDataService.dispatch(resolveJson(json, request)), request);
    }

    @Public
    @PostMapping(value = {"/getData", "/getData/"})
    public ResponseEntity<String> getDataPost(HttpServletRequest request) throws Exception {
        String json = paramResolver.getString(request, "json");
        if (!StringUtils.hasText(json)) {
            json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            if (json.startsWith("json=")) {
                json = json.substring(5);
            }
        }
        return jsonOrJsonp(getDataService.dispatch(json), request);
    }

    @Public
    @GetMapping(params = {"c=taokeajax", "a=getData"})
    public ResponseEntity<String> taokeAjaxGetData(@RequestParam(value = "json", required = false) String json,
                                                   HttpServletRequest request) throws Exception {
        return jsonOrJsonp(getDataService.dispatch(resolveJson(json, request)), request);
    }

    @Public
    @PostMapping(params = {"c=taokeajax", "a=getData"})
    public ResponseEntity<String> taokeAjaxGetDataPost(HttpServletRequest request) throws Exception {
        String json = paramResolver.getString(request, "json");
        if (!StringUtils.hasText(json)) {
            json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            if (json.startsWith("json=")) {
                json = json.substring(5);
            }
        }
        return jsonOrJsonp(getDataService.dispatch(json), request);
    }

    private ResponseEntity<String> handlePlayer(HttpServletRequest request) throws Exception {
        boolean pxbMobile = "pxbmobile".equalsIgnoreCase(paramResolver.getString(request, "from"));
        String videoOrigin = paramResolver.getString(request, "video_origin");
        boolean pxbPcOrigin = "pxbpc".equalsIgnoreCase(videoOrigin);
        int cdbid = paramResolver.getInt(request, "cdbid", 0);
        long timestamp = paramResolver.getLong(request, "timestamp", 0L);
        int videoId = paramResolver.getInt(request, "video_id", 0);
        String token = paramResolver.getString(request, "token");
        String videoUrl = paramResolver.getString(request, "video_url");
        String appId = paramResolver.getString(request, "app_id", "taoke");
        int pxbRootId = paramResolver.getInt(request, "pxb_root_id", 0);

        LegacyMobilePlayResult result = mobilePlayerService.play(
                cdbid, timestamp, videoId, token, videoUrl, appId, pxbRootId, pxbMobile, pxbPcOrigin,
                buildPublicBaseUrl(request));

        if (result.getKind() == LegacyMobilePlayResult.Kind.HTML) {
            return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(result.getHtml());
        }

        String json = objectMapper.writeValueAsString(result.getJsonBody());
        String callback = paramResolver.getString(request, "callback");
        return LegacyJsonpResponse.ok(json, callback);
    }

    private String resolveJson(String json, HttpServletRequest request) {
        if (StringUtils.hasText(json)) {
            return json;
        }
        return paramResolver.getString(request, "json");
    }

    private ResponseEntity<String> jsonOrJsonp(Map<String, Object> body, HttpServletRequest request)
            throws Exception {
        String json = objectMapper.writeValueAsString(body);
        return LegacyJsonpResponse.ok(json, paramResolver.getString(request, "callback"));
    }

    private static String buildPublicBaseUrl(HttpServletRequest request) {
        String scheme = request.getScheme();
        String host = request.getServerName();
        int port = request.getServerPort();
        boolean defaultPort = ("http".equalsIgnoreCase(scheme) && port == 80)
                || ("https".equalsIgnoreCase(scheme) && port == 443);
        return defaultPort ? scheme + "://" + host : scheme + "://" + host + ":" + port;
    }
}
