package com.taoke.legacy.handler.searchcourse;

import com.taoke.course.api.PxbLegacyOrderService;
import com.taoke.legacy.service.LegacyParamResolver;
import com.taoke.user.api.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class GetOrdersOptHandler implements SearchCourseOptHandler {

    private final LegacyParamResolver params;
    private final UserService userService;
    private final PxbLegacyOrderService legacyOrderService;

    @Override
    public String opt() {
        return "getOrders";
    }

    @Override
    public Map<String, Object> handle(HttpServletRequest request) {
        Map<String, String> filter = extractFilter(request);
        List<Integer> userIds = resolveUserIds(filter.get("uids"));
        if (filter.containsKey("uids") && userIds.isEmpty()) {
            return Map.of("total", 0, "orders_list", List.of());
        }
        int page = params.getInt(request, "page", 1);
        int pageSize = params.getInt(request, "pagesize", 15);
        return legacyOrderService.listOrders(userIds, filter, page, pageSize);
    }

    private List<Integer> resolveUserIds(String uidsRaw) {
        if (!StringUtils.hasText(uidsRaw)) {
            return List.of();
        }
        List<Integer> ucUids = Arrays.stream(uidsRaw.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(Integer::parseInt)
                .filter(id -> id > 0)
                .collect(Collectors.toList());
        if (ucUids.isEmpty()) {
            return List.of();
        }
        return userService.findUserIdsByUcUids(ucUids);
    }

    private Map<String, String> extractFilter(HttpServletRequest request) {
        Map<String, String> filter = new HashMap<>();
        putIfPresent(filter, "uids", params.getString(request, "filter[uids]"));
        if (!filter.containsKey("uids")) {
            putIfPresent(filter, "uids", params.getString(request, "filter.uids"));
        }
        putIfPresent(filter, "order_status", firstNonBlank(
                params.getString(request, "filter[order_status]"),
                params.getString(request, "filter.order_status")));
        putIfPresent(filter, "start_time_start", firstNonBlank(
                params.getString(request, "filter[start_time_start]"),
                params.getString(request, "filter.start_time_start")));
        putIfPresent(filter, "start_time_end", firstNonBlank(
                params.getString(request, "filter[start_time_end]"),
                params.getString(request, "filter.start_time_end")));
        putIfPresent(filter, "end_time_start", firstNonBlank(
                params.getString(request, "filter[end_time_start]"),
                params.getString(request, "filter.end_time_start")));
        putIfPresent(filter, "end_time_end", firstNonBlank(
                params.getString(request, "filter[end_time_end]"),
                params.getString(request, "filter.end_time_end")));
        putIfPresent(filter, "root_company_id", firstNonBlank(
                params.getString(request, "filter[root_company_id]"),
                params.getString(request, "filter.root_company_id")));
        return filter;
    }

    private static void putIfPresent(Map<String, String> map, String key, String value) {
        if (StringUtils.hasText(value)) {
            map.put(key, value.trim());
        }
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (StringUtils.hasText(v)) {
                return v.trim();
            }
        }
        return "";
    }
}
