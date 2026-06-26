package com.taoke.legacy.handler.searchcourse;

import com.taoke.course.api.PxbLegacyOrderService;
import com.taoke.legacy.service.LegacyParamResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class GetVideoIdsByOrderCodeOptHandler implements SearchCourseOptHandler {

    private final LegacyParamResolver params;
    private final PxbLegacyOrderService legacyOrderService;

    @Override
    public String opt() {
        return "getVideoIdsByOrderCode";
    }

    @Override
    public Object handle(HttpServletRequest request) {
        String orderCode = params.getString(request, "order_code");
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("isok", true);
        body.put("video_id_list", legacyOrderService.getVideoIdsByOrderCode(orderCode));
        return body;
    }
}
