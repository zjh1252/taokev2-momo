package com.taoke.user.api;

import com.taoke.user.dto.enterpriseagent.EnterpriseAgentRequest;
import com.taoke.user.dto.enterpriseagent.EnterpriseAgentResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;

/**
 * 企业代理档案的查询、保存与角色申请能力（按用户维度）。
 *
 * @author Fangxinxin
 * @date 2026-04-01 12:00
 */
public interface EnterpriseAgentService {

    /**
     * 根据用户 ID 查询企业代理档案。
     *
     * @param userId 用户 ID
     * @return 企业代理档案；不存在时由实现约定（可为 null 或抛业务异常）
     */
    EnterpriseAgentResponse getByUserId(Integer userId);

    /**
     * 保存或更新指定用户的企业代理档案。
     *
     * @param userId  用户 ID
     * @param request 企业代理档案内容
     * @return 保存后的企业代理档案
     */
    EnterpriseAgentResponse save(Integer userId, EnterpriseAgentRequest request);

    /**
     * 提交企业代理角色申请。
     *
     * @param userId  用户 ID
     * @param request 申请内容
     */
    void apply(Integer userId, EnterpriseAgentRequest request);

    /**
     * 查询当前用户企业代理角色的申请状态。
     *
     * @param userId 用户 ID
     * @return 申请状态
     */
    RoleApplicationStatusResponse getApplyStatus(Integer userId);
}
