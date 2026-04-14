package com.taoke.common.search;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.Public;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * C 端统一搜索入口 — 全文检索课程、专家等内容，支持高级筛选。
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
    @Operation(summary = "全文搜索", description = "按关键词搜索课程、专家，支持 docType/courseType/分类/价格/地区等高级筛选")
    @GetMapping("/search")
    public ApiResponse<PageResponse<Map<String, Object>>> search(@ModelAttribute SearchRequest request) {
        PageResponse<Map<String, Object>> result = searchIndexService.search(request);
        return ApiResponse.ok(result);
    }
}
