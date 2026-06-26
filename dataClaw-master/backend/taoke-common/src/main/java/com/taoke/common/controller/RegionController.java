package com.taoke.common.controller;

import com.taoke.common.dto.RegionDetailVO;
import com.taoke.common.dto.RegionVO;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.Public;
import com.taoke.common.service.RegionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 行政区划公开接口 — 无需登录，供前端级联选择器、地区搜索等场景使用。
 *
 * @author Fangxinxin
 * @date 2026-04-01 16:00
 */
@Tag(name = "行政区划", description = "省/市/区/街道四级地区数据查询")
@RestController
@RequiredArgsConstructor
public class RegionController {

    private final RegionService regionService;

    @Public
    @Operation(summary = "查询下级地区列表", description = "按父级编码查询下级列表，parentCode 为空或 0 时返回省级列表。用于级联选择器逐级加载。")
    @GetMapping("/regions/children")
    public ApiResponse<List<RegionVO>> getChildren(
            @Parameter(description = "父级区划编码，空/0 查省级")
            @RequestParam(required = false) String parentCode) {
        return ApiResponse.ok(regionService.getChildren(parentCode));
    }

    @Public
    @Operation(summary = "查询地区详情", description = "根据区划编码查询地区详情，包含从省到当前层级的完整路径链。")
    @GetMapping("/regions/{code}")
    public ApiResponse<RegionDetailVO> getDetail(
            @Parameter(description = "行政区划编码")
            @PathVariable String code) {
        return ApiResponse.ok(regionService.getDetail(code));
    }

    @Public
    @Operation(summary = "搜索地区", description = "按名称关键词模糊搜索地区，可选限定层级，最多返回 20 条。")
    @GetMapping("/regions/search")
    public ApiResponse<List<RegionVO>> search(
            @Parameter(description = "地区名称关键词")
            @RequestParam String keyword,
            @Parameter(description = "限定搜索层级（1=省，2=市，3=区，4=街道），不传则不限")
            @RequestParam(required = false) Integer level) {
        return ApiResponse.ok(regionService.search(keyword, level));
    }
}
