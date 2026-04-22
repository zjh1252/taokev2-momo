package com.taoke.course.controller;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.Public;
import com.taoke.course.api.CourseService;
import com.taoke.course.dto.course.CourseDetailVO;
import com.taoke.course.dto.course.CourseListItemVO;
import com.taoke.course.dto.course.PublicCourseQuery;
import com.taoke.course.dto.course.RecommendedCourseVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 公开课程接口 — 无需登录，仅展示已上架课程
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
@Tag(name = "课程-公开", description = "课程列表/详情（游客可访问）")
@RestController
@RequiredArgsConstructor
public class PublicCourseController {

    private final CourseService courseService;

    @Public
    @Operation(summary = "公开课程列表",
            description = "支持分类、类型、关键词、排序、机构、开课省/市、开课时间(含快捷段)、价格区间、报名状态等多维度过滤")
    @GetMapping("/courses")
    public ApiResponse<PageResponse<CourseListItemVO>> list(@ParameterObject PublicCourseQuery query) {
        return ApiResponse.ok(courseService.listPublic(query));
    }

    @Public
    @Operation(summary = "课程公开详情")
    @GetMapping("/courses/{id}")
    public ApiResponse<CourseDetailVO> detail(@PathVariable Integer id) {
        return ApiResponse.ok(courseService.getPublicDetail(id));
    }

    @Public
    @Operation(summary = "专家详情页推荐课程（最多 3 条，按浏览量倒序）")
    @GetMapping("/trainers/{trainerId}/recommended-courses")
    public ApiResponse<List<RecommendedCourseVO>> recommendedByTrainer(@PathVariable Integer trainerId) {
        return ApiResponse.ok(courseService.listRecommendedByTrainer(trainerId));
    }
}
