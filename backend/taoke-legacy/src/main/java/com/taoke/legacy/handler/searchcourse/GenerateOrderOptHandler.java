package com.taoke.legacy.handler.searchcourse;

import com.taoke.course.api.PxbLegacyOrderService;
import com.taoke.legacy.security.LegacyApiContext;
import com.taoke.legacy.service.LegacyParamResolver;
import com.taoke.legacy.service.PxbUserResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class GenerateOrderOptHandler implements SearchCourseOptHandler {

    private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");

    private final LegacyParamResolver params;
    private final PxbUserResolver userResolver;
    private final PxbLegacyOrderService legacyOrderService;

    @Override
    public String opt() {
        return "generateOrder";
    }

    @Override
    public Map<String, Object> handle(HttpServletRequest request) {
        int pxbUid = params.getInt(request, "uid", 0);
        int pxbRootId = params.getInt(request, "pxb_root_id", 0);
        int userId = userResolver.resolveUserId(pxbUid);
        List<Integer> packageIds = params.getIntList(request, "package_ids");

        BigDecimal total = parseDecimal(params.getString(request, "total"));
        String appId = resolveAppId(request);

        return legacyOrderService.generatePackageOrder(
                userId,
                packageIds,
                total,
                params.getString(request, "pxb_kefu"),
                params.getString(request, "pxb_remarks"),
                params.getString(request, "order_subject"),
                params.getInt(request, "is_include_paper", 0),
                params.getInt(request, "copy_root_id", 0),
                params.getInt(request, "concurrency", 1),
                pxbRootId > 0 ? pxbRootId : null,
                toDateTime(params.getInt(request, "begintime", 0)),
                toDateTime(params.getInt(request, "endtime", 0)),
                params.getIntList(request, "ignore_package"),
                appId
        );
    }

    private static BigDecimal parseDecimal(String raw) {
        if (raw == null || raw.isBlank()) {
            return BigDecimal.ZERO;
        }
        try {
            return new BigDecimal(raw.trim());
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private static LocalDateTime toDateTime(int epochSeconds) {
        if (epochSeconds <= 0) {
            return null;
        }
        return LocalDateTime.ofInstant(Instant.ofEpochSecond(epochSeconds), ZONE);
    }

    private String resolveAppId(HttpServletRequest request) {
        Object ctx = request.getAttribute(LegacyApiContext.ATTR);
        if (ctx instanceof LegacyApiContext legacyApiContext) {
            return legacyApiContext.getAppid();
        }
        return params.getString(request, "appid", "pxb");
    }
}
