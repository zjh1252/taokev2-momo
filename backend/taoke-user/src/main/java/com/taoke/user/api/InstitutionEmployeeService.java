package com.taoke.user.api;

import com.taoke.user.dto.institutionemployee.InstitutionEmployeeRequest;
import com.taoke.user.dto.institutionemployee.InstitutionEmployeeResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;

/**
 * 机构员工档案的查询、保存与角色申请能力（按用户维度）。
 *
 * @author Fangxinxin
 * @date 2026-04-01 12:00
 */
public interface InstitutionEmployeeService {

    /**
     * 根据用户 ID 查询机构员工档案。
     *
     * @param userId 用户 ID
     * @return 机构员工档案；不存在时由实现约定（可为 null 或抛业务异常）
     */
    InstitutionEmployeeResponse getByUserId(Integer userId);

    /**
     * 保存或更新指定用户的机构员工档案。
     *
     * @param userId  用户 ID
     * @param request 机构员工档案内容
     * @return 保存后的机构员工档案
     */
    InstitutionEmployeeResponse save(Integer userId, InstitutionEmployeeRequest request);

    /**
     * 提交机构员工角色申请。
     *
     * @param userId  用户 ID
     * @param request 申请内容
     */
    void apply(Integer userId, InstitutionEmployeeRequest request);

    /**
     * 查询当前用户机构员工角色的申请状态。
     *
     * @param userId 用户 ID
     * @return 申请状态
     */
    RoleApplicationStatusResponse getApplyStatus(Integer userId);
}
