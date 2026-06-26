package com.taoke.course.service.pxb;

import com.taoke.course.api.PxbLegacyCourseSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PxbLegacyCourseSyncServiceImpl implements PxbLegacyCourseSyncService {

    /** PXB resource_type → 老站 pxb_resoure 枚举（1 调研 / 2 考试 / 3 行动） */
    private static final Map<Integer, Integer> PXB_RESOURCE_TYPE_MAP = Map.of(
            14, 1,
            15, 3,
            8, 2
    );

    private final JdbcTemplate jdbcTemplate;

    @Override
    public boolean syncPxbResourceTypes(Map<String, Object> coursesPayload) {
        if (coursesPayload == null || coursesPayload.isEmpty()) {
            return false;
        }
        int updated = 0;
        for (Map.Entry<String, Object> entry : coursesPayload.entrySet()) {
            int courseId = parseCourseId(entry.getKey());
            if (courseId <= 0) {
                continue;
            }
            Set<Integer> legacyTypes = collectLegacyTypes(entry.getValue());
            if (legacyTypes.isEmpty()) {
                continue;
            }
            String csv = legacyTypes.stream()
                    .sorted()
                    .map(String::valueOf)
                    .reduce((a, b) -> a + "," + b)
                    .orElse("");
            updated += jdbcTemplate.update(
                    "UPDATE taoke.tk_courseinfo SET pxb_resoure = ? WHERE id = ?",
                    csv, courseId);
        }
        return updated > 0;
    }

    private static int parseCourseId(String key) {
        try {
            return Integer.parseInt(key.trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    @SuppressWarnings("unchecked")
    private static Set<Integer> collectLegacyTypes(Object rawList) {
        Set<Integer> result = new LinkedHashSet<>();
        if (!(rawList instanceof Map<?, ?> map)) {
            return result;
        }
        for (Map.Entry<?, ?> entry : map.entrySet()) {
            Object value = entry.getValue();
            if (value instanceof Map<?, ?> item) {
                Object type = item.get("resource_type");
                addLegacyType(result, type);
            } else {
                addLegacyType(result, entry.getKey());
            }
        }
        return result;
    }

    private static void addLegacyType(Set<Integer> result, Object rawType) {
        if (rawType == null) {
            return;
        }
        int pxbType;
        try {
            pxbType = Integer.parseInt(String.valueOf(rawType).trim());
        } catch (NumberFormatException e) {
            return;
        }
        Integer legacy = PXB_RESOURCE_TYPE_MAP.get(pxbType);
        if (legacy != null) {
            result.add(legacy);
        }
    }
}
