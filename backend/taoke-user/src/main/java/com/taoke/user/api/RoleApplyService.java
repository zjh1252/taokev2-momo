package com.taoke.user.api;

import com.taoke.user.dto.user.RoleApplicationStatusResponse;

/**
 * 通用业务角色申请能力（申请、审批、查询申请状态）。
 *
 * @author Fangxinxin
 * @date 2026-04-01 12:00
 */
public interface RoleApplyService {

    /**
     * 用户发起某业务角色的入驻申请。
     *
     * @param userId   用户 ID
     * @param roleCode 角色编码
     * @return true 表示触发了「资料重审」（status=1 + reapplying=true），调用方应在此时记录变更日志
     */
    boolean apply(Integer userId, String roleCode);

    /**
     * 用户发起某业务角色的入驻申请并自动通过（无需后台审核）。
     * <p>
     * 适用于无需资质认证的角色，如 ENTERPRISE_BUYER（企业培训采购方）、ASSISTANT（专家助理）。
     * 申请后角色直接变为 status=1（生效），并发布 {@link com.taoke.common.events.user.ApplyPassedEvent}
     * 以触发后续通知等领域副作用。
     *
     * @param userId   用户 ID
     * @param roleCode 角色编码
     */
    void applyAndAutoApprove(Integer userId, String roleCode);

    /**
     * 幂等地确保用户拥有某业务角色且为生效状态（无需后台审核）。
     * <p>
     * 与 {@link #applyAndAutoApprove} 的区别：当角色已生效（status=1）时直接返回、不抛异常，
     * 便于「申请即通过」且允许重复申请的角色（如 AGENT、INSTITUTION_EMPLOYEE）。
     * 角色被禁用（status=4）时仍抛 {@link com.taoke.common.exception.ErrorCode#ROLE_DISABLED}。
     *
     * @param userId   用户 ID
     * @param roleCode 角色编码
     */
    void ensureRoleActive(Integer userId, String roleCode);

    /**
     * 审批通过用户的角色申请。
     *
     * @param userId   用户 ID
     * @param roleCode 角色编码
     */
    void approve(Integer userId, String roleCode);

    /**
     * 审批驳回用户的角色申请。
     *
     * @param userId   用户 ID
     * @param roleCode 角色编码
     * @param reason   驳回原因
     */
    void reject(Integer userId, String roleCode, String reason);

    /**
     * 查询用户对某角色的申请/生效状态。
     *
     * @param userId   用户 ID
     * @param roleCode 角色编码
     * @return 状态描述等
     */
    RoleApplicationStatusResponse getStatus(Integer userId, String roleCode);
}
