package com.taoke.legacy.handler.searchcourse;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.course.api.PxbLegacyResourceTypeSyncService;
import com.taoke.legacy.service.LegacyParamResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class SyncCourseOptHandler implements SearchCourseOptHandler {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final LegacyParamResolver params;
    private final PxbLegacyResourceTypeSyncService courseSyncService;
    private final ObjectMapper objectMapper;

    @Override
    public String opt() {
        return "sync_course";
    }

    @Override
    public Map<String, Object> handle(HttpServletRequest request) {
        Map<String, Object> courses = parseCoursesPayload(params.getString(request, "courses"));
        if (courses.isEmpty()) {
            return fail("课程同步参数有误");
        }
        if (courseSyncService.syncPxbResourceTypes(courses)) {
            return success("课程同步成功");
        }
        return fail("课程同步参数有误");
    }

    private Map<String, Object> parseCoursesPayload(String raw) {
        if (!StringUtils.hasText(raw)) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(raw.trim(), MAP_TYPE);
        } catch (Exception e) {
            return Map.of();
        }
    }

    private static Map<String, Object> success(String msg) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("isok", true);
        body.put("msg", msg);
        return body;
    }

    private static Map<String, Object> fail(String msg) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("isok", false);
        body.put("msg", msg);
        return body;
    }
}
