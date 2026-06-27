package com.taoke.legacy.handler.searchcourse;

import com.taoke.course.api.PxbLegacyOrderService;
import com.taoke.legacy.service.LegacyParamResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class RestoreByOrderCodeOptHandler implements SearchCourseOptHandler {

    private final LegacyParamResolver params;
    private final PxbLegacyOrderService legacyOrderService;

    @Override
    public String opt() {
        return "restoreByOrderCode";
    }

    @Override
    public Map<String, Object> handle(HttpServletRequest request) {
        String orderCode = params.getString(request, "order_code");
        int isIncludePaper = params.getInt(request, "is_include_paper", -1);
        return legacyOrderService.restoreByOrderCode(orderCode, isIncludePaper);
    }
}
