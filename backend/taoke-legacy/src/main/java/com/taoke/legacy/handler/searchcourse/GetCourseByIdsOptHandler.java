package com.taoke.legacy.handler.searchcourse;

import com.taoke.course.api.PxbLegacyVideoQueryService;
import com.taoke.course.dto.pxb.PxbLegacyPurchaseInfo;
import com.taoke.course.dto.pxb.PxbLegacyVideoRow;
import com.taoke.legacy.adapter.LegacyCourseAdapter;
import com.taoke.legacy.service.LegacyParamResolver;
import com.taoke.legacy.service.PxbUserResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * opt=getCourseByIds / getOrderCourseByIds — 按 ID 批量查课程详情。
 */
@Component
@RequiredArgsConstructor
public class GetCourseByIdsOptHandler implements SearchCourseOptHandler {

    private final LegacyParamResolver params;
    private final PxbUserResolver userResolver;
    private final PxbLegacyVideoQueryService legacyVideoQueryService;
    private final LegacyCourseAdapter courseAdapter;

    @Override
    public String opt() {
        return "getCourseByIds";
    }

    @Override
    public Map<String, Object> handle(HttpServletRequest request) {
        int ctype = params.getInt(request, "ctype", 3);
        if (ctype != 3) {
            return Map.of();
        }

        int pxbUid = params.getInt(request, "uid", 0);
        int pxbRootId = params.getInt(request, "pxb_root_id", 0);
        int userId = userResolver.resolveUserId(pxbUid);
        if (userId <= 0) {
            return Map.of();
        }

        List<Integer> courseIds = parseIds(params.getString(request, "courseids"));
        if (courseIds.isEmpty()) {
            return Map.of();
        }

        List<PxbLegacyVideoRow> rows = legacyVideoQueryService.findPublishedVideosByIds(courseIds);
        Map<Integer, PxbLegacyPurchaseInfo> purchases = legacyVideoQueryService.findPurchaseInfoByVideoIds(
                userId, courseIds, pxbRootId > 0 ? pxbRootId : null);

        return courseAdapter.toCoursesByIdsResponse(rows, purchases);
    }

    static List<Integer> parseIds(String raw) {
        if (!StringUtils.hasText(raw)) {
            return List.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(s -> {
                    try {
                        return Integer.parseInt(s);
                    } catch (NumberFormatException e) {
                        return 0;
                    }
                })
                .filter(id -> id > 0)
                .distinct()
                .collect(Collectors.toList());
    }
}
