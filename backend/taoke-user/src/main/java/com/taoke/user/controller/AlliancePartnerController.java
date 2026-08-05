package com.taoke.user.controller;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.api.AlliancePartnerApplicationService;
import com.taoke.user.dto.alliance.AlliancePartnerApplicationResponse;
import com.taoke.user.dto.alliance.AlliancePartnerApplyRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * 淘课联盟培训合伙人自服务接口。
 *
 * @author Fangxinxin
 * @date 2026-07-13 18:25
 */
@Tag(name = "淘课联盟-培训合伙人")
@RestController
@RequiredArgsConstructor
public class AlliancePartnerController {

    private final AlliancePartnerApplicationService alliancePartnerApplicationService;

    @Operation(summary = "获取当前用户最新培训合伙人申请")
    @GetMapping("/alliance/partners/me/application")
    public ApiResponse<AlliancePartnerApplicationResponse> myApplication() {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(alliancePartnerApplicationService.getLatestByUserId(userId));
    }

    @Operation(summary = "提交培训合伙人申请")
    @PostMapping("/alliance/partners/me/application")
    public ApiResponse<AlliancePartnerApplicationResponse> submit(
            @Valid @RequestBody AlliancePartnerApplyRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(alliancePartnerApplicationService.submit(userId, request));
    }
}
