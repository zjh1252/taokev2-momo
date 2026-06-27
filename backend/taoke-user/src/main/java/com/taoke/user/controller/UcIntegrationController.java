package com.taoke.user.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.api.UcIntegrationService;
import com.taoke.user.dto.uc.*;
import com.taoke.user.enums.UcOrgType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * UC 组织映射与成员 lookup — 机构 / 经纪公司 / 企业买家共用路径模式。
 *
 * @author Fangxinxin
 * @date 2026-06-26 14:00
 */
@Tag(name = "UC 组织成员对接")
@RestController
@RequiredArgsConstructor
public class UcIntegrationController {

    private final UcIntegrationService ucIntegrationService;

    // ==================== 机构 ====================

    @RequireRole(BusinessRole.Code.INSTITUTION)
    @Operation(summary = "机构：获取 UC 组织映射")
    @GetMapping("/institutions/me/uc-link")
    public ApiResponse<UcOrgLinkResponse> getInstitutionUcLink() {
        return ApiResponse.ok(ucIntegrationService.getOrgLink(SecurityUtils.getRequiredUserId(), UcOrgType.INSTITUTION));
    }

    @RequireRole(BusinessRole.Code.INSTITUTION)
    @Operation(summary = "机构：保存 UC 组织映射")
    @PutMapping("/institutions/me/uc-link")
    public ApiResponse<UcOrgLinkResponse> saveInstitutionUcLink(@Valid @RequestBody SaveUcOrgLinkRequest request) {
        return ApiResponse.ok(ucIntegrationService.saveOrgLink(SecurityUtils.getRequiredUserId(), UcOrgType.INSTITUTION, request));
    }

    @RequireRole(BusinessRole.Code.INSTITUTION)
    @Operation(summary = "机构：解除 UC 组织映射")
    @DeleteMapping("/institutions/me/uc-link")
    public ApiResponse<Void> deleteInstitutionUcLink() {
        ucIntegrationService.deleteOrgLink(SecurityUtils.getRequiredUserId(), UcOrgType.INSTITUTION);
        return ApiResponse.ok();
    }

    @RequireRole(BusinessRole.Code.INSTITUTION)
    @Operation(summary = "机构：为员工绑定 UC 成员")
    @PostMapping("/institutions/me/employees/{bindingId}/uc-member")
    public ApiResponse<UcMemberLinkItemResponse> bindInstitutionEmployeeUcMember(
            @PathVariable Integer bindingId,
            @Valid @RequestBody UcMemberLookupRequest request) {
        return ApiResponse.ok(ucIntegrationService.bindMemberToEmployeeBinding(
                SecurityUtils.getRequiredUserId(), UcOrgType.INSTITUTION, bindingId, request));
    }

    @RequireRole(BusinessRole.Code.INSTITUTION)
    @Operation(summary = "机构：解除员工 UC 成员绑定")
    @DeleteMapping("/institutions/me/employees/{bindingId}/uc-member")
    public ApiResponse<Void> unbindInstitutionEmployeeUcMember(@PathVariable Integer bindingId) {
        ucIntegrationService.unbindMemberFromEmployeeBinding(
                SecurityUtils.getRequiredUserId(), UcOrgType.INSTITUTION, bindingId);
        return ApiResponse.ok();
    }

    @RequireRole(BusinessRole.Code.INSTITUTION)
    @GetMapping("/institutions/me/uc-link/identity-field")
    public ApiResponse<UcIdentityFieldResponse> getInstitutionIdentityField() {
        return ApiResponse.ok(ucIntegrationService.getIdentityField(SecurityUtils.getRequiredUserId(), UcOrgType.INSTITUTION));
    }

    @RequireRole(BusinessRole.Code.INSTITUTION)
    @PostMapping("/institutions/me/uc-members/lookup")
    public ApiResponse<UcMemberLookupResponse> lookupInstitutionMember(@Valid @RequestBody UcMemberLookupRequest request) {
        return ApiResponse.ok(ucIntegrationService.lookupMember(SecurityUtils.getRequiredUserId(), UcOrgType.INSTITUTION, request));
    }

    @RequireRole(BusinessRole.Code.INSTITUTION)
    @PostMapping("/institutions/me/uc-members/{id}/sync-profile")
    public ApiResponse<JsonNode> syncInstitutionMemberProfile(@PathVariable Integer id) {
        return ApiResponse.ok(ucIntegrationService.syncMemberProfile(SecurityUtils.getRequiredUserId(), UcOrgType.INSTITUTION, id));
    }

