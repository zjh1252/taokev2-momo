package com.taoke.legacy.handler.searchcourse;

import com.taoke.course.api.PxbLegacyVideoQueryService;
import com.taoke.legacy.service.LegacyParamResolver;
import com.taoke.legacy.service.PxbUserResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class VideoDetailOptHandler implements SearchCourseOptHandler {

    private final LegacyParamResolver params;
    private final PxbUserResolver userResolver;
    private final PxbLegacyVideoQueryService legacyVideoQueryService;

    @Override
    public String opt() {
        return "VideoDetail";
    }

    @Override
    public Object handle(HttpServletRequest request) {
        int videoId = params.getInt(request, "video_id", 0);
        int pxbUid = params.getInt(request, "uid", 0);
        int pxbRootId = params.getInt(request, "pxb_root_id", 0);
        int userId = userResolver.resolveUserId(request, pxbUid);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("isok", true);
        if (videoId <= 0 || userId <= 0) {
            body.put("msg", Map.of());
            return body;
        }
        Map<String, Object> msg = legacyVideoQueryService.buildVideoDetailMessage(
                userId, videoId, pxbRootId > 0 ? pxbRootId : null);
        body.put("msg", msg);
        return body;
    }
}
