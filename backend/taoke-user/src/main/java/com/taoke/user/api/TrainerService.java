package com.taoke.user.api;

import com.taoke.user.dto.trainer.*;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;

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
    List<TrainerCategoryDTO> saveCategories(Integer userId, List<TrainerCategoryDTO> dtos);
}
