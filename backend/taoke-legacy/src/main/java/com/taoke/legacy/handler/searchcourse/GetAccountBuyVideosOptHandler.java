package com.taoke.legacy.handler.searchcourse;

import com.taoke.course.api.PxbLegacyVideoQueryService;
import com.taoke.legacy.service.LegacyParamResolver;
import com.taoke.legacy.service.PxbUserResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class GetAccountBuyVideosOptHandler implements SearchCourseOptHandler {

    private final LegacyParamResolver params;
    private final PxbUserResolver userResolver;
    private final PxbLegacyVideoQueryService legacyVideoQueryService;

    @Override
    public String opt() {
        return "getAccountBuyVideos";
    }

    @Override
    public Object handle(HttpServletRequest request) {
        int pxbUid = params.getInt(request, "uid", 0);
        int pxbRootId = params.getInt(request, "pxb_root_id", 0);
        int userId = userResolver.resolveUserId(pxbUid);
        if (userId <= 0) {
            return List.of();
        }
        return legacyVideoQueryService.findActivePurchasedVideoIds(
                userId, pxbRootId > 0 ? pxbRootId : null);
    }
}
