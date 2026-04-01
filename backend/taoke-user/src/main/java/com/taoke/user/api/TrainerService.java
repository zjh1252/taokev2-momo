package com.taoke.user.api;

import com.taoke.user.dto.trainer.TrainerRequest;
import com.taoke.user.dto.trainer.TrainerResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;

/**
 * 培训师档案与入驻申请相关能力。
 *
 * @author Fangxinxin
 * @date 2026-04-01 12:00
 */
public interface TrainerService {

    /**
     * 按用户 ID 查询培训师档案。
     *
     * @param userId 用户 ID
     * @return 培训师信息
     */
    TrainerResponse getByUserId(Integer userId);

    /**
     * 保存或更新当前用户的培训师档案。
     *
     * @param userId  用户 ID
     * @param request 档案内容
     * @return 保存后的培训师信息
     */
    TrainerResponse save(Integer userId, TrainerRequest request);

    /**
     * 提交培训师入驻申请。
     *
     * @param userId  用户 ID
     * @param request 申请附带资料
     */
    void apply(Integer userId, TrainerRequest request);

    /**
     * 查询培训师入驻申请状态。
     *
     * @param userId 用户 ID
     * @return 申请状态
     */
    RoleApplicationStatusResponse getApplyStatus(Integer userId);
}
