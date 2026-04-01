package com.taoke.user.mapper;

import com.taoke.user.dto.trainer.*;
import com.taoke.user.entity.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * 专家档案对象映射 — 主表 + 子表的 Entity/DTO 转换
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Mapper(componentModel = "spring")
public interface TrainerMapper {

    // ==================== 主表 ====================

    /** 完整返回（含报价敏感字段），子表由 Service 层组装 */
    @Mapping(target = "educations", ignore = true)
    @Mapping(target = "workExperiences", ignore = true)
    @Mapping(target = "honors", ignore = true)
    @Mapping(target = "expertiseCategories", ignore = true)
    @Mapping(target = "industryCategories", ignore = true)
    TrainerResponse toResponse(Trainer trainer);

    /** 公开返回（不含报价），子表由 Service 层组装 */
    @Mapping(target = "educations", ignore = true)
    @Mapping(target = "workExperiences", ignore = true)
    @Mapping(target = "honors", ignore = true)
    @Mapping(target = "expertiseCategories", ignore = true)
    @Mapping(target = "industryCategories", ignore = true)
    TrainerPublicResponse toPublicResponse(Trainer trainer);

    // ==================== 教育经历 ====================

    TrainerEducationDTO toEducationDTO(TrainerEducation entity);

    List<TrainerEducationDTO> toEducationDTOList(List<TrainerEducation> entities);

    @Mapping(target = "trainerId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    TrainerEducation toEducationEntity(TrainerEducationDTO dto);

    // ==================== 工作经历 ====================

    TrainerWorkExperienceDTO toWorkExperienceDTO(TrainerWorkExperience entity);

    List<TrainerWorkExperienceDTO> toWorkExperienceDTOList(List<TrainerWorkExperience> entities);

    @Mapping(target = "trainerId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    TrainerWorkExperience toWorkExperienceEntity(TrainerWorkExperienceDTO dto);

    // ==================== 荣誉资质 ====================

    TrainerHonorDTO toHonorDTO(TrainerHonor entity);

    List<TrainerHonorDTO> toHonorDTOList(List<TrainerHonor> entities);

    @Mapping(target = "trainerId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    TrainerHonor toHonorEntity(TrainerHonorDTO dto);

    // ==================== 培训领域关联 ====================

    @Mapping(target = "categoryName", ignore = true)
    CategoryRefDTO toExpertiseCategoryDTO(TrainerExpertiseCategory entity);

    List<CategoryRefDTO> toExpertiseCategoryDTOList(List<TrainerExpertiseCategory> entities);

    @Mapping(target = "trainerId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    TrainerExpertiseCategory toExpertiseCategoryEntity(CategoryRefDTO dto);

    // ==================== 擅长行业关联 ====================

    @Mapping(target = "categoryName", ignore = true)
    CategoryRefDTO toIndustryCategoryDTO(TrainerIndustryCategory entity);

    List<CategoryRefDTO> toIndustryCategoryDTOList(List<TrainerIndustryCategory> entities);

    @Mapping(target = "trainerId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    TrainerIndustryCategory toIndustryCategoryEntity(CategoryRefDTO dto);
}
