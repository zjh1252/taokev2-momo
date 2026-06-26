package com.taoke.legacy.handler.get;

import com.taoke.course.api.PxbLegacyTrainerRelatedService;
import com.taoke.legacy.service.LegacyParamResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class RelatedTktrainerOptHandler implements GetOptHandler {

    private final LegacyParamResolver params;
    private final PxbLegacyTrainerRelatedService trainerRelatedService;

    @Override
    public String opt() {
        return "related_tktrainer";
    }

    @Override
    public Object handle(HttpServletRequest request) {
        int trainerUid = params.getInt(request, "trainer_uid", 0);
        int pxbUid = params.getInt(request, "pxb_uid", 0);
        if (trainerUid <= 0 || pxbUid <= 0) {
            return Map.of("isok", false, "msg", "关联讲师信息不能为空。");
        }
        trainerRelatedService.addRelated(
                trainerUid,
                pxbUid,
                params.getString(request, "pxb_username"),
                params.getString(request, "mobile"));
        return Map.of("isok", true, "msg", "关联成功");
    }
}
