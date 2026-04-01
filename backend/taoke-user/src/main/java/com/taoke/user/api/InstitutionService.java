package com.taoke.user.api;

import com.taoke.user.dto.institution.InstitutionRequest;
import com.taoke.user.dto.institution.InstitutionResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;

/**
 * 机构主体档案的查询、保存与角色申请能力（按用户维度）。
 *
 * @author Fangxinxin
 * @date 2026-04-01 12:00
 */
public interface InstitutionService {

    /**
     * 根据用户 ID 查询机构档案。
     *
     * @param userId 用户 ID
     * @return 机构档案；不存在时由实现约定（可为 null 或抛业务异常）
     */
    InstitutionResponse getByUserId(Integer userId);

    /**
     * 保存或更新指定用户的机构档案。
     *
     * @param userId  用户 ID
     * @param request 机构档案内容
     * @return 保存后的机构档案
     */
    InstitutionResponse save(Integer userId, InstitutionRequest request);

    /**
     * 提交机构角色申请。
     *
     * @param userId  用户 ID
     * @param request 申请内容
     */
    void apply(Integer userId, InstitutionRequest request);

    /**
     * 查询当前用户机构角色的申请状态。
     *
     * @param userId 用户 ID
     * @return 申请状态
     */
    RoleApplicationStatusResponse getApplyStatus(Integer userId);
}
