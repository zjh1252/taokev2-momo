package com.taoke.course.controller;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.Public;
import com.taoke.course.api.CourseService;
import com.taoke.course.dto.course.CourseDetailVO;
import com.taoke.course.dto.course.CourseListItemVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

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
    @Operation(summary = "公开课程列表（分页、分类筛选、关键词搜索）")
    @GetMapping("/courses")
    public ApiResponse<PageResponse<CourseListItemVO>> list(
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Integer subCategoryId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Boolean isOpen,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ApiResponse.ok(courseService.listPublic(categoryId, subCategoryId, type, isOpen, keyword, page, size));
    }

    @Public
    @Operation(summary = "课程公开详情")
    @GetMapping("/courses/{id}")
    public ApiResponse<CourseDetailVO> detail(@PathVariable Integer id) {
        return ApiResponse.ok(courseService.getPublicDetail(id));
    }
}
