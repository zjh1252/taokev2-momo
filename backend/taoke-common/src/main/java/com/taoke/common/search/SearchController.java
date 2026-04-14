package com.taoke.common.search;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.Public;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * C 端统一搜索入口 — 全文检索课程、专家等内容。
 *
 * @author Fangxinxin
 * @date 2026-04-14 19:00
 */
@Tag(name = "全文搜索", description = "C 端统一搜索接口")
@RestController
@RequiredArgsConstructor
public class SearchController {

    private final SearchIndexService searchIndexService;

    @Public
    @Operation(summary = "全文搜索", description = "按关键词搜索课程、专家等，支持按 docType 过滤")
    @GetMapping("/search")
    public ApiResponse<PageResponse<Map<String, Object>>> search(
            @Parameter(description = "搜索关键词") @RequestParam String keyword,
            @Parameter(description = "文档类型：course / trainer，不传搜全部") @RequestParam(required = false) String docType,
            @Parameter(description = "页码，从 1 开始") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "每页条数") @RequestParam(defaultValue = "20") int size) {

        PageResponse<Map<String, Object>> result = searchIndexService.search(keyword, docType, page, size);
        return ApiResponse.ok(result);
    }
}
