package com.taoke.legacy.handler.get;

import com.taoke.course.api.PxbLegacyVideoStateService;
import com.taoke.legacy.service.LegacyParamResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class VideoStateOptHandler implements GetOptHandler {

    private final LegacyParamResolver params;
    private final PxbLegacyVideoStateService videoStateService;

    @Override
    public String opt() {
        return "video_state";
    }

    @Override
    public Object handle(HttpServletRequest request) {
        int videoId = params.getInt(request, "video_id", 0);
        if (videoId <= 0) {
            return Map.of("isok", false, "info", "视频Id不能为空。");
        }
        return videoStateService.getDetailStatus(videoId);
    }
}
