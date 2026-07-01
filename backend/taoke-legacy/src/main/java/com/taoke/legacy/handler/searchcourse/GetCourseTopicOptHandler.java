package com.taoke.legacy.handler.searchcourse;

import com.taoke.course.api.PxbLegacyPackageQueryService;
import com.taoke.course.dto.pxb.PxbLegacyTopicRow;
import com.taoke.legacy.adapter.LegacyPackageAdapter;
import com.taoke.legacy.service.LegacyParamResolver;
import com.taoke.legacy.service.PxbUserResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class GetCourseTopicOptHandler implements SearchCourseOptHandler {

    private final LegacyParamResolver params;
    private final PxbUserResolver userResolver;
    private final PxbLegacyPackageQueryService packageQueryService;
    private final LegacyPackageAdapter packageAdapter;

    @Override
    public String opt() {
        return "getCourseTopic";
    }

    @Override
    public Map<String, Object> handle(HttpServletRequest request) {
        boolean orderSupplier = "yes".equalsIgnoreCase(params.getString(request, "order_supplier"));
        int pxbUid = params.getInt(request, "uid", 0);
        int pxbRootId = params.getInt(request, "pxb_root_id", 0);
        int userId = userResolver.resolveUserId(request, pxbUid);

        List<PxbLegacyTopicRow> topics = packageQueryService.listCourseTopics(orderSupplier);
        if (userId > 0) {
            topics = packageQueryService.applyTopicBuyState(userId, topics, pxbRootId > 0 ? pxbRootId : null);
        }
        return packageAdapter.toTopicResponse(topics);
    }
}
