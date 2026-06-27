package com.taoke.legacy.service;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * 对齐 PHP {@code GP()}：合并 query + form 参数读取。
 */
@Component
public class LegacyParamResolver {

    public int getInt(HttpServletRequest request, String name, int defaultValue) {
        String raw = getString(request, name);
        if (!StringUtils.hasText(raw)) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public long getLong(HttpServletRequest request, String name, long defaultValue) {
        String raw = getString(request, name);
        if (!StringUtils.hasText(raw)) {
            return defaultValue;
        }
        try {
            return Long.parseLong(raw.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public String getString(HttpServletRequest request, String name) {
        String value = request.getParameter(name);
        return value != null ? value.trim() : "";
    }

    public String getString(HttpServletRequest request, String name, String defaultValue) {
        String value = getString(request, name);
        return StringUtils.hasText(value) ? value : defaultValue;
    }

    public List<Integer> getIntList(HttpServletRequest request, String name) {
        String[] values = request.getParameterValues(name);
        if (values == null || values.length == 0) {
            values = request.getParameterValues(name + "[]");
        }
        if (values == null || values.length == 0) {
            return List.of();
        }
        List<Integer> result = new java.util.ArrayList<>();
        for (String raw : values) {
            if (!StringUtils.hasText(raw)) {
                continue;
            }
            for (String part : raw.split(",")) {
                try {
                    int v = Integer.parseInt(part.trim());
                    if (v > 0) {
                        result.add(v);
                    }
                } catch (NumberFormatException ignored) {
                    // skip invalid
                }
            }
        }
        return result.stream().distinct().toList();
    }
}
