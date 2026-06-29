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
import com.taoke.user.api.InstitutionService;
import com.taoke.user.api.UserService;
import com.taoke.user.dto.trainerhighlight.SaveTrainerHighlightRequest;
import com.taoke.user.dto.trainerhighlight.TrainerHighlightResponse;
import com.taoke.user.entity.Institution;
import com.taoke.user.entity.Trainer;
import com.taoke.user.entity.TrainerHighlight;
import com.taoke.user.entity.User;
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
 * 后台管理 — 专家精彩瞬间审核
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:30
 */
@Tag(name = "后台-精彩瞬间管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminTrainerHighlightController {

    private final TrainerHighlightService highlightService;
    private final TrainerService trainerService;
    private final InstitutionService institutionService;
    private final UserService userService;

    @Operation(summary = "分页查询精彩瞬间列表")
    @GetMapping("/admin/trainer-highlights")
    public ApiResponse<PageResponse<AdminTrainerHighlightVO>> list(
            @RequestParam(required = false) Integer trainerId,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<TrainerHighlight> result = highlightService.adminSearch(trainerId, status, keyword,
                page - 1, size);

        List<Integer> trainerIds = result.getContent().stream()
                .map(TrainerHighlight::getTrainerId)
                .filter(id -> id != null && id > 0)
                .distinct().toList();
        Map<Integer, Trainer> trainerMap = trainerIds.isEmpty()
                ? Map.of()
                : trainerService.findByIds(trainerIds).stream()
                        .collect(Collectors.toMap(Trainer::getId, Function.identity()));

        List<Integer> institutionIds = result.getContent().stream()
                .map(TrainerHighlight::getInstitutionId)
                .filter(id -> id != null && id > 0)
                .distinct().toList();
        Map<Integer, Institution> institutionMap = institutionIds.isEmpty()
                ? Map.of()
                : institutionService.findByIds(institutionIds).stream()
                        .collect(Collectors.toMap(Institution::getId, Function.identity()));

        List<Integer> submitterUserIds = new java.util.ArrayList<>();
        for (TrainerHighlight h : result.getContent()) {
            if (h.getInstitutionId() != null && h.getInstitutionId() > 0) {
                Institution inst = institutionMap.get(h.getInstitutionId());
                if (inst != null && inst.getUserId() != null) {
                    submitterUserIds.add(inst.getUserId());
                }
            } else if (h.getTrainerId() != null && h.getTrainerId() > 0) {
                Trainer t = trainerMap.get(h.getTrainerId());
                if (t != null && t.getUserId() != null) {
                    submitterUserIds.add(t.getUserId());
                }
            }
        }
        Map<Integer, User> userMap = submitterUserIds.isEmpty()
                ? Map.of()
                : userService.findAllByIds(submitterUserIds.stream().distinct().toList()).stream()
                        .collect(Collectors.toMap(User::getId, Function.identity()));

        List<AdminTrainerHighlightVO> voList = result.getContent().stream()
                .map(h -> {
                    TrainerHighlightResponse detail = highlightService.adminGetDetail(h.getId());
                    AdminTrainerHighlightVO vo = AdminTrainerHighlightVO.from(h, detail.getFiles());
                    enrichHighlightVo(vo, h, trainerMap, institutionMap, userMap);
                    return vo;
                })
                .collect(Collectors.toList());

        return ApiResponse.ok(PageResponse.of(voList, result.getTotalElements(), page, size));
    }

    @Operation(summary = "精彩瞬间详情")
    @GetMapping("/admin/trainer-highlights/{id}")
    public ApiResponse<TrainerHighlightResponse> detail(@PathVariable Integer id) {
        return ApiResponse.ok(highlightService.adminGetDetail(id));
    }

    @Operation(summary = "运营代发精彩瞬间")
    @PostMapping("/admin/trainer-highlights")
    public ApiResponse<TrainerHighlightResponse> create(
            @RequestParam Integer trainerUserId,
            @Valid @RequestBody SaveTrainerHighlightRequest request) {
        return ApiResponse.ok(highlightService.createHighlight(trainerUserId, request));
    }

    @Operation(summary = "审核通过")
    @PutMapping("/admin/trainer-highlights/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable Integer id) {
        highlightService.approve(id, SecurityUtils.getCurrentUserId());
        return ApiResponse.ok();
    }

    @Operation(summary = "审核驳回")
    @PutMapping("/admin/trainer-highlights/{id}/reject")
    public ApiResponse<Void> reject(@PathVariable Integer id,
                                    @Valid @RequestBody RejectApplicationRequest request) {
        highlightService.reject(id, SecurityUtils.getCurrentUserId(), request.getReason());
        return ApiResponse.ok();
    }

    private void enrichHighlightVo(AdminTrainerHighlightVO vo,
                                   TrainerHighlight h,
                                   Map<Integer, Trainer> trainerMap,
                                   Map<Integer, Institution> institutionMap,
                                   Map<Integer, User> userMap) {
        vo.setInstitutionId(h.getInstitutionId());
        if (h.getInstitutionId() != null && h.getInstitutionId() > 0) {
            Institution inst = institutionMap.get(h.getInstitutionId());
            if (inst != null) {
                vo.setInstitutionName(inst.getOrgName());
                vo.setOwnerSubjectType("INSTITUTION");
                vo.setOwnerSubjectName(inst.getOrgName());
                if (inst.getUserId() != null) {
                    vo.setSubmitterUserId(inst.getUserId());
                    User u = userMap.get(inst.getUserId());
                    if (u != null) {
                        vo.setSubmitterUsername(u.getNickname());
                    }
                }
            }
        } else if (h.getTrainerId() != null && h.getTrainerId() > 0) {
            Trainer trainer = trainerMap.get(h.getTrainerId());
            if (trainer != null) {
                vo.setTrainerName(trainer.getName());
                vo.setOwnerSubjectType("TRAINER");
                vo.setOwnerSubjectName(trainer.getName());
                if (trainer.getUserId() != null) {
                    vo.setSubmitterUserId(trainer.getUserId());
                    User u = userMap.get(trainer.getUserId());
                    if (u != null) {
                        vo.setSubmitterUsername(u.getNickname());
                    }
                }
            }
        }
    }
}
