package com.taoke.user.api;

import com.taoke.common.response.PageResponse;
import com.taoke.user.dto.institution.InstitutionListItemResponse;
import com.taoke.user.dto.institution.InstitutionPublicResponse;
import com.taoke.user.dto.institution.InstitutionRequest;
import com.taoke.user.dto.institution.InstitutionResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.Institution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
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
     * @param sort        排序方式：default / popularity / newly_joined
     * @param association           可选筛选：是否培训协会（null=不过滤）
     * @param expertiseCategoryId   擅长领域一级分类 ID（匹配 specialties 逗号串）
     * @param industryCategoryId    擅长行业一级分类 ID（匹配 industries 逗号串）
     * @param provinceId            省份 ID（可选）
     * @param cityId                城市 ID（可选，匹配机构所在城市）
     * @return 分页结果
     */
    PageResponse<InstitutionListItemResponse> listPublic(int page, int size, String keyword, String sort,
                                                       Boolean association, Integer expertiseCategoryId,
                                                       Integer industryCategoryId,
                                                       Integer provinceId, Integer cityId);

    /**
     * 获取机构公开详情。
     *
     * @param id 机构 ID
     * @return 机构公开详情
     */
    InstitutionPublicResponse getPublicProfile(Integer id);

    /**
     * 列表页点击人气 +1（仅公开展示机构）
     */
    void incrementViewCount(Integer institutionId);

    /**
     * 解析公开机构主体：支持老站 {@code /company/{roleid}.htm} 与迁移重复行 canonical 归并。
     *
     * @param pathId URL 中的数字段（user_institutions.id 或 legacy_role_id）
     * @return 公开展示的 canonical 机构实体
     */
    Institution resolvePublicByPathId(Integer pathId);

    /**
     * 公开机构按擅长领域一级分类批量计数（侧栏/底部分类导航）。
     *
     * @param association null=全部，true/false=是否培训协会
     * @return key=分类 ID，value=机构数
     */
    Map<Integer, Long> countPublicByExpertiseL1(Boolean association);

    /**
     * 机构频道侧栏推荐位
     *
     * @param type        high_score / weekly_active / newly_joined
     * @param association 是否培训协会筛选
     * @param limit       条数上限
     */
    List<InstitutionListItemResponse> listRecommended(String type, Boolean association, int limit);

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
     * 切换机构推荐位（仅修改 is_recommended，幂等）
     */
    void setRecommended(Integer institutionId, Integer value);

    /**
     * 根据 userId 列表批量查询机构档案
     */
    List<Institution> findByUserIds(List<Integer> userIds);

    /**
     * 按 userId 顺序返回公开展示的机构列表项（跳过不存在或未发布的机构）。
     */
    List<InstitutionListItemResponse> listByUserIds(List<Integer> userIds);

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
     * 覆盖写入机构评价统计（综合评分 + 已通过评价数）。
     * <p>由评价模块按已通过评价全量重算后调用；score 为空时按 0 处理。</p>
     *
     * @param institutionId 机构 ID
     * @param score         综合评分
     * @param commentCount  已通过评价数（不会小于 0）
     */
    void updateReviewStats(Integer institutionId, BigDecimal score, int commentCount);

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
