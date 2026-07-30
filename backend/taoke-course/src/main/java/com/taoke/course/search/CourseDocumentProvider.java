package com.taoke.course.search;

import com.taoke.common.service.OpsMaterialResolver;
import com.taoke.common.entity.Category;
import com.taoke.common.repository.CategoryRepository;
import com.taoke.common.search.BaseDocument;
import com.taoke.common.search.DocumentSyncProvider;
import com.taoke.course.entity.Course;
import com.taoke.course.enums.CourseStatus;
import com.taoke.course.enums.CourseType;
import com.taoke.course.repository.CourseRepository;
import com.taoke.course.support.OpenCourseExpireSupport;
import com.taoke.user.api.TrainerService;
import com.taoke.user.entity.Trainer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 课程文档同步提供者 — 从 DB 查询课程数据并构建 {@link CourseDocument}。
 *
 * @author Fangxinxin
 * @date 2026-04-14 19:00
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CourseDocumentProvider implements DocumentSyncProvider {

    private static final String DOC_TYPE = "course";
    private static final int PUBLISHED = CourseStatus.PUBLISHED.getValue();

    private final CourseRepository courseRepository;
    private final CategoryRepository categoryRepository;
    private final TrainerService trainerService;
    private final OpsMaterialResolver opsMaterialResolver;

    @Override
    public String getDocType() {
        return DOC_TYPE;
    }

    @Override
    public List<? extends BaseDocument> fetchUpdatedSince(LocalDateTime since) {
        Specification<Course> spec = (root, query, cb) -> cb.and(
                cb.greaterThan(root.get("updatedAt"), since),
                cb.equal(root.get("status"), PUBLISHED),
                OpenCourseExpireSupport.publicVisiblePredicate(root, cb, java.time.LocalDate.now())
        );
        List<Course> courses = courseRepository.findAll(spec);
        return buildDocuments(courses);
    }

    @Override
    public List<Integer> fetchRemovedSince(LocalDateTime since) {
        Set<Integer> ids = new HashSet<>();
        Specification<Course> statusRemoved = (root, query, cb) -> cb.and(
                cb.greaterThan(root.get("updatedAt"), since),
                cb.notEqual(root.get("status"), PUBLISHED)
        );
        courseRepository.findAll(statusRemoved).forEach(c -> ids.add(c.getId()));

        Specification<Course> expireHidden = (root, query, cb) -> cb.and(
                cb.greaterThan(root.get("updatedAt"), since),
                cb.equal(root.get("status"), PUBLISHED),
                cb.not(OpenCourseExpireSupport.publicVisiblePredicate(root, cb, java.time.LocalDate.now()))
        );
        courseRepository.findAll(expireHidden).forEach(c -> ids.add(c.getId()));
        return ids.stream().toList();
    }

    @Override
    public List<? extends BaseDocument> fetchAll() {
        Specification<Course> spec = indexableSpec();
        List<Course> courses = courseRepository.findAll(spec);
        return buildDocuments(courses);
    }

    @Override
    public List<? extends BaseDocument> fetchPage(int page, int size) {
        Specification<Course> spec = indexableSpec();
        var pageable = org.springframework.data.domain.PageRequest.of(
                page, size, org.springframework.data.domain.Sort.by("id").ascending());
        List<Course> courses = courseRepository.findAll(spec, pageable).getContent();
        return buildDocuments(courses);
    }

    /** 已上架且前台可见（排除到期自动隐藏的线下公开课） */
    private Specification<Course> indexableSpec() {
        return (root, query, cb) -> cb.and(
                cb.equal(root.get("status"), PUBLISHED),
                OpenCourseExpireSupport.publicVisiblePredicate(root, cb, java.time.LocalDate.now())
        );
    }

    private List<CourseDocument> buildDocuments(List<Course> courses) {
        if (courses.isEmpty()) {
            return List.of();
        }

        // 批量查关联的讲师
        Set<Integer> trainerIds = courses.stream()
                .map(Course::getTrainerId)
                .filter(id -> id != null && id > 0)
                .collect(Collectors.toSet());
        Map<Integer, String> trainerNameMap = new HashMap<>();
        Map<Integer, String> trainerAvatarMap = new HashMap<>();
        if (!trainerIds.isEmpty()) {
            trainerService.findByIds(trainerIds).forEach(t -> {
                trainerNameMap.put(t.getId(), t.getName());
                trainerAvatarMap.put(t.getId(), t.getAvatar());
            });
        }

        // 批量查关联的分类名称
        Set<Integer> categoryIds = new HashSet<>();
        courses.forEach(c -> {
            if (c.getCategoryId() != null && c.getCategoryId() > 0) {
                categoryIds.add(c.getCategoryId());
            }
            if (c.getSubCategoryId() != null && c.getSubCategoryId() > 0) {
                categoryIds.add(c.getSubCategoryId());
            }
        });
        Map<Integer, String> categoryNameMap = new HashMap<>();
        if (!categoryIds.isEmpty()) {
            categoryRepository.findAllById(categoryIds)
                    .forEach(c -> categoryNameMap.put(c.getId(), c.getName()));
        }

        // 构建文档
        Map<Integer, String> finalTrainerNameMap = trainerNameMap;
        Map<Integer, String> finalTrainerAvatarMap = trainerAvatarMap;
        Map<Integer, String> finalCategoryNameMap = categoryNameMap;
        return courses.stream()
                .map(c -> toDocument(c, finalTrainerNameMap, finalTrainerAvatarMap, finalCategoryNameMap))
                .toList();
    }

    private CourseDocument toDocument(Course course,
                                     Map<Integer, String> trainerNameMap,
                                     Map<Integer, String> trainerAvatarMap,
                                     Map<Integer, String> categoryNameMap) {
        CourseDocument doc = new CourseDocument();
        doc.setDocType(DOC_TYPE);
        doc.setId(course.getId());
        doc.setCreatedAt(course.getCreatedAt());
        doc.setUpdatedAt(course.getUpdatedAt());

        doc.setTitle(course.getTitle());
        doc.setType(course.getType() != null ? course.getType().name() : null);
        String categoryName = course.getCategoryId() != null && course.getCategoryId() > 0
                ? categoryNameMap.get(course.getCategoryId())
                : null;
        String trainerAvatar = course.getTrainerId() != null && course.getTrainerId() > 0
                ? trainerAvatarMap.get(course.getTrainerId())
                : null;
        doc.setCoverUrl(resolveCoverUrl(course, trainerAvatar, categoryName));
        doc.setIntro(stripHtml(course.getIntro()));
        doc.setAudience(course.getAudience());
        doc.setHighlights(course.getHighlights());
        doc.setKeywords(course.getKeywords());

        doc.setDurationDays(course.getDurationDays());
        doc.setTotalHours(course.getTotalHours());
        doc.setPrice(course.getPrice());
        doc.setOriginalPrice(course.getOriginalPrice());

        doc.setIsFeatured(course.getIsFeatured());
        doc.setIsFree(course.getIsFree());
        doc.setSortOrder(course.getSortOrder());
        doc.setViewCount(course.getViewCount());
        doc.setEnrollmentCount(course.getEnrollmentCount());
        doc.setScore(course.getScore());
        doc.setPublishedAt(course.getPublishedAt());
        doc.setCourseOpenEndDate(course.getCourseOpenEndDate());
        doc.setIsExpireHide(course.getIsExpireHide());

        // 关联字段
        if (course.getTrainerId() != null && course.getTrainerId() > 0) {
            doc.setTrainerName(trainerNameMap.get(course.getTrainerId()));
        }
        if (course.getCategoryId() != null && course.getCategoryId() > 0) {
            doc.setCategoryId(course.getCategoryId());
            doc.setCategoryName(categoryNameMap.get(course.getCategoryId()));
        }
        if (course.getSubCategoryId() != null && course.getSubCategoryId() > 0) {
            doc.setSubCategoryId(course.getSubCategoryId());
            doc.setSubCategoryName(categoryNameMap.get(course.getSubCategoryId()));
        }

        doc.buildDocId();
        return doc;
    }

    private String resolveCoverUrl(Course course, String trainerAvatar, String categoryName) {
        if (course == null) {
            return "";
        }
        String scene = resolveCoverMaterialScene(course.getType());
        int seed = course.getId() != null ? course.getId() : 0;
        return opsMaterialResolver.resolveCourseCoverUrl(
                course.getCoverUrl(), trainerAvatar, categoryName, scene, seed);
    }

    private static String resolveCoverMaterialScene(CourseType type) {
        if (type == CourseType.INTERNAL) {
            return "INTERNAL";
        }
        if (type != null && type.isOpen()) {
            return "OPEN";
        }
        return "GENERAL";
    }

    /**
     * 去除 HTML 标签，提取纯文本用于全文搜索
     */
    private static String stripHtml(String html) {
        if (html == null || html.isBlank()) {
            return null;
        }
        return html.replaceAll("<[^>]*>", "").replaceAll("&[a-zA-Z]+;", " ").trim();
    }
}
