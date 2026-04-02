package com.taoke.user.api;

import com.taoke.common.response.PageResponse;
import com.taoke.user.dto.trainer.*;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.Trainer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;

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
     * @param keyword              搜索关键词（可选，匹配 name / title / expertiseTags）
     * @param sort                 排序方式：default / score
     */
    PageResponse<TrainerListItemResponse> listPublic(int page, int size,
                                                     Integer expertiseCategoryId,
                                                     Integer industryCategoryId,
                                                     Integer provinceId,
                                                     String keyword,
                                                     String sort);

    /**
     * 按专家 ID 查询公开档案（不含报价敏感字段）
     */
    TrainerPublicResponse getPublicProfile(Integer trainerId);

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
     * 检查是否有专家关联了指定的擅长领域分类
     */
    boolean hasExpertiseCategoryReference(Integer categoryId);

    /**
     * 检查是否有专家关联了指定的擅长行业分类
     */
    boolean hasIndustryCategoryReference(Integer categoryId);
}
