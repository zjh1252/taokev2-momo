package com.taoke.user.api;

import com.taoke.common.response.PageResponse;
import com.taoke.user.dto.institution.InstitutionListItemResponse;
import com.taoke.user.dto.institution.InstitutionPublicResponse;
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

    /**
     * 公开机构列表（分页 + 关键词筛选）。
     *
     * @param page    页码（从 1 开始）
     * @param size    每页条数
     * @param keyword 搜索关键词（匹配名称、擅长领域、擅长行业）
     * @param sort    排序方式：default / popularity
     * @return 分页结果
     */
    PageResponse<InstitutionListItemResponse> listPublic(int page, int size, String keyword, String sort);

    /**
     * 获取机构公开详情。
     *
     * @param id 机构 ID
     * @return 机构公开详情
     */
    InstitutionPublicResponse getPublicProfile(Integer id);
}