    @RequireRole(BusinessRole.Code.INSTITUTION)
    @GetMapping("/institutions/me/uc-members")
    public ApiResponse<List<UcMemberLinkItemResponse>> listInstitutionUcMembers() {
        return ApiResponse.ok(ucIntegrationService.listMemberLinks(SecurityUtils.getRequiredUserId(), UcOrgType.INSTITUTION));
    }

    // ==================== 经纪公司 ====================

    @RequireRole(BusinessRole.Code.ENTERPRISE_AGENT)
    @GetMapping("/enterprise-agents/me/uc-link")
    public ApiResponse<UcOrgLinkResponse> getEnterpriseAgentUcLink() {
        return ApiResponse.ok(ucIntegrationService.getOrgLink(SecurityUtils.getRequiredUserId(), UcOrgType.ENTERPRISE_AGENT));
    }

    @RequireRole(BusinessRole.Code.ENTERPRISE_AGENT)
    @PutMapping("/enterprise-agents/me/uc-link")
    public ApiResponse<UcOrgLinkResponse> saveEnterpriseAgentUcLink(@Valid @RequestBody SaveUcOrgLinkRequest request) {
        return ApiResponse.ok(ucIntegrationService.saveOrgLink(SecurityUtils.getRequiredUserId(), UcOrgType.ENTERPRISE_AGENT, request));
    }

    @RequireRole(BusinessRole.Code.ENTERPRISE_AGENT)
    @DeleteMapping("/enterprise-agents/me/uc-link")
    public ApiResponse<Void> deleteEnterpriseAgentUcLink() {
        ucIntegrationService.deleteOrgLink(SecurityUtils.getRequiredUserId(), UcOrgType.ENTERPRISE_AGENT);
        return ApiResponse.ok();
    }

    @RequireRole(BusinessRole.Code.ENTERPRISE_AGENT)
    @PostMapping("/enterprise-agents/me/members/{bindingId}/uc-member")
    public ApiResponse<UcMemberLinkItemResponse> bindEnterpriseAgentMemberUcMember(
            @PathVariable Integer bindingId,
            @Valid @RequestBody UcMemberLookupRequest request) {
        return ApiResponse.ok(ucIntegrationService.bindMemberToEmployeeBinding(
                SecurityUtils.getRequiredUserId(), UcOrgType.ENTERPRISE_AGENT, bindingId, request));
    }

    @RequireRole(BusinessRole.Code.ENTERPRISE_AGENT)
    @DeleteMapping("/enterprise-agents/me/members/{bindingId}/uc-member")
    public ApiResponse<Void> unbindEnterpriseAgentMemberUcMember(@PathVariable Integer bindingId) {
        ucIntegrationService.unbindMemberFromEmployeeBinding(
                SecurityUtils.getRequiredUserId(), UcOrgType.ENTERPRISE_AGENT, bindingId);
        return ApiResponse.ok();
    }

    @RequireRole(BusinessRole.Code.ENTERPRISE_AGENT)
    @GetMapping("/enterprise-agents/me/uc-link/identity-field")
    public ApiResponse<UcIdentityFieldResponse> getEnterpriseAgentIdentityField() {
        return ApiResponse.ok(ucIntegrationService.getIdentityField(SecurityUtils.getRequiredUserId(), UcOrgType.ENTERPRISE_AGENT));
    }

    @RequireRole(BusinessRole.Code.ENTERPRISE_AGENT)
    @PostMapping("/enterprise-agents/me/uc-members/lookup")
    public ApiResponse<UcMemberLookupResponse> lookupEnterpriseAgentMember(@Valid @RequestBody UcMemberLookupRequest request) {
        return ApiResponse.ok(ucIntegrationService.lookupMember(SecurityUtils.getRequiredUserId(), UcOrgType.ENTERPRISE_AGENT, request));
    }

    @RequireRole(BusinessRole.Code.ENTERPRISE_AGENT)
    @PostMapping("/enterprise-agents/me/uc-members/{id}/sync-profile")
    public ApiResponse<JsonNode> syncEnterpriseAgentMemberProfile(@PathVariable Integer id) {
        return ApiResponse.ok(ucIntegrationService.syncMemberProfile(SecurityUtils.getRequiredUserId(), UcOrgType.ENTERPRISE_AGENT, id));
    }

