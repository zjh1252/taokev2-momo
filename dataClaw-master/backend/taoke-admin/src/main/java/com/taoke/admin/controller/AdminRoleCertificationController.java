package com.taoke.admin.controller;

import com.taoke.admin.dto.RejectApplicationRequest;
import com.taoke.admin.dto.rolecert.AdminAgentWorkCertVO;
import com.taoke.admin.dto.rolecert.AdminEnterpriseAgentCertVO;
import com.taoke.admin.dto.rolecert.AdminInstitutionCompanyInfoVO;
import com.taoke.admin.dto.rolecert.AdminRoleCertQuery;
import com.taoke.admin.service.AdminRoleCertificationService;
import com.taoke.common.dto.PageResult;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * 后台 — 三角色身份信息认证审核（经纪人工作认证 / 经纪公司资质 / 机构公司资料）。
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
@Tag(name = "后台-三角色身份信息认证审核")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminRoleCertificationController {

    private final AdminRoleCertificationService service;

    // ==================== 经纪人 — 工作认证 ====================

    @Operation(summary = "分页查询经纪人工作认证审核列表")
    @GetMapping("/admin/agents/certifications/work-experiences")
    public ApiResponse<PageResult<AdminAgentWorkCertVO>> listAgentWork(AdminRoleCertQuery query) {
        return ApiResponse.ok(service.listAgentWorkExperiences(query));
    }

    @Operation(summary = "通过经纪人工作认证")
    @PutMapping("/admin/agents/certifications/work-experiences/{id}/approve")
    public ApiResponse<Void> approveAgentWork(@PathVariable Integer id) {
        service.auditAgentWorkExperience(id, true, null);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "驳回经纪人工作认证")
    @PutMapping("/admin/agents/certifications/work-experiences/{id}/reject")
    public ApiResponse<Void> rejectAgentWork(@PathVariable Integer id,
                                             @Valid @RequestBody RejectApplicationRequest req) {
        service.auditAgentWorkExperience(id, false, req.getReason());
        return ApiResponse.ok(null);
    }

    // ==================== 经纪公司 — 资质认证 ====================

    @Operation(summary = "分页查询经纪公司资质认证审核列表")
    @GetMapping("/admin/enterprise-agents/certifications/qualification")
    public ApiResponse<PageResult<AdminEnterpriseAgentCertVO>> listEnterpriseAgent(AdminRoleCertQuery query) {
        return ApiResponse.ok(service.listEnterpriseAgentCerts(query));
    }

    @Operation(summary = "通过经纪公司资质认证")
    @PutMapping("/admin/enterprise-agents/certifications/qualification/{id}/approve")
    public ApiResponse<Void> approveEnterpriseAgent(@PathVariable Integer id) {
        service.auditEnterpriseAgentCert(id, true, null);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "驳回经纪公司资质认证")
    @PutMapping("/admin/enterprise-agents/certifications/qualification/{id}/reject")
    public ApiResponse<Void> rejectEnterpriseAgent(@PathVariable Integer id,
                                                   @Valid @RequestBody RejectApplicationRequest req) {
        service.auditEnterpriseAgentCert(id, false, req.getReason());
        return ApiResponse.ok(null);
    }

    // ==================== 培训机构 — 公司资料 ====================

    @Operation(summary = "分页查询机构公司资料审核列表")
    @GetMapping("/admin/institutions/company-info")
    public ApiResponse<PageResult<AdminInstitutionCompanyInfoVO>> listInstitution(AdminRoleCertQuery query) {
        return ApiResponse.ok(service.listInstitutionCompanyInfo(query));
    }

    @Operation(summary = "通过机构公司资料")
    @PutMapping("/admin/institutions/company-info/{id}/approve")
    public ApiResponse<Void> approveInstitution(@PathVariable Integer id) {
        service.auditInstitutionCompanyInfo(id, true, null);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "驳回机构公司资料")
    @PutMapping("/admin/institutions/company-info/{id}/reject")
    public ApiResponse<Void> rejectInstitution(@PathVariable Integer id,
                                               @Valid @RequestBody RejectApplicationRequest req) {
        service.auditInstitutionCompanyInfo(id, false, req.getReason());
        return ApiResponse.ok(null);
    }
}
