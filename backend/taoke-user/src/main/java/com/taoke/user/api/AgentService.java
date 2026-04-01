package com.taoke.user.api;

import com.taoke.user.dto.agent.AgentRequest;
import com.taoke.user.dto.agent.AgentResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;

/**
 * 经纪人档案与入驻申请相关能力。
 *
 * @author Fangxinxin
 * @date 2026-04-01 12:00
 */
public interface AgentService {

    /**
     * 按用户 ID 查询经纪人档案。
     *
     * @param userId 用户 ID
     * @return 经纪人信息
     */
    AgentResponse getByUserId(Integer userId);

    /**
     * 保存或更新当前用户的经纪人档案。
     *
     * @param userId  用户 ID
     * @param request 档案内容
     * @return 保存后的经纪人信息
     */
    AgentResponse save(Integer userId, AgentRequest request);

    /**
     * 提交经纪人入驻申请。
     *
     * @param userId  用户 ID
     * @param request 申请附带资料
     */
    void apply(Integer userId, AgentRequest request);

    /**
     * 查询经纪人入驻申请状态。
     *
     * @param userId 用户 ID
     * @return 申请状态
     */
    RoleApplicationStatusResponse getApplyStatus(Integer userId);
}
