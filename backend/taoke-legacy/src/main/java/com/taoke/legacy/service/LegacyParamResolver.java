package com.taoke.legacy.service;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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

    /**
     * 读取整型列表，兼容 PHP 数组传参：{@code name}、{@code name[]}、{@code name[0]}。
     */
    public List<Integer> getIntList(HttpServletRequest request, String name) {
        List<String> rawValues = collectRawListValues(request, name);
        if (rawValues.isEmpty()) {
            return List.of();
        }
        Set<Integer> seen = new LinkedHashSet<>();
        for (String raw : rawValues) {
            if (!StringUtils.hasText(raw)) {
                continue;
            }
            for (String part : raw.split(",")) {
                try {
                    int v = Integer.parseInt(part.trim());
                    if (v > 0) {
                        seen.add(v);
                    }
                } catch (NumberFormatException ignored) {
                    // skip invalid
                }
            }
        }
        return List.copyOf(seen);
    }

    private static List<String> collectRawListValues(HttpServletRequest request, String name) {
        List<String> rawValues = new ArrayList<>();
        appendParameterValues(rawValues, request.getParameterValues(name));
        appendParameterValues(rawValues, request.getParameterValues(name + "[]"));
        appendIndexedParameterValues(rawValues, request.getParameterMap(), name);
        return rawValues;
    }

    private static void appendParameterValues(List<String> target, String[] values) {
        if (values == null || values.length == 0) {
            return;
        }
        target.addAll(Arrays.asList(values));
    }

    private static void appendIndexedParameterValues(List<String> target,
                                                     Map<String, String[]> parameterMap,
                                                     String name) {
        Pattern indexedPattern = Pattern.compile("^" + Pattern.quote(name) + "\\[(\\d+)]$");
        TreeMap<Integer, String[]> indexed = new TreeMap<>();
        for (Map.Entry<String, String[]> entry : parameterMap.entrySet()) {
            Matcher matcher = indexedPattern.matcher(entry.getKey());
            if (matcher.matches()) {
                indexed.put(Integer.parseInt(matcher.group(1)), entry.getValue());
            }
        }
        for (String[] values : indexed.values()) {
            appendParameterValues(target, values);
        }
    }
}
