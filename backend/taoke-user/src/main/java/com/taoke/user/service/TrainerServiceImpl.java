package com.taoke.user.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.service.CategoryService;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.dto.trainer.*;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.*;
import com.taoke.user.mapper.TrainerMapper;
import com.taoke.user.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * 专家档案服务 — 主表 CRUD + 子表整体替换式保存。
 * <p>
 * 查询详情时采用显式分步加载（主表 → 各子表各一条 SQL），避免 N+1。
 * 分类关联输出时通过 CategoryService 批量回填 categoryName。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Service
@RequiredArgsConstructor
public class TrainerServiceImpl implements TrainerService {

    private final TrainerRepository trainerRepository;
    private final TrainerEducationRepository educationRepository;
    private final TrainerWorkExperienceRepository workExperienceRepository;
    private final TrainerHonorRepository honorRepository;
    private final TrainerExpertiseCategoryRepository expertiseCategoryRepository;
    private final TrainerIndustryCategoryRepository industryCategoryRepository;
    private final TrainerMapper trainerMapper;
    private final RoleApplyService roleApplyService;
    private final CategoryService categoryService;

    @Override
    public TrainerResponse getByUserId(Integer userId) {
        Trainer trainer = trainerRepository.findByUserId(userId).orElse(null);
        if (trainer == null) {
            return null;
        }
        return assembleFullResponse(trainer);
    }

    @Override
    public TrainerPublicResponse getPublicProfile(Integer trainerId) {
        Trainer trainer = trainerRepository.findById(trainerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "专家不存在"));

