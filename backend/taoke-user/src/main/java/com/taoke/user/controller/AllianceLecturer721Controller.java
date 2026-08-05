package com.taoke.user.controller;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.api.AllianceLecturer721ApplicationService;
import com.taoke.user.dto.alliance.AllianceLecturer721ApplicationResponse;
import com.taoke.user.dto.alliance.AllianceLecturer721ApplyRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * 淘课联盟 721 讲师合作自服务接口。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:00
 */
@Tag(name = "淘课联盟-721讲师合作")
@RestController
@RequiredArgsConstructor
public class AllianceLecturer721Controller {

    private final AllianceLecturer721ApplicationService allianceLecturer721ApplicationService;

    @Operation(summary = "获取当前用户最新721讲师合作申请")
    @GetMapping("/alliance/lecturers721/me/application")
    public ApiResponse<AllianceLecturer721ApplicationResponse> myApplication() {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(allianceLecturer721ApplicationService.getLatestByUserId(userId));
    }

    @Operation(summary = "提交721讲师合作申请")
    @PostMapping("/alliance/lecturers721/me/application")
    public ApiResponse<AllianceLecturer721ApplicationResponse> submit(
            @Valid @RequestBody AllianceLecturer721ApplyRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(allianceLecturer721ApplicationService.submit(userId, request));
    }
}
