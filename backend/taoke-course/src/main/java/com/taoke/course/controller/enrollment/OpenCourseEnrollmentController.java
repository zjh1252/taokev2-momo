package com.taoke.course.controller.enrollment;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.Public;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.api.OpenCourseEnrollmentService;
import com.taoke.course.dto.enrollment.SubmitOpenCourseEnrollmentRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * C 端 — 公开课报名
 *
 * @author Fangxinxin
 * @date 2026-08-06 20:15
 */
@Tag(name = "公开课报名", description = "公开课详情页提交报名线索")
@RestController
@RequiredArgsConstructor
public class OpenCourseEnrollmentController {

    private final OpenCourseEnrollmentService enrollmentService;

    @Public
    @Operation(summary = "提交公开课报名（登录可选）")
    @PostMapping("/open-course-enrollments")
    public ApiResponse<Integer> submit(@Valid @RequestBody SubmitOpenCourseEnrollmentRequest request) {
        Integer userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.ok(enrollmentService.submit(userId, request));
    }
}
