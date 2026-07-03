package com.taoke.legacy.handler.searchcourse;

import com.taoke.common.response.PageResponse;
import com.taoke.course.api.PxbLegacyVideoQueryService;
import com.taoke.course.dto.pxb.PxbLegacyPurchaseInfo;
import com.taoke.course.dto.pxb.PxbLegacyVideoRow;
import com.taoke.legacy.adapter.LegacyCourseAdapter;
import com.taoke.legacy.service.LegacyParamResolver;
import com.taoke.legacy.service.PxbUserResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * opt=courseList — 搜索录播/内训/外派课程（当前实现 ctype=3 录播）。
 */
@Component
@RequiredArgsConstructor
public class CourseListOptHandler implements SearchCourseOptHandler {

    private final LegacyParamResolver params;
    private final PxbUserResolver userResolver;
    private final PxbLegacyVideoQueryService legacyVideoQueryService;
    private final LegacyCourseAdapter courseAdapter;

    @Override
    public String opt() {
        return "courseList";
    }

    @Override
    public Map<String, Object> handle(HttpServletRequest request) {
        int ctype = params.getInt(request, "ctype", 3);
        if (ctype != 3) {
            return emptyList();
        }

        int pxbUid = params.getInt(request, "uid", 0);
        int pxbRootId = params.getInt(request, "pxb_root_id", 0);
        int userId = userResolver.resolveUserId(request, pxbUid);
        if (userId <= 0) {
            return emptyList();
        }

        int cate = params.getInt(request, "cate", 0);
        String keyword = params.getString(request, "keyword");
        String orderby = params.getString(request, "orderby", "id");
        String sort = params.getString(request, "sort", "desc");
        int start = params.getInt(request, "start", 0);
        int perpage = params.getInt(request, "perpage", 15);
        int page = perpage > 0 ? (start / perpage) + 1 : 1;

        PageResponse<PxbLegacyVideoRow> pageResult = legacyVideoQueryService.searchPublishedVideos(
                cate > 0 ? cate : null,
                keyword,
                orderby,
                sort,
                page,
                perpage
        );

        List<Integer> videoIds = pageResult.getList().stream().map(PxbLegacyVideoRow::getId).toList();
        Map<Integer, PxbLegacyPurchaseInfo> purchases = legacyVideoQueryService.findPurchaseInfoByVideoIds(
                userId, videoIds, pxbRootId > 0 ? pxbRootId : null);

        return courseAdapter.toCourseListResponse(pageResult.getTotal(), pageResult.getList(), purchases);
    }

    private Map<String, Object> emptyList() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("courses_num", 0);
        body.put("courses", Map.of());
        return body;
    }
}
