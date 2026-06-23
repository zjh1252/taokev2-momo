package com.taoke.legacy.handler.searchcourse;

import com.taoke.course.api.PxbLegacyVideoQueryService;
import com.taoke.legacy.adapter.LegacyCourseAdapter;
import com.taoke.legacy.service.LegacyParamResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdsListOptHandler implements SearchCourseOptHandler {

    private final LegacyParamResolver params;
    private final PxbLegacyVideoQueryService legacyVideoQueryService;
    private final LegacyCourseAdapter courseAdapter;

    @Override
    public String opt() {
        return "adsList";
    }

    @Override
    public Object handle(HttpServletRequest request) {
        String type = params.getString(request, "type", "video");
        if (!"video".equalsIgnoreCase(type)) {
            return java.util.Map.of();
        }
        return courseAdapter.toAdsResponse(legacyVideoQueryService.listVideoAds(24));
    }
}
