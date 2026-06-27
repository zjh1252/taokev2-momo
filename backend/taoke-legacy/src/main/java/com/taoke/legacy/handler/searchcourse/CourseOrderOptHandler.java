package com.taoke.legacy.handler.searchcourse;

import com.taoke.course.api.PxbLegacyVideoQueryService;
import com.taoke.legacy.service.LegacyParamResolver;
import com.taoke.legacy.service.PxbUserResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * opt=courseOrder — 查询用户已购课程 ID 列表。
 */
@Component
@RequiredArgsConstructor
public class CourseOrderOptHandler implements SearchCourseOptHandler {

    private final LegacyParamResolver params;
    private final PxbUserResolver userResolver;
    private final PxbLegacyVideoQueryService legacyVideoQueryService;

    @Override
    public String opt() {
        return "courseOrder";
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

        int cate = params.getInt(request, "cate", 0);
        String keyword = params.getString(request, "keyword");

        Map<Integer, Integer> purchased = legacyVideoQueryService.findPurchasedVideoIdMap(
                userId,
                cate > 0 ? cate : null,
                keyword,
                pxbRootId > 0 ? pxbRootId : null
        );

        Map<String, Object> result = new LinkedHashMap<>();
        purchased.forEach((id, val) -> result.put(String.valueOf(id), val));
        return result;
    }
}
