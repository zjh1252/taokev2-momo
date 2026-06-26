package com.taoke.legacy.handler.get;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.course.api.PxbLegacyVideoSyncService;
import com.taoke.legacy.service.LegacyParamResolver;
import com.taoke.legacy.service.PxbUserResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class TkvideoOptHandler implements GetOptHandler {

    private final LegacyParamResolver params;
    private final ObjectMapper objectMapper;
    private final PxbUserResolver pxbUserResolver;
    private final PxbLegacyVideoSyncService videoSyncService;

    @Override
    public String opt() {
        return "tkvideo";
    }

    @Override
    public Object handle(HttpServletRequest request) {
        String raw = params.getString(request, "video");
        if (!StringUtils.hasText(raw)) {
            return Map.of("isok", false, "msg", "数据不能为空。");
        }
        try {
            Map<String, Object> payload = objectMapper.readValue(raw, new TypeReference<>() {});
            @SuppressWarnings("unchecked")
            Map<String, Object> video = payload.get("video") instanceof Map<?, ?> map
                    ? (Map<String, Object>) map
                    : Map.of();
            int pxbUid = intVal(video.get("uid"));
            int publisherUserId = pxbUserResolver.resolveUserId(pxbUid);
            return videoSyncService.handle(payload, publisherUserId);
        } catch (Exception e) {
            return Map.of("isok", false, "msg", "数据不能为空。");
        }
    }

    private static int intVal(Object raw) {
        if (raw == null) {
            return 0;
        }
        if (raw instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(raw).trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
