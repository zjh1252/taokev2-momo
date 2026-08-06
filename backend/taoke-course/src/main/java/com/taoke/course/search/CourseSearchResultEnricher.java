package com.taoke.course.search;

import com.taoke.common.search.SearchResultEnricher;
import com.taoke.course.api.CourseService;
import com.taoke.course.dto.course.CourseListItemVO;
import com.taoke.course.entity.Course;
import com.taoke.course.repository.CoursePlanRepository;
import com.taoke.course.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 课程搜索结果补全器。
 * <p>搜索索引可能存在旧文档，返回层按课程列表口径补齐讲师等展示字段。</p>
 *
 * @author Fangxinxin
 * @date 2026-08-05 20:20
 */
@Component
@RequiredArgsConstructor
public class CourseSearchResultEnricher implements SearchResultEnricher {

    private final CourseRepository courseRepository;
    private final CoursePlanRepository coursePlanRepository;
    private final CourseService courseService;

    @Override
    public void enrich(List<Map<String, Object>> rows) {
        List<Map<String, Object>> courseRows = rows.stream()
                .filter(this::isCourseResult)
                .filter(row -> isMissingText(row.get("trainerName")))
                .toList();
        if (courseRows.isEmpty()) {
            return;
        }

        List<Integer> searchIds = courseRows.stream()
                .map(row -> toInteger(row.get("id")))
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (searchIds.isEmpty()) {
            return;
        }

        Map<Integer, Integer> courseIdBySearchId = resolveCourseIds(searchIds);
        if (courseIdBySearchId.isEmpty()) {
            return;
        }

        List<Integer> courseIds = courseIdBySearchId.values().stream().distinct().toList();
        Map<Integer, CourseListItemVO> itemByCourseId = courseService.assembleListItems(
                        courseRepository.findAllById(courseIds)
                ).stream()
                .collect(Collectors.toMap(CourseListItemVO::getId, item -> item, (a, b) -> a));
        if (itemByCourseId.isEmpty()) {
            return;
        }

        courseRows.forEach(row -> {
            Integer searchId = toInteger(row.get("id"));
            Integer courseId = searchId == null ? null : courseIdBySearchId.get(searchId);
            CourseListItemVO item = courseId == null ? null : itemByCourseId.get(courseId);
            if (item == null) {
                return;
            }
            putIfMissing(row, "trainerName", item.getTrainerName());
            putIfMissing(row, "seoPathId", item.getSeoPathId());
        });
    }

    private Map<Integer, Integer> resolveCourseIds(List<Integer> searchIds) {
        Map<Integer, Integer> courseIdBySearchId = new LinkedHashMap<>();
        courseRepository.findAllById(searchIds).stream()
                .map(Course::getId)
                .filter(Objects::nonNull)
                .forEach(id -> courseIdBySearchId.put(id, id));

        List<Integer> unresolvedIds = searchIds.stream()
                .filter(id -> !courseIdBySearchId.containsKey(id))
                .toList();
        if (!unresolvedIds.isEmpty()) {
            coursePlanRepository.findBySortOrderIn(unresolvedIds).stream()
                    .filter(plan -> plan.getSortOrder() != null && plan.getCourseId() != null)
                    .forEach(plan -> courseIdBySearchId.putIfAbsent(plan.getSortOrder(), plan.getCourseId()));
        }
        return courseIdBySearchId;
    }

    private boolean isCourseResult(Map<String, Object> row) {
        return row != null && "course".equals(row.get("docType"));
    }

    private void putIfMissing(Map<String, Object> row, String key, Object value) {
        if (value == null || !isMissingText(row.get(key))) {
            return;
        }
        if (value instanceof String text && text.isBlank()) {
            return;
        }
        row.put(key, value);
    }

    private boolean isMissingText(Object value) {
        if (value == null) {
            return true;
        }
        String text = String.valueOf(value).trim();
        return text.isEmpty() || "-".equals(text);
    }

    private Integer toInteger(Object value) {
        if (value instanceof Integer i) {
            return i;
        }
        if (value instanceof Number n) {
            return n.intValue();
        }
        if (value instanceof String s && !s.isBlank()) {
            try {
                return Integer.parseInt(s.trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }
}
