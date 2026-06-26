package com.taoke.user.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.Public;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.api.BindingAuthority;
import com.taoke.user.api.TrainerBookService;
import com.taoke.user.dto.trainerbook.SaveTrainerBookRequest;
import com.taoke.user.dto.trainerbook.TrainerBookResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 专家著作 — 自服务（专家本人维护）+ C端公开列表
 *
 * @author Fangxinxin
 * @date 2026-04-16 15:30
 */
@Tag(name = "专家著作")
@RestController
@RequiredArgsConstructor
public class TrainerBookController {

    private final TrainerBookService bookService;
    private final BindingAuthority bindingAuthority;

    private Integer effectiveTrainerUserId(Integer trainerUserId) {
        return bindingAuthority.resolveTargetTrainerUserId(SecurityUtils.getCurrentUserId(), trainerUserId);
    }

    // ==================== 专家自服务 ====================

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "我的著作列表（trainerUserId 可选，用于代管）")
    @GetMapping("/trainers/me/books")
    public ApiResponse<List<TrainerBookResponse>> listMyBooks(@RequestParam(required = false) Integer trainerUserId) {
        return ApiResponse.ok(bookService.listMyBooks(effectiveTrainerUserId(trainerUserId)));
    }

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "新增著作")
    @PostMapping("/trainers/me/books")
    public ApiResponse<TrainerBookResponse> createBook(@RequestParam(required = false) Integer trainerUserId,
                                                        @Valid @RequestBody SaveTrainerBookRequest request) {
        return ApiResponse.ok(bookService.createBook(effectiveTrainerUserId(trainerUserId), request));
    }

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "更新著作")
    @PutMapping("/trainers/me/books/{id}")
    public ApiResponse<TrainerBookResponse> updateBook(@PathVariable Integer id,
                                                        @RequestParam(required = false) Integer trainerUserId,
                                                        @Valid @RequestBody SaveTrainerBookRequest request) {
        return ApiResponse.ok(bookService.updateBook(effectiveTrainerUserId(trainerUserId), id, request));
    }

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "删除著作")
    @DeleteMapping("/trainers/me/books/{id}")
    public ApiResponse<Void> deleteBook(@PathVariable Integer id,
                                        @RequestParam(required = false) Integer trainerUserId) {
        bookService.deleteBook(effectiveTrainerUserId(trainerUserId), id);
        return ApiResponse.ok();
    }

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "批量排序（ids 顺序即展示顺序，第一个最靠前）")
    @PutMapping("/trainers/me/books/sort")
    public ApiResponse<Void> batchSort(@RequestParam(required = false) Integer trainerUserId,
                                       @RequestBody List<Integer> ids) {
        bookService.batchSort(effectiveTrainerUserId(trainerUserId), ids);
        return ApiResponse.ok();
    }

    // ==================== C端公开 ====================

    @Public
    @Operation(summary = "某专家的著作列表（按 sort_order 倒序）")
    @GetMapping("/trainers/{id}/books")
    public ApiResponse<List<TrainerBookResponse>> listPublicBooks(@PathVariable Integer id) {
        return ApiResponse.ok(bookService.listPublicBooks(id));
    }
}
