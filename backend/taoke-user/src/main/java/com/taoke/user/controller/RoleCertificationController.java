package com.taoke.user.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.api.RoleCertificationService;
import com.taoke.user.dto.role.cert.AgentWorkCertRequest;
import com.taoke.user.dto.role.cert.AgentWorkCertVO;
import com.taoke.user.dto.role.cert.BuyerWorkCertVO;
import com.taoke.user.dto.role.cert.EnterpriseAgentCertRequest;
import com.taoke.user.dto.role.cert.EnterpriseAgentCertVO;
import com.taoke.user.dto.role.cert.InstitutionCompanyInfoRequest;
import com.taoke.user.dto.role.cert.InstitutionCompanyInfoVO;
import com.taoke.user.dto.trainer.cert.RealNameCertRequest;
import com.taoke.user.dto.trainer.cert.RealNameCertResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 三角色身份信息认证（C 端）。
 * <ul>
 *   <li>AGENT：工作认证（多记录）</li>
 *   <li>ENTERPRISE_AGENT：资质认证（公司Logo + 营业执照）</li>
 *   <li>INSTITUTION：公司资料</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
@Tag(name = "三角色-身份信息认证", description = "经纪人工作认证 / 经纪公司资质 / 机构公司资料")
@RestController
@RequiredArgsConstructor
public class RoleCertificationController {

    private final RoleCertificationService certificationService;

    // ==================== 经纪人 — 工作认证 ====================

