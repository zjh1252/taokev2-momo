package com.taoke.user.api;

import com.taoke.user.dto.assistant.AssistantRequest;
import com.taoke.user.dto.assistant.AssistantResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;

/**
 * 助理档案与入驻申请相关能力。
 *
 * @author Fangxinxin
 * @date 2026-04-01 12:00
 */
public interface AssistantService {

    /**
     * 按用户 ID 查询助理档案。
     *
     * @param userId 用户 ID
     * @return 助理信息
     */
    AssistantResponse getByUserId(Integer userId);

    /**
     * 保存或更新当前用户的助理档案。
     *
     * @param userId  用户 ID
     * @param request 档案内容
     * @return 保存后的助理信息
     */
    AssistantResponse save(Integer userId, AssistantRequest request);

    /**
     * 提交助理入驻申请。
     *
     * @param userId  用户 ID
     * @param request 申请附带资料
     */
    void apply(Integer userId, AssistantRequest request);

    /**
     * 查询助理入驻申请状态。
     *
     * @param userId 用户 ID
     * @return 申请状态
     */
    RoleApplicationStatusResponse getApplyStatus(Integer userId);
}
