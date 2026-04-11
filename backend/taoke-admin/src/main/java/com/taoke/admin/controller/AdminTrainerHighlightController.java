package com.taoke.admin.controller;

import com.taoke.admin.dto.AdminTrainerHighlightVO;
import com.taoke.admin.dto.RejectApplicationRequest;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.api.TrainerHighlightService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.dto.trainerhighlight.TrainerHighlightResponse;
import com.taoke.user.entity.Trainer;
import com.taoke.user.entity.TrainerHighlight;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 后台 — 精彩瞬间管理（列表 + 审核）
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:30
 */
@Tag(name = "后台-精彩瞬间管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminTrainerHighlightController {

    private final TrainerHighlightService trainerHighlightService;
    private final TrainerService trainerService;

    @Operation(summary = "分页查询精彩瞬间列表")
    @GetMapping("/admin/trainer-highlights")
    public ApiResponse<PageResponse<AdminTrainerHighlightVO>> list(
            @RequestParam(required = false) Integer trainerId,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<TrainerHighlight> result = trainerHighlightService.adminSearch(trainerId, status, page, size);

        List<Integer> trainerIds = result.getContent().stream()
                .map(TrainerHighlight::getTrainerId).distinct().toList();
        Map<Integer, Trainer> trainerMap = trainerService.findByIds(trainerIds).stream()
                .collect(Collectors.toMap(Trainer::getId, Function.identity()));

        PageResponse<AdminTrainerHighlightVO> response = PageResponse.of(result, h -> {
            AdminTrainerHighlightVO vo = AdminTrainerHighlightVO.from(h);
            Trainer trainer = trainerMap.get(h.getTrainerId());
            if (trainer != null) {
                vo.setTrainerName(trainer.getName());
            }
            return vo;
        });
        return ApiResponse.ok(response);
    }

    @Operation(summary = "精彩瞬间详情")
    @GetMapping("/admin/trainer-highlights/{id}")
    public ApiResponse<TrainerHighlightResponse> detail(@PathVariable Integer id) {
        return ApiResponse.ok(trainerHighlightService.adminGetDetail(id));
    }

    @Operation(summary = "审核通过")
    @PutMapping("/admin/trainer-highlights/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable Integer id) {
        trainerHighlightService.approve(id, SecurityUtils.getCurrentUserId());
        return ApiResponse.ok();
    }

    @Operation(summary = "审核驳回")
    @PutMapping("/admin/trainer-highlights/{id}/reject")
    public ApiResponse<Void> reject(@PathVariable Integer id,
                                    @Valid @RequestBody RejectApplicationRequest request) {
        trainerHighlightService.reject(id, SecurityUtils.getCurrentUserId(), request.getReason());
        return ApiResponse.ok();
    }
}
