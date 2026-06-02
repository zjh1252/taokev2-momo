package com.taoke.course.support;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 读取老库 {@code taoke.tk_courseinfo} 中迁移未写入新表的字段（如机构课主讲人 lecturer）。
 * <p>仅作迁移过渡期展示补全，与 taoke 同实例；长期应通过数据修复写入新表字段。</p>
 *
 * <p>容错说明：老库表/字段在某些环境（如本地、已完成迁移的库）可能不存在，
 * 此时原生查询会抛 {@link DataAccessException}。本类所有查询均做降级处理——
 * 失败时记一条 warning 并返回空结果，绝不阻断主流程（列表/详情等）。</p>
 *
 * @author Fangxinxin
 * @date 2026-05-23 14:00
 */
@Slf4j
@Component
public class LegacyTaokeCourseReader {

    private final JdbcTemplate jdbcTemplate;

    public LegacyTaokeCourseReader(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * 课程详情 ID 与 tk_courseinfo.id 对齐时，取主讲人展示名。
     */
    public Optional<String> findLecturerDisplayName(int courseInfoId) {
        String name = findLecturerDisplayNames(List.of(courseInfoId)).get(courseInfoId);
        return name != null && !name.isBlank() ? Optional.of(name) : Optional.empty();
    }

    /**
     * 批量取主讲人展示名（列表页用，避免 N+1）。
     */
    public Map<Integer, String> findLecturerDisplayNames(Collection<Integer> courseInfoIds) {
        if (courseInfoIds == null || courseInfoIds.isEmpty()) {
            return Map.of();
        }
        List<Integer> ids = courseInfoIds.stream().filter(id -> id != null && id > 0).distinct().toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        String placeholders = String.join(",", ids.stream().map(id -> "?").toList());

        List<Map.Entry<Integer, String>> rows;
        try {
            rows = jdbcTemplate.query(
                    """
                    SELECT id, TRIM(lecturer) AS lecturer
                    FROM taoke.tk_courseinfo
                    WHERE id IN (%s) AND TRIM(COALESCE(lecturer, '')) != ''
                    """.formatted(placeholders),
                    (rs, rowNum) -> Map.entry(rs.getInt("id"), rs.getString("lecturer")),
                    ids.toArray());
        } catch (DataAccessException e) {
            // 老库表/字段缺失等场景：降级为无补全，不影响主流程
            log.warn("读取老库 tk_courseinfo.lecturer 失败，跳过主讲人补全: {}", e.getMessage());
            return Map.of();
        }

        Map<Integer, String> result = new HashMap<>();
        for (Map.Entry<Integer, String> row : rows) {
            String name = parseLecturerName(row.getValue());
            if (!name.isEmpty()) {
                result.put(row.getKey(), name);
            }
        }
        return result;
    }

    /**
     * 课程 ID 与 tk_courseinfo.id 对齐时，取老库课程分类名（tk_cate）。
     */
    public Optional<String> findCourseCategoryNameByCourseId(int courseInfoId) {
        String name = findCourseCategoryNames(List.of(courseInfoId)).get(courseInfoId);
        return name != null && !name.isBlank() ? Optional.of(name) : Optional.empty();
    }

    /**
     * 批量取老库课程分类名（列表页用）。
     */
    public Map<Integer, String> findCourseCategoryNames(Collection<Integer> courseInfoIds) {
        if (courseInfoIds == null || courseInfoIds.isEmpty()) {
            return Map.of();
        }
        List<Integer> ids = courseInfoIds.stream().filter(id -> id != null && id > 0).distinct().toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        String placeholders = String.join(",", ids.stream().map(id -> "?").toList());

        List<Map.Entry<Integer, String>> rows;
        try {
            rows = jdbcTemplate.query(
                    """
                    SELECT ci.id, TRIM(tc.name) AS cate_name
                    FROM taoke.tk_courseinfo ci
                    INNER JOIN taoke.tk_cate tc ON tc.id = CAST(
                        CASE
                            WHEN TRIM(COALESCE(ci.cid, '')) REGEXP '^[0-9]+$' THEN TRIM(ci.cid)
                            ELSE '0'
                        END AS UNSIGNED
                    )
                    WHERE ci.id IN (%s) AND TRIM(COALESCE(tc.name, '')) != ''
                    """.formatted(placeholders),
                    (rs, rowNum) -> Map.entry(rs.getInt("id"), rs.getString("cate_name")),
                    ids.toArray());
        } catch (DataAccessException e) {
            // 老库表/字段缺失等场景：降级为无补全，不影响主流程
            log.warn("读取老库 tk_courseinfo/tk_cate 分类失败，跳过分类补全: {}", e.getMessage());
            return Map.of();
        }

        Map<Integer, String> result = new HashMap<>();
        for (Map.Entry<Integer, String> row : rows) {
            result.put(row.getKey(), row.getValue());
        }
        return result;
    }

    private static String parseLecturerName(String raw) {
        if (raw == null) {
            return "";
        }
        int pipe = raw.indexOf('|');
        String name = pipe > 0 ? raw.substring(0, pipe).trim() : raw.trim();
        return name.isEmpty() ? "" : name;
    }
}
