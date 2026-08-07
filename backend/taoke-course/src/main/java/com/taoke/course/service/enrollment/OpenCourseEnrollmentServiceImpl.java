package com.taoke.course.service.enrollment;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.course.api.OpenCourseEnrollmentService;
import com.taoke.course.dto.enrollment.OpenCourseEnrollmentVO;
import com.taoke.course.dto.enrollment.SubmitOpenCourseEnrollmentRequest;
import com.taoke.course.dto.enrollment.UpdateOpenCourseEnrollmentRequest;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.CoursePlan;
import com.taoke.course.entity.enrollment.OpenCourseEnrollment;
import com.taoke.course.repository.CoursePlanRepository;
import com.taoke.course.repository.CourseRepository;
import com.taoke.course.repository.enrollment.OpenCourseEnrollmentRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 公开课报名线索服务
 *
 * @author Fangxinxin
 * @date 2026-08-06 20:15
 */
@Service
@RequiredArgsConstructor
public class OpenCourseEnrollmentServiceImpl implements OpenCourseEnrollmentService {

    private static final int EXPORT_MAX = 5000;
    private static final String DELETED_COURSE_LABEL = "课程已删除";

    private final OpenCourseEnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final CoursePlanRepository coursePlanRepository;

    @Override
    @Transactional
    public Integer submit(Integer userId, SubmitOpenCourseEnrollmentRequest request) {
        String companyPhone = trimToNull(request.getCompanyPhone());
        String mobile = trimToNull(request.getMobile());
        if (companyPhone == null && mobile == null) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "电话或手机至少填写一项");
        }

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "课程不存在"));
        CoursePlan plan = coursePlanRepository.findById(request.getPlanId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "开课计划不存在"));
        if (!Objects.equals(plan.getCourseId(), course.getId())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "开课计划与课程不匹配");
        }

        OpenCourseEnrollment entity = new OpenCourseEnrollment();
        entity.setUserId(userId);
        entity.setCourseId(course.getId());
        entity.setPlanId(plan.getId());
        entity.setRealName(request.getRealName().trim());
        entity.setCompanyName(request.getCompanyName().trim());
        entity.setEmail(request.getEmail().trim());
        entity.setCompanyPhone(companyPhone);
        entity.setMobile(mobile);
        entity.setCourseTitle(course.getTitle() != null ? course.getTitle() : "");
        entity.setPlanStartTime(plan.getStartTime());
        entity.setPlanEndTime(plan.getEndTime());
        entity.setStatus(0);
        entity.setAdminRemark(null);
        return enrollmentRepository.save(entity).getId();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OpenCourseEnrollmentVO> adminSearch(
            LocalDateTime createdFrom,
            LocalDateTime createdTo,
            String keyword,
            Integer status,
            int page,
            int size) {
        PageRequest pageable = PageRequest.of(
                Math.max(0, page - 1),
                Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "id"));
        Page<OpenCourseEnrollment> result =
                enrollmentRepository.findAll(buildSpec(createdFrom, createdTo, keyword, status), pageable);
        Map<Integer, Boolean> courseExists = loadCourseExists(result.getContent());
        return PageResponse.of(result.map(e -> toVo(e, courseExists)));
    }

    @Override
    @Transactional(readOnly = true)
    public OpenCourseEnrollmentVO adminGetDetail(Integer id) {
        OpenCourseEnrollment entity = enrollmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "报名记录不存在"));
        Map<Integer, Boolean> courseExists = loadCourseExists(List.of(entity));
        return toVo(entity, courseExists);
    }

    @Override
    @Transactional
    public void adminUpdate(Integer id, UpdateOpenCourseEnrollmentRequest request) {
        OpenCourseEnrollment entity = enrollmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "报名记录不存在"));
        entity.setStatus(request.getStatus());
        String remark = request.getAdminRemark();
        if (remark != null) {
            remark = remark.trim();
            entity.setAdminRemark(remark.isEmpty() ? null : remark);
        }
        enrollmentRepository.save(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpenCourseEnrollmentVO> adminListForExport(
            List<Integer> ids,
            LocalDateTime createdFrom,
            LocalDateTime createdTo,
            String keyword,
            Integer status) {
        List<OpenCourseEnrollment> rows;
        if (ids != null && !ids.isEmpty()) {
            rows = enrollmentRepository.findAllById(ids).stream()
                    .sorted((a, b) -> Integer.compare(b.getId(), a.getId()))
                    .toList();
        } else {
            PageRequest pageable = PageRequest.of(0, EXPORT_MAX, Sort.by(Sort.Direction.DESC, "id"));
            rows = enrollmentRepository
                    .findAll(buildSpec(createdFrom, createdTo, keyword, status), pageable)
                    .getContent();
        }
        Map<Integer, Boolean> courseExists = loadCourseExists(rows);
        return rows.stream().map(e -> toVo(e, courseExists)).toList();
    }

    private Specification<OpenCourseEnrollment> buildSpec(
            LocalDateTime createdFrom,
            LocalDateTime createdTo,
            String keyword,
            Integer status) {
        return (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (createdFrom != null) {
                ps.add(cb.greaterThanOrEqualTo(root.get("createdAt"), createdFrom));
            }
            if (createdTo != null) {
                ps.add(cb.lessThanOrEqualTo(root.get("createdAt"), createdTo));
            }
            if (status != null) {
                ps.add(cb.equal(root.get("status"), status));
            }
            if (StringUtils.hasText(keyword)) {
                String kw = keyword.trim();
                List<Predicate> or = new ArrayList<>();
                or.add(cb.like(root.get("courseTitle"), "%" + kw + "%"));
                or.add(cb.like(root.get("realName"), "%" + kw + "%"));
                or.add(cb.like(root.get("companyName"), "%" + kw + "%"));
                or.add(cb.like(root.get("email"), "%" + kw + "%"));
                try {
                    Integer courseId = Integer.valueOf(kw);
                    or.add(cb.equal(root.get("courseId"), courseId));
                } catch (NumberFormatException ignored) {
                    // 非数字则仅模糊匹配文案字段
                }
                ps.add(cb.or(or.toArray(Predicate[]::new)));
            }
            return cb.and(ps.toArray(Predicate[]::new));
        };
    }

    private Map<Integer, Boolean> loadCourseExists(List<OpenCourseEnrollment> rows) {
        Set<Integer> courseIds = rows.stream()
                .map(OpenCourseEnrollment::getCourseId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(HashSet::new));
        if (courseIds.isEmpty()) {
            return Map.of();
        }
        Set<Integer> existing = courseRepository.findAllById(courseIds).stream()
                .map(Course::getId)
                .collect(Collectors.toSet());
        return courseIds.stream().collect(Collectors.toMap(id -> id, existing::contains));
    }

    private OpenCourseEnrollmentVO toVo(OpenCourseEnrollment e, Map<Integer, Boolean> courseExists) {
        OpenCourseEnrollmentVO vo = new OpenCourseEnrollmentVO();
        vo.setId(e.getId());
        vo.setUserId(e.getUserId());
        vo.setCourseId(e.getCourseId());
        vo.setPlanId(e.getPlanId());
        vo.setRealName(e.getRealName());
        vo.setCompanyName(e.getCompanyName());
        vo.setEmail(e.getEmail());
        vo.setCompanyPhone(e.getCompanyPhone());
        vo.setMobile(e.getMobile());
        vo.setPlanStartTime(e.getPlanStartTime());
        vo.setPlanEndTime(e.getPlanEndTime());
        vo.setStatus(e.getStatus());
        vo.setStatusLabel(statusLabel(e.getStatus()));
        vo.setAdminRemark(e.getAdminRemark());
        vo.setCreatedAt(e.getCreatedAt());
        vo.setUpdatedAt(e.getUpdatedAt());

        boolean exists = Boolean.TRUE.equals(courseExists.get(e.getCourseId()));
        vo.setCourseDeleted(!exists);
        if (exists) {
            vo.setCourseTitle(StringUtils.hasText(e.getCourseTitle())
                    ? e.getCourseTitle()
                    : ("课程#" + e.getCourseId()));
        } else {
            vo.setCourseTitle(DELETED_COURSE_LABEL);
        }
        return vo;
    }

    private static String statusLabel(Integer status) {
        if (status == null) {
            return "待处理";
        }
        return switch (status) {
            case 1 -> "已联系";
            case 2 -> "已无效";
            default -> "待处理";
        };
    }

    private static String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
