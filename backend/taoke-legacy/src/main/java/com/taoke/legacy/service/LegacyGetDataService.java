package com.taoke.legacy.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LegacyGetDataService {

    private final LegacyConcurrencyLimiterService concurrencyLimiterService;
    private final ObjectMapper objectMapper;

    public Map<String, Object> dispatch(String jsonBody) {
        if (!StringUtils.hasText(jsonBody)) {
            return error("invalid json");
        }
        try {
            Map<String, Object> root = objectMapper.readValue(jsonBody, new TypeReference<>() {});
            String cmd = root.get("cmd") != null ? String.valueOf(root.get("cmd")) : "";
            if (!"video_orders".equals(cmd)) {
                return error("unsupported cmd");
            }
            Object dataObj = root.get("data");
            if (!(dataObj instanceof Map<?, ?> data)) {
                return error("invalid data");
            }
            String action = data.get("action") != null ? String.valueOf(data.get("action")) : "";
            if ("concurrencyLimiter".equals(action)) {
                return handleConcurrencyLimiter(data);
            }
            return error("unsupported action");
        } catch (Exception e) {
            return error("invalid json");
        }
    }

    private Map<String, Object> handleConcurrencyLimiter(Map<?, ?> data) {
        String targetId = stringVal(data.get("targetId"));
        String resourceId = stringVal(data.get("resourceId"));
        if (!StringUtils.hasText(targetId) || !StringUtils.hasText(resourceId)) {
            return error("invalid concurrency payload");
        }
        concurrencyLimiterService.heartbeat(resourceId, targetId);
        Map<String, Object> rsp = new LinkedHashMap<>();
        rsp.put("isok", true);
        rsp.put("tip", "success");
        return rsp;
    }

    private static String stringVal(Object raw) {
        return raw != null ? String.valueOf(raw).trim() : "";
    }

    private static Map<String, Object> error(String tip) {
        Map<String, Object> rsp = new LinkedHashMap<>();
        rsp.put("isok", false);
        rsp.put("tip", tip);
        return rsp;
    }
}
