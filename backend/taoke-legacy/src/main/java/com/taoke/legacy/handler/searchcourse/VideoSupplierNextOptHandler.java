package com.taoke.legacy.handler.searchcourse;

import com.taoke.course.api.PxbLegacyPackageQueryService;
import com.taoke.legacy.service.LegacyParamResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class VideoSupplierNextOptHandler implements SearchCourseOptHandler {

    private final LegacyParamResolver params;
    private final PxbLegacyPackageQueryService packageQueryService;

    @Override
    public String opt() {
        return "videoSupplierNext";
    }

    @Override
    public Map<String, Object> handle(HttpServletRequest request) {
        int videoId = params.getInt(request, "video_id", 0);
        int nextId = packageQueryService.findNextPackageVideoId(videoId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("video_id", nextId);
        return body;
    }
}
