package com.taoke.legacy.handler.searchcourse;

import com.taoke.course.api.PxbLegacyPackageQueryService;
import com.taoke.course.dto.pxb.PxbLegacyPurchaseInfo;
import com.taoke.course.dto.pxb.PxbLegacyVideoRow;
import com.taoke.legacy.adapter.LegacyPackageAdapter;
import com.taoke.legacy.service.LegacyParamResolver;
import com.taoke.legacy.service.PxbUserResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class GetTopicCoursesOptHandler implements SearchCourseOptHandler {

    private final LegacyParamResolver params;
    private final PxbUserResolver userResolver;
    private final PxbLegacyPackageQueryService packageQueryService;
    private final LegacyPackageAdapter packageAdapter;

    @Override
    public String opt() {
        return "getTopicCourses";
    }

    @Override
    public Map<String, Object> handle(HttpServletRequest request) {
        int pxbUid = params.getInt(request, "uid", 0);
        int pxbRootId = params.getInt(request, "pxb_root_id", 0);
        int packageId = params.getInt(request, "package_id", 0);
        int secondId = params.getInt(request, "second_id", 0);
        int start = params.getInt(request, "start", 0);
        int perpage = params.getInt(request, "perpage", 15);

        int userId = userResolver.resolveUserId(pxbUid);
        if (userId <= 0 || packageId <= 0) {
            return emptyResponse();
        }

        long coursesNum = packageQueryService.countTopicCourses(packageId, secondId);
        if (coursesNum <= 0) {
            return emptyResponse();
        }

        List<PxbLegacyVideoRow> rows = packageQueryService.listTopicCourses(
                packageId, secondId, start, perpage);
        List<Integer> videoIds = rows.stream().map(PxbLegacyVideoRow::getId).toList();
        Map<Integer, PxbLegacyPurchaseInfo> purchases = packageQueryService.findPurchaseInfoForVideos(
                userId, videoIds, pxbRootId > 0 ? pxbRootId : null);

        long videoNum = secondId <= 0
                ? packageQueryService.countSeriesVideosInPackage(packageId)
                : coursesNum;

        return packageAdapter.toTopicCoursesResponse(coursesNum, videoNum, rows, purchases);
    }

    private static Map<String, Object> emptyResponse() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("courses_num", 0);
        body.put("video_num", 0);
        body.put("courses", Map.of());
        return body;
    }
}
