package com.taoke.course.controller;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.dto.learning.ContinueLearningVO;
import com.taoke.course.dto.learning.MyCourseEnrollmentVO;
import com.taoke.course.dto.learning.MyVideoLearningVO;
import com.taoke.course.service.LearningService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 学习中心接口（需登录）
 * <p>
 * 提供"我的录播课列表"、"我的公开课列表"、"继续学习"等聚合查询。
 * 录播课进度上报/查询仍保留在 {@link com.taoke.course.controller.video.VideoProgressController}。
 *
 * @author Fangxinxin
 * @date 2026-04-09 11:30
 */
@Tag(name = "学习中心")
@RestController
@RequiredArgsConstructor
public class LearningController {

    private final LearningService learningService;

    @Operation(summary = "我的录播课列表（含学习进度）")
    @GetMapping("/learning/videos")
    public ApiResponse<PageResponse<MyVideoLearningVO>> getMyVideos(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(learningService.getMyVideos(userId, page, size));
    }

    @Operation(summary = "我的公开课报名列表")
    @GetMapping("/learning/courses")
    public ApiResponse<PageResponse<MyCourseEnrollmentVO>> getMyCourses(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(learningService.getMyCourses(userId, page, size));
    }

    @Operation(summary = "继续学习（最近未完成的录播课）")
    @GetMapping("/learning/continue")
    public ApiResponse<ContinueLearningVO> getContinueLearning() {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(learningService.getContinueLearning(userId));
    }
}
