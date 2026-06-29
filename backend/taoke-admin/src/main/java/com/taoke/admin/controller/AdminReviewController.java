package com.taoke.admin.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.admin.dto.AdminReviewVO;
import com.taoke.admin.dto.RejectApplicationRequest;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.api.CourseService;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.interaction.TrainingReview;
import com.taoke.course.enums.ReviewScope;
import com.taoke.course.service.interaction.ReviewServiceImpl;
import com.taoke.user.api.InstitutionService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.api.UserService;
import com.taoke.user.entity.Institution;
import com.taoke.user.entity.Trainer;
import com.taoke.user.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 后台管理 — 培训评价审核
 *
 * @author Fangxinxin
 * @date 2026-04-22 12:00
 */
@Tag(name = "后台-培训评价管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminReviewController {

    private final ReviewServiceImpl reviewService;
    private final com.taoke.course.api.ReviewModerationService reviewModerationService;
    private final ObjectMapper objectMapper;
    private final TrainerService trainerService;
    private final InstitutionService institutionService;
    private final CourseService courseService;
    private final UserService userService;

    @Operation(summary = "分页查询培训评价")
    @GetMapping("/admin/training-reviews")
    public ApiResponse<PageResponse<AdminReviewVO>> list(
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String reviewScope,
            @RequestParam(required = false) String reviewerKeyword,
            @RequestParam(required = false) String reviewedBy,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Integer reviewedById = null;
        List<Integer> reviewedByUserIds = null;
        if (reviewedBy != null && !reviewedBy.isBlank()) {
            String keyword = reviewedBy.trim();
            if (keyword.matches("\\d+")) {
                reviewedById = Integer.parseInt(keyword);
            } else {
                Page<User> matched = userService.searchUsers(keyword, null, PageRequest.of(0, 100));
                reviewedByUserIds = matched.getContent().stream().map(User::getId).toList();
            }
        }
        Page<TrainingReview> result = reviewService.adminListReviews(
                status, reviewScope, reviewerKeyword, reviewedById, reviewedByUserIds, page, size);
        List<TrainingReview> rows = result.getContent();
        Map<Integer, String> trainerNameByUserId = buildTrainerNameByUserId(rows);
        Map<Integer, String> institutionDisplayById = buildInstitutionDisplayById(rows);
        Map<Integer, String> courseTitleById = buildCourseTitleById(rows);
        Map<Integer, String> reviewerNameByUserId = buildReviewerNameByUserId(rows);
        List<AdminReviewVO> list = rows.stream()
                .map(r -> toAdminVo(r, trainerNameByUserId, institutionDisplayById, courseTitleById,
                        reviewerNameByUserId))
                .toList();
        return ApiResponse.ok(PageResponse.of(list, result.getTotalElements(), page, size));
    }

    @Operation(summary = "培训评价详情")
    @GetMapping("/admin/training-reviews/{id}")
    public ApiResponse<AdminReviewVO> detail(@PathVariable Integer id) {
        TrainingReview review = reviewService.getReviewForAdmin(id);
        Map<Integer, String> trainerNameByUserId = buildTrainerNameByUserId(List.of(review));
        Map<Integer, String> institutionDisplayById = buildInstitutionDisplayById(List.of(review));
        Map<Integer, String> courseTitleById = buildCourseTitleById(List.of(review));
        Map<Integer, String> reviewerNameByUserId = buildReviewerNameByUserId(List.of(review));
        return ApiResponse.ok(toAdminVo(review, trainerNameByUserId, institutionDisplayById, courseTitleById,
                reviewerNameByUserId));
    }

    @Operation(summary = "审核通过")
    @PutMapping("/admin/training-reviews/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable Integer id) {
        reviewModerationService.approveReview(id, SecurityUtils.getCurrentUserId());
        return ApiResponse.ok();
    }

    @Operation(summary = "审核驳回")
    @PutMapping("/admin/training-reviews/{id}/reject")
    public ApiResponse<Void> reject(@PathVariable Integer id,
                                    @Valid @RequestBody RejectApplicationRequest request) {
        reviewModerationService.rejectReview(id, SecurityUtils.getCurrentUserId(), request.getReason());
        return ApiResponse.ok();
    }

    @Operation(summary = "隐藏评价")
    @PutMapping("/admin/training-reviews/{id}/hide")
    public ApiResponse<Void> hide(@PathVariable Integer id) {
        reviewModerationService.hideReview(id, SecurityUtils.getCurrentUserId());
        return ApiResponse.ok();
    }

    private Map<Integer, String> buildReviewerNameByUserId(List<TrainingReview> rows) {
        List<Integer> ids = rows.stream()
                .map(TrainingReview::getReviewedBy)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        return userService.findAllByIds(ids).stream()
                .collect(Collectors.toMap(
                        User::getId,
                        AdminReviewController::userAccountLabel,
                        (a, b) -> a));
    }

    private Map<Integer, String> buildTrainerNameByUserId(List<TrainingReview> rows) {
        List<Integer> userIds = rows.stream()
                .filter(r -> ReviewScope.TRAINER.name().equals(r.getReviewScope()))
                .map(TrainingReview::getTrainerUserId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (userIds.isEmpty()) {
            return Map.of();
        }
        return trainerService.findByUserIds(userIds).stream()
                .filter(t -> t.getUserId() != null)
                .collect(Collectors.toMap(
                        Trainer::getUserId,
                        t -> t.getName() == null ? "" : t.getName().trim(),
                        (a, b) -> a));
    }

    /**
     * 机构展示名：优先 org_name，其次联系人/法人，仍空则回退关联账号昵称、真名、手机号。
     */
    private Map<Integer, String> buildInstitutionDisplayById(List<TrainingReview> rows) {
        Set<Integer> ids = rows.stream()
                .filter(r -> ReviewScope.INSTITUTION.name().equals(r.getReviewScope()))
                .map(TrainingReview::getInstitutionId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        List<Institution> insts = institutionService.findByIds(ids);
        Map<Integer, String> byInstId = new HashMap<>();
        List<Integer> userIdsNeedingAccount = new ArrayList<>();
        for (Institution i : insts) {
            String primary = institutionPrimaryLabel(i);
            if (!primary.isEmpty()) {
                byInstId.put(i.getId(), primary);
            } else if (i.getUserId() != null) {
                userIdsNeedingAccount.add(i.getUserId());
            }
        }
        if (!userIdsNeedingAccount.isEmpty()) {
            List<Integer> distinctUids = userIdsNeedingAccount.stream().distinct().toList();
            Map<Integer, String> accountLabelByUserId = userService.findAllByIds(distinctUids).stream()
                    .collect(Collectors.toMap(
                            User::getId,
                            AdminReviewController::userAccountLabel,
                            (a, b) -> a));
            for (Institution i : insts) {
                if (!byInstId.containsKey(i.getId()) && i.getUserId() != null) {
                    String acc = accountLabelByUserId.get(i.getUserId());
                    if (acc != null && !acc.isEmpty()) {
                        byInstId.put(i.getId(), acc);
                    }
                }
            }
        }
        return byInstId;
    }

    private static String institutionPrimaryLabel(Institution i) {
        String s = nonBlank(i.getOrgName());
        if (!s.isEmpty()) {
            return s;
        }
        s = nonBlank(i.getContactName());
        if (!s.isEmpty()) {
            return s;
        }
        return nonBlank(i.getLegalRepresentative());
    }

    private static String userAccountLabel(User u) {
        String s = nonBlank(u.getNickname());
        if (!s.isEmpty()) {
            return s;
        }
        s = nonBlank(u.getRealName());
        if (!s.isEmpty()) {
            return s;
        }
        return nonBlank(u.getPhone());
    }

    private Map<Integer, String> buildCourseTitleById(List<TrainingReview> rows) {
        Set<Integer> ids = rows.stream()
                .filter(r -> ReviewScope.COURSE.name().equals(r.getReviewScope()))
                .map(TrainingReview::getCourseId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        return courseService.findByIds(ids).stream()
                .collect(Collectors.toMap(
                        Course::getId,
                        c -> c.getTitle() == null ? "" : c.getTitle().trim(),
                        (a, b) -> a));
    }

    private static String nonBlank(String s) {
        if (s == null) {
            return "";
        }
        return s.trim();
    }

    private String buildTargetDisplayName(TrainingReview r,
                                          Map<Integer, String> trainerNameByUserId,
                                          Map<Integer, String> institutionDisplayById,
                                          Map<Integer, String> courseTitleById) {
        try {
            ReviewScope scope = ReviewScope.valueOf(r.getReviewScope());
            return switch (scope) {
                case COURSE -> {
                    Integer id = r.getCourseId();
                    if (id == null) {
                        yield "-";
                    }
                    String t = nonBlank(r.getCourseTitle());
                    if (!t.isEmpty()) {
                        yield t;
                    }
                    t = nonBlank(courseTitleById.get(id));
                    if (!t.isEmpty()) {
                        yield t;
                    }
                    yield "课程 #" + id;
                }
                case TRAINER -> {
                    Integer uid = r.getTrainerUserId();
                    if (uid == null) {
                        yield "-";
                    }
                    String n = nonBlank(r.getExpertName());
                    if (!n.isEmpty()) {
                        yield n;
                    }
                    n = nonBlank(trainerNameByUserId.get(uid));
                    if (!n.isEmpty()) {
                        yield n;
                    }
                    yield "专家 #" + uid;
                }
                case INSTITUTION -> {
                    Integer id = r.getInstitutionId();
                    if (id == null) {
                        yield "-";
                    }
                    String n = nonBlank(institutionDisplayById.get(id));
                    if (!n.isEmpty()) {
                        yield n;
                    }
                    yield "机构 #" + id;
                }
                case CASE -> {
                    Integer id = r.getCaseId();
                    if (id == null) {
                        yield "-";
                    }
                    yield "案例 #" + id;
                }
                case VIDEO -> {
                    Integer id = r.getCourseId();
                    if (id == null) {
                        yield "-";
                    }
                    String t = nonBlank(r.getCourseTitle());
                    if (!t.isEmpty()) {
                        yield t;
                    }
                    t = nonBlank(courseTitleById.get(id));
                    if (!t.isEmpty()) {
                        yield t;
                    }
                    yield "录播课 #" + id;
                }
            };
        } catch (IllegalArgumentException e) {
            return "-";
        }
    }

    private AdminReviewVO toAdminVo(TrainingReview r,
                                    Map<Integer, String> trainerNameByUserId,
                                    Map<Integer, String> institutionDisplayById,
                                    Map<Integer, String> courseTitleById,
                                    Map<Integer, String> reviewerNameByUserId) {
        AdminReviewVO vo = new AdminReviewVO();
        vo.setId(r.getId());
        vo.setReviewScope(r.getReviewScope());
        vo.setCourseId(r.getCourseId());
        vo.setTrainerUserId(r.getTrainerUserId());
        vo.setInstitutionId(r.getInstitutionId());
        vo.setCaseId(r.getCaseId());
        vo.setReviewedBy(r.getReviewedBy());
        if (r.getReviewedBy() != null) {
            String reviewerName = nonBlank(reviewerNameByUserId.get(r.getReviewedBy()));
            vo.setReviewedByName(reviewerName.isEmpty() ? null : reviewerName);
        }
        vo.setExpertName(r.getExpertName());
        vo.setTrainingDate(r.getTrainingDate());
        vo.setCourseDays(r.getCourseDays());
        vo.setCourseTitle(r.getCourseTitle());
        vo.setClientCompany(r.getClientCompany());
        vo.setTrainingLocation(r.getTrainingLocation());
        vo.setRatingContent(r.getRatingContent());
        vo.setRatingTeaching(r.getRatingTeaching());
        vo.setRatingService(r.getRatingService());
        vo.setAvgScore(r.getAvgScore());
        vo.setCommentText(r.getCommentText());
        vo.setSubmitterName(r.getSubmitterName());
        vo.setAnonymous(r.getAnonymous());
        vo.setStatus(r.getStatus());
        vo.setCreatedAt(r.getCreatedAt());
        vo.setUserId(r.getUserId());
        vo.setRejectReason(r.getRejectReason());
        vo.setSubmitterContact(r.getSubmitterContact());

        if (r.getPhotoUrls() != null && !r.getPhotoUrls().isBlank()) {
            try {
                List<String> urls = objectMapper.readValue(r.getPhotoUrls(), new TypeReference<>() {});
                vo.setPhotoUrls(urls);
            } catch (JsonProcessingException e) {
                vo.setPhotoUrls(Collections.emptyList());
            }
        } else {
            vo.setPhotoUrls(Collections.emptyList());
        }
        vo.setTargetDisplayName(buildTargetDisplayName(r, trainerNameByUserId, institutionDisplayById, courseTitleById));
        return vo;
    }
}
