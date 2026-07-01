package com.taoke.legacy.handler.searchcourse;

import com.taoke.course.api.PxbLegacyVideoQueryService;
import com.taoke.course.dto.pxb.PxbLegacyPurchaseInfo;
import com.taoke.legacy.adapter.LegacyCourseAdapter;
import com.taoke.legacy.service.LegacyParamResolver;
import com.taoke.legacy.service.PxbUserResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class GetCourseBuyStatusOptHandler implements SearchCourseOptHandler {

    private final LegacyParamResolver params;
    private final PxbUserResolver userResolver;
    private final PxbLegacyVideoQueryService legacyVideoQueryService;
    private final LegacyCourseAdapter courseAdapter;

    @Override
    public String opt() {
        return "getCourseBuyStatus";
    }

    @Override
    public Map<String, Object> handle(HttpServletRequest request) {
        int ctype = params.getInt(request, "ctype", 3);
        if (ctype != 3) {
            return Map.of();
        }

        List<Integer> courseIds = params.getIntList(request, "courseids");
        if (courseIds.isEmpty()) {
            courseIds = GetCourseByIdsOptHandler.parseIds(params.getString(request, "courseids"));
        }
        if (courseIds.isEmpty()) {
            return Map.of();
        }

        int pxbUid = params.getInt(request, "uid", 0);
        int pxbRootId = params.getInt(request, "pxb_root_id", 0);
        int userId = userResolver.resolveUserId(request, pxbUid);
        if (userId <= 0) {
            return Map.of();
        }

        Map<Integer, PxbLegacyPurchaseInfo> purchases = legacyVideoQueryService.findPurchaseInfoByVideoIds(
                userId, courseIds, pxbRootId > 0 ? pxbRootId : null);
        return courseAdapter.toBuyStatusResponse(courseIds, purchases);
    }
}
