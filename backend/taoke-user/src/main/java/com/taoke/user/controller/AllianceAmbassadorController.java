package com.taoke.user.controller;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.api.AllianceAmbassadorApplicationService;
import com.taoke.user.dto.alliance.AllianceAmbassadorApplicationResponse;
import com.taoke.user.dto.alliance.AllianceAmbassadorApplyRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * 淘课联盟推广大使自服务接口。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:00
 */
@Tag(name = "淘课联盟-推广大使")
@RestController
@RequiredArgsConstructor
public class AllianceAmbassadorController {

    private final AllianceAmbassadorApplicationService allianceAmbassadorApplicationService;

    @Operation(summary = "获取当前用户最新推广大使申请")
    @GetMapping("/alliance/ambassadors/me/application")
    public ApiResponse<AllianceAmbassadorApplicationResponse> myApplication() {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(allianceAmbassadorApplicationService.getLatestByUserId(userId));
    }

    @Operation(summary = "提交推广大使申请")
    @PostMapping("/alliance/ambassadors/me/application")
    public ApiResponse<AllianceAmbassadorApplicationResponse> submit(
            @Valid @RequestBody AllianceAmbassadorApplyRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(allianceAmbassadorApplicationService.submit(userId, request));
    }
}