        if (trainer.getStatus() != 2) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "专家不存在");
        }

        TrainerPublicResponse response = trainerMapper.toPublicResponse(trainer);
        fillSubTableData(response, trainerId);
        return response;
    }

    @Transactional
    @Override
    public TrainerResponse save(Integer userId, TrainerRequest request) {
        return assembleFullResponse(saveOrUpdateMainTable(userId, request));
    }

    @Transactional
    @Override
    public void apply(Integer userId, TrainerRequest request) {
        roleApplyService.apply(userId, BusinessRole.Code.TRAINER);
        saveOrUpdateMainTable(userId, request);
    }

    @Override
    public RoleApplicationStatusResponse getApplyStatus(Integer userId) {
        return roleApplyService.getStatus(userId, BusinessRole.Code.TRAINER);
    }

    // ==================== 子表整体替换式保存 ====================

    @Transactional
    @Override
    public List<TrainerEducationDTO> saveEducations(Integer userId, List<TrainerEducationDTO> dtos) {
        Integer trainerId = getRequiredTrainerId(userId);
        educationRepository.deleteByTrainerId(trainerId);
        List<TrainerEducation> entities = dtos.stream().map(dto -> {
            TrainerEducation entity = trainerMapper.toEducationEntity(dto);
            entity.setTrainerId(trainerId);
            return entity;
        }).toList();
        return trainerMapper.toEducationDTOList(educationRepository.saveAll(entities));
    }

    @Transactional
    @Override
    public List<TrainerWorkExperienceDTO> saveWorkExperiences(Integer userId, List<TrainerWorkExperienceDTO> dtos) {
        Integer trainerId = getRequiredTrainerId(userId);
        workExperienceRepository.deleteByTrainerId(trainerId);
        List<TrainerWorkExperience> entities = dtos.stream().map(dto -> {
            TrainerWorkExperience entity = trainerMapper.toWorkExperienceEntity(dto);
            entity.setTrainerId(trainerId);
            return entity;
        }).toList();
        return trainerMapper.toWorkExperienceDTOList(workExperienceRepository.saveAll(entities));
    }

    @Transactional
    @Override
    public List<TrainerHonorDTO> saveHonors(Integer userId, List<TrainerHonorDTO> dtos) {
        Integer trainerId = getRequiredTrainerId(userId);
        honorRepository.deleteByTrainerId(trainerId);
        List<TrainerHonor> entities = dtos.stream().map(dto -> {
            TrainerHonor entity = trainerMapper.toHonorEntity(dto);
            entity.setTrainerId(trainerId);
            return entity;
        }).toList();
        return trainerMapper.toHonorDTOList(honorRepository.saveAll(entities));
    }

    @Transactional
    @Override
    public List<CategoryRefDTO> saveExpertiseCategories(Integer userId, List<CategoryRefDTO> dtos) {
        Integer trainerId = getRequiredTrainerId(userId);
        expertiseCategoryRepository.deleteByTrainerId(trainerId);
        List<TrainerExpertiseCategory> entities = dtos.stream().map(dto -> {
            TrainerExpertiseCategory entity = trainerMapper.toExpertiseCategoryEntity(dto);
            entity.setTrainerId(trainerId);
            return entity;
        }).toList();
        List<CategoryRefDTO> result = trainerMapper.toExpertiseCategoryDTOList(
                expertiseCategoryRepository.saveAll(entities));
        fillCategoryNames(result);
        return result;
    }

    @Transactional
    @Override
    public List<CategoryRefDTO> saveIndustryCategories(Integer userId, List<CategoryRefDTO> dtos) {
        Integer trainerId = getRequiredTrainerId(userId);
        industryCategoryRepository.deleteByTrainerId(trainerId);
        List<TrainerIndustryCategory> entities = dtos.stream().map(dto -> {
            TrainerIndustryCategory entity = trainerMapper.toIndustryCategoryEntity(dto);
            entity.setTrainerId(trainerId);
            return entity;
        }).toList();
        List<CategoryRefDTO> result = trainerMapper.toIndustryCategoryDTOList(
                industryCategoryRepository.saveAll(entities));
        fillCategoryNames(result);
        return result;
    }

    // ==================== 内部方法 ====================

    /** 获取当前用户的 trainerId，不存在则抛异常 */
    private Integer getRequiredTrainerId(Integer userId) {
        return trainerRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "请先创建专家档案"))
                .getId();
    }

    /** 主表保存或更新 */
    private Trainer saveOrUpdateMainTable(Integer userId, TrainerRequest req) {
        Trainer trainer = trainerRepository.findByUserId(userId).orElseGet(() -> {
            Trainer t = new Trainer();
            t.setUserId(userId);
            return t;
        });

        if (req.getName() != null) trainer.setName(req.getName());
        if (req.getAvatar() != null) trainer.setAvatar(req.getAvatar());
        if (req.getTitle() != null) trainer.setTitle(req.getTitle());
        if (req.getGender() != null) trainer.setGender(req.getGender());
        if (req.getPhone() != null) trainer.setPhone(req.getPhone());
        if (req.getEmail() != null) trainer.setEmail(req.getEmail());
        if (req.getPostCode() != null) trainer.setPostCode(req.getPostCode());
        if (req.getProvinceId() != null) trainer.setProvinceId(req.getProvinceId());
        if (req.getCityId() != null) trainer.setCityId(req.getCityId());
        if (req.getDistrictId() != null) trainer.setDistrictId(req.getDistrictId());
        if (req.getTownId() != null) trainer.setTownId(req.getTownId());
        if (req.getAddress() != null) trainer.setAddress(req.getAddress());
        if (req.getBio() != null) trainer.setBio(req.getBio());
        if (req.getIntro() != null) trainer.setIntro(req.getIntro());
        if (req.getBackground() != null) trainer.setBackground(req.getBackground());
        if (req.getGoodAt() != null) trainer.setGoodAt(req.getGoodAt());
        if (req.getSpecialties() != null) trainer.setSpecialties(req.getSpecialties());
        if (req.getExpertiseTags() != null) trainer.setExpertiseTags(req.getExpertiseTags());
        if (req.getTeachingStyle() != null) trainer.setTeachingStyle(req.getTeachingStyle());
        if (req.getExperienceYears() != null) trainer.setExperienceYears(req.getExperienceYears());
        if (req.getTeachingYears() != null) trainer.setTeachingYears(req.getTeachingYears());
        if (req.getServiceCityIds() != null) trainer.setServiceCityIds(req.getServiceCityIds());
        if (req.getQuoteMin() != null) trainer.setQuoteMin(req.getQuoteMin());
        if (req.getQuoteMax() != null) trainer.setQuoteMax(req.getQuoteMax());
        if (req.getQuoteUnit() != null) trainer.setQuoteUnit(req.getQuoteUnit());
        if (req.getQuoteRemark() != null) trainer.setQuoteRemark(req.getQuoteRemark());
        if (req.getBackgroundImage() != null) trainer.setBackgroundImage(req.getBackgroundImage());

        return trainerRepository.save(trainer);
    }

    /**
     * 组装完整的 TrainerResponse（主表 + 五张子表）
     * <p>分步查询，避免 N+1；分类关联回填 categoryName</p>
     */
    private TrainerResponse assembleFullResponse(Trainer trainer) {
        TrainerResponse response = trainerMapper.toResponse(trainer);
        Integer trainerId = trainer.getId();

        response.setEducations(
                trainerMapper.toEducationDTOList(educationRepository.findByTrainerIdOrderBySortOrder(trainerId)));
        response.setWorkExperiences(
                trainerMapper.toWorkExperienceDTOList(workExperienceRepository.findByTrainerIdOrderBySortOrder(trainerId)));
        response.setHonors(
                trainerMapper.toHonorDTOList(honorRepository.findByTrainerIdOrderBySortOrder(trainerId)));

        List<CategoryRefDTO> expertiseList = trainerMapper.toExpertiseCategoryDTOList(
                expertiseCategoryRepository.findByTrainerIdOrderBySortOrder(trainerId));
        List<CategoryRefDTO> industryList = trainerMapper.toIndustryCategoryDTOList(
                industryCategoryRepository.findByTrainerIdOrderBySortOrder(trainerId));

        // 批量回填分类名称（两种关联合并一次查）
        fillCategoryNames(expertiseList, industryList);

        response.setExpertiseCategories(expertiseList);
        response.setIndustryCategories(industryList);

        return response;
    }

    /** 为公开响应填充子表数据 */
    private void fillSubTableData(TrainerPublicResponse response, Integer trainerId) {
        response.setEducations(
                trainerMapper.toEducationDTOList(educationRepository.findByTrainerIdOrderBySortOrder(trainerId)));
        response.setWorkExperiences(
                trainerMapper.toWorkExperienceDTOList(workExperienceRepository.findByTrainerIdOrderBySortOrder(trainerId)));
        response.setHonors(
                trainerMapper.toHonorDTOList(honorRepository.findByTrainerIdOrderBySortOrder(trainerId)));

        List<CategoryRefDTO> expertiseList = trainerMapper.toExpertiseCategoryDTOList(
                expertiseCategoryRepository.findByTrainerIdOrderBySortOrder(trainerId));
        List<CategoryRefDTO> industryList = trainerMapper.toIndustryCategoryDTOList(
                industryCategoryRepository.findByTrainerIdOrderBySortOrder(trainerId));

        fillCategoryNames(expertiseList, industryList);

        response.setExpertiseCategories(expertiseList);
        response.setIndustryCategories(industryList);
    }

    /** 批量回填多个列表的 categoryName */
    @SafeVarargs
    private void fillCategoryNames(List<CategoryRefDTO>... lists) {
        Set<Integer> allIds = Stream.of(lists)
                .flatMap(Collection::stream)
                .map(CategoryRefDTO::getCategoryId)
                .collect(Collectors.toSet());

        if (allIds.isEmpty()) return;

        Map<Integer, String> nameMap = categoryService.getNameMap(allIds);
        for (List<CategoryRefDTO> list : lists) {
            for (CategoryRefDTO dto : list) {
                dto.setCategoryName(nameMap.get(dto.getCategoryId()));
            }
        }
    }
}
