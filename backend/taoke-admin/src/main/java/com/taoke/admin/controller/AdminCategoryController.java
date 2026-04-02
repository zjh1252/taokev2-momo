package com.taoke.admin.controller;

import com.taoke.admin.dto.SaveCategoryRequest;
import com.taoke.admin.dto.UpdateCategoryRequest;
import com.taoke.common.dto.CategoryTreeVO;
import com.taoke.common.entity.Category;
import com.taoke.common.enums.CategoryType;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.common.service.CategoryService;
import com.taoke.common.enums.BusinessRole;
import com.taoke.user.api.TrainerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 后台 — 分类管理（编排层）。
 * <p>
 * 通用 CRUD 委托给 {@link CategoryService}（taoke-common），
 * 删除时通过 {@code api/} 接口做跨模块引用检查（如专家关联表），
 * 再交由 CategoryService 做通用子级检查 + 物理删除。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:00
 */
@Tag(name = "后台-分类管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminCategoryController {

    private final CategoryService categoryService;
    private final TrainerService trainerService;

    @Operation(summary = "获取分类树（含隐藏节点）")
    @GetMapping("/admin/categories/tree")
    public ApiResponse<List<CategoryTreeVO>> tree(@RequestParam String type) {
        validateType(type);
        return ApiResponse.ok(categoryService.getFullTree(type));
    }

    @Operation(summary = "新增分类")
    @PostMapping("/admin/categories")
    public ApiResponse<CategoryTreeVO> create(@Valid @RequestBody SaveCategoryRequest request) {
        validateType(request.getType());
        Category entity = categoryService.createCategory(
                request.getType(),
                request.getParentId(),
                request.getName(),
                request.getSortOrder(),
                request.getIsVisible(),
                request.getIcon(),
                request.getDescription()
        );
        return ApiResponse.ok(toVO(entity));
    }

    @Operation(summary = "编辑分类")
    @PutMapping("/admin/categories/{id}")
    public ApiResponse<CategoryTreeVO> update(@PathVariable Integer id,
                                              @Valid @RequestBody UpdateCategoryRequest request) {
        Category entity = categoryService.updateCategory(
                id,
                request.getName(),
                request.getSortOrder(),
                request.getIsVisible(),
                request.getIcon(),
                request.getDescription()
        );
        return ApiResponse.ok(toVO(entity));
    }

    @Operation(summary = "删除分类")
    @DeleteMapping("/admin/categories/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        Category entity = categoryService.getById(id);

        checkCategoryReferences(entity);

        categoryService.deleteCategory(id);
        return ApiResponse.ok();
    }

    /* ==================== 内部方法 ==================== */

    /**
     * 根据分类类型检查是否有业务数据引用
     */
    private void checkCategoryReferences(Category category) {
        String type = category.getType();

        if (CategoryType.TRAINER_EXPERTISE.name().equals(type)) {
            if (trainerService.hasExpertiseCategoryReference(category.getId())) {
                throw new BusinessException(ErrorCode.PARAM_INVALID,
                        "该分类已被专家关联（擅长领域），无法删除");
            }
        } else if (CategoryType.TRAINER_INDUSTRY.name().equals(type)) {
            if (trainerService.hasIndustryCategoryReference(category.getId())) {
                throw new BusinessException(ErrorCode.PARAM_INVALID,
                        "该分类已被专家关联（擅长行业），无法删除");
            }
        }
    }

    private void validateType(String type) {
        try {
            CategoryType.valueOf(type);
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "无效的分类类型：" + type);
        }
    }

    private CategoryTreeVO toVO(Category entity) {
        CategoryTreeVO vo = new CategoryTreeVO();
        vo.setId(entity.getId());
        vo.setParentId(entity.getParentId());
        vo.setName(entity.getName());
        vo.setLevel(entity.getLevel());
        vo.setSortOrder(entity.getSortOrder());
        vo.setIsVisible(entity.getIsVisible());
        vo.setIcon(entity.getIcon());
        vo.setDescription(entity.getDescription());
        return vo;
    }
}
