package com.taoke.admin.controller;

import com.taoke.admin.dto.AdminTrainerCaseVO;
import com.taoke.admin.dto.RejectApplicationRequest;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.api.TrainerCaseService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.dto.trainercase.TrainerCaseResponse;
import com.taoke.user.entity.Trainer;
import com.taoke.user.entity.TrainerCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.function.Function;

/**
 * 后台 — 案例管理（列表 + 审核）
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:30
 */
@Tag(name = "后台-案例管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminTrainerCaseController {

    private final TrainerCaseService trainerCaseService;
    private final TrainerService trainerService;

    @Operation(summary = "分页查询案例列表")
    @GetMapping("/admin/trainer-cases")
    public ApiResponse<PageResponse<AdminTrainerCaseVO>> list(
            @RequestParam(required = false) Integer trainerId,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<TrainerCase> result = trainerCaseService.adminSearch(trainerId, status, page, size);

        List<Integer> trainerIds = result.getContent().stream()
                .map(TrainerCase::getTrainerId).distinct().toList();
        Map<Integer, Trainer> trainerMap = trainerService.findByIds(trainerIds).stream()
                .collect(Collectors.toMap(Trainer::getId, Function.identity()));

        PageResponse<AdminTrainerCaseVO> response = PageResponse.of(result, c -> {
            AdminTrainerCaseVO vo = AdminTrainerCaseVO.from(c);
            Trainer trainer = trainerMap.get(c.getTrainerId());
            if (trainer != null) {
                vo.setTrainerName(trainer.getName());
            }
            return vo;
        });
        return ApiResponse.ok(response);
    }

    @Operation(summary = "案例详情")
    @GetMapping("/admin/trainer-cases/{id}")
    public ApiResponse<TrainerCaseResponse> detail(@PathVariable Integer id) {
        return ApiResponse.ok(trainerCaseService.adminGetDetail(id));
    }

    @Operation(summary = "审核通过")
    @PutMapping("/admin/trainer-cases/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable Integer id) {
        trainerCaseService.approve(id, SecurityUtils.getCurrentUserId());
        return ApiResponse.ok();
    }

    @Operation(summary = "审核驳回")
    @PutMapping("/admin/trainer-cases/{id}/reject")
    public ApiResponse<Void> reject(@PathVariable Integer id,
                                    @Valid @RequestBody RejectApplicationRequest request) {
        trainerCaseService.reject(id, SecurityUtils.getCurrentUserId(), request.getReason());
        return ApiResponse.ok();
    }
}
