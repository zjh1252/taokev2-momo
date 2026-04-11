package com.taoke.admin.controller;

import com.taoke.admin.dto.SaveSensitiveWordRequest;
import com.taoke.admin.dto.SensitiveWordVO;
import com.taoke.common.entity.SensitiveWord;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.service.SensitiveWordService;
import com.taoke.common.security.RequireRole;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * 后台 — 敏感词管理（CRUD + 批量导入 + 词库重载）
 *
 * @author Fangxinxin
 * @date 2026-04-11 15:00
 */
@Tag(name = "后台-敏感词管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminSensitiveWordController {

    private final SensitiveWordService sensitiveWordService;

    @Operation(summary = "分页查询敏感词")
    @GetMapping("/admin/sensitive-words")
    public ApiResponse<PageResponse<SensitiveWordVO>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer category,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SensitiveWord> result = sensitiveWordService.search(keyword, category, page, size);
        return ApiResponse.ok(PageResponse.of(result, SensitiveWordVO::from));
    }

    @Operation(summary = "新增敏感词")
    @PostMapping("/admin/sensitive-words")
    public ApiResponse<SensitiveWordVO> create(@Valid @RequestBody SaveSensitiveWordRequest request) {
        SensitiveWord entity = sensitiveWordService.create(
                request.getWord(), request.getCategory(),
                request.getReplacement(), request.getEnabled());
        return ApiResponse.ok(SensitiveWordVO.from(entity));
    }

    @Operation(summary = "编辑敏感词")
    @PutMapping("/admin/sensitive-words/{id}")
    public ApiResponse<SensitiveWordVO> update(@PathVariable Integer id,
                                               @Valid @RequestBody SaveSensitiveWordRequest request) {
        SensitiveWord entity = sensitiveWordService.update(
                id, request.getWord(), request.getCategory(),
                request.getReplacement(), request.getEnabled());
        return ApiResponse.ok(SensitiveWordVO.from(entity));
    }

    @Operation(summary = "删除敏感词")
    @DeleteMapping("/admin/sensitive-words/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        sensitiveWordService.delete(id);
        return ApiResponse.ok();
    }

    @Operation(summary = "批量导入敏感词（文本文件，每行一个）")
    @PostMapping("/admin/sensitive-words/import")
    public ApiResponse<Integer> batchImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Integer category) {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            List<String> words = reader.lines().toList();
            if (words.isEmpty()) {
                throw new BusinessException(ErrorCode.SENSITIVE_WORD_IMPORT_EMPTY);
            }
            int count = sensitiveWordService.batchImport(words, category);
            return ApiResponse.ok(count);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "文件读取失败：" + e.getMessage());
        }
    }

    @Operation(summary = "手动重新加载词库")
    @PostMapping("/admin/sensitive-words/reload")
    public ApiResponse<Void> reload() {
        sensitiveWordService.reload();
        return ApiResponse.ok();
    }
}
