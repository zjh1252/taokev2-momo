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

    /** null=未探测，false=老库不可用（本进程内后续一律跳过） */
    private volatile Boolean legacyAvailable;

    public LegacyTaokeCourseReader(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * 列表页老库字段一次读出，避免组装阶段串行 6+ 次跨库查询。
     */
    public ListEnrichment loadListEnrichment(Collection<Integer> courseInfoIds) {
        if (!ensureLegacyAvailable() || courseInfoIds == null || courseInfoIds.isEmpty()) {
            return ListEnrichment.empty();
        }
        List<Integer> ids = courseInfoIds.stream().filter(id -> id != null && id > 0).distinct().toList();
        if (ids.isEmpty()) {
            return ListEnrichment.empty();
        }
        String placeholders = String.join(",", ids.stream().map(id -> "?").toList());
        Map<Integer, String> lecturerNames = new HashMap<>();
        Map<Integer, Integer> lecturerUserIds = new HashMap<>();
        Map<Integer, String> keywords = new HashMap<>();
        Map<Integer, String> categoryNames = new HashMap<>();
        Map<Integer, Integer> organizerUserIds = new HashMap<>();
        Map<Integer, String> organizerNamesFromLecturer = new HashMap<>();
        try {
            jdbcTemplate.query(
                    """
                    SELECT ci.id,
                           TRIM(ci.lecturer) AS lecturer,
                           ci.lecturerid,
                           TRIM(ci.tags) AS tags,
                           ci.organid,
                           TRIM(COALESCE(NULLIF(TRIM(m.company), ''),
                                         NULLIF(TRIM(m.realname), ''))) AS member_name,
                           TRIM(tc.name) AS cate_name
                    FROM taoke.tk_courseinfo ci
                    LEFT JOIN taoke.tk_member m ON m.id = ci.lecturerid AND ci.lecturerid > 0
                    LEFT JOIN taoke.tk_cate tc ON tc.id = CAST(
                        CASE
                            WHEN TRIM(COALESCE(ci.cid, '')) REGEXP '^[0-9]+$' THEN TRIM(ci.cid)
                            ELSE '0'
                        END AS UNSIGNED
                    )
                    WHERE ci.id IN (%s)
                    """.formatted(placeholders),
                    rs -> {
                        int id = rs.getInt("id");
                        String lecturer = rs.getString("lecturer");
                        String memberName = rs.getString("member_name");
                        String name = parseLecturerName(lecturer);
                        if (name.isEmpty() && memberName != null) {
                            name = memberName.trim();
                        }
                        if (!name.isEmpty()) {
                            lecturerNames.put(id, name);
                        }
                        int lecturerId = rs.getInt("lecturerid");
                        if (lecturerId > 0) {
                            lecturerUserIds.put(id, lecturerId);
                        }
                        String tags = rs.getString("tags");
                        if (tags != null && !tags.isBlank()) {
                            keywords.put(id, tags.trim());
                        }
                        int organId = rs.getInt("organid");
                        if (organId > 0) {
                            organizerUserIds.put(id, organId);
                        }
                        String organizer = parseOrganizerFromLecturer(lecturer);
                        if (!organizer.isEmpty()) {
                            organizerNamesFromLecturer.put(id, organizer);
                        }
                        String cateName = rs.getString("cate_name");
                        if (cateName != null && !cateName.isBlank()) {
                            categoryNames.put(id, cateName.trim());
                        }
                    },
                    ids.toArray());
        } catch (DataAccessException e) {
            markLegacyUnavailable(e.getMessage());
            return ListEnrichment.empty();
        }
        return new ListEnrichment(
                lecturerNames,
                lecturerUserIds,
                keywords,
                categoryNames,
                organizerUserIds,
                organizerNamesFromLecturer);
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
        return loadListEnrichment(courseInfoIds).lecturerNames();
    }

    /**
     * 批量取老库主讲人会员 ID（lecturerid，与 user_trainers.user_id 对齐）。
     */
    public Map<Integer, Integer> findLecturerUserIds(Collection<Integer> courseInfoIds) {
        return loadListEnrichment(courseInfoIds).lecturerUserIds();
    }

    /**
     * 批量取老库课程标签（tk_courseinfo.tags），用于 keywords 为空时展示补全。
     */
    public Map<Integer, String> findKeywordsByCourseIds(Collection<Integer> courseInfoIds) {
        return loadListEnrichment(courseInfoIds).keywords();
    }

    private boolean ensureLegacyAvailable() {
        Boolean cached = legacyAvailable;
        if (cached != null) {
            return cached;
        }
        synchronized (this) {
            if (legacyAvailable != null) {
                return legacyAvailable;
            }
            try {
                jdbcTemplate.queryForObject("SELECT 1 FROM taoke.tk_courseinfo LIMIT 1", Integer.class);
                legacyAvailable = true;
            } catch (DataAccessException e) {
                markLegacyUnavailable(e.getMessage());
            }
            return Boolean.TRUE.equals(legacyAvailable);
        }
    }

    private void markLegacyUnavailable(String message) {
        legacyAvailable = false;
        log.warn("老库 taoke.tk_courseinfo 不可用，本进程跳过列表补全: {}", message);
    }

    /**
     * 列表装配用的老库补全字段包。
     */
    public record ListEnrichment(
            Map<Integer, String> lecturerNames,
            Map<Integer, Integer> lecturerUserIds,
            Map<Integer, String> keywords,
            Map<Integer, String> categoryNames,
            Map<Integer, Integer> organizerUserIds,
            Map<Integer, String> organizerNamesFromLecturer
    ) {
        static ListEnrichment empty() {
            return new ListEnrichment(Map.of(), Map.of(), Map.of(), Map.of(), Map.of(), Map.of());
        }
    }

    /**
     * 批量取老库课程封面（tk_course_pic.pic）。
     * <p>
     * 部分公开课的新表 ID 对齐的是 {@code tk_course.id}，真实封面挂在 {@code tk_course.cid}
     * 指向的课程信息下，因此同时按课程 ID 与 {@code tk_course.id -> cid} 两种路径查找。
     * </p>
     */
    public Map<Integer, String> findCoverUrlsByCourseIds(Collection<Integer> courseIds) {
        if (!ensureLegacyAvailable() || courseIds == null || courseIds.isEmpty()) {
            return Map.of();
        }
        List<Integer> ids = courseIds.stream().filter(id -> id != null && id > 0).distinct().toList();
        if (ids.isEmpty()) {
            return Map.of();
        }

        String placeholders = String.join(",", ids.stream().map(id -> "?").toList());
        List<CoverRow> rows;
        try {
            rows = jdbcTemplate.query(
                    """
                    SELECT q.course_id, TRIM(tcp.pic) AS pic, tcp.up_time, tcp.id AS pic_id
                    FROM (
                        SELECT id AS course_id, id AS pic_cid
                        FROM taoke.tk_courseinfo
                        WHERE id IN (%s)
                        UNION ALL
                        SELECT id AS course_id, cid AS pic_cid
                        FROM taoke.tk_course
                        WHERE id IN (%s) AND cid > 0
                    ) q
                    INNER JOIN taoke.tk_course_pic tcp ON tcp.cid = q.pic_cid
                    WHERE TRIM(COALESCE(tcp.pic, '')) != ''
                    ORDER BY q.course_id, tcp.up_time DESC, tcp.id DESC
                    """.formatted(placeholders, placeholders),
                    (rs, rowNum) -> new CoverRow(
                            rs.getInt("course_id"),
                            rs.getString("pic")),
                    concatArgs(ids, ids));
        } catch (DataAccessException e) {
            log.warn("读取老库 tk_course_pic.pic 失败，跳过课程封面补全: {}", e.getMessage());
            return Map.of();
        }

        Map<Integer, String> result = new HashMap<>();
        for (CoverRow row : rows) {
            if (row.pic() != null && !row.pic().isBlank()) {
                result.putIfAbsent(row.courseId(), row.pic().trim());
            }
        }
        return result;
    }

    private record CoverRow(int courseId, String pic) {}
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
        return loadListEnrichment(courseInfoIds).categoryNames();
    }

    /**
     * 批量取老库开课单位会员 ID（tk_courseinfo.organid，与 user_id 对齐）。
     */
    public Map<Integer, Integer> findOrganizerUserIds(Collection<Integer> courseInfoIds) {
        return loadListEnrichment(courseInfoIds).organizerUserIds();
    }

    /**
     * 老库 lecturer 字段竖线后的机构名（主讲人|开课单位）。
     */
    public Map<Integer, String> findOrganizerNamesFromLecturer(Collection<Integer> courseInfoIds) {
        return loadListEnrichment(courseInfoIds).organizerNamesFromLecturer();
    }

    /**
     * 老库 tk_member 展示名（company 优先，其次 realname），用于 organid 无机构档案时补全开课单位。
     */
    public Map<Integer, String> findMemberDisplayNames(Collection<Integer> memberIds) {
        if (!ensureLegacyAvailable() || memberIds == null || memberIds.isEmpty()) {
            return Map.of();
        }
        List<Integer> ids = memberIds.stream().filter(id -> id != null && id > 0).distinct().toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        String placeholders = String.join(",", ids.stream().map(id -> "?").toList());

        List<Map.Entry<Integer, String>> rows;
        try {
            rows = jdbcTemplate.query(
                    """
                    SELECT id,
                           TRIM(COALESCE(NULLIF(TRIM(company), ''), NULLIF(TRIM(realname), ''))) AS display_name
                    FROM taoke.tk_member
                    WHERE id IN (%s)
                    """.formatted(placeholders),
                    (rs, rowNum) -> Map.entry(rs.getInt("id"), rs.getString("display_name")),
                    ids.toArray());
        } catch (DataAccessException e) {
            markLegacyUnavailable(e.getMessage());
            return Map.of();
        }

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

    private static Object[] concatArgs(List<Integer> left, List<Integer> right) {
        Object[] args = new Object[left.size() + right.size()];
        int index = 0;
        for (Integer id : left) {
            args[index++] = id;
        }
        for (Integer id : right) {
            args[index++] = id;
        }
        return args;
    }

}
