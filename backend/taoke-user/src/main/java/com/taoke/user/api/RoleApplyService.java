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
     */
    void apply(Integer userId, String roleCode);

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
