package com.taoke.legacy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.security.Public;
import com.taoke.legacy.service.LegacyGetDataService;
import com.taoke.legacy.service.LegacyMobilePlayerService;
import com.taoke.legacy.service.LegacyParamResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
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
    @GetMapping(params = {"c=taokevideo", "a=player"}, produces = MediaType.APPLICATION_JSON_VALUE)
    public String taokeVideoPlayer(HttpServletRequest request) throws Exception {
        return handlePlayer(request);
    }

    @Public
    @PostMapping(params = {"c=taokevideo", "a=player"}, produces = MediaType.APPLICATION_JSON_VALUE)
    public String taokeVideoPlayerPost(HttpServletRequest request) throws Exception {
        return handlePlayer(request);
    }

    @Public
    @GetMapping(value = "/getData", produces = MediaType.APPLICATION_JSON_VALUE)
    public String getDataGet(@RequestParam(value = "json", required = false) String json,
                             HttpServletRequest request) throws Exception {
        return writeJson(getDataService.dispatch(resolveJson(json, request)));
    }

    @Public
    @PostMapping(value = "/getData", produces = MediaType.APPLICATION_JSON_VALUE)
    public String getDataPost(HttpServletRequest request) throws Exception {
        String json = paramResolver.getString(request, "json");
        if (!StringUtils.hasText(json)) {
            json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            if (json.startsWith("json=")) {
                json = json.substring(5);
            }
        }
        return writeJson(getDataService.dispatch(json));
    }

    @Public
    @GetMapping(params = {"c=taokeajax", "a=getData"}, produces = MediaType.APPLICATION_JSON_VALUE)
    public String taokeAjaxGetData(@RequestParam(value = "json", required = false) String json,
                                   HttpServletRequest request) throws Exception {
        return writeJson(getDataService.dispatch(resolveJson(json, request)));
    }

    @Public
    @PostMapping(params = {"c=taokeajax", "a=getData"}, produces = MediaType.APPLICATION_JSON_VALUE)
    public String taokeAjaxGetDataPost(HttpServletRequest request) throws Exception {
        String json = paramResolver.getString(request, "json");
        if (!StringUtils.hasText(json)) {
            json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            if (json.startsWith("json=")) {
                json = json.substring(5);
            }
        }
        return writeJson(getDataService.dispatch(json));
    }

    private String handlePlayer(HttpServletRequest request) throws Exception {
        boolean pxbMobile = "pxbmobile".equalsIgnoreCase(paramResolver.getString(request, "from"));
        if (!pxbMobile) {
            Map<String, Object> fail = Map.of("isok", false, "data", "仅支持 from=pxbmobile");
            return objectMapper.writeValueAsString(fail);
        }
        int cdbid = paramResolver.getInt(request, "cdbid", 0);
        long timestamp = paramResolver.getLong(request, "timestamp", 0L);
        int videoId = paramResolver.getInt(request, "video_id", 0);
        String token = paramResolver.getString(request, "token");
        String videoUrl = paramResolver.getString(request, "video_url");
        String appId = paramResolver.getString(request, "app_id", "taoke");
        int pxbRootId = paramResolver.getInt(request, "pxb_root_id", 0);

        Map<String, Object> body = mobilePlayerService.playForPxbMobile(
                cdbid, timestamp, videoId, token, videoUrl, appId, pxbRootId);
        String json = objectMapper.writeValueAsString(body);
        String callback = paramResolver.getString(request, "callback");
        if (StringUtils.hasText(callback)) {
            return callback + "(" + json + ")";
        }
        return json;
    }

    private String resolveJson(String json, HttpServletRequest request) {
        if (StringUtils.hasText(json)) {
            return json;
        }
        return paramResolver.getString(request, "json");
    }

    private String writeJson(Map<String, Object> body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }
}
