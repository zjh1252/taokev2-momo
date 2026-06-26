package com.taoke.admin.controller;

import com.taoke.admin.dto.AdminCoursePlanQuery;
import com.taoke.admin.dto.AdminCoursePlanVO;
import com.taoke.admin.dto.AdminCourseQuery;
import com.taoke.admin.dto.AdminCourseVO;
import com.taoke.admin.dto.BatchCourseExpireHideRequest;
import com.taoke.admin.dto.RejectApplicationRequest;
import com.taoke.admin.service.AdminCourseService;
import com.taoke.common.dto.PageResult;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.course.dto.course.CourseDetailVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 后台 — 课程管理（列表 + 审核 + 主打设置）
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
@Tag(name = "后台-课程管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminCourseController {

    private final AdminCourseService adminCourseService;

    @Operation(summary = "分页查询课程列表")
    @GetMapping("/admin/courses")
    public ApiResponse<PageResult<AdminCourseVO>> list(AdminCourseQuery query) {
        return ApiResponse.ok(adminCourseService.listCourses(query));
    }

    @Operation(summary = "后台课程详情")
    @GetMapping("/admin/courses/{id}")
    public ApiResponse<CourseDetailVO> detail(@PathVariable Integer id) {
        return ApiResponse.ok(adminCourseService.getDetail(id));
    }

    @Operation(summary = "审核通过")
    @PutMapping("/admin/courses/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable Integer id) {
        adminCourseService.approve(id);
        return ApiResponse.ok();
    }

    @Operation(summary = "审核驳回")
    @PutMapping("/admin/courses/{id}/reject")
    public ApiResponse<Void> reject(@PathVariable Integer id,
                                    @Valid @RequestBody RejectApplicationRequest request) {
        adminCourseService.reject(id, request.getReason());
        return ApiResponse.ok();
    }

    @Operation(summary = "后台下架课程")
    @PutMapping("/admin/courses/{id}/unpublish")
    public ApiResponse<Void> unpublish(@PathVariable Integer id) {
        adminCourseService.unpublish(id);
        return ApiResponse.ok();
    }

    @Operation(summary = "设为/取消主打课程")
    @PutMapping("/admin/courses/{id}/feature")
    public ApiResponse<Void> toggleFeatured(@PathVariable Integer id) {
        adminCourseService.toggleFeatured(id);
        return ApiResponse.ok();
    }

    @Operation(summary = "批量更新到期自动隐藏开关")
    @PutMapping("/admin/courses/expire-hide")
    public ApiResponse<Void> batchUpdateExpireHide(@Valid @RequestBody BatchCourseExpireHideRequest request) {
        adminCourseService.batchUpdateExpireHide(request.getIds(), request.getIsExpireHide());
        return ApiResponse.ok();
    }

    @Operation(summary = "分页查询排课计划")
    @GetMapping("/admin/courses/plans")
    public ApiResponse<PageResult<AdminCoursePlanVO>> listPlans(AdminCoursePlanQuery query) {
        return ApiResponse.ok(adminCourseService.listPlans(query));
    }
}
