package com.taoke.user.api;

import com.taoke.user.dto.binding.BindingItemResponse;
import com.taoke.user.dto.binding.BindingType;
import com.taoke.user.dto.binding.InitiateBindingRequest;

import java.util.List;

/**
 * 角色绑定关系业务接口。
 * <p>覆盖 5 种绑定关系（{@link BindingType}）的发起 / 确认 / 拒绝 / 解绑 / 查询。
 *
 * @author Fangxinxin
 * @date 2026-04-21 14:50
 */
public interface BindingService {

    /**
     * 发起绑定。
     * <p>
     * - 经纪人/助理/机构/经纪公司 → 发起绑定专家：默认 PENDING，待专家确认<br>
     * - 机构 → 发起绑定员工：默认 PENDING，待员工确认
     */
    BindingItemResponse initiate(Integer operatorUserId, InitiateBindingRequest request);

    /**
     * 当前专家待确认的绑定请求（5 类合并）。
     */
    List<BindingItemResponse> listMyBindingRequests(Integer trainerUserId);

    /**
     * 当前用户（员工）待确认的机构绑定请求。
     */
    List<BindingItemResponse> listMyEmployeeRequests(Integer employeeUserId);

    /** 专家确认绑定 */
    void confirm(Integer operatorUserId, BindingType bindingType, Integer bindingId);

    /** 专家拒绝绑定 */
    void reject(Integer operatorUserId, BindingType bindingType, Integer bindingId, String reason);

    /** 任意一方解绑（必须双方之一） */
    void unbind(Integer operatorUserId, BindingType bindingType, Integer bindingId);

    /**
     * 「我的代理」 — 专家视角，列出所有 ACTIVE 的代理方（直接绑定的助理/经纪人/机构/经纪公司）。
     */
    List<BindingItemResponse> listMyAgents(Integer trainerUserId);

    /**
     * 「我代管的专家」 — 用于 TrainerSwitcher，返回所有当前用户能代管的专家信息。
     */
    List<BindingItemResponse> listManagedTrainers(Integer operatorUserId);

    /**
     * 培训机构视角：当前机构主体绑定的所有专家（含待确认/已生效/已拒绝/已解绑）。
     */
    List<BindingItemResponse> listInstitutionTrainers(Integer institutionUserId);

    /**
     * 培训机构视角：当前机构主体绑定的所有员工（含待确认/已生效/已拒绝/已解绑）。
     */
    List<BindingItemResponse> listInstitutionEmployees(Integer institutionUserId);

    /**
     * 经纪公司视角：当前经纪公司绑定的所有专家。
     */
    List<BindingItemResponse> listEnterpriseAgentTrainers(Integer enterpriseAgentUserId);

    /**
     * 经纪人视角：当前经纪人直接绑定的专家。
     */
    List<BindingItemResponse> listAgentTrainers(Integer agentUserId);

    /**
     * 助理视角：当前助理直接绑定的专家。
     */
    List<BindingItemResponse> listAssistantTrainers(Integer assistantUserId);
}
