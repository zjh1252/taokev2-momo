package com.taoke.course.controller;

import com.taoke.common.dto.PageResult;
import com.taoke.common.response.ApiResponse;
import com.taoke.course.api.OpsMaterialService;
import com.taoke.course.entity.OpsMaterial;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户端 — 运营素材选用
 *
 * @author Fangxinxin
 * @date 2026-06-15 10:00
 */
@Tag(name = "运营素材库")
@RestController
@RequiredArgsConstructor
public class MaterialController {

    private final OpsMaterialService opsMaterialService;

    @Operation(summary = "分页查询可用素材")
    @GetMapping("/materials")
    public ApiResponse<PageResult<MaterialItemVO>> list(
            @RequestParam String materialType,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String scene,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        int safePage = Math.max(1, page);
        int safeSize = size <= 0 ? 20 : Math.min(size, 100);
        Page<OpsMaterial> result = opsMaterialService.listForUser(materialType, category, scene,
                PageRequest.of(safePage - 1, safeSize, Sort.by(Sort.Direction.DESC, "id")));
        List<MaterialItemVO> list = result.getContent().stream().map(this::toVo).toList();
        return ApiResponse.ok(PageResult.of(result.getTotalElements(), safePage, safeSize, list));
    }

    @Operation(summary = "选用素材（累加使用次数）")
    @PostMapping("/materials/{id}/pick")
    public ApiResponse<Void> pick(@PathVariable Integer id) {
        opsMaterialService.incrementUsage(id);
        return ApiResponse.ok(null);
    }

    private MaterialItemVO toVo(OpsMaterial m) {
        MaterialItemVO vo = new MaterialItemVO();
        vo.setId(m.getId());
        vo.setMaterialType(m.getMaterialType());
        vo.setName(m.getName());
        vo.setUrl(m.getUrl());
        vo.setCategory(m.getCategory());
        vo.setScene(m.getScene());
        vo.setIsDefault(m.getIsDefault());
        vo.setCreatedAt(m.getCreatedAt());
        return vo;
    }

    @Data
    public static class MaterialItemVO {
        private Integer id;
        private String materialType;
        private String name;
        private String url;
        private String category;
        private String scene;
        private Boolean isDefault;
        private LocalDateTime createdAt;
    }
}
