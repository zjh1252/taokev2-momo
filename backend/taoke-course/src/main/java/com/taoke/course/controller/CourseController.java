package com.taoke.course.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.api.CourseService;
import com.taoke.course.dto.course.CourseDetailVO;
import com.taoke.course.dto.course.CourseListItemVO;
import com.taoke.course.dto.course.SaveCourseRequest;
import com.taoke.user.api.BindingAuthority;
import com.taoke.user.api.UserRoleService;
import com.taoke.user.entity.UserRole;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

/**
 * C 端课程发布者接口 — 内容管理角色创建、编辑、提交审核、下架、删除课程
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
@Tag(name = "课程-发布者", description = "内容管理角色的课程管理")
@RestController
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final UserRoleService userRoleService;
    private final BindingAuthority bindingAuthority;

    /** 可发布课程的角色集合 */
    private static final Set<String> PUBLISHER_ROLES = Set.of(
            BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT,
            BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION,
            BusinessRole.Code.INSTITUTION_EMPLOYEE
    );

    @Operation(summary = "创建课程（保存为草稿）",
            description = "trainerUserId 提供时：以专家身份发布；操作者必须能代管该专家。否则按操作者自身角色发布。")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @PostMapping("/courses")
    public ApiResponse<CourseDetailVO> create(@RequestParam(required = false) Integer trainerUserId,
                                              @Valid @RequestBody SaveCourseRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        String publisherType;
        Integer publisherId;
        if (trainerUserId != null) {
            bindingAuthority.requireCanManageTrainer(userId, trainerUserId);
            publisherType = BusinessRole.Code.TRAINER;
            publisherId = trainerUserId;
        } else {
            publisherType = resolvePublisherType(userId);
            publisherId = userId;
        }
        return ApiResponse.ok(courseService.create(publisherId, publisherType, request));
    }

    @Operation(summary = "编辑课程")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @PutMapping("/courses/{id}")
    public ApiResponse<CourseDetailVO> update(@PathVariable Integer id,
                                              @Valid @RequestBody SaveCourseRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(courseService.update(id, userId, request));
    }

    @Operation(summary = "我的课程列表",
            description = "trainerUserId 提供时：列出指定专家旗下的课程；否则列出当前操作者自己发布的课程。")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @GetMapping("/courses/me")
    public ApiResponse<PageResponse<CourseListItemVO>> myCourses(
            @RequestParam(required = false) Integer trainerUserId,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "15") int size) {
        Integer userId = SecurityUtils.getRequiredUserId();
        String publisherType;
        Integer publisherId;
        if (trainerUserId != null) {
            bindingAuthority.requireCanManageTrainer(userId, trainerUserId);
            publisherType = BusinessRole.Code.TRAINER;
            publisherId = trainerUserId;
        } else {
            publisherType = resolvePublisherType(userId);
            publisherId = userId;
        }
        return ApiResponse.ok(courseService.listByPublisher(publisherId, publisherType, status, keyword, page, size));
    }

    @Operation(summary = "我的课程详情")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @GetMapping("/courses/me/{id}")
    public ApiResponse<CourseDetailVO> myDetail(@PathVariable Integer id) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(courseService.getDetailForPublisher(id, userId));
    }

    @Operation(summary = "提交审核")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @PutMapping("/courses/{id}/submit")
    public ApiResponse<Void> submit(@PathVariable Integer id) {
        Integer userId = SecurityUtils.getRequiredUserId();
        courseService.submitForReview(id, userId);
        return ApiResponse.ok();
    }

    @Operation(summary = "下架课程")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @PutMapping("/courses/{id}/unpublish")
    public ApiResponse<Void> unpublish(@PathVariable Integer id) {
        Integer userId = SecurityUtils.getRequiredUserId();
        courseService.unpublish(id, userId);
        return ApiResponse.ok();
    }

    @Operation(summary = "删除课程")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @DeleteMapping("/courses/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        Integer userId = SecurityUtils.getRequiredUserId();
        courseService.delete(id, userId);
        return ApiResponse.ok();
    }

    /**
     * 从当前用户角色中解析发布者类型（优先级：TRAINER > AGENT > ASSISTANT > INSTITUTION > INSTITUTION_EMPLOYEE）
     */
    private String resolvePublisherType(Integer userId) {
        List<UserRole> roles = userRoleService.findByUserId(userId);
        Set<String> activeRoles = new java.util.HashSet<>();
        for (UserRole role : roles) {
            if (role.getStatus() == 1 && PUBLISHER_ROLES.contains(role.getRole())) {
                activeRoles.add(role.getRole());
            }
        }
        if (activeRoles.contains(BusinessRole.Code.TRAINER)) return BusinessRole.Code.TRAINER;
        if (activeRoles.contains(BusinessRole.Code.AGENT)) return BusinessRole.Code.AGENT;
        if (activeRoles.contains(BusinessRole.Code.ASSISTANT)) return BusinessRole.Code.ASSISTANT;
        if (activeRoles.contains(BusinessRole.Code.INSTITUTION)) return BusinessRole.Code.INSTITUTION;
        if (activeRoles.contains(BusinessRole.Code.INSTITUTION_EMPLOYEE)) return BusinessRole.Code.INSTITUTION_EMPLOYEE;
        throw new BusinessException(ErrorCode.ROLE_NOT_MATCH, "当前用户无发布课程的角色");
    }
}
