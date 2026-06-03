package com.taoke.user.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.BindingService;
import com.taoke.user.dto.binding.BindingItemResponse;
import com.taoke.user.dto.binding.BindingType;
import com.taoke.user.dto.binding.InitiateBindingRequest;
import com.taoke.user.dto.binding.RejectBindingRequest;
import com.taoke.user.entity.User;
import com.taoke.user.entity.Trainer;
import com.taoke.user.repository.TrainerRepository;
import com.taoke.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 角色绑定关系 — 5 类绑定的发起 / 确认 / 拒绝 / 解绑 / 查询。
 *
 * @author Fangxinxin
 * @date 2026-04-21 15:30
 */
@Tag(name = "角色绑定")
@RestController
@RequiredArgsConstructor
public class BindingController {

    private final BindingService bindingService;
    private final UserRepository userRepository;
    private final TrainerRepository trainerRepository;

    // ============================================================
    // 发起 / 确认 / 拒绝 / 解绑
    // ============================================================

    @RequireRole({BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT,
            BusinessRole.Code.INSTITUTION, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "发起绑定（向专家或员工）")
    @PostMapping("/bindings")
    public ApiResponse<BindingItemResponse> initiate(@Valid @RequestBody InitiateBindingRequest request) {
        return ApiResponse.ok(bindingService.initiate(SecurityUtils.getCurrentUserId(), request));
    }

    @RequireRole(BusinessRole.Code.TRAINER)
    @Operation(summary = "专家：确认绑定请求")
    @PostMapping("/trainers/me/bindings/{type}/{id}/confirm")
    public ApiResponse<Void> confirm(@PathVariable BindingType type, @PathVariable Integer id) {
        bindingService.confirm(SecurityUtils.getCurrentUserId(), type, id);
        return ApiResponse.ok();
    }

    @RequireRole(BusinessRole.Code.TRAINER)
    @Operation(summary = "专家：拒绝绑定请求")
    @PostMapping("/trainers/me/bindings/{type}/{id}/reject")
    public ApiResponse<Void> reject(@PathVariable BindingType type, @PathVariable Integer id,
                                    @RequestBody(required = false) RejectBindingRequest body) {
        String reason = body != null ? body.getReason() : null;
        bindingService.reject(SecurityUtils.getCurrentUserId(), type, id, reason);
        return ApiResponse.ok();
    }

    @Operation(summary = "员工：确认机构绑定请求")
    @PostMapping("/employees/me/bindings/{id}/confirm")
    public ApiResponse<Void> confirmEmployee(@PathVariable Integer id) {
        bindingService.confirm(SecurityUtils.getCurrentUserId(), BindingType.INSTITUTION_EMPLOYEE, id);
        return ApiResponse.ok();
    }

    @Operation(summary = "员工：拒绝机构绑定请求")
    @PostMapping("/employees/me/bindings/{id}/reject")
    public ApiResponse<Void> rejectEmployee(@PathVariable Integer id,
                                            @RequestBody(required = false) RejectBindingRequest body) {
        String reason = body != null ? body.getReason() : null;
        bindingService.reject(SecurityUtils.getCurrentUserId(), BindingType.INSTITUTION_EMPLOYEE, id, reason);
        return ApiResponse.ok();
    }

    @Operation(summary = "经纪人：确认经纪公司绑定请求")
    @PostMapping("/agents/me/bindings/{id}/confirm")
    public ApiResponse<Void> confirmAgent(@PathVariable Integer id) {
        bindingService.confirm(SecurityUtils.getCurrentUserId(), BindingType.ENTERPRISE_AGENT_MEMBER, id);
        return ApiResponse.ok();
    }

    @Operation(summary = "经纪人：拒绝经纪公司绑定请求")
    @PostMapping("/agents/me/bindings/{id}/reject")
    public ApiResponse<Void> rejectAgent(@PathVariable Integer id,
                                         @RequestBody(required = false) RejectBindingRequest body) {
        String reason = body != null ? body.getReason() : null;
        bindingService.reject(SecurityUtils.getCurrentUserId(), BindingType.ENTERPRISE_AGENT_MEMBER, id, reason);
        return ApiResponse.ok();
    }

    // ------------------------------------------------------------
    // 机构 / 经纪公司侧的审核别名 — 与上面的方法等价（双向流程统一入口）
    // ------------------------------------------------------------

    @RequireRole(BusinessRole.Code.INSTITUTION)
    @Operation(summary = "机构：通过员工申请（员工主动申请的 PENDING 绑定）")
    @PostMapping("/institutions/me/employees/{id}/approve")
    public ApiResponse<Void> approveEmployeeByInstitution(@PathVariable Integer id) {
        bindingService.confirm(SecurityUtils.getCurrentUserId(), BindingType.INSTITUTION_EMPLOYEE, id);
        return ApiResponse.ok();
    }

    @RequireRole(BusinessRole.Code.INSTITUTION)
    @Operation(summary = "机构：拒绝员工申请")
    @PostMapping("/institutions/me/employees/{id}/reject")
    public ApiResponse<Void> rejectEmployeeByInstitution(@PathVariable Integer id,
                                                         @RequestBody(required = false) RejectBindingRequest body) {
        String reason = body != null ? body.getReason() : null;
        bindingService.reject(SecurityUtils.getCurrentUserId(), BindingType.INSTITUTION_EMPLOYEE, id, reason);
        return ApiResponse.ok();
    }

    @RequireRole(BusinessRole.Code.ENTERPRISE_AGENT)
    @Operation(summary = "经纪公司：通过经纪人申请（经纪人主动申请的 PENDING 绑定）")
    @PostMapping("/enterprise-agents/me/members/{id}/approve")
    public ApiResponse<Void> approveAgentByEnterprise(@PathVariable Integer id) {
        bindingService.confirm(SecurityUtils.getCurrentUserId(), BindingType.ENTERPRISE_AGENT_MEMBER, id);
        return ApiResponse.ok();
    }

    @RequireRole(BusinessRole.Code.ENTERPRISE_AGENT)
    @Operation(summary = "经纪公司：拒绝经纪人申请")
    @PostMapping("/enterprise-agents/me/members/{id}/reject")
    public ApiResponse<Void> rejectAgentByEnterprise(@PathVariable Integer id,
                                                     @RequestBody(required = false) RejectBindingRequest body) {
        String reason = body != null ? body.getReason() : null;
        bindingService.reject(SecurityUtils.getCurrentUserId(), BindingType.ENTERPRISE_AGENT_MEMBER, id, reason);
        return ApiResponse.ok();
    }

    @Operation(summary = "解绑（双方任一可解）")
    @PostMapping("/bindings/{type}/{id}/unbind")
    public ApiResponse<Void> unbind(@PathVariable BindingType type, @PathVariable Integer id) {
        bindingService.unbind(SecurityUtils.getCurrentUserId(), type, id);
        return ApiResponse.ok();
    }

    // ============================================================
    // 查询
    // ============================================================

    @RequireRole(BusinessRole.Code.TRAINER)
    @Operation(summary = "专家：待我确认的绑定请求列表")
    @GetMapping("/trainers/me/binding-requests")
    public ApiResponse<List<BindingItemResponse>> listMyBindingRequests() {
        return ApiResponse.ok(bindingService.listMyBindingRequests(SecurityUtils.getCurrentUserId()));
    }

    @RequireRole(BusinessRole.Code.INSTITUTION_EMPLOYEE)
    @Operation(summary = "员工：待我确认的机构绑定请求")
    @GetMapping("/employees/me/binding-requests")
    public ApiResponse<List<BindingItemResponse>> listMyEmployeeRequests() {
        return ApiResponse.ok(bindingService.listMyEmployeeRequests(SecurityUtils.getCurrentUserId()));
    }

    @RequireRole(BusinessRole.Code.TRAINER)
    @Operation(summary = "专家：我的代理（已生效的助理/经纪人/机构/经纪公司）")
    @GetMapping("/trainers/me/agents")
    public ApiResponse<List<BindingItemResponse>> listMyAgents() {
        return ApiResponse.ok(bindingService.listMyAgents(SecurityUtils.getCurrentUserId()));
    }

    @Operation(summary = "我代管的专家列表（用于资源管理页 TrainerSwitcher）")
    @GetMapping("/me/managed-trainers")
    public ApiResponse<List<BindingItemResponse>> listManagedTrainers() {
        return ApiResponse.ok(bindingService.listManagedTrainers(SecurityUtils.getCurrentUserId()));
    }

    @RequireRole(BusinessRole.Code.INSTITUTION)
    @Operation(summary = "机构：我的专家（含 ACTIVE/PENDING/REJECTED/UNBOUND）")
    @GetMapping("/institutions/me/trainers")
    public ApiResponse<List<BindingItemResponse>> listInstitutionTrainers() {
        return ApiResponse.ok(bindingService.listInstitutionTrainers(SecurityUtils.getCurrentUserId()));
    }

    @RequireRole(BusinessRole.Code.INSTITUTION)
    @Operation(summary = "机构：我的员工")
    @GetMapping("/institutions/me/employees")
    public ApiResponse<List<BindingItemResponse>> listInstitutionEmployees() {
        return ApiResponse.ok(bindingService.listInstitutionEmployees(SecurityUtils.getCurrentUserId()));
    }

    @RequireRole(BusinessRole.Code.ENTERPRISE_AGENT)
    @Operation(summary = "经纪公司：我的专家")
    @GetMapping("/enterprise-agents/me/trainers")
    public ApiResponse<List<BindingItemResponse>> listEnterpriseAgentTrainers() {
        return ApiResponse.ok(bindingService.listEnterpriseAgentTrainers(SecurityUtils.getCurrentUserId()));
    }

    @RequireRole(BusinessRole.Code.ENTERPRISE_AGENT)
    @Operation(summary = "经纪公司：我的经纪人（含 ACTIVE/PENDING/REJECTED/UNBOUND）")
    @GetMapping("/enterprise-agents/me/members")
    public ApiResponse<List<BindingItemResponse>> listEnterpriseAgentMembers() {
        return ApiResponse.ok(bindingService.listEnterpriseAgentMembers(SecurityUtils.getCurrentUserId()));
    }

    @RequireRole(BusinessRole.Code.AGENT)
    @Operation(summary = "经纪人：我的经纪公司（含 ACTIVE/PENDING/REJECTED/UNBOUND）")
    @GetMapping("/agents/me/enterprises")
    public ApiResponse<List<BindingItemResponse>> listMyEnterpriseAgents() {
        return ApiResponse.ok(bindingService.listMyEnterpriseAgents(SecurityUtils.getCurrentUserId()));
    }

    @RequireRole(BusinessRole.Code.INSTITUTION_EMPLOYEE)
    @Operation(summary = "员工：我的机构（含 ACTIVE/PENDING/REJECTED/UNBOUND）")
    @GetMapping("/employees/me/institutions")
    public ApiResponse<List<BindingItemResponse>> listMyInstitutions() {
        return ApiResponse.ok(bindingService.listMyInstitutions(SecurityUtils.getCurrentUserId()));
    }

    @RequireRole(BusinessRole.Code.AGENT)
    @Operation(summary = "经纪人：我的专家")
    @GetMapping("/agents/me/trainers")
    public ApiResponse<List<BindingItemResponse>> listAgentTrainers() {
        return ApiResponse.ok(bindingService.listAgentTrainers(SecurityUtils.getCurrentUserId()));
    }

    @RequireRole(BusinessRole.Code.ASSISTANT)
    @Operation(summary = "助理：我的专家")
    @GetMapping("/assistants/me/trainers")
    public ApiResponse<List<BindingItemResponse>> listAssistantTrainers() {
        return ApiResponse.ok(bindingService.listAssistantTrainers(SecurityUtils.getCurrentUserId()));
    }

    /**
     * 根据手机号查询平台用户的最简资料 — 仅供绑定发起方查找目标用户。
     *
     * @param phone 完整手机号
     * @return {id, nickname, avatarUrl, phone}
     */
    @RequireRole({BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT,
            BusinessRole.Code.INSTITUTION, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "按手机号查找平台用户（用于发起绑定时定位目标）")
    @GetMapping("/bindings/users/lookup")
    public ApiResponse<Map<String, Object>> lookupUserByPhone(@RequestParam String phone) {
        if (phone == null || phone.isBlank()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "手机号不能为空");
        }
        User u = userRepository.findByPhone(phone.trim())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "未找到对应用户"));
        // 真实姓名优先取专家档案 name（专家真实姓名），其次用户实名
        String realName = trainerRepository.findByUserId(u.getId())
                .map(Trainer::getName)
                .filter(s -> s != null && !s.isBlank())
                .orElse(u.getRealName());
        Map<String, Object> data = new HashMap<>();
        data.put("id", u.getId());
        data.put("realName", realName);
        data.put("nickname", u.getNickname() != null ? u.getNickname() : realName);
        data.put("avatarUrl", u.getAvatarUrl());
        data.put("phone", u.getPhone());
        return ApiResponse.ok(data);
    }
}
