package com.taoke.course.controller.enrollment;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.Public;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.api.InternalCourseEnrollmentService;
import com.taoke.course.dto.enrollment.SubmitInternalCourseEnrollmentRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * C 端 — 内训课报名
 *
 * @author Fangxinxin
 * @date 2026-08-07 10:15
 */
@Tag(name = "内训课报名", description = "内训课详情页提交报名线索")
@RestController
@RequiredArgsConstructor
public class InternalCourseEnrollmentController {

    private final InternalCourseEnrollmentService enrollmentService;

    @Public
    @Operation(summary = "提交内训课报名（登录可选）")
    @PostMapping("/internal-course-enrollments")
    public ApiResponse<Integer> submit(@Valid @RequestBody SubmitInternalCourseEnrollmentRequest request) {
        Integer userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.ok(enrollmentService.submit(userId, request));
    }
}
