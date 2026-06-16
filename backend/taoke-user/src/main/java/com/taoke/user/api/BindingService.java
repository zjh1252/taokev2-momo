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

    /**
     * 员工主动申请加入机构（员工侧入口）。
     * <p>不走平台审核，直接创建 PENDING 的 INSTITUTION_EMPLOYEE 绑定，并通知机构在用户中心审核。
     *
     * @param employeeUserId 员工用户 ID
     * @param orgId          目标机构 ID
     * @param note           备注（可空）
     */
    BindingItemResponse initiateInstitutionEmployeeFromEmployee(Integer employeeUserId, Integer orgId, String note);

    /**
     * 经纪人主动申请加入经纪公司（经纪人侧入口）。
     * <p>不走平台审核，直接创建 PENDING 的 ENTERPRISE_AGENT_MEMBER 绑定，并通知经纪公司在用户中心审核。
     *
     * @param agentUserId      经纪人用户 ID
     * @param enterpriseAgentId 目标经纪公司 ID
     * @param note             备注（可空）
     */
    BindingItemResponse initiateEnterpriseAgentMemberFromAgent(Integer agentUserId, Integer enterpriseAgentId, String note);

    /**
     * 机构视角：经纪公司视角的待审核 / 已生效成员关系（经纪公司 ↔ 经纪人）。
     */
    List<BindingItemResponse> listEnterpriseAgentMembers(Integer enterpriseAgentUserId);

    /**
     * 经纪人视角：当前经纪人所在的经纪公司绑定（含 PENDING / ACTIVE / REJECTED / UNBOUND）。
     */
    List<BindingItemResponse> listMyEnterpriseAgents(Integer agentUserId);

    /**
     * 员工视角：当前员工绑定的所有机构（含 PENDING / ACTIVE / REJECTED / UNBOUND）。
     */
    List<BindingItemResponse> listMyInstitutions(Integer employeeUserId);

    /**
     * 机构员工视角：所属机构绑定的所有专家（含待确认/已生效/已拒绝/已解绑）。
     * <p>员工通过 ACTIVE 员工绑定解析所属机构，与机构主体看到同一份列表。</p>
     */
    List<BindingItemResponse> listInstitutionTrainersForEmployee(Integer employeeUserId);
}
