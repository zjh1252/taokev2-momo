package com.taoke.course.controller;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.Public;
import com.taoke.course.api.CourseService;
import com.taoke.course.api.VideoService;
import com.taoke.course.dto.course.CourseListItemVO;
import com.taoke.course.dto.video.VideoListItemVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 机构详情页聚合接口 — 公开课/内训课/视频/侧边栏推荐 + 全平台热门公开课。
 * <p>
 * 放在 taoke-course 模块以避免跨模块循环依赖：内部按 {@code institutionId} 反查
 * {@code user_institutions.user_id}，再以 {@code publisherType=INSTITUTION AND publisherId=userId}
 * 过滤课程/录播课。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Tag(name = "机构详情聚合", description = "机构详情页课程/视频/推荐相关聚合接口")
@RestController
@RequiredArgsConstructor
public class PublicInstitutionAggregateController {

    private final CourseService courseService;
    private final VideoService videoService;

    @Public
    @Operation(summary = "机构课程列表（按 type=OPEN/INNER 区分公开课/内训课）")
    @GetMapping("/institutions/{id}/courses")
    public ApiResponse<PageResponse<CourseListItemVO>> listCourses(
            @PathVariable("id") Integer institutionId,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(courseService.listByInstitution(institutionId, type, page, size));
    }

    @Public
    @Operation(summary = "机构录播课列表")
    @GetMapping("/institutions/{id}/videos")
    public ApiResponse<PageResponse<VideoListItemVO>> listVideos(
            @PathVariable("id") Integer institutionId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(videoService.listByInstitution(institutionId, page, size));
    }

    @Public
    @Operation(summary = "机构详情页右侧栏：机构公开课（最多 6 条）")
    @GetMapping("/institutions/{id}/sidebar/open-courses")
    public ApiResponse<List<CourseListItemVO>> sidebarOpenCourses(@PathVariable("id") Integer institutionId) {
        return ApiResponse.ok(courseService.listInstitutionSidebarOpenCourses(institutionId));
    }

    @Public
    @Operation(summary = "机构详情页右侧栏：机构录播课（最多 6 条）")
    @GetMapping("/institutions/{id}/sidebar/videos")
    public ApiResponse<List<VideoListItemVO>> sidebarVideos(@PathVariable("id") Integer institutionId) {
        return ApiResponse.ok(videoService.listInstitutionSidebarVideos(institutionId));
    }

    @Public
    @Operation(summary = "全平台热门公开课（最多 5 条，最近报名 > 最近创建）")
    @GetMapping("/opencourses/hot")
    public ApiResponse<List<CourseListItemVO>> hotOpenCourses() {
        return ApiResponse.ok(courseService.listHotOpenCourses());
    }
}