    @Operation(summary = "查询本人经纪人工作认证记录列表")
    @GetMapping("/agents/me/certification/work-experiences")
    @RequireRole(BusinessRole.Code.AGENT)
    public ApiResponse<List<AgentWorkCertVO>> listAgentWorks() {
        return ApiResponse.ok(certificationService.listAgentWorkCerts(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "新增经纪人工作认证记录")
    @PostMapping("/agents/me/certification/work-experiences")
    @RequireRole(BusinessRole.Code.AGENT)
    public ApiResponse<AgentWorkCertVO> createAgentWork(@Valid @RequestBody AgentWorkCertRequest request) {
        return ApiResponse.ok(certificationService.createAgentWorkCert(SecurityUtils.getRequiredUserId(), request));
    }

    @Operation(summary = "更新经纪人工作认证记录（重置为待审核）")
    @PutMapping("/agents/me/certification/work-experiences/{id}")
    @RequireRole(BusinessRole.Code.AGENT)
    public ApiResponse<AgentWorkCertVO> updateAgentWork(@PathVariable Integer id,
                                                        @Valid @RequestBody AgentWorkCertRequest request) {
        return ApiResponse.ok(certificationService.updateAgentWorkCert(SecurityUtils.getRequiredUserId(), id, request));
    }

    @Operation(summary = "删除经纪人工作认证记录")
    @DeleteMapping("/agents/me/certification/work-experiences/{id}")
    @RequireRole(BusinessRole.Code.AGENT)
    public ApiResponse<Void> deleteAgentWork(@PathVariable Integer id) {
        certificationService.deleteAgentWorkCert(SecurityUtils.getRequiredUserId(), id);
        return ApiResponse.ok(null);
    }

    // ==================== 经纪公司 — 资质认证 ====================

    @Operation(summary = "查询本经纪公司资质认证状态")
    @GetMapping("/enterprise-agents/me/certification")
    @RequireRole(BusinessRole.Code.ENTERPRISE_AGENT)
    public ApiResponse<EnterpriseAgentCertVO> getEnterpriseAgentCert() {
        return ApiResponse.ok(certificationService.getEnterpriseAgentCert(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "提交/重新提交经纪公司资质认证")
    @PutMapping("/enterprise-agents/me/certification")
    @RequireRole(BusinessRole.Code.ENTERPRISE_AGENT)
    public ApiResponse<Void> submitEnterpriseAgentCert(@Valid @RequestBody EnterpriseAgentCertRequest request) {
        certificationService.submitEnterpriseAgentCert(SecurityUtils.getRequiredUserId(), request);
        return ApiResponse.ok(null);
    }

    // ==================== 培训机构 — 公司资料 ====================

    @Operation(summary = "查询本机构公司资料状态")
    @GetMapping("/institutions/me/company-info")
    @RequireRole(BusinessRole.Code.INSTITUTION)
    public ApiResponse<InstitutionCompanyInfoVO> getInstitutionCompanyInfo() {
        return ApiResponse.ok(certificationService.getInstitutionCompanyInfo(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "提交/重新提交机构公司资料")
    @PutMapping("/institutions/me/company-info")
    @RequireRole(BusinessRole.Code.INSTITUTION)
    public ApiResponse<Void> submitInstitutionCompanyInfo(@Valid @RequestBody InstitutionCompanyInfoRequest request) {
        certificationService.submitInstitutionCompanyInfo(SecurityUtils.getRequiredUserId(), request);
        return ApiResponse.ok(null);
    }

    // ==================== 企业采购方 — 实名认证 ====================

    @Operation(summary = "查询本企业采购方实名认证状态")
    @GetMapping("/enterprise-buyers/me/certification/real-name")
    @RequireRole(BusinessRole.Code.ENTERPRISE_BUYER)
    public ApiResponse<RealNameCertResponse> getBuyerRealName() {
        return ApiResponse.ok(certificationService.getBuyerRealName(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "提交/重新提交企业采购方实名认证")
    @PutMapping("/enterprise-buyers/me/certification/real-name")
    @RequireRole(BusinessRole.Code.ENTERPRISE_BUYER)
    public ApiResponse<Void> submitBuyerRealName(@Valid @RequestBody RealNameCertRequest request) {
        certificationService.submitBuyerRealName(SecurityUtils.getRequiredUserId(), request);
        return ApiResponse.ok(null);
    }

    // ==================== 企业采购方 — 工作认证 ====================

    @Operation(summary = "查询本企业采购方工作认证记录列表")
    @GetMapping("/enterprise-buyers/me/certification/work-experiences")
    @RequireRole(BusinessRole.Code.ENTERPRISE_BUYER)
    public ApiResponse<List<BuyerWorkCertVO>> listBuyerWorks() {
        return ApiResponse.ok(certificationService.listBuyerWorkCerts(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "新增企业采购方工作认证记录")
    @PostMapping("/enterprise-buyers/me/certification/work-experiences")
    @RequireRole(BusinessRole.Code.ENTERPRISE_BUYER)
    public ApiResponse<BuyerWorkCertVO> createBuyerWork(@Valid @RequestBody AgentWorkCertRequest request) {
        return ApiResponse.ok(certificationService.createBuyerWorkCert(SecurityUtils.getRequiredUserId(), request));
    }

    @Operation(summary = "更新企业采购方工作认证记录（重置为待审核）")
    @PutMapping("/enterprise-buyers/me/certification/work-experiences/{id}")
    @RequireRole(BusinessRole.Code.ENTERPRISE_BUYER)
    public ApiResponse<BuyerWorkCertVO> updateBuyerWork(@PathVariable Integer id,
                                                        @Valid @RequestBody AgentWorkCertRequest request) {
        return ApiResponse.ok(certificationService.updateBuyerWorkCert(SecurityUtils.getRequiredUserId(), id, request));
    }

    @Operation(summary = "删除企业采购方工作认证记录")
    @DeleteMapping("/enterprise-buyers/me/certification/work-experiences/{id}")
    @RequireRole(BusinessRole.Code.ENTERPRISE_BUYER)
    public ApiResponse<Void> deleteBuyerWork(@PathVariable Integer id) {
        certificationService.deleteBuyerWorkCert(SecurityUtils.getRequiredUserId(), id);
        return ApiResponse.ok(null);
    }
}
