package com.taoke.user.api;

import com.taoke.common.response.PageResponse;
import com.taoke.user.dto.trainer.*;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.Trainer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * 专家档案与入驻申请相关能力。
 *
 * @author Fangxinxin
 * @date 2026-04-01 12:00
 */
public interface TrainerService {

    /**
     * 按用户 ID 查询专家完整档案（含子表数据和报价信息）
     */
    TrainerResponse getByUserId(Integer userId);

    /**
     * 公开列表分页查询（支持按分类、关键词筛选）
     *
     * @param page                 页码（从 1 开始）
     * @param size                 每页条数
     * @param expertiseCategoryId  擅长领域分类 ID（可选）
     * @param industryCategoryId   擅长行业分类 ID（可选）
     * @param provinceId           省份 ID（可选）
     * @param cityId               城市 ID（可选，匹配专家常驻地）
     * @param keyword              搜索关键词（可选，匹配 name / title / expertiseTags）
     * @param sort                 排序方式：default / score / newly_joined
     * @param isTrusted            质量承诺过滤：1=仅显示信得过专家，其他/null 不限
     * @param includeCourse        是否回填课程数量与标题
     */
    PageResponse<TrainerListItemResponse> listPublic(int page, int size,
                                                     Integer expertiseCategoryId,
                                                     Integer industryCategoryId,
                                                     Integer provinceId,
                                                     Integer cityId,
                                                     String keyword,
                                                     String sort,
                                                     Integer isTrusted,
                                                     boolean includeCourse);

    /**
     * 已发布专家按擅长领域一级分类批量计数（含二级展开，与 listPublic 筛选口径一致）。
     *
     * @return key=一级分类 ID，value=专家数
     */
    java.util.Map<Integer, Long> countPublicByExpertiseL1();

    /**
     * 按专家 ID 查询公开档案（不含报价敏感字段）
     */
    TrainerPublicResponse getPublicProfile(Integer trainerId);

    /**
     * 列表页点击曝光 +1（仅已审核通过专家）
     */
    void incrementViewCount(Integer trainerId);

    /**
     * 解析专家主讲课程应使用的 {@code courses.trainer_id}。
     * <p>
     * 迁移后常见同名双行：种子档案 {@code status=2} 用于列表/URL，旧站课程挂在
     * {@code user_id=id} 的迁移行。访问种子 id 时返回迁移行 id，避免详情页课程数偏少。
     * </p>
     */
    Integer resolveCourseTrainerId(Integer trainerId);

    /**
     * 专家详情页推荐相关专家
     * <p>
     * 命中规则：与目标专家共享至少一个擅长领域分类或擅长行业分类；
     * 排除自己；仅取已审核通过（status=2）；按 isRecommended DESC、score DESC 排序，最多 3 条。
     * </p>
     *
     * @param trainerId 当前专家 ID
     */
    List<TrainerListItemResponse> listRecommendedTrainers(Integer trainerId);

    /**
     * 保存或更新当前用户的专家主表档案
     */
    TrainerResponse save(Integer userId, TrainerRequest request);

    /**
     * 提交专家入驻申请
     */
    void apply(Integer userId, TrainerRequest request);

    /**
     * 查询专家入驻申请状态
     */
    RoleApplicationStatusResponse getApplyStatus(Integer userId);

    // ==================== 子表整体替换式保存 ====================

    /**
     * 保存教育经历（先删后插，整体替换）
     */
    List<TrainerEducationDTO> saveEducations(Integer userId, List<TrainerEducationDTO> dtos);

    /**
     * 保存工作经历
     */
    List<TrainerWorkExperienceDTO> saveWorkExperiences(Integer userId, List<TrainerWorkExperienceDTO> dtos);

    /**
     * 保存荣誉资质
     */
    List<TrainerHonorDTO> saveHonors(Integer userId, List<TrainerHonorDTO> dtos);

    /**
     * 保存培训领域分类
     */
    List<CategoryRefDTO> saveExpertiseCategories(Integer userId, List<CategoryRefDTO> dtos);

    /**
     * 保存擅长行业分类
     */
    List<CategoryRefDTO> saveIndustryCategories(Integer userId, List<CategoryRefDTO> dtos);

    // ==================== 后台管理查询 ====================

    /**
     * 后台分页搜索专家（支持姓名/头衔/手机号模糊匹配 + 状态筛选）
     */
    Page<Trainer> searchForAdmin(String search, Integer status, Pageable pageable);

    /**
     * 根据 userId 列表批量查询专家档案
     */
    List<Trainer> findByUserIds(List<Integer> userIds);

    /**
     * 根据专家 ID 列表批量查询专家档案（用于课程等模块回填讲师名称）
     */
    List<Trainer> findByIds(Collection<Integer> ids);

    /**
     * 按姓名批量查询已上架专家（status=2），用于迁移课程主讲人名称回填。
     */
    List<Trainer> findPublishedByNames(Collection<String> names);

    /**
     * 检查是否有专家关联了指定的擅长领域分类
     */
    boolean hasExpertiseCategoryReference(Integer categoryId);

    /**
     * 检查是否有专家关联了指定的擅长行业分类
     */
    boolean hasIndustryCategoryReference(Integer categoryId);

    /**
     * 切换专家推荐位（仅修改 is_recommended，幂等）
     *
     * @param trainerId 专家主键
     * @param value     0=取消推荐，1=设为推荐
     */
    void setRecommended(Integer trainerId, Integer value);

    /**
     * C 端首页/列表页推荐专家位
     * <p>
     * 仅取 {@code status=2 AND is_recommended=1}，按 sortOrder/score/id 倒序；
     * 数量不足 {@code limit} 时返回实际条数，不补齐非推荐专家。
     * </p>
     */
    List<TrainerListItemResponse> listRecommendedForTop(int limit);

    /**
     * 查询符合 C 端筛选条件的已上架专家 ID 集合（status=2）。
     * <p>供课程列表按主讲专家维度过滤内训课等场景使用。</p>
     */
    List<Integer> findPublishedTrainerIds(Integer industryCategoryId,
                                          Integer provinceId,
                                          Integer cityId,
                                          Integer isTrusted,
                                          Integer hasCopyrightCourse);

    /**
     * 批量解析专家展示头像（用户头像 → 档案头像 → 默认头像素材池）。
     */
    Map<Integer, String> resolveDisplayAvatars(Collection<Integer> trainerIds);

    /**
     * 调整指定专家（user_trainers.user_id）的累计评论数。
     * <p>用于评价审核状态变化时同步计数。delta 可正可负；最终值不会小于 0。</p>
     *
     * @param trainerUserId 专家所属 user_id
     * @param delta         增量（+1 表示新增一条已通过、-1 表示撤销/驳回）
     */
    void adjustCommentCountByUserId(Integer trainerUserId, int delta);

    /**
     * 覆盖写入专家评价统计（综合评分 + 已通过评价数）。
     * <p>由评价模块按已通过评价全量重算后调用；score 为空时按 0 处理。</p>
     *
     * @param trainerUserId 专家所属 user_id
     * @param score         综合评分（通常为已通过评价 avg_score 的算术平均）
     * @param commentCount  已通过评价数（不会小于 0）
     */
    void updateReviewStatsByUserId(Integer trainerUserId, BigDecimal score, int commentCount);
}