    @RequireRole(BusinessRole.Code.ENTERPRISE_AGENT)
    @GetMapping("/enterprise-agents/me/uc-members")
    public ApiResponse<List<UcMemberLinkItemResponse>> listEnterpriseAgentUcMembers() {
        return ApiResponse.ok(ucIntegrationService.listMemberLinks(SecurityUtils.getRequiredUserId(), UcOrgType.ENTERPRISE_AGENT));
    }

    // ==================== 企业买家 ====================

    @RequireRole(BusinessRole.Code.ENTERPRISE_BUYER)
    @GetMapping("/enterprise-buyers/me/uc-link")
    public ApiResponse<UcOrgLinkResponse> getEnterpriseBuyerUcLink() {
        return ApiResponse.ok(ucIntegrationService.getOrgLink(SecurityUtils.getRequiredUserId(), UcOrgType.ENTERPRISE_BUYER));
    }

    @RequireRole(BusinessRole.Code.ENTERPRISE_BUYER)
    @PutMapping("/enterprise-buyers/me/uc-link")
    public ApiResponse<UcOrgLinkResponse> saveEnterpriseBuyerUcLink(@Valid @RequestBody SaveUcOrgLinkRequest request) {
        return ApiResponse.ok(ucIntegrationService.saveOrgLink(SecurityUtils.getRequiredUserId(), UcOrgType.ENTERPRISE_BUYER, request));
    }

    @RequireRole(BusinessRole.Code.ENTERPRISE_BUYER)
    @DeleteMapping("/enterprise-buyers/me/uc-link")
    public ApiResponse<Void> deleteEnterpriseBuyerUcLink() {
        ucIntegrationService.deleteOrgLink(SecurityUtils.getRequiredUserId(), UcOrgType.ENTERPRISE_BUYER);
        return ApiResponse.ok();
    }

    @RequireRole(BusinessRole.Code.ENTERPRISE_BUYER)
    @GetMapping("/enterprise-buyers/me/uc-link/identity-field")
    public ApiResponse<UcIdentityFieldResponse> getEnterpriseBuyerIdentityField() {
        return ApiResponse.ok(ucIntegrationService.getIdentityField(SecurityUtils.getRequiredUserId(), UcOrgType.ENTERPRISE_BUYER));
    }

    @RequireRole(BusinessRole.Code.ENTERPRISE_BUYER)
    @PostMapping("/enterprise-buyers/me/uc-members/lookup")
    public ApiResponse<UcMemberLookupResponse> lookupEnterpriseBuyerMember(@Valid @RequestBody UcMemberLookupRequest request) {
        return ApiResponse.ok(ucIntegrationService.lookupMember(SecurityUtils.getRequiredUserId(), UcOrgType.ENTERPRISE_BUYER, request));
    }

    @RequireRole(BusinessRole.Code.ENTERPRISE_BUYER)
    @PostMapping("/enterprise-buyers/me/uc-members/{id}/sync-profile")
    public ApiResponse<JsonNode> syncEnterpriseBuyerMemberProfile(@PathVariable Integer id) {
        return ApiResponse.ok(ucIntegrationService.syncMemberProfile(SecurityUtils.getRequiredUserId(), UcOrgType.ENTERPRISE_BUYER, id));
    }

    @RequireRole(BusinessRole.Code.ENTERPRISE_BUYER)
    @GetMapping("/enterprise-buyers/me/uc-members")
    public ApiResponse<List<UcMemberLinkItemResponse>> listEnterpriseBuyerUcMembers() {
        return ApiResponse.ok(ucIntegrationService.listMemberLinks(SecurityUtils.getRequiredUserId(), UcOrgType.ENTERPRISE_BUYER));
    }

    @RequireRole(BusinessRole.Code.ENTERPRISE_BUYER)
    @PostMapping("/enterprise-buyers/me/uc-members/{id}/attach")
    public ApiResponse<UcMemberLinkItemResponse> attachEnterpriseBuyerMember(
            @PathVariable Integer id,
            @RequestBody Map<String, Integer> body) {
        Integer targetUserId = body.get("targetUserId");
        return ApiResponse.ok(ucIntegrationService.attachEnterpriseBuyerMember(
                SecurityUtils.getRequiredUserId(), targetUserId, id));
    }
}
