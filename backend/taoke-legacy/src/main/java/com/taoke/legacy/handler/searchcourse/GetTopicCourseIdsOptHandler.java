package com.taoke.legacy.handler.searchcourse;

import com.taoke.course.api.PxbLegacyPackageQueryService;
import com.taoke.legacy.service.LegacyParamResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class GetTopicCourseIdsOptHandler implements SearchCourseOptHandler {

    private final LegacyParamResolver params;
    private final PxbLegacyPackageQueryService packageQueryService;

    @Override
    public String opt() {
        return "getTopicCourseIds";
    }

    @Override
    public Object handle(HttpServletRequest request) {
        int packageId = params.getInt(request, "package_id", 0);
        int secondId = params.getInt(request, "second_id", 0);
        List<Integer> ids = packageQueryService.listTopicCourseIds(packageId, secondId);
        return ids;
    }
}
