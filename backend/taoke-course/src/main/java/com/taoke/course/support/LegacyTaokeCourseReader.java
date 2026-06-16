package com.taoke.course.support;



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

 * @author Fangxinxin

 * @date 2026-05-23 14:00

 */

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

        List<Map.Entry<Integer, String>> rows = jdbcTemplate.query(

                """

                SELECT id, TRIM(lecturer) AS lecturer

                FROM taoke.tk_courseinfo

                WHERE id IN (%s) AND TRIM(COALESCE(lecturer, '')) != ''

                """.formatted(placeholders),

                (rs, rowNum) -> Map.entry(rs.getInt("id"), rs.getString("lecturer")),

                ids.toArray());

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

        List<Map.Entry<Integer, String>> rows = jdbcTemplate.query(

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

        Map<Integer, String> result = new HashMap<>();

        for (Map.Entry<Integer, String> row : rows) {

            result.put(row.getKey(), row.getValue());

        }

        return result;

    }



    /**
     * 批量取老库开课单位会员 ID（tk_courseinfo.organid，与 user_id 对齐）。
     */
    public Map<Integer, Integer> findOrganizerUserIds(Collection<Integer> courseInfoIds) {
        if (courseInfoIds == null || courseInfoIds.isEmpty()) {
            return Map.of();
        }
        List<Integer> ids = courseInfoIds.stream().filter(id -> id != null && id > 0).distinct().toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        String placeholders = String.join(",", ids.stream().map(id -> "?").toList());
        List<Map.Entry<Integer, Integer>> rows = jdbcTemplate.query(
                """
                SELECT id, organid
                FROM taoke.tk_courseinfo
                WHERE id IN (%s) AND organid > 0
                """.formatted(placeholders),
                (rs, rowNum) -> Map.entry(rs.getInt("id"), rs.getInt("organid")),
                ids.toArray());
        Map<Integer, Integer> result = new HashMap<>();
        for (Map.Entry<Integer, Integer> row : rows) {
            result.put(row.getKey(), row.getValue());
        }
        return result;
    }

    /**
     * 老库 lecturer 字段竖线后的机构名（主讲人|开课单位）。
     */
    public Map<Integer, String> findOrganizerNamesFromLecturer(Collection<Integer> courseInfoIds) {
        if (courseInfoIds == null || courseInfoIds.isEmpty()) {
            return Map.of();
        }
        List<Integer> ids = courseInfoIds.stream().filter(id -> id != null && id > 0).distinct().toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        String placeholders = String.join(",", ids.stream().map(id -> "?").toList());
        List<Map.Entry<Integer, String>> rows = jdbcTemplate.query(
                """
                SELECT id, TRIM(lecturer) AS lecturer
                FROM taoke.tk_courseinfo
                WHERE id IN (%s) AND TRIM(COALESCE(lecturer, '')) != ''
                """.formatted(placeholders),
                (rs, rowNum) -> Map.entry(rs.getInt("id"), rs.getString("lecturer")),
                ids.toArray());
        Map<Integer, String> result = new HashMap<>();
        for (Map.Entry<Integer, String> row : rows) {
            String name = parseOrganizerFromLecturer(row.getValue());
            if (!name.isEmpty()) {
                result.put(row.getKey(), name);
            }
        }
        return result;
    }

    /**
     * 老库 tk_member 展示名（company 优先，其次 realname），用于 organid 无机构档案时补全开课单位。
     */
    public Map<Integer, String> findMemberDisplayNames(Collection<Integer> memberIds) {
        if (memberIds == null || memberIds.isEmpty()) {
            return Map.of();
        }
        List<Integer> ids = memberIds.stream().filter(id -> id != null && id > 0).distinct().toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        String placeholders = String.join(",", ids.stream().map(id -> "?").toList());
        List<Map.Entry<Integer, String>> rows = jdbcTemplate.query(
                """
                SELECT id,
                       TRIM(COALESCE(NULLIF(TRIM(company), ''), NULLIF(TRIM(realname), ''))) AS display_name
                FROM taoke.tk_member
                WHERE id IN (%s)
                """.formatted(placeholders),
                (rs, rowNum) -> Map.entry(rs.getInt("id"), rs.getString("display_name")),
                ids.toArray());
        Map<Integer, String> result = new HashMap<>();
        for (Map.Entry<Integer, String> row : rows) {
            if (row.getValue() != null && !row.getValue().isBlank()) {
                result.put(row.getKey(), row.getValue().trim());
            }
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

    private static String parseOrganizerFromLecturer(String raw) {
        if (raw == null) {
            return "";
        }
        int pipe = raw.indexOf('|');
        if (pipe < 0 || pipe >= raw.length() - 1) {
            return "";
        }
        String name = raw.substring(pipe + 1).trim();
        return name.isEmpty() ? "" : name;
    }

}

