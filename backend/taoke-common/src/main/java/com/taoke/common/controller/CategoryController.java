package com.taoke.common.controller;

import com.taoke.common.dto.CategoryTreeVO;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.Public;
import com.taoke.common.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 统一分类公开接口 — 无需登录，供前端树形选择器、筛选面板等场景使用。
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:50
 */
@Tag(name = "统一分类", description = "按 type 查询分类树/子级列表")
@RestController
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @Public
    @Operation(summary = "获取分类完整树", description = "按 type 获取完整分类树结构，如 TRAINER_EXPERTISE、TRAINER_INDUSTRY")
    @GetMapping("/categories/tree")
    public ApiResponse<List<CategoryTreeVO>> getTree(
            @Parameter(description = "分类类型，如 TRAINER_EXPERTISE")
            @RequestParam String type) {
        return ApiResponse.ok(categoryService.getTree(type));
    }

    @Public
    @Operation(summary = "获取分类子级列表", description = "按 type + parentId 获取直接子级，parentId 为空则获取顶级节点")
    @GetMapping("/categories/children")
    public ApiResponse<List<CategoryTreeVO>> getChildren(
            @Parameter(description = "分类类型")
            @RequestParam String type,
            @Parameter(description = "父级 ID，不传或 0 则查顶级")
            @RequestParam(defaultValue = "0") Integer parentId) {
        return ApiResponse.ok(categoryService.getChildren(type, parentId));
    }
}
