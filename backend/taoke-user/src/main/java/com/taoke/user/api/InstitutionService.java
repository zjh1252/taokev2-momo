package com.taoke.user.api;

import com.taoke.common.response.PageResponse;
import com.taoke.user.dto.institution.InstitutionFacetsResponse;
import com.taoke.user.dto.institution.InstitutionListItemResponse;
import com.taoke.user.dto.institution.InstitutionPublicResponse;
import com.taoke.user.dto.institution.InstitutionRequest;
import com.taoke.user.dto.institution.InstitutionResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.Institution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

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
     * @param page        页码（从 1 开始）
     * @param size        每页条数
     * @param keyword     搜索关键词（匹配名称、擅长领域、擅长行业）
     * @param sort        排序方式：default / popularity
     * @param association 可选筛选：是否培训协会（null=不过滤）
     * @return 分页结果
     */
    PageResponse<InstitutionListItemResponse> listPublic(int page, int size, String keyword, String sort,
                                                         Boolean association, String specialty, String industry,
                                                         Integer provinceId, Integer cityId,
                                                         java.math.BigDecimal minScore);

    /**
     * 机构列表页筛选项聚合（擅长领域 / 擅长行业 去重计数）。
     */
    InstitutionFacetsResponse listFacets();

    /** 高分机构（按评分倒序，公开可见）。 */
    List<InstitutionListItemResponse> listTopRated(int limit);

    /** 最新加入机构（按创建时间倒序）。 */
    List<InstitutionListItemResponse> listNewest(int limit);

    /** 金牌推荐机构（isRecommended=1）。 */
    List<InstitutionListItemResponse> listRecommended(int limit);

    /** 按机构 userId 批量返回机构卡片（保持入参顺序，仅公开可见）。 */
    List<InstitutionListItemResponse> listByUserIds(List<Integer> userIds);

    /**
     * 获取机构公开详情。
     *
     * @param id 机构 ID
     * @return 机构公开详情
     */
    InstitutionPublicResponse getPublicProfile(Integer id);

    // ==================== 后台管理查询 ====================

    /**
     * 后台分页搜索机构（支持机构名称/联系电话模糊匹配 + 状态筛选）
     */
    Page<Institution> searchForAdmin(String search, Integer status, Pageable pageable);

    /**
     * 设置/取消培训协会标识
     */
    void setAssociation(Integer institutionId, boolean association);

    /**
     * 根据 userId 列表批量查询机构档案
     */
    List<Institution> findByUserIds(List<Integer> userIds);

    /**
     * 根据机构 ID 列表批量查询机构
     */
    List<Institution> findByIds(java.util.Collection<Integer> ids);

    /**
     * 调整指定机构（user_institutions.id）的累计评论数。
     * <p>用于评价审核状态变化时同步计数。delta 可正可负；最终值不会小于 0。</p>
     *
     * @param institutionId 机构 ID
     * @param delta         增量
     */
    void adjustCommentCount(Integer institutionId, int delta);

    /**
     * 公开下拉/搜索 — 按机构名关键字模糊匹配，仅返回已发布的机构。
     * <p>给「机构员工申请」「绑定流程」等场景用，返回最少必要字段。
     *
     * @param keyword 机构名关键字（可空 → 返回最新的 N 条）
     * @param size    最多返回的条目数（默认 20，上限 50）
     * @return 简化后的机构列表（id / userId / orgName / association / address）
     */
    List<Map<String, Object>> lookup(String keyword, int size);
}
